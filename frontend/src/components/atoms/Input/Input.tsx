import React from 'react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean
    helperText?: string
}

export const Input: React.FC<InputProps> = ({
    error = false,
    helperText,
    className = '',
    ...props
}) => {
    return (
        <div className="w-full">
            <input
                className={`input input-bordered w-full ${error ? 'input-error' : ''} ${className}`}
                aria-invalid={error}
                {...props}
            />
            {helperText && (
                <span className={`text-sm mt-1 ${error ? 'text-error' : 'text-base-content/70'}`}>
                    {helperText}
                </span>
            )}
        </div>
    )
}

export default Input
