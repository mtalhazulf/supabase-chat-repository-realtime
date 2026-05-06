import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateTenantForm } from "./CreateTenantForm";
import { Building2, ArrowRight } from "lucide-react";
import type { Tenant } from "@/lib/types";

export default async function DashboardIndex() {
  const supabase = await createSupabaseServerClient();
  const { data: tenants } = await supabase
    .from("tenants")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Tenant[]>();

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Workspaces</h1>
          <p className="mt-1 text-sm text-gray-600">Pick a workspace or create a new one.</p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(tenants ?? []).map((t) => (
          <Link
            key={t.id}
            href={`/dashboard/${t.id}/conversations`}
            className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Building2 className="h-6 w-6 text-indigo-600" />
              <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
            </div>
            <div className="mt-4 font-medium text-gray-900">{t.name}</div>
            <div className="text-xs text-gray-500">/{t.slug}</div>
          </Link>
        ))}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Create a workspace</h2>
        <p className="mt-1 text-sm text-gray-600">
          Each workspace has its own chatbot, conversations, branding, and members.
        </p>
        <CreateTenantForm />
      </section>
    </div>
  );
}
