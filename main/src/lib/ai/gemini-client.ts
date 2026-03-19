import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Gemini 2.0 Flash Lite 모델 (빠르고 저렴)
export const chatModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

// Text Embedding 모델 (768 차원 - pgvector 인덱스 지원)
export const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

export { genAI }
