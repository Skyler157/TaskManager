import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { priorityBadgeClass } from "../../lib/taskUi";
import type { ApiResponse, Task, TaskStatus } from "../../types";
import { Badge, Button, Card, Textarea } from "../../ui/components";
import { useAuth } from "../../auth/AuthContext";

export function TaskDetailPage() {
  const { id } = useParams();
  const taskId = id ?? "";
  const qc = useQueryClient();
  const { role } = useAuth();
  const [comment, setComment] = useState("");

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

  return (
    <div className="space-y-6">
      <div className="text-sm text-fg-muted">
        <Link className="hover:underline" to="/tasks">
          Tasks
        </Link>{" "}
        / {t?.title ?? "…"}
      </div>

      {task.isLoading && <div className="text-sm text-fg-muted">Loading…</div>}
      {task.isError && <div className="text-sm text-red-400">{(task.error as Error).message}</div>}

      {t && (
        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold">{t.title}</h1>
                <p className="mt-2 text-sm text-fg-muted">{t.description || "—"}</p>
              </div>
              <Badge color={priorityBadgeClass(t.priority)}>{t.priority}</Badge>
            </div>

            <div className="mt-4 space-y-2">
              <div className="text-xs text-fg-muted">Comments</div>
              <div className="space-y-2">
                {(t.comments ?? []).map((c, idx) => (
                  <div key={idx} className="rounded-lg border border-border bg-bg-subtle p-3">
                    <div className="text-xs text-fg-muted">{c.author?.name ?? "Unknown"}</div>
                    <div className="mt-1 text-sm text-fg">{c.text}</div>
                  </div>
                ))}
                {(t.comments ?? []).length === 0 && <div className="text-sm text-fg-muted">No comments yet.</div>}
              </div>

              <div className="mt-3 flex gap-2">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment…"
                  rows={2}
                />
                <Button onClick={() => addComment.mutate()} disabled={!comment || addComment.isPending}>
                  {addComment.isPending ? "…" : "Post"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-semibold text-fg">Details</div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-fg-muted">
                <span>Project</span>
                <span className="text-fg">{t.project?.title}</span>
              </div>
              <div className="flex justify-between text-fg-muted">
                <span>Assignee</span>
                <span className="text-fg">{t.assignedTo?.name}</span>
              </div>
              <div className="flex justify-between text-fg-muted">
                <span>Status</span>
                <span className="text-fg">{t.status}</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-xs text-fg-muted">Update status</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["todo", "in_progress", "review", "done"] as TaskStatus[]).map((s) => (
                  <Button
                    key={s}
                    variant={t.status === s ? "primary" : "ghost"}
                    onClick={() => updateStatus.mutate(s)}
                    disabled={updateStatus.isPending || (role === "employee" && t.status === s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
