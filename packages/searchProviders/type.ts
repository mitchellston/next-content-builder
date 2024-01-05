export type SearchProvider = {
  search: (
    query: object,
    returnValues: object,
    selector: (
      | { mode: "infinite"; cursor?: string | number }
      | { mode: "pagination"; page?: number }
    ) & {
      ammount: number;
    }
  ) => Promise<{ nextCursor: string | number | null; data: object[] } | null>;
  getPageAmount: (query: object) => Promise<number>;
};
