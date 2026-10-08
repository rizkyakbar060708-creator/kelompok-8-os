interface CardProps {
  children: React.ReactNode
  className?: string
}

function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`glass-card glass-card-hover rounded-2xl p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  )
}

export default Card
