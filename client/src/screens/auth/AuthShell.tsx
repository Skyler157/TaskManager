import React from "react";
import { Card } from "../../ui/components";

export function AuthShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md p-6">
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent to-accent-2 shadow-soft" />
              <div className="text-sm font-semibold text-fg">Task Manager</div>
            </div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-fg-muted">Dark-mode-first task tracking with roles.</p>
          </div>
          {children}
        </Card>
      </div>
    </div>
  );
}

