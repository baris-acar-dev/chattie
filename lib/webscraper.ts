import axios from 'axios'
import * as cheerio from 'cheerio'
import { prisma } from './prisma'

export interface ScrapedContent {
  url: string
  title: string
  content: string
  metadata?: {
    description?: string
    keywords?: string[]
    author?: string
    publishedDate?: string
  }
}

class WebScraperService {
  private async fetchWithAxios(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        },
        timeout: 10000,
      })
      return response.data
    } catch (error) {
      console.error('Error fetching URL with axios:', error)
      throw new Error(`Failed to fetch URL: ${url}`)
    }
  }

  private extractContent(html: string, url: string): ScrapedContent {
    const $ = cheerio.load(html)
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads, .social-share').remove()
    
    // Extract title
    const title = $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  $('meta[property="og:title"]').attr('content') || 
                  'Untitled'
    
    // Extract main content
    let content = ''
    
    // Try to find main content area
    const contentSelectors = [
      'main',
      'article',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '#content',
      '.main-content'
    ]
    
    for (const selector of contentSelectors) {
      const element = $(selector)
      if (element.length && element.text().trim().length > content.length) {
        content = element.text().trim()
      }
    }
    
    // Fallback to body if no specific content area found
    if (!content || content.length < 100) {
      content = $('body').text().trim()
    }
    
    // Clean up content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    
    // Extract metadata
    const metadata = {
      description: $('meta[name="description"]').attr('content') || 
                   $('meta[property="og:description"]').attr('content'),
      keywords: $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()),
      author: $('meta[name="author"]').attr('content') || 
              $('meta[property="article:author"]').attr('content'),
      publishedDate: $('meta[property="article:published_time"]').attr('content') ||
                     $('meta[name="date"]').attr('content')
    }
    
    return {
      url,
      title,
      content: content.substring(0, 10000), // Limit content length
      metadata
    }
  }

  async scrapeUrl(url: string, useCache: boolean = true): Promise<ScrapedContent> {
    // Check cache first
    if (useCache) {
      const cached = await prisma.webCache.findUnique({
        where: { url }
      })
      
      if (cached) {
        const cacheAge = Date.now() - cached.updatedAt.getTime()
        const oneHour = 60 * 60 * 1000
        
        if (cacheAge < oneHour) {
          return {
            url: cached.url,
            title: cached.title || 'Untitled',
            content: cached.content,
            metadata: cached.metadata as any
          }
        }
      }
    }
    
    // Fetch and scrape
    const html = await this.fetchWithAxios(url)
    const scrapedContent = this.extractContent(html, url)
    
    // Cache the result
    try {
      await prisma.webCache.upsert({
        where: { url },
        update: {
          content: scrapedContent.content,
          title: scrapedContent.title,
          metadata: scrapedContent.metadata as any,
          updatedAt: new Date()
        },
        create: {
          url,
          content: scrapedContent.content,
          title: scrapedContent.title,
          metadata: scrapedContent.metadata as any
        }
      })
    } catch (error) {
      console.error('Error caching scraped content:', error)
    }
    
    return scrapedContent
  }

  async scrapeMultipleUrls(urls: string[], useCache: boolean = true): Promise<ScrapedContent[]> {
    const results = await Promise.allSettled(
      urls.map(url => this.scrapeUrl(url, useCache))
    )
    
    return results
      .filter((result): result is PromiseFulfilledResult<ScrapedContent> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value)
  }

  isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
  extractUrlsFromText(text: string): string[] {
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
    const matches = text.match(urlRegex)
    return matches ? Array.from(new Set(matches)) : []
  }
}

export const webScraperService = new WebScraperService()
