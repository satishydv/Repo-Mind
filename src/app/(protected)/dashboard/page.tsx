'use client'

import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import useProject from '@/hooks/use-project'
import { ExternalLink, Presentation, Upload, Plus, GitBranch, MessageSquareCode, ArrowRight, Archive } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import Link from 'next/link'
import Commit from './commit'
import AskQuestionCard from '@/app/(protected)/dashboard/ask-question-card'
import { QuestionSheet, type QuestionData } from '@/app/(protected)/qa/question-sheet'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

const DashboardPage = () => {
  const { project, projectId } = useProject()
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionData | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)

  const ctx = api.useUtils()
  const archiveProject = api.project.archiveProject.useMutation({
    onSuccess: () => {
      toast.success("Project archived successfully")
      ctx.project.getProjects.invalidate()
      setArchiveDialogOpen(false)
    },
    onError: () => {
      toast.error("Failed to archive project")
    }
  })

  const { data: questions } = api.project.getQuestions.useQuery(
    { projectId: project?.id || '' },
    { enabled: !!project?.id }
  )

  const { data: securityReport } = api.security.getAudit.useQuery(
    { projectId: project?.id || '' },
    { enabled: !!project?.id }
  )

  const { data: archData } = api.architecture.getGraphData.useQuery(
    { projectId: project?.id || '', direction: 'LR' },
    { enabled: !!project?.id }
  )

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-white rounded-2xl border border-gray-200 p-8">
        <div className="size-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <GitBranch className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No project selected</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">
          Select an existing project from the sidebar or link a new repository to get started.
        </p>
        <Link href="/create">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg gap-2 text-sm font-medium">
            <Plus className="size-4" />
            Create Project
          </Button>
        </Link>
      </div>
    )
  }

  const handleArchive = () => {
    archiveProject.mutate({ projectId: project.id })
  }

  const handleOpenQuestion = (q: any) => {
    setSelectedQuestion(q)
    setSheetOpen(true)
  }

  const hasSavedQuestions = questions && questions.length > 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Matching Image 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Blue Linked Repository Pill */}
        <Link
          href={project.githubUrl}
          target="_blank"
          className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors shadow-2xs w-fit max-w-full truncate"
        >
          <svg className="size-4 shrink-0 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span className="truncate">This project is linked to {project.githubUrl}</span>
          <ExternalLink className="size-3.5 shrink-0 opacity-80" />
        </Link>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              toast.success("Project invite link copied!")
            }}
            className="h-10 px-4 rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium shadow-2xs transition-colors cursor-pointer"
          >
            Invite a team member!
          </Button>

          <Button
            variant="outline"
            onClick={() => setArchiveDialogOpen(true)}
            disabled={archiveProject.isPending}
            className="h-10 px-4 rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 text-gray-700 dark:text-gray-200 text-sm font-medium transition-colors shadow-2xs cursor-pointer"
          >
            Archive
          </Button>
        </div>
      </div>

      {/* Row of 2 Feature Highlight Cards: Security Auditor & Architecture Graph */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Security Health Card */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-gray-900 shadow-2xs flex flex-col justify-between transition-colors">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <svg className="size-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Security & Secret Auditor</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {securityReport ? `${securityReport.totalFindings} findings detected` : "Real-time codebase security"}
                </p>
              </div>
            </div>

            {securityReport && (
              <div className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-right">
                <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {securityReport.healthScore}/100
                </div>
                <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                  Grade {securityReport.grade}
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
            Scan repository source files for accidental credential leaks, SQL injection vulnerabilities, and anti-patterns.
          </p>

          <Link href="/security" className="block w-full">
            <Button
              variant="outline"
              className="w-full h-8 text-xs font-medium text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg justify-between"
            >
              <span>Open Security Auditor</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>

        {/* Architecture Graph Card */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-gray-900 shadow-2xs flex flex-col justify-between transition-colors">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <svg className="size-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Dependency & Architecture Graph</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {archData ? `${archData.nodes.length} modules • ${archData.edges.length} connections` : "Interactive React Flow map"}
                </p>
              </div>
            </div>

            {archData && (
              <div className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-right">
                <div className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  {archData.nodes.length} Files
                </div>
                <div className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                  Depth {archData.stats.maxDepth}
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
            Explore interactive node graph showing module dependencies, API routes, and click-to-explain AI summaries.
          </p>

          <Link href="/architecture" className="block w-full">
            <Button
              variant="outline"
              className="w-full h-8 text-xs font-medium text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg justify-between"
            >
              <span>Explore Architecture Graph</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Row of 2 Cards: Left Ask Question, Right Saved Questions or Meeting */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Ask a Question */}
        <div>
          <AskQuestionCard />
        </div>

        {/* Right Card: Saved Questions if available, else Create Meeting card */}
        {hasSavedQuestions ? (
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-6 bg-white dark:bg-gray-900 shadow-2xs flex flex-col justify-between transition-colors">
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <MessageSquareCode className="size-4.5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-none">Saved Questions</h2>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">
                      {questions.length} {questions.length === 1 ? 'question' : 'questions'} saved
                    </span>
                  </div>
                </div>
                <Link
                  href="/qa"
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  <span>View all</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>

              {/* Questions list */}
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {questions.slice(0, 3).map((q) => {
                  let timeAgo = ''
                  try {
                    timeAgo = formatDistanceToNow(new Date(q.createdAt), { addSuffix: true })
                  } catch {
                    timeAgo = ''
                  }

                  const answerSnippet = q.answer
                    ? q.answer.replace(/\n+/g, ' ').slice(0, 90) + '...'
                    : 'Click to view answer'

                  return (
                    <div
                      key={q.id}
                      onClick={() => handleOpenQuestion(q)}
                      className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-700 bg-gray-50/50 dark:bg-gray-800/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 transition-all cursor-pointer group"
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {q.question}
                        </h4>
                        {timeAgo && (
                          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-normal shrink-0">
                            {timeAgo}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 font-normal">
                        {answerSnippet}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
              <Link href="/qa" className="block w-full">
                <Button variant="outline" className="w-full h-8 text-xs font-medium text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  Open full Q&A page
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-6 bg-white dark:bg-gray-900 shadow-2xs flex flex-col items-center justify-center text-center transition-colors">
            <div className="size-12 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-800 dark:text-gray-200 mb-3 shadow-2xs">
              <Presentation className="size-6 text-gray-800 dark:text-gray-200" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Create a new meeting</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mt-1 mb-5">
              Analyse your meeting with RepoMind. Powered by AI.
            </p>
            <Link href="/meetings">
              <Button className="rounded-lg h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors flex items-center gap-2 shadow-2xs cursor-pointer">
                <Upload className="size-3.5" />
                <span>Upload Meeting</span>
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Recent Commit History Section */}
      <div className="space-y-4 pt-2">
        <Commit />
      </div>

      {/* Slide-Over Modal Drawer when clicking a saved question */}
      <QuestionSheet
        question={selectedQuestion}
        open={sheetOpen}
        setOpen={setSheetOpen}
      />

      {/* Archive Confirmation Popup Dialog */}
      <AlertDialog
        open={archiveDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen && !archiveProject.isPending) {
            setArchiveDialogOpen(false)
          }
        }}
      >
        <AlertDialogContent className="sm:max-w-[420px] rounded-2xl p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl">
          <AlertDialogHeader className="text-left space-y-3">
            <div className="size-11 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-100 dark:border-red-900/50">
              <Archive className="size-5" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Archive Project
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                Are you sure you want to archive <span className="font-semibold text-gray-900 dark:text-gray-200">&ldquo;{project.name}&rdquo;</span>? This will hide the project from your active dashboard.
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-5 flex flex-row items-center justify-end gap-2.5 sm:space-x-0">
            <AlertDialogCancel
              disabled={archiveProject.isPending}
              className="rounded-lg h-9 px-4 text-xs font-medium border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleArchive()
              }}
              disabled={archiveProject.isPending}
              className="rounded-lg h-9 px-4 text-xs font-medium bg-red-600 hover:bg-red-700 text-white shadow-xs focus-visible:ring-red-500 transition-colors cursor-pointer"
            >
              {archiveProject.isPending ? "Archiving..." : "Archive Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default DashboardPage
