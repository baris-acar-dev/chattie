'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}: LoadingSpinnerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dotsRef = useRef<HTMLDivElement[]>([])
  const textRef = useRef<HTMLParagraphElement>(null)

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  }

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  }

  useEffect(() => {
    if (!containerRef.current) return

    // Create timeline for loading animation
    const tl = gsap.timeline({ repeat: -1 })

    // Animate dots with staggered timing
    tl.to(dotsRef.current, {
      scale: 1.5,
      opacity: 0.8,
      duration: 0.4,
      stagger: 0.15,
      ease: "power2.inOut"
    })
    .to(dotsRef.current, {
      scale: 1,
      opacity: 1,
      duration: 0.4,
      stagger: 0.15,
      ease: "power2.inOut"
    }, "-=0.2")

    // Animate text with subtle pulse
    if (textRef.current) {
      gsap.to(textRef.current, {
        opacity: 0.7,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut"
      })
    }

    // Container entrance animation
    gsap.fromTo(containerRef.current, 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
    )

    return () => {
      tl.kill()
    }
  }, [])

  const addToRefs = (el: HTMLDivElement) => {
    if (el && !dotsRef.current.includes(el)) {
      dotsRef.current.push(el)
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      <div className={`flex space-x-2 ${sizeClasses[size]}`}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            ref={addToRefs}
            className={`${dotSizes[size]} bg-primary-500 dark:bg-primary-400 rounded-full`}
          />
        ))}
      </div>
      
      {text && (
        <p 
          ref={textRef}
          className="text-sm text-gray-600 dark:text-gray-400 font-medium"
        >
          {text}
        </p>
      )}
    </div>
  )
}
