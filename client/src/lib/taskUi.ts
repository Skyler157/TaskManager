import type { TaskPriority } from "../types";

export function priorityBadgeClass(priority: TaskPriority | string) {
  const map: Record<string, string> = {
    low: "bg-priority-low/15 text-priority-low border border-priority-low/30",
    medium: "bg-priority-medium/15 text-priority-medium border border-priority-medium/30",
    high: "bg-priority-high/15 text-priority-high border border-priority-high/30",
    urgent: "bg-priority-urgent/15 text-priority-urgent border border-priority-urgent/30",
  };
  return map[priority] ?? "bg-white/10 text-fg border border-border";
}

