import "server-only";
import { ContentType } from "../../contentType";
import { Content } from "../../types/content";
import { revalidateTag } from "next/cache";
import { validateValues } from "./helpers/validate";
import { errorGetter } from "./helpers/errorGetter";
import { isRedirectError } from "next/dist/client/components/redirect";

export async function createContent<T extends ContentType>(
  contentType: T,

  clientValues: {
    /** Values send from the client (computed values are not allowed) */
    values: Content<T>;
    /**
     * Validates the content with the contentType
     *
     * @default true
     */
    validate?: boolean;
  }
) {
  // Execute both the beforeCreatingContent and beforeValidatingNewContent middleware
  try {
    // Execute the beforeCreatingContent middleware if it exists
    if (contentType.middlewares?.beforeCreatingContent)
      await contentType.middlewares.beforeCreatingContent();

    // Execute the beforeCreatingContent middleware if needed (and if it exists)
    if (
      clientValues.validate &&
      contentType.middlewares?.beforeValidatingNewContent
    )
      await contentType.middlewares.beforeValidatingNewContent(
        clientValues.values
      );
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return {
      errors: {
        General: [errorGetter(e)],
      },
      id: null,
    };
  }

  // Validate the content if needed
  const validated =
    clientValues.validate ?? true
      ? await validateValues(contentType, { values: clientValues.values })
      : { errors: {}, values: clientValues.values };
  // if there is an error, return it
  if (Object.keys(validated.errors).length > 0)
    return {
      errors: validated.errors,
      id: null,
    };
  // Execute the afterValidatingNewContent middleware if needed (and if it exists)
  try {
    if (
      clientValues.validate &&
      contentType.middlewares?.afterValidatingNewContent
    )
      await contentType.middlewares.afterValidatingNewContent(
        validated.values,
        validated.errors
      );
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return {
      errors: {
        General: [errorGetter(e)],
      },
      id: null,
    };
  }

  // Check if there are any errors
  if (Object.keys(validated.errors).length > 0) {
    try {
      // Execute the afterCreatingContent middleware if it exists
      if (contentType.middlewares?.afterCreatingContent)
        await contentType.middlewares.afterCreatingContent({ status: false });
    } catch (e) {
      if (isRedirectError(e)) throw e;
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

  // Create the content
  const id = await contentType.databaseProvider.createContent(validated.values);
  if (id instanceof Error) throw id;

  // Revalidate the cache
  revalidateTag(`next-content-builder-contentType-${contentType.name}-${id}`); // revalidate the page
  revalidateTag(
    `next-content-builder-contentType-${contentType.name}-content-key`
  ); // Revalidate the content key (used to get the real id)
  revalidateTag(`next-content-builder-contentType-${contentType.name}-search`); // revalidate the search

  // Execute the afterCreatingContent middleware if it exists
  try {
    if (contentType.middlewares?.afterCreatingContent)
      await contentType.middlewares.afterCreatingContent({ status: true, id });
  } catch (e) {
    if (isRedirectError(e)) throw e;
    contentType.databaseProvider.deleteContent(id);
    return {
      errors: {
        General: [errorGetter(e)],
      },
      id: null,
    };
  }

  return { errors: {}, id };
}
