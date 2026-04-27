import { z } from "zod";

export function parsePagination(query: unknown) {
  const schema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  });
  const { page, limit } = schema.parse(query ?? {});
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

