"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Clock,
  Database,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Timer,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { BUSINESS } from "@/lib/data";
import { useOrders, useSettings } from "@/lib/store";
import { useUI } from "@/lib/ui-store";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";

const field =
  "w-full rounded-2xl bg-cream-100 px-4 py-3 text-[13.5px] font-medium text-ink-900 placeholder:text-ink-300 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-2 focus:ring-brand-300";

export default function AdminSettings() {
  const business = useSettings((s) => s.business);
  const fetchBusiness = useSettings((s) => s.fetchBusiness);
  const setBusiness = useSettings((s) => s.setBusiness);
  const resetBusiness = useSettings((s) => s.resetBusiness);
  const clearSamples = useOrders((s) => s.clearSamples);
  const clearAll = useOrders((s) => s.clearAll);
  const orders = useOrders((s) => s.orders);
  const showToast = useUI((s) => s.showToast);

  const [form, setForm] = useState(business);

  useEffect(() => {
    fetchBusiness();
  }, [fetchBusiness]);

  useEffect(() => {
    setForm(business);
  }, [business]);

  const [confirmClear, setConfirmClear] = useState(false);

  // Read-only roster. Roles are changed on the Customers page.
  const [admins, setAdmins] = useState<{ id: string; email: string }[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingAdmins(true);
        const { customers, currentUserId } = await api.get<{
          customers: { userId: string | null; email: string; role: string | null }[];
          currentUserId: string;
        }>("/api/admin/customers", { auth: true });

        setCurrentUserId(currentUserId ?? null);
        setAdmins(
          customers
            .filter((c) => c.role === "admin" && c.userId)
            .map((c) => ({ id: c.userId as string, email: c.email }))
            .sort((a, b) => a.email.localeCompare(b.email))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingAdmins(false);
      }
    };
    load();
  }, []);

  const sampleCount = orders.filter((o) => o.sample).length;

  const save = () => {
    setBusiness(form);
    showToast("Settings saved");
  };

  return (
    <div className="mx-auto max-w-[680px]">
      <header className="mb-5">
        <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink-900 lg:text-[28px]">
          Settings
        </h1>
        <p className="mt-0.5 text-[13px] font-medium text-ink-500">
          Business details shown across the app.
        </p>
      </header>

      {/* Business info */}
      <section className="rounded-[24px] bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <Building2 className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 className="font-display text-[15px] font-extrabold text-ink-900">
              {BUSINESS.name}
            </h2>
            <p className="text-[12px] font-medium text-ink-500">
              {BUSINESS.legalName}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="pl-1 text-[11.5px] font-bold uppercase tracking-wide text-ink-400">
              <Clock className="mr-1 inline h-3 w-3" /> Opening hours
            </span>
            <input
              className={field}
              value={form.hoursText}
              onChange={(e) => setForm({ ...form, hoursText: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="pl-1 text-[11.5px] font-bold uppercase tracking-wide text-ink-400">
              <Timer className="mr-1 inline h-3 w-3" /> Preparation time
            </span>
            <input
              className={field}
              value={form.prepTime}
              onChange={(e) => setForm({ ...form, prepTime: e.target.value })}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="pl-1 text-[11.5px] font-bold uppercase tracking-wide text-ink-400">
                <Phone className="mr-1 inline h-3 w-3" /> Phone
              </span>
              <input
                className={field}
                value={form.phoneDisplay}
                onChange={(e) => setForm({ ...form, phoneDisplay: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="pl-1 text-[11.5px] font-bold uppercase tracking-wide text-ink-400">
                <WhatsAppIcon className="mr-1 inline h-3 w-3" /> WhatsApp number
              </span>
              <input
                className={field}
                value={form.whatsappNumber}
                onChange={(e) =>
                  setForm({ ...form, whatsappNumber: e.target.value.replace(/[^\d]/g, "") })
                }
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="pl-1 text-[11.5px] font-bold uppercase tracking-wide text-ink-400">
              <MapPin className="mr-1 inline h-3 w-3" /> Address
            </span>
            <input
              className={field}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
        </div>

        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={() => {
              resetBusiness();
              setForm({
                hoursText: BUSINESS.hoursText,
                prepTime: BUSINESS.prepTime,
                phoneDisplay: BUSINESS.phoneDisplay,
                whatsappNumber: BUSINESS.whatsappNumber,
                address: BUSINESS.address,
              });
              showToast("Business info reset");
            }}
            className="flex h-11 items-center gap-1.5 rounded-2xl bg-cream-100 px-4 text-[12.5px] font-bold text-ink-500 transition-colors hover:text-ink-900"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={save}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-[13.5px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg"
          >
            <Save className="h-4 w-4" /> Save changes
          </button>
        </div>
      </section>

      {/* Administrators */}
      <section className="mt-4 rounded-[24px] bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <ShieldCheck className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 className="font-display text-[15px] font-extrabold text-ink-900">
              Administrators
            </h2>
            <p className="text-[12px] font-medium text-ink-500">
              Everyone with dashboard access.
            </p>
          </div>
          <Link
            href="/admin/customers"
            className="ml-auto shrink-0 rounded-2xl bg-cream-100 px-3.5 py-2 text-[12px] font-bold text-ink-700 transition-colors hover:bg-cream-200"
          >
            Manage roles
          </Link>
        </div>

        {/* Admin List */}
        <div className="flex flex-col gap-2">
          {loadingAdmins ? (
            <p className="text-[12.5px] text-ink-400 pl-1 animate-pulse">Loading administrators...</p>
          ) : admins.length === 0 ? (
            <p className="text-[12.5px] text-ink-400 pl-1">No administrators registered.</p>
          ) : (
            admins.map((adm) => (
              <div
                key={adm.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-cream-100/60 p-3"
              >
                <span className="truncate text-[13px] font-semibold text-ink-900 pl-1">
                  {adm.email} {adm.id === currentUserId && <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full ml-1 font-bold">You</span>}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Data */}
      <section className="mt-4 rounded-[24px] bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Database className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 className="font-display text-[15px] font-extrabold text-ink-900">
              Data
            </h2>
            <p className="text-[12px] font-medium text-ink-500">
              Orders and menu edits are stored in this browser.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-cream-100 p-3.5">
            <div>
              <p className="text-[13px] font-bold text-ink-900">Sample orders</p>
              <p className="text-[11.5px] font-medium text-ink-500">
                {sampleCount > 0
                  ? `${sampleCount} demo orders are padding your analytics.`
                  : "No sample data. All numbers are real."}
              </p>
            </div>
            {sampleCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  clearSamples();
                  showToast("Sample orders removed");
                }}
                className="shrink-0 rounded-xl bg-white px-3.5 py-2 text-[12px] font-bold text-ink-700 shadow-soft transition-colors hover:text-brand-600"
              >
                Remove samples
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-2xl bg-red-50/70 p-3.5">
            <div>
              <p className="text-[13px] font-bold text-red-700">
                Clear all orders
              </p>
              <p className="text-[11.5px] font-medium text-red-600/70">
                Removes every order permanently. This can&apos;t be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!confirmClear) {
                  setConfirmClear(true);
                  setTimeout(() => setConfirmClear(false), 3500);
                  return;
                }
                clearAll();
                setConfirmClear(false);
                showToast("All orders cleared");
              }}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-bold transition-colors",
                confirmClear
                  ? "bg-red-500 text-white"
                  : "bg-white text-red-500 shadow-soft"
              )}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {confirmClear ? "Confirm?" : "Clear"}
            </button>
          </div>
        </div>
      </section>

      <p className="mt-6 text-center text-[11.5px] font-medium leading-relaxed text-ink-400">
        This dashboard runs entirely in your browser. Orders arrive via
        WhatsApp and are mirrored here when placed through the app on this
        device.
      </p>
    </div>
  );
}
