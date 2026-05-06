"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, User, Send, X, MessageCircle } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { conversationChannel, NEW_MESSAGE_EVENT } from "@/lib/broadcast";
import { cn, formatTime, getReadableTextColor } from "@/lib/utils";
import type { ChatbotConfig, Message } from "@/lib/types";

const VISITOR_KEY = "rt-chat-visitor-id";
const CONV_KEY = (tenantId: string) => `rt-chat-conv:${tenantId}`;

function getVisitorId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

type LeadInfo = { name?: string; email?: string; phone?: string };

export function WidgetApp({
  tenantId,
  config,
  embedded = false,
}: {
  tenantId: string;
  config: ChatbotConfig;
  embedded?: boolean;
}) {
  const fg = getReadableTextColor(config.primary_color);
  const [open, setOpen] = useState(embedded);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(!config.collect_lead);
  const [lead, setLead] = useState<LeadInfo>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const visitorId = useRef<string>("");

  useEffect(() => {
    visitorId.current = getVisitorId();
    const existing = localStorage.getItem(CONV_KEY(tenantId));
    if (existing) setConversationId(existing);
  }, [tenantId]);

  useEffect(() => {
    if (!conversationId) return;
    const supabase = createSupabaseBrowserClient();

    (async () => {
      const res = await fetch(`/api/widget/messages?conversationId=${conversationId}`);
      if (res.ok) {
        const data = (await res.json()) as { messages: Message[] };
        setMessages(data.messages);
      }
    })();

    // Anon clients can't pass RLS for postgres_changes, so we use broadcast.
    const channel = supabase
      .channel(conversationChannel(conversationId))
      .on("broadcast", { event: NEW_MESSAGE_EVENT }, (payload) => {
        const msg = payload.payload as Message;
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, open]);

  async function send() {
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setDraft("");

    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      conversation_id: conversationId ?? "",
      tenant_id: tenantId,
      sender: "lead",
      author_id: null,
      author_name: lead.name ?? null,
      content,
      metadata: {},
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch("/api/widget/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId,
          visitorId: visitorId.current,
          conversationId,
          content,
          lead: leadCaptured ? lead : undefined,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { conversationId: string; message: Message };
      if (!conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem(CONV_KEY(tenantId), data.conversationId);
      }
      // Swap optimistic with persisted message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? data.message : m)),
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (config.lead_fields.includes("name") && !lead.name) return;
    if (config.lead_fields.includes("email") && !lead.email) return;
    setLeadCaptured(true);
  }

  const showWelcome = messages.length === 0;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[2147483647] font-sans",
        embedded && "static",
      )}
      style={{ ["--brand" as string]: config.primary_color, ["--brand-fg" as string]: fg }}
    >
      {/* Floating button */}
      {!embedded && (
        <button
          aria-label={open ? "Close chat" : "Open chat"}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "pointer-events-auto absolute bottom-5 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition hover:scale-105",
            config.position === "left" ? "left-5" : "right-5",
          )}
          style={{ background: config.primary_color, color: fg }}
        >
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </button>
      )}

      {/* Chat panel */}
      {(open || embedded) && (
        <div
          className={cn(
            "pointer-events-auto flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-slide-up",
            embedded
              ? "h-screen w-full rounded-none shadow-none ring-0"
              : "absolute bottom-24 h-[600px] w-[380px] max-h-[80vh]",
            !embedded && (config.position === "left" ? "left-5" : "right-5"),
          )}
        >
          <header
            className="flex items-center gap-3 px-4 py-3"
            style={{ background: config.primary_color, color: fg }}
          >
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/20">
              {config.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={config.avatar_url} alt="" className="h-9 w-9 object-cover" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{config.bot_name}</div>
              <div className="text-[11px] opacity-80">Online · we typically reply quickly</div>
            </div>
            {!embedded && (
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </header>

          <div ref={scrollRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4">
            {showWelcome && (
              <Bubble sender="ai" content={config.welcome_message} brand={config.primary_color} fg={fg} />
            )}
            {messages.map((m) => (
              <Bubble
                key={m.id}
                sender={m.sender}
                content={m.content}
                time={m.created_at}
                authorName={m.author_name}
                brand={config.primary_color}
                fg={fg}
              />
            ))}
          </div>

          {!leadCaptured ? (
            <form onSubmit={submitLead} className="space-y-2 border-t border-gray-200 p-3">
              <p className="text-xs text-gray-600">Tell us a bit about yourself to start the chat.</p>
              {config.lead_fields.includes("name") && (
                <input
                  required
                  value={lead.name ?? ""}
                  onChange={(e) => setLead({ ...lead, name: e.target.value })}
                  placeholder="Your name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              )}
              {config.lead_fields.includes("email") && (
                <input
                  required
                  type="email"
                  value={lead.email ?? ""}
                  onChange={(e) => setLead({ ...lead, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              )}
              {config.lead_fields.includes("phone") && (
                <input
                  type="tel"
                  value={lead.phone ?? ""}
                  onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                  placeholder="Phone (optional)"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              )}
              <button
                type="submit"
                className="w-full rounded-md py-2 text-sm font-medium"
                style={{ background: config.primary_color, color: fg }}
              >
                Start chat
              </button>
            </form>
          ) : (
            <div className="border-t border-gray-200 p-3">
              <div className="flex gap-2">
                <textarea
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Type your message…"
                  className="flex-1 resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={send}
                  disabled={!draft.trim() || sending}
                  className="flex items-center justify-center rounded-md px-3 disabled:opacity-60"
                  style={{ background: config.primary_color, color: fg }}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Bubble({
  sender,
  content,
  time,
  authorName,
  brand,
  fg,
}: {
  sender: Message["sender"];
  content: string;
  time?: string;
  authorName?: string | null;
  brand: string;
  fg: string;
}) {
  const isVisitor = sender === "lead";
  const isAi = sender === "ai";

  return (
    <div className={cn("flex gap-2", isVisitor ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full",
          isAi ? "bg-violet-100 text-violet-700" : isVisitor ? "" : "bg-gray-200 text-gray-700",
        )}
        style={isVisitor ? { background: brand, color: fg } : undefined}
      >
        {isAi ? <Sparkles className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
      </div>
      <div className={cn("max-w-[80%]", isVisitor ? "text-right" : "text-left")}>
        <div
          className="inline-block whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow-sm"
          style={
            isVisitor
              ? { background: brand, color: fg }
              : { background: "white", color: "#111827" }
          }
        >
          {content}
        </div>
        {time && (
          <div className="mt-0.5 text-[10px] text-gray-400">
            {authorName ? `${authorName} · ` : ""}
            {formatTime(time)}
          </div>
        )}
      </div>
    </div>
  );
}
