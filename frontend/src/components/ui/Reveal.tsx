import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

import {
  REVEAL_OFFSET_Y,
  REVEAL_VIEWPORT,
  revealTransition,
} from "../../lib/motion"

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
  id?: string
  role?: string
  ariaLabel?: string
}

function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
  id,
  role,
  ariaLabel,
}: RevealProps) {
  const reducedMotion = useReducedMotion()

  // prefers-reduced-motion: konten langsung tampil pada posisi akhir, tanpa
  // motion di sini sama sekali supaya tidak ada keyframe yang jalan.
  if (reducedMotion) {
    const PlainTag = PLAIN_TAGS[as]

    return (
      <PlainTag
        id={id}
        role={role}
        aria-label={ariaLabel}
        className={className}
      >
        {children}
      </PlainTag>
    )
  }

  const MotionTag = MOTION_TAGS[as]

  return (
    <MotionTag
      id={id}
      role={role}
      aria-label={ariaLabel}
      className={className}
      initial={{ opacity: 0, y: REVEAL_OFFSET_Y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={revealTransition(delay)}
    >
      {children}
    </MotionTag>
  )
}

export default Reveal
