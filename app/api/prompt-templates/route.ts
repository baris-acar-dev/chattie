import { NextRequest, NextResponse } from 'next/server'
import PromptTemplateService from '@/lib/promptTemplates'
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

    // First, try to initialize default templates for this user
    await PromptTemplateService.initializeDefaultTemplates(userId)
    
    // Then get all templates for the user (including defaults)
    const templates = await PromptTemplateService.getTemplatesForUser(userId)

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching prompt templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompt templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      name,
      description,
      role,
      inputFormat,
      outputFormat,
      examples,
      tags,
      isPublic,
      temperature,
      maxTokens
    } = body

    if (!userId || !name || !role) {
      return NextResponse.json(
        { error: 'User ID, name, and role are required' },
        { status: 400 }
      )
    }

    const template = await prisma.promptTemplate.create({
      data: {
        userId,
        name,
        description,
        role,
        inputFormat,
        outputFormat,
        examples,
        tags: tags || [],
        isPublic: isPublic || false,
        temperature,
        maxTokens
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error creating prompt template:', error)
    return NextResponse.json(
      { error: 'Failed to create prompt template' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      userId,
      name,
      description,
      role,
      inputFormat,
      outputFormat,
      examples,
      tags,
      isPublic,
      isActive,
      temperature,
      maxTokens
    } = body

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Template ID and User ID are required' },
        { status: 400 }
      )
    }

    // Verify ownership (unless it's a default template being updated by admin)
    const existingTemplate = await prisma.promptTemplate.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found or access denied' },
        { status: 404 }
      )
    }

    const template = await prisma.promptTemplate.update({
      where: { id },
      data: {
        name,
        description,
        role,
        inputFormat,
        outputFormat,
        examples,
        tags,
        isPublic,
        isActive,
        temperature,
        maxTokens
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating prompt template:', error)
    return NextResponse.json(
      { error: 'Failed to update prompt template' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const userId = searchParams.get('userId')

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Template ID and User ID are required' },
        { status: 400 }
      )
    }

    // Verify ownership (can't delete default templates)
    const existingTemplate = await prisma.promptTemplate.findFirst({
      where: {
        id,
        userId,
        isDefault: false
      }
    })

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found, access denied, or cannot delete default template' },
        { status: 404 }
      )
    }

    await prisma.promptTemplate.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting prompt template:', error)
    return NextResponse.json(
      { error: 'Failed to delete prompt template' },
      { status: 500 }
    )
  }
}
