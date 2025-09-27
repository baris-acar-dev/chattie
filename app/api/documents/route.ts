import { NextRequest, NextResponse } from 'next/server'
import { ragService } from '@/lib/rag'
import { fileParserService } from '@/lib/fileParser'

export async function POST(request: NextRequest) {
  try {
    console.log('Document upload started...')
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string

    console.log('File details:', { name: file?.name, size: file?.size, type: file?.type })

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if file type is supported
    try {
      if (!fileParserService.isSupported(file.name)) {
        return NextResponse.json(
          { error: `Unsupported file type. Supported formats: ${fileParserService.getSupportedTypes().join(', ')}` },
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    } catch (serviceError) {
      console.error('File parser service error:', serviceError)
      return NextResponse.json(
        { error: 'File type validation failed', details: 'File parser service unavailable' },
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse file content
    console.log('Parsing file content...')
    let parsedDocument
    try {
      parsedDocument = await fileParserService.parseFile(file)
    } catch (parseError) {
      console.error('File parsing error:', parseError)
      
      // If it's a PDF parsing error, provide more specific guidance
      if (file.name.toLowerCase().endsWith('.pdf')) {
        return NextResponse.json(
          { 
            error: 'Failed to parse PDF file', 
            details: parseError instanceof Error ? parseError.message : 'PDF parsing library error',
            suggestion: 'Try converting the PDF to text or using a different PDF file. Some PDFs may be corrupted or use unsupported features.'
          },
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to parse file', 
          details: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        },
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    const fileName = title || parsedDocument.metadata.fileName || file.name
    console.log('File parsed successfully, content length:', parsedDocument.content.length)

    // Add document to knowledge base
    console.log('Adding document to RAG service...')
    const documentId = await ragService.addDocument(
      fileName,
      parsedDocument.content,
      `upload://${file.name}`,
      {
        type: 'uploaded_file',
        originalFileName: file.name,
        mimeType: file.type,
        ...parsedDocument.metadata
      },
      {
        extractStructuredData: true,
        model: 'basic'
      }
    )
    console.log('Document added successfully, ID:', documentId)

    return NextResponse.json({
      success: true,
      documentId,
      message: 'Document uploaded successfully'
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to upload document',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

export async function GET() {
  try {
    const documents = await ragService.listDocuments()

    return NextResponse.json({
      documents,
      count: documents.length
    })
  } catch (error) {
    console.error('Documents list error:', error)
    
    // Ensure we always return JSON, never HTML
    return NextResponse.json(
      { 
        error: 'Failed to list documents',
        details: error instanceof Error ? error.message : 'Unknown error',
        documents: [],
        count: 0
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }

    const success = await ragService.deleteDocument(documentId)

    if (!success) {
      return NextResponse.json(
        { error: 'Document not found or could not be deleted' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })
  } catch (error) {
    console.error('Document delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
