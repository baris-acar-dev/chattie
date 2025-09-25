// Structured Data Extraction Service for Document Intelligence
import { ollamaService } from './ollama'
import { geminiService } from './gemini'
// TODO: Install 'compromise' for advanced NLP entity extraction
// import nlp from 'compromise'

export interface StructuredData {
  entities: {
    people: string[]
    organizations: string[]
    locations: string[]
    dates: string[]
    numbers: string[]
    currencies: string[]
    percentages: string[]
    emails: string[]
    phones: string[]
    urls: string[]
  }
  keyFigures: {
    revenue: string[]
    costs: string[]
    profits: string[]
    quantities: string[]
    metrics: string[]
  }
  dates: {
    important_dates: Array<{
      date: string
      context: string
      type: 'deadline' | 'event' | 'milestone' | 'period'
    }>
  }
  tables: Array<{
    caption?: string
    headers: string[]
    rows: string[][]
    summary: string
  }>
  sections: Array<{
    title: string
    content: string
    type: 'introduction' | 'methodology' | 'results' | 'conclusion' | 'other'
  }>
  metadata: {
    documentType: 'financial' | 'legal' | 'technical' | 'academic' | 'business' | 'other'
    confidence: number
    language: string
    wordCount: number
    complexity: 'low' | 'medium' | 'high'
  }
}

export interface ExtractionOptions {
  useAI?: boolean
  model?: string
  isGeminiModel?: boolean
  geminiApiKey?: string
  extractTables?: boolean
  extractEntities?: boolean
  extractKeyFigures?: boolean
  extractDates?: boolean
  maxContentLength?: number
}

class StructuredDataExtractionService {
  private readonly extractionPrompt = `
Analyze the following document content and extract structured information in JSON format.

Document Content:
{content}

Extract the following information and return as JSON:
{
  "entities": {
    "people": ["person names found"],
    "organizations": ["company/org names found"],
    "locations": ["places/addresses found"],
    "dates": ["dates found"],
    "numbers": ["important numbers found"],
    "currencies": ["monetary amounts found"],
    "percentages": ["percentages found"]
  },
  "keyFigures": {
    "revenue": ["revenue figures"],
    "costs": ["cost figures"],
    "profits": ["profit figures"],
    "quantities": ["quantities/amounts"],
    "metrics": ["key metrics/KPIs"]
  },
  "dates": {
    "important_dates": [
      {"date": "2024-03-15", "context": "project deadline", "type": "deadline"}
    ]
  },
  "metadata": {
    "documentType": "financial|legal|technical|academic|business|other",
    "confidence": 0.8,
    "complexity": "low|medium|high"
  }
}

Focus on accuracy. Only extract information that is clearly present in the text. Return valid JSON only.`

  constructor() {
    console.log('StructuredDataExtractionService initialized')
  }

  /**
   * Extract structured data from document content
   */
  async extractStructuredData(
    content: string,
    title: string,
    options: ExtractionOptions = {}
  ): Promise<StructuredData> {
    try {
      const {
        useAI = true,
        model = 'llama2',
        isGeminiModel = false,
        geminiApiKey,
        extractTables = true,
        extractEntities = true,
        extractKeyFigures = true,
        extractDates = true,
        maxContentLength = 3000
      } = options

      console.log(`Extracting structured data from document: "${title}"`)
      
      // Truncate content if too long
      const truncatedContent = content.length > maxContentLength 
        ? content.substring(0, maxContentLength) + '...'
        : content

      // Initialize structured data
      let structuredData: StructuredData = {
        entities: {
          people: [],
          organizations: [],
          locations: [],
          dates: [],
          numbers: [],
          currencies: [],
          percentages: [],
          emails: [],
          phones: [],
          urls: []
        },
        keyFigures: {
          revenue: [],
          costs: [],
          profits: [],
          quantities: [],
          metrics: []
        },
        dates: {
          important_dates: []
        },
        tables: [],
        sections: [],
        metadata: {
          documentType: 'other',
          confidence: 0.5,
          language: 'en',
          wordCount: content.split(/\s+/).length,
          complexity: 'medium'
        }
      }

      // Step 1: Use NLP library for basic entity extraction
      if (extractEntities) {
        structuredData = await this.extractBasicEntities(content, structuredData)
      }

      // Step 2: Use AI for advanced extraction if enabled
      if (useAI) {
        try {
          const aiExtractedData = await this.performAIExtraction(
            truncatedContent,
            { model, isGeminiModel, geminiApiKey }
          )
          
          // Merge AI results with NLP results
          structuredData = this.mergeExtractionResults(structuredData, aiExtractedData)
        } catch (error) {
          console.warn('AI extraction failed, using NLP-only results:', error)
        }
      }

      // Step 3: Extract tables if requested
      if (extractTables) {
        structuredData.tables = this.extractTables(content)
      }

      // Step 4: Determine document type and complexity
      structuredData.metadata = this.analyzeDocumentMetadata(content, title, structuredData)

      console.log(`Structured data extraction complete:`)
      console.log(`- Entities: ${Object.values(structuredData.entities).flat().length} total`)
      console.log(`- Key figures: ${Object.values(structuredData.keyFigures).flat().length} total`)
      console.log(`- Document type: ${structuredData.metadata.documentType}`)
      console.log(`- Complexity: ${structuredData.metadata.complexity}`)

      return structuredData
    } catch (error) {
      console.error('Error in structured data extraction:', error)
      // Return minimal structured data on error
      return {
        entities: {
          people: [], organizations: [], locations: [], dates: [], numbers: [],
          currencies: [], percentages: [], emails: [], phones: [], urls: []
        },
        keyFigures: { revenue: [], costs: [], profits: [], quantities: [], metrics: [] },
        dates: { important_dates: [] },
        tables: [],
        sections: [],
        metadata: {
          documentType: 'other',
          confidence: 0.1,
          language: 'en',
          wordCount: content.split(/\s+/).length,
          complexity: 'medium'
        }
      }
    }
  }

  /**
   * Extract basic entities using regex patterns (NLP library not installed)
   */
  private async extractBasicEntities(content: string, data: StructuredData): Promise<StructuredData> {
    try {
      // Use regex-based extraction for now (install 'compromise' for advanced NLP)
      
      // Extract potential people names (Title Case words, 2-3 parts)
      const peoplePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g
      const peopleMatches = content.match(peoplePattern) || []
      data.entities.people = Array.from(new Set(peopleMatches)).filter(name => name.length > 3)
      
      // Extract potential organizations (Inc, LLC, Corp, Ltd, etc.)
      const orgPattern = /\b[A-Z][A-Za-z\s&]+(?:Inc|LLC|Corp|Ltd|Company|Organization|Foundation|Institute)\b/g
      const orgMatches = content.match(orgPattern) || []
      data.entities.organizations = Array.from(new Set(orgMatches)).filter(org => org.length > 3)
      
      // Extract locations (cities, states, countries - basic patterns)
      const locationPattern = /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?,\s[A-Z]{2}\b|\b[A-Z][a-z]+,\s[A-Z][a-z]+\b/g
      const locationMatches = content.match(locationPattern) || []
      data.entities.locations = Array.from(new Set(locationMatches)).filter(loc => loc.length > 2)
      
      // Extract dates using regex patterns
      data.entities.dates = this.extractDatesWithRegex(content)
      
      // Extract numbers, currencies, percentages
      data.entities.numbers = this.extractNumbersWithRegex(content)
      data.entities.currencies = this.extractCurrenciesWithRegex(content)
      data.entities.percentages = this.extractPercentagesWithRegex(content)
      
      // Extract emails, phones, URLs
      data.entities.emails = this.extractEmailsWithRegex(content)
      data.entities.phones = this.extractPhonesWithRegex(content)
      data.entities.urls = this.extractUrlsWithRegex(content)
      
      return data
    } catch (error) {
      console.error('Error in entity extraction:', error)
      return data
    }
  }

  /**
   * Perform AI-based extraction using LLM
   */
  private async performAIExtraction(
    content: string,
    aiOptions: { model: string; isGeminiModel: boolean; geminiApiKey?: string }
  ): Promise<Partial<StructuredData>> {
    try {
      const prompt = this.extractionPrompt.replace('{content}', content)

      const messages = [
        { 
          role: 'system' as const, 
          content: 'You are an expert at extracting structured information from documents. Always return valid JSON.' 
        },
        { role: 'user' as const, content: prompt }
      ]

      let response: string
      if (aiOptions.isGeminiModel && aiOptions.geminiApiKey) {
        geminiService.setApiKey(aiOptions.geminiApiKey)
        response = await geminiService.chat(aiOptions.model, messages, {
          temperature: 0.1,
          maxOutputTokens: 2048
        })
      } else {
        response = await ollamaService.chat(aiOptions.model, messages)
      }

      // Clean up the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const jsonStr = jsonMatch[0]
        const extractedData = JSON.parse(jsonStr)
        console.log('AI extraction successful')
        return extractedData
      } else {
        console.warn('No valid JSON found in AI response')
        return {}
      }
    } catch (error) {
      console.error('Error in AI extraction:', error)
      return {}
    }
  }

  /**
   * Merge NLP and AI extraction results
   */
  private mergeExtractionResults(nlpData: StructuredData, aiData: Partial<StructuredData>): StructuredData {
    const merged = { ...nlpData }
    
    if (aiData.entities) {
      // Merge entities, keeping unique values
      Object.keys(aiData.entities).forEach(key => {
        if (merged.entities[key as keyof typeof merged.entities] && aiData.entities![key as keyof typeof aiData.entities]) {
          const combined = [
            ...merged.entities[key as keyof typeof merged.entities],
            ...aiData.entities![key as keyof typeof aiData.entities]
          ]
          merged.entities[key as keyof typeof merged.entities] = Array.from(new Set(combined))
        }
      })
    }
    
    if (aiData.keyFigures) {
      // Merge key figures
      Object.keys(aiData.keyFigures).forEach(key => {
        if (merged.keyFigures[key as keyof typeof merged.keyFigures] && aiData.keyFigures![key as keyof typeof aiData.keyFigures]) {
          const combined = [
            ...merged.keyFigures[key as keyof typeof merged.keyFigures],
            ...aiData.keyFigures![key as keyof typeof aiData.keyFigures]
          ]
          merged.keyFigures[key as keyof typeof merged.keyFigures] = Array.from(new Set(combined))
        }
      })
    }
    
    if (aiData.dates) {
      merged.dates = { ...merged.dates, ...aiData.dates }
    }
    
    if (aiData.metadata) {
      merged.metadata = { ...merged.metadata, ...aiData.metadata }
    }
    
    return merged
  }

  /**
   * Extract dates using regex patterns
   */
  private extractDatesWithRegex(content: string): string[] {
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,           // MM/DD/YYYY
      /\b\d{4}-\d{2}-\d{2}\b/g,                 // YYYY-MM-DD
      /\b\d{1,2}-\d{1,2}-\d{4}\b/g,             // MM-DD-YYYY
      /\b[A-Za-z]+ \d{1,2}, \d{4}\b/g,          // Month DD, YYYY
      /\b\d{1,2} [A-Za-z]+ \d{4}\b/g            // DD Month YYYY
    ]
    
    const dates: string[] = []
    datePatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) dates.push(...matches)
    })
    
    return Array.from(new Set(dates))
  }

  /**
   * Extract numbers using regex
   */
  private extractNumbersWithRegex(content: string): string[] {
    const numberPattern = /\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\b/g
    const matches = content.match(numberPattern) || []
    return Array.from(new Set(matches)).filter(num => parseFloat(num.replace(/,/g, '')) > 0)
  }

  /**
   * Extract currencies using regex
   */
  private extractCurrenciesWithRegex(content: string): string[] {
    const currencyPattern = /[$€£¥]\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\b\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP|JPY|dollars?|euros?|pounds?)\b/gi
    const matches = content.match(currencyPattern) || []
    return Array.from(new Set(matches))
  }

  /**
   * Extract percentages using regex
   */
  private extractPercentagesWithRegex(content: string): string[] {
    const percentagePattern = /\b\d{1,3}(?:\.\d{1,2})?\s*%/g
    const matches = content.match(percentagePattern) || []
    return Array.from(new Set(matches))
  }

  /**
   * Extract emails using regex
   */
  private extractEmailsWithRegex(content: string): string[] {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    const matches = content.match(emailPattern) || []
    return Array.from(new Set(matches))
  }

  /**
   * Extract phone numbers using regex
   */
  private extractPhonesWithRegex(content: string): string[] {
    const phonePattern = /\b(?:\+1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g
    const matches = content.match(phonePattern) || []
    return Array.from(new Set(matches))
  }

  /**
   * Extract URLs using regex
   */
  private extractUrlsWithRegex(content: string): string[] {
    const urlPattern = /https?:\/\/[^\s<>"]+/g
    const matches = content.match(urlPattern) || []
    return Array.from(new Set(matches))
  }

  /**
   * Extract table structures from content
   */
  private extractTables(content: string): Array<{
    caption?: string
    headers: string[]
    rows: string[][]
    summary: string
  }> {
    // Simple table detection for structured content
    const tables: Array<{ caption?: string; headers: string[]; rows: string[][]; summary: string }> = []
    
    // Look for patterns that suggest tabular data
    const lines = content.split('\n')
    let currentTable: { headers: string[]; rows: string[][] } | null = null
    
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Skip empty lines
      if (!trimmedLine) continue
      
      // Look for lines with multiple separators (tabs, pipes, multiple spaces)
      if (trimmedLine.includes('\t') || trimmedLine.includes('|') || /\s{3,}/.test(trimmedLine)) {
        const cells = trimmedLine.split(/[\t|]|  +/).map(cell => cell.trim()).filter(cell => cell)
        
        if (cells.length >= 2) {
          if (!currentTable) {
            // Start new table
            currentTable = { headers: cells, rows: [] }
          } else {
            // Add row to current table
            currentTable.rows.push(cells)
          }
        }
      } else if (currentTable && currentTable.rows.length > 0) {
        // End current table
        tables.push({
          headers: currentTable.headers,
          rows: currentTable.rows,
          summary: `Table with ${currentTable.headers.length} columns and ${currentTable.rows.length} rows`
        })
        currentTable = null
      }
    }
    
    // Add final table if exists
    if (currentTable && currentTable.rows.length > 0) {
      tables.push({
        headers: currentTable.headers,
        rows: currentTable.rows,
        summary: `Table with ${currentTable.headers.length} columns and ${currentTable.rows.length} rows`
      })
    }
    
    return tables
  }

  /**
   * Analyze document metadata and determine type/complexity
   */
  private analyzeDocumentMetadata(content: string, title: string, data: StructuredData): StructuredData['metadata'] {
    const wordCount = content.split(/\s+/).length
    
    // Determine document type based on content and title
    let documentType: StructuredData['metadata']['documentType'] = 'other'
    const titleLower = title.toLowerCase()
    const contentLower = content.toLowerCase()
    
    if (titleLower.includes('financial') || titleLower.includes('report') || 
        contentLower.includes('revenue') || contentLower.includes('profit') || 
        data.keyFigures.revenue.length > 0 || data.entities.currencies.length > 3) {
      documentType = 'financial'
    } else if (titleLower.includes('legal') || titleLower.includes('contract') || 
               contentLower.includes('agreement') || contentLower.includes('terms')) {
      documentType = 'legal'
    } else if (titleLower.includes('technical') || titleLower.includes('manual') || 
               contentLower.includes('api') || contentLower.includes('protocol')) {
      documentType = 'technical'
    } else if (titleLower.includes('research') || titleLower.includes('study') || 
               contentLower.includes('methodology') || contentLower.includes('abstract')) {
      documentType = 'academic'
    } else if (titleLower.includes('business') || titleLower.includes('proposal') || 
               contentLower.includes('strategy') || contentLower.includes('market')) {
      documentType = 'business'
    }
    
    // Determine complexity
    let complexity: StructuredData['metadata']['complexity'] = 'medium'
    const entityCount = Object.values(data.entities).flat().length
    const hasMultipleSections = content.split('\n\n').length > 10
    const hasTechnicalTerms = /\b(?:algorithm|protocol|implementation|methodology|analysis|framework)\b/i.test(content)
    
    if (wordCount < 500 && entityCount < 10 && !hasTechnicalTerms) {
      complexity = 'low'
    } else if (wordCount > 2000 || entityCount > 50 || hasTechnicalTerms || hasMultipleSections) {
      complexity = 'high'
    }
    
    // Calculate confidence based on extraction success
    const confidence = Math.min(
      0.5 + (entityCount * 0.01) + (data.tables.length * 0.1) + 
      (Object.values(data.keyFigures).flat().length * 0.02), 
      1.0
    )
    
    return {
      documentType,
      confidence,
      language: 'en', // TODO: Add language detection
      wordCount,
      complexity
    }
  }

  /**
   * Get service information
   */
  getServiceInfo(): {
    name: string
    features: string[]
    supportedExtractions: string[]
  } {
    return {
      name: 'StructuredDataExtractionService',
      features: [
        'Named Entity Recognition (NLP + AI)',
        'Financial data extraction',
        'Date and time extraction',
        'Table structure detection',
        'Document type classification',
        'Multi-model AI support'
      ],
      supportedExtractions: [
        'People, Organizations, Locations',
        'Dates, Numbers, Currencies, Percentages',
        'Emails, Phones, URLs',
        'Revenue, Costs, Profits, Metrics',
        'Tables and structured data',
        'Document metadata and complexity analysis'
      ]
    }
  }
}

export const structuredDataExtractionService = new StructuredDataExtractionService()