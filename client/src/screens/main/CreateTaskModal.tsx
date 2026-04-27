import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import type { ApiResponse, Project, Task, TaskPriority } from "../../types";
import { api } from "../../lib/api";
import { Button, Input, Label, Modal, Select, Textarea } from "../../ui/components";

function userId(u: Project["members"][number]) {
  const anyUser = u as { id?: string; _id?: string };
  return anyUser.id ?? anyUser._id ?? "";
}

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedToId: z.string().min(1, "Pick an assignee"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  dueDate: z.string().optional(),
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
  const members = useMemo(() => project.members ?? [], [project.members]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      assignedToId: members.length ? userId(members[0]) : "",
      priority: "medium",
      dueDate: "",
    },
  });

  const createTask = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        title: values.title,
        description: values.description ?? "",
        projectId: project._id,
        assignedToId: values.assignedToId,
        priority: values.priority as TaskPriority,
        ...(values.dueDate ? { dueDate: values.dueDate } : {}),
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
              {members.map((m) => (
                <option key={userId(m)} value={userId(m)}>
                  {m.name} ({m.email})
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
      </form>
    </Modal>
  );
}
