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
  console.log('Starting indexGithubRepo for project:', projectId, 'URL:', githubUrl)
  
  try {
    // Test database connection
    console.log('Testing database connection...')
    await db.$queryRaw`SELECT 1`
    console.log('Database connection successful')
    
    const docs = await loadGithubRepo(githubUrl, githubToken)
    console.log('Loaded', docs.length, 'documents from GitHub')
    
    const allEmbeddings = await generateEmbeddings(docs)
    console.log('Generated embeddings for', allEmbeddings.filter(Boolean).length, 'files')
    
    await Promise.allSettled(allEmbeddings.map(async (embedding, index) => {
      console.log(`Processing ${index} of ${allEmbeddings.length}`)
      if (!embedding) {
        console.log('Skipping null embedding at index', index)
        return
      }
      
      try {
        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
          data: {
            summary: embedding.summary,
            sourceCode: embedding.sourceCode,
            fileName: embedding.fileName,
            projectId,
          }
        })
        
        console.log('Created embedding record for:', embedding.fileName)
        
        await db.$executeRaw`
          UPDATE "SourceCodeEmbedding"
          SET "summaryEmbedding" = ${`[${embedding.embedding.join(',')}]`}::vector
          WHERE "id"= ${sourceCodeEmbedding.id}
        `
        
        console.log('Updated vector for:', embedding.fileName)
      } catch (error) {
        console.error('Error saving embedding for', embedding.fileName, ':', error)
      }
    }))
    
    console.log('Finished indexing project:', projectId)
    return allEmbeddings
  } catch (error) {
    console.error('Error in indexGithubRepo:', error)
    throw error
  }
}

const generateEmbeddings = async (docs: Document[]) => {
  console.log('Starting generateEmbeddings for', docs.length, 'documents')
  const results = []
  
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i]
    console.log(`Processing file ${i + 1} of ${docs.length}: ${doc.metadata.source}`)
    
    try {
      console.log('Generating summary for:', doc.metadata.source)
      const summary = await summariseCode(doc)
      console.log('Summary generated for:', doc.metadata.source, 'Length:', summary.length)
      
      console.log('Generating embedding for:', doc.metadata.source)
      const embedding = await generateEmbedding(summary)
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

