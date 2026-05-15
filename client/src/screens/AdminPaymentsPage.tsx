"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import {
  AdminPaymentsView,
  type AdminPaymentRow,
} from "@/components/admin/admin-payments-view";
import { PageHeaderIconCard } from "@/components/dashboard/page-header-icons";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPaymentRow[]>([]);

  const load = useCallback(() => {
    void apiFetch("/api/admin/payments", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { payments: AdminPaymentRow[] }) =>
        setPayments(d.payments ?? []),
      )
      .catch(() => setPayments([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AdminPaymentsView
      payments={payments}
      pageIcon={<PageHeaderIconCard />}
      onRefresh={load}
    />
  );
}
