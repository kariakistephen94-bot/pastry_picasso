"use client";

import { useEffect } from "react";
import { rehydrateStores } from "@/lib/store";

export default function StoreHydration() {
  useEffect(() => {
    rehydrateStores();
  }, []);
  return null;
}
