'use client'

import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { UserIcon, CpuChipIcon, GlobeAltIcon, BookOpenIcon } from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import ThinkingMessage from './ThinkingMessage'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  metadata?: {
    model?: string
    webScrapingPerformed?: boolean
    scrapedUrls?: string[]
    ragSourcesUsed?: boolean
    ragSources?: Array<{
      title: string
      source?: string
      relevanceScore: number
    }>
  }
}

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

function TypingIndicator() {
  return (
    <div className="chat-message chat-assistant">
      <div className="flex items-center space-x-2">
        <CpuChipIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <div className="typing-indicator">
          <div className="typing-dot" style={{ animationDelay: '0ms' }} />
          <div className="typing-dot" style={{ animationDelay: '150ms' }} />
          <div className="typing-dot" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">AI is thinking...</span>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  
  // Check if this is a message with thinking content
  const hasThinkingContent = !isUser && message.content.includes('<think>') && message.content.includes('</think>')
  
  // Extract thinking content and regular content
  let thinkingContent = ''
  let regularContent = message.content
  
  if (hasThinkingContent) {
    const thinkingMatch = message.content.match(/<think>([\s\S]*?)<\/think>/gi)
    if (thinkingMatch) {
      thinkingContent = thinkingMatch.map(match => 
        match.replace(/<\/?think>/gi, '').trim()
      ).join('\n\n')
      regularContent = message.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Show thinking message first if it exists */}
      {hasThinkingContent && thinkingContent && (
        <ThinkingMessage 
          content={thinkingContent}
          timestamp={(() => {
            try {
              const date = new Date(message.createdAt);
              return isNaN(date.getTime()) ? 'Just now' : formatDistanceToNow(date, { addSuffix: true });
            } catch (error) {
              return 'Just now';
            }
          })()}
        />
      )}

      {/* Show regular message content if it exists */}
      {regularContent && (
        <div className={`chat-message ${isUser ? 'chat-user' : 'chat-assistant'}`}>
          <div className="flex items-start space-x-2 md:space-x-3">
            <div className={`flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center ${
              isUser ? 'bg-primary-600' : 'bg-gray-600'
            }`}>
              {isUser ? (
                <UserIcon className="w-3 h-3 md:w-4 md:h-4 text-white" />
              ) : (
                <CpuChipIcon className="w-3 h-3 md:w-4 md:h-4 text-white" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {isUser ? 'You' : 'Assistant'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {(() => {
                    try {
                      const date = new Date(message.createdAt);
                      return isNaN(date.getTime()) ? 'Just now' : formatDistanceToNow(date, { addSuffix: true });
                    } catch (error) {
                      return 'Just now';
                    }
                  })()}
                </span>

                {message.metadata?.webScrapingPerformed && (
                  <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
                    <GlobeAltIcon className="w-3 h-3" />
                    <span className="hidden md:inline">Web content analyzed</span>
                    <span className="md:hidden">Web</span>
                  </div>
                )}

                {message.metadata?.ragSourcesUsed && (
                  <div className="flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400">
                    <BookOpenIcon className="w-3 h-3" />
                    <span className="hidden md:inline">Knowledge base consulted</span>
                    <span className="md:hidden">KB</span>
                  </div>
                )}
              </div>

              <div className={`prose prose-sm max-w-none break-words ${
                isUser ? 'text-white prose-invert' : 'text-gray-900 dark:text-gray-100 dark:prose-invert'
              }`}>
                <ReactMarkdown
                  components={{
                    // Custom components for better styling
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    code: ({ children, className }) => {
                      const isBlock = className?.includes('language-')
                      return isBlock ? (
                        <pre className={`bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto ${className}`}>
                          <code>{children}</code>
                        </pre>
                      ) : (
                        <code className={`px-1 py-0.5 rounded text-sm ${
                          isUser 
                            ? 'bg-primary-700 text-primary-100' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}>
                          {children}
                        </code>
                      )
                    },
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`underline hover:no-underline ${
                          isUser ? 'text-primary-100' : 'text-primary-600 dark:text-primary-400'
                        }`}
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {regularContent}
                </ReactMarkdown>
              </div>

              {message.metadata?.scrapedUrls && message.metadata.scrapedUrls.length > 0 && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1 mb-1">
                    <GlobeAltIcon className="w-3 h-3" />
                    <span>Analyzed content from:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {message.metadata.scrapedUrls.map((url, index) => (
                      <li key={index}>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {message.metadata?.ragSources && message.metadata.ragSources.length > 0 && (
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1 mb-1">
                    <BookOpenIcon className="w-3 h-3" />
                    <span>Referenced knowledge base sources:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {message.metadata.ragSources.map((source, index) => (
                      <li key={index}>
                        <span className="text-purple-600 dark:text-purple-400 font-medium">{source.title}</span>
                        <span className="text-gray-400 dark:text-gray-500 ml-2">
                          ({source.relevanceScore.toFixed(1)}% relevance)
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <CpuChipIcon className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium mb-2">Ready to chat!</p>
          <p className="text-sm">
            Send a message to start the conversation. You can include URLs for automatic web scraping and content analysis.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <MessageBubble 
          key={message.id || `message-${index}`} 
          message={message} 
        />
      ))}
      
      {isLoading && <TypingIndicator />}
    </div>
  )
}
