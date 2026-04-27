export const roles = ["admin", "manager", "employee"] as const;
export type Role = (typeof roles)[number];

