"use client";
import { ContentType } from "next-content-builder/contentType";
import { LegacyRef, useEffect, useRef, useState } from "react";
import { SearchQueryResult } from "next-content-builder/types/searchQueryResult";

type props<
  T extends ContentType,
  R extends Partial<{ [key in keyof T["values"]]: true }>,
> = {
  clientComponent: (
    values: SearchQueryResult<T, R>
  ) => JSX.Element | JSX.Element[];
  subsequentSearches: (cursor: string | number) => Promise<{
    nextCursor: string | number | null;
    data: SearchQueryResult<T, R>[];
  }>;
  initialData: {
    nextCursor: string | number | null;
    data: SearchQueryResult<T, R>[];
  };
};
export function InfiniteLoader<
  T extends ContentType,
  R extends Partial<{ [key in keyof T["values"]]: true }>,
>(props: props<T, R>) {
  // create state to store data + set initial data from server
  const [data, setData] = useState([props.initialData]);
  // ref to last rendered component
  const lastComponent = useRef<LegacyRef<HTMLDivElement>>(null);
  // fun
  useEffect(() => {
    if (lastComponent && lastComponent.current) {
      // create a observer to watch the last rendered component
      const observer = new IntersectionObserver(async (entries) => {
        // if the last rendered component is intersecting, load more data
        if (entries[0] && entries[0].isIntersecting) {
          const last = data[data.length - 1];
          if (last && last.nextCursor) {
            // loads more data and adds it to the state
            await props.subsequentSearches(last.nextCursor).then((v) => {
              setData([...data, v]);
            });
          }
        }
      });
      // @ts-expect-error should be fine :)
      observer.observe(lastComponent.current);
      // cleanup
      return () => observer.disconnect();
    }
  }, [lastComponent, lastComponent.current]);

  // uses a flatmap to flatten the data (from array of arrays to array)
  const _components = data.flatMap((v) => v.data);

  return (
    <>
      {_components.map((data, i) => (
        <div
          ref={(element) => {
            // @ts-expect-error should be fine :)
            if (i === _components.length - 1) lastComponent.current = element;
          }}
          key={i}
        >
          {props.clientComponent(data)}
        </div>
      ))}
    </>
  );
}
