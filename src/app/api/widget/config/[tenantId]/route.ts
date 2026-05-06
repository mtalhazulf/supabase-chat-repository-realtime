import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ChatbotConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("chatbot_configs")
    .select("*")
    .eq("tenant_id", tenantId)
    .single<ChatbotConfig>();

  if (error || !data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=60" } });
}
