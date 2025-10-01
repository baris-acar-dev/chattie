import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to extract clean response text
function extractCleanResponse(aiResponse: string): string {
  // Remove markdown formatting, code blocks, and clean up the response
  let cleanText = aiResponse
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`[^`]*`/g, '')
    // Remove markdown headers
    .replace(/^#+\s+/gm, '')
    // Remove markdown bold/italic
    .replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1')
    // Remove markdown links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove extra whitespace and newlines
    .replace(/\s+/g, ' ')
    .trim()

  // Take first meaningful sentence or two
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 10)
  if (sentences.length > 0) {
    return sentences.slice(0, 2).join('. ').trim()
  }
  
  return cleanText.substring(0, 200).trim()
}

// Enhanced title generation function
function generateConversationTitle(userMessage: string, aiResponse: string): string {
  const cleanResponse = extractCleanResponse(aiResponse)
  
  // Enhanced title generation with better context understanding
  const userMsg = userMessage.toLowerCase().trim()
  const aiMsg = cleanResponse.toLowerCase().trim()
  
  // Pattern-based title generation for common use cases
  const patterns = [
    // Question patterns
    { pattern: /^(how to|how do i|how can i)\s+(.+)/i, template: (match: RegExpMatchArray) => `How to ${match[2].substring(0, 30)}` },
    { pattern: /^(what is|what are|what's)\s+(.+)/i, template: (match: RegExpMatchArray) => `About ${match[2].substring(0, 35)}` },
    { pattern: /^(why does|why do|why is|why are)\s+(.+)/i, template: (match: RegExpMatchArray) => `Why ${match[2].substring(0, 35)}` },
    { pattern: /^(when to|when do|when is)\s+(.+)/i, template: (match: RegExpMatchArray) => `When ${match[2].substring(0, 35)}` },
    { pattern: /^(where to|where do|where is)\s+(.+)/i, template: (match: RegExpMatchArray) => `Where ${match[2].substring(0, 35)}` },
    
    // Task patterns
    { pattern: /^(create|make|build|generate|write)\s+(.+)/i, template: (match: RegExpMatchArray) => `Create ${match[2].substring(0, 35)}` },
    { pattern: /^(explain|describe|tell me about)\s+(.+)/i, template: (match: RegExpMatchArray) => `Explain ${match[2].substring(0, 35)}` },
    { pattern: /^(help me|help with|assist with)\s+(.+)/i, template: (match: RegExpMatchArray) => `Help with ${match[2].substring(0, 30)}` },
    { pattern: /^(show me|give me|provide)\s+(.+)/i, template: (match: RegExpMatchArray) => `Show ${match[2].substring(0, 35)}` },
    
    // Technical patterns
    { pattern: /^(debug|fix|solve|troubleshoot)\s+(.+)/i, template: (match: RegExpMatchArray) => `Fix ${match[2].substring(0, 35)}` },
    { pattern: /^(code|program|script|function)\s+(.+)/i, template: (match: RegExpMatchArray) => `Code ${match[2].substring(0, 35)}` },
    { pattern: /^(analyze|review|check)\s+(.+)/i, template: (match: RegExpMatchArray) => `Analyze ${match[2].substring(0, 30)}` },
  ]
  
  // Try pattern matching first
  for (const { pattern, template } of patterns) {
    const match = userMessage.match(pattern)
    if (match) {
      const title = template(match).replace(/[^\w\s-]/g, '').trim()
      if (title.length > 3) {
        return title.length > 45 ? title.substring(0, 42) + '...' : title
      }
    }
  }
  
  // Enhanced keyword extraction with context awareness
  const technicalTerms = new Set(['api', 'database', 'frontend', 'backend', 'react', 'javascript', 'python', 'node', 'server', 'client', 'html', 'css', 'sql', 'json', 'xml', 'rest', 'graphql', 'docker', 'kubernetes', 'aws', 'azure', 'git', 'github', 'npm', 'yarn', 'webpack', 'typescript', 'angular', 'vue', 'mongodb', 'postgresql', 'mysql', 'redis', 'nginx', 'apache', 'linux', 'windows', 'mac', 'ios', 'android', 'mobile', 'web', 'app', 'application', 'framework', 'library', 'component', 'function', 'method', 'class', 'object', 'array', 'string', 'number', 'boolean', 'variable', 'constant', 'algorithm', 'data', 'structure', 'authentication', 'authorization', 'security', 'encryption', 'performance', 'optimization', 'testing', 'deployment', 'ci/cd', 'devops'])
  
  const importantWords = new Set(['tutorial', 'guide', 'example', 'problem', 'solution', 'error', 'issue', 'bug', 'feature', 'improvement', 'optimization', 'configuration', 'setup', 'installation', 'implementation', 'integration', 'migration', 'update', 'upgrade', 'comparison', 'difference', 'best', 'practice', 'pattern', 'design', 'architecture', 'workflow', 'process', 'strategy', 'approach', 'method', 'technique', 'tool', 'service', 'platform', 'system', 'network', 'protocol', 'standard', 'specification', 'documentation', 'manual', 'reference', 'cheatsheet'])
  
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'])
  
  // Extract meaningful words with priority scoring
  const extractKeywords = (text: string) => {
    return text
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word.toLowerCase()))
      .map(word => ({
        word: word,
        score: 
          (technicalTerms.has(word.toLowerCase()) ? 3 : 0) +
          (importantWords.has(word.toLowerCase()) ? 2 : 0) +
          (word.length > 5 ? 1 : 0) +
          (/^[A-Z]/.test(word) ? 1 : 0)
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.word)
  }
  
  // Get keywords from user message (prioritized) and AI response
  const userKeywords = extractKeywords(userMessage).slice(0, 3)
  const aiKeywords = extractKeywords(cleanResponse).slice(0, 2)
  
  // Combine keywords intelligently
  const allKeywords = [...userKeywords]
  for (const keyword of aiKeywords) {
    if (!allKeywords.some(k => k.toLowerCase() === keyword.toLowerCase()) && allKeywords.length < 4) {
      allKeywords.push(keyword)
    }
  }
  
  // Create title from keywords
  let title = allKeywords
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .slice(0, 4)
    .join(' ')
  
  // Fallback: extract first meaningful sentence or phrase from user message
  if (!title || title.length < 5) {
    // Try to get the main subject/object from the sentence
    const cleanUser = userMessage.replace(/^(please|can you|could you|would you|help me|i need|i want|i'm trying to)\s+/i, '')
    const words = cleanUser.split(/\s+/).slice(0, 6)
    title = words.join(' ')
  }
  
  // Final cleanup and length check
  title = title.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim()
  
  if (title.length > 45) {
    title = title.substring(0, 42) + '...'
  }
  
  return title || 'New Conversation'
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    // Get the conversation with its messages
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: id,
        userId: session.user.id
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 4 // Get first few messages for title generation
        }
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    if (conversation.messages.length < 2) {
      return NextResponse.json(
        { error: 'Not enough messages to generate title' },
        { status: 400 }
      )
    }

    // Get first user message and first AI response
    const userMessage = conversation.messages.find(m => m.role === 'user')
    const aiMessage = conversation.messages.find(m => m.role === 'assistant')

    if (!userMessage || !aiMessage) {
      return NextResponse.json(
        { error: 'Cannot find user and AI messages' },
        { status: 400 }
      )
    }

    // Generate new title
    const newTitle = generateConversationTitle(userMessage.content, aiMessage.content)

    // Update conversation title
    const updatedConversation = await prisma.conversation.update({
      where: { id: id },
      data: { title: newTitle }
    })

    return NextResponse.json({
      success: true,
      oldTitle: conversation.title,
      newTitle: newTitle
    })

  } catch (error) {
    console.error('Error regenerating conversation title:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate title' },
      { status: 500 }
    )
  }
}