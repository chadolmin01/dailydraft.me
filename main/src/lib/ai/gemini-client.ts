/**
 * Gemini AI Client — @google/genai SDK
 *
 * Drop-in replacement: exports genAI, chatModel, embeddingModel
 * with the same API surface as the old @google/generative-ai SDK.
 *
 * Auth priority:
 *   1. GEMINI_API_KEY + VERTEX_AI_EXPRESS=true → Vertex AI Express Mode (apiKey + vertexai)
 *   2. GEMINI_API_KEY only → direct API key auth (AI Studio)
 *   3. GOOGLE_PROJECT_ID + GOOGLE_CREDENTIALS_JSON → Vertex AI with service account
 *   4. GOOGLE_PROJECT_ID only → Vertex AI with ADC (gcloud auth)
 *
 * Lazy-initialized to avoid build-time errors when env vars are missing.
 */
import { GoogleGenAI } from '@google/genai'

let _ai: GoogleGenAI | null = null

function getAI(): GoogleGenAI {
  if (_ai) return _ai

  const apiKey = process.env.GEMINI_API_KEY
  const vertexExpress = process.env.VERTEX_AI_EXPRESS === 'true'
  const project = process.env.GOOGLE_PROJECT_ID
  const location = process.env.GOOGLE_LOCATION || 'us-central1'

  // 1) Vertex AI Express Mode — apiKey + vertexai (no project/location needed)
  if (apiKey && vertexExpress) {
    _ai = new GoogleGenAI({ apiKey, vertexai: true })
    return _ai
  }

  // 2) Direct API key auth (AI Studio)
  if (apiKey) {
    _ai = new GoogleGenAI({ apiKey })
    return _ai
  }

  // 3) Vertex AI with service account or ADC
  if (project) {
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

  // 4) No credentials at all — stub that throws on use
  console.warn('[gemini-client] No GEMINI_API_KEY or GOOGLE_PROJECT_ID — AI calls will fail at runtime')
  _ai = new Proxy({} as GoogleGenAI, {
    get(_, prop) {
      return (...args: any[]) => {
        throw new Error('No AI credentials configured. Set GEMINI_API_KEY or GOOGLE_PROJECT_ID.')
      }
    },
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
        if (input.systemInstruction) {
          config.systemInstruction = input.systemInstruction
        }
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      })
      return wrapResponse(response)
    },

    generateContentStream: async (input: any) => {
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

      const response = await ai.models.generateContentStream({
        model: modelName,
        contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      })

      // Wrap the async iterable to provide .text() compat on each chunk
      const stream = (async function* () {
        for await (const chunk of response) {
          yield { text: () => chunk.text ?? '' }
        }
      })()

      return { stream }
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
        sendMessageStream: async (msg: string) => {
          const response = await chat.sendMessageStream({ message: msg })
          const stream = (async function* () {
            for await (const chunk of response) {
              yield { text: () => chunk.text ?? '' }
            }
          })()
          return { stream }
        },
      }
    },
  }
}

/** Raw @google/genai SDK instance — for direct API access (multimodal, etc.) */
export { getAI }

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
