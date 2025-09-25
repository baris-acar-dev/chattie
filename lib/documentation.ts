import { ragService } from './rag'

export interface DocumentationResponse {
  success: boolean
  content?: string
  sources?: Array<{
    title: string
    url?: string
    relevance: number
  }>
  error?: string
}

interface DocumentationSource {
  name: string
  baseUrl: string
  searchEndpoint?: string
  type: 'github' | 'docs' | 'api'
}

class DocumentationService {
  private sources: DocumentationSource[] = [
    {
      name: 'MDN Web Docs',
      baseUrl: 'https://developer.mozilla.org',
      type: 'docs'
    },
    {
      name: 'React Docs',
      baseUrl: 'https://react.dev',
      type: 'docs'
    },
    {
      name: 'Next.js Docs',
      baseUrl: 'https://nextjs.org/docs',
      type: 'docs'
    },
    {
      name: 'TypeScript Docs',
      baseUrl: 'https://www.typescriptlang.org/docs',
      type: 'docs'
    },
    {
      name: 'Tailwind CSS',
      baseUrl: 'https://tailwindcss.com/docs',
      type: 'docs'
    }
  ]

  /**
   * Search documentation using the local RAG system
   * This leverages the existing knowledge base instead of external APIs
   */
  async searchDocumentation(query: string, library?: string): Promise<DocumentationResponse> {
    try {
      // First, try to search in the local knowledge base
      const ragResults = await ragService.search(query, 5)
      
      if (ragResults.length > 0) {
        // Filter by library if specified
        const filteredResults = library 
          ? ragResults.filter(result => 
              result.chunk.metadata.title?.toLowerCase().includes(library.toLowerCase()) ||
              result.chunk.metadata.source?.toLowerCase().includes(library.toLowerCase())
            )
          : ragResults

        if (filteredResults.length > 0) {
          const content = filteredResults
            .map(result => `From ${result.chunk.metadata.title}:\n${result.chunk.content}`)
            .join('\n\n---\n\n')

          const sources = filteredResults.map(result => ({
            title: result.chunk.metadata.title || 'Documentation',
            url: result.chunk.metadata.source,
            relevance: result.relevanceScore
          }))

          return {
            success: true,
            content,
            sources
          }
        }
      }

      // If no local results, provide guidance on adding documentation
      return {
        success: false,
        error: library 
          ? `No documentation found for "${library}" in the knowledge base. Consider uploading relevant documentation files.`
          : `No documentation found for "${query}" in the knowledge base. Consider uploading relevant documentation files.`
      }

    } catch (error) {
      console.error('Error in documentation search:', error)
      return {
        success: false,
        error: 'Failed to search documentation'
      }
    }
  }

  /**
   * Get available documentation sources
   */
  getAvailableSources(): DocumentationSource[] {
    return this.sources
  }

  /**
   * Add a custom documentation source
   */
  addSource(source: DocumentationSource): void {
    this.sources.push(source)
  }

  /**
   * Search for specific library documentation
   */
  async searchLibraryDocs(library: string, query: string): Promise<DocumentationResponse> {
    return this.searchDocumentation(`${library} ${query}`, library)
  }

  /**
   * Get documentation suggestions based on query
   */
  getDocumentationSuggestions(query: string): string[] {
    const suggestions: string[] = []
    
    // Common programming concepts
    const concepts = [
      'React hooks', 'TypeScript types', 'Next.js routing', 'CSS flexbox',
      'JavaScript promises', 'API endpoints', 'Database queries', 'Authentication'
    ]
    
    concepts.forEach(concept => {
      if (concept.toLowerCase().includes(query.toLowerCase()) || 
          query.toLowerCase().includes(concept.toLowerCase())) {
        suggestions.push(concept)
      }
    })
    
    return suggestions.slice(0, 5)
  }

  /**
   * Check if documentation service is available
   */
  isServiceAvailable(): boolean {
    return true // Always available since it uses local RAG
  }
}

export const documentationService = new DocumentationService()
