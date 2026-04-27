import React from "react";
import { cn } from "./cn";

export function Card(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("rounded-xl border border-border bg-bg-elevated shadow-soft", props.className)} />;
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" },
) {
  const { variant = "primary", className, ...rest } = props;
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    primary: "bg-accent text-white hover:bg-accent/90",
    ghost: "bg-transparent text-fg hover:bg-white/5 border border-border",
    danger: "bg-red-500 text-white hover:bg-red-500/90",
  };
  return <button {...rest} className={cn(base, variants[variant], className)} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-bg-subtle px-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent/40",
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
        "w-full rounded-lg border border-border bg-bg-subtle px-3 py-2 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent/40",
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
        "h-10 w-full rounded-lg border border-border bg-bg-subtle px-3 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent/40",
        props.className,
      )}
    />
  );
}

export function Label(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cn("text-sm font-medium text-fg", props.className)} />;
}

export function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", color)}>
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
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="w-full max-w-lg p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-fg">{title}</div>
            {description ? <div className="text-sm text-fg-muted">{description}</div> : null}
          </div>
          <Button variant="ghost" onClick={onClose} type="button">
            Close
          </Button>
        </div>
        <div className="mt-4">{children}</div>
        {footer ? <div className="mt-4 flex items-center justify-end gap-2">{footer}</div> : null}
      </Card>
    </div>
  );
}
