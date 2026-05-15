import { TrainerPageHeader } from "@/components/dashboard/trainer-page-header";
import { TrainerNavIconSparkles } from "@/components/dashboard/trainer-sidebar-icons";

export default function TrainerPromotionsPage() {
  return (
    <div className="space-y-6 p-6">
      <TrainerPageHeader
        title="Promotions & boosts"
        icon={<TrainerNavIconSparkles />}
        description="Optional paid visibility for your trainer profile."
      />
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-center text-sm text-[color:var(--text-muted)]">
        No active promotions. Boosts and spotlight placements will be configurable here.
      </div>
    </div>
  );
}
