import "server-only";
import { ContentType } from "../../contentType";
import { Id } from "../../types/id";
import { getRealId } from "./helpers/getRealId";
import { revalidateTag } from "next/cache";
import { errorGetter } from "./helpers/errorGetter";

export async function deleteContent<T extends ContentType>(
  contentType: T,
  id: Id<T>
) {
  // Execute the beforeDeletingContent middleware if it exists
  try {
    if (contentType.middlewares?.beforeDeletingContent)
      await contentType.middlewares.beforeDeletingContent();
  } catch (e) {
    return { status: false, error: errorGetter(e) };
  }

  // Get the real id
  const realId = await getRealId(contentType, id);
  if (realId === false) throw new Error("Content not found");

  // Delete the content
  const deleted = await contentType.databaseProvider.deleteContent(realId);
  if (deleted instanceof Error) throw deleted;

  // Revalidate the cache
  revalidateTag(`next-page-builder-contentType-${contentType.name}-${realId}`); // revalidate the page
  revalidateTag(
    `next-page-builder-contentType-${contentType.name}-content-key`
  ); // Revalidate the content key (used to get the real id)
  revalidateTag(`next-page-builder-contentType-${contentType.name}-search`); // revalidate the search

  return { status: true, error: null };
}
