export type DatabaseProvider = {
  getFullContent: (id: string | number) => Promise<object | null>;
  createContent: (values: object) => Promise<Error | string | number>;
  editContent: (id: string | number, values: object) => Promise<Error | true>;
  deleteContent: (id: string | number) => Promise<Error | true>;
  getContentId: (filter: unknown) => Promise<string | number | null>;
};
