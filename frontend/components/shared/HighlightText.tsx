'use client'

/**
 * HighlightText Component
 * Highlights search terms within text for better visual feedback
 * 
 * Usage:
 * <HighlightText text="Product Name" highlight="prod" />
 */

interface HighlightTextProps {
  text: string
  highlight: string
  className?: string
  highlightClassName?: string
}

export function HighlightText({ 
  text, 
  highlight, 
  className = '', 
  highlightClassName = 'bg-[#FDE8DF] text-[#C1614A] font-medium' 
}: HighlightTextProps) {
  if (!highlight.trim()) {
    return <span className={className}>{text}</span>
  }

  // Escape special regex characters
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  
  // Split text by highlight term (case-insensitive)
  const regex = new RegExp(`(${escapedHighlight})`, 'gi')
  const parts = text.split(regex)

  return (
    <span className={className}>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  )
}
