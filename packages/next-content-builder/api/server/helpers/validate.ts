import "server-only";
import { ContentType, Value } from "../../../contentType";
import { Content } from "../../../types/content";
import { addError } from "./addError";
import { errorGetter } from "./errorGetter";

export const validateValues = async <T extends ContentType>(
  contentType: T,
  values:
    | { values: Content<T>; canBeEmpty?: false }
    | { values: Partial<Content<T>>; canBeEmpty: true },
  oldValues: { id: string | number; oldValues: object } | null = null
) => {
  const errors: Partial<
    { [Key in keyof T["values"]]: string[] } & { General: string[] }
  > = {};
  // Validate the content
  const promises: Promise<{ value: unknown; key: string } | null>[] = [];
  for (let key in contentType.values) {
    const realKey = key as keyof typeof contentType.values;
    const data = contentType.values[realKey] as Value<T, keyof T>;
    // Server computed values
    if (data.type === "server-computed-value") {
      promises.push(
        new Promise(async (resolve) => {
          try {
            resolve({
              value: await data.compute(
                oldValues?.oldValues[realKey]
                  ? {
                      oldValue: oldValues.oldValues[realKey],
                      contentId: oldValues.id,
                    }
                  : null
              ),
              key: realKey,
            });
          } catch (e) {
            addError(errors, realKey, errorGetter(e));
            resolve(null);
          }
        })
      );
      continue;
    }
    // Client values
    const dataFromValues =
      key in values.values &&
      Object.prototype.hasOwnProperty.call(values.values, key)
        ? values.values[key as keyof typeof values.values]
        : null;
    // check if there are multiple inputs
    if (Array.isArray(dataFromValues)) {
      const array = dataFromValues as unknown[];
      // if the input is not allowed to be used multiple times
      if (typeof data.multiple === "string" || data.multiple == undefined) {
        addError(
          errors,
          realKey,
          typeof data.multiple === "string"
            ? data.multiple
            : "This input can not be used multiple times"
        );
        continue;
      }
      // check if the input is used too many times or too few times
      if (
        typeof data.multiple == "object" &&
        ((data.multiple.max && array.length > data.multiple.max.value) ||
          (data.multiple.min && array.length < data.multiple.min.value))
      ) {
        addError(
          errors,
          realKey,
          data.multiple.max?.error ??
            data.multiple.min?.error ??
            "This input can not be used multiple times"
        );
        continue;
      }
    }
    // If the input is not required and the input is empty, skip the validation
    if (!dataFromValues && values.canBeEmpty) continue;
    // Validate the input
    promises.push(
      new Promise(async (resolve) => {
        try {
          resolve({
            value: await data.validate(
              dataFromValues,
              oldValues?.oldValues[realKey]
                ? {
                    oldValue: oldValues.oldValues[realKey],
                    contentId: oldValues.id,
                  }
                : null
            ),
            key: realKey,
          });
        } catch (e) {
          addError(errors, realKey, errorGetter(e));
          resolve(null);
        }
      })
    );
  }
  // Wait for all the promises to resolve
  const computedValues = await Promise.allSettled(promises);
  const data: { [key: string]: unknown } = {};
  for (let i = 0; i < computedValues.length; i++) {
    const computedValue = computedValues[i];
    // create the right format
    if (
      computedValue &&
      computedValue.status === "fulfilled" &&
      computedValue.value
    )
      data[computedValue.value.key] = computedValue.value.value;
  }
  return { errors, values: data };
};
