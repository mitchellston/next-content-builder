"use server";
import "server-only";
import { PrismaClient } from "@prisma/client";
import { DatabaseProvider } from "../../type";
import { getFullContent } from "./getFullContent";
import { editContent } from "./editContent";
import { getContentId } from "./getContentId";
import { deleteContent } from "./deleteContent";
import { createContent } from "./createContent";

export const prisma = async (prisma: PrismaClient): DatabaseProvider => {
  "use server";
  return {
    createContent: async (values) => {
      "use server";
      return createContent(values, prisma);
    },
    deleteContent: async (id) => {
      "use server";
      return await deleteContent(id, prisma);
    },
    editContent: async (id, values) => {
      "use server";
      return await editContent(id, values, prisma);
    },
    getFullContent: async (id) => {
      "use server";
      return await getFullContent(id, prisma);
    },
    getContentId: async (filter) => {
      "use server";
      return await getContentId(filter, prisma);
    },
  };
};
