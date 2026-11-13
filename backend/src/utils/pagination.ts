export type PaginationInput = {
  page: number;
  pageSize: number;
};

export function getPaginationMeta(total: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export function getSkipTake({ page, pageSize }: PaginationInput) {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}
