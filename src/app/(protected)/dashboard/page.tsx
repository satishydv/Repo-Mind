'use client'
import { Button } from '@/components/ui/button'
import { useUser } from '@clerk/nextjs'
import React from 'react'
import useProject from '@/hooks/use-project'
import { ExternalLink, Github, Sparkles, Code2, Globe, Brain } from 'lucide-react'
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
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in zoom-in-95 duration-700">
      {/* Project Header Card */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-mesh p-8 md:p-12 text-foreground shadow-2xl border border-white/20">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 size-96 rounded-full bg-pastel-pink/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 size-64 rounded-full bg-pastel-blue/20 blur-[100px] animate-pulse delay-1000" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/40 dark:bg-white/10 rounded-2xl backdrop-blur-xl border border-white/40 shadow-xl shadow-primary/5">
                <Github className="size-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight leading-none mb-2">{project.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                  <Globe className="size-4" />
                  <Link
                    href={project.githubUrl}
                    target="_blank"
                    className="hover:text-primary transition-colors flex items-center gap-1 underline underline-offset-4 decoration-primary/30"
                  >
                    <span className="text-sm truncate max-w-[200px] md:max-w-md">{project.githubUrl}</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" className="rounded-2xl h-12 px-6 border-white/40 glass hover:bg-white/60 transition-all font-bold group">
              <Sparkles className="size-4 mr-2 text-rose-500 group-hover:scale-110 transition-transform" />
              Analyze Project
            </Button>
            <Button className="rounded-2xl h-12 px-6 bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-bold transition-all hover:scale-105 active:scale-95">
              Add Contributors
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Commits', value: '1,284', color: 'text-blue-500', bg: 'glass-blue' },
          { label: 'Issues', value: '12', color: 'text-rose-500', bg: 'glass-pink' },
          { label: 'Contributors', value: '8', color: 'text-emerald-500', bg: 'glass-emerald' },
          { label: 'Files', value: '452', color: 'text-amber-500', bg: 'glass-amber' },
        ].map((stat, i) => (
          <div key={i} className={`p-4 rounded-3xl ${stat.bg} border-white/10 shadow-sm flex flex-col items-center justify-center gap-1 group hover:scale-[1.02] transition-all`}>
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">{stat.label}</span>
            <span className={`text-2xl font-black ${stat.color} tabular-nums`}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* AI Interaction Section */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Brain className="size-5 text-purple-500" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">AI Assistant</h2>
            </div>
          </div>
          <div className="rounded-[2.5rem] p-1 glass-purple border-purple-500/10 shadow-2xl shadow-purple-500/5">
            <div className="bg-card dark:bg-black/20 rounded-[2.25rem] overflow-hidden">
              <AskQuestionCard />
            </div>
          </div>
        </section>

        {/* Commit History Section */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Code2 className="size-5 text-amber-500" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Recent Activity</h2>
            </div>
          </div>
          <div className="rounded-[2.5rem] p-1 glass-amber border-amber-500/10 shadow-2xl shadow-amber-500/5 h-full">
            <div className="bg-card dark:bg-black/20 rounded-[2.25rem] p-6 h-[calc(100%-8px)] overflow-y-auto custom-scrollbar">
              <Commit />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default DashboardPage
