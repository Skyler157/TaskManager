import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute, RoleRoute } from "./Guards";
import { LoginPage } from "../screens/auth/LoginPage";
import { RegisterPage } from "../screens/auth/RegisterPage";
import { AppLayout } from "../screens/layout/AppLayout";
import { DashboardPage } from "../screens/main/DashboardPage";
import { ProjectsPage } from "../screens/main/ProjectsPage";
import { ProjectDetailPage } from "../screens/main/ProjectDetailPage";
import { TasksPage } from "../screens/main/TasksPage";
import { TaskDetailPage } from "../screens/main/TaskDetailPage";
import { AdminUsersPage } from "../screens/admin/AdminUsersPage";
import { ProfilePage } from "../screens/main/ProfilePage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route element={<RoleRoute roles={["admin"]} />}>
            <Route path="/admin" element={<AdminUsersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

