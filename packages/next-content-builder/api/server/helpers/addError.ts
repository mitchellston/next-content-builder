export const addError = (errors: object, key: string, error: string) => {
  // @ts-expect-error - should be the key
  if (key in errors && Array.isArray(errors[key]))
    // @ts-expect-error - should be the key
    errors[key].push(error ?? "This input can not be used multiple times");
  // @ts-expect-error - should be the key
  else errors[key] = [error];
  return errors;
};
