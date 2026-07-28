import { forwardRef } from 'react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    options?: Array<{ value: string; label: string }>
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, error, options = [], className = '', ...props }, ref) => {
        return (
            <div className="form-control w-full">
                <select ref={ref} className={`select select-bordered w-full ${className}`} {...props}>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <label className="label">
                        <span className="label-text-alt text-error">{error}</span>
                    </label>
                )}
            </div>
        )
    }
)

Select.displayName = 'Select'

export default Select
