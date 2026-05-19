"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import {
  AdminCompaniesView,
  type AdminCompanyRow,
} from "@/components/admin/admin-companies-view";
import { PageHeaderIconBuilding } from "@/components/dashboard/page-header-icons";
import { normalizeProfilePhotoUrl } from "@/lib/profile-photo";

type AdminCompanyApiRow = AdminCompanyRow & {
  profile_photo?: string | null;
};

function mapCompanyRow(c: AdminCompanyApiRow): AdminCompanyRow {
  return {
    ...c,
    profilePhoto: normalizeProfilePhotoUrl(c.profilePhoto ?? c.profile_photo),
  };
}

export default function AdminClientsPage() {
  const [companies, setCompanies] = useState<AdminCompanyRow[]>([]);

  useEffect(() => {
    void apiFetch("/api/admin/clients", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { companies?: AdminCompanyApiRow[] }) =>
        setCompanies((d.companies ?? []).map(mapCompanyRow)),
      );
  }, []);

  return <AdminCompaniesView companies={companies} pageIcon={<PageHeaderIconBuilding />} />;
}
