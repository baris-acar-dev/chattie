import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: templateId } = await params

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    await prisma.promptTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: {
          increment: 1
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating usage count:', error)
    return NextResponse.json(
      { error: 'Failed to update usage count' },
      { status: 500 }
    )
  }
}
