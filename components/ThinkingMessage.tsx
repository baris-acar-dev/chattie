'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { LightBulbIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'

interface ThinkingMessageProps {
  content: string
  timestamp?: string
}

export default function ThinkingMessage({ content, timestamp }: ThinkingMessageProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  // Extract thinking content (remove <think> tags if present)
  const thinkingContent = content
    .replace(/<think>/gi, '')
    .replace(/<\/think>/gi, '')
    .trim()

  // Show only first 100 characters when collapsed
  const previewContent = thinkingContent.length > 100 
    ? thinkingContent.substring(0, 100) + '...'
    : thinkingContent

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="thinking-message border-l-4 border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-r-lg"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <LightBulbIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
              AI Reasoning
            </span>
            {timestamp && (
              <span className="text-xs text-amber-600 dark:text-amber-400">
                {timestamp}
              </span>
            )}
          </div>
          
          {thinkingContent.length > 100 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
            >
              <span>{isExpanded ? 'Show less' : 'Show more'}</span>
              {isExpanded ? (
                <ChevronUpIcon className="w-3 h-3" />
              ) : (
                <ChevronDownIcon className="w-3 h-3" />
              )}
            </button>
          )}
        </div>

        <motion.div
          initial={false}
          animate={{ 
            height: isExpanded ? 'auto' : 'auto',
            opacity: 1 
          }}
          className="overflow-hidden"
        >
          <div className="prose prose-sm max-w-none text-amber-800 dark:text-amber-200 prose-amber dark:prose-invert">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0 italic">{children}</p>,
                code: ({ children }) => (
                  <code className="px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded text-xs">
                    {children}
                  </code>
                ),
                ul: ({ children }) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
              }}
            >
              {isExpanded ? thinkingContent : previewContent}
            </ReactMarkdown>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
