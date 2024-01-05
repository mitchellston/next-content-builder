import "server-only";
import { ContentType } from "../../../contentType";

export async function getContentType<T extends ContentType>(
  contentType: T | string
): Promise<T> {
  // dynamic import the contentType if it is a string
  if (typeof contentType === "string") {
    const contentTypeImported: T = (await import(contentType)).default;
    return contentTypeImported;
  }
  // else return the raw contentType
  return contentType;
}
