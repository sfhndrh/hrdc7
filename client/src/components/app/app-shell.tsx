import { Link } from "@/components/link";

import { ButtonLink, cn } from "@/components/ui/button";

export type NavItem = {
  href: string;
  label: string;
  icon?: React.ReactNode;
  badgeText?: string;
  isActive?: (pathname: string) => boolean;
  disabled?: boolean;
  hint?: string;
};

export function AppShell({
  title,
  subtitle,
  nav,
  children,
}: {
  title: string;
  subtitle?: string;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-[color:var(--background)]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-sm text-[color:var(--text-muted)]">
                {subtitle}
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <ButtonLink variant="outline" href="/">
              Home
            </ButtonLink>
            <form action="/api/auth/signout" method="post">
              <button className="h-10 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-sm hover:bg-sky-50">
                Sign out
              </button>
            </form>
          </div>
        </header>

        <div className="mt-6 grid gap-6 md:grid-cols-[220px_1fr]">
          <aside className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 shadow-sm">
            <nav className="flex flex-col gap-1">
              {nav.map((item) =>
                item.disabled ? (
                  <span
                    key={`${item.label}-${item.href}`}
                    title={item.hint ?? "Available after approval"}
                    className={cn(
                      "cursor-not-allowed rounded-md px-3 py-2 text-sm text-[color:var(--text-muted)] opacity-60",
                    )}
                    aria-disabled
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-3 py-2 text-sm text-[color:var(--text)] hover:bg-sky-50"
                  >
                    {item.label}
                  </Link>
                ),
              )}
            </nav>
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}

