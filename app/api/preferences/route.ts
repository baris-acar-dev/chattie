import { NextRequest, NextResponse } from 'next/server'
import { preferencesService } from '@/lib/preferences'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const preferences = await preferencesService.getUserPreferences(userId)

    // Don't return the API keys in the response for security
    const safePreferences = preferences ? {
      ...preferences,
      geminiApiKey: preferences.geminiApiKey ? '••••••••••••••••' : undefined,
      hasGeminiApiKey: !!preferences.geminiApiKey,
      openaiApiKey: preferences.openaiApiKey ? '••••••••••••••••' : undefined,
      hasOpenaiApiKey: !!preferences.openaiApiKey
    } : null

    return NextResponse.json({ preferences: safePreferences })
  } catch (error) {
    console.error('Preferences GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...updates } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }    // Test Gemini API key if provided
    if (updates.geminiApiKey && updates.geminiApiKey !== '••••••••••••••••') {
      console.log('Testing Gemini API key...')
      const isValidKey = await preferencesService.testGeminiApiKey(updates.geminiApiKey)
      if (!isValidKey) {
        console.log('Gemini API key validation failed')
        return NextResponse.json(
          { error: 'Invalid Gemini API key. Please check your key and try again.' },
          { status: 400 }
        )
      }
      console.log('Gemini API key validation successful')
    }

    // Test OpenAI API key if provided
    if (updates.openaiApiKey && updates.openaiApiKey !== '••••••••••••••••') {
      console.log('Testing OpenAI API key...')
      const isValidKey = await preferencesService.testOpenAIApiKey(updates.openaiApiKey)
      if (!isValidKey) {
        console.log('OpenAI API key validation failed')
        return NextResponse.json(
          { error: 'Invalid OpenAI API key. Please check your key and try again.' },
          { status: 400 }
        )
      }
      console.log('OpenAI API key validation successful')
    }

    const preferences = await preferencesService.updateUserPreferences(userId, updates)

    // Don't return the API keys in the response
    const safePreferences = {
      ...preferences,
      geminiApiKey: preferences.geminiApiKey ? '••••••••••••••••' : undefined,
      hasGeminiApiKey: !!preferences.geminiApiKey,
      openaiApiKey: preferences.openaiApiKey ? '••••••••••••••••' : undefined,
      hasOpenaiApiKey: !!preferences.openaiApiKey
    }

    return NextResponse.json({ 
      preferences: safePreferences,
      message: 'Preferences updated successfully'
    })
  } catch (error) {
    console.error('Preferences POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const success = await preferencesService.deleteUserPreferences(userId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      message: 'Preferences deleted successfully' 
    })
  } catch (error) {
    console.error('Preferences DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete preferences' },
      { status: 500 }
    )
  }
}
