import { Navigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthProvider";

function roleHome(role: string) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "TRAINER") return "/trainer/dashboard";
  if (role === "TRAINING_PROVIDER") return "/tp/dashboard";
  return "/client/dashboard";
}

export default function PostLoginPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#f4f7fc]" />;
  }

  if (!user?.role) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={roleHome(user.role)} replace />;
}
