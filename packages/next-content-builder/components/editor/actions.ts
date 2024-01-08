import "server-only";
import { getContentType } from "../../api/server/helpers/getContentType";
import { ContentType } from "../../contentType";
import { cookies } from "next/headers";
import { editContent } from "../../api/server/editContent";
import { Id } from "../../types/id";
import { createContent } from "../../api/server/createContent";

export async function createAndEditContent<T extends ContentType>(
  inputs: FormData,
  contentTypeInput: T | string,
  editing?: Id<T> | null
) {
  // Delete old errors
  if (cookies().has("form-errors")) cookies().delete("form-errors");
  // Error object which contains all the errors from validation
  let errors = {} as
    | ({
        [Key in keyof T["values"]]: Array<string>;
      } & { General?: Array<string> })
    | {};
  // Get the content type
  const contentType = await getContentType(contentTypeInput);

  let values: { [key: string]: unknown } = {};
  inputs.forEach((value, key) => {
    console.log(key, value);
    if (values[key])
      if (Array.isArray(values[key])) (values[key] as unknown[]).push(value);
      else values[key] = [values[key], value];
    else values[key] = value;
  });
  // If where editing, edit the content
  if (editing) {
    // Edit the content
    const editedContent = await editContent(contentType, editing, {
      // @ts-expect-error - Not a problem... since we are validating the content inside the editContent function
      values,
    });
    errors = editedContent.errors;
  }
  // If not, create the content
  else {
    // Create the content
    const newContent = await createContent(contentType, {
      validate: true,
      // @ts-expect-error - Not a problem... since we are validating the content inside the createContent function
      values,
    });
    errors = newContent.errors;
  }

  // Check if there are any errors and if there are, set the cookies and return
  if (Object.keys(errors).length > 0)
    return cookies().set({
      name: "form-errors",
      value: JSON.stringify(errors),
      sameSite: "strict",
      secure: true,
      expires: new Date(Date.now() + 1000 * 30), // 30 seconds
    });
}
