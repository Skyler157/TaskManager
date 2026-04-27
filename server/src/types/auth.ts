import type { Role } from "./roles";

export type AuthUser = {
  userId: string;
  role: Role;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

