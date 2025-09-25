'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SparklesIcon,
  ChevronDownIcon,
  StarIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

interface PromptTemplate {
  id: string
  name: string
  description: string | null
  role: string
  inputFormat: string | null
  outputFormat: string | null
  examples: any | null
  tags: string[]
  isDefault: boolean
  isPublic: boolean
  isActive: boolean
  usageCount: number
  temperature: number | null
  maxTokens: number | null
  user?: {
    name: string
    email: string
  }
}

interface TemplateSelectProps {
  userId: string
  selectedTemplate: PromptTemplate | null
  onTemplateChange: (template: PromptTemplate | null) => void
  disabled?: boolean
}

export default function TemplateSelector({ 
  userId, 
  selectedTemplate, 
  onTemplateChange, 
  disabled = false 
}: TemplateSelectProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [userId])

  const loadTemplates = async () => {
    try {
      const response = await fetch(`/api/prompt-templates?userId=${userId}`)
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateSelect = (template: PromptTemplate) => {
    onTemplateChange(template)
    setIsOpen(false)
    
    // Update usage count
    fetch(`/api/prompt-templates/${template.id}/usage`, {
      method: 'POST'
    }).catch(console.error)
  }

  const clearTemplate = () => {
    onTemplateChange(null)
    setIsOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
        <span>Loading templates...</span>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Selected Template Display */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition-colors ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-50 dark:hover:bg-gray-600'
        } ${
          selectedTemplate 
            ? 'text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/20' 
            : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          <SparklesIcon className="w-4 h-4 flex-shrink-0" />
          {selectedTemplate ? (
            <div className="flex items-center space-x-2 min-w-0">
              <span className="font-medium truncate">{selectedTemplate.name}</span>
              {selectedTemplate.isDefault && (
                <StarIconSolid className="w-3 h-3 text-yellow-500 flex-shrink-0" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  clearTemplate()
                }}
                className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">Select behavior template...</span>
          )}
        </div>
        <ChevronDownIcon className={`w-4 h-4 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Template Details (when selected) */}
      {selectedTemplate && (
        <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-md">
          <div className="text-xs text-purple-700 dark:text-purple-300">
            <div className="font-medium mb-1">Active Template: {selectedTemplate.name}</div>
            {selectedTemplate.description && (
              <div className="text-purple-600 dark:text-purple-400 mb-2">{selectedTemplate.description}</div>
            )}
            <div className="text-purple-600 dark:text-purple-400">
              <span className="font-medium">Role:</span> {selectedTemplate.role.length > 100 ? selectedTemplate.role.substring(0, 100) + '...' : selectedTemplate.role}
            </div>
            {selectedTemplate.inputFormat && (
              <div className="mt-1 text-purple-600 dark:text-purple-400">
                <span className="font-medium">Input:</span> {selectedTemplate.inputFormat.length > 80 ? selectedTemplate.inputFormat.substring(0, 80) + '...' : selectedTemplate.inputFormat}
              </div>
            )}
            {selectedTemplate.outputFormat && (
              <div className="mt-1 text-purple-600 dark:text-purple-400">
                <span className="font-medium">Output:</span> {selectedTemplate.outputFormat.length > 80 ? selectedTemplate.outputFormat.substring(0, 80) + '...' : selectedTemplate.outputFormat}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-y-auto"
          >
            {/* Clear option */}
            <button
              onClick={clearTemplate}
              className="w-full px-3 py-2 text-left text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-center space-x-2">
                <XMarkIcon className="w-4 h-4" />
                <span>No template (default behavior)</span>
              </div>
            </button>

            {/* Templates */}
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className={`w-full px-3 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                  selectedTemplate?.id === template.id 
                    ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium truncate">{template.name}</span>
                      {template.isDefault && (
                        <StarIconSolid className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                      )}
                      {!template.isDefault && template.user && (
                        <UserIcon className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    
                    {template.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-clamp-2">
                        {template.description}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {template.role.length > 60 ? template.role.substring(0, 60) + '...' : template.role}
                    </div>
                    
                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {template.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-500 rounded">
                            +{template.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-400 ml-2">
                    {(template.temperature !== undefined || template.maxTokens !== undefined) && (
                      <div className="text-right">
                        {template.temperature !== undefined && (
                          <div>T: {template.temperature}</div>
                        )}
                        {template.maxTokens !== undefined && (
                          <div>Max: {template.maxTokens}</div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <StarIcon className="w-3 h-3" />
                      <span>{template.usageCount}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {templates.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                <SparklesIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <div>No templates available</div>
                <div className="text-xs mt-1">Create templates in the Template Manager</div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
