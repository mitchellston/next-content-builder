import "server-only";
import { getContentType } from "../../api/server/helpers/getContentType";
import { ContentType } from "../../contentType";
import { ComplexSearchQuery } from "../../types/complexSearchQueries";
import { SearchQueryResult } from "../../types/searchQueryResult";
import { search } from "../../api/server/search";
import { shouldCache } from "./shouldCache";

type props<
  T extends ContentType,
  SearchQuery extends ComplexSearchQuery<T>,
  ReturnValues extends Partial<{ [key in keyof T["values"]]: true }>,
  Order extends Partial<{ [key in keyof T["values"]]: "desc" | "asc" }>,
> = {
  /** The content type to add content to. Can either be dynamically imported or directly imported */
  contentType: T | string;
  onNullContent?: JSX.Element | JSX.Element[];
  ammount: number;
  search: SearchQuery;
  returnValues: ReturnValues;
  orderBy?: Order;
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
        values: SearchQueryResult<T, ReturnValues>
      ) => JSX.Element | JSX.Element[];
      /**
       * The client component in infinite mode gets surounded by a div so that it can be used as ref.
       *
       * By enabling this prop, the ref will be passed to the client component instead of the div. Meaning that the div will not be rendered.
       *
       * @default false
       */
      childHandlesRef?: boolean;
      LoaderComponent: (props: {
        clientComponent: (
          values: SearchQueryResult<T, ReturnValues>
        ) => JSX.Element | JSX.Element[];
        subsequentSearches: (cursor: string | number) => Promise<{
          nextCursor: string | number | null;
          data: SearchQueryResult<T, ReturnValues>[];
        }>;
        initialData: {
          nextCursor: string | number | null;
          data: SearchQueryResult<T, ReturnValues>[];
        };
        childHandlesRef?: boolean;
      }) => JSX.Element;
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
        values: SearchQueryResult<T, ReturnValues>
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
  SearchQuery extends ComplexSearchQuery<T>,
  ReturnValues extends Partial<{ [key in keyof T["values"]]: true }>,
  Order extends Partial<{ [key in keyof T["values"]]: "desc" | "asc" }>,
>(props: props<T, SearchQuery, ReturnValues, Order>) {
  // subsequent searches are only used for infinite mode
  async function subsequentSearches(cursor: string | number) {
    "use server";
    const contentType = await getContentType(props.contentType);
    return await search(
      contentType,
      props.returnValues,
      props.search,
      props.orderBy,
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
      <props.LoaderComponent
        //<typeof contentType, typeof props.returnValues>
        initialData={results as any}
        clientComponent={props.clientComponent}
        subsequentSearches={subsequentSearches as any}
        childHandlesRef={props.childHandlesRef}
      ></props.LoaderComponent>
    );

  // if the mode is paginated, return the component
  return <>{results.data.map((v) => props.children(v as any))}</>;
}
