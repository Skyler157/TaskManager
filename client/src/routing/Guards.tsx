import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import type { Role } from "../types";
import { useAuth } from "../auth/AuthContext";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RoleGuard({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { role } = useAuth();
  if (!role) return null;
  if (!roles.includes(role)) return null;
  return <>{children}</>;
}

export function RoleRoute({ roles }: { roles: Role[] }) {
  const { role } = useAuth();
  if (!role) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

