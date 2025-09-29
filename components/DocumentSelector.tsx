'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DocumentTextIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  CheckIcon 
} from '@heroicons/react/24/outline'

interface Document {
  id: string
  title: string
  source: string
  createdAt: string
  chunkCount: number
}

interface DocumentSelectorProps {
  selectedDocuments: string[]
  onSelectionChange: (documentIds: string[]) => void
  onDocumentsLoaded?: (documents: Document[]) => void
  disabled?: boolean
}

export default function DocumentSelector({ 
  selectedDocuments, 
  onSelectionChange, 
  onDocumentsLoaded,
  disabled = false 
}: DocumentSelectorProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const loadedDocuments = data.documents || []
      setDocuments(loadedDocuments)
      
      // Notify parent component about loaded documents
      if (onDocumentsLoaded) {
        onDocumentsLoaded(loadedDocuments)
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
      // Ensure we always have an empty array on error
      setDocuments([])
      if (onDocumentsLoaded) {
        onDocumentsLoaded([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDocumentToggle = (documentId: string) => {
    if (selectedDocuments.includes(documentId)) {
      onSelectionChange(selectedDocuments.filter(id => id !== documentId))
    } else {
      onSelectionChange([...selectedDocuments, documentId])
    }
  }

  const handleSelectAll = () => {
    if (selectedDocuments.length === documents.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(documents.map(doc => doc.id))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <DocumentTextIcon className="w-4 h-4 animate-pulse" />
        <span>Loading documents...</span>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
        <DocumentTextIcon className="w-4 h-4" />
        <span>No documents uploaded yet</span>
      </div>
    )
  }

  const selectedCount = selectedDocuments.length
  const totalCount = documents.length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="flex items-center justify-between w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {selectedCount === 0 
              ? 'Select documents' 
              : selectedCount === totalCount 
                ? 'All documents selected'
                : `${selectedCount} of ${totalCount} selected`
            }
          </span>
        </div>
        {isOpen ? (
          <ChevronUpIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDownIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-[60] max-h-64 overflow-y-auto"
          >
            {/* Select All Option */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSelectAll}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
              >
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {selectedCount === totalCount ? 'Deselect All' : 'Select All'}
                </span>
                {selectedCount === totalCount && (
                  <CheckIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                )}
              </button>
            </div>

            {/* Document List */}
            <div className="max-h-48 overflow-y-auto">
              {documents.map((document) => (
                <button
                  key={document.id}
                  onClick={() => handleDocumentToggle(document.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <DocumentTextIcon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300 truncate">
                        {document.title}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {document.chunkCount} chunks • {new Date(document.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {selectedDocuments.includes(document.id) && (
                    <CheckIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
