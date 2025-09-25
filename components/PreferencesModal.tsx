'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  Cog6ToothIcon,
  KeyIcon,
  SparklesIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

interface UserPreferences {
  id?: string
  userId: string
  geminiApiKey?: string
  openaiApiKey?: string
  defaultModel?: string
  temperature?: number
  maxTokens?: number
  hasGeminiApiKey?: boolean
  hasOpenaiApiKey?: boolean
}

interface PreferencesModalProps {
  user: { id: string; name: string; email: string }
  isOpen: boolean
  onClose: () => void
  onPreferencesUpdate?: (preferences: UserPreferences) => void
}

export default function PreferencesModal({ user, isOpen, onClose, onPreferencesUpdate }: PreferencesModalProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    userId: user.id,
    temperature: 0.7,
    maxTokens: 4096
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [showOpenaiApiKey, setShowOpenaiApiKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isTestingOpenai, setIsTestingOpenai] = useState(false)
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null)
  const [openaiApiKeyValid, setOpenaiApiKeyValid] = useState<boolean | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadPreferences()
    }
  }, [isOpen, user.id])

  const loadPreferences = async () => {
    try {
      const response = await fetch(`/api/preferences?userId=${user.id}`)
      const data = await response.json()
      if (data.preferences) {
        setPreferences({
          ...data.preferences,
          userId: user.id
        })
        setApiKeyValid(data.preferences.hasGeminiApiKey ? true : null)
        setOpenaiApiKeyValid(data.preferences.hasOpenaiApiKey ? true : null)
      }    } catch (error) {
      console.error('Failed to load preferences:', error)
      toast.error('Failed to load preferences')
    }
  }

  const savePreferences = async () => {
    setIsLoading(true)
    try {
      // Filter out masked API keys (theme is removed as it's handled separately in the interface)
      const prefsToSave = { ...preferences }
      
      // Don't send masked API keys to backend
      if (prefsToSave.geminiApiKey === '••••••••••••••••') {
        delete prefsToSave.geminiApiKey
      }
      
      if (prefsToSave.openaiApiKey === '••••••••••••••••') {
        delete prefsToSave.openaiApiKey
      }

      const response = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefsToSave)
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Preferences saved successfully!')
        setPreferences({
          ...data.preferences,
          userId: user.id
        })
        setApiKeyValid(data.preferences.hasGeminiApiKey ? true : null)
        setOpenaiApiKeyValid(data.preferences.hasOpenaiApiKey ? true : null)
        onPreferencesUpdate?.(data.preferences)
        onClose()
      } else {
        const errorMessage = data.error || 'Failed to save preferences'
        console.error('Save preferences error:', errorMessage)
        toast.error(errorMessage)
        
        // If API key is invalid, mark it as such
        if (errorMessage.includes('Invalid Gemini API key')) {
          setApiKeyValid(false)
        }
      }
    } catch (error) {
      console.error('Failed to save preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const testOpenaiApiKey = async () => {
    if (!preferences.openaiApiKey || preferences.openaiApiKey === '••••••••••••••••') {
      toast.error('Please enter an OpenAI API key first')
      return
    }

    setIsTestingOpenai(true)
    try {
      const response = await fetch('/api/test-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: preferences.openaiApiKey,
          provider: 'openai'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test API key')
      }

      setOpenaiApiKeyValid(data.isValid)
      if (data.isValid) {
        toast.success('OpenAI API key is valid!')
      } else {
        toast.error(data.error || 'OpenAI API key validation failed')
      }
    } catch (error: any) {
      console.error('OpenAI API key test failed:', error)
      setOpenaiApiKeyValid(false)
      toast.error(error.message || 'Failed to test OpenAI API key')
    } finally {
      setIsTestingOpenai(false)
    }
  }

  const testApiKey = async () => {
    if (!preferences.geminiApiKey || preferences.geminiApiKey === '••••••••••••••••') {
      toast.error('Please enter an API key first')
      return
    }

    setIsTesting(true)
    try {
      const response = await fetch('/api/test-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: preferences.geminiApiKey,
          provider: 'gemini'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test API key')
      }

      setApiKeyValid(data.isValid)
      if (data.isValid) {
        toast.success('API key is valid!')
      } else {
        toast.error(data.error || 'API key validation failed')
      }
    } catch (error: any) {
      console.error('API key test failed:', error)
      setApiKeyValid(false)
      toast.error(error.message || 'Failed to test API key')
    } finally {
      setIsTesting(false)
    }
  }

  const clearGeminiApiKey = async () => {
    setPreferences(prev => ({ ...prev, geminiApiKey: '' }))
    setApiKeyValid(null)
    
    // Also clear it from the backend
    try {
      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, geminiApiKey: null })
      })
      toast.success('Gemini API key removed')
    } catch (error) {
      console.error('Error clearing Gemini API key:', error)
    }
  }

  const clearOpenaiApiKey = async () => {
    setPreferences(prev => ({ ...prev, openaiApiKey: '' }))
    setOpenaiApiKeyValid(null)
    
    // Also clear it from the backend
    try {
      await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, openaiApiKey: null })
      })
      toast.success('OpenAI API key removed')
    } catch (error) {
      console.error('Error clearing OpenAI API key:', error)
    }
  }

  const handleInputChange = (field: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Reset API key validation when keys change
    if (field === 'geminiApiKey') {
      setApiKeyValid(null)
    }
    if (field === 'openaiApiKey') {
      setOpenaiApiKeyValid(null)
    }
  }

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-75 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Cog6ToothIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Preferences</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Gemini API Configuration */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <SparklesIcon className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-medium text-purple-900">Google Gemini Configuration</h3>
            </div>            <p className="text-sm text-purple-700 mb-4">
              Add your Google AI Studio API key to enable Gemini models. 
              Your API key should start with "AIza" and be about 39 characters long.
              <br />
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline ml-1 font-medium"
              >
                Get your API key from Google AI Studio →
              </a>
            </p>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Gemini API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={preferences.geminiApiKey || ''}
                  onChange={(e) => handleInputChange('geminiApiKey', e.target.value)}
                  placeholder="Enter your Gemini API key"
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                  {apiKeyValid !== null && (
                    <div className="flex items-center">
                      {apiKeyValid ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showApiKey ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={testApiKey}
                  disabled={!preferences.geminiApiKey || preferences.geminiApiKey === '••••••••••••••••' || isTesting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-1"
                >
                  {isTesting ? 'Testing...' : 'Test API Key'}
                </button>
                
                {(preferences.geminiApiKey && preferences.geminiApiKey !== '') && (
                  <button
                    onClick={clearGeminiApiKey}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center"
                    title="Remove API key"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* OpenAI API Configuration */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <KeyIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium text-blue-900">OpenAI Configuration</h3>
            </div>            
            <p className="text-sm text-blue-700 mb-4">
              Add your OpenAI API key to enable ChatGPT models (GPT-4, GPT-3.5-turbo, etc.). 
              Your API key should start with "sk-" and be about 51 characters long.
              <br />
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline ml-1 font-medium"
              >
                Get your API key from OpenAI Platform →
              </a>
            </p>
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                OpenAI API Key
              </label>
              <div className="relative">
                <input
                  type={showOpenaiApiKey ? 'text' : 'password'}
                  value={preferences.openaiApiKey || ''}
                  onChange={(e) => handleInputChange('openaiApiKey', e.target.value)}
                  placeholder="Enter your OpenAI API key"
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                  {openaiApiKeyValid !== null && (
                    <div className="flex items-center">
                      {openaiApiKeyValid ? (
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircleIcon className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowOpenaiApiKey(!showOpenaiApiKey)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showOpenaiApiKey ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={testOpenaiApiKey}
                  disabled={!preferences.openaiApiKey || preferences.openaiApiKey === '••••••••••••••••' || isTestingOpenai}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-1"
                >
                  {isTestingOpenai ? 'Testing...' : 'Test API Key'}
                </button>
                
                {(preferences.openaiApiKey && preferences.openaiApiKey !== '') && (
                  <button
                    onClick={clearOpenaiApiKey}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex items-center"
                    title="Remove API key"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Model Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Model Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature ({preferences.temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={preferences.temperature || 0.7}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Focused</span>
                  <span>Balanced</span>
                  <span>Creative</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens
                </label>
                <input
                  type="number"
                  min="100"
                  max="32768"
                  value={preferences.maxTokens || 4096}
                  onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* UI Settings */}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={savePreferences}
            disabled={isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
