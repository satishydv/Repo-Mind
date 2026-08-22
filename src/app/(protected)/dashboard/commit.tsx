'use client'

import useProject from '@/hooks/use-project'
import { api } from '@/trpc/react'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import React from 'react'
import { formatDistanceToNow } from 'date-fns'

const Commit = () => {
  const { projectId, project } = useProject()
  const { data: commits, isLoading } = api.project.getCommits.useQuery({ projectId })

  if (!project) return null

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse flex gap-4 p-4 border border-gray-100 rounded-xl">
            <div className="size-9 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-12 bg-gray-100 rounded w-full" />
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
            className="border border-gray-200 rounded-xl p-5 bg-white shadow-2xs hover:border-gray-300 transition-colors"
          >
            {/* Header: Author + relative time */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={commit.commitAuthorAvatar || "https://github.com/identicons/app.png"}
                  alt={commit.commitAuthorName}
                  className="size-7 rounded-full bg-gray-100 border border-gray-200 shrink-0"
                />
                <Link
                  target="_blank"
                  href={`${project.githubUrl}/commit/${commit.commitHash}`}
                  className="text-xs font-semibold text-gray-900 hover:text-blue-600 transition-colors inline-flex items-center gap-1 truncate"
                >
                  <span>{commit.commitAuthorName}</span>
                  <span className="text-gray-500 font-normal">committed</span>
                  <ExternalLink className="size-3 text-gray-400" />
                </Link>
              </div>
              {timeAgo && (
                <span className="text-xs text-gray-400 shrink-0 font-normal">
                  {timeAgo}
                </span>
              )}
            </div>

            {/* Commit Message Title */}
            <h4 className="text-sm font-bold text-gray-900 leading-snug mb-2">
              {commit.commitMessage}
            </h4>

            {/* AI Summary Bullets in Clean Box */}
            {commit.summary && (
              <pre className="font-mono text-xs text-gray-600 bg-gray-50/70 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                {commit.summary}
              </pre>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Commit