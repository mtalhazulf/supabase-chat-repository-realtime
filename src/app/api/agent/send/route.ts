import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { broadcastMessage } from "@/lib/broadcast";
import type { Message } from "@/lib/types";

export const dynamic = "force-dynamic";

const Body = z.object({
  conversationId: z.string().uuid(),
  tenantId: z.string().uuid(),
  content: z.string().min(1).max(8000),
});

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    return NextResponse.json({ error: "invalid_body", detail: String(err) }, { status: 400 });
  }

  // RLS guarantees only members can insert (and we set sender=human, author_id=user)
  const { data: msg, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: body.conversationId,
      tenant_id: body.tenantId,
      sender: "human",
      author_id: user.id,
      author_name: user.email ?? "Agent",
      content: body.content,
    })
    .select("*")
    .single<Message>();

  if (error || !msg) {
    return NextResponse.json({ error: error?.message ?? "insert_failed" }, { status: 500 });
  }

  void broadcastMessage(msg);
  return NextResponse.json({ message: msg });
}
