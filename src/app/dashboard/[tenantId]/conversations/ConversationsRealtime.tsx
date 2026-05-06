"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Conversation } from "@/lib/types";

export function ConversationsRealtime({
  tenantId,
  initial,
  children,
}: {
  tenantId: string;
  initial: Conversation[];
  children: (rows: Conversation[]) => React.ReactNode;
}) {
  const [rows, setRows] = useState<Conversation[]>(initial);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`tenant:${tenantId}:conversations`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `tenant_id=eq.${tenantId}` },
        (payload) => {
          setRows((prev) => {
            if (payload.eventType === "INSERT") {
              const next = [payload.new as Conversation, ...prev.filter((c) => c.id !== (payload.new as Conversation).id)];
              return sortByLast(next);
            }
            if (payload.eventType === "UPDATE") {
              const updated = payload.new as Conversation;
              return sortByLast(prev.map((c) => (c.id === updated.id ? updated : c)));
            }
            if (payload.eventType === "DELETE") {
              const old = payload.old as Conversation;
              return prev.filter((c) => c.id !== old.id);
            }
            return prev;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  return <>{children(rows)}</>;
}

function sortByLast(rows: Conversation[]) {
  return [...rows].sort(
    (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
  );
}
