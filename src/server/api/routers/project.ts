import { pollCommits } from "@/lib/github";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { z } from "zod";

export const projectRouter = createTRPCRouter({
    createProject: protectedProcedure.input(
        z.object({
            name: z.string(),
            githubUrl: z.string(),
            githubToken: z.string().optional(),
        })
        ).mutation(async ({ctx, input}) => {
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
        // call pollCommits every time we create a project async is used to wait for the pollCommits to finish
        await pollCommits(project.id);
        return project;
    }),
    getProjects: protectedProcedure.query(async ({ctx}) => {
        return await ctx.db.project.findMany({
            where: {
                userToProjects: {
                    some: {
                        userId: ctx.user.userId!
                    }
                },
                deletedAt: null
            }
        })
        
    }),
    // get commits for a project from the database
    getCommits: protectedProcedure.input(
  z.object({
    projectId: z.string(),
  })
).query(async ({ ctx, input }) => {
    // check for new commits from github
 pollCommits(input.projectId).then().catch(console.error);
  return await ctx.db.commit.findMany({where: { projectId: input.projectId },})
})
});