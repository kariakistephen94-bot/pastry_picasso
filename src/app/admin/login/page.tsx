"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, Mail, AlertTriangle, ArrowRight, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchProfile } from "@/lib/auth";
import { IMG } from "@/lib/data";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (authError) {
      setError(`${authError}. The link may have expired.`);
      return;
    }
    if (searchParams.get("confirmed") === "1") {
      supabase.auth.signOut();
      setSuccess("Email confirmed. Sign in to continue.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      // Authentication is not authorization: the role decides.
      const profile = await fetchProfile(authData.user.id);

      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        setError(
          "Access denied: this account does not have administrator access."
        );
        setLoading(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex items-center justify-center p-4">
      {/* Background wash matching main app */}
      <div className="ambient" />

      <div className="w-full max-w-[420px] rounded-[28px] glass-strong p-6 sm:p-8 shadow-float relative overflow-hidden">
        {/* Top visual accents */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-brand-400 via-brand-600 to-brand-700" />

        <div className="flex flex-col items-center text-center">
          <div className="relative h-14 w-14 mb-4">
            <Image
              src={IMG.logo}
              alt="The Pastry Picasso"
              fill
              sizes="56px"
              className="object-contain"
            />
          </div>
          <h1 className="font-display text-[22px] font-extrabold text-ink-900 leading-tight">
            Pastry Picasso
          </h1>
          <p className="mt-1 text-[13px] font-medium text-ink-500">
            Sign in to access your administration kitchen dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="block text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1.5 pl-1"
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 h-[18px] w-[18px] text-ink-300 pointer-events-none" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="chef@pastrypicasso.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl bg-white/70 pl-11 pr-4 py-3 text-[14px] font-medium text-ink-900 placeholder:text-ink-300 shadow-soft outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-2 focus:ring-brand-300"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1.5 pl-1"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-[18px] w-[18px] text-ink-300 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl bg-white/70 pl-11 pr-12 py-3 text-[14px] font-medium text-ink-900 placeholder:text-ink-300 shadow-soft outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-2 focus:ring-brand-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-4 top-3.5 text-ink-300 hover:text-ink-500 cursor-pointer transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-[18px] w-[18px]" />
                ) : (
                  <Eye className="h-[18px] w-[18px]" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-2 flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-[12.5px] font-semibold text-red-700 ring-1 ring-red-200">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mt-2 rounded-2xl bg-emerald-50 p-4 text-[12.5px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-[14.5px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Sign in to Dashboard"}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>

          {/* Admin accounts are never self-serve: a customer signs up on the
              site, then an existing admin promotes them. */}
          <p className="mt-3.5 text-center text-[12.5px] font-medium leading-relaxed text-ink-500">
            Administrator access is granted by an existing admin. Need a
            customer account?{" "}
            <Link
              href="/signup"
              className="font-bold text-brand-600 hover:text-brand-700"
            >
              Sign up here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
