import { z } from "zod";

export type SortOrder = 1 | -1;

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

export function parseListQuery(
  query: unknown,
  allowedSortFields: readonly string[],
  defaultSort = "createdAt",
  defaultOrder: SortOrder = -1,
) {
  const { page, limit, skip } = parsePagination(query);
  const schema = z.object({
    sort: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
  });
  const parsed = schema.parse(query ?? {});
  const sortField =
    parsed.sort && allowedSortFields.includes(parsed.sort)
      ? parsed.sort
      : defaultSort;
  const sortOrder: SortOrder = parsed.order === "asc" ? 1 : defaultOrder;
  return { page, limit, skip, sort: { [sortField]: sortOrder } as Record<string, SortOrder> };
}

