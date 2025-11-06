import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const exportFormat = searchParams.get('format') || 'json'

    // Fetch conversation with messages
    const conversation = await (prisma as any).conversation.findUnique({
      where: { 
        id,
        userId: session.user.id // Ensure user owns the conversation
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        },
        folder: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Generate export content based on format
    let content: string
    let mimeType: string
    let filename: string

    const createdDate = format(new Date(conversation.createdAt), 'yyyy-MM-dd')
    const safeTitle = (conversation.title || 'Untitled Conversation')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)

    switch (exportFormat.toLowerCase()) {
      case 'markdown':
        content = generateMarkdownExport(conversation)
        mimeType = 'text/markdown'
        filename = `${safeTitle}_${createdDate}.md`
        break
      
      case 'txt':
      case 'text':
        content = generateTextExport(conversation)
        mimeType = 'text/plain'
        filename = `${safeTitle}_${createdDate}.txt`
        break
      
      case 'json':
      default:
        content = generateJSONExport(conversation)
        mimeType = 'application/json'
        filename = `${safeTitle}_${createdDate}.json`
        break
    }

    // Return the file content with appropriate headers
    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Error exporting conversation:', error)
    return NextResponse.json(
      { error: 'Failed to export conversation' },
      { status: 500 }
    )
  }
}

function generateMarkdownExport(conversation: any): string {
  const { title, createdAt, updatedAt, messages, model, user } = conversation
  const createdDate = format(new Date(createdAt), 'PPP')
  const updatedDate = format(new Date(updatedAt), 'PPP')

  let markdown = `# ${title || 'Untitled Conversation'}\n\n`
  markdown += `**Created:** ${createdDate}\n`
  markdown += `**Last Updated:** ${updatedDate}\n`
  markdown += `**Model:** ${model}\n`
  markdown += `**User:** ${user.name || user.email}\n`
  markdown += `**Total Messages:** ${messages.length}\n\n`
  markdown += `---\n\n`

  messages.forEach((message: any, index: number) => {
    const timestamp = format(new Date(message.createdAt), 'PPp')
    const role = message.role === 'user' ? '👤 **User**' : '🤖 **Assistant**'
    
    markdown += `## ${role}\n`
    markdown += `*${timestamp}*\n\n`
    markdown += `${message.content}\n\n`
    
    if (index < messages.length - 1) {
      markdown += `---\n\n`
    }
  })

  markdown += `\n*Exported from Chattie on ${format(new Date(), 'PPP')}*`
  
  return markdown
}

function generateTextExport(conversation: any): string {
  const { title, createdAt, updatedAt, messages, model, user } = conversation
  const createdDate = format(new Date(createdAt), 'PPP')
  const updatedDate = format(new Date(updatedAt), 'PPP')

  let text = `${title || 'Untitled Conversation'}\n`
  text += `${'='.repeat((title || 'Untitled Conversation').length)}\n\n`
  text += `Created: ${createdDate}\n`
  text += `Last Updated: ${updatedDate}\n`
  text += `Model: ${model}\n`
  text += `User: ${user.name || user.email}\n`
  text += `Total Messages: ${messages.length}\n\n`

  messages.forEach((message: any, index: number) => {
    const timestamp = format(new Date(message.createdAt), 'PPp')
    const role = message.role === 'user' ? 'USER' : 'ASSISTANT'
    
    text += `[${timestamp}] ${role}:\n`
    text += `${message.content}\n\n`
    
    if (index < messages.length - 1) {
      text += `${'-'.repeat(50)}\n\n`
    }
  })

  text += `\nExported from Chattie on ${format(new Date(), 'PPP')}`
  
  return text
}

function generateJSONExport(conversation: any): string {
  const exportData = {
    exportInfo: {
      exportedAt: new Date().toISOString(),
      exportedBy: conversation.user.name || conversation.user.email,
      version: '1.0',
      source: 'Chattie'
    },
    conversation: {
      id: conversation.id,
      title: conversation.title,
      model: conversation.model,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      folder: conversation.folder ? {
        id: conversation.folder.id,
        name: conversation.folder.name,
        color: conversation.folder.color
      } : null,
      messageCount: conversation.messages.length,
      messages: conversation.messages.map((message: any) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: message.createdAt,
        metadata: message.metadata
      }))
    }
  }

  return JSON.stringify(exportData, null, 2)
}