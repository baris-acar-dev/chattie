'use client'

import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface UserMenuProps {
  className?: string
}

export function UserMenu({ className = '' }: UserMenuProps) {
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()

  if (status === 'loading') {
    return (
      <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-full h-8 w-8 ${className}`} />
    )
  }

  if (!session?.user) {
    return null
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: '/auth/signin'
      })
      toast.success('Signed out successfully!')
      router.push('/auth/signin')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
    } finally {
      setIsSigningOut(false)
      setIsOpen(false)
    }
  }

  const getUserInitials = () => {
    if (session?.user?.name) {
      return session.user.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (session?.user?.email) {
      return session.user.email[0].toUpperCase()
    }
    return 'U'
  }

  const getUserDisplayName = () => {
    return session?.user?.name || session?.user?.email || 'User'
  }

  return (
    <div className={`relative ${className}`}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        title={getUserDisplayName()}
      >
        {session?.user?.image ? (
          <img
            src={session.user.image}
            alt={getUserDisplayName()}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <span className="text-sm font-medium">
            {getUserInitials()}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              {/* User Info */}
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {getUserDisplayName()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {session?.user?.email}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSigningOut ? 'Signing out...' : 'Sign out'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
