"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Tenant } from "@/lib/types";

export function CreateTenantForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function deriveSlug(v: string) {
    return v
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const finalSlug = slug || deriveSlug(name);

    const res = await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug: finalSlug }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(humanizeError(data.error));
      return;
    }
    const { tenant } = (await res.json()) as { tenant: Tenant };

    startTransition(() => {
      router.push(`/dashboard/${tenant.id}/conversations`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
      <input
        required
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (!slug) setSlug(deriveSlug(e.target.value));
        }}
        placeholder="Acme Inc."
        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
      <input
        required
        value={slug}
        onChange={(e) => setSlug(deriveSlug(e.target.value))}
        placeholder="acme"
        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-mono"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create"}
      </button>
      {error && <p className="sm:col-span-3 text-sm text-red-600">{error}</p>}
    </form>
  );
}

function humanizeError(code?: string) {
  switch (code) {
    case "slug_taken":
      return "That slug is already in use. Try another.";
    case "unauthorized":
      return "You need to sign in.";
    case "invalid_body":
      return "Name or slug is invalid.";
    default:
      return "Could not create the workspace.";
  }
}
