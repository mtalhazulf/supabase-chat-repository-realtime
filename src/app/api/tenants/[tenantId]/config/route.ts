import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fromZod, jsonError } from "@/lib/api";
import type { ChatbotConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

const HEX = /^#[0-9a-fA-F]{6}$/;
const LEAD_FIELDS = ["name", "email", "phone"] as const;

const PatchBody = z
  .object({
    bot_name: z.string().min(1).max(80).optional(),
    welcome_message: z.string().min(1).max(500).optional(),
    primary_color: z.string().regex(HEX).optional(),
    text_color: z.string().regex(HEX).optional(),
    position: z.enum(["left", "right"]).optional(),
    avatar_url: z.string().url().max(500).nullable().optional(),
    ai_enabled: z.boolean().optional(),
    ai_model: z.string().min(1).max(120).optional(),
    ai_system_prompt: z.string().min(1).max(8000).optional(),
    collect_lead: z.boolean().optional(),
    lead_fields: z.array(z.enum(LEAD_FIELDS)).optional(),
  })
  .strict();

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError(401, "unauthorized");

  let body;
  try {
    body = PatchBody.parse(await req.json());
  } catch (err) {
    return fromZod(err);
  }

  // RLS limits UPDATE to admins/owners (`is_tenant_admin`).
  const { data, error } = await supabase
    .from("chatbot_configs")
    .update(body)
    .eq("tenant_id", tenantId)
    .select("*")
    .single<ChatbotConfig>();

  if (error || !data) {
    return jsonError(500, "update_failed", error?.message);
  }
  return NextResponse.json({ config: data });
}
