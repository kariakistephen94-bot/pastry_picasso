"use client";

import { create } from "zustand";
import type { MenuItem } from "./data";

interface UIState {
  sheetItem: MenuItem | null;
  openItem: (item: MenuItem) => void;
  closeItem: () => void;
  /** Item whose quick-add extras dialog is open */
  extrasItem: MenuItem | null;
  openExtras: (item: MenuItem) => void;
  closeExtras: () => void;
  toast: string | null;
  showToast: (msg: string) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useUI = create<UIState>((set) => ({
  sheetItem: null,
  openItem: (item) => set({ sheetItem: item, extrasItem: null }),
  closeItem: () => set({ sheetItem: null }),
  extrasItem: null,
  openExtras: (item) => set({ extrasItem: item, sheetItem: null }),
  closeExtras: () => set({ extrasItem: null }),
  toast: null,
  showToast: (msg) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast: msg });
    toastTimer = setTimeout(() => set({ toast: null }), 2200);
  },
}));
