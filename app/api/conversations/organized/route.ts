import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')

    if (!userId) {
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      )
    }

    // Build where clause
    let whereClause: any = { userId }
    
    if (category) {
      if (category === 'recent') {
        // Last 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        whereClause.updatedAt = { gte: sevenDaysAgo }
      } else if (category === 'older') {
        // Older than 7 days
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        whereClause.updatedAt = { lt: sevenDaysAgo }
      }
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Group conversations by time periods
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const grouped = {
      today: conversations.filter(c => new Date(c.updatedAt) >= today),
      yesterday: conversations.filter(c => new Date(c.updatedAt) >= yesterday && new Date(c.updatedAt) < today),
      thisWeek: conversations.filter(c => new Date(c.updatedAt) >= sevenDaysAgo && new Date(c.updatedAt) < yesterday),
      older: conversations.filter(c => new Date(c.updatedAt) < sevenDaysAgo)
    }

    return NextResponse.json({ 
      conversations: conversations.map(conv => ({
        ...conv,
        messages: conv.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt.toISOString()
        }))
      })),
      grouped,
      stats: {
        total: conversations.length,
        today: grouped.today.length,
        yesterday: grouped.yesterday.length,
        thisWeek: grouped.thisWeek.length,
        older: grouped.older.length
      }
    })

  } catch (error) {
    console.error('Error fetching organized conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}