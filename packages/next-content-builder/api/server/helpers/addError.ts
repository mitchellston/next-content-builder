export const addError = (
  errors: { [key: string]: unknown },
  key: string,
  error: string
) => {
  if (key in errors) {
    const val = Array.isArray(errors[key]);
    if (Array.isArray(val))
      val.push(error ?? "This input can not be used multiple times");
  } else errors[key] = [error];
  return errors;
};
