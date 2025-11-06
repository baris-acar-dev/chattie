import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format as formatDate } from 'date-fns'
import JSZip from 'jszip'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { conversationIds, exportFormat = 'markdown' } = await request.json()

    if (!conversationIds || !Array.isArray(conversationIds) || conversationIds.length === 0) {
      return NextResponse.json({ error: 'No conversations selected' }, { status: 400 })
    }

    // Fetch all selected conversations
    const conversations = await (prisma as any).conversation.findMany({
      where: { 
        id: { in: conversationIds },
        userId: session.user.id // Ensure user owns the conversations
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

    if (conversations.length === 0) {
      return NextResponse.json({ error: 'No conversations found' }, { status: 404 })
    }

    // If only one conversation, return single file
    if (conversations.length === 1) {
      const conversation = conversations[0]
      let content: string
      let mimeType: string
      let filename: string

      const createdDate = formatDate(new Date(conversation.createdAt), 'yyyy-MM-dd')
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

      return new NextResponse(content, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache',
        },
      })
    }

    // Multiple conversations - create a ZIP file
    const zip = new JSZip()
    const exportDate = formatDate(new Date(), 'yyyy-MM-dd')

    conversations.forEach((conversation: any, index: number) => {
      const createdDate = formatDate(new Date(conversation.createdAt), 'yyyy-MM-dd')
      const safeTitle = (conversation.title || `Conversation_${index + 1}`)
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50)

      let content: string
      let extension: string

      switch (exportFormat.toLowerCase()) {
        case 'markdown':
          content = generateMarkdownExport(conversation)
          extension = 'md'
          break
        
        case 'txt':
        case 'text':
          content = generateTextExport(conversation)
          extension = 'txt'
          break
        
        case 'json':
        default:
          content = generateJSONExport(conversation)
          extension = 'json'
          break
      }

      zip.file(`${safeTitle}_${createdDate}.${extension}`, content)
    })

    // Add summary file
    const summary = generateSummaryFile(conversations, exportFormat)
    zip.file(`_EXPORT_SUMMARY_${exportDate}.txt`, summary)

    // Generate ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    const zipBuffer = await zipBlob.arrayBuffer()

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="conversations_export_${exportDate}.zip"`,
        'Cache-Control': 'no-cache',
      },
    })

  } catch (error) {
    console.error('Error bulk exporting conversations:', error)
    return NextResponse.json(
      { error: 'Failed to export conversations' },
      { status: 500 }
    )
  }
}

function generateSummaryFile(conversations: any[], format: string): string {
  const exportDate = formatDate(new Date(), 'PPP')
  const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0)
  
  let summary = `Chattie Conversations Export Summary\n`
  summary += `=====================================\n\n`
  summary += `Export Date: ${exportDate}\n`
  summary += `Export Format: ${format.toUpperCase()}\n`
  summary += `Total Conversations: ${conversations.length}\n`
  summary += `Total Messages: ${totalMessages}\n\n`
  summary += `Conversations Included:\n`
  summary += `-----------------------\n`

  conversations.forEach((conversation, index) => {
    const createdDate = formatDate(new Date(conversation.createdAt), 'PPP')
    summary += `${index + 1}. ${conversation.title || 'Untitled Conversation'}\n`
    summary += `   Created: ${createdDate}\n`
    summary += `   Model: ${conversation.model}\n`
    summary += `   Messages: ${conversation.messages.length}\n`
    if (conversation.folder) {
      summary += `   Folder: ${conversation.folder.name}\n`
    }
    summary += `\n`
  })

  summary += `\nGenerated by Chattie - Your AI Assistant`
  
  return summary
}

function generateMarkdownExport(conversation: any): string {
  const { title, createdAt, updatedAt, messages, model, user } = conversation
  const createdDate = formatDate(new Date(createdAt), 'PPP')
  const updatedDate = formatDate(new Date(updatedAt), 'PPP')

  let markdown = `# ${title || 'Untitled Conversation'}\n\n`
  markdown += `**Created:** ${createdDate}\n`
  markdown += `**Last Updated:** ${updatedDate}\n`
  markdown += `**Model:** ${model}\n`
  markdown += `**User:** ${user.name || user.email}\n`
  markdown += `**Total Messages:** ${messages.length}\n\n`
  markdown += `---\n\n`

  messages.forEach((message: any, index: number) => {
    const timestamp = formatDate(new Date(message.createdAt), 'PPp')
    const role = message.role === 'user' ? '👤 **User**' : '🤖 **Assistant**'
    
    markdown += `## ${role}\n`
    markdown += `*${timestamp}*\n\n`
    markdown += `${message.content}\n\n`
    
    if (index < messages.length - 1) {
      markdown += `---\n\n`
    }
  })

  markdown += `\n*Exported from Chattie on ${formatDate(new Date(), 'PPP')}*`
  
  return markdown
}

function generateTextExport(conversation: any): string {
  const { title, createdAt, updatedAt, messages, model, user } = conversation
  const createdDate = formatDate(new Date(createdAt), 'PPP')
  const updatedDate = formatDate(new Date(updatedAt), 'PPP')

  let text = `${title || 'Untitled Conversation'}\n`
  text += `${'='.repeat((title || 'Untitled Conversation').length)}\n\n`
  text += `Created: ${createdDate}\n`
  text += `Last Updated: ${updatedDate}\n`
  text += `Model: ${model}\n`
  text += `User: ${user.name || user.email}\n`
  text += `Total Messages: ${messages.length}\n\n`

  messages.forEach((message: any, index: number) => {
    const timestamp = formatDate(new Date(message.createdAt), 'PPp')
    const role = message.role === 'user' ? 'USER' : 'ASSISTANT'
    
    text += `[${timestamp}] ${role}:\n`
    text += `${message.content}\n\n`
    
    if (index < messages.length - 1) {
      text += `${'-'.repeat(50)}\n\n`
    }
  })

  text += `\nExported from Chattie on ${formatDate(new Date(), 'PPP')}`
  
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