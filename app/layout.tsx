import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: 'Chattie - AI Chatbot with Local Models',
  description: 'A powerful chatbot using local Ollama models with web scraping and memory',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} ${inter.variable}`} suppressHydrationWarning>
        <ErrorBoundary>
          <Providers>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--toast-bg, #363636)',
                  color: 'var(--toast-color, #fff)',
                },
                className: 'dark:bg-gray-800 dark:text-gray-100',
              }}
            />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
