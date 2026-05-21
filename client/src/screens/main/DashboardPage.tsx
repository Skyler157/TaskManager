import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { priorityBadgeClass, statusColor } from "../../lib/taskUi";
import type { ApiResponse, Paginated, Task } from "../../types";
import { Badge, Card, CardContent, CardHeader, CardTitle, StatCard, Skeleton, Button } from "../../ui/components";
import { LayoutGrid, FolderKanban, ListTodo, TrendingUp, Plus } from "lucide-react";
import { cn } from "../../ui/cn";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

export function DashboardPage() {
  const recentTasks = useQuery({
    queryKey: ["tasks", "recent"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<Task>>>("/api/tasks?limit=5&page=1&sort=-updatedAt");
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data.items;
    },
  });

  const tasks = useQuery({
    queryKey: ["tasks", "stats"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<Task>>>("/api/tasks?limit=100");
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data.items;
    },
  });

  const stats = {
    total: tasks.data?.length ?? 0,
    todo: tasks.data?.filter((t) => t.status === "todo").length ?? 0,
    inProgress: tasks.data?.filter((t) => t.status === "in_progress").length ?? 0,
    done: tasks.data?.filter((t) => t.status === "done").length ?? 0,
  };

  const statusData = [
    { name: "To Do", value: stats.todo, color: "#a3aab8" },
    { name: "In Progress", value: stats.inProgress, color: "#6366f1" },
    { name: "Review", value: tasks.data?.filter((t) => t.status === "review").length ?? 0, color: "#eab308" },
    { name: "Done", value: stats.done, color: "#22c55e" },
  ].filter((d) => d.value > 0);

  const priorityData = [
    { name: "Low", value: tasks.data?.filter((t) => t.priority === "low").length ?? 0, color: "#22c55e" },
    { name: "Medium", value: tasks.data?.filter((t) => t.priority === "medium").length ?? 0, color: "#eab308" },
    { name: "High", value: tasks.data?.filter((t) => t.priority === "high").length ?? 0, color: "#f97316" },
    { name: "Urgent", value: tasks.data?.filter((t) => t.priority === "urgent").length ?? 0, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-fg-muted">Welcome back! Here's your productivity overview.</p>
        </div>
        <Link to="/tasks">
          <Button variant="outline">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Tasks"
          value={stats.total}
          icon={<ListTodo className="h-5 w-5" />}
          trend="+12% this week"
          trendUp={true}
        />
        <StatCard
          label="To Do"
          value={stats.todo}
          icon={<LayoutGrid className="h-5 w-5" />}
          trend={`${stats.todo} pending`}
          trendUp={false}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={<TrendingUp className="h-5 w-5" />}
          trend="Active work"
          trendUp={true}
        />
        <StatCard
          label="Completed"
          value={stats.done}
          icon={<FolderKanban className="h-5 w-5" />}
          trend="Great job!"
          trendUp={true}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by status</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            {tasks.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : statusData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-fg-muted">No data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#111b33", border: "1px solid #22304f", color: "#e5e7eb" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks by priority</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px]">
            {tasks.isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : priorityData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-fg-muted">No data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityData}>
                  <CartesianGrid stroke="#22304f" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#a3aab8" />
                  <YAxis allowDecimals={false} stroke="#a3aab8" />
                  <Tooltip
                    contentStyle={{ background: "#111b33", border: "1px solid #22304f", color: "#e5e7eb" }}
                  />
                  <Bar dataKey="value">
                    {priorityData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Tasks</CardTitle>
            <Link className="text-sm text-accent hover:underline" to="/tasks">
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentTasks.isLoading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}
          {recentTasks.isError && (
            <div className="text-sm text-red-400">{(recentTasks.error as Error).message}</div>
          )}
          {!recentTasks.isLoading && recentTasks.data?.length === 0 && (
            <div className="py-8 text-center text-sm text-fg-muted">
              No tasks yet.{" "}
              <Link className="text-accent hover:underline" to="/tasks">
                Create your first task
              </Link>
            </div>
          )}

          <div className="space-y-2">
            {recentTasks.data?.map((t) => (
              <Link
                key={t._id}
                to={`/tasks/${t._id}`}
                className="flex items-center justify-between rounded-lg border border-border bg-bg-subtle px-3 py-2.5 transition-colors hover:bg-white/5"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-fg">{t.title}</div>
                  <div className="truncate text-xs text-fg-muted">{t.project?.title ?? "No project"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs", statusColor(t.status))}>{t.status.replace("_", " ")}</span>
                  <Badge color={priorityBadgeClass(t.priority)}>{t.priority}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
