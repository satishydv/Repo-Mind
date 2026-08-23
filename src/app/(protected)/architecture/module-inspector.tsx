'use client'

import React, { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sparkles,
  RefreshCw,
  Send,
  Copy,
  Check,
  FileCode,
  ArrowDownLeft,
  ArrowUpRight,
  GitFork,
  ExternalLink,
  Layers,
  CheckCircle2,
  Workflow
} from 'lucide-react'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { GraphNodeData } from '@/lib/dependency-graph'

interface ModuleInspectorProps {
  module: GraphNodeData | null
  open: boolean
  setOpen: (open: boolean) => void
  projectId: string
  onSelectNode: (nodeId: string) => void
}

export function ModuleInspector({
  module,
  open,
  setOpen,
  projectId,
  onSelectNode,
}: ModuleInspectorProps) {
  const [activeTab, setActiveTab] = useState<'ai' | 'dependencies' | 'code'>('ai')
  const [copied, setCopied] = useState(false)
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatAnswers, setChatAnswers] = useState<{ q: string; a: string }[]>([])

  const explainMutation = api.architecture.explainModule.useMutation({
    onError: () => toast.error('Failed to analyze module architecture'),
  })

  const askMutation = api.architecture.askModuleAI.useMutation({
    onSuccess: (answer, variables) => {
      setChatAnswers((prev) => [...prev, { q: variables.question, a: answer }])
      setChatQuestion('')
    },
    onError: () => toast.error('Failed to get answer from AI'),
  })

  // Trigger AI explanation when opened if not loaded yet
  React.useEffect(() => {
    if (open && module && projectId && !explainMutation.data && !explainMutation.isPending) {
      explainMutation.mutate({ projectId, module })
      setChatAnswers([])
    }
  }, [open, module?.id, projectId])

  if (!module) return null

  const handleCopyCode = () => {
    if (module.sourceCodeSnippet) {
      navigator.clipboard.writeText(module.sourceCodeSnippet)
      setCopied(true)
      toast.success('Code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAskQuickPrompt = (prompt: string) => {
    if (!projectId || !module) return
    askMutation.mutate({ projectId, module, question: prompt })
  }

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatQuestion.trim() || !projectId || !module) return
    askMutation.mutate({ projectId, module, question: chatQuestion.trim() })
  }

  const aiData = explainMutation.data

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <SheetHeader className="text-left space-y-2 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {module.category} LAYER
            </span>
            <span className="text-xs text-gray-400 font-mono">{module.loc} Lines of Code</span>
          </div>
          <SheetTitle className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileCode className="size-5 text-blue-600 dark:text-blue-400" />
            {module.shortName}
          </SheetTitle>
          <SheetDescription className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">
            {module.fileName}
          </SheetDescription>
        </SheetHeader>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ai')}
            className={cn(
              'flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors',
              activeTab === 'ai'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            )}
          >
            <Sparkles className="size-3.5" />
            <span>AI Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('dependencies')}
            className={cn(
              'flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors',
              activeTab === 'dependencies'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            )}
          >
            <Workflow className="size-3.5" />
            <span>Dependencies ({module.inDegree + module.outDegree})</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={cn(
              'flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors',
              activeTab === 'code'
                ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            )}
          >
            <FileCode className="size-3.5" />
            <span>Source Code</span>
          </button>
        </div>

        {/* TAB 1: AI ARCHITECTURE EXPLANATION */}
        {activeTab === 'ai' && (
          <div className="space-y-5">
            {/* Primary Role Box */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">
                <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
                Architectural Responsibility
              </div>
              <p className="text-xs font-medium text-blue-950 dark:text-blue-100 leading-relaxed">
                {explainMutation.isPending ? (
                  <span className="flex items-center gap-2 text-blue-600 animate-pulse">
                    <RefreshCw className="size-3 animate-spin" />
                    Generating in-depth architectural breakdown with Gemini AI...
                  </span>
                ) : (
                  aiData?.role || module.summary || 'Core system module.'
                )}
              </p>
            </div>

            {/* Architecture Details & Data Flow */}
            {aiData && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                    Design & System Interaction
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                    {aiData.architectureSummary}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40">
                    <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Data Flow Overview
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {aiData.dataFlowSummary}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/40">
                    <div className="text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Coupling & Cohesion
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {aiData.couplingAnalysis}
                    </p>
                  </div>
                </div>

                {aiData.keyExports && aiData.keyExports.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                      Key Exported Symbols
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {aiData.keyExports.map((sym, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-[11px] font-mono text-gray-700 dark:text-gray-300"
                        >
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Prompt Chips */}
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Ask AI about this Module
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Explain data flow in detail',
                  'Identify refactoring opportunities',
                  'Check for performance bottlenecks',
                  'How does this connect to other modules?',
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleAskQuickPrompt(chip)}
                    disabled={askMutation.isPending}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-blue-200 dark:border-blue-800/80 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Q&A History */}
            {chatAnswers.length > 0 && (
              <div className="space-y-3 pt-2">
                {chatAnswers.map((item, idx) => (
                  <div key={idx} className="space-y-2 text-xs">
                    <div className="font-semibold text-blue-600 dark:text-blue-400">
                      Q: {item.q}
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-850 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                      {item.a}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Question Input */}
            <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2">
              <Input
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                placeholder="Ask anything about this module..."
                className="h-9 text-xs bg-white dark:bg-gray-900"
                disabled={askMutation.isPending}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!chatQuestion.trim() || askMutation.isPending}
                className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white gap-1 shrink-0"
              >
                {askMutation.isPending ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
              </Button>
            </form>
          </div>
        )}

        {/* TAB 2: DEPENDENCIES */}
        {activeTab === 'dependencies' && (
          <div className="space-y-6">
            {/* Outbound: This module imports */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-gray-100">
                <ArrowUpRight className="size-4 text-blue-500" />
                <span>This Module Imports ({module.imports.length})</span>
              </div>
              {module.imports.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No internal project dependencies imported.</p>
              ) : (
                <div className="space-y-1.5">
                  {module.imports.map((imp) => (
                    <div
                      key={imp}
                      onClick={() => onSelectNode(imp)}
                      className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 bg-gray-50/50 dark:bg-gray-950/40 hover:bg-blue-50/30 flex items-center justify-between text-xs cursor-pointer group transition-all"
                    >
                      <span className="font-mono text-gray-700 dark:text-gray-300 group-hover:text-blue-600 truncate">
                        {imp}
                      </span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold shrink-0">
                        Jump to node →
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inbound: Imported by */}
            <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-gray-100">
                <ArrowDownLeft className="size-4 text-emerald-500" />
                <span>Imported By ({module.importedBy.length})</span>
              </div>
              {module.importedBy.length === 0 ? (
                <p className="text-xs text-gray-400 italic">
                  No other internal files import this module (entry point or top-level page).
                </p>
              ) : (
                <div className="space-y-1.5">
                  {module.importedBy.map((imp) => (
                    <div
                      key={imp}
                      onClick={() => onSelectNode(imp)}
                      className="p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-gray-50/50 dark:bg-gray-950/40 hover:bg-emerald-50/30 flex items-center justify-between text-xs cursor-pointer group transition-all"
                    >
                      <span className="font-mono text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 truncate">
                        {imp}
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                        Jump to node →
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SOURCE CODE PREVIEW */}
        {activeTab === 'code' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Source Code Preview ({module.loc} lines)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="h-7 px-2.5 text-xs text-gray-600 dark:text-gray-300 gap-1"
              >
                {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                <span>Copy</span>
              </Button>
            </div>
            <pre className="p-4 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto border border-gray-800 max-h-[500px] overflow-y-auto">
              <code>{module.sourceCodeSnippet || '// Source code not loaded.'}</code>
            </pre>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
