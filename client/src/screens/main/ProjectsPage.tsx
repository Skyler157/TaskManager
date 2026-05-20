import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import type { ApiResponse, Paginated, Project } from "../../types";
import { useAuth } from "../../auth/AuthContext";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Modal,
  Skeleton,
  Textarea,
} from "../../ui/components";
import { Plus, Users } from "lucide-react";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="mt-1 text-sm text-fg-muted">Organize your work into collaborative projects.</p>
        </div>
        {canCreate && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {projects.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      )}
      {projects.isError && <div className="text-sm text-red-400">{(projects.error as Error).message}</div>}
      {!projects.isLoading && content.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-fg-muted">No projects yet.</p>
          {canCreate && (
            <Button variant="ghost" className="mt-2" onClick={() => setOpen(true)}>
              Create your first project
            </Button>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {content.map((p) => {
          const statusColors = {
            active: "text-priority-low",
            planning: "text-accent",
            on_hold: "text-priority-medium",
            completed: "text-priority-low",
            archived: "text-fg-muted",
          };
          return (
            <Card key={p._id} className="transition-all duration-200 hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="line-clamp-1">{p.title}</CardTitle>
                  <span className={`text-xs font-medium ${statusColors[p.status as keyof typeof statusColors]}`}>
                    {p.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-fg-muted line-clamp-2 min-h-[2.5rem]">
                  {p.description || "No description provided."}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-fg-muted">
                    <Users className="h-3 w-3" />
                    {p.members?.length ?? 0} members
                  </div>
                  <Link className="font-medium text-accent hover:underline" to={`/projects/${p._id}`}>
                    Open
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Modal
        open={open}
        title="Create Project"
        description="Start a new project to organize your team's work."
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
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project name" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
