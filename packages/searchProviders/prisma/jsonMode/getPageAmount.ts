"use server";
import "server-only";

import { PrismaClient } from "@prisma/client";

export const getPageAmount = async (query: object, prisna: PrismaClient) => {
  return 1;
};
