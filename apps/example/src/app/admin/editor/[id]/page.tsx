import { EditorTest } from "../editor";

export default function Page(pageVars: any) {
  return <EditorTest id={pageVars.params.id} />;
}
