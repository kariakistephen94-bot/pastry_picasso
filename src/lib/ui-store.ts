"use client";

import { create } from "zustand";
import type { MenuItem } from "./data";

interface UIState {
  sheetItem: MenuItem | null;
  openItem: (item: MenuItem) => void;
  closeItem: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUI = create<UIState>((set) => ({
  sheetItem: null,
  openItem: (item) => set({ sheetItem: item }),
  closeItem: () => set({ sheetItem: null }),
  toast: null,
  showToast: (msg) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: msg });
    toastTimer = setTimeout(() => set({ toast: null }), 2200);
  },
}));
