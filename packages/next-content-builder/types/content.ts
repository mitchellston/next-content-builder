import { ContentType } from "../contentType";

type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;

export type Content<T extends ContentType> = {
  [Key in keyof T["values"]]: T["values"][Key] extends {
    type: infer Ttype;
  }
    ? Ttype extends "client-value"
      ? Awaited<ReturnType<T["values"][Key]["validate"]>>
      : Awaited<ReturnType<T["values"][Key]["compute"]>>
    : never;
};
