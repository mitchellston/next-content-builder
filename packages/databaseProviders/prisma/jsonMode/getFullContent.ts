"use server";
import "server-only";
import { PrismaClient } from "@prisma/client";

export const getFullContent = async (
  id: string | number,
  prisma: PrismaClient
) => {
  const page = await prisma.test_content_type.findUnique({
    where: {
      id: id as string,
    },
  });
  if (!page || !page.data) return null;
  return typeof page.data === "object" ? (page.data as object) : null;
};
