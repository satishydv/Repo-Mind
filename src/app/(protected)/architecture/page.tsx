'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnSelectionChangeParams,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import useProject from '@/hooks/use-project'
import { api } from '@/trpc/react'
import { ArchitectureNode } from './architecture-node'
import { ModuleInspector } from './module-inspector'
import {
  Network,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  Sparkles,
  Maximize2,
  Minimize2,
  Workflow,
  HelpCircle,
  FolderTree,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { GraphNodeData, ModuleCategory } from '@/lib/dependency-graph'

const nodeTypes = {
  architectureNode: ArchitectureNode,
}

function ArchitectureCanvas() {
  const { project, projectId } = useProject()
  const [direction, setDirection] = useState<'LR' | 'TB'>('LR')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedModule, setSelectedModule] = useState<GraphNodeData | null>(null)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  const { fitView, setCenter } = useReactFlow()

  // Fetch graph data from tRPC
  const { data: graphData, isLoading, isFetching, refetch } = api.architecture.getGraphData.useQuery(
    {
      projectId: projectId || '',
      direction,
    },
    {
      enabled: !!projectId,
    }
  )

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  // Calculate connected node IDs when hovering or selecting
  const activeHighlightedNodeId = hoveredNodeId || selectedModule?.id || null

  const connectedNodeIds = useMemo(() => {
    if (!activeHighlightedNodeId || !graphData) return new Set<string>()
    const set = new Set<string>()
    set.add(activeHighlightedNodeId)

    for (const edge of graphData.edges) {
      if (edge.source === activeHighlightedNodeId) {
        set.add(edge.target)
      }
      if (edge.target === activeHighlightedNodeId) {
        set.add(edge.source)
      }
    }
    return set
  }, [activeHighlightedNodeId, graphData])

  // Sync graphData to React Flow nodes and edges with filtering and dynamic highlight state
  useEffect(() => {
    if (!graphData) return

    const isFilteringCategory = selectedCategoryFilter !== 'all'

    // Filter and enhance nodes
    const processedNodes: Node[] = graphData.nodes
      .filter((n) => {
        if (isFilteringCategory && n.data.category !== selectedCategoryFilter) return false
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          return (
            n.data.label.toLowerCase().includes(q) ||
            n.data.fileName.toLowerCase().includes(q) ||
            n.data.category.toLowerCase().includes(q)
          )
        }
        return true
      })
      .map((n) => {
        const isCurrentActive = n.id === activeHighlightedNodeId
        const isRelated = connectedNodeIds.has(n.id)
        const isDimmed = activeHighlightedNodeId !== null && !isRelated

        return {
          ...n,
          data: {
            ...n.data,
            isSelectedNode: isCurrentActive,
            isHoveredNode: n.id === hoveredNodeId,
            isRelatedNode: isRelated,
            isDimmedNode: isDimmed,
          },
        }
      })

    const nodeIds = new Set(processedNodes.map((n) => n.id))

    // Filter and enhance edges
    const processedEdges: Edge[] = graphData.edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => {
        const isEdgeConnected =
          activeHighlightedNodeId !== null &&
          (e.source === activeHighlightedNodeId || e.target === activeHighlightedNodeId)

        const isEdgeDimmed = activeHighlightedNodeId !== null && !isEdgeConnected

        return {
          ...e,
          animated: isEdgeConnected || !activeHighlightedNodeId,
          style: {
            stroke: isEdgeConnected ? '#3b82f6' : isEdgeDimmed ? '#94a3b833' : '#64748b88',
            strokeWidth: isEdgeConnected ? 3 : 1.5,
          },
        }
      })

    setNodes(processedNodes)
    setEdges(processedEdges)
  }, [graphData, selectedCategoryFilter, searchQuery, activeHighlightedNodeId, connectedNodeIds])

  // Initial fit view
  useEffect(() => {
    if (nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 })
      }, 100)
    }
  }, [nodes.length, direction])

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const modData = node.data as unknown as GraphNodeData
      setSelectedModule(modData)
      setInspectorOpen(true)
    },
    []
  )

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    setHoveredNodeId(node.id)
  }, [])

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null)
  }, [])

  const handleJumpToNode = (nodeId: string) => {
    const targetNode = nodes.find((n) => n.id === nodeId)
    if (targetNode) {
      setCenter(targetNode.position.x + 120, targetNode.position.y + 40, {
        zoom: 1.2,
        duration: 800,
      })
      const modData = targetNode.data as unknown as GraphNodeData
      setSelectedModule(modData)
      setInspectorOpen(true)
    }
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
        <div className="size-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
          <Workflow className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">No project selected</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
          Select or link a repository to visualize its interactive architectural node graph.
        </p>
      </div>
    )
  }

  const stats = graphData?.stats

  return (
    <div className="space-y-4 max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col pb-4">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Network className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span>Codebase Dependency & Architecture Graph</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  Interactive Node Map
                </span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click any module node to inspect its architectural purpose, imports, and AI system explanation
              </p>
            </div>
          </div>
        </div>

        {/* Stats Pill Bar */}
        {stats && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-2xs">
              <span className="font-bold text-gray-900 dark:text-gray-100">{stats.totalModules}</span> Modules
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-2xs">
              <span className="font-bold text-gray-900 dark:text-gray-100">{stats.totalDependencies}</span> Connections
            </div>
            <div className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs font-medium text-gray-700 dark:text-gray-300 shadow-2xs">
              Max Depth: <span className="font-bold text-blue-600 dark:text-blue-400">{stats.maxDepth}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 px-2.5 rounded-lg border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-xs"
            >
              <RefreshCw className={cn("size-3", isFetching && "animate-spin")} />
            </Button>
          </div>
        )}
      </div>

      {/* Graph Control Strip: Search, Layer Filters, Direction */}
      <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shrink-0">
        {/* Search File Box */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search file or module to locate..."
            className="pl-8 h-8 text-xs bg-gray-50/50 dark:bg-gray-950 border-gray-200 dark:border-gray-800"
          />
        </div>

        {/* Category Layer Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {[
            { id: 'all', label: 'All Layers' },
            { id: 'page', label: 'Pages' },
            { id: 'api', label: 'API / Routers' },
            { id: 'component', label: 'Components' },
            { id: 'server', label: 'Server & DB' },
            { id: 'hook', label: 'Hooks' },
            { id: 'lib', label: 'Libs' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer',
                selectedCategoryFilter === cat.id
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Layout Orientation & Fit */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setDirection('LR')}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] transition-colors',
                direction === 'LR'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              Horizontal (LR)
            </button>
            <button
              onClick={() => setDirection('TB')}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] transition-colors',
                direction === 'TB'
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              Vertical (TB)
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fitView({ padding: 0.2, duration: 400 })}
            className="h-8 px-2.5 text-xs text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800"
          >
            Fit View
          </Button>
        </div>
      </div>

      {/* Interactive React Flow Canvas Container */}
      <div className="flex-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-950 overflow-hidden relative shadow-inner">
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-950/80 z-20">
            <RefreshCw className="size-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Analyzing repository imports & constructing graph...
            </p>
          </div>
        ) : nodes.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
            <FolderTree className="size-12 text-gray-400 mb-3" />
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">No matching files found</h3>
            <p className="text-xs text-gray-500 max-w-sm mt-1">
              No files matched the selected layer filters or search term. Try resetting your search query.
            </p>
          </div>
        ) : null}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          className="bg-dot-grid"
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#94a3b833" />
          <Controls className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-md overflow-hidden text-gray-700 dark:text-gray-300" />
          <MiniMap
            nodeStrokeWidth={3}
            nodeColor={(n) => {
              const cat = (n.data as any)?.category
              switch (cat) {
                case 'page':
                  return '#3b82f6'
                case 'api':
                  return '#a855f7'
                case 'component':
                  return '#10b981'
                case 'server':
                  return '#f59e0b'
                case 'hook':
                  return '#ec4899'
                case 'lib':
                  return '#06b6d4'
                default:
                  return '#64748b'
              }
            }}
            className="border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 rounded-xl shadow-lg m-4"
          />
        </ReactFlow>

        {/* Bottom Legend Hint */}
        <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 backdrop-blur-xs shadow-xs hidden sm:flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
            <Sparkles className="size-3 text-blue-500" /> Click module to explain
          </span>
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-500" /> Page
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-purple-500" /> API
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" /> Component
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500" /> Server/DB
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-pink-500" /> Hook
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-cyan-500" /> Lib
          </span>
        </div>
      </div>

      {/* Slide-Over AI Module Inspector */}
      {projectId && (
        <ModuleInspector
          module={selectedModule}
          open={inspectorOpen}
          setOpen={setInspectorOpen}
          projectId={projectId}
          onSelectNode={handleJumpToNode}
        />
      )}
    </div>
  )
}

export default function ArchitecturePage() {
  return (
    <ReactFlowProvider>
      <ArchitectureCanvas />
    </ReactFlowProvider>
  )
}
