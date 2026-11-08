import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  article: motion.article,
  aside: motion.aside,
  li: motion.li,
} as const

const PLAIN_TAGS = {
  div: "div",
  section: "section",
  article: "article",
  aside: "aside",
  li: "li",
} as const

type RevealTag = keyof typeof MOTION_TAGS

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
  as?: RevealTag
}

function Reveal({ children, delay = 0, className, as = "div" }: RevealProps) {
  const reducedMotion = useReducedMotion()

  // prefers-reduced-motion: konten langsung tampil pada posisi akhir, tanpa
  // motion di sini sama sekali supaya tidak ada keyframe yang jalan.
  if (reducedMotion) {
    const PlainTag = PLAIN_TAGS[as]

    return <PlainTag className={className}>{children}</PlainTag>
  }

  const MotionTag = MOTION_TAGS[as]

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay,
      }}
    >
      {children}
    </MotionTag>
  )
}

export default Reveal
