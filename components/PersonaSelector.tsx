'use client'

import { useState, useEffect, useRef } from 'react'
import { UserIcon, SparklesIcon, CodeBracketIcon, MapIcon, WrenchScrewdriverIcon, AcademicCapIcon } from '@heroicons/react/24/outline'

interface PromptTemplate {
  id: string
  name: string
  description: string | null
  role: string
  inputFormat: string | null
  outputFormat: string | null
  tags: string[]
  isActive: boolean
  temperature: number | null
  maxTokens: number | null
}

interface PersonaSelectorProps {
  selectedPersona: PromptTemplate | null
  onPersonaChange: (persona: PromptTemplate | null) => void
  userId?: string
}

const personaIcons: { [key: string]: React.ComponentType<any> } = {
  'Creative Writing Assistant': SparklesIcon,
  'Code Review Companion': CodeBracketIcon,
  'Wanderlust Voyager': MapIcon,
  'Friendly Tech Support': WrenchScrewdriverIcon,
  'Language Exchange Pal': AcademicCapIcon,
}

export default function PersonaSelector({ selectedPersona, onPersonaChange, userId }: PersonaSelectorProps) {
  const [personas, setPersonas] = useState<PromptTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
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

  const fetchPersonas = async () => {
    if (!userId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/prompt-templates?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setPersonas(data.templates || [])
        
        // Initialize default personas if none exist
        if (data.templates.length === 0) {
          await fetch('/api/prompt-templates/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          })
          // Refetch after initialization
          const retryResponse = await fetch(`/api/prompt-templates?userId=${userId}`)
          if (retryResponse.ok) {
            const retryData = await retryResponse.json()
            setPersonas(retryData.templates || [])
          }
        }
      }
    } catch (error) {
      console.error('Error fetching personas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPersonas()
  }, [userId])

  const handlePersonaSelect = (persona: PromptTemplate | null) => {
    onPersonaChange(persona)
    setIsOpen(false)
  }

  const getPersonaIcon = (personaName: string) => {
    const IconComponent = personaIcons[personaName] || UserIcon
    return IconComponent
  }

  if (isLoading) {
    return (
      <div className="relative">
        <button
          disabled
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-400"
        >
          <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" />
          Loading Personas...
        </button>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        {selectedPersona ? (
          <>
            {(() => {
              const IconComponent = getPersonaIcon(selectedPersona.name)
              return <IconComponent className="w-4 h-4" />
            })()}
            <span className="truncate max-w-32">{selectedPersona.name}</span>
          </>
        ) : (
          <>
            <UserIcon className="w-4 h-4" />
            <span>Select Persona</span>
          </>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-[60] max-h-96 overflow-y-auto">
          {/* None option */}
          <button
            onClick={() => handlePersonaSelect(null)}
            className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start gap-3 ${
              !selectedPersona ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
          >
            <UserIcon className="w-5 h-5 mt-0.5 text-gray-400" />
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">No Persona</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Default assistant behavior</div>
            </div>
          </button>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {personas.map((persona) => {
            const IconComponent = getPersonaIcon(persona.name)
            return (
              <button
                key={persona.id}
                onClick={() => handlePersonaSelect(persona)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start gap-3 ${
                  selectedPersona?.id === persona.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <IconComponent className="w-5 h-5 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {persona.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {persona.description}
                  </div>
                  {persona.tags && persona.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {persona.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                      {persona.tags.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                          +{persona.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}