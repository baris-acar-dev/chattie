import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ollamaService } from '@/lib/ollama'
import { geminiService } from '@/lib/gemini'
import { openaiService } from '@/lib/openai'
import { webScraperService } from '@/lib/webscraper'
import { ragService } from '@/lib/rag'
import { preferencesService } from '@/lib/preferences'

// Helper function to extract clean response (without thinking tokens)
function extractCleanResponse(response: string): string {
  // Look for thinking pattern and extract only the final answer
  const thinkingPattern = /<thinking>[\s\S]*?<\/thinking>/gi
  const cleanResponse = response.replace(thinkingPattern, '').trim()
  
  // If the response is too short after removing thinking, return a portion of original
  if (cleanResponse.length < 20 && response.length > 50) {
    // Try to find content after thinking tags
    const afterThinkingMatch = response.match(/<\/thinking>\s*([\s\S]+)/)
    if (afterThinkingMatch && afterThinkingMatch[1].trim().length > 10) {
      return afterThinkingMatch[1].trim()
    }
    // Fallback: take the first meaningful part
    return response.substring(0, 200).replace(thinkingPattern, '').trim()
  }
  
  return cleanResponse || response
}

// Helper function to generate a conversation title from content
function generateConversationTitle(userMessage: string, aiResponse: string): string {
  // Try to extract the main topic from the user message and AI response
  const combinedText = `${userMessage} ${aiResponse}`.toLowerCase()
  
  // Remove common words and get meaningful terms
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'what', 'when', 'where', 'why', 'who', 'which', 'can', 'could', 'would', 'should', 'do', 'does', 'did', 'is', 'are', 'was', 'were', 'been', 'being', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'])
  
  const words = combinedText
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
  
  // Get the most significant words (first few from user message, avoiding too technical terms)
  const significantWords = []
  const userWords = userMessage.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
  
  // Prioritize words from user message
  for (const word of userWords.slice(0, 3)) {
    if (!stopWords.has(word)) {
      significantWords.push(word.charAt(0).toUpperCase() + word.slice(1))
    }
  }
  
  // If we don't have enough words, add from AI response
  if (significantWords.length < 2) {
    const aiWords = aiResponse.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
    
    for (const word of aiWords.slice(0, 2)) {
      if (!significantWords.includes(word.charAt(0).toUpperCase() + word.slice(1))) {
        significantWords.push(word.charAt(0).toUpperCase() + word.slice(1))
      }
    }
  }
  
  // Create title
  let title = significantWords.slice(0, 4).join(' ')
  
  // Fallback to first part of user message if no good words found
  if (!title || title.length < 3) {
    title = userMessage.substring(0, 40).replace(/[^\w\s]/g, ' ').trim()
  }
  
  // Ensure title isn't too long
  if (title.length > 50) {
    title = title.substring(0, 47) + '...'
  }
  
  return title || 'New Conversation'
}

export async function POST(request: NextRequest) {
  try {
    const { 
      message, 
      conversationId, 
      userId, 
      model = 'llama2',
      webScrapingEnabled = true,
      ragEnabled = true,
      selectedDocuments = [],
      promptTemplateId = null
    } = await request.json()

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      )
    }// Get or create conversation
    let conversation
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      })
    }

    if (!conversation) {
      // Ensure user exists, create if it doesn't
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: `${userId}@demo.local`,
          name: `Demo User ${userId}`,
        }
      })

      conversation = await prisma.conversation.create({
        data: {
          userId,
          model,
          title: 'New Conversation', // Will be updated after first AI response
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
      })
    }

    // Save user message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: message,
      }
    })    // Check if message contains URLs for web scraping (only if enabled)
    const urls = webScrapingEnabled ? webScraperService.extractUrlsFromText(message) : []
    let webContent = ''
    let scrapedUrls: string[] = []
    
    if (urls.length > 0 && webScrapingEnabled) {
      try {
        const scrapedResults = await webScraperService.scrapeMultipleUrls(urls.slice(0, 3)) // Limit to 3 URLs
        webContent = scrapedResults
          .map(result => `Content from ${result.url}:\nTitle: ${result.title}\n${result.content}`)
          .join('\n\n---\n\n')
        scrapedUrls = urls.slice(0, 3)
      } catch (error) {
        console.error('Web scraping error:', error)
      }
    }    // Search RAG knowledge base for relevant content (only if enabled)
    let ragContent = ''
    let ragSources: any[] = []
    if (ragEnabled) {
      console.log('RAG enabled - searching for:', message)
      console.log('Selected documents:', selectedDocuments)
      try {
        // Get user preferences for enhanced RAG settings
        const userPrefs = await preferencesService.getUserPreferences(userId)
        const isGeminiModel = model.startsWith('gemini')
        
        // Use enhanced search with advanced RAG features
        const ragResults = await ragService.enhancedSearch(
          message, 
          3, 
          selectedDocuments.length > 0 ? selectedDocuments : undefined,
          true, // useCorrectiveRAG
          webScrapingEnabled, // fallbackToWeb
          model,
          isGeminiModel,
          userPrefs?.geminiApiKey
        )
        
        console.log('Enhanced RAG results found:', ragResults.length)
        if (ragResults.length > 0) {
          ragContent = ragResults
            .map(result => `Knowledge Base Content from "${result.chunk.metadata.title}":\n${result.chunk.content}`)
            .join('\n\n---\n\n')
          
          ragSources = ragResults.map(result => ({
            title: result.chunk.metadata.title || 'Document',
            source: result.chunk.metadata.source,
            relevanceScore: result.relevanceScore
          }))
          console.log('Enhanced RAG content prepared, length:', ragContent.length)
        } else {
          console.log('No RAG results found for query:', message)
        }
      } catch (error) {
        console.error('RAG search error:', error)
      }
    }// Prepare context from conversation history
    const contextMessages = conversation.messages.slice(-10).map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }))    // Add current user message
    const enhancedMessage = [message, webContent, ragContent].filter(Boolean).join('\n\n---\n\n')
    contextMessages.push({
      role: 'user' as const,
      content: enhancedMessage
    })

    // Get prompt template if specified
    let promptTemplate = null
    if (promptTemplateId) {
      try {
        promptTemplate = await prisma.promptTemplate.findUnique({
          where: { id: promptTemplateId }
        })
        
        if (promptTemplate) {
          // Apply template to conversation if not already applied
          await prisma.conversationTemplate.upsert({
            where: {
              conversationId_promptTemplateId: {
                conversationId: conversation.id,
                promptTemplateId: promptTemplateId
              }
            },
            create: {
              conversationId: conversation.id,
              promptTemplateId: promptTemplateId
            },
            update: {}
          })
          
          // Increment usage count
          await prisma.promptTemplate.update({
            where: { id: promptTemplateId },
            data: {
              usageCount: {
                increment: 1
              }
            }
          })
        }
      } catch (error) {
        console.error('Error loading prompt template:', error)
      }
    }

    // Build system message based on template or default
    let systemContent = ''
    
    if (promptTemplate) {
      // Use template-based system message
      systemContent = promptTemplate.role
      
      // Add input/output format instructions if provided
      if (promptTemplate.inputFormat) {
        systemContent += `\n\nInput Format Instructions: ${promptTemplate.inputFormat}`
      }
      
      if (promptTemplate.outputFormat) {
        systemContent += `\n\nOutput Format Instructions: ${promptTemplate.outputFormat}`
      }
      
      // Add context about available capabilities
      const capabilities = []
      if (webContent) capabilities.push('web content has been provided for analysis')
      if (ragContent) capabilities.push('relevant knowledge base content has been provided for reference')
      
      if (capabilities.length > 0) {
        systemContent += `\n\nAdditional Context: In this conversation, ${capabilities.join(' and ')}.`
      }
    } else {
      // Use default system message
      systemContent = `You are Chattie, an intelligent AI assistant with access to local knowledge and the ability to analyze web content. 

Key capabilities:
- You can analyze and discuss content from websites when URLs are provided
- You have access to a knowledge base of documents and can reference relevant information
- You maintain conversation context and memory across messages
- You provide helpful, accurate, and contextual responses

Current conversation context: This is a conversation with a user who may ask questions about various topics, request web content analysis, or need help with development tasks.

${webContent ? 'Web content has been provided above for analysis and reference.' : ''}
${ragContent ? 'Relevant knowledge base content has been provided above for reference.' : ''}`
    }

    // Add system message for web scraping and RAG capabilities
    const systemMessage = {
      role: 'system' as const,
      content: systemContent + `

When referencing knowledge base content, please cite the sources appropriately. Provide helpful and accurate responses based on the conversation context, web content, and knowledge base information provided.`
    }
    
    const messages = [systemMessage, ...contextMessages]

    // Determine model provider and get user preferences
    const isGeminiModel = model.startsWith('gemini-')
    const isOpenAIModel = model.startsWith('gpt-')
    let response: string

    if (isGeminiModel) {
      // Get user preferences for Gemini API key
      const preferences = await preferencesService.getUserPreferences(userId)
      if (!preferences?.geminiApiKey) {
        throw new Error('Gemini API key not configured. Please set it in preferences.')
      }

      // Debug: Log API key info (without revealing the actual key)
      console.log('Gemini API key info:', {
        hasKey: !!preferences.geminiApiKey,
        keyLength: preferences.geminiApiKey?.length,
        firstChar: preferences.geminiApiKey?.charCodeAt(0),
        containsBullets: preferences.geminiApiKey?.includes('•')
      })

      // Check if API key is masked (contains bullet characters)
      if (preferences.geminiApiKey.includes('•')) {
        throw new Error('Invalid Gemini API key. Please re-enter your API key in preferences.')
      }

      // Configure Gemini service with user's API key
      geminiService.setApiKey(preferences.geminiApiKey)
      response = await geminiService.chat(model, messages, {
        temperature: preferences.temperature || 0.7,
        maxOutputTokens: preferences.maxTokens || 8192
      })
    } else if (isOpenAIModel) {
      // Get user preferences for OpenAI API key
      const preferences = await preferencesService.getUserPreferences(userId)
      if (!preferences?.openaiApiKey) {
        throw new Error('OpenAI API key not configured. Please set it in preferences.')
      }

      // Check if API key is masked (contains bullet characters)
      if (preferences.openaiApiKey.includes('•')) {
        throw new Error('Invalid OpenAI API key. Please re-enter your API key in preferences.')
      }

      // Configure OpenAI service with user's API key
      openaiService.setApiKey(preferences.openaiApiKey)
      response = await openaiService.chat(model, messages, {
        temperature: preferences.temperature || 0.7,
        maxTokens: preferences.maxTokens || 4096
      })
    } else {
      // Use Ollama for local models
      response = await ollamaService.chat(model, messages)
    }    // Save assistant response
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: response,
        metadata: {
          model,
          webScrapingPerformed: scrapedUrls.length > 0,
          scrapedUrls: scrapedUrls,
          ragSourcesUsed: ragSources.length > 0,
          ragSources: ragSources,
          webScrapingEnabled,
          ragEnabled,
          selectedDocuments,
          promptTemplateId: promptTemplateId,
          promptTemplateName: promptTemplate?.name,
          promptTemplateUsed: !!promptTemplate
        }
      }
    })

    // Update conversation title if this is the first assistant response
    if (!conversation.title || conversation.title === 'New Conversation' || conversation.title.length < 10) {
      const cleanResponse = extractCleanResponse(response)
      const smartTitle = generateConversationTitle(message, cleanResponse)
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { title: smartTitle }
      })
      console.log(`Updated conversation title to: "${smartTitle}"`)
      console.log(`Clean response used for title: "${cleanResponse.substring(0, 100)}..."`)
    }

    return NextResponse.json({
      message: assistantMessage,
      conversationId: conversation.id,
    })

  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
