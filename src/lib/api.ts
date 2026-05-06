/**
 * Shared helpers for backend API route handlers.
 *
 * Conventions:
 *  - All mutating endpoints are POST/PATCH/DELETE
 *  - Authenticated routes use the Supabase server client and rely on RLS
 *    helpers (`is_tenant_member`, `is_tenant_admin`) for authorization
 *  - Validation uses zod
 */
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(status: number, code: string, detail?: unknown) {
  return NextResponse.json({ error: code, detail }, { status });
}

export function fromZod(err: unknown) {
  if (err instanceof ZodError) {
    return jsonError(400, "invalid_body", err.flatten());
  }
  return jsonError(400, "invalid_body", String(err));
}
