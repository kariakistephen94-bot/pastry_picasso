"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { fetchProfile } from "@/lib/auth";

const field =
  "w-full rounded-2xl bg-white pl-11 pr-4 py-3 text-[14px] font-medium text-ink-900 placeholder:text-ink-300 shadow-soft outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-brand-300";

const label =
  "block text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1.5 pl-1";

const icon = "absolute left-4 top-3.5 h-[18px] w-[18px] text-ink-300 pointer-events-none";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Arriving back from the "Confirm your signup" email link
  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (authError) {
      setError(
        `${authError}. The confirmation link may have expired. Try signing up again.`
      );
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
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // Admins land in the dashboard, everyone else on their account page
    const profile = await fetchProfile(data.user.id);
    router.push(profile?.role === "admin" ? "/admin" : "/account");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-[460px] px-4 sm:px-6">
      <header className="pt-5 lg:pt-7">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink-900 lg:text-[30px]">
          Welcome back
        </h1>
        <p className="mt-0.5 text-[13px] font-medium text-ink-500 lg:text-[14px]">
          Sign in to see your orders and saved details.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mt-5 flex flex-col gap-4 rounded-[26px] bg-white p-5 shadow-soft sm:p-6"
      >
        <div>
          <label htmlFor="email" className={label}>
            Email address
          </label>
          <div className="relative">
            <Mail className={icon} />
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className={label}>
            Password
          </label>
          <div className="relative">
            <Lock className={icon} />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${field} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-4 top-3.5 cursor-pointer text-ink-300 transition-colors hover:text-ink-500"
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
          <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 p-4 text-[12.5px] font-semibold text-red-700 ring-1 ring-red-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="rounded-2xl bg-emerald-50 p-4 text-[12.5px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-[14.5px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>

        <p className="text-center text-[13px] font-semibold text-ink-500">
          New here?{" "}
          <Link href="/signup" className="font-bold text-brand-600 hover:text-brand-700">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}
