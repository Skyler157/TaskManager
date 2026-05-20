import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { api } from "../../lib/api";
import type { ApiResponse, Paginated, Role, User } from "../../types";
import { Badge, Button, Card, Select } from "../../ui/components";

function roleColor(role: Role) {
  const map: Record<Role, string> = {
    admin: "bg-accent/20 text-accent border border-accent/40",
    manager: "bg-purple-400/15 text-purple-200 border border-purple-400/30",
    employee: "bg-white/10 text-fg border border-border",
  };
  return map[role];
}

export function AdminUsersPage() {
  const qc = useQueryClient();
  const [roleEdits, setRoleEdits] = useState<Record<string, Role>>({});

  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Paginated<User>>>("/api/users?page=1&limit=100");
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data.items;
    },
  });

  const updateRole = useMutation({
    mutationFn: async (args: { id: string; role: Role }) => {
      const res = await api.patch<ApiResponse<User>>(`/api/users/${args.id}/role`, { role: args.role });
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
    onSuccess: async () => {
      toast.success("Role updated");
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete<ApiResponse<boolean>>(`/api/users/${id}`);
      if (!res.data.success) throw new Error(res.data.message);
      return true;
    },
    onSuccess: async () => {
      toast.success("User deleted");
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-fg-muted">User management (admin-only).</p>
      </div>

      {users.isLoading && <div className="text-sm text-fg-muted">Loading…</div>}
      {users.isError && <div className="text-sm text-red-400">{(users.error as Error).message}</div>}

      {users.data && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-bg-subtle text-xs text-fg-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.data.map((u) => {
                  const nextRole = roleEdits[u.id] ?? u.role;
                  return (
                    <tr key={u.id} className="border-t border-border">
                      <td className="px-4 py-3 text-fg">{u.name}</td>
                      <td className="px-4 py-3 text-fg-muted">{u.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Badge color={roleColor(u.role)}>{u.role}</Badge>
                          <Select
                            className="h-9 w-auto px-2"
                            value={nextRole}
                            onChange={(e) =>
                              setRoleEdits((prev) => ({ ...prev, [u.id]: e.target.value as Role }))
                            }
                          >
                            <option value="admin">admin</option>
                            <option value="manager">manager</option>
                            <option value="employee">employee</option>
                          </Select>
                          <Button
                            variant="ghost"
                            onClick={() => updateRole.mutate({ id: u.id, role: nextRole })}
                            disabled={updateRole.isPending || nextRole === u.role}
                          >
                            Save
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="danger"
                          onClick={() => deleteUser.mutate(u.id)}
                          disabled={deleteUser.isPending}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
