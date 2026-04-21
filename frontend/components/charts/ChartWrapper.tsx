'use client'

import { useEffect, useRef, useState } from 'react'

interface ChartWrapperProps {
  children: React.ReactNode
  className?: string
  minHeight?: number
}

export function ChartWrapper({ children, className = '', minHeight = 240 }: ChartWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
          setIsReady(true)
        }
      }
    }

    // Initial measurement
    updateDimensions()

    // Set up ResizeObserver for responsive updates
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // Fallback timeout to ensure charts render
    const timeout = setTimeout(() => {
      setIsReady(true)
    }, 100)

    return () => {
      resizeObserver.disconnect()
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`w-full ${className}`}
      style={{ minHeight: `${minHeight}px`, height: `${minHeight}px` }}
    >
      {isReady ? children : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#E8896A] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}