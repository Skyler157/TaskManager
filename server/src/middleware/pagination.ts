import { z } from "zod";

export function parsePagination(query: unknown) {
  const num = (fallback: number) =>
    z.preprocess(
      (v) => (v === "" || v === null ? undefined : v),
      z.coerce.number().int().positive().default(fallback),
    );

  const schema = z.object({
    page: num(1),
    limit: num(20).pipe(z.number().max(100)),
  });
  const { page, limit } = schema.parse(query ?? {});
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

