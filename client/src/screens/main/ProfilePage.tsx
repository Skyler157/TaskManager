import { useAuth } from "../../auth/AuthContext";
import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle } from "../../ui/components";
import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";

export function ProfilePage() {
  const { user, logout } = useAuth();

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
            <div className="flex items-center gap-6">
              <Avatar name={user.name} size="lg" className="h-20 w-20 text-lg" />
              <div className="space-y-1">
                <div className="text-xl font-semibold text-fg">{user.name}</div>
                <div className="text-sm text-fg-muted">{user.email}</div>
                <Badge color="bg-accent/15 text-accent border border-accent/30" variant="outline">
                  {user.role}
                </Badge>
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

