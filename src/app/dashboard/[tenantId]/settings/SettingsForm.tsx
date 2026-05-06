"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeleteTenant, useUpdateTenant } from "@/lib/queries";
import { ApiError } from "@/lib/api-client";
import type { Tenant, TenantMember } from "@/lib/types";

export function SettingsForm({
  tenant,
  members,
  currentUserId,
}: {
  tenant: Tenant;
  members: TenantMember[];
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(tenant.name);
  const [slug, setSlug] = useState(tenant.slug);
  const [info, setInfo] = useState<string | null>(null);

  const update = useUpdateTenant(tenant.id);
  const remove = useDeleteTenant(tenant.id);

  const isOwner = tenant.owner_id === currentUserId;

  function save(e: React.FormEvent) {
    e.preventDefault();
    setInfo(null);
    update.mutate(
      { name, slug },
      {
        onSuccess: () => {
          setInfo("Saved.");
          router.refresh();
        },
      },
    );
  }

  function onRemove() {
    if (!confirm("Delete this workspace? This cannot be undone.")) return;
    remove.mutate(undefined, {
      onSuccess: () => {
        router.replace("/dashboard");
        router.refresh();
      },
    });
  }

  const updateError = update.error instanceof ApiError ? update.error.code : null;
  const deleteError = remove.error instanceof ApiError ? remove.error.code : null;

  return (
    <div className="space-y-8">
      <form onSubmit={save} className="grid gap-3 rounded-lg border border-gray-200 p-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">Workspace name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            disabled={!isOwner}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-700">Slug</span>
          <input
            value={slug}
            onChange={(e) =>
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
            }
            className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
            disabled={!isOwner}
          />
        </label>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={update.isPending || !isOwner}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {update.isPending ? "Saving…" : "Save"}
          </button>
          {info && <span className="text-xs text-emerald-600">{info}</span>}
          {updateError && (
            <span className="text-xs text-red-600">
              {updateError === "slug_taken" ? "That slug is already in use." : "Could not save."}
            </span>
          )}
        </div>
      </form>

      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900">Members</h3>
        <ul className="mt-3 divide-y divide-gray-200">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between py-2 text-sm">
              <span className="font-mono text-xs text-gray-500">{m.user_id.slice(0, 8)}…</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{m.role}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-500">
          Member invitations require server-side email logic — wire to your email provider when ready.
        </p>
      </div>

      {isOwner && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="text-sm font-semibold text-red-900">Danger zone</h3>
          <p className="mt-1 text-xs text-red-800">Deleting removes all conversations and messages.</p>
          <button
            type="button"
            onClick={onRemove}
            disabled={remove.isPending}
            className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {remove.isPending ? "Deleting…" : "Delete workspace"}
          </button>
          {deleteError && <p className="mt-2 text-xs text-red-700">{deleteError}</p>}
        </div>
      )}
    </div>
  );
}
