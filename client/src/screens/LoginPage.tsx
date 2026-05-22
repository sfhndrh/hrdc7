import { Navigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { Link } from "@/components/link";
import { LoginForm } from "@/pages/LoginForm";

export default function LoginPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[color:var(--page-bg)]" />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden font-sans">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-100/90 via-[color:var(--page-bg)] to-[color:var(--surface-muted)] dark:from-slate-900/80 dark:via-[color:var(--page-bg)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(11,31,59,0.07),transparent_55%)]"
        aria-hidden
      />

      <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-6 sm:py-8">
        <div className="mb-4 flex w-full max-w-md flex-col items-center text-center">
          <div className="flex items-center gap-2">
            <span
              className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-[color:var(--primary)] to-[#1e4976] text-white shadow-md ring-1 ring-white/20"
              aria-hidden
            >
              <LogoMark className="h-4 w-4" />
            </span>
            <span className="text-base font-bold tracking-tight text-[color:var(--text)]">
              MY Certified Trainer
            </span>
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight text-[color:var(--text)] sm:text-3xl">
            Welcome back
          </h1>
          <p className="mt-1 max-w-sm text-sm text-[color:var(--text-muted)]">Sign in to your account</p>
        </div>

        <div className="w-full max-w-[420px] rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[0_25px_50px_-12px_var(--shadow-elevated)] sm:p-7">
          <LoginForm />
        </div>

        <div className="mt-5 space-y-0.5 text-center text-sm text-[color:var(--text-muted)]">
          <p>Don&apos;t have an account?</p>
          <p>
            Register as{" "}
            <Link href="/register/trainer" className="font-medium text-sky-800 underline hover:text-sky-950">
              Trainer
            </Link>
            ,{" "}
            <Link href="/register/tp" className="font-medium text-sky-800 underline hover:text-sky-950">
              Training provider
            </Link>
            , or{" "}
            <Link href="/register/client" className="font-medium text-sky-800 underline hover:text-sky-950">
              Employer
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-[color:var(--text-muted)]">
          © {new Date().getFullYear()} MY Certified Trainer. All rights reserved.
        </p>
      </main>
    </div>
  );
}

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M12 22a10 10 0 100-20 10 10 0 000 20z" />
    </svg>
  );
}
