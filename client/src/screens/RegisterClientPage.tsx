import { RegisterPageShell } from "@/components/register/register-page-shell";
import { ClientRegisterForm } from "@/pages/ClientRegisterForm";

export default function ClientRegisterPage() {
  return (
    <RegisterPageShell
      title="Register as Company"
      description="Create your company profile."
      wideCard
      otherRegisterHref="/register/trainer"
      otherRegisterLabel="Trainer"
    >
      <ClientRegisterForm />
    </RegisterPageShell>
  );
}
