import { Ollama } from 'ollama'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  message: {
    role: string
    content: string
  }
  done: boolean
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  eval_count?: number
  eval_duration?: number
}

class OllamaService {
  private ollama: Ollama

  constructor(baseUrl: string = OLLAMA_BASE_URL) {
    this.ollama = new Ollama({ host: baseUrl })
  }
  async getModels(): Promise<OllamaModel[]> {
    try {
      const response = await this.ollama.list()
      return response.models.map(model => ({
        name: model.name,
        size: model.size,
        digest: model.digest,
        modified_at: model.modified_at instanceof Date 
          ? model.modified_at.toISOString()
          : new Date(model.modified_at).toISOString()
      }))
    } catch (error) {
      console.error('Error fetching Ollama models:', error)
      return []
    }
  }

  async chat(
    model: string,
    messages: ChatMessage[],
    options: {
      stream?: boolean
      temperature?: number
      top_p?: number
      max_tokens?: number
    } = {}
  ): Promise<string> {
    try {
      const response = await this.ollama.chat({
        model,
        messages: messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })),
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          num_predict: options.max_tokens || -1,
        },
      })

      return response.message?.content || ''
    } catch (error) {
      console.error('Error in Ollama chat:', error)
      throw new Error('Failed to get response from Ollama')
    }
  }

  async streamChat(
    model: string,
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    options: {
      temperature?: number
      top_p?: number
      max_tokens?: number
    } = {}
  ): Promise<void> {
    try {
      const stream = await this.ollama.chat({
        model,
        messages: messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })),
        stream: true,
        options: {
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          num_predict: options.max_tokens || -1,
        },
      })

      for await (const chunk of stream) {
        if (chunk.message?.content) {
          onChunk(chunk.message.content)
        }
      }
    } catch (error) {
      console.error('Error in Ollama stream chat:', error)
      throw new Error('Failed to stream response from Ollama')
    }
  }

  async isModelAvailable(modelName: string): Promise<boolean> {
    const models = await this.getModels()
    return models.some(model => model.name === modelName)
  }

  async pullModel(modelName: string): Promise<void> {
    try {
      await this.ollama.pull({ model: modelName })
    } catch (error) {
      console.error('Error pulling Ollama model:', error)
      throw new Error(`Failed to pull model: ${modelName}`)
    }
  }
}

export const ollamaService = new OllamaService()
