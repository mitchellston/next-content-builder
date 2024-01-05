import "server-only";
import { unstable_cache } from "next/cache";
import { ContentType } from "../../../contentType";
import { Id } from "../../../types/id";

export async function getRealId<T extends ContentType>(
  contentType: T,
  id: Id<T>
) {
  // if the id has been cached it will be returned else will get null
  let contentId: null | string | number = await unstable_cache(
    async () => null,
    [
      `next-page-builder-contentType-${contentType.name}-content-key`,
      `next-page-builder-contentType-${contentType.name}-${JSON.stringify(id)}`,
    ],
    {
      tags: [`next-page-builder-contentType-${contentType.name}-content-key`],
    }
  )();
  // if the id is null then it will get the id from the database and cache it
  if (!contentId)
    contentId = await unstable_cache(
      async () => await contentType.databaseProvider.getContentId(id),
      [
        `next-page-builder-contentType-${contentType.name}-content-key`,
        `next-page-builder-contentType-${contentType.name}-${JSON.stringify(
          id
        )}`,
      ],
      {
        tags: [`next-page-builder-contentType-${contentType.name}-content-key`],
      }
    )();
  // if the id is still null then it will return false
  if (contentId === null) return false;
  return contentId;
}
