"use client";

import { useEffect } from "react";
import { rehydrateStores, useMenu, useReviews, useSettings } from "@/lib/store";

const generateUUID = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator for non-HTTPS local setups
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function StoreHydration() {
  useEffect(() => {
    /* One-time purge of pre-Supabase local data.
       Scoped to our own keys: a blanket localStorage.clear() also destroyed the
       Supabase auth token (sb-*-auth-token), silently signing admins out. And
       the reload it triggered fired for every fresh browser, not just ones
       holding stale data, costing every first-time visitor a double page load.
       Clearing before rehydrateStores() below is enough; no reload needed. */
    if (!localStorage.getItem("tpp-backend-cleared-v1")) {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("tpp-")) localStorage.removeItem(key);
      }
      localStorage.setItem("tpp-backend-cleared-v1", "true");
    }

    // 1. Rehydrate stores from local storage first
    rehydrateStores();

    // 2. Fetch fresh data from Supabase in the background
    const syncDatabaseData = async () => {
      try {
        await useMenu.getState().fetchItems();
      } catch (e) {
        console.error("Error syncing menu items:", e);
      }

      try {
        await useReviews.getState().fetchReviews();
      } catch (e) {
        console.error("Error syncing reviews:", e);
      }

      try {
        await useSettings.getState().fetchBusiness();
      } catch (e) {
        console.error("Error syncing business settings:", e);
      }

      try {
        const profile = useSettings.getState().profile;
        if (!profile.id) {
          // Generate a guest UUID if none exists
          const newId = generateUUID();
          useSettings.getState().setProfile({ id: newId });
        } else {
          // Load details from the database if they exist
          await useSettings.getState().fetchProfile(profile.id);
        }
      } catch (e) {
        console.error("Error syncing guest customer profile:", e);
      }
    };

    syncDatabaseData();
  }, []);

  return null;
}
