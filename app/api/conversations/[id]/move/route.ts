import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const { folderId, userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if conversation exists and belongs to user
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId
      }
    })

    if (!existingConversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // If folderId is provided, verify it exists and belongs to user
    if (folderId) {
      const existingFolder = await (prisma as any).folder.findFirst({
        where: {
          id: folderId,
          userId
        }
      })

      if (!existingFolder) {
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 }
        )
      }
    }

    // Update the conversation's folder
    const updatedConversation = await (prisma as any).conversation.update({
      where: { id: conversationId },
      data: { folderId }
    })

    return NextResponse.json({
      success: true,
      conversation: {
        id: updatedConversation.id,
        title: updatedConversation.title,
        folderId: updatedConversation.folderId
      }
    })
  } catch (error) {
    console.error('Error moving conversation:', error)
    return NextResponse.json(
      { error: 'Failed to move conversation' },
      { status: 500 }
    )
  }
}