/* ──────────────────────────────────────────────────────────────
   Server-only helpers for the /api route handlers.

   Every route talks to Supabase through the service-role client,
   which bypasses RLS. Authorization is therefore OUR responsibility
   here: public routes validate their own input, and admin routes
   call requireAdmin() before touching anything.
   ────────────────────────────────────────────────────────────── */

import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let cached: SupabaseClient | null = null;

/** Service-role client. Throws loudly if the server is misconfigured. */
export function admin(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase server env missing: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  if (!cached) {
    cached = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}

/* ── Responses ─────────────────────────────────────────────── */

export function ok(data: unknown = { ok: true }, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Wraps a handler so thrown errors become a clean 500 instead of a crash. */
export function guard(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  return handler().catch((err) => {
    console.error("[api]", err);
    const message =
      err instanceof Error ? err.message : "Unexpected server error.";
    return fail(message, 500);
  });
}

/* ── Auth ──────────────────────────────────────────────────── */

function bearer(req: Request): string | null {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export interface AuthedUser {
  id: string;
  email: string | null;
  role: "customer" | "admin";
}

/** Resolves the caller from their bearer token, or null if unauthenticated. */
export async function currentUser(req: Request): Promise<AuthedUser | null> {
  const token = bearer(req);
  if (!token) return null;

  const db = admin();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: profile } = await db
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    role: profile?.role === "admin" ? "admin" : "customer",
  };
}

/**
 * Ensures the caller is an admin. Returns either the user or a ready-to-send
 * error response, so routes read: `if (auth instanceof NextResponse) return auth;`
 */
export async function requireAdmin(
  req: Request
): Promise<AuthedUser | NextResponse> {
  const user = await currentUser(req);
  if (!user) return fail("Authentication required.", 401);
  if (user.role !== "admin") return fail("Administrator access required.", 403);
  return user;
}
