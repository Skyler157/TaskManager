import React from "react";
import { Card, CardContent, CardHeader } from "../../ui/components";

export function AuthShell({
  title,
  subtitle = "Dark-mode-first task tracking with role-based access.",
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bg via-bg-subtle to-bg flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent to-accent-2 shadow-soft flex items-center justify-center">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-fg">TaskFlow</h1>
              <p className="text-xs text-fg-muted">Productivity Platform</p>
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-2xl font-semibold text-fg">{title}</h2>
            <p className="mt-1 text-sm text-fg-muted">{subtitle}</p>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

