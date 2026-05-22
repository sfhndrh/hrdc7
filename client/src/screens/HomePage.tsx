import { Navigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";
import { Link } from "@/components/link";
import { ButtonLink } from "@/components/ui/button";
import {
  EMPLOYER_PLAN_COMPARE_HEADING,
  EMPLOYER_PLAN_COMPARE_SUBTITLE,
  EMPLOYER_PLAN_FREE,
  EMPLOYER_PLAN_PRO,
} from "@/lib/employer-subscription-plans";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex-1 bg-white" />;
  }

  if (user?.role) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <WhyUseSection />
        <WhyListSection />
        <HowItWorksSection />
        <TrainerPlansSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ---------------- Header ---------------- */

function SiteHeader() {
  return (
    <header className="border-b border-[color:var(--border)] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--primary)] text-sm font-semibold text-white">
            H
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-[color:var(--text)]">
              MY Certified Trainer
            </div>
            <div className="text-[11px] font-medium uppercase tracking-wide text-[color:var(--text-muted)]">
              HRD Corp Certified Trainers Marketplace
            </div>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2">
          <ButtonLink size="sm" href="/login">
            Login
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}

/* ---------------- Role registration CTAs ---------------- */

function RoleRegisterButtons({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "onPrimary";
}) {
  const outlineClass =
    tone === "onPrimary"
      ? "!border-white/40 !bg-transparent !text-white hover:!bg-white/10"
      : undefined;

  return (
    <div className={`flex flex-wrap justify-center gap-3 ${className ?? ""}`}>
      <ButtonLink size="lg" variant="outline" href="/register/tp" className={outlineClass}>
        Training Provider
      </ButtonLink>
      <ButtonLink size="lg" variant="outline" href="/register/trainer" className={outlineClass}>
        Trainer
      </ButtonLink>
      <ButtonLink size="lg" variant="outline" href="/register/client" className={outlineClass}>
        Employer
      </ButtonLink>
    </div>
  );
}

/* ---------------- Hero ---------------- */

function HeroSection() {
  return (
    <section className="bg-[color:var(--surface-muted)]">
      <div className="mx-auto max-w-4xl px-4 py-14 text-center md:py-20">
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[color:var(--text)] md:text-5xl">
          Find{" "}
          <span className="text-[color:var(--accent)]">HRD Corp certified</span>{" "}
          trainers faster.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[color:var(--text-muted)]">
          Malaysia&rsquo;s first dedicated platform for HRD Corp certified
          trainers. Employers claim back HRD Corp claimable training. Trainers
          grow their client base &mdash; all in one platform.
        </p>

        <p className="mt-8 text-3xl font-bold tracking-tight text-[color:var(--text)] md:text-4xl">
          Choose your role.
        </p>
        <RoleRegisterButtons className="mt-4" />

        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-3 gap-6 border-t border-[color:var(--border)] pt-6">
          <MiniStat value="500+" label="Active trainer profiles" />
          <MiniStat value="1,200+" label="Employer searches/month" />
          <MiniStat value="Free" label="Basic listing" />
        </div>
      </div>
    </section>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold text-[color:var(--text)]">{value}</div>
      <div className="mt-1 text-xs text-[color:var(--text-muted)]">{label}</div>
    </div>
  );
}

/* ---------------- Why use this platform ---------------- */

function WhyUseSection() {
  return (
    <section className="bg-[color:var(--primary)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
            Why use this platform
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need for HRDC-funded training
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/70">
            From finding certified trainers to managing HRD Corp Claimable Courses claims &mdash;
            we handle the complexity so you don&rsquo;t have to.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DarkFeatureCard
            icon={<ShieldIcon className="h-5 w-5" />}
            title="HRDC-verified trainers"
            desc="Every trainer is screened against HRD Corp's registry. Only approved trainers appear on the marketplace."
          />
          <DarkFeatureCard
            icon={<FilterIcon className="h-5 w-5" />}
            title="Filter by topic & industry"
            desc="Search by training category, delivery mode, language, industry, or location across Malaysia."
          />
          <DarkFeatureCard
            icon={<StarIcon className="h-5 w-5" />}
            title="Ratings & past clients"
            desc="See verified reviews from other HR teams and track records before making a hiring decision."
          />
        </div>
      </div>
    </section>
  );
}

function DarkFeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-white p-5 shadow-sm">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--accent)]/15 text-[color:var(--accent)]">
        {icon}
      </div>
      <div className="mt-4 text-base font-semibold text-[color:var(--text)]">
        {title}
      </div>
      <div className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
        {desc}
      </div>
    </div>
  );
}

/* ---------------- Why list on this platform ---------------- */

function WhyListSection() {
  return (
    <section className="bg-[color:var(--surface-muted)] text-[color:var(--text)]">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
            For trainers
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Why list on this platform
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <PerkCard
            tone="blue"
            icon={<SearchIcon className="h-5 w-5" />}
            title="Get discovered by HR teams"
            desc="Employers search our platform when planning their annual training calendar with levy funds."
          />
          <PerkCard
            tone="amber"
            icon={<StarIcon className="h-5 w-5" />}
            title="Build your reputation"
            desc="Collect reviews from employers after every engagement. Your track record speaks for itself."
          />
          <PerkCard
            tone="red"
            icon={<MonitorIcon className="h-5 w-5" />}
            title="In-person, virtual & hybrid"
            desc="List all your delivery modes. Reach employers across Malaysia, not just your local area."
          />
          <PerkCard
            tone="purple"
            icon={<ChartIcon className="h-5 w-5" />}
            title="Profile analytics"
            desc="See how many employers viewed your profile, which topics they searched, and where inquiries come from."
          />
        </div>
      </div>
    </section>
  );
}

function PerkCard({
  tone,
  icon,
  title,
  desc,
}: {
  tone: "blue" | "green" | "amber" | "red" | "purple";
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  const toneClass: Record<typeof tone, string> = {
    blue: "bg-sky-100 text-sky-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-rose-100 text-rose-700",
    purple: "bg-violet-100 text-violet-700",
  };
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-white p-5 shadow-sm">
      <div
        className={`grid h-10 w-10 place-items-center rounded-lg ${toneClass[tone]}`}
      >
        {icon}
      </div>
      <div className="mt-4 text-base font-semibold text-[color:var(--text)]">
        {title}
      </div>
      <div className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
        {desc}
      </div>
    </div>
  );
}

/* ---------------- How it works ---------------- */

function HowItWorksSection() {
  return (
    <section className="bg-[#1e1b4b] text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
            How it works
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight md:whitespace-nowrap md:text-4xl">
            From search to certified training in 4 steps
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
            Trainers get matched with the right clients. Employers claim back
            training costs.
          </p>
        </div>

        <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FlowStep
            n={1}
            title="Employer subscribes"
            desc="Unlock full trainer profiles, contact details, and programme packages."
          />
          <FlowStep
            n={2}
            title="Browse & shortlist"
            desc="Filter by topic, location, industry, and language. Compare trainers side by side."
          />
          <FlowStep
            n={3}
            title="Engage trainer"
            desc="Contact verified trainers directly. Confirm programme details and training dates."
          />
          <FlowStep
            n={4}
            title="File HRD Corp Claimable Courses claim"
            desc="Submit your claim to HRD Corp using the trainer's registration number and programme details."
            highlight
          />
        </ol>
      </div>
    </section>
  );
}

function FlowStep({
  n,
  title,
  desc,
  highlight,
}: {
  n: number;
  title: string;
  desc: string;
  highlight?: boolean;
}) {
  return (
    <li className="relative">
      <div
        className={`grid h-10 w-10 place-items-center rounded-full text-sm font-semibold ${
          highlight
            ? "bg-[color:var(--accent)] text-[color:var(--accent-foreground)]"
            : "border border-white/20 bg-white/5 text-white"
        }`}
      >
        {n}
      </div>
      <div className="mt-4 text-base font-semibold">{title}</div>
      <div className="mt-2 text-sm leading-6 text-white/70">{desc}</div>
    </li>
  );
}

/* ---------------- Trainer plans (pricing) ---------------- */

function TrainerPlansSection() {
  return (
    <section className="bg-[color:var(--surface-muted)]">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          Plans
        </div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--text)] md:text-4xl">
          {EMPLOYER_PLAN_COMPARE_HEADING}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[color:var(--text-muted)]">
          {EMPLOYER_PLAN_COMPARE_SUBTITLE}
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2 md:items-stretch">
          <PlanCard
            name={EMPLOYER_PLAN_FREE.name}
            price={EMPLOYER_PLAN_FREE.price}
            period={EMPLOYER_PLAN_FREE.period}
            features={[...EMPLOYER_PLAN_FREE.features]}
          />
          <PlanCard
            name={EMPLOYER_PLAN_PRO.name}
            price={EMPLOYER_PLAN_PRO.price}
            period={EMPLOYER_PLAN_PRO.period}
            featured
            features={[...EMPLOYER_PLAN_PRO.features]}
          />
        </div>
      </div>
    </section>
  );
}

function PlanCard({
  name,
  price,
  period,
  features,
  featured,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-6 text-[color:var(--text)] shadow-sm ${
        featured
          ? "border-orange-400 ring-1 ring-orange-400/60"
          : "border-[color:var(--border)]"
      }`}
    >
      <span
        className={`mb-4 inline-flex w-fit items-center rounded-full border px-3 py-0.5 text-[11px] font-medium ${
          featured
            ? "border-orange-300 bg-orange-100 text-orange-700"
            : "invisible border-transparent"
        }`}
        aria-hidden={featured ? undefined : true}
      >
        Most popular
      </span>

      <div className="text-base font-semibold text-[color:var(--text)]">
        {name}
      </div>
      <div
        className={`mt-3 text-3xl font-semibold ${
          featured ? "text-orange-600" : "text-[color:var(--text)]"
        }`}
      >
        {price}
      </div>
      <div className="mt-1 text-xs text-[color:var(--text-muted)]">{period}</div>

      <ul className="mt-6 grid gap-3">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-start gap-3 text-sm leading-6 text-[color:var(--text)]"
          >
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckIcon className="h-3 w-3" />
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- Final CTA ---------------- */

function FinalCtaSection() {
  return (
    <section className="bg-[color:var(--primary)] text-white">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center md:py-20">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Start hiring smarter today
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/70">
          Join employers across Malaysia that use MY Certified Trainer to find
          verified trainers and maximise their HRD Corp levy.
        </p>
        <RoleRegisterButtons className="mt-8" tone="onPrimary" />
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */

function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[color:var(--primary)] text-white/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs sm:flex-row">
        <div>
          &copy; {new Date().getFullYear()} MY Certified Trainer.
        </div>
        <div>
          For levy queries, visit{" "}
          <a
            href="https://hrdcorp.gov.my"
            target="_blank"
            rel="noreferrer"
            className="text-white/80 underline underline-offset-4"
          >
            hrdcorp.gov.my
          </a>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- Helpers ---------------- */

function roleHome(role: string) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "TRAINER") return "/trainer/dashboard";
  if (role === "TRAINING_PROVIDER") return "/tp/dashboard";
  return "/client/dashboard";
}

/* ---------------- Inline icons (no external deps) ---------------- */

type IconProps = { className?: string };

function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function FilterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 5h18" />
      <path d="M6 12h12" />
      <path d="M10 19h4" />
    </svg>
  );
}

function StarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m12 2 3 7 7 .8-5.3 4.7L18 22l-6-3.5L6 22l1.3-7.5L2 9.8 9 9z" />
    </svg>
  );
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function MonitorIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  );
}

function ChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 21V10" />
      <path d="M12 21V3" />
      <path d="M19 21v-7" />
    </svg>
  );
}

