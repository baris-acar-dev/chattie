import { NextRequest, NextResponse } from 'next/server'
import { preferencesService } from '@/lib/preferences'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey, provider } = body

    if (!apiKey || !provider) {
      return NextResponse.json(
        { error: 'API key and provider are required' },
        { status: 400 }
      )
    }

    let isValid = false
    let errorMessage = ''

    if (provider === 'gemini') {
      // Basic format validation for Gemini keys
      const cleanKey = apiKey.trim()
      if (cleanKey.length < 20) {
        return NextResponse.json(
          { 
            isValid: false, 
            error: 'API key appears to be too short (should be 39+ characters)' 
          }
        )
      }
      if (!cleanKey.startsWith('AIza')) {
        return NextResponse.json(
          { 
            isValid: false, 
            error: 'Invalid API key format (should start with "AIza")' 
          }
        )
      }

      try {
        isValid = await preferencesService.testGeminiApiKey(cleanKey)
        if (!isValid) {
          errorMessage = 'API key validation failed - please check your key and try again'
        }
      } catch (error: any) {
        console.error('Gemini API key test failed:', error)
        if (error.message?.includes('503') || error.message?.includes('overloaded')) {
          errorMessage = 'Gemini service is currently overloaded. Your key appears valid, please try again later.'
          // For 503 errors, we'll consider the key potentially valid
          isValid = true
        } else if (error.message?.includes('API_KEY_INVALID')) {
          errorMessage = 'Invalid API key format'
        } else if (error.message?.includes('Permission denied') || error.status === 403) {
          errorMessage = 'API key does not have required permissions'
        } else if (error.status === 400) {
          errorMessage = 'Invalid API key'
        } else {
          errorMessage = 'API key validation failed - please check your key'
        }
      }
    } else if (provider === 'openai') {
      try {
        isValid = await preferencesService.testOpenAIApiKey(apiKey)
        if (!isValid) {
          errorMessage = 'Invalid OpenAI API key - please check your key'
        }
      } catch (error: any) {
        console.error('OpenAI API key test failed:', error)
        errorMessage = 'OpenAI API key validation failed - please check your key'
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "gemini" or "openai"' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      isValid,
      error: isValid ? null : errorMessage
    })
  } catch (error) {
    console.error('Test API key error:', error)
    return NextResponse.json(
      { error: 'Failed to test API key' },
      { status: 500 }
    )
  }
}