"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

import {
  AdminTrainersView,
  type AdminTrainerRow,
} from "@/components/admin/admin-trainers-view";
import { PageHeaderIconUsers } from "@/components/dashboard/page-header-icons";

export default function AdminTrainersPage() {
  const [trainers, setTrainers] = useState<AdminTrainerRow[]>([]);

  useEffect(() => {
    void apiFetch("/api/admin/trainers", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { trainers: AdminTrainerRow[] }) => setTrainers(d.trainers ?? []));
  }, []);

  return <AdminTrainersView trainers={trainers} pageIcon={<PageHeaderIconUsers />} />;
}
