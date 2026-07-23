"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Eye, EyeOff, Lock, Mail, MailCheck, Phone, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

const field =
  "w-full rounded-2xl bg-white pl-11 pr-4 py-3 text-[14px] font-medium text-ink-900 placeholder:text-ink-300 shadow-soft outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-brand-300";

const label =
  "block text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1.5 pl-1";

const icon = "absolute left-4 top-3.5 h-[18px] w-[18px] text-ink-300 pointer-events-none";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    // The role is set by a database trigger, never by this payload.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/login`,
        data: { full_name: name.trim(), phone: phone.trim() },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      // Email confirmation is switched off for this Supabase project,
      // so no email is coming. Don't send them hunting for one.
      await supabase.auth.signOut();
    }

    setSentTo(email.trim());
    setLoading(false);
  };

  if (sentTo) {
    return (
      <div className="mx-auto max-w-[460px] px-4 sm:px-6">
        <div className="mt-10 rounded-[26px] bg-white p-6 text-center shadow-soft sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <MailCheck className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-[22px] font-extrabold text-ink-900">
            Check your inbox
          </h1>
          <p className="mt-2 text-[13.5px] font-medium leading-relaxed text-ink-500">
            We sent a confirmation link to{" "}
            <span className="font-bold text-ink-900">{sentTo}</span>. Click it to
            verify your address, then sign in.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-[14.5px] font-bold text-white shadow-pink"
          >
            Go to sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[460px] px-4 sm:px-6">
      <header className="pt-5 lg:pt-7">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink-900 lg:text-[30px]">
          Create your account
        </h1>
        <p className="mt-0.5 text-[13px] font-medium text-ink-500 lg:text-[14px]">
          Save your details, track every order and reorder in one tap.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="mt-5 flex flex-col gap-4 rounded-[26px] bg-white p-5 shadow-soft sm:p-6"
      >
        <div>
          <label htmlFor="name" className={label}>
            Full name
          </label>
          <div className="relative">
            <UserRound className={icon} />
            <input
              id="name"
              required
              autoComplete="name"
              placeholder="Ada Okafor"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={field}
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className={label}>
            Phone number
          </label>
          <div className="relative">
            <Phone className={icon} />
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="0801 234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={field}
            />
          </div>
        </div>

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
              minLength={6}
              autoComplete="new-password"
              placeholder="At least 6 characters"
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

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-[14.5px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </button>

        <p className="text-center text-[13px] font-semibold text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
