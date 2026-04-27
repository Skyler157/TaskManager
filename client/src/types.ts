export type Role = "admin" | "manager" | "employee";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type ApiOk<T> = { success: true; data: T; message?: string };
export type ApiFail = { success: false; data: null; message: string; errors?: unknown };
export type ApiResponse<T> = ApiOk<T> | ApiFail;

export type Paginated<T> = { items: T[]; page: number; limit: number; total: number };

export type Project = {
  _id: string;
  title: string;
  description?: string;
  status: "active" | "archived";
  createdBy: Pick<User, "id" | "name" | "email" | "role"> | { _id: string; name: string; email: string; role: Role };
  members: Array<Pick<User, "id" | "name" | "email" | "role"> | { _id: string; name: string; email: string; role: Role }>;
  createdAt: string;
  updatedAt: string;
};

export type TaskStatus = "todo" | "in_progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskComment = {
  author: { _id: string; name: string; email: string; role: Role };
  text: string;
  createdAt: string;
};

export type Task = {
  _id: string;
  title: string;
  description?: string;
  project: { _id: string; title: string; status: "active" | "archived" };
  assignedTo: { _id: string; name: string; email: string; role: Role };
  createdBy: { _id: string; name: string; email: string; role: Role };
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  comments?: TaskComment[];
  createdAt: string;
  updatedAt: string;
};

