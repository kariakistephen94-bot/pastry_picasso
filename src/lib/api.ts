"use client";

/* ──────────────────────────────────────────────────────────────
   Thin client for the /api routes.

   Every data mutation the browser makes now goes through here.
   Admin calls pass { auth: true } to attach the current Supabase
   session token, which the server verifies before allowing writes.
   ────────────────────────────────────────────────────────────── */

import { supabase } from "./supabase";

interface Options {
  auth?: boolean;
  signal?: AbortSignal;
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      (body && (body.error as string)) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return body as T;
}

async function request<T>(
  method: string,
  path: string,
  payload?: unknown,
  opts: Options = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (payload !== undefined) headers["Content-Type"] = "application/json";
  if (opts.auth) Object.assign(headers, await authHeader());

  const res = await fetch(path, {
    method,
    headers,
    body: payload !== undefined ? JSON.stringify(payload) : undefined,
    signal: opts.signal,
    cache: "no-store",
  });
  return parse<T>(res);
}

export const api = {
  get: <T>(path: string, opts?: Options) => request<T>("GET", path, undefined, opts),
  post: <T>(path: string, body?: unknown, opts?: Options) =>
    request<T>("POST", path, body ?? {}, opts),
  put: <T>(path: string, body?: unknown, opts?: Options) =>
    request<T>("PUT", path, body ?? {}, opts),
  patch: <T>(path: string, body?: unknown, opts?: Options) =>
    request<T>("PATCH", path, body ?? {}, opts),
  del: <T>(path: string, opts?: Options) =>
    request<T>("DELETE", path, undefined, opts),
};
