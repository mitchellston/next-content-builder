import "server-only";
import { ContentType } from "../contentType";
import { notFound } from "next/navigation";
import { getFullContent } from "../api/server/getFullContent";
import { Content } from "../types/content";
import { Id } from "../types/id";
import { getContentType } from "../api/server/helpers/getContentType";

type props<T extends ContentType> = {
  /** The content type to add content to. Can either be dynamically imported or directly imported */
  contentType: T | string;
  /** Id of editing content */
  id: Id<T>;
  /** Change what happens when the content is not found (instead of loading 404 page) */
  notFound?: () => JSX.Element | JSX.Element[];
  children: (values: Content<T>) => JSX.Element | JSX.Element[];
  /**
   * `true` - the content will not be cached
   *
   * `false` - the content type will be cached
   *
   * @default false
   */
  dynamic?: boolean;
};

/** Gets the full content of a piece of content and passes it to the children (or returns a 404 page if the content does not exist) */
export async function FullContent<T extends ContentType>(props: props<T>) {
  // Get content type
  const contentType = await getContentType(props.contentType);
  // Get content
  const content = await getFullContent(
    contentType,
    props.id,
    props.dynamic
  ).catch(() => false as const);
  // Return 404 page if content does not exist
  if (content === false)
    if (props.notFound)
      // Or return the not found component if it exists
      return <>{props.notFound()}</>;
    else return notFound();
  // Return the content
  return <>{props.children(content)}</>;
}
