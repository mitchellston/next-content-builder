import "server-only";
import { ContentType } from "../../contentType";
import { ComplexSearchQuery } from "../../types/complexSearchQueries";
import { SearchQueryResult } from "../../types/searchQueryResult";
import { unstable_cache } from "next/cache";

export async function search<
  T extends ContentType,
  CS extends ComplexSearchQuery<T>,
  R extends Partial<{ [key in keyof T["values"]]: true }>,
  V extends { cursor?: string | number } | { page?: number },
>(
  contentType: T,
  returnValues: R,
  search: CS,
  settings: {
    ammount: number;
  } & V,
  cache: boolean = true
): Promise<ReturnType<T, R, V>> {
  // If cache is true, get the from cache or cache the content
  if (cache)
    return await unstable_cache(
      async () =>
        (await contentType.searchProvider.search(search, returnValues, {
          ammount: settings.ammount,
          mode:
            "cursor" in settings && !("page" in settings)
              ? "infinite"
              : "pagination",
          page: "page" in settings ? settings.page ?? 0 : undefined,
          cursor: "cursor" in settings ? settings.cursor : undefined,
        })) as ReturnType<T, R, V>,
      [
        `next-page-builder-contentType-${
          contentType.name
        }-search-${JSON.stringify(settings)}-${JSON.stringify(
          search
        )}-${JSON.stringify(returnValues)}`,
      ],
      {
        tags: [
          `next-page-builder-contentType-${contentType.name}-search`,
          `next-page-builder-contentType-${
            contentType.name
          }-search-${JSON.stringify(settings)}-${JSON.stringify(
            search
          )}-${JSON.stringify(returnValues)}`,
        ],
      }
    )();
  // If cache is false, don't cache the content and don't get it from cache
  return (await contentType.searchProvider.search(search, returnValues, {
    ammount: settings.ammount,
    mode:
      "cursor" in settings && !("page" in settings) ? "infinite" : "pagination",
    page: "page" in settings ? settings.page ?? 0 : undefined,
    cursor: "cursor" in settings ? settings.cursor : undefined,
  })) as ReturnType<T, R, V>;
}

type ReturnType<
  T extends ContentType,
  R extends Partial<{ [key in keyof T["values"]]: true }>,
  V extends { cursor?: string | number } | { page?: number },
> = V extends { cursor?: string | number }
  ? {
      data: SearchQueryResult<T, R>[];
      nextCursor: undefined | string | number;
    }
  : { data: SearchQueryResult<T, R>[] };
