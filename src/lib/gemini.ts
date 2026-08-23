import { GoogleGenerativeAI } from '@google/generative-ai';
import { Document } from '@langchain/core/documents';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const model = genAI.getGenerativeModel({
  model: 'gemini-3.5-flash'
})

export const aiSummariseCommit = async (diff: string) => {
  // Check if API key is available
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set. Please add it to your .env file');
  }

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const response = await model.generateContent([
        'You are an expert programmer, and you are trying to summarize a git diff.',
        `Please summarise the following diff file: \n\n${diff}`,
      ]);

      return response.response.text();
    } catch (error: any) {
      retryCount++;
      const isRateLimit =
        error?.status === 429 ||
        error?.message?.includes('429') ||
        error?.message?.toLowerCase().includes('too many requests') ||
        error?.message?.toLowerCase().includes('quota') ||
        error?.message?.toLowerCase().includes('resource_exhausted')

      if (isRateLimit && retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Rate limited in commit summary. Retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      console.error('Error in aiSummariseCommit:', error);
      return '### Commit Summary\n* Code changes were indexed. (Rate limit reached during full AI analysis)';
    }
  }

  return '### Commit Summary\n* Code changes were indexed.';
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

export const generateEmbedding = async (text: string): Promise<number[]> => {
  if (!text || text.trim().length === 0) {
    return new Array(768).fill(0);
  }

  try {
    const embeddingModel = genAI.getGenerativeModel({
      model: 'gemini-embedding-001',
    });

    const result = await embeddingModel.embedContent({
      content: { role: 'user', parts: [{ text: text.slice(0, 8000) }] },
      outputDimensionality: 768,
    } as any);

    return result.embedding.values;
  } catch (error) {
    console.error('Error generating Gemini embedding, using fallback:', error);
    const vectorSize = 768;
    const embedding = new Array(vectorSize).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const position = (charCode * (i + 1)) % vectorSize;
      embedding[position] += 1;
    }
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vectorSize; i++) {
        embedding[i] = embedding[i] / magnitude;
      }
    }
    return embedding;
  }
};


