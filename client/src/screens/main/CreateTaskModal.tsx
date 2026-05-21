import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { ApiResponse, Paginated, Project, Task, TaskPriority, User } from "../../types";
import { api } from "../../lib/api";
import { Button, Input, Label, Modal, Select, Textarea } from "../../ui/components";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedToId: z.string().min(1, "Pick an assignee"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateTaskModal({
  open,
  project,
  onClose,
  onCreated,
}: {
  open: boolean;
  project: Project;
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const employees = useQuery({
    queryKey: ["users", "employees"],
    enabled: open,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<User>>>("/api/users?role=employee&page=1&limit=100");
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data.items;
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      assignedToId: "",
      priority: "medium",
      dueDate: "",
      tags: "",
    },
  });

  const createTask = useMutation({
    mutationFn: async (values: FormValues) => {
      const tags = (values.tags ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = {
        title: values.title,
        description: values.description ?? "",
        projectId: project._id,
        assignedToId: values.assignedToId,
        priority: values.priority as TaskPriority,
        ...(values.dueDate ? { dueDate: values.dueDate } : {}),
        ...(tags.length ? { tags } : {}),
      };
      const res = await api.post<ApiResponse<Task>>("/api/tasks", payload);
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
    onSuccess: (task) => {
      toast.success("Task created");
      form.reset();
      onCreated(task);
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to create task"),
  });

  return (
    <Modal
      open={open}
      title="Create task"
      description="Add a new task to this project."
      onClose={() => {
        form.reset();
        onClose();
      }}
      footer={
        <>
          <Button
            variant="ghost"
            type="button"
            onClick={() => {
              form.reset();
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button type="button" onClick={form.handleSubmit((v) => createTask.mutate(v))} disabled={createTask.isPending}>
            {createTask.isPending ? "Creating…" : "Create"}
          </Button>
        </>
      }
    >
      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="e.g. Build landing page" {...form.register("title")} />
          {form.formState.errors.title ? <p className="text-xs text-red-400">{form.formState.errors.title.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={3} placeholder="Optional details…" {...form.register("description")} />
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="assignedToId">Assignee</Label>
            <Select id="assignedToId" {...form.register("assignedToId")}>
              <option value="">{employees.isLoading ? "Loading…" : "Select assignee"}</option>
              {(employees.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </Select>
            {form.formState.errors.assignedToId ? (
              <p className="text-xs text-red-400">{form.formState.errors.assignedToId.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" {...form.register("priority")}>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" type="date" {...form.register("dueDate")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <Input id="tags" placeholder="frontend, api" {...form.register("tags")} />
          <div className="text-xs text-fg-muted">Comma-separated.</div>
        </div>
      </form>
    </Modal>
  );
}
