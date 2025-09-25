import { NextRequest, NextResponse } from 'next/server'
import PromptTemplateService from '@/lib/promptTemplates'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await PromptTemplateService.initializeDefaultTemplates(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error initializing default templates:', error)
    return NextResponse.json(
      { error: 'Failed to initialize default templates' },
      { status: 500 }
    )
  }
}
