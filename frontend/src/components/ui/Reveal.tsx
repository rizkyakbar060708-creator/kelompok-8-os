import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

import { REVEAL_OFFSET_Y, REVEAL_VIEWPORT, revealTransition } from "../../lib/motion"

// Tag HTML yang dibolehkan untuk Reveal. Daftar tertutup supaya pemetaan
// motion-nya bisa statis (motion div/section/article/...) tanpa pemanggilan
// motion.create() dinamis saat render.
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
  // Jeda sebelum animasi berjalan (detik); dipakai menata urutan "muncul
  // satu per satu" untuk elemen yang sudah berada di atas layar.
  delay?: number
  className?: string
  as?: RevealTag
}

// Pembungkus reveal tunggal: fade-in + naik 24px saat elemen masuk layar.
// Dipakai untuk judul, panel utama, kartu, dst. Animasi hanya menyentuh
// opacity dan transform — dipasang pada wrapper, jadi permukaan kaca
// (glass-panel/glass-card) tidak ikut dianimasikan backdrop-filter-nya.
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
