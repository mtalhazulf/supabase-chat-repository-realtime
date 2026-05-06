import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Message } from "@/lib/types";

export const conversationChannel = (conversationId: string) => `conv:${conversationId}`;
export const NEW_MESSAGE_EVENT = "message";

/**
 * Broadcast a message to a conversation channel from the server.
 * Anonymous widget clients can subscribe to broadcast channels without RLS.
 */
export async function broadcastMessage(message: Message): Promise<void> {
  const client = createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 5 } },
  });
  const channel = client.channel(conversationChannel(message.conversation_id), {
    config: { broadcast: { self: false, ack: false } },
  });
  await new Promise<void>((resolve) => {
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") resolve();
    });
    setTimeout(resolve, 1500);
  });
  await channel.send({ type: "broadcast", event: NEW_MESSAGE_EVENT, payload: message });
  await client.removeChannel(channel);
}
