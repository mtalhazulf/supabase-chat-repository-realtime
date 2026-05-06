"use client";

import { useState } from "react";
import { Sparkles, User } from "lucide-react";
import { cn, getReadableTextColor } from "@/lib/utils";
import { useUpdateConfig } from "@/lib/queries";
import { ApiError } from "@/lib/api-client";
import type { ChatbotConfig } from "@/lib/types";

const MODELS = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3.5-haiku",
  "anthropic/claude-3.5-sonnet",
  "google/gemini-2.0-flash-001",
  "meta-llama/llama-3.3-70b-instruct",
];

export function CustomizeForm({ initial }: { initial: ChatbotConfig }) {
  const [config, setConfig] = useState<ChatbotConfig>(initial);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const update = <K extends keyof ChatbotConfig>(key: K, value: ChatbotConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const mutation = useUpdateConfig(config.tenant_id);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const { tenant_id, updated_at, ...patch } = config;
    void tenant_id;
    void updated_at;
    mutation.mutate(patch, { onSuccess: () => setSavedAt(new Date()) });
  }

  const error = mutation.error instanceof ApiError ? mutation.error.code : null;
  const saving = mutation.isPending;

  return (
    <form onSubmit={save} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Section title="Branding">
          <Field label="Bot name">
            <input
              value={config.bot_name}
              onChange={(e) => update("bot_name", e.target.value)}
              className="input"
            />
          </Field>
          <Field label="Welcome message">
            <textarea
              rows={2}
              value={config.welcome_message}
              onChange={(e) => update("welcome_message", e.target.value)}
              className="input"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary color">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.primary_color}
                  onChange={(e) => update("primary_color", e.target.value)}
                  className="h-9 w-10 rounded border border-gray-300"
                />
                <input
                  value={config.primary_color}
                  onChange={(e) => update("primary_color", e.target.value)}
                  className="input flex-1 font-mono text-sm"
                />
              </div>
            </Field>
            <Field label="Position">
              <select
                value={config.position}
                onChange={(e) => update("position", e.target.value as "left" | "right")}
                className="input"
              >
                <option value="right">Bottom right</option>
                <option value="left">Bottom left</option>
              </select>
            </Field>
          </div>
          <Field label="Avatar URL (optional)">
            <input
              value={config.avatar_url ?? ""}
              onChange={(e) => update("avatar_url", e.target.value || null)}
              placeholder="https://…/logo.png"
              className="input"
            />
          </Field>
        </Section>

        <Section title="Lead capture">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.collect_lead}
              onChange={(e) => update("collect_lead", e.target.checked)}
            />
            Ask visitor for contact details before chat
          </label>
          {config.collect_lead && (
            <div className="flex flex-wrap gap-2">
              {(["name", "email", "phone"] as const).map((f) => {
                const enabled = (config.lead_fields as string[]).includes(f);
                return (
                  <button
                    type="button"
                    key={f}
                    onClick={() => {
                      const next = enabled
                        ? (config.lead_fields as string[]).filter((x) => x !== f)
                        : [...(config.lead_fields as string[]), f];
                      update("lead_fields", next);
                    }}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs",
                      enabled
                        ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                        : "border-gray-300 text-gray-600",
                    )}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        <Section title="AI assistant (OpenRouter)">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.ai_enabled}
              onChange={(e) => update("ai_enabled", e.target.checked)}
            />
            Auto-reply with AI when no agent is online
          </label>
          <Field label="Model">
            <select
              value={config.ai_model}
              onChange={(e) => update("ai_model", e.target.value)}
              className="input"
            >
              {MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="System prompt">
            <textarea
              rows={5}
              value={config.ai_system_prompt}
              onChange={(e) => update("ai_system_prompt", e.target.value)}
              className="input font-mono text-xs"
            />
          </Field>
        </Section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {savedAt && (
            <span className="text-xs text-emerald-600">Saved at {savedAt.toLocaleTimeString()}</span>
          )}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>

      <Preview config={config} />

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(209 213 219);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        :global(.input:focus) {
          outline: none;
          border-color: rgb(99 102 241);
        }
      `}</style>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4">
      <legend className="px-1 text-sm font-semibold text-gray-900">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function Preview({ config }: { config: ChatbotConfig }) {
  const fg = getReadableTextColor(config.primary_color);
  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ background: config.primary_color, color: fg }}
        >
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/20">
            {config.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.avatar_url} alt="" className="h-8 w-8 object-cover" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </div>
          <div>
            <div className="text-sm font-semibold">{config.bot_name}</div>
            <div className="text-[11px] opacity-80">We typically reply in a few minutes</div>
          </div>
        </div>
        <div className="space-y-3 bg-gray-50 px-4 py-4">
          <div className="flex items-start gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="max-w-[80%] rounded-2xl bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-gray-100">
              {config.welcome_message}
            </div>
          </div>
          <div className="flex flex-row-reverse items-start gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{ background: config.primary_color, color: fg }}
            >
              <User className="h-3.5 w-3.5" />
            </div>
            <div
              className="max-w-[80%] rounded-2xl px-3 py-2 text-sm"
              style={{ background: config.primary_color, color: fg }}
            >
              Hey, can you help me?
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 p-3">
          <input
            disabled
            placeholder="Type your message…"
            className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-gray-500">Live preview</p>
    </aside>
  );
}
