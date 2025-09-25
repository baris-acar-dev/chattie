'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  XMarkIcon,
  StarIcon,
  TagIcon,
  UserIcon,
  GlobeAltIcon,
  SparklesIcon
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
  userId?: string
  user?: {
    name: string
    email: string
  }
}

interface PromptTemplateManagerProps {
  userId: string
  selectedTemplate?: PromptTemplate | null
  onTemplateSelect: (template: PromptTemplate | null) => void
  onClose?: () => void
}

export default function PromptTemplateManager({ 
  userId, 
  selectedTemplate, 
  onTemplateSelect, 
  onClose 
}: PromptTemplateManagerProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

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

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/prompt-templates?id=${templateId}&userId=${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadTemplates()
        if (selectedTemplate?.id === templateId) {
          onTemplateSelect(null)
        }
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const handleTemplateCreated = async (template: PromptTemplate) => {
    await loadTemplates()
    setShowCreateModal(false)
    setEditingTemplate(null)
  }

  // Get all unique tags
  const allTags = Array.from(new Set(templates.flatMap(t => t.tags)))

  // Separate user's own templates from public/default templates
  const userTemplates = templates.filter(template => template.userId === userId && !template.isDefault)
  const publicTemplates = templates.filter(template => template.isDefault || template.isPublic)

  // Filter user templates
  const filteredUserTemplates = userTemplates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => template.tags.includes(tag))

    return matchesSearch && matchesTags
  })

  // Filter public templates
  const filteredPublicTemplates = publicTemplates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => template.tags.includes(tag))

    return matchesSearch && matchesTags
  })

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <SparklesIcon className="w-6 h-6 mr-2 text-purple-600 dark:text-purple-400" />
            AI Personas
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage AI personalities for different use cases and conversations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Persona
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search templates by name, description, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tag Filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Filter by tags:</span>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTags(prev => 
                  prev.includes(tag) 
                    ? prev.filter(t => t !== tag)
                    : [...prev, tag]
                )}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Templates Display */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
          {/* User's Personas Section */}
          {filteredUserTemplates.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <UserIcon className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Your Personas ({filteredUserTemplates.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUserTemplates.map((template: PromptTemplate) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white dark:bg-gray-800 border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedTemplate?.id === template.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                    }`}
                    onClick={() => onTemplateSelect(template)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {template.name}
                        </h4>
                        {template.isPublic && (
                          <GlobeAltIcon className="w-4 h-4 text-blue-500" title="Public persona" />
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingTemplate(template)
                            setShowCreateModal(true)
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTemplate(template.id)
                          }}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {template.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    {/* Role Preview */}
                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-3 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span className="font-medium">Role: </span>
                      {template.role.length > 80 ? template.role.substring(0, 80) + '...' : template.role}
                    </div>

                    {/* Tags */}
                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.tags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                            +{template.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                      <div className="flex items-center space-x-1">
                        <StarIcon className="w-3 h-3" />
                        <span>{template.usageCount} uses</span>
                      </div>
                      
                      {(template.temperature !== undefined || template.maxTokens !== undefined) && (
                        <div className="text-xs text-gray-400">
                          {template.temperature !== undefined && `T: ${template.temperature}`}
                          {template.temperature !== undefined && template.maxTokens !== undefined && ' • '}
                          {template.maxTokens !== undefined && `Max: ${template.maxTokens}`}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Public/Default Personas Section */}
          {filteredPublicTemplates.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <GlobeAltIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Public Personas ({filteredPublicTemplates.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPublicTemplates.map((template: PromptTemplate) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white dark:bg-gray-800 border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedTemplate?.id === template.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                    }`}
                    onClick={() => onTemplateSelect(template)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {template.name}
                        </h4>
                        {template.isDefault && (
                          <StarIconSolid className="w-4 h-4 text-yellow-500" title="Default persona" />
                        )}
                        {template.isPublic && !template.isDefault && (
                          <GlobeAltIcon className="w-4 h-4 text-blue-500" title="Public persona" />
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {template.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}

                    {/* Role Preview */}
                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-3 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span className="font-medium">Role: </span>
                      {template.role.length > 80 ? template.role.substring(0, 80) + '...' : template.role}
                    </div>

                    {/* Tags */}
                    {template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.tags.slice(0, 3).map((tag: string) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                            +{template.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                      <div className="flex items-center space-x-3">
                        {template.user && !template.isDefault && (
                          <div className="flex items-center space-x-1">
                            <UserIcon className="w-3 h-3" />
                            <span>{template.user.name}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <StarIcon className="w-3 h-3" />
                          <span>{template.usageCount} uses</span>
                        </div>
                      </div>
                      
                      {(template.temperature !== undefined || template.maxTokens !== undefined) && (
                        <div className="text-xs text-gray-400">
                          {template.temperature !== undefined && `T: ${template.temperature}`}
                          {template.temperature !== undefined && template.maxTokens !== undefined && ' • '}
                          {template.maxTokens !== undefined && `Max: ${template.maxTokens}`}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {(filteredUserTemplates.length === 0 && filteredPublicTemplates.length === 0) && !isLoading && (
        <div className="text-center py-12">
          <SparklesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No personas found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {searchTerm || selectedTags.length > 0 
              ? 'Try adjusting your search or filters'
              : 'Create your first persona to get started'
            }
          </p>
          {!searchTerm && selectedTags.length === 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Your First Persona
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <PromptTemplateForm
            userId={userId}
            template={editingTemplate}
            onClose={() => {
              setShowCreateModal(false)
              setEditingTemplate(null)
            }}
            onSave={handleTemplateCreated}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// Separate component for the create/edit form
function PromptTemplateForm({ 
  userId, 
  template, 
  onClose, 
  onSave 
}: {
  userId: string
  template?: PromptTemplate | null
  onClose: () => void
  onSave: (template: PromptTemplate) => void
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    role: template?.role || '',
    inputFormat: template?.inputFormat || '',
    outputFormat: template?.outputFormat || '',
    tags: template?.tags.join(', ') || '',
    isPublic: template?.isPublic || false,
    temperature: template?.temperature ?? 0.7,
    maxTokens: template?.maxTokens ?? 2048
  })
  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.role.trim()) return

    setIsSaving(true)
    try {
      const payload: any = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        userId
      }

      const url = template ? '/api/prompt-templates' : '/api/prompt-templates'
      const method = template ? 'PUT' : 'POST'
      
      if (template) {
        payload.id = template.id
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        onSave(data.template)
      }
    } catch (error) {
      console.error('Error saving template:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {template ? 'Edit Template' : 'Create New Template'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Creative Writing Assistant"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., creative, writing, storytelling"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Brief description of what this template does"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              System Role/Persona *
            </label>
            <textarea
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., You are a creative writing assistant who helps users craft engaging stories..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Input Format Instructions
              </label>
              <textarea
                value={formData.inputFormat}
                onChange={(e) => setFormData(prev => ({ ...prev, inputFormat: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Instructions for how users should format their input..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Output Format Instructions
              </label>
              <textarea
                value={formData.outputFormat}
                onChange={(e) => setFormData(prev => ({ ...prev, outputFormat: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Instructions for how the AI should format responses..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Temperature
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.temperature}
                onChange={(e) => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Tokens
              </label>
              <input
                type="number"
                min="1"
                max="8192"
                value={formData.maxTokens}
                onChange={(e) => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Make Public</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !formData.name.trim() || !formData.role.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
