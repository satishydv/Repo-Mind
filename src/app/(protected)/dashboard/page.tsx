'use client'
import { Button } from '@/components/ui/button'
import { useUser } from '@clerk/nextjs'
import React from 'react'
import useProject from '@/hooks/use-project'
import { ExternalLink, Github, Sparkles, Code2 } from 'lucide-react'
import Link from 'next/link'
import Commit from './commit'
import AskQuestionCard from '@/app/(protected)/dashboard/ask-question-card'


const DashboardPage = () => {
  const { project } = useProject()

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="p-6 bg-primary/5 rounded-full mb-6 animate-pulse">
          <Github className="size-12 text-primary/40" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No project selected</h2>
        <p className="text-muted-foreground max-w-sm">
          Pick a project from the sidebar or create a new one to get started with AI insights.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Project Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-10 text-white shadow-2xl shadow-primary/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 size-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 size-48 rounded-full bg-blue-400/20 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md border border-white/30">
                <Github className="size-6 shadow-sm" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">{project.name}</h1>
            </div>
            <div className="flex items-center gap-2 text-white/80 font-medium">
              <span className="text-sm">Linked to:</span>
              <Link
                href={project.githubUrl}
                target="_blank"
                className="inline-flex items-center hover:text-white transition-colors group"
              >
                <code className="bg-black/20 px-2 py-0.5 rounded text-xs mr-1">{project.githubUrl}</code>
                <ExternalLink className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md shadow-lg">
              Project Statistics
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* AI Interaction Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="size-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">AI Code Assistant</h2>
          </div>
          <div className="rounded-2xl border border-white/10 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
            <AskQuestionCard />
          </div>
        </section>

        {/* Commit History Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Code2 className="size-5 text-primary" />
            <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
          </div>
          <div className="rounded-2xl border border-white/10 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
            <Commit />
          </div>
        </section>
      </div>
    </div>
  )
}

export default DashboardPage
