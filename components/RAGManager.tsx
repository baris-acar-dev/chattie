'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  DocumentTextIcon, 
  CloudArrowUpIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'

interface Document {
  id: string
  title: string
  source: string
  createdAt: string
  chunkCount: number
}

interface SearchResult {
  chunk: {
    id: string
    content: string
    metadata: {
      title: string
      source?: string
      chunkIndex: number
    }
  }
  similarity: number
  relevanceScore: number
}

interface RAGManagerProps {
  onDocumentsUpdated?: () => void
}

export default function RAGManager({ onDocumentsUpdated }: RAGManagerProps = {}) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [activeTab, setActiveTab] = useState<'documents' | 'search'>('documents')

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Failed to load documents:', error)
    }
  }
  const handleFileUpload = async (file: File) => {
    // Enhanced file validation
    const maxSize = 50 * 1024 * 1024 // 50MB limit
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                         'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                         'text/plain', 'text/markdown', 'application/json', 'text/csv']
    
    if (!file) {
      alert('Please select a file')
      return
    }

    if (file.size > maxSize) {
      alert('File too large. Maximum size is 50MB.')
      return
    }

    // Check file type by extension and MIME type
    const fileExtension = file.name.toLowerCase().split('.').pop()
    const supportedExtensions = ['pdf', 'docx', 'xlsx', 'xls', 'txt', 'md', 'json', 'csv']
    
    if (!fileExtension || !supportedExtensions.includes(fileExtension)) {
      alert(`Unsupported file type. Supported formats: ${supportedExtensions.map(ext => ext.toUpperCase()).join(', ')}`)
      return
    }

    // Special validation for PDF files
    if (fileExtension === 'pdf' && !file.type.includes('pdf')) {
      alert('Invalid PDF file format')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name)

      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type)

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      })

      console.log('Upload response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Upload error response:', errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const result = await response.json()
      console.log('Upload success:', result)

      if (result.success) {
        await loadDocuments()
        onDocumentsUpdated?.() // Notify parent component
        alert(`Document uploaded successfully! ${fileExtension.toUpperCase()} file processed and added to knowledge base.`)
      } else {
        alert(`Upload failed: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Network error or server unavailable'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return
    }

    try {
      const response = await fetch(`/api/documents?id=${documentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadDocuments()
        onDocumentsUpdated?.() // Notify parent component
        alert('Document deleted successfully!')
      } else {
        const error = await response.json()
        alert(`Delete failed: ${error.error}`)
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Delete failed')
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(`/api/rag?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      setSearchResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
          <BookOpenIcon className="w-6 h-6 mr-2 text-primary-600 dark:text-primary-400" />
          Knowledge Base Manager
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload documents and search through your knowledge base to enhance chat responses.
        </p>
      </div>      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <DocumentTextIcon className="w-4 h-4 inline mr-1" />
            Documents ({documents.length})
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <MagnifyingGlassIcon className="w-4 h-4 inline mr-1" />
            Search
          </button>
        </nav>
      </div>

      {activeTab === 'documents' && (        <div className="space-y-6">
          {/* Upload Section */}
          <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <CloudArrowUpIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Upload documents to add them to your knowledge base
            </p>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📄 Supported formats:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>PDF Documents</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span>Word Documents (.docx)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Excel Files (.xlsx, .xls)</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
                  <span>Text Files (.txt, .md, .csv)</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Maximum file size: 50MB
              </p>
            </div>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".txt,.md,.csv,.json,.pdf,.docx,.xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 cursor-pointer ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isUploading ? 'Uploading...' : 'Choose File'}
            </label>
          </div>

          {/* Documents List */}
          <div className="space-y-4">
            {documents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BookOpenIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Knowledge Base Yet</h3>
                <p className="text-gray-600 mb-6">Upload documents to create your AI knowledge base</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                  <h4 className="font-medium text-blue-900 mb-2">Supported formats:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• PDF documents</li>
                    <li>• Word documents (.docx)</li>
                    <li>• Excel files (.xlsx)</li>
                    <li>• Text files (.txt, .md)</li>
                  </ul>
                </div>
                <motion.label
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  <CloudArrowUpIcon className="w-5 h-5" />
                  <span>Upload Your First Document</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.xlsx,.xls,.txt,.md,.json,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                  />
                </motion.label>
              </div>
            ) : (
              documents.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.title}</h3>
                      <p className="text-sm text-gray-500">
                        {doc.chunkCount} chunks • {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete document"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-6">
          {/* Search Input */}
          <div className="flex space-x-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search your knowledge base..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results */}
          <div className="space-y-4">
            {searchResults.length === 0 ? (
              searchQuery ? (
                <div className="text-center py-8 text-gray-500">
                  <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No results found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Enter a search query to find relevant content</p>
                </div>
              )
            ) : (
              searchResults.map((result, index) => (
                <motion.div
                  key={result.chunk.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">
                      {result.chunk.metadata.title}
                    </h3>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {result.relevanceScore.toFixed(1)}% relevance
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {result.chunk.content.substring(0, 300)}
                    {result.chunk.content.length > 300 && '...'}
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    Chunk {result.chunk.metadata.chunkIndex + 1} • Source: {result.chunk.metadata.source}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
