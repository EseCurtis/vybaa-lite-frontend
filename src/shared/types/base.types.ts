export type PaginateQuery<T> = {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
  };
};

export type PaginatedQueryParams<T> = T & {
  search?: string;
  page?: number;
  limit?: number;
};
