'use client'

import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface SessionCleanerProps {
  error?: string
}

export default function SessionCleaner({ error }: SessionCleanerProps) {
  const router = useRouter()

  const clearSession = async () => {
    try {
      // Sign out to clear NextAuth session
      await signOut({ redirect: false })
      
      // Clear any browser storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
        
        // Clear cookies manually
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=")
          const name = eqPos > -1 ? c.substr(0, eqPos) : c
          document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost"
        })
      }
      
      // Redirect to home page
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Error clearing session:', err)
      // Force reload as fallback
      window.location.href = '/'
    }
  }

  if (!error || !error.includes('JWE')) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md mx-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Session Error
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          There was an issue with your session. This usually happens when the app configuration changes.
          Click below to clear your session and continue.
        </p>
        <div className="flex gap-2">
          <button
            onClick={clearSession}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Clear Session
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  )
}
