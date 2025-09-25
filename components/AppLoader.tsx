'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { CpuChipIcon } from '@heroicons/react/24/outline'

interface AppLoaderProps {
  onLoadingComplete: () => void
}

export default function AppLoader({ onLoadingComplete }: AppLoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const subtitleRef = useRef<HTMLParagraphElement>(null)
  const dotsRef = useRef<HTMLDivElement[]>([])
  const progressRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  
  const [loadingText, setLoadingText] = useState('Initializing...')

  useEffect(() => {
    if (!containerRef.current) return

    const tl = gsap.timeline()

    // Initial state - everything hidden
    gsap.set([logoRef.current, titleRef.current, subtitleRef.current, progressRef.current], {
      opacity: 0,
      y: 30
    })

    // Entrance animations
    tl.to(logoRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: "power3.out"
    })
    .to(titleRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out"
    }, "-=0.4")
    .to(subtitleRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: "power3.out"
    }, "-=0.3")
    .to(progressRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power3.out"
    }, "-=0.2")

    // Logo pulse animation
    gsap.to(logoRef.current, {
      scale: 1.1,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    })

    // Loading dots animation
    const dotsTimeline = gsap.timeline({ repeat: -1 })
    dotsTimeline.to(dotsRef.current, {
      scale: 1.5,
      backgroundColor: "#3B82F6",
      duration: 0.4,
      stagger: 0.2,
      ease: "power2.inOut"
    })
    .to(dotsRef.current, {
      scale: 1,
      backgroundColor: "#6B7280",
      duration: 0.4,
      stagger: 0.2,
      ease: "power2.inOut"
    }, "-=0.2")

    // Progress bar animation
    gsap.to(progressBarRef.current, {
      width: "100%",
      duration: 3,
      ease: "power2.inOut"
    })

    // Loading text sequence
    const textSequence = [
      'Initializing...',
      'Loading AI models...',
      'Setting up interface...',
      'Almost ready...'
    ]

    let textIndex = 0
    const textInterval = setInterval(() => {
      if (textIndex < textSequence.length - 1) {
        textIndex++
        setLoadingText(textSequence[textIndex])
      }
    }, 750)

    // Complete loading after 3 seconds
    const completeTimer = setTimeout(() => {
      // Exit animation
      const exitTl = gsap.timeline({
        onComplete: onLoadingComplete
      })

      exitTl.to(containerRef.current, {
        opacity: 0,
        scale: 0.9,
        duration: 0.6,
        ease: "power3.in"
      })
      .to(containerRef.current, {
        y: -100,
        duration: 0.4,
        ease: "power3.in"
      }, "-=0.3")

      clearInterval(textInterval)
    }, 3000)

    return () => {
      tl.kill()
      dotsTimeline.kill()
      clearInterval(textInterval)
      clearTimeout(completeTimer)
    }
  }, [onLoadingComplete])

  const addToDotsRefs = (el: HTMLDivElement) => {
    if (el && !dotsRef.current.includes(el)) {
      dotsRef.current.push(el)
    }
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center z-50"
    >
      <div className="text-center">
        {/* Logo */}
        <div 
          ref={logoRef}
          className="mb-8 mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg"
        >
          <CpuChipIcon className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h1 
          ref={titleRef}
          className="text-4xl font-bold text-gray-900 dark:text-white mb-2"
        >
          Chattie
        </h1>

        {/* Subtitle */}
        <p 
          ref={subtitleRef}
          className="text-lg text-gray-600 dark:text-gray-300 mb-8"
        >
          AI-Powered Conversations
        </p>

        {/* Loading Progress */}
        <div ref={progressRef} className="space-y-4">
          {/* Loading text */}
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {loadingText}
          </p>

          {/* Loading dots */}
          <div className="flex justify-center space-x-2 mb-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                ref={addToDotsRefs}
                className="w-2 h-2 bg-gray-400 dark:bg-gray-600 rounded-full"
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-64 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mx-auto">
            <div 
              ref={progressBarRef}
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 w-0"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
