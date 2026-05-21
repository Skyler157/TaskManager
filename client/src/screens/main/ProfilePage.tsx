import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../auth/AuthContext";
import { api } from "../../lib/api";
import type { ApiResponse, User } from "../../types";
import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from "../../ui/components";
import { LogOut, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

export function ProfilePage() {
  const { user, logout, updateLocalUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user loaded");
      const payload: Partial<Pick<User, "name">> = { name: name.trim() };
      const res = await api.patch<ApiResponse<User>>(`/api/users/${user.id}`, payload);
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
    onSuccess: (updated) => {
      updateLocalUser(updated);
      toast.success("Profile updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update profile"),
  });

  const refresh = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No user loaded");
      const res = await api.get<ApiResponse<User>>(`/api/users/${user.id}`);
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
    onSuccess: (fresh) => {
      updateLocalUser(fresh);
      setName(fresh.name ?? "");
      toast.success("Profile refreshed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to refresh profile"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-fg-muted">Manage your account settings and preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          {!user ? (
            <div className="text-sm text-fg-muted">No user loaded.</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-[220px_1fr]">
              <div className="flex flex-col items-center gap-3">
                <Avatar src={user.avatar || undefined} name={user.name} size="lg" className="h-20 w-20 text-lg" />
                <Badge color="bg-accent/15 text-accent border border-accent/30" variant="outline">
                  {user.role}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-fg-muted">{user.email}</div>
                    <div className="truncate text-xs text-fg-muted">User ID: {user.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => refresh.mutate()}
                      disabled={refresh.isPending}
                      title="Refresh from server"
                    >
                      <RefreshCw className="h-4 w-4" />
                      {refresh.isPending ? "…" : "Refresh"}
                    </Button>
                    <Button
                      onClick={() => save.mutate()}
                      disabled={save.isPending || !name.trim() || name.trim() === user.name}
                      title="Save profile"
                    >
                      {save.isPending ? "Saving…" : "Save changes"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-fg">Sign out</div>
              <div className="text-xs text-fg-muted">End your current session</div>
            </div>
            <Button variant="danger" onClick={() => logout()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
          <div className="border-t border-border pt-4">
            <Link to="/dashboard" className="text-sm text-accent hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
