import React from 'react'

export interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg'
    color?: 'primary' | 'secondary' | 'accent'
    className?: string
}

export const Spinner: React.FC<SpinnerProps> = ({
    size = 'md',
    color = 'primary',
    className = '',
}) => {
    const sizeClasses = {
        sm: 'loading-sm',
        md: 'loading-md',
        lg: 'loading-lg',
    }

    const colorClasses = {
        primary: 'text-primary',
        secondary: 'text-secondary',
        accent: 'text-accent',
    }

    return (
        <span
            className={`loading loading-spinner ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
            role="status"
            aria-live="polite"
        >
            <span className="sr-only">Loading...</span>
        </span>
    )
}

export default Spinner
