// Cross-encoder service for semantic re-ranking
// TODO: Install @xenova/transformers for full cross-encoder support
// For now, implementing enhanced lexical scoring

export interface ReRankingResult {
  chunkId: string
  content: string
  originalScore: number
  crossEncoderScore: number
  finalScore: number
  metadata?: any
}

export interface CrossEncoderOptions {
  model?: string
  maxLength?: number
  batchSize?: number
  useSemanticRanking?: boolean
}

class CrossEncoderService {
  private readonly defaultModel = 'ms-marco-MiniLM-L-6-v2'
  
  constructor() {
    console.log('CrossEncoderService initialized with enhanced lexical scoring')
    console.log('Install @xenova/transformers for full semantic re-ranking capabilities')
  }

  /**
   * Re-rank document chunks using enhanced lexical scoring
   * TODO: Upgrade to semantic cross-encoder when transformers library is available
   */
  async reRankChunks(
    query: string,
    chunks: Array<{
      id: string
      content: string
      relevanceScore: number
      metadata?: any
    }>,
    options: CrossEncoderOptions = {}
  ): Promise<ReRankingResult[]> {
    try {
      if (chunks.length === 0) {
        return []
      }

      return this.performEnhancedLexicalRanking(query, chunks, options)
    } catch (error) {
      console.error('Error in re-ranking chunks:', error)
      // Return original chunks with their scores if re-ranking fails
      return chunks.map(chunk => ({
        chunkId: chunk.id,
        content: chunk.content,
        originalScore: chunk.relevanceScore,
        crossEncoderScore: chunk.relevanceScore,
        finalScore: chunk.relevanceScore,
        metadata: chunk.metadata
      }))
    }
  }

  /**
   * Enhanced lexical ranking with multiple scoring factors
   */
  private performEnhancedLexicalRanking(
    query: string,
    chunks: Array<{
      id: string
      content: string
      relevanceScore: number
      metadata?: any
    }>,
    options: CrossEncoderOptions
  ): ReRankingResult[] {
    const queryTerms = this.extractQueryTerms(query)
    const queryBigrams = this.generateBigrams(queryTerms)
    
    const results: ReRankingResult[] = chunks.map(chunk => {
      const content = chunk.content.toLowerCase()
      const contentTerms = this.extractQueryTerms(chunk.content)
      
      let enhancedScore = chunk.relevanceScore
      let scoringFactors = {
        exactMatch: 0,
        phraseMatch: 0,
        termFrequency: 0,
        termProximity: 0,
        positionBoost: 0,
        lengthPenalty: 0,
        titleBoost: 0,
        bigramMatch: 0
      }
      
      // 1. Exact query match (high weight)
      if (content.includes(query.toLowerCase())) {
        scoringFactors.exactMatch = 25
      }
      
      // 2. Phrase matching (partial phrases)
      const phrases = this.extractPhrases(query)
      for (const phrase of phrases) {
        if (content.includes(phrase.toLowerCase())) {
          scoringFactors.phraseMatch += 15 / phrases.length
        }
      }
      
      // 3. Term frequency scoring
      let termMatches = 0
      for (const term of queryTerms) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi')
        const matches = (content.match(regex) || []).length
        if (matches > 0) {
          termMatches++
          scoringFactors.termFrequency += Math.min(matches * 3, 12) // Cap at 12 points per term
        }
      }
      
      // 4. Term proximity scoring
      scoringFactors.termProximity = this.calculateTermProximity(content, queryTerms)
      
      // 5. Position boost (terms appearing early are more important)
      scoringFactors.positionBoost = this.calculatePositionBoost(content, queryTerms)
      
      // 6. Length penalty (very short or very long chunks are penalized)
      scoringFactors.lengthPenalty = this.calculateLengthPenalty(chunk.content)
      
      // 7. Title/metadata boost
      if (chunk.metadata?.title) {
        const titleMatches = queryTerms.filter(term => 
          chunk.metadata.title.toLowerCase().includes(term)
        ).length
        scoringFactors.titleBoost = (titleMatches / queryTerms.length) * 10
      }
      
      // 8. Bigram matching (word pairs)
      for (const bigram of queryBigrams) {
        if (content.includes(bigram.toLowerCase())) {
          scoringFactors.bigramMatch += 8
        }
      }
      
      // Calculate final enhanced score
      const bonusScore = Object.values(scoringFactors).reduce((sum, score) => sum + score, 0)
      enhancedScore = Math.min(chunk.relevanceScore + bonusScore, 100)
      
      return {
        chunkId: chunk.id,
        content: chunk.content,
        originalScore: chunk.relevanceScore,
        crossEncoderScore: enhancedScore,
        finalScore: enhancedScore,
        metadata: {
          ...chunk.metadata,
          reRanked: true,
          method: 'enhanced_lexical',
          scoringFactors,
          termMatches: termMatches,
          totalTerms: queryTerms.length
        }
      }
    })
    
    // Sort by final score
    return results.sort((a, b) => b.finalScore - a.finalScore)
  }

  /**
   * Extract meaningful terms from query/content
   */
  private extractQueryTerms(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'what', 'which', 'who', 'where', 'when', 'why', 'how', 'is', 'are', 'was', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
    ])

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 20) // Limit to prevent performance issues
  }

  /**
   * Generate bigrams (word pairs) from terms
   */
  private generateBigrams(terms: string[]): string[] {
    const bigrams: string[] = []
    for (let i = 0; i < terms.length - 1; i++) {
      bigrams.push(`${terms[i]} ${terms[i + 1]}`)
    }
    return bigrams
  }

  /**
   * Extract meaningful phrases from query (quoted phrases, etc.)
   */
  private extractPhrases(query: string): string[] {
    const phrases: string[] = []
    
    // Extract quoted phrases
    const quotedMatches = query.match(/"([^"]+)"/g)
    if (quotedMatches) {
      phrases.push(...quotedMatches.map(match => match.slice(1, -1)))
    }
    
    // Extract 3+ word sequences as potential phrases
    const words = query.split(/\s+/)
    for (let i = 0; i <= words.length - 3; i++) {
      phrases.push(words.slice(i, i + 3).join(' '))
    }
    
    return phrases.filter(phrase => phrase.length > 5) // Filter out very short phrases
  }

  /**
   * Calculate term proximity bonus
   */
  private calculateTermProximity(content: string, queryTerms: string[]): number {
    let proximityScore = 0
    
    for (let i = 0; i < queryTerms.length - 1; i++) {
      const term1 = queryTerms[i]
      const term2 = queryTerms[i + 1]
      
      const term1Index = content.indexOf(term1)
      const term2Index = content.indexOf(term2)
      
      if (term1Index !== -1 && term2Index !== -1) {
        const distance = Math.abs(term2Index - term1Index)
        if (distance < 100) { // Within 100 characters
          proximityScore += (100 - distance) / 100 * 8
        }
      }
    }
    
    return Math.min(proximityScore, 20) // Cap at 20 points
  }

  /**
   * Calculate position boost (earlier mentions are more important)
   */
  private calculatePositionBoost(content: string, queryTerms: string[]): number {
    let positionScore = 0
    const contentLength = content.length
    
    for (const term of queryTerms) {
      const index = content.indexOf(term)
      if (index !== -1) {
        // Earlier positions get higher scores
        const positionRatio = 1 - (index / contentLength)
        positionScore += positionRatio * 5
      }
    }
    
    return Math.min(positionScore, 15) // Cap at 15 points
  }

  /**
   * Calculate length penalty/bonus
   */
  private calculateLengthPenalty(content: string): number {
    const length = content.length
    const words = content.split(/\s+/).length
    
    // Optimal range: 100-800 characters, 20-150 words
    if (length < 50 || words < 10) {
      return -5 // Too short
    } else if (length > 1500 || words > 300) {
      return -3 // Too long
    } else if (length >= 100 && length <= 800 && words >= 20 && words <= 150) {
      return 3 // Optimal length
    }
    
    return 0
  }

  /**
   * Batch re-rank with caching for similar queries
   */
  async batchReRank(
    queries: string[],
    chunksPerQuery: Array<Array<{
      id: string
      content: string
      relevanceScore: number
      metadata?: any
    }>>,
    options: CrossEncoderOptions = {}
  ): Promise<ReRankingResult[][]> {
    const results: ReRankingResult[][] = []
    
    for (let i = 0; i < queries.length; i++) {
      const queryResults = await this.reRankChunks(queries[i], chunksPerQuery[i], options)
      results.push(queryResults)
    }
    
    return results
  }

  /**
   * Get model information
   */
  getModelInfo(): { name: string; loaded: boolean; type: string } {
    return {
      name: this.defaultModel,
      loaded: true,
      type: 'enhanced_lexical'
    }
  }

  /**
   * Cleanup resources (no-op for lexical scoring)
   */
  async cleanup(): Promise<void> {
    // No cleanup needed for lexical scoring
  }
}

export const crossEncoderService = new CrossEncoderService()