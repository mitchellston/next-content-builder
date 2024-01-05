"use server";
import "server-only";
import { PrismaClient } from "@prisma/client";

export const editContent = async (
  id: string | number,
  pageInfo: object,
  prisma: PrismaClient
) => {
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
};
