'use client'

import useProject from '@/hooks/use-project'
import { api } from '@/trpc/react'
import { ExternalLink, Sparkles, GitCommit } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g)
  return tokens.map((token, index) => {
    if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
      return (
        <code
          key={index}
          className="mx-0.5 px-1.5 py-0.5 rounded-md bg-indigo-50/90 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono text-[11px] font-semibold border border-indigo-200/60 dark:border-indigo-800/50"
        >
          {token.slice(1, -1)}
        </code>
      )
    }
    if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
      return (
        <strong key={index} className="font-semibold text-gray-900 dark:text-gray-100">
          {token.slice(2, -2)}
        </strong>
      )
    }
    return <React.Fragment key={index}>{token}</React.Fragment>
  })
}

const CommitSummaryCard = ({ summary }: { summary: string }) => {
  const lines = summary.split('\n')
  const elements: React.ReactNode[] = []
  let currentList: { text: string; indent: number }[] = []

  const flushList = () => {
    if (currentList.length > 0) {
      const listItems = currentList.map((item, idx) => {
        const isNested = item.indent > 0
        return (
          <li
            key={idx}
            className={cn(
              "text-xs leading-relaxed text-gray-700 dark:text-gray-300 flex items-start gap-2",
              isNested ? "ml-5 mt-1 text-gray-600 dark:text-gray-400" : "mt-1.5"
            )}
          >
            <span
              className={cn(
                "rounded-full shrink-0 mt-1.5",
                isNested
                  ? "size-1 bg-gray-400 dark:bg-gray-500"
                  : "size-1.5 bg-indigo-500 dark:bg-indigo-400"
              )}
            />
            <span className="flex-1">{renderInlineMarkdown(item.text)}</span>
          </li>
        )
      })

      elements.push(
        <ul key={`list-${elements.length}`} className="my-1.5 space-y-0.5">
          {listItems}
        </ul>
      )
      currentList = []
    }
  }

  lines.forEach((rawLine, i) => {
    const trimmed = rawLine.trim()
    if (!trimmed) {
      flushList()
      return
    }

    // Heading 3 (e.g. ### 1. Theme Management)
    if (trimmed.startsWith('### ')) {
      flushList()
      const heading = trimmed.replace(/^###\s+/, '')
      elements.push(
        <div
          key={`h3-${i}`}
          className="flex items-center gap-2 pt-3 pb-1 border-t border-slate-200/50 dark:border-slate-800/60 first:border-0 first:pt-0"
        >
          <div className="size-2 rounded-full bg-indigo-500 shrink-0" />
          <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {renderInlineMarkdown(heading)}
          </h5>
        </div>
      )
      return
    }

    // Heading 2 or 1 (## or #)
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      flushList()
      const heading = trimmed.replace(/^#+\s+/, '')
      elements.push(
        <div key={`h-${i}`} className="pt-2 pb-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
            {renderInlineMarkdown(heading)}
          </h4>
        </div>
      )
      return
    }

    // Bullet point (* or -)
    const bulletMatch = rawLine.match(/^(\s*)([*•\-])\s+(.*)$/)
    if (bulletMatch) {
      const indent = bulletMatch[1]?.length || 0
      const text = bulletMatch[3] || ''
      currentList.push({ text, indent })
      return
    }

    // Regular paragraph
    flushList()
    elements.push(
      <p key={`p-${i}`} className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-1.5">
        {renderInlineMarkdown(trimmed)}
      </p>
    )
  })

  flushList()

  return (
    <div className="mt-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-gray-900/60 shadow-2xs overflow-hidden">
      {/* AI Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-indigo-50/80 via-slate-50 to-white dark:from-indigo-950/40 dark:via-slate-900/60 dark:to-gray-900 border-b border-slate-200/60 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
          <Sparkles className="size-3.5 text-indigo-500" />
          <span className="font-bold">AI Commit Summary</span>
        </div>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          Diff Analysis
        </span>
      </div>

      {/* Formatted Content */}
      <div className="p-4 sm:p-5 space-y-1">
        {elements}
      </div>
    </div>
  )
}

const Commit = () => {
  const { projectId, project } = useProject()
  const { data: commits, isLoading } = api.project.getCommits.useQuery({ projectId })

  if (!project) return null

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-xl">
            <div className="size-9 rounded-full bg-gray-200 dark:bg-gray-800 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!commits || commits.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 text-sm">
        No commits indexed yet for this repository.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {commits.map((commit) => {
        let timeAgo = ''
        try {
          timeAgo = formatDistanceToNow(new Date(commit.commitDate), { addSuffix: true })
        } catch {
          timeAgo = ''
        }

        return (
          <div
            key={commit.id}
            className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 bg-white dark:bg-gray-900 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            {/* Header: Author + relative time */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={commit.commitAuthorAvatar || "https://github.com/identicons/app.png"}
                  alt={commit.commitAuthorName}
                  className="size-7 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shrink-0"
                />
                <Link
                  target="_blank"
                  href={`${project.githubUrl}/commit/${commit.commitHash}`}
                  className="text-xs font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1 truncate"
                >
                  <span>{commit.commitAuthorName}</span>
                  <span className="text-gray-500 dark:text-gray-400 font-normal">committed</span>
                  <ExternalLink className="size-3 text-gray-400 dark:text-gray-500" />
                </Link>
              </div>
              {timeAgo && (
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 font-normal">
                  {timeAgo}
                </span>
              )}
            </div>

            {/* Commit Message Title */}
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug mb-2 flex items-center gap-2">
              <GitCommit className="size-4 text-slate-400 shrink-0" />
              <span>{commit.commitMessage}</span>
            </h4>

            {/* AI Summary in Formatted Card */}
            {commit.summary && (
              <CommitSummaryCard summary={commit.summary} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Commit
