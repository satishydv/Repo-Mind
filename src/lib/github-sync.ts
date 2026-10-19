import { createHash } from 'node:crypto'
import { extname } from 'node:path'
import binaryExtensions from 'binary-extensions'
import { Document } from '@langchain/core/documents'

import { generateEmbedding, summariseCode } from '@/lib/gemini'
import { createGithubClient, getGithubRepoHead } from '@/lib/github'
import { db } from '@/server/db'

const ignoredFiles = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
])
const binaryExtensionSet = new Set(binaryExtensions)

type TreeFile = {
  path: string
  sha: string
  size?: number
}

function isIndexableFile(path: string) {
  if (ignoredFiles.has(path)) return false
  const extension = extname(path).slice(1).toLowerCase()
  return !extension || !binaryExtensionSet.has(extension)
}

function gitBlobSha(sourceCode: string) {
  return createHash('sha1')
    .update(`blob ${Buffer.byteLength(sourceCode, 'utf8')}\0`)
    .update(sourceCode, 'utf8')
    .digest('hex')
}

async function fetchBlobText(
  client: ReturnType<typeof createGithubClient>,
  owner: string,
  repo: string,
  file: TreeFile,
) {
  if (file.size !== undefined && file.size > 10_000_000) {
    throw new Error(`${file.path} is larger than the 10 MB sync limit.`)
  }

  const { data } = await client.rest.git.getBlob({
    owner,
    repo,
    file_sha: file.sha,
  })

  if (data.encoding !== 'base64') {
    throw new Error(`GitHub returned an unsupported encoding for ${file.path}.`)
  }

  const bytes = Buffer.from(data.content, 'base64')
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes)
  } catch {
    throw new Error(`${file.path} is not valid UTF-8 text and could not be indexed.`)
  }
}

export async function syncGithubRepo(projectId: string, githubToken?: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      githubUrl: true,
      lastIndexedCommitSha: true,
    },
  })

  if (!project) throw new Error('Project not found.')

  const { owner, repo, headSha } = await getGithubRepoHead(
    project.githubUrl,
    githubToken,
  )

  if (project.lastIndexedCommitSha === headSha) {
    await db.project.update({
      where: { id: projectId },
      data: { lastSyncedAt: new Date() },
    })
    return {
      headSha,
      addedFiles: 0,
      updatedFiles: 0,
      deletedFiles: 0,
      unchangedFiles: 0,
      changedFiles: [],
      noChanges: true,
    }
  }

  const client = createGithubClient(githubToken)
  const commit = await client.rest.git.getCommit({
    owner,
    repo,
    commit_sha: headSha,
  })
  const tree = await client.rest.git.getTree({
    owner,
    repo,
    tree_sha: commit.data.tree.sha,
    recursive: '1',
  })

  if (tree.data.truncated) {
    throw new Error('GitHub returned an incomplete repository file list. No files were removed.')
  }

  const remoteFiles: TreeFile[] = tree.data.tree.flatMap((entry) => {
    if (
      entry.type !== 'blob' ||
      !entry.path ||
      !entry.sha ||
      !isIndexableFile(entry.path)
    ) {
      return []
    }
    return [{ path: entry.path, sha: entry.sha, size: entry.size }]
  })

  const indexedFiles = await db.sourceCodeEmbedding.findMany({
    where: { projectId },
    select: { id: true, fileName: true, sourceCode: true },
  })
  const indexedByPath = new Map<string, (typeof indexedFiles)[number]>()
  const duplicateIds: string[] = []
  for (const file of indexedFiles) {
    if (indexedByPath.has(file.fileName)) duplicateIds.push(file.id)
    else indexedByPath.set(file.fileName, file)
  }

  const remotePaths = new Set(remoteFiles.map((file) => file.path))
  let addedFiles = 0
  let updatedFiles = 0
  let unchangedFiles = 0
  const changedFiles: { fileName: string; change: 'added' | 'updated' | 'deleted' }[] = []

  for (const file of remoteFiles) {
    const existing = indexedByPath.get(file.path)
    if (existing && gitBlobSha(existing.sourceCode) === file.sha) {
      unchangedFiles++
      continue
    }

    const sourceCode = await fetchBlobText(client, owner, repo, file)
    const document = new Document({
      pageContent: sourceCode,
      metadata: { source: file.path },
    })
    const summary = await summariseCode(document)
    const textToEmbed = summary.trim().length > 10
      ? summary
      : `${file.path}\n${sourceCode.slice(0, 2000)}`
    const embedding = await generateEmbedding(textToEmbed)

    const data = {
      summary,
      sourceCode,
      fileName: file.path,
      projectId,
    }
    const record = existing
      ? await db.sourceCodeEmbedding.update({ where: { id: existing.id }, data })
      : await db.sourceCodeEmbedding.create({ data })

    await db.$executeRaw`
      UPDATE "SourceCodeEmbedding"
      SET "summaryEmbedding" = ${`[${embedding.join(',')}]`}::vector
      WHERE "id" = ${record.id}
    `

    if (existing) {
      updatedFiles++
      changedFiles.push({ fileName: file.path, change: 'updated' })
    } else {
      addedFiles++
      changedFiles.push({ fileName: file.path, change: 'added' })
    }
  }

  const deletedPaths = indexedFiles
    .filter((file) => !remotePaths.has(file.fileName))
    .map((file) => file.fileName)
  const uniqueDeletedPaths = [...new Set(deletedPaths)]
  changedFiles.push(...uniqueDeletedPaths.map((fileName) => ({ fileName, change: 'deleted' as const })))
  if (remotePaths.size === 0) {
    await db.sourceCodeEmbedding.deleteMany({ where: { projectId } })
  } else {
    await db.sourceCodeEmbedding.deleteMany({
      where: { projectId, fileName: { notIn: [...remotePaths] } },
    })
  }
  if (duplicateIds.length > 0) {
    await db.sourceCodeEmbedding.deleteMany({
      where: { id: { in: duplicateIds } },
    })
  }

  // Security findings describe a particular source snapshot, so force the next
  // audit request to scan the refreshed files.
  await db.securityAudit.deleteMany({ where: { projectId } })
  await db.project.update({
    where: { id: projectId },
    data: {
      lastIndexedCommitSha: headSha,
      lastSyncedAt: new Date(),
    },
  })

  return {
    headSha,
    addedFiles,
    updatedFiles,
    deletedFiles: new Set(deletedPaths).size,
    unchangedFiles,
    changedFiles: changedFiles.slice(0, 25),
    noChanges: addedFiles === 0 && updatedFiles === 0 && deletedPaths.length === 0,
  }
}
