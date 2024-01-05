// transforms errors from catch blocks into usable strings
export const errorGetter = (e: unknown) =>
  typeof e == "string"
    ? e
    : e instanceof Error
      ? e.message
      : "An unknown error occurred";
