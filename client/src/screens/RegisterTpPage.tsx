import { Link } from "@/components/link";
import { RegisterPageShell } from "@/components/register/register-page-shell";
import { TpRegisterForm } from "@/pages/TpRegisterForm";

export default function RegisterTpPage() {
  return (
    <RegisterPageShell
      title="Register as Training Provider"
      description="Create your account."
      wideCard
      otherRegisterHref="/register/trainer"
      otherRegisterLabel="Trainer"
    >
      <TpRegisterForm />
      <p className="mt-4 text-center text-sm text-[color:var(--text-muted)]">
        Looking for employer access?{" "}
        <Link href="/register/client" className="font-medium text-sky-800 underline">
          Register as employer
        </Link>
      </p>
    </RegisterPageShell>
  );
}
