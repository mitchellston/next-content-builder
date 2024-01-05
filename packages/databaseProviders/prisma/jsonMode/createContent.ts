"use server";
import "server-only";
import { PrismaClient } from "@prisma/client";

export const createContent = async (pageInfo: object, prisma: PrismaClient) => {
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
};
