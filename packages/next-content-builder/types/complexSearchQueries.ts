import { ContentType } from "../contentType";

export type ComplexSearchQuery<T extends ContentType> = Partial<{
  [Key in keyof T["values"]]: T["values"][Key] extends infer T
    ? Awaited<
        T extends {
          validate: (input: unknown) => infer U;
          type: "client-value";
        }
          ? U
          : T extends {
                compute: (input: unknown) => infer U;
                type: "server-computed-value";
              }
            ? U
            : never
      > extends string
      ? {
          eq?: string;
          neq?: string;
          like?: string;
        }
      : Awaited<
            T extends {
              validate: (input: unknown) => infer U;
              type: "client-value";
            }
              ? U
              : T extends {
                    compute: (input: unknown) => infer U;
                    type: "server-computed-value";
                  }
                ? U
                : never
          > extends number
        ? {
            eq?: number;
            neq?: number;
            gt?: number;
            gte?: number;
            lt?: number;
            lte?: number;
          }
        : Awaited<
              T extends {
                validate: (input: unknown) => infer U;
                type: "client-value";
              }
                ? U
                : T extends {
                      compute: (input: unknown) => infer U;
                      type: "server-computed-value";
                    }
                  ? U
                  : never
            > extends boolean
          ? {
              eq?: boolean;
              neq?: boolean;
            }
          : Awaited<
                T extends {
                  validate: (input: unknown) => infer U;
                  type: "client-value";
                }
                  ? U
                  : T extends {
                        compute: (input: unknown) => infer U;
                        type: "server-computed-value";
                      }
                    ? U
                    : never
              > extends Date
            ? {
                eq?: Date;
                neq?: Date;
                gt?: Date;
                gte?: Date;
                lt?: Date;
                lte?: Date;
              }
            : Awaited<
                  T extends {
                    validate: (input: unknown) => infer U;
                    type: "client-value";
                  }
                    ? U
                    : T extends {
                          compute: (input: unknown) => infer U;
                          type: "server-computed-value";
                        }
                      ? U
                      : never
                > extends Array<infer U>
              ? {
                  eq?: U;
                  neq?: U;
                }
              : {
                  eq?: Awaited<
                    T extends {
                      validate: (input: unknown) => infer U;
                      type: "client-value";
                    }
                      ? U
                      : T extends {
                            compute: (input: unknown) => infer U;
                            type: "server-computed-value";
                          }
                        ? U
                        : never
                  >;
                  neq?: Awaited<
                    T extends {
                      validate: (input: unknown) => infer U;
                      type: "client-value";
                    }
                      ? U
                      : T extends {
                            compute: (input: unknown) => infer U;
                            type: "server-computed-value";
                          }
                        ? U
                        : never
                  >;
                }
    : never;
}>;
