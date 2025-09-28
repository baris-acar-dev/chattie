'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ChatInterface from '@/components/ChatInterface'
import AppLoader from '@/components/AppLoader'

export default function HomePage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleAutoLogin = async () => {
      if (status === 'loading') {
        return // Still loading session
      }

      if (!session && !autoLoginAttempted) {
        // Attempt auto-login with default demo user
        setAutoLoginAttempted(true)
        try {
          const result = await signIn('credentials', {
            email: 'demo@chattie.local',
            name: 'Demo User',
            redirect: false,
          })
          
          if (result?.error) {
            console.log('Auto-login failed, redirecting to sign-in')
            router.push('/auth/signin')
          }
          // If successful, the session will update and component will re-render
        } catch (error) {
          console.error('Auto-login error:', error)
          router.push('/auth/signin')
        }
        return
      }

      if (session) {
        // User is authenticated, ready to use the app
        setIsLoading(false)
      }
    }

    handleAutoLogin()
  }, [session, status, router, autoLoginAttempted])

  // Additional useEffect to handle redirect when auto-login fails
  useEffect(() => {
    if (!session && autoLoginAttempted && status !== 'loading') {
      router.push('/auth/signin')
    }
  }, [session, autoLoginAttempted, status, router])

  const handleLoadingComplete = () => {
    setIsLoading(false)
  }

  // Show loading while checking authentication or attempting auto-login
  if (status === 'loading' || (!session && !autoLoginAttempted) || isLoading) {
    return <AppLoader onLoadingComplete={handleLoadingComplete} />
  }

  // If auto-login failed and no session, show loading while redirect happens
  if (!session && autoLoginAttempted) {
    return <AppLoader onLoadingComplete={handleLoadingComplete} />
  }

  // Convert session user to the format expected by ChatInterface
  const user = {
    id: session?.user?.id || session?.user?.email || 'unknown',
    name: session?.user?.name || 'User',
    email: session?.user?.email || 'user@example.com'
  }

  return (
    <>
      {isLoading && <AppLoader onLoadingComplete={handleLoadingComplete} />}
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ChatInterface user={user} />
      </main>
    </>
  )
}
