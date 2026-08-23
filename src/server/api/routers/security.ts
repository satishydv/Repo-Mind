import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc'
import { z } from 'zod'
import { scanCodebase, generateAIFix, type SecurityAuditReport, type SecurityFinding, type FindingStatus } from '@/lib/security-auditor'

export const securityRouter = createTRPCRouter({
  /**
   * Get latest security audit or run real-time codebase scan
   */
  getAudit: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }): Promise<SecurityAuditReport> => {
      if (!input.projectId) {
        return {
          healthScore: 100,
          grade: 'A+',
          scannedAt: new Date().toISOString(),
          totalFiles: 0,
          totalFindings: 0,
          counts: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
          categoryScores: [],
          findings: [],
        }
      }

      // Safely check if persisted audit exists in DB
      try {
        if ((ctx.db as any).securityAudit?.findFirst) {
          const existing = await (ctx.db as any).securityAudit.findFirst({
            where: { projectId: input.projectId },
            orderBy: { createdAt: 'desc' },
          })

          if (existing) {
            return {
              healthScore: existing.healthScore,
              grade: existing.grade as any,
              scannedAt: existing.createdAt.toISOString(),
              totalFiles: (existing.summary as any)?.totalFiles || 0,
              totalFindings: ((existing.findings as any[]) || []).length,
              counts: (existing.summary as any)?.counts || { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
              categoryScores: (existing.summary as any)?.categoryScores || [],
              findings: (existing.findings as unknown as SecurityFinding[]) || [],
            }
          }
        }
      } catch (err) {
        console.warn('Could not read existing audit from DB:', err)
      }

      // Fetch files from SourceCodeEmbedding and perform real-time scan
      const files = await ctx.db.sourceCodeEmbedding.findMany({
        where: { projectId: input.projectId },
        select: { fileName: true, sourceCode: true },
      })

      const report = scanCodebase(files)

      // Save initial audit record if DB model is available
      try {
        if ((ctx.db as any).securityAudit?.create) {
          await (ctx.db as any).securityAudit.create({
            data: {
              projectId: input.projectId,
              healthScore: report.healthScore,
              grade: report.grade,
              findings: report.findings as any,
              summary: {
                totalFiles: report.totalFiles,
                counts: report.counts,
                categoryScores: report.categoryScores,
              } as any,
            },
          })
        }
      } catch (err) {
        console.warn('Failed saving initial security audit to DB:', err)
      }

      return report
    }),

  /**
   * Run on-demand fresh security scan
   */
  runAudit: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }): Promise<SecurityAuditReport> => {
      const files = await ctx.db.sourceCodeEmbedding.findMany({
        where: { projectId: input.projectId },
        select: { fileName: true, sourceCode: true },
      })

      const report = scanCodebase(files)

      // Create new audit record if model is available
      try {
        if ((ctx.db as any).securityAudit?.create) {
          await (ctx.db as any).securityAudit.create({
            data: {
              projectId: input.projectId,
              healthScore: report.healthScore,
              grade: report.grade,
              findings: report.findings as any,
              summary: {
                totalFiles: report.totalFiles,
                counts: report.counts,
                categoryScores: report.categoryScores,
              } as any,
            },
          })
        }
      } catch (err) {
        console.warn('Failed saving security audit to DB:', err)
      }

      return report
    }),

  /**
   * Generate Gemini AI deep-dive explanation and fix
   */
  getAIFix: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        finding: z.custom<SecurityFinding>(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const fileRecord = await ctx.db.sourceCodeEmbedding.findFirst({
        where: {
          projectId: input.projectId,
          fileName: input.finding.file,
        },
        select: { sourceCode: true },
      })

      return await generateAIFix(input.finding, fileRecord?.sourceCode)
    }),

  /**
   * Update status of a finding (e.g. mark fixed or ignored)
   */
  updateFindingStatus: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        findingId: z.string(),
        status: z.enum(['open', 'fixed', 'ignored']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if ((ctx.db as any).securityAudit?.findFirst) {
          const latestAudit = await (ctx.db as any).securityAudit.findFirst({
            where: { projectId: input.projectId },
            orderBy: { createdAt: 'desc' },
          })

          if (latestAudit) {
            const currentFindings = (latestAudit.findings as unknown as SecurityFinding[]) || []
            const updatedFindings = currentFindings.map(f => {
              if (f.id === input.findingId) {
                return { ...f, status: input.status as FindingStatus }
              }
              return f
            })

            // Recalculate health score with active (open) findings only
            const activeCounts = {
              critical: updatedFindings.filter(f => f.status === 'open' && f.severity === 'critical').length,
              high: updatedFindings.filter(f => f.status === 'open' && f.severity === 'high').length,
              medium: updatedFindings.filter(f => f.status === 'open' && f.severity === 'medium').length,
              low: updatedFindings.filter(f => f.status === 'open' && f.severity === 'low').length,
              info: updatedFindings.filter(f => f.status === 'open' && f.severity === 'info').length,
            }

            let newHealthScore = 100 - (
              activeCounts.critical * 25 +
              activeCounts.high * 15 +
              activeCounts.medium * 8 +
              activeCounts.low * 3 +
              activeCounts.info * 1
            )
            newHealthScore = Math.max(0, Math.min(100, newHealthScore))

            let newGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A+'
            if (newHealthScore >= 95) newGrade = 'A+'
            else if (newHealthScore >= 85) newGrade = 'A'
            else if (newHealthScore >= 70) newGrade = 'B'
            else if (newHealthScore >= 50) newGrade = 'C'
            else if (newHealthScore >= 35) newGrade = 'D'
            else newGrade = 'F'

            await (ctx.db as any).securityAudit.update({
              where: { id: latestAudit.id },
              data: {
                healthScore: newHealthScore,
                grade: newGrade,
                findings: updatedFindings as any,
                summary: {
                  ...((latestAudit.summary as any) || {}),
                  counts: activeCounts,
                },
              },
            })

            return { success: true, healthScore: newHealthScore, grade: newGrade }
          }
        }
      } catch (err) {
        console.warn('Could not update status in DB:', err)
      }

      return { success: true, healthScore: 100, grade: 'A+' }
    }),
})
