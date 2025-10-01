'use client'

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { UserIcon, CpuChipIcon, GlobeAltIcon, BookOpenIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import ThinkingMessage from './ThinkingMessage'

// ### INTERFACES ###

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

// ### HELPER FUNCTIONS & COMPONENTS ###

/**
 * Maps a language code to its display name for the UI.
 * @param lang The language code (e.g., 'js', 'python').
 * @returns A user-friendly display name (e.g., 'JavaScript', 'Python').
 */
const getLanguageDisplayName = (lang: string): string => {
  const languageMap: { [key: string]: string } = {
    'js': 'JavaScript', 'javascript': 'JavaScript', 'ts': 'TypeScript', 'typescript': 'TypeScript',
    'py': 'Python', 'python': 'Python', 'bash': 'Bash', 'sh': 'Shell', 'shell': 'Shell',
    'sql': 'SQL', 'html': 'HTML', 'css': 'CSS', 'json': 'JSON', 'jsx': 'JSX', 'tsx': 'TSX',
    'xml': 'XML', 'yaml': 'YAML', 'yml': 'YAML', 'md': 'Markdown', 'markdown': 'Markdown',
    'c': 'C', 'cpp': 'C++', 'java': 'Java', 'php': 'PHP', 'ruby': 'Ruby', 'go': 'Go',
    'rust': 'Rust', 'swift': 'Swift', 'kotlin': 'Kotlin', 'plaintext': 'Plain Text',
  }
  return languageMap[lang.toLowerCase()] || lang.charAt(0).toUpperCase() + lang.slice(1)
}

/**
 * A syntax-highlighted code block component with a copy button.
 * It handles both fenced code blocks and inline code.
 */
function CodeBlock({ node, className, children, ...props }: any) {
  const [copied, setCopied] = useState(false)
  const code = String(children).replace(/\n$/, '')
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1].toLowerCase() : 'plaintext' // Default to plaintext if no language is specified

  const isInline = !className && !code.includes('\n')

  if (isInline) {
    return (
      <code className="px-1.5 py-0.5 rounded-md text-sm font-mono bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600" {...props}>
        {children}
      </code>
    )
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy code')
    }
  }

  return (
    <div className="relative group my-4 bg-gray-900 rounded-lg shadow-lg">
      <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-4 py-2 rounded-t-lg border-b border-gray-700">
        <span className="text-sm font-medium flex items-center space-x-2">
          <span className={`w-3 h-3 rounded-full ${language !== 'plaintext' ? 'bg-green-400' : 'bg-gray-500'}`}></span>
          <span>{getLanguageDisplayName(language)}</span>
        </span>
        <button
          onClick={copyToClipboard}
          className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title="Copy code"
        >
          <ClipboardDocumentIcon className="w-3 h-3" />
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <div className="relative overflow-x-auto">
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          className="!mt-0 !rounded-t-none !bg-gray-900"
          showLineNumbers={code.split('\n').length > 3}
          wrapLines={true}
          wrapLongLines={true}
          customStyle={{
            margin: 0,
            padding: '1rem',
            fontSize: '0.875rem',
            lineHeight: '1.5',
            backgroundColor: 'transparent',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}

/**
 * A simple typing indicator to show when the assistant is processing.
 */
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

// ### MARKDOWN COMPONENT OVERRIDES ###
// Define these outside the MessageBubble component to prevent them from being
// recreated on every render, which improves performance.

const markdownComponents = (isUser: boolean) => ({
  p: ({ children }: any) => <p className="mb-3 last:mb-0 leading-relaxed break-words">{children}</p>,
  code: CodeBlock,
  pre: ({ children }: any) => <div className="my-4 overflow-hidden rounded-lg">{children}</div>,
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`underline hover:no-underline transition-colors break-all ${isUser ? 'text-blue-200 hover:text-blue-100' : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'}`}
    >
      {children}
    </a>
  ),
  ul: ({ children }: any) => <ul className="list-disc list-inside space-y-1 my-3 pl-2">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal list-inside space-y-1 my-3 pl-2">{children}</ol>,
  li: ({ children }: any) => <li className="break-words leading-relaxed">{children}</li>,
  h1: ({ children }: any) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 break-words">{children}</h1>,
  h2: ({ children }: any) => <h2 className="text-lg font-bold mb-3 mt-4 first:mt-0 break-words">{children}</h2>,
  h3: ({ children }: any) => <h3 className="text-base font-bold mb-2 mt-3 first:mt-0 break-words">{children}</h3>,
  blockquote: ({ children }: any) => (
    <blockquote className={`border-l-4 pl-4 my-3 italic ${isUser ? 'border-blue-300 text-blue-100' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'}`}>
      {children}
    </blockquote>
  ),
  table: ({ children }: any) => <div className="overflow-x-auto my-4"><table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600">{children}</table></div>,
  th: ({ children }: any) => <th className={`border border-gray-300 dark:border-gray-600 px-3 py-2 text-left font-semibold ${isUser ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>{children}</th>,
  td: ({ children }: any) => <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 break-words">{children}</td>,
  hr: () => <hr className={`my-4 border-t ${isUser ? 'border-blue-300' : 'border-gray-300 dark:border-gray-600'}`} />,
})

// ### MAIN COMPONENTS ###

/**
 * Renders a single message bubble.
 * This component is memoized to prevent re-rendering if its props do not change.
 */
const MessageBubble = React.memo(function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  // Memoize the timestamp calculation to avoid re-calculating on every render.
  const timestamp = useMemo(() => {
    try {
      const date = new Date(message.createdAt)
      return isNaN(date.getTime()) ? 'Just now' : formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return 'Just now'
    }
  }, [message.createdAt])

  // Extract <think> content from the main content.
  const { thinkingContent, regularContent } = useMemo(() => {
    let thinking = ''
    let regular = message.content

    const hasThinkingContent = !isUser && regular.includes('<think>') && regular.includes('</think>')

    if (hasThinkingContent) {
      const thinkingMatch = regular.match(/<think>([\s\S]*?)<\/think>/gi)
      if (thinkingMatch) {
        thinking = thinkingMatch.map(match => match.replace(/<\/?think>/gi, '').trim()).join('\n\n')
        regular = regular.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
      }
    }
    return { thinkingContent: thinking, regularContent: regular }
  }, [message.content, isUser])

  // Memoize the markdown components object
  const components = useMemo(() => markdownComponents(isUser), [isUser]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      {thinkingContent && <ThinkingMessage content={thinkingContent} timestamp={timestamp} />}

      {regularContent && (
        <div className={`chat-message ${isUser ? 'chat-user' : 'chat-assistant'}`}>
          <div className="flex items-start space-x-3 md:space-x-4 max-w-full">
            <div className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-600 dark:bg-gray-500'}`}>
              {isUser ? <UserIcon className="w-4 h-4 md:w-5 md:h-5 text-white" /> : <CpuChipIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />}
            </div>

            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{isUser ? 'You' : 'Assistant'}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{timestamp}</span>

                {message.metadata?.webScrapingPerformed && (
                  <div className="flex items-center space-x-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                    <GlobeAltIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">Web content analyzed</span>
                    <span className="sm:hidden">Web</span>
                  </div>
                )}
                {message.metadata?.ragSourcesUsed && (
                  <div className="flex items-center space-x-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                    <BookOpenIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">Knowledge base consulted</span>
                    <span className="sm:hidden">KB</span>
                  </div>
                )}
              </div>

              <div className={`prose prose-sm max-w-none overflow-hidden ${isUser ? 'text-white prose-invert' : 'text-gray-900 dark:text-gray-100 dark:prose-invert'}`}>
                <ReactMarkdown components={components}>
                  {regularContent}
                </ReactMarkdown>
              </div>

              {message.metadata?.scrapedUrls && message.metadata.scrapedUrls.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <GlobeAltIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Analyzed content from:</span>
                  </div>
                  <ul className="space-y-1">
                    {message.metadata.scrapedUrls.map((url, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-blue-400 dark:text-blue-500 mt-1">•</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 underline break-all leading-relaxed">
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {message.metadata?.ragSources && message.metadata.ragSources.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <BookOpenIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-300">Referenced knowledge base sources:</span>
                  </div>
                  <ul className="space-y-2">
                    {message.metadata.ragSources.map((source, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-purple-400 dark:text-purple-500 mt-1">•</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-purple-800 dark:text-purple-300 break-words">{source.title}</span>
                          <span className="text-xs text-purple-600 dark:text-purple-400 ml-2">({source.relevanceScore.toFixed(1)}% relevance)</span>
                        </div>
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
})

/**
 * The main component that renders the list of messages.
 */
export default function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
        <div className="text-center max-w-md">
          <CpuChipIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-300">Ready to chat!</h3>
          <p className="text-sm leading-relaxed mb-4">
            Send a message to start the conversation. You can include URLs for automatic web scraping and content analysis.
          </p>
          <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
            <p>✨ Supports code syntax highlighting</p>
            <p>🔗 Automatic link detection</p>
            <p>📊 Rich formatting for tables and lists</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && <TypingIndicator />}
    </div>
  )
}