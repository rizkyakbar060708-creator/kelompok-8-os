import { useCallback, useEffect, useRef } from "react"
import { X } from "lucide-react"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  closeLabel?: string
  footer?: React.ReactNode
}

function Modal({
  open,
  onClose,
  title,
  children,
  closeLabel = "Tutup dialog",
  footer,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  const handleKeydown = useCallback(
    (event: KeyboardEvent) => {
      if (!open || !modalRef.current) {
        return
      }

      if (event.key === "Escape") {
        onClose()
        return
      }

      if (event.key !== "Tab") {
        return
      }

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
      )

      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last || !modalRef.current.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      }
    },
    [open, onClose],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    document.addEventListener("keydown", handleKeydown)
    document.body.style.overflow = "hidden"

    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    )
    focusable?.[0]?.focus()

    return () => {
      document.removeEventListener("keydown", handleKeydown)
      document.body.style.overflow = ""
    }
  }, [open, handleKeydown])

  if (!open) {
    return null
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={modalRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2
            id="modal-title"
            className="text-base font-semibold tracking-tight text-slate-900"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="icon-button shrink-0"
            aria-label={closeLabel}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">{children}</div>

        {footer && (
          <div
            className="mt-6 pt-4 border-t border-slate-900/[0.06] flex flex-col sm:flex-row sm:items-end gap-3"
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export default Modal
