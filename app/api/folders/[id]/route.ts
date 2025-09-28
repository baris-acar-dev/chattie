import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: folderId } = await params
    const { name, userId } = await request.json()

    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Name and userId are required' },
        { status: 400 }
      )
    }

    // Check if folder exists and belongs to user
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

    // Check if another folder with this name exists for this user
    const duplicateFolder = await (prisma as any).folder.findFirst({
      where: {
        userId,
        name: name.trim(),
        id: { not: folderId }
      }
    })

    if (duplicateFolder) {
      return NextResponse.json(
        { error: 'A folder with this name already exists' },
        { status: 400 }
      )
    }

    const updatedFolder = await (prisma as any).folder.update({
      where: { id: folderId },
      data: {
        name: name.trim()
      }
    })

    return NextResponse.json({
      folder: {
        id: updatedFolder.id,
        name: updatedFolder.name,
        color: updatedFolder.color,
        userId: updatedFolder.userId,
        createdAt: updatedFolder.createdAt,
        updatedAt: updatedFolder.updatedAt
      }
    })
  } catch (error) {
    console.error('Error updating folder:', error)
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: folderId } = await params
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if folder exists and belongs to user
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

    // Move all conversations in this folder to uncategorized (folderId = null)
    await (prisma as any).conversation.updateMany({
      where: { folderId },
      data: { folderId: null }
    })

    // Delete the folder
    await (prisma as any).folder.delete({
      where: { id: folderId }
    })

    return NextResponse.json({
      success: true,
      message: 'Folder deleted and conversations moved to uncategorized'
    })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    )
  }
}