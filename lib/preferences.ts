import { prisma } from './prisma'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-char-key-for-dev-only!!'
const ALGORITHM = 'aes-256-cbc'

// Ensure the encryption key is exactly 32 characters for AES-256
const normalizeKey = (key: string): string => {
  if (key.length === 32) return key
  if (key.length > 32) return key.substring(0, 32)
  return key.padEnd(32, '0')
}

const NORMALIZED_KEY = normalizeKey(ENCRYPTION_KEY)

export interface UserPreferences {
  id: string
  userId: string
  geminiApiKey?: string
  openaiApiKey?: string
  defaultModel?: string
  temperature?: number
  maxTokens?: number
  theme?: string
  createdAt: Date
  updatedAt: Date
}

class PreferencesService {
  private encrypt(text: string): string {
    const iv = randomBytes(16)
    const cipher = createCipheriv(ALGORITHM, Buffer.from(NORMALIZED_KEY), iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return iv.toString('hex') + ':' + encrypted
  }

  private decrypt(encryptedText: string): string {
    const textParts = encryptedText.split(':')
    const iv = Buffer.from(textParts.shift()!, 'hex')
    const encrypted = textParts.join(':')
    const decipher = createDecipheriv(ALGORITHM, Buffer.from(NORMALIZED_KEY), iv)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }

  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      const preferences = await prisma.userPreferences.findUnique({
        where: { userId }
      })

      if (!preferences) {
        return null
      }      // Decrypt API keys if they exist
      const decryptedPreferences: UserPreferences = {
        ...preferences,
        geminiApiKey: preferences.geminiApiKey
          ? this.decrypt(preferences.geminiApiKey)
          : undefined,
        openaiApiKey: preferences.openaiApiKey
          ? this.decrypt(preferences.openaiApiKey)
          : undefined,
        defaultModel: preferences.defaultModel || undefined,
        temperature: preferences.temperature || undefined,
        maxTokens: preferences.maxTokens || undefined,
        theme: preferences.theme || undefined
      }

      return decryptedPreferences
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      return null
    }
  }

  async updateUserPreferences(
    userId: string,
    updates: Partial<Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<UserPreferences> {
    try {
      // Remove computed properties that shouldn't be saved to database
      const { hasGeminiApiKey, hasOpenaiApiKey, ...validUpdates } = updates as any;
      
      // Filter out masked API key values - these should not be saved
      if (validUpdates.geminiApiKey === '••••••••••••••••') {
        delete validUpdates.geminiApiKey;
      }
      
      if (validUpdates.openaiApiKey === '••••••••••••••••') {
        delete validUpdates.openaiApiKey;
      }
      
      // Encrypt API key if provided
      const encryptedUpdates = { ...validUpdates };

      // Handle Gemini API key - encrypt if provided, set to null if explicitly clearing
      if (validUpdates.geminiApiKey === null) {
        encryptedUpdates.geminiApiKey = null;
      } else if (validUpdates.geminiApiKey && validUpdates.geminiApiKey !== '') {
        encryptedUpdates.geminiApiKey = this.encrypt(validUpdates.geminiApiKey);
      }

      // Handle OpenAI API key - encrypt if provided, set to null if explicitly clearing
      if (validUpdates.openaiApiKey === null) {
        encryptedUpdates.openaiApiKey = null;
      } else if (validUpdates.openaiApiKey && validUpdates.openaiApiKey !== '') {
        encryptedUpdates.openaiApiKey = this.encrypt(validUpdates.openaiApiKey);
      }

      const preferences = await prisma.userPreferences.upsert({
        where: { userId },
        update: {
          ...encryptedUpdates,
          updatedAt: new Date()
        },
        create: {
          userId,
          ...encryptedUpdates
        }
      })      // Return decrypted preferences
      const result: UserPreferences = {
        ...preferences,
        geminiApiKey: preferences.geminiApiKey
          ? this.decrypt(preferences.geminiApiKey)
          : undefined,
        openaiApiKey: preferences.openaiApiKey
        ? this.decrypt(preferences.openaiApiKey)
        : undefined,
        defaultModel: preferences.defaultModel || undefined,
        temperature: preferences.temperature || undefined,
        maxTokens: preferences.maxTokens || undefined,
        theme: preferences.theme || undefined
      }

      return result
    } catch (error) {
      console.error('Error updating user preferences:', error)
      throw new Error('Failed to update preferences')
    }
  }

  async deleteUserPreferences(userId: string): Promise<boolean> {
    try {
      await prisma.userPreferences.delete({
        where: { userId }
      })
      return true
    } catch (error) {
      console.error('Error deleting user preferences:', error)
      return false
    }
  } async testGeminiApiKey(apiKey: string): Promise<boolean> {
    try {
      // Validate API key format
      if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 20) {
        console.error('Invalid API key format')
        return false
      }

      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey.trim())

      // Try with the latest available model
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      const result = await model.generateContent('Hello')
      const response = await result.response
      const text = response.text()

      console.log('Gemini API test successful:', !!text)
      return !!text
    } catch (error: any) {
      console.error('Gemini API key test failed:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText
      })
      return false
    }
  }

  async testOpenAIApiKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })
      return response.ok
    } catch (error: any) {
      console.error('OpenAI API key test failed:', error.message)
      return false
    }
  }
}

export const preferencesService = new PreferencesService()
