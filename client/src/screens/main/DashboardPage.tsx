import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { priorityBadgeClass } from "../../lib/taskUi";
import type { ApiResponse, Paginated, Task } from "../../types";
import { Card, Badge } from "../../ui/components";

export function DashboardPage() {
  const recentTasks = useQuery({
    queryKey: ["tasks", "recent"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<Task>>>("/api/tasks?limit=5&page=1");
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data.items;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-fg-muted">Recent work and quick stats.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-fg-muted">Health</div>
          <div className="mt-2 text-lg font-semibold">Ready</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted">Focus</div>
          <div className="mt-2 text-lg font-semibold">Your tasks</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-fg-muted">Roles</div>
          <div className="mt-2 text-lg font-semibold">Admin / Manager / Member</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Recent tasks</h2>
          <span className="text-xs text-fg-muted">Auto-filtered by role</span>
        </div>

        {recentTasks.isLoading && <div className="mt-4 text-sm text-fg-muted">Loading…</div>}
        {recentTasks.isError && (
          <div className="mt-4 text-sm text-red-400">{(recentTasks.error as Error).message}</div>
        )}
        {!recentTasks.isLoading && recentTasks.data?.length === 0 && (
          <div className="mt-4 text-sm text-fg-muted">No tasks yet.</div>
        )}

        <div className="mt-4 space-y-2">
          {recentTasks.data?.map((t) => (
            <div key={t._id} className="flex items-center justify-between rounded-lg border border-border bg-bg-subtle px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-fg">{t.title}</div>
                <div className="truncate text-xs text-fg-muted">{t.project?.title}</div>
              </div>
              <Badge color={priorityBadgeClass(t.priority)}>{t.priority}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
