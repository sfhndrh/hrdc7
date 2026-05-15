import type { ReactNode } from "react";

import { Link } from "@/components/link";

type RegisterPageShellProps = {
  title: string;
  description?: string;
  /** Wider card for multi-section registration forms */
  wideCard?: boolean;
  otherRegisterHref: string;
  otherRegisterLabel: string;
  children: ReactNode;
};

export function RegisterPageShell({
  title,
  description,
  wideCard = true,
  otherRegisterHref,
  otherRegisterLabel,
  children,
}: RegisterPageShellProps) {
  const cardMax = wideCard ? "max-w-4xl" : "max-w-[420px]";

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto font-sans">
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-br from-sky-100/90 via-[#f4f7fc] to-[color:var(--surface-muted)]"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-10%,rgba(11,31,59,0.07),transparent_55%)]"
        aria-hidden
      />

      <main className="relative flex min-h-screen flex-col items-center px-4 py-8 sm:py-10">
        <div className="mb-4 flex w-full max-w-md flex-col items-center text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[color:var(--text)] sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-lg text-sm text-[color:var(--text-muted)]">{description}</p>
          ) : null}
        </div>

        <div
          className={`w-full ${cardMax} rounded-2xl border border-[color:var(--border)] bg-white p-6 shadow-[0_25px_50px_-12px_rgba(11,31,59,0.12)] sm:p-7`}
        >
          {children}
        </div>

        <div className="mt-5 max-w-md space-y-0.5 text-center text-sm text-[color:var(--text-muted)]">
          <p>Already have an account?</p>
          <p>
            <Link href="/login" className="font-medium text-sky-800 underline hover:text-sky-950">
              Sign in
            </Link>
            {" · "}
            Register as{" "}
            <Link href={otherRegisterHref} className="font-medium text-sky-800 underline hover:text-sky-950">
              {otherRegisterLabel}
            </Link>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-[color:var(--text-muted)]">
          © {new Date().getFullYear()}. All rights reserved.
        </p>
      </main>
    </div>
  );
}
