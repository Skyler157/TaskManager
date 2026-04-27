import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { api } from "../../lib/api";
import { priorityBadgeClass } from "../../lib/taskUi";
import type { ApiResponse, Paginated, Project, Task, TaskStatus } from "../../types";
import { Card, Badge, Button } from "../../ui/components";
import { useAuth } from "../../auth/AuthContext";
import { CreateTaskModal } from "./CreateTaskModal";

const columns: Array<{ key: TaskStatus; title: string }> = [
  { key: "todo", title: "To do" },
  { key: "in_progress", title: "In progress" },
  { key: "review", title: "Review" },
  { key: "done", title: "Done" },
];

export function ProjectDetailPage() {
  const { id } = useParams();
  const projectId = id ?? "";
  const qc = useQueryClient();
  const { role } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = role === "admin" || role === "manager";

  const project = useQuery({
    queryKey: ["project", projectId],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Project>>(`/api/projects/${projectId}`);
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
  });

  const tasks = useQuery({
    queryKey: ["tasks", { projectId }],
    enabled: Boolean(projectId),
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<Task>>>(`/api/tasks?project=${projectId}&page=1&limit=200`);
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data.items;
    },
  });

  const updateTaskStatus = useMutation({
    mutationFn: async (args: { taskId: string; status: TaskStatus }) => {
      const res = await api.patch<ApiResponse<Task>>(`/api/tasks/${args.taskId}`, { status: args.status });
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["tasks", { projectId }] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update"),
  });

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { todo: [], in_progress: [], review: [], done: [] };
    for (const t of tasks.data ?? []) map[t.status].push(t);
    return map;
  }, [tasks.data]);

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const to = result.destination.droppableId as TaskStatus;
    const taskId = result.draggableId;
    const from = result.source.droppableId as TaskStatus;
    if (to === from) return;
    updateTaskStatus.mutate({ taskId, status: to });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-fg-muted">
            <Link className="hover:underline" to="/projects">
              Projects
            </Link>{" "}
            / {project.data?.title ?? "…"}
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{project.data?.title ?? "Project"}</h1>
          <p className="mt-1 text-sm text-fg-muted">{project.data?.description ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && project.data ? <Button onClick={() => setCreateOpen(true)}>New task</Button> : null}
          <Button variant="ghost" onClick={() => qc.invalidateQueries({ queryKey: ["tasks", { projectId }] })}>
            Refresh
          </Button>
        </div>
      </div>

      {(project.isLoading || tasks.isLoading) && <div className="text-sm text-fg-muted">Loading…</div>}
      {(project.isError || tasks.isError) && (
        <div className="text-sm text-red-400">{((project.error ?? tasks.error) as Error).message}</div>
      )}

      {tasks.data && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid gap-4 md:grid-cols-4">
            {columns.map((c) => (
              <Card key={c.key} className="p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-fg">{c.title}</div>
                  <span className="text-xs text-fg-muted">{grouped[c.key].length}</span>
                </div>
                <Droppable droppableId={c.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[120px] space-y-2 rounded-lg p-1 ${
                        snapshot.isDraggingOver ? "bg-white/5" : ""
                      }`}
                    >
                      {grouped[c.key].map((t, idx) => (
                        <Draggable key={t._id} draggableId={t._id} index={idx}>
                          {(dragProvided) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className="rounded-lg border border-border bg-bg-subtle p-3"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <Link to={`/tasks/${t._id}`} className="min-w-0">
                                  <div className="truncate text-sm font-medium text-fg">{t.title}</div>
                                  <div className="mt-1 truncate text-xs text-fg-muted">
                                    {t.assignedTo?.name ?? "Unassigned"}
                                  </div>
                                </Link>
                                <Badge color={priorityBadgeClass(t.priority)}>{t.priority}</Badge>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {grouped[c.key].length === 0 && (
                        <div className="rounded-lg border border-dashed border-border p-3 text-xs text-fg-muted">
                          Empty
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </Card>
            ))}
          </div>
        </DragDropContext>
      )}

      {project.data ? (
        <CreateTaskModal
          open={createOpen}
          project={project.data}
          onClose={() => setCreateOpen(false)}
          onCreated={() => void qc.invalidateQueries({ queryKey: ["tasks", { projectId }] })}
        />
      ) : null}
    </div>
  );
}
