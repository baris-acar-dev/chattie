interface OpenAIModel {
  name: string
  displayName: string
  description: string
  provider: 'openai'
  contextLength?: number
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

class OpenAIService {
  private apiKey: string | null = null
  private baseURL: string = 'https://api.openai.com/v1'

  constructor(apiKey?: string) {
    this.setApiKey(apiKey)
  }

  setApiKey(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || null
  }

  isConfigured(): boolean {
    return this.apiKey !== null
  }

  getAvailableModels(): OpenAIModel[] {
    return [
      {
        name: 'gpt-4o',
        displayName: 'GPT-4o',
        description: 'Most advanced multimodal model, great for complex reasoning',
        provider: 'openai',
        contextLength: 128000
      },
      {
        name: 'gpt-4o-mini',
        displayName: 'GPT-4o Mini',
        description: 'Fast and cost-effective model for everyday tasks',
        provider: 'openai',
        contextLength: 128000
      },
      {
        name: 'gpt-4-turbo',
        displayName: 'GPT-4 Turbo',
        description: 'Previous generation flagship model with strong performance',
        provider: 'openai',
        contextLength: 128000
      },
      {
        name: 'gpt-3.5-turbo',
        displayName: 'GPT-3.5 Turbo',
        description: 'Fast and efficient model for simple to moderate complexity tasks',
        provider: 'openai',
        contextLength: 16385
      }
    ]
  }

  async chat(
    model: string,
    messages: ChatMessage[],
    options: {
      temperature?: number
      maxTokens?: number
      stream?: boolean
    } = {}
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Please add your API key in preferences.')
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4096,
          stream: false
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }))
        
        if (response.status === 401) {
          throw new Error('Invalid OpenAI API key. Please check your API key in preferences.')
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a few moments.')
        } else if (response.status === 402) {
          throw new Error('Insufficient credits. Please check your OpenAI billing.')
        } else if (response.status === 400) {
          throw new Error(`Bad request: ${errorData.error?.message || 'Invalid request'}`)
        }
        
        throw new Error(`OpenAI API error: ${errorData.error?.message || `HTTP ${response.status}`}`)
      }

      const data = await response.json()
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response from OpenAI API')
      }

      return data.choices[0].message.content || ''
    } catch (error: any) {
      console.error('Error in OpenAI chat:', error)
      
      if (error.message?.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.')
      }
      
      throw error
    }
  }

  async testConnection(testApiKey?: string): Promise<boolean> {
    const keyToTest = testApiKey || this.apiKey
    
    if (!keyToTest) {
      return false
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${keyToTest}`
        }
      })

      return response.ok
    } catch (error) {
      console.error('OpenAI connection test failed:', error)
      return false
    }
  }

  async listModels(): Promise<string[]> {
    if (!this.apiKey) {
      return []
    }

    try {
      const response = await fetch(`${this.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return data.data
        ?.filter((model: any) => model.id.includes('gpt'))
        ?.map((model: any) => model.id) || []
    } catch (error) {
      console.error('Error fetching OpenAI models:', error)
      return []
    }
  }
}

export const openaiService = new OpenAIService()
export default OpenAIService