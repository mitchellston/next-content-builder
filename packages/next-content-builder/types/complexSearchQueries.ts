import { ContentType } from "../contentType";

export type ComplexSearchQuery<T extends ContentType> = Partial<{
  [Key in keyof T["values"]]: Awaited<
    ReturnType<T["values"][Key]["validate"]>
  > extends string
    ? {
        eq?: string;
        neq?: string;
        like?: string;
      }
    : Awaited<ReturnType<T["values"][Key]["validate"]>> extends number
      ? {
          eq?: number;
          neq?: number;
          gt?: number;
          gte?: number;
          lt?: number;
          lte?: number;
        }
      : Awaited<ReturnType<T["values"][Key]["validate"]>> extends boolean
        ? {
            eq?: boolean;
            neq?: boolean;
          }
        : Awaited<ReturnType<T["values"][Key]["validate"]>> extends Date
          ? {
              eq?: Date;
              neq?: Date;
              gt?: Date;
              gte?: Date;
              lt?: Date;
              lte?: Date;
            }
          : Awaited<ReturnType<T["values"][Key]["validate"]>> extends Array<
                infer U
              >
            ? {
                eq?: U;
                neq?: U;
              }
            : {
                eq?: Awaited<ReturnType<T["values"][Key]["validate"]>>;
                neq?: Awaited<ReturnType<T["values"][Key]["validate"]>>;
              };
}>;
