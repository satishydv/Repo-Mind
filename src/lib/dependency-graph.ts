import dagre from 'dagre'
import { GoogleGenerativeAI } from '@google/generative-ai'
import 'dotenv/config'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export type ModuleCategory =
  | 'page'
  | 'api'
  | 'component'
  | 'hook'
  | 'server'
  | 'lib'
  | 'config'
  | 'other'

export interface GraphNodeData {
  id: string
  label: string
  fileName: string
  shortName: string
  category: ModuleCategory
  loc: number
  inDegree: number
  outDegree: number
  imports: string[]
  importedBy: string[]
  summary?: string
  sourceCodeSnippet?: string
  [key: string]: unknown
}

export interface GraphNode {
  id: string
  type: 'architectureNode'
  position: { x: number; y: number }
  data: GraphNodeData
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  animated?: boolean
  style?: Record<string, any>
  type?: string
  data?: {
    importPath: string
  }
}

export interface ArchitectureGraphData {
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: {
    totalModules: number
    totalDependencies: number
    maxDepth: number
    circularDependenciesCount: number
    categories: Record<ModuleCategory, number>
  }
}

interface RawProjectFile {
  fileName: string
  sourceCode: string
  summary?: string
}

/**
 * Classify a file into an architectural layer
 */
export function classifyModuleCategory(fileName: string): ModuleCategory {
  const normalized = fileName.replace(/\\/g, '/').toLowerCase()

  if (normalized.includes('/api/') || normalized.includes('routers/') || normalized.endsWith('/route.ts') || normalized.endsWith('/route.js')) {
    return 'api'
  }
  if (normalized.includes('app/') && (normalized.endsWith('page.tsx') || normalized.endsWith('page.jsx') || normalized.endsWith('layout.tsx') || normalized.endsWith('template.tsx'))) {
    return 'page'
  }
  if (normalized.includes('hooks/') || normalized.includes('/use-') || normalized.includes('/use')) {
    return 'hook'
  }
  if (normalized.includes('components/') || normalized.endsWith('.component.tsx')) {
    return 'component'
  }
  if (normalized.includes('server/') || normalized.includes('prisma/') || normalized.includes('db.') || normalized.includes('database')) {
    return 'server'
  }
  if (normalized.includes('lib/') || normalized.includes('utils/') || normalized.includes('helpers/')) {
    return 'lib'
  }
  if (normalized.includes('config') || normalized.endsWith('.json') || normalized.endsWith('.config.js') || normalized.endsWith('.config.ts')) {
    return 'config'
  }

  return 'other'
}

/**
 * Extract imports from source code
 */
function extractImportPaths(sourceCode: string): string[] {
  const imports: string[] = []
  if (!sourceCode) return imports

  // 1. Static ES imports: import ... from '...'
  const esImportRegex = /(?:import\s+(?:[\w\s{},*]+from\s+)?|export\s+(?:[\w\s{},*]+from\s+)?)['"]([^'"]+)['"]/g
  let match: RegExpExecArray | null
  while ((match = esImportRegex.exec(sourceCode)) !== null) {
    if (match[1]) imports.push(match[1])
  }

  // 2. CommonJS require: require('...')
  const cjsRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((match = cjsRegex.exec(sourceCode)) !== null) {
    if (match[1]) imports.push(match[1])
  }

  // 3. Dynamic imports: import('...')
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  while ((match = dynamicImportRegex.exec(sourceCode)) !== null) {
    if (match[1]) imports.push(match[1])
  }

  return Array.from(new Set(imports))
}

/**
 * Resolve an import path (e.g. "@/lib/gemini" or "./commit") to matching project fileName
 */
function resolveImportToFile(importPath: string, currentFile: string, allFileNames: string[]): string | null {
  // Normalize paths
  const normCurrent = currentFile.replace(/\\/g, '/')
  const currentDir = normCurrent.substring(0, normCurrent.lastIndexOf('/'))

  let targetPath = importPath.replace(/\\/g, '/')

  // Handle @/ alias (mapped to src/ or root)
  if (targetPath.startsWith('@/')) {
    const withoutAlias = targetPath.slice(2)
    // Check with src/ prefix or direct
    const possible = [`src/${withoutAlias}`, withoutAlias]
    for (const p of possible) {
      const match = findMatchingFile(p, allFileNames)
      if (match) return match
    }
  }

  // Handle relative imports ./ or ../
  if (targetPath.startsWith('./') || targetPath.startsWith('../')) {
    const parts = currentDir.split('/').filter(Boolean)
    const relParts = targetPath.split('/')

    for (const part of relParts) {
      if (part === '.') continue
      if (part === '..') {
        parts.pop()
      } else {
        parts.push(part)
      }
    }

    const resolved = parts.join('/')
    const match = findMatchingFile(resolved, allFileNames)
    if (match) return match
  }

  return null
}

function findMatchingFile(basePath: string, allFiles: string[]): string | null {
  const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js']

  for (const ext of extensions) {
    const testPath = basePath + ext
    const found = allFiles.find(f => {
      const norm = f.replace(/\\/g, '/')
      return norm === testPath || norm.endsWith('/' + testPath) || norm.replace(/^src\//, '') === testPath
    })
    if (found) return found
  }

  return null
}

/**
 * Build graph nodes & edges with dagre auto-layout
 */
export function buildArchitectureGraph(
  files: RawProjectFile[],
  direction: 'LR' | 'TB' = 'LR'
): ArchitectureGraphData {
  const allFileNames = files.map(f => f.fileName)
  const nodeMap = new Map<string, GraphNodeData>()
  const rawEdges: { source: string; target: string; importPath: string }[] = []

  // Initialize node data
  for (const file of files) {
    const lines = file.sourceCode ? file.sourceCode.split('\n').length : 0
    const category = classifyModuleCategory(file.fileName)
    const normName = file.fileName.replace(/\\/g, '/')
    const parts = normName.split('/')
    const shortName = parts[parts.length - 1] || normName

    nodeMap.set(file.fileName, {
      id: file.fileName,
      label: shortName,
      fileName: file.fileName,
      shortName,
      category,
      loc: lines,
      inDegree: 0,
      outDegree: 0,
      imports: [],
      importedBy: [],
      summary: file.summary,
      sourceCodeSnippet: file.sourceCode ? file.sourceCode.slice(0, 1500) : '',
    })
  }

  // Extract imports and build edges
  for (const file of files) {
    const imports = extractImportPaths(file.sourceCode)
    const sourceNode = nodeMap.get(file.fileName)
    if (!sourceNode) continue

    for (const imp of imports) {
      const resolvedTarget = resolveImportToFile(imp, file.fileName, allFileNames)
      if (resolvedTarget && resolvedTarget !== file.fileName) {
        const targetNode = nodeMap.get(resolvedTarget)
        if (targetNode) {
          sourceNode.imports.push(resolvedTarget)
          targetNode.importedBy.push(file.fileName)
          sourceNode.outDegree++
          targetNode.inDegree++

          rawEdges.push({
            source: file.fileName,
            target: resolvedTarget,
            importPath: imp,
          })
        }
      }
    }
  }

  // Deduplicate edges
  const edgeSet = new Set<string>()
  const uniqueEdges: typeof rawEdges = []
  for (const edge of rawEdges) {
    const key = `${edge.source}->${edge.target}`
    if (!edgeSet.has(key)) {
      edgeSet.add(key)
      uniqueEdges.push(edge)
    }
  }

  // Configure Dagre Graph Layout
  const g = new dagre.graphlib.Graph()
  g.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 100,
    marginx: 50,
    marginy: 50,
  })
  g.setDefaultEdgeLabel(() => ({}))

  const nodeWidth = 240
  const nodeHeight = 85

  // Add nodes to Dagre
  for (const [id] of nodeMap) {
    g.setNode(id, { width: nodeWidth, height: nodeHeight })
  }

  // Add edges to Dagre
  for (const edge of uniqueEdges) {
    g.setEdge(edge.source, edge.target)
  }

  // Compute Layout
  dagre.layout(g)

  // Build final React Flow Nodes
  const nodes: GraphNode[] = []
  for (const [id, data] of nodeMap) {
    const nodeWithPos = g.node(id)
    const x = nodeWithPos ? nodeWithPos.x - nodeWidth / 2 : 0
    const y = nodeWithPos ? nodeWithPos.y - nodeHeight / 2 : 0

    nodes.push({
      id,
      type: 'architectureNode',
      position: { x, y },
      data,
    })
  }

  // Build final React Flow Edges
  const edges: GraphEdge[] = uniqueEdges.map((e, idx) => ({
    id: `e-${idx}-${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    animated: true,
    data: {
      importPath: e.importPath,
    },
  }))

  // Category counts
  const categories: Record<ModuleCategory, number> = {
    page: 0,
    api: 0,
    component: 0,
    hook: 0,
    server: 0,
    lib: 0,
    config: 0,
    other: 0,
  }

  for (const [, data] of nodeMap) {
    categories[data.category] = (categories[data.category] || 0) + 1
  }

  // Circular dependency check (DFS)
  let circularCount = 0
  const visited = new Set<string>()
  const recStack = new Set<string>()

  function isCyclic(nodeId: string): boolean {
    visited.add(nodeId)
    recStack.add(nodeId)

    const node = nodeMap.get(nodeId)
    if (node) {
      for (const neighbor of node.imports) {
        if (!visited.has(neighbor)) {
          if (isCyclic(neighbor)) return true
        } else if (recStack.has(neighbor)) {
          return true
        }
      }
    }

    recStack.delete(nodeId)
    return false
  }

  for (const [id] of nodeMap) {
    if (!visited.has(id)) {
      if (isCyclic(id)) circularCount++
    }
  }

  return {
    nodes,
    edges,
    stats: {
      totalModules: nodes.length,
      totalDependencies: edges.length,
      maxDepth: calculateMaxDepth(nodeMap),
      circularDependenciesCount: circularCount,
      categories,
    },
  }
}

function calculateMaxDepth(nodeMap: Map<string, GraphNodeData>): number {
  let max = 1
  const memo = new Map<string, number>()

  function getDepth(nodeId: string, visitedPath = new Set<string>()): number {
    if (visitedPath.has(nodeId)) return 0 // cycle
    if (memo.has(nodeId)) return memo.get(nodeId)!

    visitedPath.add(nodeId)
    const node = nodeMap.get(nodeId)
    if (!node || node.imports.length === 0) {
      visitedPath.delete(nodeId)
      return 1
    }

    let deepestChild = 0
    for (const child of node.imports) {
      const d = getDepth(child, visitedPath)
      if (d > deepestChild) deepestChild = d
    }

    visitedPath.delete(nodeId)
    const total = 1 + deepestChild
    memo.set(nodeId, total)
    return total
  }

  for (const [id] of nodeMap) {
    const d = getDepth(id)
    if (d > max) max = d
  }

  return max
}

/**
 * Click-to-Explain AI Architecture Summary
 */
export async function explainModuleWithAI(
  module: GraphNodeData,
  sourceCode?: string
): Promise<{
  role: string
  architectureSummary: string
  keyExports: string[]
  couplingAnalysis: string
  dataFlowSummary: string
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' })
    const prompt = `
You are a Principal Software Architect.
Analyze the following source code file and its role in the application architecture:

FILE PATH: ${module.fileName}
LAYER / CATEGORY: ${module.category.toUpperCase()}
LINES OF CODE: ${module.loc}
DIRECT DEPENDENCIES (${module.imports.length} files): ${module.imports.join(', ') || 'None'}
DEPENDENTS (${module.importedBy.length} files importing this): ${module.importedBy.join(', ') || 'None'}

SOURCE CODE:
\`\`\`
${(sourceCode || module.sourceCodeSnippet || '').slice(0, 4000)}
\`\`\`

Provide an in-depth architectural breakdown formatted as JSON:
{
  "role": "Single sentence summarizing the primary responsibility of this module in the system.",
  "architectureSummary": "2-3 paragraphs describing its architectural design pattern, how it interacts with connected components/APIs/database, and state/data management.",
  "keyExports": ["Array of main exported functions, hooks, or components with brief description"],
  "couplingAnalysis": "Assessment of cohesion and coupling (e.g. low coupling, highly depended on by UI, potential bottlenecks).",
  "dataFlowSummary": "Brief step-by-step summary of how data enters, gets processed, and exits this module."
}
Only return valid JSON without markdown backticks.
`

    const response = await model.generateContent(prompt)
    const text = response.response.text().trim()
    const cleanJson = text.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim()
    const parsed = JSON.parse(cleanJson)

    return {
      role: parsed.role || `Handles ${module.category} functionality for ${module.shortName}.`,
      architectureSummary: parsed.architectureSummary || module.summary || 'Core application module.',
      keyExports: parsed.keyExports || [module.shortName],
      couplingAnalysis: parsed.couplingAnalysis || `Connected with ${module.inDegree} dependents and ${module.outDegree} dependencies.`,
      dataFlowSummary: parsed.dataFlowSummary || 'Processes application state and interactions.',
    }
  } catch (error) {
    console.error('Error generating AI module explanation:', error)
    return {
      role: `Architectural ${module.category} module responsible for ${module.shortName}.`,
      architectureSummary: module.summary || `This module sits in the ${module.category} layer. It imports ${module.outDegree} modules and is used by ${module.inDegree} components.`,
      keyExports: [module.shortName],
      couplingAnalysis: `In-degree: ${module.inDegree}, Out-degree: ${module.outDegree}.`,
      dataFlowSummary: `Interacts with ${module.imports.slice(0, 3).join(', ') || 'standalone logic'}.`,
    }
  }
}

/**
 * Interactive Q&A for a specific module
 */
export async function askModuleAI(
  module: GraphNodeData,
  question: string,
  sourceCode?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' })
    const prompt = `
You are an expert software architect explaining the module \`${module.fileName}\` (${module.category} layer).

FILE METRICS:
- Lines of Code: ${module.loc}
- Imports (${module.imports.length}): ${module.imports.join(', ')}
- Imported By (${module.importedBy.length}): ${module.importedBy.join(', ')}

SOURCE CODE:
\`\`\`
${(sourceCode || module.sourceCodeSnippet || '').slice(0, 4000)}
\`\`\`

USER QUESTION:
${question}

Provide a concise, helpful, and technically accurate answer with markdown formatting and code examples if appropriate.
`
    const response = await model.generateContent(prompt)
    return response.response.text()
  } catch (error: any) {
    console.error('Error asking module AI:', error)
    const errStr = `${error?.status || ''} ${error?.message || ''} ${JSON.stringify(error || '')}`.toLowerCase()
    if (
      error?.status === 429 ||
      errStr.includes('429') ||
      errStr.includes('too many requests') ||
      errStr.includes('quota') ||
      errStr.includes('resource_exhausted') ||
      errStr.includes('rate limit')
    ) {
      return '⚠️ **Rate Limit Reached**: The Gemini AI API rate limit has been reached. Please wait a moment and try again.'
    }
    return `Unable to analyze module: ${error.message || 'AI request failed'}`
  }
}
