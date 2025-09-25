import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { title, userId } = await request.json()
    const { id: conversationId } = await params

    if (!title || !userId || !conversationId) {
      return NextResponse.json(
        { error: 'Title, userId, and conversationId are required' },
        { status: 400 }
      )
    }

    // Validate title length
    if (title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be 100 characters or less' },
        { status: 400 }
      )
    }

    // Verify the conversation belongs to the user
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: userId
      }
    })

    if (!existingConversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // Update the conversation title
    const updatedConversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: title.trim() }
    })

    return NextResponse.json({
      success: true,
      conversation: updatedConversation
    })

  } catch (error) {
    console.error('Error updating conversation title:', error)
    return NextResponse.json(
      { error: 'Failed to update conversation title' },
      { status: 500 }
    )
  }
}