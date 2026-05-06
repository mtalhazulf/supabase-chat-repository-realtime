"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Sparkles, User, UserCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn, formatTime } from "@/lib/utils";
import type { Conversation, Message } from "@/lib/types";

export function ChatThread({
  tenantId,
  conversation,
  initialMessages,
  currentUserId,
  currentUserName,
}: {
  tenantId: string;
  conversation: Conversation;
  initialMessages: Message[];
  currentUserId: string | null;
  currentUserName: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`conversation:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const content = draft.trim();
    if (!content || sending || !currentUserId) return;
    setSending(true);
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      conversation_id: conversation.id,
      tenant_id: tenantId,
      sender: "human",
      author_id: currentUserId,
      author_name: currentUserName,
      content,
      metadata: {},
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");

    try {
      const res = await fetch("/api/agent/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          tenantId,
          content,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { message } = (await res.json()) as { message: Message };
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? message : m)));
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      alert(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      <header className="flex items-center gap-3 border-b border-gray-200 px-6 py-3">
        <Link
          href={`/dashboard/${tenantId}/conversations`}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-gray-900">
            {conversation.visitor_name ||
              conversation.visitor_email ||
              `Visitor ${conversation.visitor_id.slice(0, 8)}`}
          </div>
          {conversation.visitor_email && (
            <div className="truncate text-xs text-gray-500">{conversation.visitor_email}</div>
          )}
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs",
            conversation.status === "open"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-gray-100 text-gray-600",
          )}
        >
          {conversation.status}
        </span>
      </header>

      <div ref={scrollRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Reply as agent…"
            rows={2}
            className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={send}
            disabled={!draft.trim() || sending}
            className="flex items-center gap-1.5 self-end rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isAgent = message.sender === "human";
  const isAi = message.sender === "ai";

  return (
    <div className={cn("flex gap-3", isAgent ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full",
          isAgent
            ? "bg-indigo-600 text-white"
            : isAi
              ? "bg-violet-100 text-violet-700"
              : "bg-gray-200 text-gray-700",
        )}
      >
        {isAgent ? (
          <UserCircle2 className="h-4 w-4" />
        ) : isAi ? (
          <Sparkles className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>
      <div className={cn("max-w-[75%]", isAgent ? "text-right" : "text-left")}>
        <div
          className={cn(
            "inline-block whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm",
            isAgent
              ? "bg-indigo-600 text-white"
              : isAi
                ? "bg-violet-50 text-gray-900 ring-1 ring-violet-100"
                : "bg-gray-100 text-gray-900",
          )}
        >
          {message.content}
        </div>
        <div className="mt-1 text-[11px] text-gray-500">
          {message.author_name || message.sender} · {formatTime(message.created_at)}
        </div>
      </div>
    </div>
  );
}
