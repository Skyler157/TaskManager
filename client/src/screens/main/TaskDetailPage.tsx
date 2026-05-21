import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { priorityBadgeClass, statusColor } from "../../lib/taskUi";
import type { ApiResponse, Paginated, Task, TaskPriority, TaskStatus, User as UserType } from "../../types";
import {
  Avatar,
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
import { ArrowLeft, MessageSquare, Clock, User, Calendar, Trash2, Pencil } from "lucide-react";
import { cn } from "../../ui/cn";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../../auth/AuthContext";

export function TaskDetailPage() {
  const { id } = useParams();
  const taskId = id ?? "";
  const qc = useQueryClient();
  const [comment, setComment] = useState("");
  const { role } = useAuth();
  const canEdit = role === "admin" || role === "manager";
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<TaskPriority>("medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editAssigneeId, setEditAssigneeId] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editEstimatedHours, setEditEstimatedHours] = useState("");
  const [editLoggedHours, setEditLoggedHours] = useState("");

  const task = useQuery({
    queryKey: ["task", taskId],
    enabled: Boolean(taskId),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Task>>(`/api/tasks/${taskId}`);
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: TaskStatus) => {
      const res = await api.patch<ApiResponse<Task>>(`/api/tasks/${taskId}`, { status });
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
    onSuccess: async () => {
      toast.success("Updated");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["task", taskId] }),
        qc.invalidateQueries({ queryKey: ["tasks"] }),
      ]);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<Task>>(`/api/tasks/${taskId}/comments`, { text: comment });
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
    onSuccess: async () => {
      setComment("");
      toast.success("Comment added");
      await qc.invalidateQueries({ queryKey: ["task", taskId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const t = task.data;

  const employees = useQuery({
    queryKey: ["users", "employees"],
    enabled: editOpen && canEdit,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<UserType>>>("/api/users?role=employee&page=1&limit=100");
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data.items;
    },
  });

  const updateTask = useMutation({
    mutationFn: async () => {
      const tags = editTags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload: Record<string, unknown> = {
        title: editTitle.trim(),
        description: editDescription,
        priority: editPriority,
        ...(editAssigneeId ? { assignedToId: editAssigneeId } : {}),
        ...(editDueDate ? { dueDate: editDueDate } : {}),
        ...(tags.length ? { tags } : { tags: [] }),
      };
      if (editEstimatedHours.trim() !== "") {
        const n = Number(editEstimatedHours);
        if (!Number.isNaN(n)) payload.estimatedHours = n;
      }
      if (editLoggedHours.trim() !== "") {
        const n = Number(editLoggedHours);
        if (!Number.isNaN(n)) payload.loggedHours = n;
      }

      const res = await api.patch<ApiResponse<Task>>(`/api/tasks/${taskId}`, payload);
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
    onSuccess: async () => {
      toast.success("Task updated");
      setEditOpen(false);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["task", taskId] }),
        qc.invalidateQueries({ queryKey: ["tasks"] }),
      ]);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update task"),
  });

  const deleteTask = useMutation({
    mutationFn: async () => {
      const res = await api.delete<ApiResponse<boolean>>(`/api/tasks/${taskId}`);
      if (!res.data.success) throw new Error(res.data.message);
      return true;
    },
    onSuccess: async () => {
      toast.success("Task deleted");
      setDeleteOpen(false);
      await qc.invalidateQueries({ queryKey: ["tasks"] });
      window.history.back();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to delete task"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/tasks" className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
          Back to Tasks
        </Link>
      </div>

      {task.isLoading && <Skeleton className="h-96 w-full" />}
      {task.isError && <div className="text-sm text-red-400">{(task.error as Error).message}</div>}

      {t && (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main Content */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-semibold text-fg">{t.title}</h1>
                    <p className="mt-2 text-sm text-fg-muted">{t.description || "No description provided."}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color={priorityBadgeClass(t.priority)}>{t.priority}</Badge>
                    {canEdit ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setEditTitle(t.title);
                            setEditDescription(t.description ?? "");
                            setEditPriority(t.priority);
                            setEditDueDate(t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : "");
                            setEditAssigneeId(t.assignedTo?._id ?? "");
                            setEditTags((t.tags ?? []).join(", "));
                            setEditEstimatedHours(typeof t.estimatedHours === "number" ? String(t.estimatedHours) : "");
                            setEditLoggedHours(typeof t.loggedHours === "number" ? String(t.loggedHours) : "");
                            setEditOpen(true);
                          }}
                          title="Edit task"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" onClick={() => setDeleteOpen(true)} title="Delete task">
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Metadata */}
                <div className="mb-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-fg-muted">
                    <Clock className="h-4 w-4" />
                    <span>Status: </span>
                    <span className={cn(statusColor(t.status), "font-medium")} data-testid="task-status">
                      {t.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-fg-muted">
                    <User className="h-4 w-4" />
                    <span>Assignee: {t.assignedTo?.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-fg-muted">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "No due date"}
                    </span>
                  </div>
                </div>

                {(t.tags?.length ?? 0) > 0 ? (
                  <div className="mb-6 flex flex-wrap gap-2">
                    {(t.tags ?? []).map((tag) => (
                      <span key={tag} className="rounded-full border border-border bg-white/5 px-2 py-0.5 text-xs text-fg-muted">
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Status Update */}
                <div className="mb-6">
                  <div className="mb-2 text-xs text-fg-muted">Update Status</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(["todo", "in_progress", "review", "done"] as TaskStatus[]).map((s) => (
                      <Button
                        key={s}
                        variant={t.status === s ? "primary" : "ghost"}
                        onClick={() => updateStatus.mutate(s)}
                        disabled={updateStatus.isPending}
                        className="text-xs"
                      >
                        {s.replace("_", " ")}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div className="border-t border-border pt-4">
                  <div className="mb-3 text-sm font-medium text-fg">
                    <MessageSquare className="inline h-4 w-4 mr-1" />
                    Comments ({t.comments?.length ?? 0})
                  </div>
                  <div className="space-y-3">
                    {t.comments?.map((c, idx) => (
                      <div key={idx} className="rounded-lg border border-border bg-bg-subtle p-3">
                        <div className="flex items-center gap-2 text-xs">
                          <Avatar name={c.author?.name} size="sm" />
                          <span className="font-medium text-fg">{c.author?.name}</span>
                          <span className="text-fg-muted">
                            {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ""}
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-fg">{c.text}</div>
                      </div>
                    ))}
                    {(!t.comments || t.comments.length === 0) && (
                      <div className="text-sm text-fg-muted">No comments yet.</div>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="mt-4 flex gap-2">
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment…"
                      rows={2}
                      className="flex-1"
                    />
                    <Button onClick={() => addComment.mutate()} disabled={!comment || addComment.isPending}>
                      {addComment.isPending ? "…" : "Post"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project</CardTitle>
              </CardHeader>
              <CardContent>
                <Link to={`/projects/${t.project?._id}`} className="text-accent hover:underline">
                  {t.project?.title}
                </Link>
                <div className="mt-2 text-xs text-fg-muted">Status: {t.project?.status}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-fg-muted">
                    <span>Created</span>
                    <span>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "-"}</span>
                  </div>
                  <div className="flex justify-between text-fg-muted">
                    <span>Updated</span>
                    <span>{t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : "-"}</span>
                  </div>
                  {t.completedAt && (
                    <div className="flex justify-between text-green-400">
                      <span>Completed</span>
                      <span>{new Date(t.completedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Modal
        open={editOpen}
        title="Edit task"
        description="Update details for this task."
        onClose={() => setEditOpen(false)}
        size="lg"
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => updateTask.mutate()}
              disabled={!editTitle.trim() || updateTask.isPending}
            >
              {updateTask.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs text-fg-muted">Title</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-fg-muted">Priority</label>
              <Select value={editPriority} onChange={(e) => setEditPriority(e.target.value as TaskPriority)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-fg-muted">Description</label>
            <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={4} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs text-fg-muted">Due date</label>
              <Input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-fg-muted">Assignee</label>
              <Select
                value={editAssigneeId}
                onChange={(e) => setEditAssigneeId(e.target.value)}
                disabled={employees.isLoading || employees.isError}
              >
                <option value="">
                  {employees.isLoading ? "Loading…" : "Select assignee"}
                </option>
                {(employees.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <label className="text-xs text-fg-muted">Estimated hours</label>
              <Input
                inputMode="decimal"
                value={editEstimatedHours}
                onChange={(e) => setEditEstimatedHours(e.target.value)}
                placeholder="e.g. 3"
              />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <label className="text-xs text-fg-muted">Logged hours</label>
              <Input
                inputMode="decimal"
                value={editLoggedHours}
                onChange={(e) => setEditLoggedHours(e.target.value)}
                placeholder="e.g. 1.5"
              />
            </div>
            <div className="space-y-2 sm:col-span-1">
              <label className="text-xs text-fg-muted">Tags</label>
              <Input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="frontend, api" />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        title="Delete task?"
        description="This action cannot be undone."
        onClose={() => setDeleteOpen(false)}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" type="button" onClick={() => deleteTask.mutate()} disabled={deleteTask.isPending}>
              {deleteTask.isPending ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      >
        <div className="text-sm text-fg-muted">Delete “{t?.title ?? "this task"}”?</div>
      </Modal>
    </div>
  );
}
