import "server-only";
import { unstable_cache } from "next/cache";
import { ContentType } from "../../contentType";
import { Content } from "../../types/content";
import { Id } from "../../types/id";
import { getRealId } from "./helpers/getRealId";

export async function getFullContent<T extends ContentType>(
  contentType: T,
  id: Id<T>,
  cache: boolean = true
) {
  // Get the real id
  const contentId = await getRealId(contentType, id);
  if (contentId === false) throw new Error("Content not found");

  // Get the content
  const content = cache
    ? // if cache is true, cache the content
      await unstable_cache(
        async () =>
          await contentType.databaseProvider.getFullContent(contentId),
        [
          `next-content-builder-contentType-${contentType.name}-content-page`,
          `next-content-builder-contentType-${contentType.name}-${contentId}`,
        ],
        {
          tags: [
            `next-content-builder-contentType-${contentType.name}-${contentId}`,
            `next-content-builder-contentType-${contentType.name}-page`,
          ],
        }
      )()
    : // if cache is false, don't cache the content
      await contentType.databaseProvider.getFullContent(contentId);

  // Check if the content exists
  if (content == null) throw new Error("Content not found");

  // Return the content
  return { ...content, id: contentId } as Content<T>;
}
