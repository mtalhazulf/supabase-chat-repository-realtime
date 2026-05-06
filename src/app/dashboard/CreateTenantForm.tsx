"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { useCreateTenant } from "@/lib/queries";

export function CreateTenantForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [pending, startTransition] = useTransition();

  const create = useCreateTenant();

  function deriveSlug(v: string) {
    return v
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const finalSlug = slug || deriveSlug(name);
    create.mutate(
      { name, slug: finalSlug },
      {
        onSuccess: ({ tenant }) =>
          startTransition(() => {
            router.push(`/dashboard/${tenant.id}/conversations`);
            router.refresh();
          }),
      },
    );
  }

  const error = create.error instanceof ApiError ? humanize(create.error.code) : null;
  const busy = create.isPending || pending;

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
        disabled={busy}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {busy ? "Creating…" : "Create"}
      </button>
      {error && <p className="sm:col-span-3 text-sm text-red-600">{error}</p>}
    </form>
  );
}

function humanize(code: string) {
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
