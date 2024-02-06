import { revalidateTag } from "next/cache";
import { ContentType } from "../../../contentType";

export async function clearCache(contentType: ContentType) {
  // Revalidate the cache
  revalidateTag(
    `next-content-builder-contentType-${contentType.name}-content-key`
  ); // Revalidate the content key (used to get the real id)
  revalidateTag(`next-content-builder-contentType-${contentType.name}-page`); // revalidate the search
  revalidateTag(`next-content-builder-contentType-${contentType.name}-search`); // revalidate the search
}
