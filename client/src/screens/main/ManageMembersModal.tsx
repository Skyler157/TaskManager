import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import type { ApiResponse, Paginated, Project, User } from "../../types";
import { Button, Input, Modal, Select } from "../../ui/components";

export function ManageMembersModal({
  open,
  project,
  onClose,
  onUpdated,
}: {
  open: boolean;
  project: Project;
  onClose: () => void;
  onUpdated: (project: Project) => void;
}) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"" | User["role"]>("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set((project.members ?? []).map((m) => m._id)));
  const lockedId = project.createdBy?._id;

  const users = useQuery({
    queryKey: ["users", "all"],
    enabled: open,
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<User>>>("/api/users?page=1&limit=100");
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data.items;
    },
  });

  const filtered = useMemo(() => {
    const items = users.data ?? [];
    const needle = q.trim().toLowerCase();
    const roleFiltered = role ? items.filter((u) => u.role === role) : items;
    if (!needle) return roleFiltered;
    return roleFiltered.filter((u) => `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(needle));
  }, [users.data, q, role]);

  const save = useMutation({
    mutationFn: async () => {
      const memberIds = Array.from(selected);
      const res = await api.patch<ApiResponse<Project>>(`/api/projects/${project._id}`, { memberIds });
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
    onSuccess: (updated) => {
      toast.success("Members updated");
      onUpdated(updated);
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update members"),
  });

  return (
    <Modal
      open={open}
      title="Project members"
      description="Select who should have access to this project."
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users…" />
          </div>
          <Select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            <option value="">All roles</option>
            <option value="admin">admin</option>
            <option value="manager">manager</option>
            <option value="employee">employee</option>
          </Select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="text-fg-muted">
            Selected: <span className="text-fg">{selected.size}</span>
            {lockedId ? (
              <span className="ml-2 text-xs text-fg-muted">(owner always included)</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                const employeeIds = (users.data ?? []).filter((u) => u.role === "employee").map((u) => u.id);
                setSelected((prev) => {
                  const next = new Set(prev);
                  for (const id of employeeIds) next.add(id);
                  if (lockedId) next.add(lockedId);
                  return next;
                });
              }}
            >
              Add all employees
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setSelected(() => {
                  const next = new Set<string>();
                  if (lockedId) next.add(lockedId);
                  return next;
                });
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        {users.isLoading ? <div className="text-sm text-fg-muted">Loading users…</div> : null}
        {users.isError ? <div className="text-sm text-red-400">{(users.error as Error).message}</div> : null}

        <div className="max-h-[360px] overflow-auto rounded-lg border border-border">
          {(filtered ?? []).map((u) => {
            const checked = selected.has(u.id);
            const isLocked = Boolean(lockedId && u.id === lockedId);
            return (
              <label key={u.id} className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isLocked}
                  onChange={(e) => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(u.id);
                      else if (!isLocked) next.delete(u.id);
                      return next;
                    });
                  }}
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-fg">{u.name}</div>
                  <div className="truncate text-xs text-fg-muted">{u.email}</div>
                </div>
                <div className="ml-auto text-xs text-fg-muted">{u.role}</div>
              </label>
            );
          })}
          {users.data && filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-fg-muted">No matches.</div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
