import { RegisterPageShell } from "@/components/register/register-page-shell";
import { ClientRegisterForm } from "@/pages/ClientRegisterForm";

export default function ClientRegisterPage() {
  return (
    <RegisterPageShell
      title="Register as Employer"
      description="Create your employer profile."
      wideCard
      otherRegisterHref="/register/trainer"
      otherRegisterLabel="Trainer"
    >
      <ClientRegisterForm />
    </RegisterPageShell>
  );
}
