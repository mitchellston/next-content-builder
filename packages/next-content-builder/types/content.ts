import { ContentType } from "../contentType";

type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

export type Content<T extends ContentType> = {
  [Key in keyof T["values"]]: T["values"][Key] extends infer T
    ? T extends { validate: (input: unknown) => infer U; type: "client-value" }
      ? Awaited<U>
      : T extends {
            compute: (input: unknown) => infer U;
            type: "server-computed-value";
          }
        ? Awaited<U>
        : never
    : never;
};
