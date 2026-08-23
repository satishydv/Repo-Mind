import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { z } from 'zod'
import {
  buildArchitectureGraph,
  explainModuleWithAI,
  askModuleAI,
  type ArchitectureGraphData,
  type GraphNodeData,
} from '@/lib/dependency-graph'

export const architectureRouter = createTRPCRouter({
  /**
   * Get dependency graph data and layout for a project
   */
  getGraphData: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        direction: z.enum(['LR', 'TB']).default('LR'),
      })
    )
    .query(async ({ ctx, input }): Promise<ArchitectureGraphData> => {
      if (!input.projectId) {
        return {
          nodes: [],
          edges: [],
          stats: {
            totalModules: 0,
            totalDependencies: 0,
            maxDepth: 0,
            circularDependenciesCount: 0,
            categories: {
              page: 0,
              api: 0,
              component: 0,
              hook: 0,
              server: 0,
              lib: 0,
              config: 0,
              other: 0,
            },
          },
        }
      }

      const files = await ctx.db.sourceCodeEmbedding.findMany({
        where: { projectId: input.projectId },
        select: {
          fileName: true,
          sourceCode: true,
          summary: true,
        },
      })

      return buildArchitectureGraph(files, input.direction)
    }),

  /**
   * AI Click-to-Explain module analysis
   */
  explainModule: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        module: z.custom<GraphNodeData>(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const fileRecord = await ctx.db.sourceCodeEmbedding.findFirst({
        where: {
          projectId: input.projectId,
          fileName: input.module.fileName,
        },
        select: { sourceCode: true },
      })

      return await explainModuleWithAI(input.module, fileRecord?.sourceCode)
    }),

  /**
   * Interactive Q&A for a specific module
   */
  askModuleAI: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        module: z.custom<GraphNodeData>(),
        question: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const fileRecord = await ctx.db.sourceCodeEmbedding.findFirst({
        where: {
          projectId: input.projectId,
          fileName: input.module.fileName,
        },
        select: { sourceCode: true },
      })

      return await askModuleAI(input.module, input.question, fileRecord?.sourceCode)
    }),
})
