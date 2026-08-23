'use client'

import React, { useState, useMemo } from 'react'
import useProject from '@/hooks/use-project'
import { api } from '@/trpc/react'
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Info,
  RefreshCw,
  Download,
  Search,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Filter,
  Eye,
  FileCode,
  Lock,
  Database,
  Globe,
  Sliders,
  XCircle,
  ArrowUpRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { SecurityFinding, Severity, FindingCategory, FindingStatus } from '@/lib/security-auditor'
import { formatDistanceToNow } from 'date-fns'

const SecurityPage = () => {
  const { project, projectId } = useProject()
  const ctx = api.useUtils()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // tRPC Queries & Mutations
  const { data: report, isLoading, isFetching } = api.security.getAudit.useQuery(
    { projectId: projectId || '' },
    { enabled: !!projectId }
  )

  const runAuditMutation = api.security.runAudit.useMutation({
    onSuccess: (data) => {
      toast.success(`Security scan completed! Health Score: ${data.healthScore}/100 (${data.grade})`)
      ctx.security.getAudit.invalidate()
    },
    onError: (err) => {
      toast.error(`Scan failed: ${err.message}`)
    },
  })

  const getAIFixMutation = api.security.getAIFix.useMutation({
    onSuccess: (data) => {
      if (selectedFinding) {
        setSelectedFinding({
          ...selectedFinding,
          aiExplanation: data.explanation,
          suggestedFix: data.suggestedFix,
          codeSnippet: data.remediationSnippet || selectedFinding.codeSnippet,
        })
      }
      toast.success('AI Remediation generated!')
    },
    onError: () => {
      toast.error('Failed to generate AI remediation')
    },
  })

  const updateStatusMutation = api.security.updateFindingStatus.useMutation({
    onSuccess: (_, variables) => {
      toast.success(`Finding marked as ${variables.status}`)
      ctx.security.getAudit.invalidate()
      if (selectedFinding && selectedFinding.id === variables.findingId) {
        setSelectedFinding({ ...selectedFinding, status: variables.status as FindingStatus })
      }
    },
    onError: () => {
      toast.error('Failed to update finding status')
    },
  })

  // Filtered findings
  const filteredFindings = useMemo(() => {
    if (!report?.findings) return []
    return report.findings.filter((f) => {
      // Search
      const matchesSearch =
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.file.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description.toLowerCase().includes(searchQuery.toLowerCase())

      // Severity
      const matchesSeverity = selectedSeverity === 'all' || f.severity === selectedSeverity

      // Category
      const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory

      // Status
      const matchesStatus = selectedStatus === 'all' || f.status === selectedStatus

      return matchesSearch && matchesSeverity && matchesCategory && matchesStatus
    })
  }, [report?.findings, searchQuery, selectedSeverity, selectedCategory, selectedStatus])

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
        <div className="size-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
          <ShieldAlert className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No project selected</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
          Select or link a repository to perform real-time security and secret audits.
        </p>
      </div>
    )
  }

  const handleRunScan = () => {
    if (!projectId) return
    runAuditMutation.mutate({ projectId })
  }

  const handleOpenFinding = (finding: SecurityFinding) => {
    setSelectedFinding(finding)
    setSheetOpen(true)
    if (!finding.aiExplanation && projectId) {
      getAIFixMutation.mutate({ projectId, finding })
    }
  }

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Code snippet copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportReport = () => {
    if (!report) return
    let md = `# 🛡️ RepoMind Security & Secret Audit Report\n\n`
    md += `**Project:** ${project.name}\n`
    md += `**Repository:** ${project.githubUrl}\n`
    md += `**Scanned At:** ${new Date(report.scannedAt).toUTCString()}\n`
    md += `**Overall Security Health Score:** ${report.healthScore}/100 (Grade: ${report.grade})\n\n`
    md += `## 📊 Executive Summary\n`
    md += `- **Total Files Scanned:** ${report.totalFiles}\n`
    md += `- **Total Vulnerabilities / Leaks Found:** ${report.totalFindings}\n`
    md += `- **Critical:** ${report.counts.critical}\n`
    md += `- **High:** ${report.counts.high}\n`
    md += `- **Medium:** ${report.counts.medium}\n`
    md += `- **Low / Anti-Patterns:** ${report.counts.low}\n`
    md += `- **Info:** ${report.counts.info}\n\n`

    md += `## 📑 Category Health Scores\n`
    for (const cat of report.categoryScores) {
      md += `- **${cat.name}:** ${cat.score}/100 (${cat.issuesCount} issues)\n`
    }

    md += `\n## 🔍 Detected Findings & Remediation\n\n`
    for (const f of report.findings) {
      md += `### [${f.severity.toUpperCase()}] ${f.title}\n`
      md += `- **File:** \`${f.file}\` (Line ${f.line})\n`
      md += `- **Type:** ${f.type}\n`
      md += `- **Status:** ${f.status.toUpperCase()}\n`
      md += `- **Description:** ${f.description}\n`
      if (f.suggestedFix) md += `- **Recommended Fix:** ${f.suggestedFix}\n`
      md += `\n\`\`\`\n${f.codeSnippet}\n\`\`\`\n\n`
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `security-report-${project.name.toLowerCase().replace(/\s+/g, '-')}.md`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Security Audit report downloaded as Markdown!')
  }

  // Get score color theme
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
    if (score >= 75) return 'text-blue-600 dark:text-blue-400 border-blue-500 bg-blue-50 dark:bg-blue-950/40'
    if (score >= 50) return 'text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-50 dark:bg-amber-950/40'
    return 'text-rose-600 dark:text-rose-400 border-rose-500 bg-rose-50 dark:bg-rose-950/40'
  }

  const getSeverityBadge = (severity: Severity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <span className="size-1.5 rounded-full bg-rose-600 dark:bg-rose-400 animate-pulse" />
            Critical
          </span>
        )
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            <AlertTriangle className="size-3 text-orange-600 dark:text-orange-400" />
            High
          </span>
        )
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertOctagon className="size-3 text-amber-600 dark:text-amber-400" />
            Medium
          </span>
        )
      case 'low':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Info className="size-3 text-blue-600 dark:text-blue-400" />
            Low
          </span>
        )
      case 'info':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Info className="size-3" />
            Info
          </span>
        )
    }
  }

  const getCategoryIcon = (category: FindingCategory) => {
    switch (category) {
      case 'secrets':
        return <Lock className="size-3.5 text-rose-500" />
      case 'injection':
        return <Database className="size-3.5 text-orange-500" />
      case 'web_security':
        return <Globe className="size-3.5 text-indigo-500" />
      case 'anti_patterns':
      case 'best_practices':
        return <Sliders className="size-3.5 text-teal-500" />
    }
  }

  const isScanning = runAuditMutation.isPending || isFetching

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl premium-gradient-glow flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Codebase Security & Secret Auditor
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Live vulnerability scanner, credential leak detector & AI remediation assistant
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportReport}
            disabled={!report || report.findings.length === 0}
            className="h-9 px-3.5 rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-medium shadow-2xs gap-1.5"
          >
            <Download className="size-3.5" />
            <span>Export Report</span>
          </Button>

          <Button
            onClick={handleRunScan}
            disabled={isScanning}
            className="h-9 px-4 rounded-lg premium-gradient-glow text-white text-xs font-medium gap-2 cursor-pointer transition-all"
          >
            <RefreshCw className={cn("size-3.5", isScanning && "animate-spin")} />
            <span>{isScanning ? "Scanning Codebase..." : "Run Security Scan"}</span>
          </Button>
        </div>
      </div>

      {/* Main Score & Metrics Hero Card */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Big Health Score Gauge & Grade */}
          <div className="lg:col-span-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xs flex flex-col justify-between transition-colors relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Security Score
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {report.scannedAt ? `Scanned ${formatDistanceToNow(new Date(report.scannedAt), { addSuffix: true })}` : 'Just now'}
              </span>
            </div>

            {/* Big Circular Score */}
            <div className="my-6 flex items-center justify-center">
              <div className={cn("size-36 rounded-full border-4 flex flex-col items-center justify-center text-center shadow-inner relative", getScoreColor(report.healthScore))}>
                <span className="text-4xl font-extrabold tracking-tight">
                  {report.healthScore}
                </span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">
                  / 100
                </span>
                <div className="absolute -bottom-2.5 px-3 py-0.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold shadow-md">
                  Grade {report.grade}
                </div>
              </div>
            </div>

            {/* Status Footer */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {report.healthScore >= 90
                  ? "✅ Strong security posture. No critical vulnerabilities found."
                  : report.healthScore >= 70
                  ? "⚠️ Good health, but some security findings require attention."
                  : "🚨 High risk detected! Critical secret leaks or injection points found."}
              </p>
            </div>
          </div>

          {/* Right Column: Severity Counts & Category Health Breakdown */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* 4 Severity Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Critical */}
              <div className="border border-rose-100 dark:border-rose-950/50 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Critical</span>
                  <span className="size-2 rounded-full bg-rose-500 animate-ping" />
                </div>
                <div className="text-2xl font-bold text-rose-900 dark:text-rose-200 mt-2">
                  {report.counts.critical}
                </div>
                <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">Requires immediate fix</span>
              </div>

              {/* High */}
              <div className="border border-orange-100 dark:border-orange-950/50 bg-orange-50/50 dark:bg-orange-950/20 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">High Risk</span>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-200 mt-2">
                  {report.counts.high}
                </div>
                <span className="text-[11px] text-orange-600 dark:text-orange-400 mt-1">Severe vulnerabilities</span>
              </div>

              {/* Medium */}
              <div className="border border-amber-100 dark:border-amber-950/50 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Medium</span>
                <div className="text-2xl font-bold text-amber-900 dark:text-amber-200 mt-2">
                  {report.counts.medium}
                </div>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Security misconfigs</span>
              </div>

              {/* Low / Anti-pattern */}
              <div className="border border-blue-100 dark:border-blue-950/50 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">Low & Info</span>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-200 mt-2">
                  {report.counts.low + report.counts.info}
                </div>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 mt-1">Anti-patterns & hygiene</span>
              </div>
            </div>

            {/* Category Breakdown Bars */}
            <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xs flex-1 flex flex-col justify-center gap-3.5">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Category Health Scores
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {report.categoryScores.map((cat) => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200">
                        {getCategoryIcon(cat.category)}
                        {cat.name}
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 font-bold">
                        {cat.score}% <span className="text-[10px] text-gray-400 font-normal">({cat.issuesCount} issues)</span>
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          cat.score >= 85 ? "bg-emerald-500" : cat.score >= 60 ? "bg-amber-500" : "bg-rose-500"
                        )}
                        style={{ width: `${cat.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Findings Section */}
      <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl shadow-2xs overflow-hidden">
        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-950/40">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings by file, title, or rule..."
              className="pl-9 h-9 text-xs bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
            />
          </div>

          {/* Severity & Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Severity Pill Filter */}
            <div className="flex items-center bg-gray-200/60 dark:bg-gray-800/80 p-0.5 rounded-lg text-xs font-medium">
              {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={cn(
                    "px-2.5 py-1 rounded-md transition-colors capitalize text-[11px]",
                    selectedSeverity === sev
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-semibold shadow-2xs"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-2.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-hidden"
            >
              <option value="all">All Categories</option>
              <option value="secrets">Secrets & Credentials</option>
              <option value="injection">SQL & Data Injection</option>
              <option value="web_security">App Security & XSS</option>
              <option value="anti_patterns">Anti-Patterns & Quality</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-2.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-700 dark:text-gray-200 focus:outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open Issues</option>
              <option value="fixed">Fixed</option>
              <option value="ignored">Ignored</option>
            </select>
          </div>
        </div>

        {/* Findings List */}
        {filteredFindings.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="size-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">No issues found matching filters</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1">
              {report?.findings.length === 0
                ? "Your codebase is clear of detected secret leaks and security anti-patterns!"
                : "Try clearing or relaxing search and severity filters to view other findings."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredFindings.map((finding) => (
              <div
                key={finding.id}
                onClick={() => handleOpenFinding(finding)}
                className="p-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Left Finding Info */}
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {getSeverityBadge(finding.severity)}
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {finding.title}
                    </span>
                    {finding.status === 'fixed' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Resolved
                      </span>
                    )}
                    {finding.status === 'ignored' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        Ignored
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {finding.description}
                  </p>

                  <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                    <FileCode className="size-3 text-gray-400" />
                    <span>{finding.file}</span>
                    <span>:</span>
                    <span>Line {finding.line}</span>
                  </div>
                </div>

                {/* Right Action Button */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 gap-1.5"
                  >
                    <Sparkles className="size-3" />
                    <span>AI Fix</span>
                    <ChevronRight className="size-3.5 text-gray-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Finding Detail Slide-Over Sheet / Drawer */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-6 space-y-6">
          {selectedFinding && (
            <>
              <SheetHeader className="text-left space-y-2 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(selectedFinding.severity)}
                  <span className="text-xs text-gray-400 font-mono">
                    {selectedFinding.file}:{selectedFinding.line}
                  </span>
                </div>
                <SheetTitle className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {selectedFinding.title}
                </SheetTitle>
                <SheetDescription className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedFinding.description}
                </SheetDescription>
              </SheetHeader>

              {/* Vulnerable Code Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <span className="flex items-center gap-1.5">
                    <FileCode className="size-3.5 text-rose-500" />
                    Vulnerable Code (Line {selectedFinding.line})
                  </span>
                  <button
                    onClick={() => handleCopyCode(selectedFinding.codeSnippet)}
                    className="text-[11px] text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
                  >
                    {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto border border-gray-800">
                  <code>{selectedFinding.codeSnippet}</code>
                </pre>
              </div>

              {/* AI Remediation Box */}
              <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="size-4 text-blue-600 dark:text-blue-400" />
                    AI Exploit Risk & Explanation
                  </div>
                  {getAIFixMutation.isPending && (
                    <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="size-3 animate-spin" />
                      Analyzing with AI...
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedFinding.aiExplanation ||
                    (getAIFixMutation.isPending
                      ? "Generating deep exploit risk breakdown and patch using Gemini..."
                      : selectedFinding.suggestedFix || "Analyzing remediation...")}
                </p>

                {/* AI Clean Fix Code Replacement */}
                <div className="space-y-2 pt-2 border-t border-blue-100 dark:border-blue-900/40">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
                    <span>Suggested Secure Fix</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(selectedFinding.suggestedFix || selectedFinding.codeSnippet)}
                      className="h-7 px-2 text-[11px] text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 gap-1"
                    >
                      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                      <span>Copy Fix</span>
                    </Button>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-gray-800">
                    <code>{selectedFinding.suggestedFix || selectedFinding.codeSnippet}</code>
                  </div>
                </div>
              </div>

              {/* Status Controls */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {selectedFinding.status !== 'fixed' ? (
                    <Button
                      onClick={() =>
                        projectId &&
                        updateStatusMutation.mutate({
                          projectId,
                          findingId: selectedFinding.id,
                          status: 'fixed',
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                      className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-2xs gap-1.5"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Mark as Resolved</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() =>
                        projectId &&
                        updateStatusMutation.mutate({
                          projectId,
                          findingId: selectedFinding.id,
                          status: 'open',
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                      variant="outline"
                      className="h-9 px-4 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-800"
                    >
                      Reopen Issue
                    </Button>
                  )}

                  {selectedFinding.status !== 'ignored' ? (
                    <Button
                      onClick={() =>
                        projectId &&
                        updateStatusMutation.mutate({
                          projectId,
                          findingId: selectedFinding.id,
                          status: 'ignored',
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                      variant="ghost"
                      className="h-9 px-3 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Ignore Finding
                    </Button>
                  ) : (
                    <Button
                      onClick={() =>
                        projectId &&
                        updateStatusMutation.mutate({
                          projectId,
                          findingId: selectedFinding.id,
                          status: 'open',
                        })
                      }
                      disabled={updateStatusMutation.isPending}
                      variant="ghost"
                      className="h-9 px-3 rounded-lg text-xs font-medium text-blue-600"
                    >
                      Unignore
                    </Button>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setSheetOpen(false)}
                  className="h-9 px-3 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300"
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default SecurityPage
