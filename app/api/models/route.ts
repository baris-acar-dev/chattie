import { NextRequest, NextResponse } from 'next/server'
import { ollamaService } from '@/lib/ollama'
import { geminiService } from '@/lib/gemini'
import { openaiService } from '@/lib/openai'
import { preferencesService } from '@/lib/preferences'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Get Ollama models
    const ollamaModels = await ollamaService.getModels()

    // Get Gemini models if user has API key configured
    let geminiModels: any[] = []
    let openaiModels: any[] = []
    if (userId) {
      const preferences = await preferencesService.getUserPreferences(userId)
      
      // Check for Gemini API key
      if (preferences?.geminiApiKey) {
        geminiService.setApiKey(preferences.geminiApiKey)
        if (geminiService.isConfigured()) {
          geminiModels = geminiService.getAvailableModels()
        }
      }
      
      // Check for OpenAI API key
      if (preferences?.openaiApiKey) {
        openaiService.setApiKey(preferences.openaiApiKey)
        if (openaiService.isConfigured()) {
          openaiModels = openaiService.getAvailableModels()
        }
      }
    }

    // Combine models with provider information
    const allModels = [
      ...ollamaModels.map(model => ({
        ...model,
        provider: 'ollama',
        displayName: model.name
      })),
      ...geminiModels,
      ...openaiModels
    ]

    return NextResponse.json({ models: allModels })
  } catch (error) {
    console.error('Error fetching models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, apiKey } = await req.json()
    
    if (action === 'testOpenaiKey') {
      if (!apiKey) {
        return NextResponse.json({ error: 'API key required' }, { status: 400 })
      }
      
      try {
        const isValid = await openaiService.testConnection(apiKey)
        return NextResponse.json({ success: isValid })
      } catch (error) {
        console.error('OpenAI key test failed:', error)
        return NextResponse.json({ error: 'Invalid API key' }, { status: 400 })
      }
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in POST /api/models:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
