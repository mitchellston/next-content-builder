export const addError = (errors: object, key: string, error: string) => {
  if (key in errors && Array.isArray(errors[key]))
    errors[key].push(error ?? "This input can not be used multiple times");
  else errors[key] = [error];
  return errors;
};
