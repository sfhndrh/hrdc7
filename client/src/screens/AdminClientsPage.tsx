"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import {
  AdminCompaniesView,
  type AdminCompanyRow,
} from "@/components/admin/admin-companies-view";
import { PageHeaderIconBuilding } from "@/components/dashboard/page-header-icons";

export default function AdminClientsPage() {
  const [companies, setCompanies] = useState<AdminCompanyRow[]>([]);

  useEffect(() => {
    void apiFetch("/api/admin/clients", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { companies: AdminCompanyRow[] }) => setCompanies(d.companies ?? []));
  }, []);

  return <AdminCompaniesView companies={companies} pageIcon={<PageHeaderIconBuilding />} />;
}
