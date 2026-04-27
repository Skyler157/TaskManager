import { useAuth } from "../../auth/AuthContext";
import { Card } from "../../ui/components";

export function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-fg-muted">Your account details.</p>
      </div>

      <Card className="p-4">
        {!user ? (
          <div className="text-sm text-fg-muted">No user loaded.</div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-fg-muted">
              <span>Name</span>
              <span className="text-fg">{user.name}</span>
            </div>
            <div className="flex justify-between text-fg-muted">
              <span>Email</span>
              <span className="text-fg">{user.email}</span>
            </div>
            <div className="flex justify-between text-fg-muted">
              <span>Role</span>
              <span className="text-fg">{user.role}</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

