import "server-only";
import { ContentType } from "../../contentType";
import { getContentType } from "../../api/server/helpers/getContentType";
import { createAndEditContent } from "./actions";
import { cookies } from "next/headers";
import { Content } from "../../types/content";
import { Id } from "../../types/id";
import { getFullContent } from "../../api/server/getFullContent";

type props<T extends ContentType> = {
  /** The content type to add content to. Can either be dynamically imported or directly imported */
  contentType: T | string;
  /** Id of editing content */
  edit?: Id<T>;
  children: (
    /**
     * Errors from the server (when form has been submitted)
     *
     * `General errors are the errors that are thrown by the middlewares`
     */
    errors: {
      [Key in keyof T["values"]]: Array<string>;
    } & {
      General: Array<string>;
    },
    /** Old values of the content (if editing) */
    oldValues: Partial<Content<T>>
  ) => JSX.Element | JSX.Element[];
};

/** A simple component that is a form which will be validated on submit and then will create a new piece of content */
export async function Editor<T extends ContentType>(props: props<T>) {
  // Variables used for server actions (can't pass props to server actions, since it contains the children)
  const contentType = props.contentType;
  const edit = "edit" in props ? props.edit : null;
  // Handles saving the content
  const submit = async (inputs: FormData) => {
    "use server";
    await createAndEditContent(inputs, contentType, edit);
  };
  // Get content type
  const usableContentType = await getContentType(contentType);
  // Get keys from content type
  const keysValues = Object.keys(usableContentType.values);
  // Get old values from database, if where editing the content
  let oldValues = keysValues.reduce(
    (o, key) => Object.assign(o, { [key]: null }),
    {}
  );
  if (edit)
    oldValues =
      (await getFullContent(usableContentType, edit).catch(() => null)) ??
      oldValues;
  // Get errors from cookies and make sure they are in the correct format
  // (errors come from cookies since server actions do not yet have a good way to return errors)
  const errors = JSON.parse(cookies().get("form-errors")?.value || "{}");
  for (let i = 0; i < keysValues.length; i++) {
    const key = keysValues[i];
    if (key && (errors[key] == null || Array.isArray(errors[key]) == false))
      errors[key] = [];
  }
  // make general errors an array if it is not already
  if (errors["General"] == null || Array.isArray(errors["General"]) == false)
    errors["General"] = [];
  // Both errors and oldValues are casted to any (should be fixed in the future)
  return (
    <form action={submit}>
      {props.children(errors as any, oldValues as any)}
    </form>
  );
}
