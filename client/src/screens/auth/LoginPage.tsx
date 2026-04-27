import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { AuthShell } from "./AuthShell";
import { Button, Input, Label } from "../../ui/components";
import { useAuth } from "../../auth/AuthContext";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  return (
    <AuthShell title="Sign in">
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await login(values);
            toast.success("Welcome back");
            navigate("/dashboard");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Login failed");
          }
        })}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="you@company.com" {...form.register("email")} />
          {form.formState.errors.email && <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="••••••••" {...form.register("password")} />
          {form.formState.errors.password && (
            <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-sm text-fg-muted">
          No account?{" "}
          <Link className="text-accent hover:underline" to="/register">
            Create one
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

