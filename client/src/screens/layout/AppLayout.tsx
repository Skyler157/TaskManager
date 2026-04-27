import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutGrid, ListTodo, LogOut, Shield, User as UserIcon, FolderKanban } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { RoleGuard } from "../../routing/Guards";
import { Button } from "../../ui/components";
import { cn } from "../../ui/cn";

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
          isActive ? "bg-white/10 text-fg" : "text-fg-muted hover:bg-white/5 hover:text-fg",
        )
      }
    >
      <span className="h-4 w-4">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="border-b border-border bg-bg-subtle md:min-h-screen md:border-b-0 md:border-r">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent to-accent-2 shadow-soft" />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-fg">Task Manager</div>
                <div className="text-xs text-fg-muted">{user?.role ?? "-"}</div>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          <nav className="space-y-1 px-3 pb-4">
            <NavItem to="/dashboard" icon={<LayoutGrid className="h-4 w-4" />} label="Dashboard" />
            <NavItem to="/projects" icon={<FolderKanban className="h-4 w-4" />} label="Projects" />
            <NavItem to="/tasks" icon={<ListTodo className="h-4 w-4" />} label="Tasks" />
            <NavItem to="/profile" icon={<UserIcon className="h-4 w-4" />} label="Profile" />
            <RoleGuard roles={["admin"]}>
              <NavItem to="/admin" icon={<Shield className="h-4 w-4" />} label="Admin" />
            </RoleGuard>
          </nav>
        </aside>

        <main className="px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

