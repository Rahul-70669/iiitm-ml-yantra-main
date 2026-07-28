import { useEffect, useRef } from 'react'
import Button from '../../atoms/Button'
import Icon from '../../atoms/Icon'

export interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    actions?: React.ReactNode
    size?: 'sm' | 'md' | 'lg' | 'full'
    className?: string
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    actions,
    size = 'md',
    className = '',
}) => {
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return

        if (isOpen) {
            dialog.showModal()
        } else {
            dialog.close()
        }
    }, [isOpen])

    useEffect(() => {
        const dialog = dialogRef.current
        if (!dialog) return

        const handleClose = () => {
            onClose()
        }

        dialog.addEventListener('close', handleClose)
        return () => dialog.removeEventListener('close', handleClose)
    }, [onClose])

    const sizeClasses = {
        sm: 'modal-box max-w-sm',
        md: 'modal-box max-w-2xl',
        lg: 'modal-box max-w-5xl',
        full: 'modal-box max-w-full w-11/12 h-5/6',
    }

    return (
        <dialog ref={dialogRef} className="modal" onCancel={onClose}>
            <div className={`${sizeClasses[size]} ${className}`}>
                {title && (
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-2xl">{title}</h3>
                        <button
                            className="btn btn-sm btn-ghost btn-circle"
                            onClick={onClose}
                            aria-label="Close modal"
                        >
                            <Icon name="close" />
                        </button>
                    </div>
                )}
                <div className="py-4">{children}</div>
                {actions && <div className="modal-action">{actions}</div>}
                {!actions && !title && (
                    <div className="modal-action">
                        <Button variant="ghost" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                )}
            </div>
            <form method="dialog" className="modal-backdrop">
                <button onClick={onClose} aria-label="Close modal">close</button>
            </form>
        </dialog>
    )
}

export default Modal
