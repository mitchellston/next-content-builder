import "server-only";
import { contentType } from "next-content-builder/contentType";
import { prisma } from "~/server/db";

export const test = contentType(
  "test",
  {
    title: {
      type: "client-value",
      validate: async (title: unknown, info) => {
        "use server";
        if (typeof title !== "string")
          throw new Error("Title must be a string");
        return title;
      },
    },
    description: {
      type: "client-value",
      validate: async (description: unknown) => {
        "use server";
        if (typeof description !== "string")
          throw new Error("Description must be a string");

        return description;
      },
    },
    userId: {
      type: "server-computed-value",
      compute: async () => {
        "use server";
        return "runs on server";
      },
    },
  },
  {
    getFullContent: async (id) => {
      "use server";
      const page = await prisma.test_content_type.findUnique({
        where: {
          id: id as string,
        },
      });
      if (!page || !page.data) return null;
      return typeof page.data === "object" ? (page.data as object) : null;
    },
    createContent: async (pageInfo) => {
      "use server";
      try {
        return (
          await prisma.test_content_type.create({
            data: {
              data: pageInfo,
            },
            select: {
              id: true,
            },
          })
        ).id;
      } catch (e) {
        if (e instanceof Error) return e;
        return new Error("An unknown error occurred");
      }
    },
    editContent: async (id, pageInfo) => {
      "use server";
      try {
        await prisma.test_content_type.update({
          where: {
            id: id as any,
          },
          data: {
            data: pageInfo,
          },
        });
        return true;
      } catch (e) {
        if (e instanceof Error) return e;
        return new Error("An unknown error occurred");
      }
    },
    deleteContent: async (id) => {
      "use server";
      try {
        await prisma.test_content_type.delete({
          where: {
            id: id as any,
          },
        });
        return true;
      } catch (e) {
        if (e instanceof Error) return e;
        return new Error("An unknown error occurred");
      }
    },
    getContentId: async (filter) => {
      "use server";
      let page = null;
      if ((typeof filter === "string" || typeof filter === "number") && filter)
        page = await prisma.test_content_type.findUnique({
          select: {
            id: true,
          },
          where: {
            id: filter as any,
          },
        });
      else if (typeof filter === "object" && filter) {
        const query =
          `SELECT id FROM test_content_type WHERE ` +
          Object.entries(filter)
            .map(
              ([key, value], index) =>
                `data ->> $${index + 1 + Object.entries(filter).length} = $${
                  index + 1
                }`
            )
            .join(" AND ") +
          ` LIMIT 1;`;
        page = // postgres
          (
            await prisma.$queryRawUnsafe<
              {
                id: string | number;
              }[]
            >(
              query,
              ...[
                ...Object.entries(filter).map(([key, value]) => value),
                ...Object.entries(filter).map(([key, value]) => key),
              ]
            )
          )[0];
      }
      return page?.id ?? null;
    },
  },
  {
    getPageAmount: async (query) => {
      "use server";
      return 1;
    },
    search: async (query, returnValues, selector) => {
      "use server";
      // This function should need some cleanup, but it works
      // varables for sql parameters
      const vars = [
        // values to return (column names)
        ...Object.entries(returnValues).map(([key, value]) => key),
        // where clause column names
        ...Object.entries(query).map(([key, value]) => key),
        // where clause values
        ...Object.entries(query).reduce((prev, [key, value]) => {
          Object.entries(value).map(([key, value]) => prev.push(value));
          return prev;
        }, [] as any[]),
      ];
      let data: object[] = [];
      let nextCursor: string | number | null = null;
      if (selector.mode === "infinite") {
        // sql query
        const sql =
          `SELECT` +
          " " +
          // values to return
          Object.entries(returnValues)
            .map(([], index) => `data ->> $${index + 1} AS "${index + "data"}"`)
            .join(", ") +
          // always return id and select table
          `, id FROM test_content_type ` +
          // where clause if needed
          (Object.entries(query).length > 0 || selector.cursor
            ? "WHERE" +
              " " +
              Object.entries(query)
                .map(([, value]) =>
                  Object.entries(value)
                    .map(([operator], index) =>
                      createOperation(
                        operator,
                        `$${Object.entries(returnValues).length + (index + 1)}`,
                        `$${
                          Object.entries(returnValues).length +
                          Object.entries(value).length +
                          (index + 1)
                        }`
                      )
                    )
                    .join(" AND ")
                )
                .join(" AND ")
            : "") +
          // cursor logic
          (selector.cursor
            ? (Object.entries(query).length > 0 ? " AND " : "") +
              `"public"."test_content_type"."id" >= (SELECT "public"."test_content_type"."id" FROM "public"."test_content_type" WHERE ("public"."test_content_type"."id") = ($${
                vars.length + 1
              }))`
            : "") +
          " " +
          // order by id (ordering should always be the same, else infinite scroll will break)
          `ORDER BY "public"."test_content_type"."id" ASC LIMIT $${
            vars.length + (selector.cursor ? 2 : 1)
          }`;
        // if cursor is set, add last cursor to vars
        if (selector.cursor) vars.push(selector.cursor);
        // add ammount to vars
        vars.push(selector.ammount + 1);
        // run query
        data = await prisma.$queryRawUnsafe<object[]>(sql, ...vars);
        // get the next cursor if there is one
        const lastItem = data.length > selector.ammount ? data.pop() : {};
        nextCursor =
          lastItem &&
          "id" in lastItem &&
          (typeof lastItem.id == "string" || typeof lastItem.id == "number")
            ? lastItem.id ?? null
            : null;
        // return the data
      } else if (selector.mode === "pagination") {
        const sql = `SELECT ${Object.entries(returnValues)
          .map(([], index) => `data ->> $${index + 1} AS "${index}data"`)
          .join(", ")} FROM test_content_type ${
          Object.keys(query).length > 0
            ? `WHERE ${Object.entries(query)
                .map(([, value]) =>
                  Object.entries(value)
                    .map(([operator], index) =>
                      createOperation(
                        operator,
                        `$${Object.entries(returnValues).length + (index + 1)}`,
                        `$${
                          Object.entries(returnValues).length +
                          Object.entries(value).length +
                          (index + 1)
                        }`
                      )
                    )
                    .join(" AND ")
                )
                .join(" AND ")}`
            : ""
        } LIMIT $${vars.length + 1} OFFSET $${vars.length + 2}`;
        vars.push(selector.ammount);
        vars.push((selector.page ?? 0) * selector.ammount);
        data = await prisma.$queryRawUnsafe<object[]>(sql, ...vars);
      }
      return {
        nextCursor,
        data: data.map((item) =>
          Object.entries(item).reduce((prev, [key, value]) => {
            // map the data to the correct keys (since postgres does not accept parameters as column names)
            const values = prev;
            const keyName =
              Object.keys(returnValues)[parseInt(key.replace("data", ""))];
            if (key !== "id" && keyName) values[keyName] = value;
            else if (key === "id") values.id = value;
            return values;
          }, {} as any)
        ),
      };
    },
  },
  {
    afterUpdatingContent: async (pap) => {
      "use server";
      // throw new Error("pap");
    },
  }
);

const createOperation = (operator: string, key: string, value: unknown) => {
  return operator === "eq"
    ? `data ->> ${key} = ${value}`
    : operator === "gt"
      ? `data ->> ${key} > ${value}`
      : operator === "lt"
        ? `data ->> ${key} < ${value}`
        : operator === "gte"
          ? `data ->> ${key} >= ${value}`
          : operator === "lte"
            ? `data ->> ${key} <= ${value}`
            : operator === "neq"
              ? `data ->> ${key} != ${value}`
              : operator === "like"
                ? `data ->> ${key} LIKE concat('%', ${value}, '%')`
                : operator === "nlike"
                  ? `data ->> ${key} NOT LIKE concat('%', ${value}, '%')`
                  : `data ->> ${key} = ${value}`;
};
