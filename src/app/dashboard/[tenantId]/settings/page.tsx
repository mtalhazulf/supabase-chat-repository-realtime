import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";
import type { Tenant, TenantMember } from "@/lib/types";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single<Tenant>();
  if (!tenant) notFound();

  const { data: members } = await supabase
    .from("tenant_members")
    .select("*")
    .eq("tenant_id", tenantId)
    .returns<TenantMember[]>();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="space-y-6 p-6">
      <header>
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-600">Workspace name, slug, and members.</p>
      </header>
      <SettingsForm
        tenant={tenant}
        members={members ?? []}
        currentUserId={user?.id ?? null}
      />
    </div>
  );
}
