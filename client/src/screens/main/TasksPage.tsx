import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { priorityBadgeClass, statusColor } from "../../lib/taskUi";
import type { ApiResponse, Paginated, Task, TaskPriority, TaskStatus, User } from "../../types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Modal,
  Select,
  Skeleton,
  Textarea,
} from "../../ui/components";
import { Plus } from "lucide-react";
import { cn } from "../../ui/cn";
import { useAuth } from "../../auth/AuthContext";

export function TasksPage() {
  const { role } = useAuth();
  const canCreate = role === "admin" || role === "manager";

  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createProjectId, setCreateProjectId] = useState("");
  const [createAssignedTo, setCreateAssignedTo] = useState("");
  const [createPriority, setCreatePriority] = useState<TaskPriority>("medium");
  const [createDueDate, setCreateDueDate] = useState("");
  const [createTags, setCreateTags] = useState("");

  const tasks = useQuery({
    queryKey: ["tasks", { status, priority }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "100");
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      const res = await api.get<ApiResponse<Paginated<Task>>>(`/api/tasks?${params.toString()}`);
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data.items;
    },
  });

  const projects = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<{ _id: string; title: string }>>>("/api/projects?limit=100");
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data.items;
    },
  });

  const employees = useQuery({
    queryKey: ["users", "employees"],
    enabled: open && canCreate,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<User>>>("/api/users?role=employee&page=1&limit=100");
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
  });

  const filtered = useMemo(() => {
    const items = tasks.data ?? [];
    if (!q.trim()) return items;
    const needle = q.toLowerCase();
    return items.filter((t) => `${t.title} ${t.description ?? ""}`.toLowerCase().includes(needle));
  }, [tasks.data, q]);

  const createTask = useMutation({
    mutationFn: async () => {
      const tags = createTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await api.post<ApiResponse<Task>>("/api/tasks", {
        title: createTitle,
        description: createDescription,
        projectId: createProjectId,
        assignedToId: createAssignedTo,
        priority: createPriority,
        ...(createDueDate ? { dueDate: createDueDate } : {}),
        ...(tags.length ? { tags } : {}),
      });
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
    onSuccess: async () => {
      toast.success("Task created");
      setOpen(false);
      setCreateTitle("");
      setCreateDescription("");
      setCreateProjectId("");
      setCreateAssignedTo("");
      setCreatePriority("medium");
      setCreateDueDate("");
      setCreateTags("");
      await qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create task"),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="mt-1 text-sm text-fg-muted">Manage your work and collaborate with your team.</p>
        </div>
        {canCreate ? (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <div className="text-xs text-fg-muted mb-1">Search</div>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title/description…" />
            </div>
            <div>
              <div className="text-xs text-fg-muted mb-1">Status</div>
              <Select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus | "")}>
                <option value="">Any status</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </Select>
            </div>
            <div>
              <div className="text-xs text-fg-muted mb-1">Priority</div>
              <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority | "")}>
                <option value="">Any priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {tasks.isLoading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}
      {tasks.isError && <div className="text-sm text-red-400">{(tasks.error as Error).message}</div>}
      {!tasks.isLoading && filtered.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-fg-muted">No tasks found.</p>
          <Button variant="ghost" className="mt-2" onClick={() => setOpen(true)}>
            Create your first task
          </Button>
        </div>
      )}

      <div className="grid gap-3">
        {filtered.map((t) => (
          <Link key={t._id} to={`/tasks/${t._id}`}>
            <Card className="p-4 transition-all duration-200 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-base font-semibold text-fg">{t.title}</div>
                  <div className="mt-1 line-clamp-2 text-sm text-fg-muted">{t.description}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className={cn(statusColor(t.status))}>{t.status.replace("_", " ")}</span>
                    <span className="text-fg-muted">•</span>
                    <span className="text-fg-muted">{t.project?.title}</span>
                    <span className="text-fg-muted">•</span>
                    <span className="text-fg-muted">{t.assignedTo?.name}</span>
                  </div>
                </div>
                <Badge color={priorityBadgeClass(t.priority)}>{t.priority}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Modal
        open={open}
        title="Create Task"
        description="Add a new task to track your work."
        onClose={() => setOpen(false)}
        size="lg"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createTask.mutate()}
              disabled={!createTitle || !createProjectId || !createAssignedTo || createTask.isPending}
            >
              {createTask.isPending ? "Creating…" : "Create Task"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs text-fg-muted">Title</label>
            <Input
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="Task title"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-fg-muted">Description</label>
            <Textarea
              value={createDescription}
              onChange={(e) => setCreateDescription(e.target.value)}
              placeholder="Task description"
              rows={3}
              className="mt-1"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs text-fg-muted">Project</label>
              <Select
                value={createProjectId}
                onChange={(e) => setCreateProjectId(e.target.value)}
                className="mt-1"
              >
                <option value="">Select project</option>
                {projects.data?.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs text-fg-muted">Assignee</label>
              <Select
                value={createAssignedTo}
                onChange={(e) => setCreateAssignedTo(e.target.value)}
                className="mt-1"
                disabled={employees.isLoading || employees.isError}
              >
                <option value="">
                  {employees.isLoading ? "Loading…" : "Select assignee"}
                </option>
                {employees.data?.items?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs text-fg-muted">Priority</label>
              <Select
                value={createPriority}
                onChange={(e) => setCreatePriority(e.target.value as TaskPriority)}
                className="mt-1"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
            <div>
              <label className="text-xs text-fg-muted">Due date</label>
              <Input
                type="date"
                value={createDueDate}
                onChange={(e) => setCreateDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-fg-muted">Tags</label>
              <Input
                value={createTags}
                onChange={(e) => setCreateTags(e.target.value)}
                placeholder="frontend, api"
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
