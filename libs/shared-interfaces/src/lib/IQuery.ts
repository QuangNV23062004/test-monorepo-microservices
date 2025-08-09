export interface IQuery {
  page: number;
  size: number;
  search?: string;
  searchField?: string;
  order?: 'asc' | 'desc';
  sortBy?: string;
  options?: Record<string, any>;
}
