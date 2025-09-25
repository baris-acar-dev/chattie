import { GoogleGenerativeAI } from '@google/generative-ai'

export interface GeminiModel {
  name: string
  displayName: string
  description: string
  provider: 'gemini'
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null
  private apiKey: string | null = null

  constructor(apiKey?: string) {
    this.setApiKey(apiKey)
  }

  setApiKey(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_AI_API_KEY || null
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey)
    } else {
      this.genAI = null
    }
  }

  isConfigured(): boolean {
    return this.genAI !== null && this.apiKey !== null
  }  getAvailableModels(): GeminiModel[] {
    return [
      {
        name: 'gemini-2.0-flash-exp',
        displayName: 'Gemini 2.0 Flash (Experimental)',
        description: 'Latest experimental model with enhanced capabilities',
        provider: 'gemini'
      },
      {
        name: 'gemini-exp-1206',
        displayName: 'Gemini Experimental 1206',
        description: 'Cutting-edge experimental model',
        provider: 'gemini'
      },
      {
        name: 'gemini-1.5-pro',
        displayName: 'Gemini 1.5 Pro',
        description: 'Most capable model for complex reasoning tasks',
        provider: 'gemini'
      },
      /*{
        name: 'gemini-1.5-flash',
        displayName: 'Gemini 1.5 Flash',
        description: 'Fast and efficient model for everyday tasks',
        provider: 'gemini'
      },*/
      {
        name: 'gemini-1.5-flash-8b',
        displayName: 'Gemini 1.5 Flash 8B',
        description: 'Lightweight model optimized for speed and efficiency',
        provider: 'gemini'
      }
    ]
  }

  async chat(
    model: string,
    messages: ChatMessage[],
    options: {
      temperature?: number
      maxOutputTokens?: number
    } = {}
  ): Promise<string> {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured')
    }    try {
      // Validate API key
      if (!this.apiKey) {
        throw new Error('Gemini API key not configured')
      }

      const geminiModel = this.genAI.getGenerativeModel({ 
        model,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxOutputTokens || 8192,
        }
      })
      
      // Convert messages to Gemini format with proper handling
      const history: Array<{ role: 'user' | 'model', parts: Array<{ text: string }> }> = []
      const systemMessages: string[] = []
      let lastMessage = ''

      for (const msg of messages) {
        if (msg.role === 'system') {
          systemMessages.push(msg.content)
        } else if (msg.role === 'user') {
          history.push({
            role: 'user',
            parts: [{ text: msg.content }]
          })
          lastMessage = msg.content
        } else if (msg.role === 'assistant') {
          history.push({
            role: 'model',
            parts: [{ text: msg.content }]
          })
        }
      }

      // Add system messages as context to the first user message
      let contextualPrompt = lastMessage
      if (systemMessages.length > 0) {
        contextualPrompt = `${systemMessages.join('\n\n')}\n\n${lastMessage}`
      }

      // Debug: Check for problematic characters
      if (contextualPrompt.includes('•')) {
        console.error('Gemini contextualPrompt contains bullet characters:', {
          prompt: contextualPrompt.substring(0, 200) + '...',
          bulletCount: (contextualPrompt.match(/•/g) || []).length
        })
        throw new Error('Invalid characters detected in prompt')
      }

      // Check history for bullet characters
      const historyToUse = history.slice(0, -1)
      for (let i = 0; i < historyToUse.length; i++) {
        const msg = historyToUse[i]
        if (msg.parts?.[0]?.text?.includes('•')) {
          console.error('Gemini history contains bullet characters:', {
            messageIndex: i,
            role: msg.role,
            text: msg.parts[0].text.substring(0, 200) + '...',
            bulletCount: (msg.parts[0].text.match(/•/g) || []).length
          })
          throw new Error('Invalid characters detected in conversation history')
        }
      }

      // Use chat with proper error handling for rate limits
      const chat = geminiModel.startChat({
        history: historyToUse
      })

      const result = await chat.sendMessage(contextualPrompt)
      const response = await result.response
      return response.text()
    } catch (error: any) {
      console.error('Error in Gemini chat:', error)
      
      // Handle specific error types
      if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.')
      } else if (error.status === 401) {
        throw new Error('Invalid API key. Please check your Gemini API key in preferences.')
      } else if (error.status === 400) {
        throw new Error('Invalid request. Please check your message format.')
      } else if (error.message?.includes('quota')) {
        throw new Error('API quota exceeded. Please check your plan and billing details.')
      }
      
      throw new Error(`Gemini API error: ${error.message || 'Unknown error'}`)
    }
  }
  async testConnection(): Promise<boolean> {
    if (!this.genAI) {
      return false
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const result = await model.generateContent('Hello')
      const response = await result.response
      return !!response.text()
    } catch (error) {
      console.error('Gemini connection test failed:', error)
      return false
    }
  }
}

export const geminiService = new GeminiService()
