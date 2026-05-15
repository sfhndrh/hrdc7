import type { ReactNode } from "react";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-widgets";

/**
 * Trainer portal page title — same gradient icon + title treatment as the admin dashboard.
 */
export function TrainerPageHeader(props: {
  title: string;
  icon: ReactNode;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <DashboardPageHeader
      title={props.title}
      description={props.description}
      icon={props.icon}
      right={props.right}
    />
  );
}
