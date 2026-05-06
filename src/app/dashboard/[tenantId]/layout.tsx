import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MessagesSquare, Palette, Code2, Settings } from "lucide-react";
import type { Tenant } from "@/lib/types";

export default async function TenantLayout({
  params,
  children,
}: {
  params: Promise<{ tenantId: string }>;
  children: React.ReactNode;
}) {
  const { tenantId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single<Tenant>();

  if (!tenant) notFound();

  const nav = [
    { href: `/dashboard/${tenantId}/conversations`, label: "Conversations", icon: MessagesSquare },
    { href: `/dashboard/${tenantId}/customize`, label: "Customize", icon: Palette },
    { href: `/dashboard/${tenantId}/embed`, label: "Embed", icon: Code2 },
    { href: `/dashboard/${tenantId}/settings`, label: "Settings", icon: Settings },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-1">
        <div className="mb-4 px-2">
          <Link href="/dashboard" className="text-xs uppercase tracking-wide text-gray-500 hover:text-gray-700">
            ← All workspaces
          </Link>
          <div className="mt-2 truncate font-semibold text-gray-900">{tenant.name}</div>
          <div className="font-mono text-xs text-gray-500">/{tenant.slug}</div>
        </div>
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </aside>
      <section className="min-h-[60vh] rounded-xl border border-gray-200 bg-white">{children}</section>
    </div>
  );
}
