import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ConversationsRealtime } from "./ConversationsRealtime";
import type { Conversation } from "@/lib/types";

export default async function ConversationsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("conversations")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("last_message_at", { ascending: false })
    .limit(100)
    .returns<Conversation[]>();

  return (
    <div className="p-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Conversations</h2>
          <p className="text-sm text-gray-600">Live inbox of every visitor chat.</p>
        </div>
      </header>

      <ConversationsRealtime tenantId={tenantId} initial={data ?? []}>
        {(rows) =>
          rows.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
              No conversations yet. Once a visitor opens your chat widget, you&apos;ll see them here in real time.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
              {rows.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/${tenantId}/conversations/${c.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium text-gray-900">
                        {c.visitor_name || c.visitor_email || `Visitor ${c.visitor_id.slice(0, 8)}`}
                      </div>
                      {c.visitor_email && (
                        <div className="truncate text-xs text-gray-500">{c.visitor_email}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span
                        className={
                          c.status === "open"
                            ? "rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700"
                            : "rounded-full bg-gray-100 px-2 py-0.5 text-gray-600"
                        }
                      >
                        {c.status}
                      </span>
                      <span>{new Date(c.last_message_at).toLocaleString()}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )
        }
      </ConversationsRealtime>
    </div>
  );
}
