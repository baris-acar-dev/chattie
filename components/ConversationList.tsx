'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrashIcon, 
  ChatBubbleLeftIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns'
import toast from 'react-hot-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

interface Conversation {
  id: string
  title: string
  model: string
  createdAt: string
  updatedAt: string
  messages: Message[]
}

interface ConversationListProps {
  conversations: Conversation[]
  currentConversation: Conversation | null
  userId: string
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
  onConversationUpdated?: () => void
}

export default function ConversationList({
  conversations,
  currentConversation,
  userId,
  onSelectConversation,
  onDeleteConversation,
  onConversationUpdated
}: ConversationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [groupByDate, setGroupByDate] = useState(true)

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations
    
    const query = searchQuery.toLowerCase()
    return conversations.filter(conv =>
      conv.title.toLowerCase().includes(query) ||
      conv.messages.some(msg => 
        msg.content.toLowerCase().includes(query)
      )
    )
  }, [conversations, searchQuery])

  // Group conversations by date
  const groupedConversations = useMemo(() => {
    if (!groupByDate) return { all: filteredConversations }
    
    const groups: { [key: string]: Conversation[] } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    }

    filteredConversations.forEach(conv => {
      const date = new Date(conv.updatedAt)
      if (isToday(date)) {
        groups.today.push(conv)
      } else if (isYesterday(date)) {
        groups.yesterday.push(conv)
      } else if (isThisWeek(date)) {
        groups.thisWeek.push(conv)
      } else {
        groups.older.push(conv)
      }
    })

    return groups
  }, [filteredConversations, groupByDate])

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const saveTitle = async (conversationId: string) => {
    if (!editTitle.trim() || isUpdating) return

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/conversations/${conversationId}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          userId
        })
      })

      if (response.ok) {
        toast.success('Conversation title updated!')
        setEditingId(null)
        setEditTitle('')
        onConversationUpdated?.()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update title')
      }
    } catch (error) {
      console.error('Error updating conversation title:', error)
      toast.error('Failed to update title')
    } finally {
      setIsUpdating(false)
    }
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <ChatBubbleLeftIcon className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs">Start a new conversation to get started</p>
      </div>
    )
  }

  const renderConversationGroup = (title: string, conversations: Conversation[], icon: React.ReactNode) => {
    if (conversations.length === 0) return null

    return (
      <div key={title} className="mb-4">
        <div className="flex items-center space-x-2 px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {icon}
          <span>{title}</span>
          <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs">
            {conversations.length}
          </span>
        </div>
        {conversations.map((conversation) => renderConversation(conversation))}
      </div>
    )
  }

  const renderConversation = (conversation: Conversation) => (
    <motion.div
      key={conversation.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative p-2 md:p-3 mx-2 rounded-lg cursor-pointer transition-colors ${
        currentConversation?.id === conversation.id
          ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
      onClick={() => onSelectConversation(conversation.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {editingId === conversation.id ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle(conversation.id)
                  if (e.key === 'Escape') cancelEditing()
                }}
                className="w-full text-sm font-medium bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Conversation title..."
                autoFocus
                disabled={isUpdating}
              />
              <div className="flex space-x-1">
                <button
                  onClick={() => saveTitle(conversation.id)}
                  disabled={isUpdating || !editTitle.trim()}
                  className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={isUpdating}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {conversation.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {conversation.model}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: true })}
              </p>
              {conversation.messages.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">
                  {conversation.messages[conversation.messages.length - 1]?.content}
                </p>
              )}
            </>
          )}
        </div>
        
        {editingId !== conversation.id && (
          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation()
                startEditing(conversation)
              }}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDeleteConversation(conversation.id)
              }}
              className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Search and filters */}
      <div className="p-2 md:p-3 border-b border-gray-200 dark:border-gray-700 space-y-3">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <button
            onClick={() => setGroupByDate(!groupByDate)}
            className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-1 rounded-md text-xs transition-colors ${
              groupByDate
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Group by date</span>
            <span className="sm:hidden">Group</span>
          </button>
          
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {filteredConversations.length} of {conversations.length}
          </span>
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {groupByDate ? (
            <div className="space-y-1 py-2">
              {renderConversationGroup('Today', groupedConversations.today, <ClockIcon className="w-4 h-4" />)}
              {renderConversationGroup('Yesterday', groupedConversations.yesterday, <ClockIcon className="w-4 h-4" />)}
              {renderConversationGroup('This Week', groupedConversations.thisWeek, <CalendarIcon className="w-4 h-4" />)}
              {renderConversationGroup('Older', groupedConversations.older, <CalendarIcon className="w-4 h-4" />)}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredConversations.map((conversation) => renderConversation(conversation))}
            </div>
          )}
        </AnimatePresence>
        
        {filteredConversations.length === 0 && searchQuery.trim() && (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <MagnifyingGlassIcon className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p className="text-sm">No conversations found</p>
            <p className="text-xs">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  )
}
