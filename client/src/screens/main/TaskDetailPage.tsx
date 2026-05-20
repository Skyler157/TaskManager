import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import { priorityBadgeClass, statusColor } from "../../lib/taskUi";
import type { ApiResponse, Task, TaskStatus } from "../../types";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Textarea, Skeleton, Avatar } from "../../ui/components";
import { ArrowLeft, MessageSquare, Clock, User, Calendar } from "lucide-react";
import { cn } from "../../ui/cn";
import { formatDistanceToNow } from "date-fns";

export function TaskDetailPage() {
  const { id } = useParams();
  const taskId = id ?? "";
  const qc = useQueryClient();
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
                  <Badge color={priorityBadgeClass(t.priority)}>{t.priority}</Badge>
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
    </div>
  );
}
