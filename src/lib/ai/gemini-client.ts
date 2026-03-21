/**
 * Gemini AI Client — Vertex AI backend via @google/genai SDK
 *
 * Drop-in replacement: exports genAI, chatModel, embeddingModel
 * with the same API surface as the old @google/generative-ai SDK.
 *
 * Lazy-initialized to avoid build-time errors when env vars are missing.
 */
import { GoogleGenAI } from '@google/genai'

let _ai: GoogleGenAI | null = null

function getAI(): GoogleGenAI {
  if (_ai) return _ai

  const project = process.env.GOOGLE_PROJECT_ID
  const location = process.env.GOOGLE_LOCATION || 'us-central1'

  if (!project) {
    throw new Error('GOOGLE_PROJECT_ID is not set in environment variables')
  }

  _ai = new GoogleGenAI({
    vertexai: true,
    project,
    location,
    googleAuthOptions: process.env.GOOGLE_CREDENTIALS_JSON
      ? { credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON) }
      : undefined,
  })

  return _ai
}

/* ── Compat wrapper ──
 * Old SDK: result.response.text()   (method)
 * New SDK: response.text            (getter)
 * Wrap so downstream code calling result.response.text() still works.
 */

function wrapResponse(response: any): { response: { text: () => string; candidates?: any[] } } {
  return {
    response: {
      text: () => response.text ?? '',
      candidates: response.candidates,
    },
  }
}

function createModel(modelName: string, modelConfig?: Record<string, any>) {
  return {
    generateContent: async (input: any) => {
      const ai = getAI()
      let contents: any
      let config: Record<string, any> = modelConfig ? { ...modelConfig } : {}

      if (typeof input === 'string') {
        contents = input
      } else {
        contents = input.contents ?? input
        if (input.generationConfig) {
          config = { ...config, ...input.generationConfig }
        }
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      })
      return wrapResponse(response)
    },

    startChat: (chatConfig?: Record<string, any>) => {
      const ai = getAI()
      const mergedConfig = {
        ...modelConfig,
        ...(chatConfig?.systemInstruction && { systemInstruction: chatConfig.systemInstruction }),
        ...(chatConfig?.generationConfig && { ...chatConfig.generationConfig }),
      }
      const chat = ai.chats.create({
        model: modelName,
        config: Object.keys(mergedConfig).length > 0 ? mergedConfig : undefined,
        history: chatConfig?.history,
      })
      return {
        sendMessage: async (msg: string) => {
          const response = await chat.sendMessage({ message: msg })
          return wrapResponse(response)
        },
      }
    },
  }
}

/** Drop-in replacement for GoogleGenerativeAI */
export const genAI = {
  getGenerativeModel: (opts: any) =>
    createModel(opts.model, {
      ...(opts.systemInstruction && { systemInstruction: opts.systemInstruction }),
    }),
}

/** Pre-configured chat model */
export const chatModel = createModel('gemini-2.5-flash-lite')

/** Embedding model (backward compat: result.embedding.values) */
export const embeddingModel = {
  embedContent: async (text: string) => {
    const ai = getAI()
    const result = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: text,
    })
    return {
      embedding: {
        values: result.embeddings?.[0]?.values ?? [],
      },
    }
  },
}
