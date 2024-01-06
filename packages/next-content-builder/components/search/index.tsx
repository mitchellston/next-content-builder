import "server-only";
import { getContentType } from "../../api/server/helpers/getContentType";
import { ContentType } from "../../contentType";
import { ComplexSearchQuery } from "../../types/complexSearchQueries";
import { InfiniteLoader } from "./infiniteLoader";
import { SearchQueryResult } from "../../types/searchQueryResult";
import { search } from "../../api/server/search";
import { shouldCache } from "./shouldCache";

type props<
  T extends ContentType,
  CS extends ComplexSearchQuery<T>,
  R extends Partial<{ [key in keyof T["values"]]: true }>,
> = {
  /** The content type to add content to. Can either be dynamically imported or directly imported */
  contentType: T | string;
  onNullContent?: JSX.Element | JSX.Element[];
  ammount: number;
  search: CS;
  returnValues: R;
} & (
  | {
      mode: "infinite";
      /**
       * `all` - both the initial and subsequent searches will be dynamic (not cached)
       *
       * `subsequent` - only the subsequent searches will be dynamic (not cached)
       *
       * `none` - both the initial and subsequent searches will be cached
       *
       * @default "none"
       */
      dynamic?: "all" | "subsequent" | "none";
      clientComponent: (
        values: SearchQueryResult<T, R>
      ) => JSX.Element | JSX.Element[];
    }
  | {
      mode: "paginated";
      page: number;
      /**
       * `true` - the content will not be cached
       *
       * `false` - the content type will be cached
       *
       * @default false
       */
      dynamic?: boolean;
      children: (
        values: SearchQueryResult<T, R>
      ) => JSX.Element | JSX.Element[];
    }
);
/**
 * A component that allows you to search for content in a content type
 *
 * **Note: This component is a work in progress, awaiting its final touches**
 */
export async function Search<
  T extends ContentType,
  CS extends ComplexSearchQuery<T>,
  R extends Partial<{ [key in keyof T["values"]]: true }>,
>(props: props<T, CS, R>) {
  // subsequent searches are only used for infinite mode
  async function subsequentSearches(cursor: string | number) {
    "use server";
    const contentType = await getContentType(props.contentType);
    return await search(
      contentType,
      props.returnValues,
      props.search,
      {
        ammount: props.ammount,
        cursor,
        mode: "infinite",
      },
      shouldCache(props.mode, "subsequent", props.dynamic)
    );
  }

  const contentType = await getContentType(props.contentType);
  // initial search
  const results = await search(
    contentType,
    props.returnValues,
    props.search,
    props.mode === "paginated"
      ? {
          mode: "pagination",
          ammount: props.ammount,
          page: props.mode === "paginated" ? props.page : 0,
        }
      : { mode: "infinite", ammount: props.ammount },
    shouldCache(props.mode, "initial", props.dynamic)
  );

  // if there are no results, return the onNullContent prop
  if (!results || !results.data || results.data.length < 1)
    return <>{props.onNullContent}</>;

  // if the mode is infinite, return the infinite loader + the client component
  if (props.mode === "infinite")
    return (
      <InfiniteLoader<typeof contentType, typeof props.returnValues>
        initialData={results as any}
        clientComponent={props.clientComponent}
        subsequentSearches={subsequentSearches as any}
      ></InfiniteLoader>
    );

  // if the mode is paginated, return the component
  return <>{results.data.map((v) => props.children(v as any))}</>;
}
