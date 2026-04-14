'use client'

import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.04,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] } },
}

interface AnimatedListProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedItem({ children, className }: AnimatedListProps) {
  return (
    <motion.div variants={item} className={className}>
      {children}
    </motion.div>
  )
}
