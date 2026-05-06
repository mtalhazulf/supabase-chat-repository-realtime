import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { WidgetApp } from "./WidgetApp";
import type { ChatbotConfig } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function WidgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ embedded?: string }>;
}) {
  const { tenantId } = await params;
  const { embedded } = await searchParams;
  const supabase = createSupabaseAdminClient();
  const { data: config } = await supabase
    .from("chatbot_configs")
    .select("*")
    .eq("tenant_id", tenantId)
    .single<ChatbotConfig>();

  if (!config) notFound();

  return <WidgetApp tenantId={tenantId} config={config} embedded={embedded === "1"} />;
}
