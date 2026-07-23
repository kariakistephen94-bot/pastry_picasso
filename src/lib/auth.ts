"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Role = "customer" | "admin";

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  role: Role;
  createdAt: string;
}

export function mapProfile(row: any): Profile {
  return {
    id: row.id,
    email: row.email ?? "",
    fullName: row.full_name ?? "",
    phone: row.phone ?? "",
    address: row.address ?? "",
    role: row.role === "admin" ? "admin" : "customer",
    createdAt: row.created_at ?? "",
  };
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return mapProfile(data);
}

interface AuthState {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
}

/**
 * Session + profile (and therefore role) for the signed-in user.
 * Returns loading=true until the first resolution, so guards don't
 * flash a redirect while Supabase is still restoring the session.
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    profile: null,
  });

  useEffect(() => {
    let active = true;

    async function resolve(session: Session | null) {
      if (!session) {
        if (active) setState({ loading: false, session: null, profile: null });
        return;
      }
      const profile = await fetchProfile(session.user.id);
      if (active) setState({ loading: false, session, profile });
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      resolve(session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setState({ loading: false, session: null, profile: null });
      return;
    }
    const profile = await fetchProfile(data.session.user.id);
    setState({ loading: false, session: data.session, profile });
  }, []);

  return {
    ...state,
    refresh,
    isAdmin: state.profile?.role === "admin",
    signOut: () => supabase.auth.signOut(),
  };
}

/* ──────────────────────────────────────────────────────────────
   Customer segmentation

   New       0–1 orders
   Returning 2–4 orders
   VIP       5 or more
   ────────────────────────────────────────────────────────────── */

export type Segment = "new" | "returning" | "vip";

export const SEGMENT_MIN_RETURNING = 2;
export const SEGMENT_MIN_VIP = 5;

export function segmentFor(orderCount: number): Segment {
  if (orderCount >= SEGMENT_MIN_VIP) return "vip";
  if (orderCount >= SEGMENT_MIN_RETURNING) return "returning";
  return "new";
}

export const SEGMENT_LABEL: Record<Segment, string> = {
  new: "New",
  returning: "Returning",
  vip: "VIP",
};
