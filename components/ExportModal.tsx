'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon, 
  DocumentArrowDownIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  DocumentIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  conversationId: string
  conversationTitle: string
}

export default function ExportModal({ 
  isOpen, 
  onClose, 
  conversationId, 
  conversationTitle 
}: ExportModalProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'markdown' | 'text'>('markdown')

  const exportFormats = [
    {
      id: 'markdown' as const,
      name: 'Markdown',
      description: 'Rich text format with formatting preserved',
      icon: DocumentTextIcon,
      extension: '.md',
      recommended: true
    },
    {
      id: 'text' as const,
      name: 'Plain Text',
      description: 'Simple text format for universal compatibility',
      icon: DocumentIcon,
      extension: '.txt',
      recommended: false
    },
    {
      id: 'json' as const,
      name: 'JSON',
      description: 'Structured data format for developers',
      icon: CodeBracketIcon,
      extension: '.json',
      recommended: false
    }
  ]

  const handleExport = async () => {
    if (isExporting) return

    try {
      setIsExporting(true)
      
      const response = await fetch(`/api/conversations/${conversationId}/export?format=${selectedFormat}`)
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filenameMatch = contentDisposition?.match(/filename="([^"]*)"/)
      const filename = filenameMatch ? filenameMatch[1] : `conversation.${selectedFormat}`

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Conversation exported as ${selectedFormat.toUpperCase()}`)
      onClose()
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export conversation')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <DocumentArrowDownIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Export Conversation
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Conversation: {conversationTitle || 'Untitled'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Choose the format you'd like to export your conversation in:
                  </p>
                </div>

                {/* Format Selection */}
                <div className="space-y-3 mb-6">
                  {exportFormats.map((format) => {
                    const Icon = format.icon
                    return (
                      <label
                        key={format.id}
                        className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedFormat === format.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="format"
                          value={format.id}
                          checked={selectedFormat === format.id}
                          onChange={(e) => setSelectedFormat(e.target.value as any)}
                          className="sr-only"
                        />
                        <div className="flex items-start space-x-3 flex-1">
                          <Icon className={`w-5 h-5 mt-0.5 ${
                            selectedFormat === format.id
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-400'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className={`font-medium ${
                                selectedFormat === format.id
                                  ? 'text-blue-900 dark:text-blue-100'
                                  : 'text-gray-900 dark:text-gray-100'
                              }`}>
                                {format.name}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {format.extension}
                              </span>
                              {format.recommended && (
                                <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className={`text-sm mt-1 ${
                              selectedFormat === format.id
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {format.description}
                            </p>
                          </div>
                        </div>
                        {selectedFormat === format.id && (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        )}
                      </label>
                    )
                  })}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                  >
                    {isExporting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        <span>Export</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}