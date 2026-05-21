import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutGrid, ListTodo, LogOut, Shield, User as UserIcon, FolderKanban, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../auth/AuthContext";
import { RoleGuard } from "../../routing/Guards";
import { ThemeToggle } from "../../components/shared/ThemeToggle";
import { Button, Avatar } from "../../ui/components";
import { cn } from "../../ui/cn";

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
          isActive ? "bg-white/10 text-fg font-medium" : "text-fg-muted hover:bg-white/5 hover:text-fg",
        )
      }
    >
      <span className="h-5 w-5">{icon}</span>
      <span>{label}</span>
    </NavLink>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-bg-subtle px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <Avatar name={user?.name} size="sm" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-fg">TaskFlow</div>
            <div className="text-xs text-fg-muted">{user?.role ?? "-"}</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20 }}
              className="absolute left-0 top-0 h-full w-72 bg-bg-subtle p-4"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <img
                    src="/favicon.svg"
                    alt="TaskFlow Pro Logo"
                    className="h-8 w-8 rounded-lg object-contain"
                  />
                  <span className="font-semibold text-fg">TaskFlow Pro</span>
                </div>

                <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <nav className="space-y-1">
                <NavItem to="/dashboard" icon={<LayoutGrid className="h-5 w-5" />} label="Dashboard" />
                <NavItem to="/projects" icon={<FolderKanban className="h-5 w-5" />} label="Projects" />
                <NavItem to="/tasks" icon={<ListTodo className="h-5 w-5" />} label="Tasks" />
                <NavItem to="/profile" icon={<UserIcon className="h-5 w-5" />} label="Profile" />
                <RoleGuard roles={["admin"]}>
                  <NavItem to="/admin" icon={<Shield className="h-5 w-5" />} label="Admin" />
                </RoleGuard>
              </nav>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Layout */}
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[260px_1fr] bg-bg">
        {/* Desktop Sidebar */}
        <aside className="hidden border-r border-border bg-bg-subtle md:block md:min-h-screen">        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 px-4 py-5">
            <img
              src="/favicon.svg"
              alt="TaskFlow Pro Logo"
              className="h-9 w-9 rounded-xl object-contain shadow-soft"
            />

            <div className="leading-tight">
              <div className="text-sm font-semibold text-fg">TaskFlow Pro</div>
              <div className="text-xs text-fg-muted">{user?.role ?? "-"}</div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-3 pb-4">
            <NavItem to="/dashboard" icon={<LayoutGrid className="h-4 w-4" />} label="Dashboard" />
            <NavItem to="/projects" icon={<FolderKanban className="h-4 w-4" />} label="Projects" />
            <NavItem to="/tasks" icon={<ListTodo className="h-4 w-4" />} label="Tasks" />
            <NavItem to="/profile" icon={<UserIcon className="h-4 w-4" />} label="Profile" />
            <RoleGuard roles={["admin"]}>
              <NavItem to="/admin" icon={<Shield className="h-4 w-4" />} label="Admin" />
            </RoleGuard>
          </nav>

          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3">

              {/* Left: user info */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Avatar name={user?.name} size="sm" />

                <div className="leading-tight min-w-0">
                  <div className="text-xs font-medium text-fg truncate">
                    {user?.name}
                  </div>
                  <div className="text-xs text-fg-muted truncate">
                    {user?.email}
                  </div>
                </div>
              </div>

              {/* Right: actions */}
              <div className="flex items-center gap-1 shrink-0">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  title="Logout"
                  className="flex items-center justify-center"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

            </div>
          </div>
        </div>
        </aside>

        <motion.main
          className="px-4 py-6 md:px-6"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div >
  );
}