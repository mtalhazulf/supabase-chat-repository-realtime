import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fromZod, jsonError } from "@/lib/api";
import type { Tenant } from "@/lib/types";

export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().regex(/^[a-z0-9-]{2,40}$/),
});

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return jsonError(401, "unauthorized");

  let body;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    return fromZod(err);
  }

  const { data, error } = await supabase
    .from("tenants")
    .insert({ name: body.name, slug: body.slug, owner_id: user.id })
    .select("*")
    .single<Tenant>();

  if (error || !data) {
    const status = error?.code === "23505" ? 409 : 500;
    return jsonError(status, error?.code === "23505" ? "slug_taken" : "create_failed", error?.message);
  }
  return NextResponse.json({ tenant: data }, { status: 201 });
}
