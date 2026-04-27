import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { priorityBadgeClass } from "../../lib/taskUi";
import type { ApiResponse, Paginated, Task, TaskPriority, TaskStatus } from "../../types";
import { Badge, Card, Input, Select } from "../../ui/components";

export function TasksPage() {
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [q, setQ] = useState("");

  const tasks = useQuery({
    queryKey: ["tasks", { status, priority }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "200");
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      const res = await api.get<ApiResponse<Paginated<Task>>>(`/api/tasks?${params.toString()}`);
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data.items;
    },
  });

  const filtered = useMemo(() => {
    const items = tasks.data ?? [];
    if (!q.trim()) return items;
    const needle = q.toLowerCase();
    return items.filter((t) => `${t.title} ${t.description ?? ""}`.toLowerCase().includes(needle));
  }, [tasks.data, q]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="mt-1 text-sm text-fg-muted">Filters are enforced by the API based on your role.</p>
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <div className="text-xs text-fg-muted">Search</div>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title/description…" />
          </div>
          <div>
            <div className="text-xs text-fg-muted">Status</div>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus | "")}
            >
              <option value="">Any</option>
              <option value="todo">todo</option>
              <option value="in_progress">in_progress</option>
              <option value="review">review</option>
              <option value="done">done</option>
            </Select>
          </div>
          <div>
            <div className="text-xs text-fg-muted">Priority</div>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority | "")}
            >
              <option value="">Any</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </Select>
          </div>
        </div>
      </Card>

      {tasks.isLoading && <div className="text-sm text-fg-muted">Loading…</div>}
      {tasks.isError && <div className="text-sm text-red-400">{(tasks.error as Error).message}</div>}
      {!tasks.isLoading && filtered.length === 0 && <div className="text-sm text-fg-muted">No tasks.</div>}

      <div className="grid gap-3">
        {filtered.map((t) => (
          <Card key={t._id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to={`/tasks/${t._id}`} className="truncate text-base font-semibold text-fg hover:underline">
                  {t.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                  <span>{t.project?.title}</span>
                  <span className="opacity-60">•</span>
                  <span>{t.status}</span>
                  <span className="opacity-60">•</span>
                  <span>Assignee: {t.assignedTo?.name}</span>
                </div>
              </div>
              <Badge color={priorityBadgeClass(t.priority)}>{t.priority}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
