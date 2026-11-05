import { Children, type ReactNode } from "react"
import { motion, useReducedMotion, type Variants } from "motion/react"

import {
  REVEAL_DURATION,
  REVEAL_EASING,
  REVEAL_OFFSET_Y,
  REVEAL_VIEWPORT,
  cappedStagger,
} from "../../lib/motion"

// Parent stagger: mengatur kaskade antar anak. Jeda per anak dihitung dari
// jumlah React children lewat variant function + custom supaya daftar panjang
// ikut dipadatkan (cappedStagger) dan total kaskade tidak melewati batas.
const containerVariants: Variants = {
  hidden: {},
  show: (count: number) => ({
    transition: { staggerChildren: cappedStagger(count) },
  }),
}

// Anak stagger: mewarisi perputaran hidden -> show dari parent; delay-nya
// ditata otomatis oleh staggerChildren, jadi anak tidak memasang whileInView
// sendiri (menghindari animasi ganda).
const itemVariants: Variants = {
  hidden: { opacity: 0, y: REVEAL_OFFSET_Y },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: REVEAL_DURATION, ease: REVEAL_EASING },
  },
}

type RevealTag = keyof typeof MOTION_TAGS

// Tag yang dibolehkan untuk wadah; daftar tertutup supaya pemetaan motion-
//nya statis tanpa pemanggilan motion.create() dinamis saat render.
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
  // Dipakai saat anak butuh h-full di dalam grid/flex agar kartu tetap
  // mengisi tinggi kolomnya seperti sebelum dibungkus wrapper.
  className?: string
}

// Wadah stagger: setiap anak langsung harus dibungkus <RevealItem> supaya
// varian hidden/show menyebar ke semuanya. Grid/flex ditangani lewat
// className (mis. "grid gap-4 lg:grid-cols-2") sehingga layout halaman
// tidak berubah.
function RevealList({ children, className, as = "div" }: RevealListProps) {
  const reducedMotion = useReducedMotion()

  // prefers-reduced-motion: tanpa stagger sama sekali; semua anak tampil
  // langsung pada posisi akhir, animasi tidak jalan di berkas ini.
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

// Anak stagger yang mewarisi varian dari RevealList. RevealItem menjadi
// grid/flex item menggantikan elemen aslinya, jadi tata letak grid tidak
// berubah.
//
// Item yang sudah selesai animasinya tidak mengulang saat refetch atau
// filter berubah: initial hanya berlaku saat mount, kuncinya tetap id data
// dari pemanggil. Item baru yang muncul cukup animasinya sendiri.
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
