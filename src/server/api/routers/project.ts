import { pollCommits } from "@/lib/github";
import { indexGithubRepo } from "@/lib/github-loader";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
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
    // get commits for a project from the database
    getCommits: protectedProcedure.input(
        z.object({
            projectId: z.string(),
        })
    ).query(async ({ ctx, input }) => {
        // check for new commits from github
        pollCommits(input.projectId).then().catch(console.error);
        return await ctx.db.commit.findMany({ where: { projectId: input.projectId }, })
    }),
    archiveProject: protectedProcedure.input(z.object({ projectId: z.string() })).mutation(async ({ ctx, input }) => {
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