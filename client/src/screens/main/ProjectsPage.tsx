import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import type { ApiResponse, Paginated, Project } from "../../types";
import { useAuth } from "../../auth/AuthContext";
import { Button, Card, Input, Label, Modal, Textarea } from "../../ui/components";

export function ProjectsPage() {
  const { role } = useAuth();
  const canCreate = role === "admin" || role === "manager";
  const qc = useQueryClient();

  const projects = useQuery({
    queryKey: ["projects", { page: 1 }],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<Project>>>("/api/projects?page=1&limit=50");
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data.items;
    },
  });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createProject = useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<Project>>("/api/projects", { title, description, memberIds: [] });
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
    onSuccess: async () => {
      toast.success("Project created");
      setOpen(false);
      setTitle("");
      setDescription("");
      await qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create"),
  });

  const content = useMemo(() => projects.data ?? [], [projects.data]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="mt-1 text-sm text-fg-muted">Your accessible projects (role-filtered).</p>
        </div>
        {canCreate && (
          <Button onClick={() => setOpen(true)} className="shrink-0">
            New project
          </Button>
        )}
      </div>

      {projects.isLoading && <div className="text-sm text-fg-muted">Loading…</div>}
      {projects.isError && <div className="text-sm text-red-400">{(projects.error as Error).message}</div>}
      {!projects.isLoading && content.length === 0 && <div className="text-sm text-fg-muted">No projects yet.</div>}

      <div className="grid gap-4 md:grid-cols-2">
        {content.map((p) => (
          <Card key={p._id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-lg font-semibold text-fg">{p.title}</div>
                <div className="mt-1 line-clamp-2 text-sm text-fg-muted">{p.description || "—"}</div>
              </div>
              <span className="rounded-full border border-border bg-white/5 px-2 py-0.5 text-xs text-fg-muted">
                {p.status}
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-fg-muted">{p.members?.length ?? 0} members</span>
              <Link className="text-sm text-accent hover:underline" to={`/projects/${p._id}`}>
                Open
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={open}
        title="Create project"
        description="Managers/Admins can create projects."
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => createProject.mutate()} disabled={!title || createProject.isPending}>
              {createProject.isPending ? "Creating…" : "Create"}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
