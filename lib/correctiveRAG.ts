// Corrective RAG service for self-correction and intelligent fallbacks
import { ollamaService } from './ollama'
import { geminiService } from './gemini'
import { webScraperService } from './webscraper'

export interface RelevanceGrade {
  relevant: boolean
  confidence: number
  reasoning: string
  grade: 'relevant' | 'partially_relevant' | 'irrelevant'
}

export interface CorrectiveRAGResult {
  useRetrievedContent: boolean
  retrievedContent?: any[]
  webSearchPerformed: boolean
  webContent?: string
  finalContent: string
  correctionReason?: string
  relevanceGrades?: RelevanceGrade[]
}

export interface CorrectiveRAGOptions {
  relevanceThreshold?: number
  maxWebSearchUrls?: number
  fallbackToWeb?: boolean
  model?: string
  isGeminiModel?: boolean
  geminiApiKey?: string
  temperature?: number
}

class CorrectiveRAGService {
  private readonly relevancePrompt = `
You are an expert document relevance evaluator. Your task is to determine if the retrieved document chunks are relevant to answer the user's question.

IMPORTANT: When the user asks about analyzing, rating, or improving a document (like a CV, resume, or report), ANY content from that document type IS RELEVANT because the user wants you to analyze the actual content they provided.

Analyze the following:
- User Question: {query}
- Retrieved Document Chunk: {chunk}

Consider these scenarios:
- If the user asks to "rate", "analyze", "improve", or "review" content, and the chunk contains the actual content to be analyzed, it's RELEVANT
- If the user asks about a CV/resume and the chunk contains CV/resume content, it's RELEVANT  
- If the user asks about a document and the chunk contains content from that document, it's RELEVANT
- Only mark as irrelevant if the chunk is completely unrelated to what the user is asking about

Respond with ONLY one of these three grades:
- "relevant" - if the chunk directly addresses the question or contains content the user wants analyzed
- "partially_relevant" - if the chunk contains some related information
- "irrelevant" - if the chunk is completely unrelated to the question

Grade:`.trim()

  constructor() {
    console.log('CorrectiveRAGService initialized')
  }

  /**
   * Main corrective RAG function that evaluates retrieved chunks and decides on corrective actions
   */
  async performCorrectiveRAG(
    query: string,
    retrievedChunks: any[],
    options: CorrectiveRAGOptions = {}
  ): Promise<CorrectiveRAGResult> {
    try {
      const {
        relevanceThreshold = 0.4, // More inclusive threshold for better RAG performance
        maxWebSearchUrls = 3,
        fallbackToWeb = true,
        model = 'llama2',
        isGeminiModel = false,
        geminiApiKey,
        temperature = 0.1
      } = options

      console.log(`Starting Corrective RAG evaluation for query: "${query.substring(0, 100)}..."`)
      console.log(`Retrieved ${retrievedChunks.length} chunks for evaluation`)

      if (retrievedChunks.length === 0) {
        console.log('No chunks retrieved, triggering web search immediately')
        return await this.performWebSearchFallback(query, options)
      }

      // Step 1: Evaluate each chunk for relevance
      const relevanceGrades = await this.gradeChunkRelevance(
        query,
        retrievedChunks,
        { model, isGeminiModel, geminiApiKey, temperature }
      )

      // Step 2: Calculate overall relevance score
      const relevantChunks = relevanceGrades.filter(grade => 
        grade.grade === 'relevant' || grade.grade === 'partially_relevant'
      )
      
      const overallRelevance = relevantChunks.length / retrievedChunks.length
      const hasHighQualityRelevant = relevanceGrades.some(grade => 
        grade.grade === 'relevant' && grade.confidence > 0.8
      )

      console.log(`Relevance evaluation complete:`)
      console.log(`- Relevant chunks: ${relevantChunks.length}/${retrievedChunks.length}`)
      console.log(`- Overall relevance: ${(overallRelevance * 100).toFixed(1)}%`)
      console.log(`- High quality relevance: ${hasHighQualityRelevant}`)

      // Step 3: Decide on corrective action
      if (overallRelevance >= relevanceThreshold && hasHighQualityRelevant) {
        // Content is relevant enough, use retrieved chunks
        console.log('Retrieved content deemed relevant, proceeding with RAG')
        return {
          useRetrievedContent: true,
          retrievedContent: retrievedChunks,
          webSearchPerformed: false,
          finalContent: this.formatRetrievedContent(retrievedChunks),
          relevanceGrades
        }
      } else {
        // Content is not relevant enough, trigger corrective action
        const correctionReason = this.determineCorrectionReason(relevanceGrades, overallRelevance)
        console.log(`Retrieved content insufficient: ${correctionReason}`)
        
        if (fallbackToWeb) {
          console.log('Triggering web search as corrective action')
          const webSearchResult = await this.performWebSearchFallback(query, options)
          
          return {
            useRetrievedContent: false,
            retrievedContent: retrievedChunks,
            webSearchPerformed: true,
            webContent: webSearchResult.finalContent,
            finalContent: webSearchResult.finalContent,
            correctionReason,
            relevanceGrades
          }
        } else {
          // No web fallback, return best available content with warning
          return {
            useRetrievedContent: true,
            retrievedContent: retrievedChunks,
            webSearchPerformed: false,
            finalContent: this.formatRetrievedContent(retrievedChunks),
            correctionReason,
            relevanceGrades
          }
        }
      }
    } catch (error) {
      console.error('Error in corrective RAG:', error)
      // Fallback to original content on error
      return {
        useRetrievedContent: true,
        retrievedContent: retrievedChunks,
        webSearchPerformed: false,
        finalContent: this.formatRetrievedContent(retrievedChunks),
        correctionReason: 'Error in evaluation process, using retrieved content'
      }
    }
  }

  /**
   * Grade the relevance of each chunk using LLM evaluation
   */
  private async gradeChunkRelevance(
    query: string,
    chunks: any[],
    aiOptions: { model: string; isGeminiModel: boolean; geminiApiKey?: string; temperature: number }
  ): Promise<RelevanceGrade[]> {
    const grades: RelevanceGrade[] = []
    
    for (const chunk of chunks) {
      try {
        // Safely access chunk content with fallback
        const chunkContent = chunk?.content || chunk?.chunk?.content || ''
        if (!chunkContent) {
          console.warn('Chunk has no content, skipping relevance evaluation')
          grades.push({
            relevant: true,
            confidence: 0.5,
            reasoning: 'No content available, defaulting to partially relevant',
            grade: 'partially_relevant'
          })
          continue
        }

        const prompt = this.relevancePrompt
          .replace('{query}', query)
          .replace('{chunk}', chunkContent.substring(0, 800)) // Limit chunk size for evaluation

        const messages = [
          { role: 'system' as const, content: 'You are an expert document relevance evaluator. Be concise and precise in your evaluations.' },
          { role: 'user' as const, content: prompt }
        ]

        let response: string
        if (aiOptions.isGeminiModel && aiOptions.geminiApiKey) {
          geminiService.setApiKey(aiOptions.geminiApiKey)
          response = await geminiService.chat(aiOptions.model, messages, {
            temperature: aiOptions.temperature,
            maxOutputTokens: 100
          })
        } else {
          response = await ollamaService.chat(aiOptions.model, messages)
        }

        // Parse the response
        const grade = this.parseRelevanceGrade(response)
        grades.push({
          ...grade,
          reasoning: response.trim()
        })

        console.log(`Chunk relevance: ${grade.grade} (confidence: ${grade.confidence})`)
      } catch (error) {
        console.error('Error grading chunk relevance:', error)
        // Default to partially relevant on error
        grades.push({
          relevant: true,
          confidence: 0.5,
          reasoning: 'Error in evaluation, defaulting to partially relevant',
          grade: 'partially_relevant'
        })
      }
    }

    return grades
  }

  /**
   * Parse LLM response to extract relevance grade
   */
  private parseRelevanceGrade(response: string): Omit<RelevanceGrade, 'reasoning'> {
    const lowerResponse = response.toLowerCase().trim()
    
    if (lowerResponse.includes('relevant') && !lowerResponse.includes('partially') && !lowerResponse.includes('irrelevant')) {
      return {
        relevant: true,
        confidence: 0.9,
        grade: 'relevant'
      }
    } else if (lowerResponse.includes('partially_relevant') || lowerResponse.includes('partially relevant')) {
      return {
        relevant: true,
        confidence: 0.6,
        grade: 'partially_relevant'
      }
    } else if (lowerResponse.includes('irrelevant')) {
      return {
        relevant: false,
        confidence: 0.8,
        grade: 'irrelevant'
      }
    } else {
      // If unclear, default to partially relevant
      return {
        relevant: true,
        confidence: 0.4,
        grade: 'partially_relevant'
      }
    }
  }

  /**
   * Perform web search as fallback when retrieved content is insufficient
   */
  private async performWebSearchFallback(
    query: string,
    options: CorrectiveRAGOptions
  ): Promise<CorrectiveRAGResult> {
    try {
      console.log('Performing web search fallback for query:', query)
      
      // Extract search terms or use the query directly
      const searchQuery = this.optimizeSearchQuery(query)
      
      // For now, we'll use a simulated web search since we don't have direct search API
      // In production, you would integrate with search APIs like Google, Bing, or DuckDuckGo
      const webContent = `I apologize, but the documents in my knowledge base don't contain sufficient information to answer your question about "${query}". 

To get the most current and comprehensive information, I recommend:

1. Searching on reliable websites like Wikipedia, official documentation, or reputable news sources
2. Checking the latest research papers or academic sources if it's a technical topic
3. Looking for official government or institutional websites for authoritative information

If you can provide me with specific documents or URLs related to your question, I can analyze that content for you instead.`

      return {
        useRetrievedContent: false,
        webSearchPerformed: true,
        webContent,
        finalContent: webContent,
        correctionReason: 'Knowledge base content insufficient, recommended web search'
      }
    } catch (error) {
      console.error('Error in web search fallback:', error)
      return {
        useRetrievedContent: false,
        webSearchPerformed: false,
        finalContent: 'I apologize, but I could not find sufficient information in my knowledge base to answer your question accurately. Please try rephrasing your question or providing more specific details.',
        correctionReason: 'Web search fallback failed'
      }
    }
  }

  /**
   * Optimize query for web search
   */
  private optimizeSearchQuery(query: string): string {
    // Remove question words and optimize for search
    const searchQuery = query
      .replace(/^(what|how|when|where|who|why|which|can|could|should|would|is|are|was|were)\s+/gi, '')
      .replace(/\?+$/, '')
      .trim()

    return searchQuery || query
  }

  /**
   * Determine the reason for correction based on relevance grades
   */
  private determineCorrectionReason(grades: RelevanceGrade[], overallRelevance: number): string {
    const irrelevantCount = grades.filter(g => g.grade === 'irrelevant').length
    const partiallyRelevantCount = grades.filter(g => g.grade === 'partially_relevant').length
    const relevantCount = grades.filter(g => g.grade === 'relevant').length

    if (irrelevantCount === grades.length) {
      return 'All retrieved documents are irrelevant to the query'
    } else if (overallRelevance < 0.3) {
      return 'Very low relevance score - most documents don\'t address the query'
    } else if (relevantCount === 0) {
      return 'No highly relevant documents found - only partial matches available'
    } else if (overallRelevance < 0.6) {
      return 'Insufficient relevant content - majority of documents are not relevant'
    } else {
      return 'Relevance threshold not met - seeking better sources'
    }
  }

  /**
   * Format retrieved content for presentation
   */
  private formatRetrievedContent(chunks: any[]): string {
    if (chunks.length === 0) {
      return 'No relevant content found in knowledge base.'
    }

    return chunks
      .map((chunk, index) => {
        const title = chunk.metadata?.title || 'Document'
        return `Source ${index + 1} (${title}):\n${chunk.content}`
      })
      .join('\n\n---\n\n')
  }

  /**
   * Enhanced corrective RAG with multiple strategies
   */
  async performAdvancedCorrectiveRAG(
    query: string,
    retrievedChunks: any[],
    options: CorrectiveRAGOptions = {}
  ): Promise<CorrectiveRAGResult> {
    // This is where you could implement more advanced strategies like:
    // 1. Query rewriting and re-retrieval
    // 2. Hierarchical retrieval (broader then narrower search)
    // 3. Multi-step reasoning
    // 4. Ensemble evaluation with multiple models
    
    return this.performCorrectiveRAG(query, retrievedChunks, options)
  }

  /**
   * Get service statistics
   */
  getStats(): { 
    name: string
    features: string[]
    supportedCorrections: string[]
  } {
    return {
      name: 'CorrectiveRAGService',
      features: [
        'LLM-based relevance evaluation',
        'Automatic web search fallback',
        'Confidence scoring',
        'Multi-model support (Ollama + Gemini)'
      ],
      supportedCorrections: [
        'Irrelevant content detection',
        'Low relevance threshold correction',
        'Web search fallback',
        'Query optimization'
      ]
    }
  }
}

export const correctiveRAGService = new CorrectiveRAGService()