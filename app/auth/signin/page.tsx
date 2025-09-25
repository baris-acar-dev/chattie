'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        name: name || email.split('@')[0],
        redirect: false,
      })

      if (result?.error) {
        toast.error('Failed to sign in')
      } else {
        toast.success('Signed in successfully!')
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error('Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestSignIn = async () => {
    setIsLoading(true)
    try {
      const guestEmail = `guest-${Date.now()}@demo.local`
      const result = await signIn('credentials', {
        email: guestEmail,
        name: 'Guest User',
        redirect: false,
      })

      if (result?.error) {
        toast.error('Failed to sign in as guest')
      } else {
        toast.success('Signed in as guest!')
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      console.error('Guest sign in error:', error)
      toast.error('Failed to sign in as guest')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome to Chattie</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Sign in to start chatting with AI assistants
          </p>
        </div>

        <form onSubmit={handleCredentialsSignIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Name (Optional)
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !email}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-800 px-2 text-gray-500 dark:text-gray-400">
              Or
            </span>
          </div>
        </div>

        <button 
          onClick={handleGuestSignIn}
          disabled={isLoading}
          className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {isLoading ? 'Signing in...' : 'Continue as Guest'}
        </button>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          No password required for demo. Just enter your email to get started.
        </p>
      </div>
    </div>
  )
}
