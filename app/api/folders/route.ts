import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Use type assertion to handle the folder model
    const folders = await (prisma as any).folder.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            conversations: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({
      folders: folders.map((folder: any) => ({
        id: folder.id,
        name: folder.name,
        color: folder.color,
        userId: folder.userId,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        conversationCount: folder._count.conversations
      }))
    })
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, userId, color } = await request.json()

    if (!name || !userId) {
      return NextResponse.json(
        { error: 'Name and userId are required' },
        { status: 400 }
      )
    }

    // Check if folder with this name already exists for this user
    const existingFolder = await (prisma as any).folder.findFirst({
      where: {
        userId,
        name: name.trim()
      }
    })

    if (existingFolder) {
      return NextResponse.json(
        { error: 'A folder with this name already exists' },
        { status: 400 }
      )
    }

    const folder = await (prisma as any).folder.create({
      data: {
        name: name.trim(),
        userId,
        color: color || 'gray'
      }
    })

    return NextResponse.json({
      folder: {
        id: folder.id,
        name: folder.name,
        color: folder.color,
        userId: folder.userId,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt
      }
    })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}