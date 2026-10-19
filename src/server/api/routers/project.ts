import { pollCommits } from "@/lib/github";
import { indexGithubRepo } from "@/lib/github-loader";
import { syncGithubRepo } from "@/lib/github-sync";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { assertProjectAccess } from "@/server/api/project-access";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const projectRouter = createTRPCRouter({
    createProject: protectedProcedure.input(
        z.object({
            name: z.string(),
            githubUrl: z.string(),
            githubToken: z.string().optional(),
        })
    ).mutation(async ({ ctx, input }) => {
        // create project in db
        const project = await ctx.db.project.create({
            data: {
                name: input.name,
                githubUrl: input.githubUrl,
                syncStatus: "indexing",
                syncStartedAt: new Date(),
                userToProjects: {
                    create: {
                        userId: ctx.user.userId!,
                    }
                }
            }
        });

        // Run indexing and commit polling in the background without blocking
        // This prevents the mutation from failing if these operations take too long or error out
        indexGithubRepo(project.id, input.githubUrl, input.githubToken)
            .then(() => console.log('✅ Successfully indexed repository'))
            .catch((error) => console.error('❌ Error indexing repository:', error));

        pollCommits(project.id)
            .then(() => console.log('✅ Successfully polled commits'))
            .catch((error) => console.error('❌ Error polling commits:', error));

        return project;
    }),
    getProjects: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.db.project.findMany({
            where: {
                userToProjects: {
                    some: {
                        userId: ctx.user.userId!
                    }
                },
                deletedAt: null
            }
        });
    }),
    syncProject: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            githubToken: z.string().optional(),
        })
    ).mutation(async ({ ctx, input }) => {
        await assertProjectAccess(ctx.db, ctx.user.userId!, input.projectId);
        const staleSyncBefore = new Date(Date.now() - 15 * 60 * 1000);
        const claimed = await ctx.db.project.updateMany({
            where: {
                id: input.projectId,
                deletedAt: null,
                userToProjects: { some: { userId: ctx.user.userId! } },
                OR: [
                    { syncStatus: { in: ["ready", "failed"] } },
                    {
                        syncStatus: { in: ["indexing", "syncing"] },
                        syncStartedAt: { lt: staleSyncBefore },
                    },
                ],
            },
            data: {
                syncStatus: "syncing",
                syncStartedAt: new Date(),
            },
        });

        if (claimed.count === 0) {
            const project = await ctx.db.project.findUnique({
                where: { id: input.projectId },
                select: { syncStatus: true },
            });
            throw new TRPCError({
                code: "CONFLICT",
                message: project?.syncStatus === "indexing"
                    ? "Initial repository indexing is still running. Try syncing again when it finishes."
                    : "A repository sync is already running. Try again when it finishes.",
            });
        }

        try {
            const result = await syncGithubRepo(input.projectId, input.githubToken);
            await ctx.db.project.update({
                where: { id: input.projectId },
                data: { syncStatus: "ready", syncStartedAt: null },
            });
            return result;
        } catch (error) {
            await ctx.db.project.update({
                where: { id: input.projectId },
                data: { syncStatus: "failed", syncStartedAt: null },
            });
            throw error;
        }
    }),
    // get commits for a project from the database
    getCommits: protectedProcedure.input(
        z.object({
            projectId: z.string(),
        })
    ).query(async ({ ctx, input }) => {
        await assertProjectAccess(ctx.db, ctx.user.userId!, input.projectId);
        // check for new commits from github
        pollCommits(input.projectId).then().catch(console.error);
        return await ctx.db.commit.findMany({ where: { projectId: input.projectId }, })
    }),
    archiveProject: protectedProcedure.input(z.object({ projectId: z.string() })).mutation(async ({ ctx, input }) => {
        await assertProjectAccess(ctx.db, ctx.user.userId!, input.projectId);
        return await ctx.db.project.update({
            where: { id: input.projectId },
            data: { deletedAt: new Date() }
        })
    }),
    saveAnswer: protectedProcedure.input(
        z.object({
            projectId: z.string(),
            question: z.string(),
            answer: z.string(),
            filesReferences: z.any().optional(),
        })
    ).mutation(async ({ ctx, input }) => {
        await assertProjectAccess(ctx.db, ctx.user.userId!, input.projectId);
        const userExists = await ctx.db.user.findUnique({
            where: { id: ctx.user.userId! }
        });
        if (!userExists) {
            await ctx.db.user.create({
                data: {
                    id: ctx.user.userId!,
                    emailAddress: `${ctx.user.userId}@placeholder.com`,
                }
            }).catch(() => null);
        }

        return await ctx.db.question.create({
            data: {
                projectId: input.projectId,
                userId: ctx.user.userId!,
                question: input.question,
                answer: input.answer,
                filesReferences: input.filesReferences ?? [],
            }
        });
    }),
    getQuestions: protectedProcedure.input(
        z.object({
            projectId: z.string(),
        })
    ).query(async ({ ctx, input }) => {
        if (!input.projectId) return [];
        await assertProjectAccess(ctx.db, ctx.user.userId!, input.projectId);
        return await ctx.db.question.findMany({
            where: {
                projectId: input.projectId,
            },
            include: {
                user: true,
            },
            orderBy: {
                createdAt: "desc",
            }
        });
    }),
});
