import { ContentType } from "../contentType";

export type SearchQueryResult<
  T extends ContentType,
  R extends Partial<{ [key in keyof T["values"]]: true }>,
> = {
  [key in keyof R]: R[key] extends true
    ? key extends infer Key extends keyof T["values"]
      ? T["values"][Key] extends infer T
        ? T extends {
            validate: (
              input: unknown,
              info: {
                oldValue: unknown;
                contentId: string | number | null;
              } | null
            ) => infer U;
            type: "client-value";
          }
          ? Awaited<U>
          : T extends {
                validate: (
                  input: unknown,
                  info: {
                    oldValue: unknown;
                    contentId: string | number | null;
                  } | null
                ) => infer U;
                type: "client-value";
              }
            ? Awaited<U>
            : never
        : never
      : never
    : never;
} & { id: string | number };
