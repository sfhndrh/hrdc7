"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import {
  AdminTrainersView,
  type AdminTrainerRow,
} from "@/components/admin/admin-trainers-view";
import { PageHeaderIconUsers } from "@/components/dashboard/page-header-icons";
import { normalizeProfilePhotoUrl } from "@/lib/profile-photo";

type AdminTrainerApiRow = AdminTrainerRow & {
  profile_photo?: string | null;
  accountStatus?: "ACTIVE" | "SUSPENDED";
};

function mapTrainerRow(t: AdminTrainerApiRow): AdminTrainerRow {
  return {
    id: t.id,
    fullName: t.fullName,
    subtitle: t.subtitle,
    email: t.email,
    phone: t.phone,
    status: t.status,
    accountStatus: t.accountStatus === "SUSPENDED" ? "SUSPENDED" : "ACTIVE",
    profilePhoto: normalizeProfilePhotoUrl(t.profilePhoto ?? t.profile_photo),
  };
}

export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<AdminTrainerRow[]>([]);

  useEffect(() => {
    void apiFetch("/api/admin/trainers", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { trainers?: AdminTrainerApiRow[] }) =>
        setTrainers((d.trainers ?? []).map(mapTrainerRow)),
      );
  }, []);

  return <AdminTrainersView trainers={trainers} pageIcon={<PageHeaderIconUsers />} />;
}
