import { GithubRepoLoader } from '@langchain/community/document_loaders/web/github'
import { Document } from '@langchain/core/documents'
import { summariseCode, generateEmbedding } from './gemini'
import { db } from '../server/db'

export const loadGithubRepo = async (githubUrl: string, githubToken?: string) => {
  const loader = new GithubRepoLoader(githubUrl, {
    accessToken: githubToken || '',
    branch: 'main',
    ignoreFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'],
    recursive: true,
    unknown: 'warn',
    maxConcurrency: 5
  })
  
  const docs = await loader.load()
  return docs
}

export const indexGithubRepo = async (projectId: string, githubUrl: string, githubToken?: string) => {
  const docs = await loadGithubRepo(githubUrl, githubToken)
  const allEmbeddings = await generateEmbeddings(docs)
  
  await Promise.allSettled(allEmbeddings.map(async (embedding, index) => {
    console.log(`processing ${index} of ${allEmbeddings.length}`)
    if (!embedding) return
    
    const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
      data: {
        summary: embedding.summary,
        sourceCode: embedding.sourceCode,
        fileName: embedding.fileName,
        projectId,
      }
    })
    
    await db.$executeRaw`
      UPDATE "SourceCodeEmbedding"
      SET "summaryEmbedding" = ${`[${embedding.embedding.join(',')}]`}::vector
      WHERE "id"= ${sourceCodeEmbedding.id}
    `
  }))
  
  return allEmbeddings
}

const generateEmbeddings = async (docs: Document[]) => {
  const results = []
  
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i]
    console.log(`Processing file ${i + 1} of ${docs.length}: ${doc.metadata.source}`)
    
    try {
      const summary = await summariseCode(doc)
      const embedding = await generateEmbedding(summary)
      
      results.push({
        summary,
        embedding,
        sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
        fileName: doc.metadata.source,
      })
      
      // Add delay to respect rate limits (4 seconds between requests = 15 requests per minute)
      if (i < docs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 4000))
      }
    } catch (error) {
      console.error(`Error processing ${doc.metadata.source}:`, error)
      // Continue with next file instead of failing completely
      results.push(null)
    }
  }
  
  return results
}

