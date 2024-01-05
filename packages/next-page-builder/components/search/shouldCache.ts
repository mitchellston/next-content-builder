import "server-only";

// This function is used to determine if the cache should be used and at what moments for the search component
export const shouldCache = (
  mode: "paginated" | "infinite",
  time: "initial" | "subsequent",
  dynamic?: boolean | "all" | "subsequent" | "none"
) => {
  // Default value, uses cache for everything
  if (dynamic === undefined) return true;
  // If in paginated mode is false or in infinite mode is "none", use cache
  if (dynamic === false || dynamic === "none") return true;
  // if in infinite mode and dynamic is set to "subsequent" and the request is the initial request, use cache
  if (dynamic === "subsequent" && time === "initial") return true;
  // all other cases, don't use cache
  return false;
};
