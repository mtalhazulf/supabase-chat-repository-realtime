import { serverEnv } from "@/lib/env";

type ChatMessage = { role: "system" | "user" | "assistant"; name?: string; content: string };

type Args = {
  systemPrompt: string;
  model: string;
  messages: ChatMessage[];
};

export async function generateAiReply({ systemPrompt, model, messages }: Args): Promise<string | null> {
  const apiKey = serverEnv.openRouterKey();
  if (!apiKey) return null;

  const trimmed = messages.slice(-20).map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Realtime Chat",
    },
    body: JSON.stringify({
      model: model || serverEnv.openRouterModel(),
      messages: [{ role: "system", content: systemPrompt }, ...trimmed],
      temperature: 0.4,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    console.error("OpenRouter error", res.status, await res.text());
    return null;
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? null;
}
