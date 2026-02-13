import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0'

const apiKey = Deno.env.get('GEMINI_API_KEY')

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set')
}

const genAI = new GoogleGenerativeAI(apiKey)

// Gemini 2.0 Flash model (fast and affordable)
export const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

// Text Embedding model (768 dimensions - supports pgvector index)
export const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

export { genAI }
