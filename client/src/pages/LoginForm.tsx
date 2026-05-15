"use client";

import { useSearchParams } from "react-router-dom";
import { apiFetch } from "@/lib/api";
import { useState } from "react";

export function LoginForm() {
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") ?? "/post-login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const res = await apiFetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        setLoading(false);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(typeof j?.error === "string" ? j.error : "Invalid email or password.");
          return;
        }
        window.location.href = from;
      }}
    >
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[color:var(--text)]" htmlFor="email">
          Email address
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]">
            <MailIcon className="h-4 w-4" />
          </span>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)]/60 pl-10 pr-3 text-sm text-[color:var(--text)] shadow-inner outline-none transition-[box-shadow,border-color] placeholder:text-[color:var(--text-muted)] focus:border-sky-300 focus:ring-2 focus:ring-sky-200/60"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[color:var(--text)]" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]">
            <LockIcon className="h-4 w-4" />
          </span>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-muted)]/60 pl-10 pr-3 text-sm text-[color:var(--text)] shadow-inner outline-none transition-[box-shadow,border-color] placeholder:text-[color:var(--text-muted)] focus:border-sky-300 focus:ring-2 focus:ring-sky-200/60"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--primary)] to-[#163a66] px-4 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-md transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <SignInGlyph className="h-4 w-4 shrink-0 opacity-90" />
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function SignInGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
    </svg>
  );
}
