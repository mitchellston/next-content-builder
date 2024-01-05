"use server";
import "server-only";
import { PrismaClient } from "@prisma/client";

export const getContentId = async (filter: unknown, prisma: PrismaClient) => {
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
  else if (typeof filter === "object" && filter)
    page = // postgres
      (
        await prisma
          .$queryRawUnsafe<
            {
              id: string | number;
            }[]
          >(
            `SELECT id FROM test_content_type WHERE ` +
              Object.entries(filter)
                .map(
                  ([key, value], index) =>
                    `data ->> $${
                      index + 1 + Object.entries(filter).length
                    } = "$${index + 1}"`
                )
                .join(" AND ") +
              ` LIMIT 1;`,
            ...[
              ...Object.entries(filter).map(([key, value]) => value),
              ...Object.entries(filter).map(([key, value]) => key),
            ]
          )
          .catch(
            // mysql
            async () => {
              const data: any = [];
              Object.entries(filter).map(([key, value]) => {
                data.push("$." + key);
                data.push(value);
              });
              return await prisma.$queryRawUnsafe<
                {
                  id: string | number;
                }[]
              >(
                `SELECT id FROM test_content_type WHERE ` +
                  Object.entries(filter)
                    .map(() => `JSON_UNQUOTE(JSON_EXTRACT(data, ?)) = ?`)
                    .join(" AND ") +
                  ` LIMIT 1`,
                ...data
              );
            }
          )
      )[0];

  return page?.id ?? null;
};
