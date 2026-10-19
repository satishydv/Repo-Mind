import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github'
import { Document } from '@langchain/core/documents'
import { summariseCode, generateEmbedding } from './gemini'
import { db } from '../server/db'
import { getGithubRepoHead } from './github'

export const loadGithubRepo = async (
  githubUrl: string,
  githubToken?: string,
  branch = 'main',
) => {
  const loader = new GithubRepoLoader(githubUrl, {
    accessToken: githubToken || process.env.GITHUB_TOKEN || undefined,
    branch,
    ignoreFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'],
    recursive: true,
    unknown: 'warn',
    maxConcurrency: 5
  })
  
  const docs = await loader.load()
  return docs
}

export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?: string) => {
  console.log('Starting indexGithubRepo for project:', projectId, 'URL:', githubUrl)
  
  try {
    const { headSha } = await getGithubRepoHead(githubUrl, githubToken)

    // Test database connection
    console.log('Testing database connection...')
    await db.$queryRaw`SELECT 1`
    console.log('Database connection successful')
    
    const docs = await loadGithubRepo(githubUrl, githubToken, headSha)
    console.log('Loaded', docs.length, 'documents from GitHub')
    
    const allEmbeddings = await generateEmbeddings(docs)
    console.log('Generated embeddings for', allEmbeddings.filter(Boolean).length, 'files')

    if (allEmbeddings.length !== docs.length || allEmbeddings.some((embedding) => !embedding)) {
      throw new Error('Some repository files could not be embedded. The project sync point was not advanced.')
    }
    
    await Promise.all(allEmbeddings.map(async (embedding, index) => {
      console.log(`Processing ${index} of ${allEmbeddings.length}`)
      if (!embedding) return

      const existing = await db.sourceCodeEmbedding.findFirst({
        where: { projectId, fileName: embedding.fileName },
        select: { id: true },
      })
      const data = {
        summary: embedding.summary,
        sourceCode: embedding.sourceCode,
        fileName: embedding.fileName,
        projectId,
      }
      const sourceCodeEmbedding = existing
        ? await db.sourceCodeEmbedding.update({ where: { id: existing.id }, data })
        : await db.sourceCodeEmbedding.create({ data })

      await db.$executeRaw`
        UPDATE "SourceCodeEmbedding"
        SET "summaryEmbedding" = ${`[${embedding.embedding.join(',')}]`}::vector
        WHERE "id"= ${sourceCodeEmbedding.id}
      `

      console.log('Saved embedding for:', embedding.fileName)
    }))

    await db.project.update({
      where: { id: projectId },
      data: {
        syncStatus: 'ready',
        syncStartedAt: null,
        lastIndexedCommitSha: headSha,
        lastSyncedAt: new Date(),
      },
    })
    
    console.log('Finished indexing project:', projectId)
    return allEmbeddings
  } catch (error) {
    console.error('Error in indexGithubRepo:', error)
    await db.project.updateMany({
      where: { id: projectId },
      data: { syncStatus: 'failed', syncStartedAt: null },
    }).catch((updateError) => {
      console.error('Could not record indexing failure:', updateError)
    })
    throw error
  }
}

const generateEmbeddings = async (docs: Document[]) => {
  console.log('Starting generateEmbeddings for', docs.length, 'documents')
  const results = []
  
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i]
    if (!doc) continue
    console.log(`Processing file ${i + 1} of ${docs.length}: ${doc.metadata.source}`)
    
    try {
      console.log('Generating summary for:', doc.metadata.source)
      const summary = await summariseCode(doc)
      console.log('Summary generated for:', doc.metadata.source, 'Length:', summary.length)
      
      console.log('Generating embedding for:', doc.metadata.source)
      const textToEmbed = (summary && summary.trim().length > 10)
        ? summary
        : `${doc.metadata.source}\n${(doc.pageContent || '').slice(0, 2000)}`
      const embedding = await generateEmbedding(textToEmbed)
      console.log('Embedding generated for:', doc.metadata.source, 'Vector size:', embedding.length)
      
      results.push({
        summary,
        embedding,
        sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
        fileName: doc.metadata.source,
      })
      
      console.log('Successfully processed:', doc.metadata.source)
      
      // Add delay to respect rate limits (4 seconds between requests = 15 requests per minute)
      if (i < docs.length - 1) {
        console.log('Waiting 4 seconds before next file...')
        await new Promise(resolve => setTimeout(resolve, 4000))
      }
    } catch (error) {
      console.error(`Error processing ${doc.metadata.source}:`, error)
      // Continue with next file instead of failing completely
      results.push(null)
    }
  }
  
  console.log('Finished generateEmbeddings. Successfully processed:', results.filter(Boolean).length, 'files')
  return results
}

