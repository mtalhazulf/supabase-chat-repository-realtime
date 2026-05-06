import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChatThread } from "./ChatThread";
import type { Conversation, Message } from "@/lib/types";

export default async function ConversationDetail({
  params,
}: {
  params: Promise<{ tenantId: string; id: string }>;
}) {
  const { tenantId, id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .single<Conversation>();

  if (!conversation) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .returns<Message[]>();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ChatThread
      tenantId={tenantId}
      conversation={conversation}
      initialMessages={messages ?? []}
      currentUserId={user?.id ?? null}
      currentUserName={user?.email ?? "Agent"}
    />
  );
}
