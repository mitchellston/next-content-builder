import { ContentType } from "../contentType";

export type Id<T extends ContentType> =
  | string
  | number
  | Partial<{ [Key in keyof T["values"]]: string | number }>;
