import { useCallback, useEffect, useRef } from "react"
import { X } from "lucide-react"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  closeLabel?: string
}

function Modal({
  open,
  onClose,
  title,
  children,
  closeLabel = "Tutup dialog",
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
        <div className="flex items-center justify-between gap-3">
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

        <div className="mt-4 space-y-3">{children}</div>
      </div>
    </div>
  )
}

export default Modal
