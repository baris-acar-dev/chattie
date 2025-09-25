import { prisma } from './prisma'
import { createHash } from 'crypto'
import { crossEncoderService, ReRankingResult } from './crossEncoder'
import { correctiveRAGService, CorrectiveRAGResult } from './correctiveRAG'
// import { structuredDataExtractionService } from './structuredDataExtraction'

// Interface for document chunks
export interface DocumentChunk {
  id: string
  documentId: string
  content: string
  metadata: {
    title?: string
    source?: string
    page?: number
    section?: string
    [key: string]: any
  }
  embedding?: number[]
  createdAt: Date
  updatedAt: Date
}

// Interface for RAG search results (legacy)
export interface RAGSearchResult {
  chunk: DocumentChunk
  similarity: number
  relevanceScore: number
}

// Interface for enhanced RAG search results
export interface EnhancedRAGSearchResult {
  chunk: DocumentChunk
  similarity: number
  relevanceScore: number
  reRankingScore?: number
  crossEncoderScore?: number
  relevanceGrade?: string
}

// Interface for enhanced RAG response with corrective capabilities
export interface EnhancedRAGResponse {
  answer: string
  sources: Array<{
    title: string
    content: string
    source?: string
    page?: number
    relevanceScore?: number
    reRanked?: boolean
  }>
  confidence: number
  correctionPerformed?: boolean
  webSearchTriggered?: boolean
  structuredDataUsed?: boolean
}

// Interface for RAG options
export interface RAGOptions {
  useReRanking?: boolean
  useCorrectiveRAG?: boolean
  useStructuredQuery?: boolean
  model?: string
  isGeminiModel?: boolean
  geminiApiKey?: string
  maxResults?: number
  relevanceThreshold?: number
}

// Interface for RAG response
export interface RAGResponse {
  answer: string
  sources: Array<{
    title: string
    content: string
    source?: string
    page?: number
  }>
  confidence: number
}

class RAGService {
  private readonly CHUNK_SIZE = 1000
  private readonly CHUNK_OVERLAP = 200
  private readonly MAX_SEARCH_RESULTS = 5

  /**
   * Add a document to the knowledge base with structured data extraction
   */
  async addDocument(
    title: string,
    content: string,
    source: string,
    metadata: Record<string, any> = {},
    options: { extractStructuredData?: boolean; model?: string; isGeminiModel?: boolean; geminiApiKey?: string } = {}
  ): Promise<string> {
    try {
      // Create document hash for deduplication
      const contentHash = createHash('sha256').update(content).digest('hex')

      // Check if document already exists
      const existingDoc = await prisma.document.findUnique({
        where: { contentHash }
      })

      if (existingDoc) {
        return existingDoc.id
      }

      // Extract structured data if requested
      let structuredData = null
      let documentType = metadata.fileType || 'unknown'
      
      if (options.extractStructuredData) {
        console.log('Extracting structured data from document...')
        try {
          // Simple structured data extraction
          structuredData = {
            metadata: {
              documentType: documentType,
              extractedAt: new Date().toISOString(),
              model: options.model || 'basic'
            },
            entities: {
              people: [],
              organizations: [],
              locations: [],
              dates: [],
              numbers: []
            }
          }
          console.log(`Structured data extraction complete. Type: ${documentType}`)
        } catch (error) {
          console.warn('Structured data extraction failed:', error)
        }
      }

      // Create document with enhanced metadata
      const document = await prisma.document.create({
        data: {
          title,
          content,
          source,
          contentHash,
          metadata,
          structuredData: structuredData ? structuredData as any : undefined,
          documentType,
          extractionModel: options.model || null
        }
      })

      // Split content into chunks with enhanced metadata
      const chunks = this.splitIntoChunks(content, title, source, {
        ...metadata,
        documentType,
        hasStructuredData: !!structuredData
      })

      // Save chunks to database with potential structured data
      for (const chunk of chunks) {
        await prisma.documentChunk.create({
          data: {
            documentId: document.id,
            content: chunk.content,
            metadata: chunk.metadata,
            structuredData: this.extractChunkStructuredData(chunk.content, structuredData) as any || undefined,
            // Note: In a production system, you'd generate embeddings here
            // embedding: await this.generateEmbedding(chunk.content)
          }
        })
      }

      console.log(`Document added: ${title} (${chunks.length} chunks, structured data: ${!!structuredData})`)
      return document.id
    } catch (error) {
      console.error('Error adding document to RAG:', error)
      throw new Error('Failed to add document to knowledge base')
    }
  }

  /**
   * Extract chunk-level structured data from full document structured data
   */
  private extractChunkStructuredData(chunkContent: string, documentStructuredData: any): any {
    if (!documentStructuredData) return null
    
    // Extract relevant entities that appear in this chunk
    const chunkEntities = {
      people: [],
      organizations: [],
      locations: [],
      dates: [],
      numbers: [],
      currencies: [],
      percentages: []
    }
    
    const chunkLower = chunkContent.toLowerCase()
    
    // Check which document-level entities appear in this chunk
    if (documentStructuredData.entities) {
      Object.keys(chunkEntities).forEach(entityType => {
        if (documentStructuredData.entities[entityType]) {
          chunkEntities[entityType as keyof typeof chunkEntities] = documentStructuredData.entities[entityType].filter(
            (entity: string) => chunkLower.includes(entity.toLowerCase())
          )
        }
      })
    }
    
    return {
      entities: chunkEntities,
      hasStructuredData: true,
      extractedFrom: 'document_level'
    }
  }

  /**
   * Extract important keywords from a query for better search matching
   */
  private extractKeywords(query: string): string[] {
    // Remove common stop words and extract meaningful terms
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'what', 'which', 'who', 'where', 'when', 'why', 'how', 'is', 'are', 'was', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ])

    const words = query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
    
    return Array.from(new Set(words)).slice(0, 15) // Remove duplicates and limit
  }

  /**
   * Search for relevant content in the knowledge base
   */async search(query: string, limit: number = this.MAX_SEARCH_RESULTS, documentIds?: string[]): Promise<RAGSearchResult[]> {
    try {
      console.log('RAG Search - Query:', query)
      console.log('RAG Search - Document IDs filter:', documentIds)

      // Extract keywords from the query for better matching
      const keywords = this.extractKeywords(query)
      console.log('RAG Search - Extracted keywords:', keywords)

      // Build base where clause
      let whereClause: any = {}

      // Add document filtering if specific documents are selected
      if (documentIds && documentIds.length > 0) {
        whereClause.documentId = {
          in: documentIds
        }
      }

      // Enhanced search with multiple strategies
      const searchStrategies = [
        // Strategy 1: Direct phrase matching
        {
          content: {
            contains: query,
            mode: 'insensitive'
          }
        },
        // Strategy 2: Keyword matching (OR condition)
        ...keywords.map(keyword => ({
          content: {
            contains: keyword,
            mode: 'insensitive'
          }
        }))
      ]

      // Execute searches with different strategies
      const allChunks = []
      for (const strategy of searchStrategies) {
        const strategyWhere = { ...whereClause, ...strategy }
        const chunks = await prisma.documentChunk.findMany({
          where: strategyWhere,
          take: limit * 3, // Get more results for better filtering
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            document: true
          }
        })
        allChunks.push(...chunks)
      }      // Remove duplicates
      const uniqueChunks = allChunks.filter((chunk, index, self) =>
        index === self.findIndex(c => c.id === chunk.id)
      )

      console.log('RAG Search - Found chunks:', uniqueChunks.length)

      // Calculate relevance scores with enhanced scoring
      const results: RAGSearchResult[] = uniqueChunks.map((chunk: any) => {
        const similarity = this.calculateTextSimilarity(query, chunk.content)
        let relevanceScore = similarity * 100
        
        // Safely access metadata properties
        const metadata = chunk.metadata as any
        
        // General boost for document analysis queries
        const isDocumentAnalysisQuery = query.toLowerCase().match(/(analyze|analysis|review|rate|rating|improve|evaluate|assess|check)/i)
        if (isDocumentAnalysisQuery && chunk.content.length > 100) {
          relevanceScore *= 1.3 // Boost for any document analysis tasks
        }
        
        // Boost PDF content scores slightly as they tend to be more structured
        if (metadata?.type && typeof metadata.type === 'string' && metadata.type.includes('pdf_chunk')) {
          relevanceScore *= 1.1
        }
        
        // Boost scores for chunks with higher word counts (more context)
        if (metadata?.wordCount && typeof metadata.wordCount === 'number' && metadata.wordCount > 50) {
          relevanceScore *= 1.05
        }

        // Additional scoring for keyword matches
        const keywordMatches = keywords.filter((keyword: string) =>
          chunk.content.toLowerCase().includes(keyword.toLowerCase())
        ).length
        if (keywordMatches > 0) {
          relevanceScore *= (1 + keywordMatches * 0.1) // Boost by 10% per keyword match
        }

        return {
          chunk: {
            id: chunk.id,
            documentId: chunk.documentId,
            content: chunk.content,
            metadata: {
              ...metadata,
              title: chunk.document.title,
              source: chunk.document.source,
            },
            createdAt: chunk.createdAt,
            updatedAt: chunk.updatedAt,          },
          similarity,
          relevanceScore: Math.min(relevanceScore, 100) // Cap at 100%
        }
      })

      // Sort by relevance and return top results
      const finalResults = results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit)

      console.log('RAG Search - Top results relevance scores:', 
        finalResults.map(r => ({ title: r.chunk.metadata.title, score: r.relevanceScore.toFixed(1) }))
      )

      return finalResults
    } catch (error) {
      console.error('Error searching RAG knowledge base:', error)
      return []
    }
  }

  /**
   * Enhanced search with Cross-Encoder re-ranking and Corrective RAG
   */
  async enhancedSearch(
    query: string, 
    limit: number = 5,
    documentIds?: string[],
    useCorrectiveRAG: boolean = true,
    fallbackToWeb: boolean = false,
    model?: string,
    isGeminiModel?: boolean,
    geminiApiKey?: string
  ): Promise<RAGSearchResult[]> {
    try {
      console.log('Enhanced RAG Search - Starting with query:', query)

      // Step 1: Initial search with larger result set for re-ranking
      const initialResults = await this.search(query, limit * 3, documentIds)

      if (initialResults.length === 0) {
        console.log('Enhanced RAG Search - No initial results found')
        return []
      }

      // Step 2: Cross-encoder re-ranking
      console.log('Enhanced RAG Search - Applying cross-encoder re-ranking')
      
      // Transform RAGSearchResult to the format expected by cross-encoder
      const chunksForReRanking = initialResults.map(result => ({
        id: result.chunk.id,
        content: result.chunk.content,
        relevanceScore: result.relevanceScore,
        metadata: result.chunk.metadata
      }))
      
      const reRankedResults = await crossEncoderService.reRankChunks(query, chunksForReRanking)

      // Transform back to RAGSearchResult format
      const topResults: RAGSearchResult[] = reRankedResults.slice(0, limit).map(reRanked => {
        const originalResult = initialResults.find(r => r.chunk.id === reRanked.chunkId)!
        return {
          ...originalResult,
          relevanceScore: reRanked.finalScore
        }
      })

      // Step 3: Corrective RAG evaluation (if enabled)
      if (useCorrectiveRAG && topResults.length > 0) {
        console.log('Enhanced RAG Search - Applying corrective RAG evaluation')
        
        const correctedResults = await correctiveRAGService.performCorrectiveRAG(
          query,
          topResults,
          {
            fallbackToWeb,
            maxWebSearchUrls: 3,
            relevanceThreshold: 0.4, // Use consistent threshold for all queries
            model,
            isGeminiModel,
            geminiApiKey
          }
        )

        // If corrective RAG suggests using web content, the finalContent contains everything
        if (correctedResults.webSearchPerformed && !correctedResults.useRetrievedContent) {
          console.log('Enhanced RAG Search - Using web search results instead of retrieved content')
          // Return empty array since web content is in finalContent (handled by generateResponse)
          return []
        }

        console.log('Enhanced RAG Search - Returning corrected results')
        return topResults // Return the verified chunks
      }

      console.log('Enhanced RAG Search - Returning re-ranked results:', topResults.length)
      return topResults

    } catch (error) {
      console.error('Error in enhanced RAG search:', error)
      // Fallback to regular search
      console.log('Enhanced RAG Search - Falling back to regular search')
      return await this.search(query, limit, documentIds)
    }
  }

  /**
   * Generate RAG-enhanced response
   */
  async generateResponse(
    query: string,
    conversationContext: Array<{ role: string; content: string }> = []
  ): Promise<RAGResponse> {
    try {
      // Search for relevant content
      const searchResults = await this.search(query)

      if (searchResults.length === 0) {
        return {
          answer: "I don't have specific information about that topic in my knowledge base. I can still help with general questions using my training data.",
          sources: [],
          confidence: 0.1
        }
      }

      // Prepare context from search results
      const contextSources = searchResults.map(result => ({
        title: result.chunk.metadata.title || 'Document',
        content: result.chunk.content.substring(0, 500) + '...',
        source: result.chunk.metadata.source,
        page: result.chunk.metadata.page
      }))

      // Build enhanced prompt with RAG context
      const ragContext = searchResults
        .map(result => `Source: ${result.chunk.metadata.title}\nContent: ${result.chunk.content}`)
        .join('\n\n---\n\n')

      const enhancedPrompt = `Based on the following knowledge base content, please answer the user's question. If the information is not sufficient, indicate that clearly.

Knowledge Base Context:
${ragContext}

User Question: ${query}

Please provide a comprehensive answer based on the provided context, and cite the sources when relevant.`

      // Calculate average confidence from search results
      const avgConfidence = searchResults.length > 0 
        ? searchResults.reduce((sum, result) => sum + result.relevanceScore, 0) / searchResults.length / 100
        : 0.1

      return {
        answer: enhancedPrompt, // This would be processed by your LLM
        sources: contextSources,
        confidence: Math.min(avgConfidence, 0.95)
      }
    } catch (error) {
      console.error('Error generating RAG response:', error)
      return {
        answer: "I encountered an error while searching my knowledge base. Please try rephrasing your question.",
        sources: [],
        confidence: 0.1
      }
    }
  }

  /**
   * Upload and process a text file
   */
  async uploadTextFile(
    fileName: string,
    content: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    return this.addDocument(
      fileName,
      content,
      `file://${fileName}`,
      { type: 'text_file', fileName, ...metadata }
    )
  }

  /**
   * List all documents in the knowledge base
   */
  async listDocuments(): Promise<Array<{
    id: string
    title: string
    source: string
    createdAt: Date
    chunkCount: number
  }>> {
    try {
      const documents = await prisma.document.findMany({
        select: {
          id: true,
          title: true,
          source: true,
          createdAt: true,
          _count: {
            select: {
              chunks: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      return documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        source: doc.source,
        createdAt: doc.createdAt,
        chunkCount: doc._count.chunks
      }))
    } catch (error) {
      console.error('Error listing documents:', error)
      return []
    }
  }

  /**
   * Delete a document from the knowledge base
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      await prisma.document.delete({
        where: { id: documentId }
      })
      return true
    } catch (error) {
      console.error('Error deleting document:', error)
      return false
    }
  }
  /**
   * Split content into chunks with enhanced PDF support
   */
  private splitIntoChunks(
    content: string,
    title: string,
    source: string,
    metadata: Record<string, any> = {}
  ): Array<{ content: string; metadata: Record<string, any> }> {
    const chunks: Array<{ content: string; metadata: Record<string, any> }> = []
    
    // Detect if this is PDF content and use appropriate chunking strategy
    const isPDF = metadata.fileType === 'pdf' || source.includes('.pdf')
    
    if (isPDF) {
      return this.splitPDFContent(content, title, source, metadata)
    }
    
    // Original chunking for other file types
    const lines = content.split('\n')
    let currentChunk = ''
    let chunkIndex = 0

    for (const line of lines) {
      if (currentChunk.length + line.length > this.CHUNK_SIZE) {
        if (currentChunk.trim()) {
          chunks.push({
            content: currentChunk.trim(),
            metadata: {
              title,
              source,
              chunkIndex: chunkIndex++,
              type: 'text_chunk',
              ...metadata
            }
          })
        }

        // Start new chunk with overlap
        const words = currentChunk.split(' ')
        const overlapWords = words.slice(-this.CHUNK_OVERLAP / 10) // Approximate word overlap
        currentChunk = overlapWords.join(' ') + ' ' + line
      } else {
        currentChunk += (currentChunk ? '\n' : '') + line
      }
    }

    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          title,
          source,
          chunkIndex: chunkIndex++,
          type: 'text_chunk',
          ...metadata
        }
      })
    }

    return chunks
  }

  /**
   * Enhanced PDF content chunking strategy
   */
  private splitPDFContent(
    content: string,
    title: string,
    source: string,
    metadata: Record<string, any> = {}
  ): Array<{ content: string; metadata: Record<string, any> }> {
    const chunks: Array<{ content: string; metadata: Record<string, any> }> = []
    
    // Try to split by paragraphs first (double newlines)
    let sections = content.split('\n\n').filter(section => section.trim())
    
    // If no clear paragraph breaks, split by sentences
    if (sections.length === 1) {
      sections = content.split(/[.!?]+\s+/).filter(sentence => sentence.trim())
    }
    
    let currentChunk = ''
    let chunkIndex = 0
    
    for (const section of sections) {
      const sectionText = section.trim()
      
      // If adding this section would exceed chunk size
      if (currentChunk.length + sectionText.length > this.CHUNK_SIZE) {
        // Save current chunk if it has content
        if (currentChunk.trim()) {
          chunks.push({
            content: currentChunk.trim(),
            metadata: {
              title,
              source,
              chunkIndex: chunkIndex++,
              type: 'pdf_chunk',
              pages: metadata.pages,
              wordCount: currentChunk.trim().split(/\s+/).length,
              ...metadata
            }
          })
        }
        
        // If the section itself is too large, split it further
        if (sectionText.length > this.CHUNK_SIZE) {
          const words = sectionText.split(' ')
          let wordChunk = ''
          
          for (const word of words) {
            if (wordChunk.length + word.length > this.CHUNK_SIZE) {
              if (wordChunk.trim()) {
                chunks.push({
                  content: wordChunk.trim(),
                  metadata: {
                    title,
                    source,
                    chunkIndex: chunkIndex++,
                    type: 'pdf_chunk_large',
                    pages: metadata.pages,
                    wordCount: wordChunk.trim().split(/\s+/).length,
                    ...metadata
                  }
                })
              }
              wordChunk = word
            } else {
              wordChunk += (wordChunk ? ' ' : '') + word
            }
          }
          
          // Start new chunk with remaining words
          currentChunk = wordChunk
        } else {
          // Start new chunk with this section
          currentChunk = sectionText
        }
      } else {
        // Add section to current chunk
        currentChunk += (currentChunk ? '\n\n' : '') + sectionText
      }
    }
    
    // Add final chunk
    if (currentChunk.trim()) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          title,
          source,
          chunkIndex: chunkIndex++,
          type: 'pdf_chunk',
          pages: metadata.pages,
          wordCount: currentChunk.trim().split(/\s+/).length,
          ...metadata
        }
      })
    }
    
    return chunks
  }

  /**
   * Simple text similarity calculation (for basic matching)
   * In production, use proper embedding-based similarity
   */
  private calculateTextSimilarity(query: string, text: string): number {
    const queryWords = query.toLowerCase().split(/\s+/)
    const textWords = text.toLowerCase().split(/\s+/)
      const querySet = new Set(queryWords)
    const textSet = new Set(textWords)
    
    const intersection = new Set(Array.from(querySet).filter(x => textSet.has(x)))
    const union = new Set([...Array.from(querySet), ...Array.from(textSet)])
    
    return intersection.size / union.size // Jaccard similarity
  }
}

export const ragService = new RAGService()
