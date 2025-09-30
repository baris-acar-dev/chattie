'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  PaperAirplaneIcon, 
  PlusIcon, 
  Cog6ToothIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  BookOpenIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import ModelSelector from './ModelSelector'
import ConversationList from './ConversationList'
import MessageList from './MessageList'
import PreferencesModal from './PreferencesModal'
import ThemeToggle from './ThemeToggle'
import DocumentSelector from './DocumentSelector'
import PersonaSelector from './PersonaSelector'
import PromptTemplateManager from './PromptTemplateManager'
import RAGManager from './RAGManager'
import { UserMenu } from './UserMenu'

interface Model {
  name: string
  provider: 'ollama' | 'gemini'
  displayName?: string
  size?: number
}

interface User {
  id: string
  name: string
  email: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  metadata?: any
}

interface Folder {
  id: string
  name: string
  userId: string
  color?: string
  createdAt: string
  updatedAt: string
}

interface Conversation {
  id: string
  title: string
  model: string
  folderId?: string
  createdAt: string
  updatedAt: string
  messages: Message[]
  folder?: Folder
}

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
  createdAt: Date
  updatedAt: Date
}

interface ChatInterfaceProps {
  user: User
}

export default function ChatInterface({ user }: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<string>('llama2')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [webScrapingEnabled, setWebScrapingEnabled] = useState(true)
  const [ragEnabled, setRagEnabled] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [showTemplateManager, setShowTemplateManager] = useState(false)
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false)
  const [documentRefreshTrigger, setDocumentRefreshTrigger] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadModels()
    loadConversations()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages])
  const handleTemplateChange = (template: any) => {
    setSelectedTemplate(template)
  }

  const handleDocumentsUpdated = () => {
    // Trigger refresh of DocumentSelector
    setDocumentRefreshTrigger(prev => prev + 1)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadModels = async () => {
    try {
      const response = await fetch(`/api/models?userId=${user.id}`)
      const data = await response.json()
      setModels(data.models || [])
      
      if (data.models?.length > 0) {
        setSelectedModel(data.models[0].name)
      }
    } catch (error) {
      console.error('Error loading models:', error)
      toast.error('Failed to load AI models')
    }
  }

  const handlePreferencesUpdate = async () => {
    // Reload models when preferences are updated (e.g., new API key added)
    await loadModels()
    toast.success('Preferences updated successfully')
  }

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversations')
    }
  }

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Conversation',
          model: selectedModel
        })
      })
      
      const data = await response.json()
      const newConversation = { ...data.conversation, messages: [] }
      
      setConversations(prev => [newConversation, ...prev])
      setCurrentConversation(newConversation)
      toast.success('New conversation created')
    } catch (error) {
      console.error('Error creating conversation:', error)
      toast.error('Failed to create conversation')
    }
  }

  const selectConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`)
      const data = await response.json()
      setCurrentConversation(data.conversation)
      setSelectedModel(data.conversation.model)
    } catch (error) {
      console.error('Error loading conversation:', error)
      toast.error('Failed to load conversation')
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE'
      })
      
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
      }
      
      toast.success('Conversation deleted')
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast.error('Failed to delete conversation')
    }
  }
  const sendMessage = async () => {
    if (!message.trim() || isLoading) return

    const messageText = message.trim()
    setMessage('')
    setIsLoading(true)

    // Add user message immediately
    const userMessage = {
      id: `temp-user-${Date.now()}`,
      role: 'user' as const,
      content: messageText,
      createdAt: new Date().toISOString(),
      metadata: {}
    }

    if (currentConversation) {
      setCurrentConversation(prev => ({
        ...prev!,
        messages: [...prev!.messages, userMessage]
      }))
    }

    try {      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          conversationId: currentConversation?.id,
          userId: user.id,
          model: selectedModel,
          webScrapingEnabled,
          ragEnabled,
          selectedDocuments,
          promptTemplateId: selectedTemplate?.id || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      if (!data.message) {
        throw new Error('Invalid response format from server')
      }

      if (!currentConversation) {
        // If no current conversation, load the new one
        await selectConversation(data.conversationId)
        await loadConversations()
      } else {
        // Add AI response to current conversation
        setCurrentConversation(prev => ({
          ...prev!,
          messages: [
            ...prev!.messages,
            {
              id: data.message.id || `temp-assistant-${Date.now()}`,
              role: data.message.role || 'assistant' as const,
              content: data.message.content || '',
              createdAt: data.message.createdAt || new Date().toISOString(),
              metadata: data.message.metadata || {}
            }
          ]
        }))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="fixed md:static top-0 left-0 h-full w-80 md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-50"
          >            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Chattie</h1>
                <button
                  onClick={createNewConversation}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>
              
              <ModelSelector
                models={models}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            </div>

            {/* Conversations */}
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={conversations}
                currentConversation={currentConversation}
                userId={user.id}
                onSelectConversation={selectConversation}
                onDeleteConversation={deleteConversation}
                onConversationUpdated={loadConversations}
              />
            </div>            {/* User info */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
            {currentConversation?.title || 'Chattie'}
          </h1>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>

        {/* Mobile Controls Panel */}
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Settings</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPreferencesOpen(true)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Cog6ToothIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowKnowledgeBase(true)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Manage Knowledge Base"
                >
                  <BookOpenIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <PersonaSelector
                    selectedPersona={selectedTemplate}
                    onPersonaChange={handleTemplateChange}
                    userId={user.id}
                  />
                </div>
                <button
                  onClick={() => setShowTemplateManager(true)}
                  className="flex items-center justify-center w-10 h-10 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
                  title="Manage Personas"
                >
                  <SparklesIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => setWebScrapingEnabled(!webScrapingEnabled)}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                      webScrapingEnabled 
                        ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' 
                        : 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={webScrapingEnabled ? "Web Scraping: ON" : "Web Scraping: OFF"}
                  >
                    <GlobeAltIcon className="w-5 h-5" />
                  </button>
                  {webScrapingEnabled && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                  )}
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setRagEnabled(!ragEnabled)}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                      ragEnabled 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                        : 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={ragEnabled ? "Knowledge Base: ON" : "Knowledge Base: OFF"}
                  >
                    <BookOpenIcon className="w-5 h-5" />
                  </button>
                  {ragEnabled && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                  )}
                </div>
              </div>

              {ragEnabled && (
                <div className="mt-3">
                  <DocumentSelector
                    selectedDocuments={selectedDocuments}
                    onSelectionChange={setSelectedDocuments}
                    onDocumentsLoaded={(documents) => {
                      if (documents.length > 0 && !ragEnabled) {
                        toast('💡 Documents found! Enable Knowledge Base to use them in your chat.', {
                          duration: 4000,
                          icon: '📚'
                        })
                      }
                    }}
                    disabled={isLoading}
                    refreshTrigger={documentRefreshTrigger}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Header with Controls */}
        <div className="hidden md:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChatBubbleLeftIcon className="w-5 h-5" />
              </button>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {currentConversation?.title || 'Select a conversation'}
                </h2>
                {currentConversation && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Model: {currentConversation.model}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTemplateManager(true)}
                className="flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 px-2 py-1 rounded-md transition-colors"
                title="Manage Personas"
              >
                <SparklesIcon className="w-4 h-4" />
                <span>Manage Personas</span>
              </button>
              <button
                onClick={() => setShowKnowledgeBase(true)}
                className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-2 py-1 rounded-md transition-colors"
                title="Manage Knowledge Base"
              >
                <BookOpenIcon className="w-4 h-4" />
                <span>Knowledge Base</span>
              </button>
              <button
                onClick={() => setPreferencesOpen(true)}
                className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-2 py-1 rounded-md transition-colors"
                title="Preferences"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                <span>Preferences</span>
              </button>
              <ThemeToggle />
              <UserMenu className="ml-2" />
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <PersonaSelector
                selectedPersona={selectedTemplate}
                onPersonaChange={handleTemplateChange}
                userId={user.id}
              />
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => setWebScrapingEnabled(!webScrapingEnabled)}
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                      webScrapingEnabled 
                        ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' 
                        : 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={webScrapingEnabled ? "Web Scraping: ON" : "Web Scraping: OFF"}
                  >
                    <GlobeAltIcon className="w-4 h-4" />
                  </button>
                  {webScrapingEnabled && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-900"></div>
                  )}
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setRagEnabled(!ragEnabled)}
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                      ragEnabled 
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                        : 'text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={ragEnabled ? "Knowledge Base: ON" : "Knowledge Base: OFF"}
                  >
                    <BookOpenIcon className="w-4 h-4" />
                  </button>
                  {ragEnabled && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white dark:border-gray-900"></div>
                  )}
                </div>
              </div>
            </div>

            {ragEnabled && (
              <div className="max-w-xs">
                <DocumentSelector
                  selectedDocuments={selectedDocuments}
                  onSelectionChange={setSelectedDocuments}
                  onDocumentsLoaded={(documents) => {
                    if (documents.length > 0 && !ragEnabled) {
                      toast('💡 Documents found! Enable Knowledge Base to use them in your chat.', {
                        duration: 4000,
                        icon: '📚'
                      })
                    }
                  }}
                  disabled={isLoading}
                  refreshTrigger={documentRefreshTrigger}
                />
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {currentConversation ? (
            <MessageList 
              messages={currentConversation.messages} 
              isLoading={isLoading}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-4">
                <ChatBubbleLeftIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Welcome to Chattie!
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md text-sm md:text-base">
                  Start a new conversation or select an existing one to begin chatting with your local AI models.
                </p>
                <button
                  onClick={createNewConversation}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm md:text-base"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {currentConversation && (
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Type your message...${webScrapingEnabled ? ' (URLs will be automatically scraped)' : ''}${ragEnabled ? ' (Knowledge base will be consulted)' : ''}`}
                  className="w-full px-3 py-2 md:px-4 md:py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm md:text-base"
                  rows={2}
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || isLoading}
                  className="px-4 py-2 md:px-6 md:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[80px] text-sm md:text-base"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="w-4 h-4 md:w-5 md:h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preferences Modal */}
      <PreferencesModal
        user={user}
        isOpen={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        onPreferencesUpdate={handlePreferencesUpdate}
      />

      {/* Persona Manager Modal */}
      <AnimatePresence>
        {showTemplateManager && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg w-full h-full max-w-7xl max-h-[90vh] overflow-hidden"
            >
              <PromptTemplateManager
                userId={user.id}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateChange}
                onClose={() => setShowTemplateManager(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Knowledge Base Modal */}
      <AnimatePresence>
        {showKnowledgeBase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg w-full h-full max-w-7xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Knowledge Base Management
                </h2>
                <button
                  onClick={() => setShowKnowledgeBase(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="h-full overflow-auto">
                <RAGManager onDocumentsUpdated={handleDocumentsUpdated} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
