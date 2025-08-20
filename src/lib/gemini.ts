import { GoogleGenerativeAI } from '@google/generative-ai';
import { Document } from '@langchain/core/documents';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash'
})

export const aiSummariseCommit = async (diff: string) => {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please add it to your .env file');
  }
  
  // https://github.com/docker/genai-stack/commit/<commithash>.diff
  const response = await model.generateContent([
    'You are an expert programmer, and you are trying to summarize a git diff.',
    // Reminders about the git diff format:
    // For every file, there are a few metadata lines, like (for example):
    // diff --git a/lib/index.js b/lib/index.js
    // index aadf691..bfef603 100644
    // --- a/lib/index.js
    // +++ b/lib/index.js
    // 
    // lib/index.js was modified.
    // 
    // A line starting with + means it was added.
    // A line starting with - means that line was deleted.
    // A line starting with neither + nor - is code given for context and better understanding, and is not part of the actual diff.
    // 
    // EXAMPLE SUMMARY COMMENTS:
    // * Raised the amount of returned recordings from `10` to `100` [packages/server/recordings_api.ts], [packages/server/constants.ts]
    // * Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
    // * Moved the `octokit` initialization to a separate file [src/octokit.ts], [src/index.ts]
    // * Added an OpenAI API for completions [packages/utils/apis/openai.ts]
    // * Lowered numeric tolerance for test files
    // 
    // Most commits will have less comments than this examples list.
    // The last comment does not include the file names,
    // because there were more than two relevant files in the hypothetical commit.
    // Do not include parts of the example in your summary.
    // It is given only as an example of appropriate comments.
    `Please summarise the following diff file: \n\n${diff}`,
  ]);

  return response.response.text();
}

export async function summariseCode(doc: Document) {
  console.log("getting summary for", doc.metadata.source);
  
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
  try {
    const code = doc.pageContent.slice(0, 10000); // Limit to 10000 characters
    const response = await model.generateContent(`
      You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects.
      
      You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file.
      
      Here is the code:
      ---
      ${code}
      ---
      
      Give a summary no more than 100 words of the code above
    `);
    
    return response.response.text();
    } catch (error: any) {
      retryCount++;
      
      // Check if it's a rate limit error
      if (error.status === 429 && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
    console.error("Error generating summary:", error);
    return "";
  }
  }
  
  return "";
}

export const generateEmbedding = async (text: string) => {
  // Simple embedding generation using a hash-based approach
  // This creates a 768-dimensional vector to match the database schema
  const vectorSize = 768;
  const embedding = new Array(vectorSize).fill(0);
  
  // Simple hash-based embedding generation
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const position = (charCode * (i + 1)) % vectorSize;
    embedding[position] += 1;
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vectorSize; i++) {
      embedding[i] = embedding[i] / magnitude;
    }
  }
  
  return embedding;
}


