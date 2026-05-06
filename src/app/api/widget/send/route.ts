import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { generateAiReply } from "@/lib/openrouter";
import { broadcastMessage } from "@/lib/broadcast";
import type { ChatbotConfig, Conversation, Message } from "@/lib/types";

export const dynamic = "force-dynamic";

const Body = z.object({
  tenantId: z.string().uuid(),
  visitorId: z.string().min(1).max(128),
  conversationId: z.string().uuid().nullable().optional(),
  content: z.string().min(1).max(8000),
  lead: z
    .object({
      name: z.string().max(120).optional(),
      email: z.string().email().max(200).optional(),
      phone: z.string().max(40).optional(),
    })
    .partial()
    .optional(),
});

export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "invalid_body", detail: String(err) }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();

  // Ensure conversation exists / find by (tenant, visitor)
  let conversation: Conversation | null = null;
  if (body.conversationId) {
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", body.conversationId)
      .eq("tenant_id", body.tenantId)
      .single<Conversation>();
    conversation = data ?? null;
  }
  if (!conversation) {
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .eq("tenant_id", body.tenantId)
      .eq("visitor_id", body.visitorId)
      .maybeSingle<Conversation>();
    conversation = existing ?? null;
  }
  if (!conversation) {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({
        tenant_id: body.tenantId,
        visitor_id: body.visitorId,
        visitor_name: body.lead?.name ?? null,
        visitor_email: body.lead?.email ?? null,
      })
      .select("*")
      .single<Conversation>();
    if (error || !created) {
      return NextResponse.json({ error: error?.message ?? "create_failed" }, { status: 500 });
    }
    conversation = created;
  } else if (body.lead && (body.lead.name || body.lead.email)) {
    await supabase
      .from("conversations")
      .update({
        visitor_name: body.lead.name ?? conversation.visitor_name,
        visitor_email: body.lead.email ?? conversation.visitor_email,
      })
      .eq("id", conversation.id);
  }

  // Insert visitor message
  const { data: inserted, error: insertErr } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversation.id,
      tenant_id: body.tenantId,
      sender: "lead",
      author_name: body.lead?.name ?? null,
      content: body.content,
      metadata: body.lead ?? {},
    })
    .select("*")
    .single<Message>();
  if (insertErr || !inserted) {
    return NextResponse.json({ error: insertErr?.message ?? "insert_failed" }, { status: 500 });
  }

  // Broadcast so visitor (and any anon listeners) receive realtime updates.
  void broadcastMessage(inserted);

  // AI auto-reply (fire-and-forget; broadcasts when ready)
  void scheduleAiReply(conversation.id, body.tenantId);

  return NextResponse.json({ conversationId: conversation.id, message: inserted });
}

async function scheduleAiReply(conversationId: string, tenantId: string) {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: config } = await supabase
      .from("chatbot_configs")
      .select("*")
      .eq("tenant_id", tenantId)
      .single<ChatbotConfig>();
    if (!config?.ai_enabled) return;

    const { data: history } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(40)
      .returns<Message[]>();

    if (!history?.length) return;

    const reply = await generateAiReply({
      systemPrompt: config.ai_system_prompt,
      model: config.ai_model,
      messages: history.map((m) => ({
        role: m.sender === "lead" ? "user" : m.sender === "ai" ? "assistant" : "user",
        name: m.sender,
        content: m.content,
      })),
    });

    if (!reply) return;

    const { data: aiMsg } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        tenant_id: tenantId,
        sender: "ai",
        author_name: config.bot_name,
        content: reply,
        metadata: { model: config.ai_model },
      })
      .select("*")
      .single<Message>();
    if (aiMsg) await broadcastMessage(aiMsg);
  } catch (err) {
    console.error("AI reply failed:", err);
  }
}
