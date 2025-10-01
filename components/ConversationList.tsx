'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrashIcon, 
  ChatBubbleLeftIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
  PlusIcon,
  FolderPlusIcon,
  EllipsisVerticalIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns'
import toast from 'react-hot-toast'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [folders, setFolders] = useState<Folder[]>([])
  const [showNewFolderInput, setShowNewFolderInput] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState('')
  const [movingConversationId, setMovingConversationId] = useState<string | null>(null)

  const loadFolders = async () => {
    try {
      const response = await fetch(`/api/folders?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders || [])
      }
    } catch (error) {
      console.error('Error loading folders:', error)
    }
  }

  // Load folders on component mount
  useEffect(() => {
    if (userId) {
      loadFolders()
    }
  }, [userId])

  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          userId,
          color: ['blue', 'green', 'purple', 'red', 'yellow', 'indigo'][Math.floor(Math.random() * 6)]
        })
      })

      if (response.ok) {
        toast.success('Folder created!')
        setNewFolderName('')
        setShowNewFolderInput(false)
        await loadFolders()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create folder')
      }
    } catch (error) {
      console.error('Error creating folder:', error)
      toast.error('Failed to create folder')
    }
  }

  const updateFolder = async (folderId: string) => {
    if (!editingFolderName.trim()) return

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingFolderName.trim(),
          userId
        })
      })

      if (response.ok) {
        toast.success('Folder updated!')
        setEditingFolderId(null)
        setEditingFolderName('')
        await loadFolders()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update folder')
      }
    } catch (error) {
      console.error('Error updating folder:', error)
      toast.error('Failed to update folder')
    }
  }

  const deleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure? Conversations in this folder will be moved to "Uncategorized".')) return

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        toast.success('Folder deleted!')
        await loadFolders()
        onConversationUpdated?.()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete folder')
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
      toast.error('Failed to delete folder')
    }
  }

  const moveConversationToFolder = async (conversationId: string, folderId: string | null) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderId,
          userId
        })
      })

      if (response.ok) {
        toast.success('Conversation moved!')
        setMovingConversationId(null)
        onConversationUpdated?.()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to move conversation')
      }
    } catch (error) {
      console.error('Error moving conversation:', error)
      toast.error('Failed to move conversation')
    }
  }

  const toggleGroup = (groupKey: string) => {
    const newCollapsed = new Set(collapsedGroups)
    if (newCollapsed.has(groupKey)) {
      newCollapsed.delete(groupKey)
    } else {
      newCollapsed.add(groupKey)
    }
    setCollapsedGroups(newCollapsed)
  }

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

  // Group conversations by folder and date
  const groupedConversations = useMemo(() => {
    if (groupByDate) {
      // Group by date first, then by folder within each date group
      const dateGroups: { [key: string]: { [key: string]: Conversation[] } } = {
        today: { uncategorized: [], ...Object.fromEntries(folders.map(f => [f.id, []])) },
        yesterday: { uncategorized: [], ...Object.fromEntries(folders.map(f => [f.id, []])) },
        thisWeek: { uncategorized: [], ...Object.fromEntries(folders.map(f => [f.id, []])) },
        older: { uncategorized: [], ...Object.fromEntries(folders.map(f => [f.id, []])) }
      }

      filteredConversations.forEach(conv => {
        const date = new Date(conv.updatedAt)
        let dateGroup: string
        
        if (isToday(date)) {
          dateGroup = 'today'
        } else if (isYesterday(date)) {
          dateGroup = 'yesterday'
        } else if (isThisWeek(date)) {
          dateGroup = 'thisWeek'
        } else {
          dateGroup = 'older'
        }

        const folderId = conv.folderId || 'uncategorized'
        if (dateGroups[dateGroup][folderId]) {
          dateGroups[dateGroup][folderId].push(conv)
        } else {
          dateGroups[dateGroup]['uncategorized'].push(conv)
        }
      })

      return dateGroups
    } else {
      // Group by folder only
      const folderGroups: { [key: string]: Conversation[] } = {
        uncategorized: [],
        ...Object.fromEntries(folders.map(f => [f.id, []]))
      }

      filteredConversations.forEach(conv => {
        const folderId = conv.folderId || 'uncategorized'
        if (folderGroups[folderId]) {
          folderGroups[folderId].push(conv)
        } else {
          folderGroups['uncategorized'].push(conv)
        }
      })

      return { all: folderGroups }
    }
  }, [filteredConversations, groupByDate, folders])

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

  const renderConversationGroup = (title: string, conversations: Conversation[] | { [key: string]: Conversation[] }, icon: React.ReactNode, isDateGroup: boolean = false) => {
    const isCollapsed = collapsedGroups.has(title)
    
    // Handle both array and object formats
    let totalCount = 0
    let hasConversations = false
    
    if (Array.isArray(conversations)) {
      totalCount = conversations.length
      hasConversations = totalCount > 0
    } else {
      totalCount = Object.values(conversations).reduce((acc, convs) => acc + convs.length, 0)
      hasConversations = totalCount > 0
    }
    
    if (!hasConversations) return null

    return (
      <div key={title} className="mb-2">
        <button
          onClick={() => toggleGroup(title)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
        >
          <div className="flex items-center space-x-2">
            {isCollapsed ? (
              <ChevronRightIcon className="w-3 h-3" />
            ) : (
              <ChevronDownIcon className="w-3 h-3" />
            )}
            {icon}
            <span>{title}</span>
          </div>
          <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-2 py-0.5 text-xs">
            {totalCount}
          </span>
        </button>
        
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {Array.isArray(conversations) ? (
                <div className="ml-4 space-y-1">
                  {conversations.map((conversation) => renderConversation(conversation))}
                </div>
              ) : (
                <div className="ml-4">
                  {/* Render uncategorized first */}
                  {conversations.uncategorized?.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center space-x-2 px-2 py-1 text-xs text-gray-400 dark:text-gray-500">
                        <FolderIcon className="w-3 h-3" />
                        <span>Uncategorized</span>
                        <span className="text-xs">({conversations.uncategorized.length})</span>
                      </div>
                      <div className="ml-4 space-y-1">
                        {conversations.uncategorized.map((conversation) => renderConversation(conversation))}
                      </div>
                    </div>
                  )}
                  
                  {/* Render folders */}
                  {folders.map(folder => {
                    const folderConversations = conversations[folder.id] || []
                    if (folderConversations.length === 0) return null
                    
                    return (
                      <div key={folder.id} className="mb-3">
                        <div className="flex items-center justify-between px-2 py-1 group">
                          <div className="flex items-center space-x-2 text-xs">
                            <FolderIcon className={`w-3 h-3 ${folder.color === 'blue' ? 'text-blue-500' : 
                              folder.color === 'green' ? 'text-green-500' : 
                              folder.color === 'purple' ? 'text-purple-500' : 
                              folder.color === 'red' ? 'text-red-500' : 
                              folder.color === 'yellow' ? 'text-yellow-500' : 
                              folder.color === 'indigo' ? 'text-indigo-500' : 
                              'text-gray-500'}`} />
                            {editingFolderId === folder.id ? (
                              <input
                                type="text"
                                value={editingFolderName}
                                onChange={(e) => setEditingFolderName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') updateFolder(folder.id)
                                  if (e.key === 'Escape') {
                                    setEditingFolderId(null)
                                    setEditingFolderName('')
                                  }
                                }}
                                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                                autoFocus
                              />
                            ) : (
                              <span className="text-gray-700 dark:text-gray-300">{folder.name}</span>
                            )}
                            <span className="text-gray-400">({folderConversations.length})</span>
                          </div>
                          
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingFolderId(folder.id)
                                setEditingFolderName(folder.name)
                              }}
                              className="p-1 text-gray-400 hover:text-blue-500 rounded"
                            >
                              <PencilIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteFolder(folder.id)}
                              className="p-1 text-gray-400 hover:text-red-500 rounded"
                            >
                              <TrashIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <div className="ml-4 space-y-1">
                          {folderConversations.map((conversation) => renderConversation(conversation))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {conversation.model}
                </p>
                {conversation.folder && (
                  <div className="flex items-center space-x-1">
                    <FolderIcon className={`w-3 h-3 ${conversation.folder?.color === 'blue' ? 'text-blue-500' : 
                      conversation.folder?.color === 'green' ? 'text-green-500' : 
                      conversation.folder?.color === 'purple' ? 'text-purple-500' : 
                      conversation.folder?.color === 'red' ? 'text-red-500' : 
                      conversation.folder?.color === 'yellow' ? 'text-yellow-500' : 
                      conversation.folder?.color === 'indigo' ? 'text-indigo-500' : 
                      'text-gray-500'}`} />
                    <span className="text-xs text-gray-400">{conversation.folder.name}</span>
                  </div>
                )}
              </div>
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
            {/* Move to folder dropdown */}
            {movingConversationId === conversation.id ? (
              <div className="absolute right-0 top-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 z-10 min-w-[150px]">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Move to:</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    moveConversationToFolder(conversation.id, null)
                  }}
                  className="w-full text-left px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center space-x-1"
                >
                  <FolderIcon className="w-3 h-3" />
                  <span>Uncategorized</span>
                </button>
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      moveConversationToFolder(conversation.id, folder.id)
                    }}
                    className="w-full text-left px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center space-x-1"
                  >
                    <FolderIcon className={`w-3 h-3 ${folder.color === 'blue' ? 'text-blue-500' : 
                      folder.color === 'green' ? 'text-green-500' : 
                      folder.color === 'purple' ? 'text-purple-500' : 
                      folder.color === 'red' ? 'text-red-500' : 
                      folder.color === 'yellow' ? 'text-yellow-500' : 
                      folder.color === 'indigo' ? 'text-indigo-500' : 
                      'text-gray-500'}`} />
                    <span>{folder.name}</span>
                  </button>
                ))}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMovingConversationId(null)
                  }}
                  className="w-full text-left px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded mt-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMovingConversationId(conversation.id)
                  }}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
                  title="Move to folder"
                >
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    startEditing(conversation)
                  }}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  title="Edit title"
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
              </>
            )}
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
          <div className="flex items-center space-x-2">
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
            
            <button
              onClick={() => setShowNewFolderInput(true)}
              className="flex items-center space-x-1 px-2 md:px-3 py-1 rounded-md text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Create new folder"
            >
              <FolderPlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">New Folder</span>
            </button>
          </div>
          
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {filteredConversations.length} of {conversations.length}
          </span>
        </div>
        
        {/* New folder input */}
        {showNewFolderInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createFolder()
                if (e.key === 'Escape') {
                  setShowNewFolderInput(false)
                  setNewFolderName('')
                }
              }}
              placeholder="Folder name..."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="flex items-center space-x-1 px-3 py-1 bg-primary-600 text-white rounded-md text-xs hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckIcon className="w-3 h-3" />
                <span>Create</span>
              </button>
              <button
                onClick={() => {
                  setShowNewFolderInput(false)
                  setNewFolderName('')
                }}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-md text-xs hover:bg-gray-700"
              >
                <XMarkIcon className="w-3 h-3" />
                <span>Cancel</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {groupByDate ? (
            <div className="space-y-1 py-2">
              {renderConversationGroup('Today', groupedConversations.today, <ClockIcon className="w-4 h-4" />, true)}
              {renderConversationGroup('Yesterday', groupedConversations.yesterday, <ClockIcon className="w-4 h-4" />, true)}
              {renderConversationGroup('This Week', groupedConversations.thisWeek, <CalendarIcon className="w-4 h-4" />, true)}
              {renderConversationGroup('Older', groupedConversations.older, <CalendarIcon className="w-4 h-4" />, true)}
            </div>
          ) : (
            <div className="space-y-1 py-2">
              {/* Render by folders */}
              {renderConversationGroup('Uncategorized', groupedConversations.all.uncategorized, <FolderIcon className="w-4 h-4" />, false)}
              {folders.map(folder => (
                renderConversationGroup(
                  folder.name, 
                  groupedConversations.all[folder.id], 
                  <FolderIcon className={`w-4 h-4 ${folder.color === 'blue' ? 'text-blue-500' : 
                    folder.color === 'green' ? 'text-green-500' : 
                    folder.color === 'purple' ? 'text-purple-500' : 
                    folder.color === 'red' ? 'text-red-500' : 
                    folder.color === 'yellow' ? 'text-yellow-500' : 
                    folder.color === 'indigo' ? 'text-indigo-500' : 
                    'text-gray-500'}`} />, 
                  false
                )
              ))}
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
