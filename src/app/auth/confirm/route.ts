import { NextResponse } from "next/server";

/** Only ever redirect within this app, never to a host an email link supplies. */
const ALLOWED_NEXT = ["/login", "/admin/login"];

/**
 * Landing point for the Supabase "Confirm your signup" email link.
 * Supabase has already verified the address by the time it redirects here,
 * so we deliberately do NOT create a session — the user is sent to the
 * sign-in screen to log in with the password they chose.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const error =
    url.searchParams.get("error_description") || url.searchParams.get("error");

  const requested = url.searchParams.get("next") || "/login";
  const next = ALLOWED_NEXT.includes(requested) ? requested : "/login";

  const target = new URL(next, url.origin);
  if (error) {
    target.searchParams.set("auth_error", error);
  } else {
    target.searchParams.set("confirmed", "1");
  }

  return NextResponse.redirect(target);
}
