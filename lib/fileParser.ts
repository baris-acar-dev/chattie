import pdfjsLib from 'pdf-parse'
import * as mammoth from 'mammoth'
import * as ExcelJS from 'exceljs'

export interface ParsedDocument {
  content: string
  metadata: {
    fileName: string
    fileType: string
    pages?: number
    sheets?: string[]
    [key: string]: any
  }
}

export class FileParserService {  // Helper function to safely parse dates from PDF metadata
  private safeParsePDFDate(dateString: any): string | undefined {
    if (!dateString) return undefined
    
    try {
      // Handle different date formats that might come from PDF metadata
      let dateValue: Date
      
      // If it's already a Date object, use it directly
      if (dateString instanceof Date) {
        dateValue = dateString
      }
      // Handle PDF date format: D:YYYYMMDDHHmmSSOHH'mm'
      else if (typeof dateString === 'string' && dateString.startsWith('D:')) {
        const cleanDateString = dateString.substring(2, 16) // Extract YYYYMMDDHHMMSS
        const year = parseInt(cleanDateString.substring(0, 4))
        const month = parseInt(cleanDateString.substring(4, 6)) - 1 // Month is 0-indexed
        const day = parseInt(cleanDateString.substring(6, 8))
        const hour = parseInt(cleanDateString.substring(8, 10)) || 0
        const minute = parseInt(cleanDateString.substring(10, 12)) || 0
        const second = parseInt(cleanDateString.substring(12, 14)) || 0
        
        dateValue = new Date(year, month, day, hour, minute, second)
      }
      // Handle standard date strings
      else {
        dateValue = new Date(dateString)
      }
      
      // Check if the date is valid
      if (isNaN(dateValue.getTime())) {
        console.warn(`Invalid PDF date: ${dateString}`)
        return undefined
      }
      
      return dateValue.toISOString()
    } catch (error) {
      console.warn(`Failed to parse PDF date: ${dateString}`, error)
      return undefined
    }
  }

  /**
   * Parse various file types and extract text content
   */
  async parseFile(file: File): Promise<ParsedDocument> {
    const fileName = file.name
    const fileType = this.getFileType(fileName)
    
    switch (fileType) {
      case 'pdf':
        return await this.parsePDF(file)
      case 'docx':
        return await this.parseDOCX(file)
      case 'xlsx':
      case 'xls':
        return await this.parseExcel(file)
      case 'txt':
        return await this.parseText(file)
      default:
        throw new Error(`Unsupported file type: ${fileType}`)
    }
  }
  /**
   * Parse PDF files
   */
  private async parsePDF(file: File): Promise<ParsedDocument> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      // Use Buffer.from instead of deprecated Buffer() constructor
      const buffer = Buffer.from(arrayBuffer)
      
      const data = await pdfjsLib(buffer, {
        // Add options for better PDF parsing
        max: 0, // No limit on pages
        version: 'v1.10.100' // Specify version for stability
      })
      
      // Clean up the extracted text
      const cleanedText = data.text
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/\n\s*\n/g, '\n\n') // Keep paragraph breaks
        .trim()
      
      return {        content: cleanedText,
        metadata: {
          fileName: file.name,
          fileType: 'pdf',
          pages: data.numpages,
          title: data.info?.Title || file.name,
          author: data.info?.Author || undefined,
          subject: data.info?.Subject || undefined,
          creator: data.info?.Creator || undefined,
          producer: data.info?.Producer || undefined,
          creationDate: this.safeParsePDFDate(data.info?.CreationDate),
          modificationDate: this.safeParsePDFDate(data.info?.ModDate),
          wordCount: cleanedText.split(/\s+/).length,
          characterCount: cleanedText.length,
        }
      }    } catch (error) {
      console.error('Error parsing PDF:', error)
      console.error('PDF file info:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      })
      
      // More specific error messages for different types of failures
      if (error instanceof Error) {
        if (error.message.includes('Invalid time value')) {
          throw new Error(`Failed to parse PDF file: Invalid date metadata in PDF. This can happen with some PDF creators like LibreOffice. The file content was processed but date metadata was skipped.`)
        } else if (error.message.includes('Invalid PDF')) {
          throw new Error(`Failed to parse PDF file: The file appears to be corrupted or not a valid PDF format.`)
        } else {
          throw new Error(`Failed to parse PDF file: ${error.message}`)
        }
      } else {
        throw new Error(`Failed to parse PDF file: Unknown error occurred during processing`)
      }
    }
  }

  /**
   * Parse DOCX files
   */
  private async parseDOCX(file: File): Promise<ParsedDocument> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      
      return {
        content: result.value,
        metadata: {
          fileName: file.name,
          fileType: 'docx',
          messages: result.messages?.length > 0 ? result.messages : undefined,
        }
      }
    } catch (error) {
      console.error('Error parsing DOCX:', error)
      throw new Error('Failed to parse DOCX file')
    }
  }

  /**
   * Parse Excel files (XLSX/XLS)
   */
  private async parseExcel(file: File): Promise<ParsedDocument> {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(arrayBuffer)
      
      let content = ''
      const sheets: string[] = []
      
      workbook.eachSheet((worksheet, sheetId) => {
        const sheetName = worksheet.name
        sheets.push(sheetName)
        
        content += `\n\n=== Sheet: ${sheetName} ===\n`
        
        worksheet.eachRow((row, rowNumber) => {
          const rowData: string[] = []
          row.eachCell((cell, colNumber) => {
            const cellValue = cell.value?.toString() || ''
            if (cellValue.trim()) {
              rowData.push(cellValue.trim())
            }
          })
          
          if (rowData.length > 0) {
            content += `Row ${rowNumber}: ${rowData.join(' | ')}\n`
          }
        })
      })
      
      return {
        content: content.trim(),
        metadata: {
          fileName: file.name,
          fileType: this.getFileType(file.name),
          sheets,
          totalSheets: sheets.length,
        }
      }
    } catch (error) {
      console.error('Error parsing Excel:', error)
      throw new Error('Failed to parse Excel file')
    }
  }

  /**
   * Parse text files
   */
  private async parseText(file: File): Promise<ParsedDocument> {
    try {
      const text = await file.text()
      
      return {
        content: text,
        metadata: {
          fileName: file.name,
          fileType: 'txt',
          size: file.size,
        }
      }
    } catch (error) {
      console.error('Error parsing text file:', error)
      throw new Error('Failed to parse text file')
    }
  }

  /**
   * Determine file type from filename
   */
  private getFileType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop()
    return extension || 'unknown'
  }

  /**
   * Get supported file types
   */
  getSupportedTypes(): string[] {
    return ['pdf', 'docx', 'xlsx', 'xls', 'txt']
  }

  /**
   * Check if file type is supported
   */
  isSupported(fileName: string): boolean {
    const fileType = this.getFileType(fileName)
    return this.getSupportedTypes().includes(fileType)
  }
}

export const fileParserService = new FileParserService()
