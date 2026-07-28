import { useEffect, useState } from 'react'
import Icon from '../../atoms/Icon'

type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
    message: string
    type?: ToastType
    duration?: number
    onClose?: () => void
    show?: boolean
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'info',
    duration = 4000,
    onClose,
    show = true,
}) => {
    const [visible, setVisible] = useState(show)

    useEffect(() => {
        setVisible(show)
    }, [show])

    useEffect(() => {
        if (visible && duration > 0) {
            const timer = setTimeout(() => {
                setVisible(false)
                onClose?.()
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [visible, duration, onClose])

    if (!visible) return null

    const typeStyles = {
        success: 'alert-success',
        error: 'alert-error',
        warning: 'alert-warning',
        info: 'alert-info',
    }

    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info',
    }

    return (
        <div className={`alert ${typeStyles[type]} shadow-lg`}>
            <Icon name={icons[type]} size="md" />
            <div className="flex-grow">
                <span>{message}</span>
            </div>
            <button
                className="btn btn-sm btn-ghost btn-circle"
                onClick={() => {
                    setVisible(false)
                    onClose?.()
                }}
                aria-label="Close toast"
            >
                <Icon name="close" size="sm" />
            </button>
        </div>
    )
}

export default Toast
