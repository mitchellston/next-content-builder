"use server";
import "server-only";
import { PrismaClient } from "@prisma/client";

export const deleteContent = async (
  id: string | number,
  prisma: PrismaClient
) => {
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
};
