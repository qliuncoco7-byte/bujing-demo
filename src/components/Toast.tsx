import { Icon } from './Icon'

export type ToastData = {
  id: number
  message: string
  actionLabel?: string
  action?: 'undo'
}

export function Toast({
  toast,
  onAction,
  onClose,
}: {
  toast: ToastData | null
  onAction: () => void
  onClose: () => void
}) {
  if (!toast) return null
  return (
    <div className="toast" role="status" key={toast.id}>
      <span className="toast-check">
        <Icon name="check" size={13} />
      </span>
      <span className="toast-message">{toast.message}</span>
      {toast.actionLabel && (
        <button type="button" className="toast-action" onClick={onAction}>
          {toast.actionLabel}
        </button>
      )}
      <button type="button" className="toast-close" onClick={onClose} aria-label="关闭提示">
        <Icon name="close" size={13} />
      </button>
      <span className="toast-timer" aria-hidden="true" />
    </div>
  )
}
