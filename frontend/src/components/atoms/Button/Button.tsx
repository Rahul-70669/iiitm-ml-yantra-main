import React from 'react'
import Icon from '../Icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'outline' | 'link'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    fullWidth?: boolean
    icon?: string
    iconPosition?: 'left' | 'right'
    children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    icon,
    iconPosition = 'left',
    children,
    className = '',
    type = 'button',
    ...props
}) => {
    const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        accent: 'btn-accent',
        ghost: 'btn-ghost',
        outline: 'btn-outline',
        link: 'btn-link',
    }

    const sizeClasses = {
        sm: 'btn-sm',
        md: '',
        lg: 'btn-lg',
    }

    return (
        <button
            type={type}
            className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'btn-block' : ''
                } ${className}`}
            disabled={disabled || loading}
            aria-busy={loading}
            aria-disabled={disabled || loading}
            {...props}
        >
            {loading && <span className="loading loading-spinner loading-sm" />}
            {!loading && icon && iconPosition === 'left' && (
                <Icon name={icon} size={size === 'lg' ? 'lg' : 'md'} />
            )}
            <span>{children}</span>
            {!loading && icon && iconPosition === 'right' && (
                <Icon name={icon} size={size === 'lg' ? 'lg' : 'md'} />
            )}
        </button>
    )
}

export default Button
