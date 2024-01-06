import { Search } from "next-content-builder";
import { test } from "~/contentTypes/test";
import { infiniteSearchComponent } from "./infiniteSearchComponent";

export default function Page(): JSX.Element {
  return (
    <main className="h-[500vh]">
      <Search
        contentType={test}
        ammount={2}
        // page={0}
        mode="infinite"
        search={{}}
        returnValues={{ title: true }}
        clientComponent={infiniteSearchComponent}
        // children={(val) => <p>{val.title}</p>}
      />
    </main>
  );
}
