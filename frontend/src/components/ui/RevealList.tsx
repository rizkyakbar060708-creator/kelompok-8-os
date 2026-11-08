import { Children, type ReactNode } from "react"
import { motion, useReducedMotion, type Variants } from "motion/react"

import {
  REVEAL_DURATION,
  REVEAL_EASING,
  REVEAL_OFFSET_Y,
  REVEAL_VIEWPORT,
  cappedStagger,
} from "../../lib/motion"

const containerVariants: Variants = {
  hidden: {},
  show: (count: number) => ({
    transition: { staggerChildren: cappedStagger(count) },
  }),
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: REVEAL_OFFSET_Y },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: REVEAL_DURATION, ease: REVEAL_EASING },
  },
}

type RevealTag = keyof typeof MOTION_TAGS

const MOTION_TAGS = {
  div: motion.div,
  section: motion.section,
  ul: motion.ul,
} as const

const PLAIN_TAGS = {
  div: "div",
  section: "section",
  ul: "ul",
} as const

interface RevealListProps {
  children: ReactNode
  className?: string
  as?: RevealTag
}

interface RevealItemProps {
  children: ReactNode
  className?: string
}

function RevealList({ children, className, as = "div" }: RevealListProps) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    const PlainTag = PLAIN_TAGS[as]

    return <PlainTag className={className}>{children}</PlainTag>
  }

  const MotionTag = MOTION_TAGS[as]

  return (
    <MotionTag
      className={className}
      custom={Children.count(children)}
      initial="hidden"
      whileInView="show"
      viewport={REVEAL_VIEWPORT}
      variants={containerVariants}
    >
      {children}
    </MotionTag>
  )
}

function RevealItem({ children, className }: RevealItemProps) {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  )
}

export { RevealItem }
export default RevealList
