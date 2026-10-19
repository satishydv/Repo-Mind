import { TRPCError } from "@trpc/server";

import type { PrismaClient } from "@prisma/client";

/** Ensure the signed-in user is a member of an active project before accessing it. */
export async function assertProjectAccess(
  db: PrismaClient,
  userId: string,
  projectId: string,
) {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      deletedAt: null,
      userToProjects: {
        some: { userId },
      },
    },
    select: { id: true },
  });

  if (!project) {
    // Use NOT_FOUND so callers cannot distinguish another user's project from an
    // ID that does not exist.
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Project not found",
    });
  }
}
