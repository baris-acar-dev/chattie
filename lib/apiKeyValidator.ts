// API Key validation utilities

export interface ApiKeyValidationResult {
  isValid: boolean
  error?: string
  suggestion?: string
}

export class ApiKeyValidator {
  /**
   * Validate Google AI Studio API key format
   */
  static validateGeminiApiKey(apiKey: string): ApiKeyValidationResult {
    // Remove whitespace
    const cleanKey = apiKey.trim()

    // Basic length check
    if (cleanKey.length < 20) {
      return {
        isValid: false,
        error: 'API key is too short',
        suggestion: 'Google AI Studio API keys are typically 39+ characters long'
      }
    }

    // Check if it starts with AIza (common prefix for Google API keys)
    if (!cleanKey.startsWith('AIza')) {
      return {
        isValid: false,
        error: 'Invalid API key format',
        suggestion: 'Google AI Studio API keys should start with "AIza"'
      }
    }

    // Check for invalid characters
    if (!/^[A-Za-z0-9_-]+$/.test(cleanKey)) {
      return {
        isValid: false,
        error: 'API key contains invalid characters',
        suggestion: 'API keys should only contain letters, numbers, hyphens, and underscores'
      }
    }

    return {
      isValid: true
    }
  }

  /**
   * Instructions for obtaining a Google AI Studio API key
   */
  static getGeminiApiKeyInstructions(): string {
    return `To get your Google AI Studio API key:

1. Go to https://aistudio.google.com/
2. Sign in with your Google account
3. Click "Get API Key" in the left sidebar
4. Click "Create API Key in new project" or select existing project
5. Copy the generated API key (starts with "AIza")
6. Paste it in the field above

Note: The API key should be around 39 characters long and start with "AIza"`
  }
}
