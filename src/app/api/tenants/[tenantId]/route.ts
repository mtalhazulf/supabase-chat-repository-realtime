import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fromZod, jsonError } from "@/lib/api";
import type { Tenant } from "@/lib/types";

export const dynamic = "force-dynamic";

const PatchBody = z.object({
  name: z.string().min(1).max(120).optional(),
  slug: z.string().regex(/^[a-z0-9-]{2,40}$/).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError(401, "unauthorized");

  let body;
  try {
    body = PatchBody.parse(await req.json());
  } catch (err) {
    return fromZod(err);
  }

  // RLS restricts UPDATE to the owner.
  const { data, error } = await supabase
    .from("tenants")
    .update(body)
    .eq("id", tenantId)
    .select("*")
    .single<Tenant>();

  if (error || !data) {
    const status = error?.code === "23505" ? 409 : 500;
    return jsonError(status, error?.code === "23505" ? "slug_taken" : "update_failed", error?.message);
  }
  return NextResponse.json({ tenant: data });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ tenantId: string }> },
) {
  const { tenantId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError(401, "unauthorized");

  // RLS restricts DELETE to the owner.
  const { error } = await supabase.from("tenants").delete().eq("id", tenantId);
  if (error) return jsonError(500, "delete_failed", error.message);
  return NextResponse.json({ ok: true });
}
