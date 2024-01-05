import "server-only";
import { test } from "../../../contentTypes/test";
import { Editor } from "next-content-builder";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Button } from "~/components/ui/button";

type props = {
  id?: string;
};
export function EditorTest(props: props) {
  return (
    <Editor edit={props.id} contentType={test}>
      {(errors, oldValues) => (
        <div className="mx-5 flex flex-col gap-9">
          <div>
            <Label>Page title</Label>
            <Input defaultValue={oldValues.title} name="title" />
            <span className="text-red-800">
              {errors.title && errors.title[0]}
            </span>
          </div>

          <div>
            <Label>Page description</Label>
            <Textarea defaultValue={oldValues.description} name="description" />
            <span className="text-red-800">
              {errors.description && errors.description[0]}
            </span>
          </div>
          {errors.General && errors.General[0]}
          <Button className="w-min" type="submit">
            Submit
          </Button>
        </div>
      )}
    </Editor>
  );
}
