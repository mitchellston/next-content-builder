import "server-only";

export const contentType = <T extends object>(
  name: string,
  values: {
    [Key in keyof T]: Value<T, Key>;
  },
  databaseProvider: DatabaseProvider,
  searchProvider: SearchProvider,
  middlewares?: Middleware
) => ({
  name,
  values,
  databaseProvider,
  searchProvider,
  middlewares,
});

export type ContentType = ReturnType<typeof contentType>;

export type Value<T, Key extends keyof T> =
  | {
      /**
       * This type comes from the clients form input
       */
      type: "client-value";
      /**
       * Validate the input (You can also manipulate the input here, to make sure it's in the right format)
       *
       * **What this function returns gets stored in the database**
       */
      validate: (
        value: unknown,
        /** When a user is editing content this will contain data */
        info: { oldValue: unknown; contentId: string | number | null } | null
      ) => T[Key];
      /**
       * The maximum and minimum number of times this input can be used
       *
       * ``Important:`` If you set this to a string, the string will be thrown as an error if the user tries to use this input more than once
       *
       * @example
       * ```tsx
       * // Multiple images for my image gallery
       * <input name="image" type="file" />
       * <input name="image" type="file" />
       * <input name="image" type="file" />
       * ```
       */
      multiple?:
        | {
            max?: { value: number; error: string };
            min?: { value: number; error: string };
          }
        | string;
    }
  | {
      /**
       * This is a value that will be computed on the server (can not come from the client)
       */
      type: "server-computed-value";
      /**
       * The function that will be used to compute the value
       *
       * **What this function returns gets stored in the database**
       */
      compute: (
        /** When a user is editing content this will contain data */
        info: { oldValue: unknown; contentId: string | number | null } | null
      ) => T[Key];
    };

export type SearchProvider = {
  search: (
    query: object,
    returnValues: object,
    orderBy: object,
    selector: (
      | { mode: "infinite"; cursor?: string | number }
      | { mode: "pagination"; page?: number }
    ) & {
      ammount: number;
    }
  ) => Promise<{ nextCursor: string | number | null; data: object[] } | null>;
  getPageAmount: (query: object) => Promise<number>;
};

export type DatabaseProvider = {
  getFullContent: (id: string | number) => Promise<object | null>;
  createContent: (values: object) => Promise<Error | string | number>;
  editContent: (id: string | number, values: object) => Promise<Error | true>;
  deleteContent: (id: string | number) => Promise<Error | true>;
  getContentId: (filter: unknown) => Promise<string | number | null>;
};

export type Middleware = {
  beforeValidatingNewContent?: (values: unknown) => unknown;
  afterValidatingNewContent?: (
    values: unknown,
    errors: Partial<{ [key: string]: string[] } & { General: string[] }>
  ) => unknown;
  beforeValidatingUpdatedContent?: (values: unknown) => unknown;
  afterValidatingUpdatedContent?: (
    validatedValues: unknown,
    errors: Partial<{ [key: string]: string[] } & { General: string[] }>
  ) => unknown;
  beforeCreatingContent?: () => unknown;
  afterCreatingContent?: (
    succeeded: { status: true; id: string | number } | { status: false }
  ) => unknown;
  beforeUpdatingContent?: () => unknown;
  afterUpdatingContent?: (
    succeeded: { status: true; id: string | number } | { status: false }
  ) => unknown;
  beforeDeletingContent?: () => unknown;
};
