import { NextRequest, NextResponse } from 'next/server'
import { webScraperService } from '@/lib/webscraper'

export async function POST(request: NextRequest) {
  try {
    const { url, useCache = true } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    if (!webScraperService.isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const scrapedContent = await webScraperService.scrapeUrl(url, useCache)
    
    return NextResponse.json({ 
      success: true, 
      data: scrapedContent 
    })
  } catch (error) {
    console.error('Error scraping URL:', error)
    return NextResponse.json(
      { error: 'Failed to scrape URL' },
      { status: 500 }
    )
  }
}
