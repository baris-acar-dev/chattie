import { NextRequest, NextResponse } from 'next/server'
import { ragService } from '@/lib/rag'

export async function POST(request: NextRequest) {
  try {
    const { query, conversationContext } = await request.json()

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Generate RAG-enhanced response
    const ragResponse = await ragService.generateResponse(query, conversationContext)

    return NextResponse.json(ragResponse)
  } catch (error) {
    console.error('RAG API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate RAG response' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    // Search knowledge base
    const results = await ragService.search(query)

    return NextResponse.json({
      results,
      count: results.length
    })
  } catch (error) {
    console.error('RAG search API error:', error)
    return NextResponse.json(
      { error: 'Failed to search knowledge base' },
      { status: 500 }
    )
  }
}
