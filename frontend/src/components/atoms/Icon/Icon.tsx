import React from 'react'

export interface IconProps {
    name: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    className?: string
    ariaLabel?: string
}

export const Icon: React.FC<IconProps> = ({
    name,
    size = 'md',
    className = '',
    ariaLabel,
}) => {
    const sizes = {
        sm: 'text-lg',  // 18px
        md: 'text-xl',  // 20px
        lg: 'text-2xl', // 24px
        xl: 'text-4xl', // 32px
    }

    return (
        <span
            className={`material-symbols-rounded ${sizes[size]} ${className}`}
            aria-label={ariaLabel}
            aria-hidden={!ariaLabel}
        >
            {name}
        </span>
    )
}

export default Icon
