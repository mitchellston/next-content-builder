"use server";
import "server-only";
import { SearchProvider } from "../../type";
import { search } from "./search";
import { getPageAmount } from "./getPageAmount";
import { PrismaClient } from "@prisma/client";

export const prisma = async (prisma: PrismaClient): SearchProvider => {
  "use server";
  return {
    getPageAmount: async (query) => {
      "use server";
      return getPageAmount(query, prisma);
    },
    search: async (query, returnValues, selector) => {
      "use server";
      return await search(query, returnValues, selector, prisma);
    },
  };
};
