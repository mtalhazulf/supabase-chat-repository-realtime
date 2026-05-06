import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CustomizeForm } from "./CustomizeForm";
import type { ChatbotConfig } from "@/lib/types";

export default async function CustomizePage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: config } = await supabase
    .from("chatbot_configs")
    .select("*")
    .eq("tenant_id", tenantId)
    .single<ChatbotConfig>();

  if (!config) notFound();

  return (
    <div className="p-6">
      <header className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Customize chatbot</h2>
        <p className="text-sm text-gray-600">
          Branding, behavior, and AI configuration. Changes apply instantly to embedded widgets.
        </p>
      </header>
      <CustomizeForm initial={config} />
    </div>
  );
}
