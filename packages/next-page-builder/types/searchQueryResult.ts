import { ContentType } from "../contentType";

export type SearchQueryResult<
  T extends ContentType,
  R extends Partial<{ [key in keyof T["values"]]: true }>,
> = {
  [key in keyof R]: R[key] extends true
    ? T["values"][key] extends {
        type: infer Ttype;
      }
      ? Ttype extends "client-value"
        ? Awaited<ReturnType<T["values"][key]["validate"]>>
        : Awaited<ReturnType<T["values"][key]["compute"]>>
      : never
    : never;
} & { id: string | number };
