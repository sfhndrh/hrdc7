import { RegisterPageShell } from "@/components/register/register-page-shell";
import { TrainerRegisterForm } from "@/pages/TrainerRegisterForm";

export default function TrainerRegisterPage() {
  return (
    <RegisterPageShell
      title="Register as Trainer"
      description="Create your trainer profile."
      wideCard
      otherRegisterHref="/register/client"
      otherRegisterLabel="Employer"
    >
      <TrainerRegisterForm />
    </RegisterPageShell>
  );
}
