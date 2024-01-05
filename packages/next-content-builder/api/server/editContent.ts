import "server-only";
import { ContentType } from "../../contentType";
import { Content } from "../../types/content";
import { Id } from "../../types/id";
import { revalidateTag } from "next/cache";
import { getRealId } from "./helpers/getRealId";
import { validateValues } from "./helpers/validate";
import { errorGetter } from "./helpers/errorGetter";
import { getFullContent } from "./getFullContent";

export async function editContent<T extends ContentType>(
  contentType: T,
  id: Id<T>,
  values: {
    /** Values send from the client (computed values are not allowed) */
    values: Partial<Content<T>>;
    /**
     * Validates the content with the contentType
     *
     * @default true
     */
    validate?: boolean;
  }
) {
  const oldContent = await getFullContent(contentType, id, false);

  // Execute both the beforeUpdatingContent and beforeValidatingUpdatedContent middleware
  try {
    // Execute the beforeUpdatingContent middleware if it exists
    if (contentType.middlewares?.beforeUpdatingContent)
      await contentType.middlewares.beforeUpdatingContent();
    // Execute the beforeValidatingNewContent middleware if needed (and if it exists)
    if (
      values.validate &&
      contentType.middlewares?.beforeValidatingUpdatedContent
    )
      await contentType.middlewares.beforeValidatingUpdatedContent(
        values.values
      );
  } catch (e) {
    return {
      errors: {
        General: [errorGetter(e)],
      },
      id: null,
    };
  }

  const validated =
    values.validate ?? true
      ? await validateValues(contentType, {
          values: values.values,
          canBeEmpty: true,
        })
      : { errors: {}, values: values.values };

  // Execute the afterValidatingNewContent middleware if needed (and if it exists)
  try {
    if (
      values.validate &&
      contentType.middlewares?.afterValidatingUpdatedContent
    )
      await contentType.middlewares.afterValidatingUpdatedContent(
        validated.values,
        validated.errors
      );
  } catch (e) {
    return {
      errors: {
        General: [errorGetter(e)],
      },
      id: null,
    };
  }

  // Check if there are any errors
  if (Object.keys(validated.errors).length > 0) {
    // Execute the afterUpdatingContent middleware if it exists
    try {
      if (contentType.middlewares?.afterUpdatingContent)
        await contentType.middlewares.afterUpdatingContent({ status: false });
    } catch (e) {
      return {
        errors: {
          General: [errorGetter(e)],
        },
        id: null,
      };
    }

    // Stop the function and return the errors
    return { errors: validated.errors, id: null };
  }

  // Get the real id
  const realId = await getRealId(contentType, id);
  if (realId === false) throw new Error("Content not found");

  // Edit the content
  const edited = await contentType.databaseProvider.editContent(
    realId,
    validated.values
  );
  if (edited instanceof Error) throw edited;

  // Revalidate the cache
  revalidateTag(
    `next-content-builder-contentType-${contentType.name}-${realId}`
  ); // revalidate the page
  revalidateTag(`next-content-builder-contentType-${contentType.name}-search`); // revalidate the search

  // Execute the afterUpdatingContent middleware if it exists
  try {
    if (contentType.middlewares?.afterUpdatingContent)
      await contentType.middlewares.afterUpdatingContent({
        status: true,
        id: realId,
      });
  } catch (e) {
    contentType.databaseProvider.editContent(realId, oldContent);
    return {
      errors: {
        General: [errorGetter(e)],
      },
      id: null,
    };
  }

  return { id: realId, errors: {} };
}
