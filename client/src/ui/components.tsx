import React from "react";
import { cn } from "./cn";

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-xl border border-border bg-bg-elevated shadow-soft transition-all duration-200 hover:shadow-lg",
        props.className,
      )}
    />
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("border-b border-border px-4 py-3", className)}>{children}</div>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-4", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-lg font-semibold text-fg", className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm text-fg-muted", className)}>{children}</p>;
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "outline"; size?: "sm" | "md" | "lg" },
) {
  const { variant = "primary", size = "md", className, ...rest } = props;
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:pointer-events-none";
  const sizes: Record<string, string> = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-2.5 text-base",
  };
  const variants: Record<string, string> = {
    primary: "bg-accent text-white hover:bg-accent/90 shadow-md",
    ghost: "bg-transparent text-fg hover:bg-white/5 border border-border",
    danger: "bg-red-500 text-white hover:bg-red-600 shadow-md",
    outline: "border border-border bg-transparent text-fg hover:bg-white/5",
  };
  return <button {...rest} className={cn(base, sizes[size], variants[variant], className)} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-bg-subtle px-3 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40",
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40",
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-bg-subtle px-3 text-sm text-fg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40",
        props.className,
      )}
    />
  );
}

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cn("text-sm font-medium text-fg", props.className)} />;
}

export function Badge({
  color,
  variant = "default",
  children,
}: {
  color: string;
  variant?: "default" | "outline";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "outline" && "border border-current",
        color,
      )}
    >
      {children}
    </span>
  );
}

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "default",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "default" | "lg";
}) {
  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-md",
    default: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className={cn("w-full", sizeClasses[size], "p-5")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-fg">{title}</div>
            {description ? <div className="text-sm text-fg-muted">{description}</div> : null}
          </div>
          <Button variant="ghost" onClick={onClose} type="button" className="shrink-0">
            ×
          </Button>
        </div>
        <div className="mt-4">{children}</div>
        {footer ? <div className="mt-4 flex items-center justify-end gap-2">{footer}</div> : null}
      </Card>
    </div>
  );
}

export function Avatar({
  src,
  alt,
  name,
  size = "md",
  className,
}: {
  src?: string;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  if (src) {
    return <img src={src} alt={alt} className={cn("rounded-full object-cover", sizeClasses[size], className)} />;
  }

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-2 font-medium text-white",
        sizeClasses[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendUp = true,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-fg-muted">{label}</div>
          <div className="mt-1 text-2xl font-bold text-fg">{value}</div>
          {trend && (
            <div className={cn("mt-1 text-xs", trendUp ? "text-green-400" : "text-red-400")}>{trend}</div>
          )}
        </div>
        {icon && <div className="text-accent opacity-60">{icon}</div>}
      </div>
    </Card>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-white/10", className)} />;
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };
  return (
    <div
      className={cn("animate-spin rounded-full border-2 border-accent border-t-transparent", sizeClasses[size])}
    />
  );
}
