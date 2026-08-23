'use client'

import React, { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import {
  Layout,
  Zap,
  Box,
  Sparkles,
  Database,
  Cpu,
  FileCog,
  FileCode,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GraphNodeData, ModuleCategory } from '@/lib/dependency-graph'

export interface ArchitectureNodeProps extends NodeProps {
  data: GraphNodeData & {
    isSelectedNode?: boolean
    isHoveredNode?: boolean
    isRelatedNode?: boolean
    isDimmedNode?: boolean
  }
}

const CATEGORY_STYLES: Record<
  ModuleCategory,
  {
    bg: string
    border: string
    activeBorder: string
    text: string
    badgeBg: string
    icon: React.ElementType
    label: string
  }
> = {
  page: {
    bg: 'bg-blue-50/90 dark:bg-blue-950/70',
    border: 'border-blue-200 dark:border-blue-800',
    activeBorder: 'border-blue-500 shadow-blue-500/30',
    text: 'text-blue-700 dark:text-blue-300',
    badgeBg: 'bg-blue-100 text-blue-800 dark:bg-blue-900/80 dark:text-blue-200',
    icon: Layout,
    label: 'PAGE',
  },
  api: {
    bg: 'bg-purple-50/90 dark:bg-purple-950/70',
    border: 'border-purple-200 dark:border-purple-800',
    activeBorder: 'border-purple-500 shadow-purple-500/30',
    text: 'text-purple-700 dark:text-purple-300',
    badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-900/80 dark:text-purple-200',
    icon: Zap,
    label: 'API / ROUTER',
  },
  component: {
    bg: 'bg-emerald-50/90 dark:bg-emerald-950/70',
    border: 'border-emerald-200 dark:border-emerald-800',
    activeBorder: 'border-emerald-500 shadow-emerald-500/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200',
    icon: Box,
    label: 'COMPONENT',
  },
  hook: {
    bg: 'bg-pink-50/90 dark:bg-pink-950/70',
    border: 'border-pink-200 dark:border-pink-800',
    activeBorder: 'border-pink-500 shadow-pink-500/30',
    text: 'text-pink-700 dark:text-pink-300',
    badgeBg: 'bg-pink-100 text-pink-800 dark:bg-pink-900/80 dark:text-pink-200',
    icon: Sparkles,
    label: 'HOOK',
  },
  server: {
    bg: 'bg-amber-50/90 dark:bg-amber-950/70',
    border: 'border-amber-200 dark:border-amber-800',
    activeBorder: 'border-amber-500 shadow-amber-500/30',
    text: 'text-amber-700 dark:text-amber-300',
    badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200',
    icon: Database,
    label: 'SERVER / DB',
  },
  lib: {
    bg: 'bg-cyan-50/90 dark:bg-cyan-950/70',
    border: 'border-cyan-200 dark:border-cyan-800',
    activeBorder: 'border-cyan-500 shadow-cyan-500/30',
    text: 'text-cyan-700 dark:text-cyan-300',
    badgeBg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/80 dark:text-cyan-200',
    icon: Cpu,
    label: 'LIB / UTILITY',
  },
  config: {
    bg: 'bg-slate-50/90 dark:bg-slate-900/70',
    border: 'border-slate-200 dark:border-slate-700',
    activeBorder: 'border-slate-500 shadow-slate-500/30',
    text: 'text-slate-700 dark:text-slate-300',
    badgeBg: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    icon: FileCog,
    label: 'CONFIG',
  },
  other: {
    bg: 'bg-gray-50/90 dark:bg-gray-900/70',
    border: 'border-gray-200 dark:border-gray-700',
    activeBorder: 'border-gray-500 shadow-gray-500/30',
    text: 'text-gray-700 dark:text-gray-300',
    badgeBg: 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    icon: FileCode,
    label: 'MODULE',
  },
}

export const ArchitectureNode = memo(({ data, selected }: ArchitectureNodeProps) => {
  const style = CATEGORY_STYLES[data.category] || CATEGORY_STYLES.other
  const Icon = style.icon

  const isHighlighted = selected || data.isSelectedNode || data.isHoveredNode || data.isRelatedNode
  const isDimmed = data.isDimmedNode && !isHighlighted

  return (
    <div
      className={cn(
        'w-[240px] rounded-xl border p-3 shadow-md backdrop-blur-md transition-all duration-200 cursor-pointer relative group',
        style.bg,
        style.border,
        isHighlighted && cn('ring-2 ring-offset-1 dark:ring-offset-gray-900 shadow-lg scale-105 z-20', style.activeBorder),
        isDimmed && 'opacity-30 grayscale',
        !isDimmed && !isHighlighted && 'hover:scale-[1.02] hover:shadow-lg'
      )}
    >
      {/* React Flow Connection Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="size-2.5 bg-blue-500 border-2 border-white dark:border-gray-900 rounded-full"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="size-2.5 bg-purple-500 border-2 border-white dark:border-gray-900 rounded-full"
      />

      {/* Top Meta Row */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider',
            style.badgeBg
          )}
        >
          <Icon className="size-2.5" />
          {style.label}
        </span>
        <span className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
          {data.loc} lines
        </span>
      </div>

      {/* Middle Module Name & Directory */}
      <div className="space-y-0.5 mb-2">
        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate flex items-center gap-1">
          <span>{data.shortName}</span>
        </div>
        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">
          {data.fileName}
        </div>
      </div>

      {/* Bottom Dependency Stats Pills */}
      <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/60 dark:border-gray-700/60 text-[10px] font-medium text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-0.5">
          <ArrowDownLeft className="size-3 text-emerald-500" />
          {data.inDegree} in
        </span>
        <span className="flex items-center gap-0.5">
          <ArrowUpRight className="size-3 text-blue-500" />
          {data.outDegree} out
        </span>
      </div>
    </div>
  )
})

ArchitectureNode.displayName = 'ArchitectureNode'
