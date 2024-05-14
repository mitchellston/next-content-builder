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
      multiple: {},
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
      // eslint-disable-next-line
      const page = await prisma.test_content_type.findUnique({
        where: {
          id: id as string,
        },
      });
      // eslint-disable-next-line
      if (!page || !page.data) return null;
      // eslint-disable-next-line
      return typeof page.data === "object" ? (page.data as object) : null;
    },
    createContent: async (pageInfo) => {
      "use server";
      try {
        // eslint-disable-next-line
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
        // eslint-disable-next-line
        await prisma.test_content_type.update({
          where: {
            // eslint-disable-next-line
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
        // eslint-disable-next-line
        await prisma.test_content_type.delete({
          where: {
            // eslint-disable-next-line
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
        // eslint-disable-next-line
        page = await prisma.test_content_type.findUnique({
          select: {
            id: true,
          },
          where: {
            // eslint-disable-next-line
            id: filter as any,
          },
        });
      else if (typeof filter === "object" && filter) {
        const query =
          `SELECT id FROM "test_content_type" WHERE ` +
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
              // eslint-disable-next-line
              ...[
                // eslint-disable-next-line
                ...Object.entries(filter).map(([key, value]) => value),
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                ...Object.entries(filter).map(([key, value]) => key),
              ]
            )
          )[0];
      }
      // eslint-disable-next-line
      return page?.id ?? null;
    },
  },
  {
    // eslint-disable-next-line
    getPageAmount: async (query) => {
      "use server";
      return 1;
    },
    search: async (query, returnValues, orderBy, selector) => {
      "use server";
      // This function should need some cleanup, but it works
      // varables for sql parameters
      const vars = [
        // values to return (column names)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        ...Object.entries(returnValues).map(([key]) => key),
        // where clause column names
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        ...Object.entries(query).map(([key]) => key),
        // where clause values
        // eslint-disable-next-line
        ...Object.entries(query).reduce((prev, [key, value]) => {
          // eslint-disable-next-line
          Object.entries(value).map(([key, value]) => prev.push(value));
          // eslint-disable-next-line
          return prev;
          // eslint-disable-next-line
        }, [] as any[]),
        // order by
        ...Object.entries(orderBy).map(([key]) => key),
        ...Object.entries(orderBy).map(([_, value]) => value),
      ];
      let data: object[] = [];
      // eslint-disable-next-line
      let nextCursor: null | number | string = null;
      // Select
      let howManyToAdd = 0;
      let sql =
        `SELECT` +
        " " +
        // values to return
        Object.entries(returnValues)
          .map(([], index) => `data ->> $${index + 1} AS "${index + "data"}"`)
          .join(", ") +
        // always return id and select table
        `, id FROM "test_content_type" `;
      // Where
      howManyToAdd += Object.entries(returnValues).length;
      sql =
        sql +
        // where clause if needed
        (Object.entries(query).length > 0
          ? "WHERE" +
            " " +
            Object.entries(query)
              .map(([, value]) =>
                // eslint-disable-next-line
                Object.entries(value)
                  .map(([operator], index) =>
                    createOperation(
                      operator,
                      `$${howManyToAdd + (index + 1)}`,
                      `$${
                        howManyToAdd +
                        // eslint-disable-next-line
                        Object.entries(value).length +
                        (index + 1)
                      }`
                    )
                  )
                  .join(" AND ")
              )
              .join(" AND ")
          : "");
      // update howManyToAdd
      Object.entries(query).map(([, value]) => {
        howManyToAdd += Object.entries(value).length;
        howManyToAdd += Object.entries(value).length;
      });

      if (selector.mode === "infinite") {
        // cursor logic
        if (selector.cursor) {
          if (Object.entries(query).length <= 0) sql += "WHERE";
          if (Object.entries(query).length > 0) sql += " AND ";
          sql =
            sql +
            `"public"."test_content_type"."id" >= (SELECT "public"."test_content_type"."id" FROM "public"."test_content_type" WHERE ("public"."test_content_type"."id") = ($${
              vars.length + 1
            }))`;
        }
        // Order by
        if (Object.entries(orderBy).length > 0) {
          sql += ` ORDER BY `;
          Object.entries(orderBy).map(([_, value], index) => {
            sql += `data ->> $${howManyToAdd + (index + 1)} ${
              value === "desc" ? "DESC" : "ASC"
            } `;
          });
          howManyToAdd += Object.entries(orderBy).length;
          howManyToAdd += Object.entries(orderBy).length;
        } else sql += ' ORDER BY "public"."test_content_type"."id" ASC';
        // Limit
        sql =
          sql +
          // order by id (ordering should always be the same, else infinite scroll will break)
          ` LIMIT $${vars.length + (selector.cursor ? 2 : 1)}`;

        // if cursor is set, add last cursor to vars
        if (selector.cursor) vars.push(selector.cursor);
        // add ammount to vars
        vars.push(selector.ammount + 1);
        // run query
        // eslint-disable-next-line
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
        // Order by
        if (Object.entries(orderBy).length > 0) {
          sql += ` ORDER BY `;
          Object.entries(orderBy).map(([_, value], index) => {
            sql += `data ->> $${howManyToAdd + (index + 1)} ${
              value === "desc" ? "DESC" : "ASC"
            } `;
          });
          howManyToAdd += Object.entries(orderBy).length;
          howManyToAdd += Object.entries(orderBy).length;
        } else sql += ' ORDER BY "public"."test_content_type"."id" ASC';
        sql = sql + ` LIMIT $${vars.length + 1} OFFSET $${vars.length + 2}`;
        vars.push(selector.ammount);
        vars.push((selector.page ?? 0) * selector.ammount);
        // eslint-disable-next-line
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        data = await prisma.$queryRawUnsafe<object[]>(sql, ...vars);
      }
      return {
        nextCursor,
        // eslint-disable-next-line
        data: data.map((item) =>
          // eslint-disable-next-line
          Object.entries(item).reduce((prev, [key, value]) => {
            // map the data to the correct keys (since postgres does not accept parameters as column names)
            // eslint-disable-next-line
            const values = prev;
            const keyName =
              Object.keys(returnValues)[parseInt(key.replace("data", ""))];
            // eslint-disable-next-line
            if (key !== "id" && keyName) values[keyName] = value;
            // eslint-disable-next-line
            else if (key === "id") values.id = value;
            // eslint-disable-next-line
            return values;
            // eslint-disable-next-line
          }, {} as any)
        ),
      };
    },
  },
  {}
);

const createOperation = (operator: string, key: string, value: string) => {
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
