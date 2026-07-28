import { Input } from '../../atoms/Input'
import type { InputProps } from '../../atoms/Input'

export interface FormFieldProps extends Omit<InputProps, 'error'> {
    label?: string
    helperText?: string
    error?: string
    required?: boolean
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    helperText,
    error,
    required,
    id,
    ...inputProps
}) => {
    const inputId = id || `field-${label?.toLowerCase().replace(/\s+/g, '-')}`

    return (
        <div className="form-control w-full">
            {label && (
                <label className="label" htmlFor={inputId}>
                    <span className="label-text font-medium">
                        {label}
                        {required && <span className="text-error ml-1">*</span>}
                    </span>
                </label>
            )}
            <Input
                id={inputId}
                error={!!error}
                helperText={error || helperText}
                aria-required={required}
                {...inputProps}
            />
        </div>
    )
}

export default FormField
