import type { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: React.ReactNode
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="glass-panel relative overflow-hidden rounded-3xl px-6 py-14 text-center">
      <span className="orb -right-16 -top-16 h-52 w-52 bg-violet-400/25" />

      <span className="glass-chip relative h-16 w-16 rounded-2xl border-white/70 bg-white/65 text-indigo-600">
        <Icon size={24} />
      </span>

      <p className="relative mt-5 text-base font-semibold tracking-tight text-slate-900">
        {title}
      </p>

      <p className="relative mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">
        {description}
      </p>

      {action && <div className="relative mt-6">{action}</div>}
    </div>
  )
}

export default EmptyState