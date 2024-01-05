"use server";
import "server-only";
import { PrismaClient } from "@prisma/client";

export const search = async (
  query: object,
  returnValues: object,
  selector: (
    | { mode: "infinite"; cursor?: string | number }
    | { mode: "pagination"; page?: number }
  ) & {
    ammount: number;
  },
  prisma: PrismaClient
) => {
  if (selector.mode === "infinite") {
    const data = await prisma.test_content_type.findMany({
      cursor: selector.cursor ? { id: selector.cursor as any } : undefined,

      take: selector.ammount + 1,
      // where: {
      //   data: {
      //     gte: { toJSON: query },
      //   },
      // },
    });
    const nextCursor =
      data.length > selector.ammount ? data.pop()?.id ?? null : null;
    return {
      nextCursor,
      data: data.map((page) => page.data) as object[],
    };
  }
  const data = await prisma.test_content_type.findMany({
    take: selector.ammount,
    skip: (selector.page ?? 0) * selector.ammount,
    // where: {
    //   data: {
    //     gte: { toJSON: query },
    //   },
    // },
  });
  return {
    data: data.flatMap((page) =>
      typeof page.data == "object" ? (page.data as object) : {}
    ),
    nextCursor: null,
  };
};
