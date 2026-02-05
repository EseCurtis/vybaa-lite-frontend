export type PaginateQuery<T> = {
  data: T[];
  pagination: {
    page: number
    limit: number
    totalCount: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  };
};

export type PaginatedQueryParams<T> = T & {
  search?: string;
  page?: number;
  limit?: number;
};
