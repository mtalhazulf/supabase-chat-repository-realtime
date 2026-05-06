"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

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
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setError("Not signed in.");

    const finalSlug = slug || deriveSlug(name);
    const { data, error } = await supabase
      .from("tenants")
      .insert({ name, slug: finalSlug, owner_id: user.id })
      .select()
      .single();

    if (error) return setError(error.message);

    startTransition(() => {
      router.push(`/dashboard/${data.id}/conversations`);
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
