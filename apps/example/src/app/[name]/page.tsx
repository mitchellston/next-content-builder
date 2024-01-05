import { FullContent } from "next-content-builder";
import { test } from "../../contentTypes/test";

export default function testPages(pageVars: any) {
  return (
    <main>
      <FullContent
        id={{
          title: decodeURIComponent(pageVars.params.name),
        }}
        contentType={test}
      >
        {({ title, description, userId }) => (
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
            <p>{userId}</p>
          </div>
        )}
      </FullContent>
    </main>
  );
}
