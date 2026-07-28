export interface CardProps {
    title?: string
    subtitle?: string
    children: React.ReactNode
    className?: string
    actions?: React.ReactNode
    compact?: boolean
}

export const Card: React.FC<CardProps> = ({
    title,
    subtitle,
    children,
    className = '',
    actions,
    compact = false,
}) => {
    return (
        <div className={`card bg-base-100 shadow-lg ${className}`}>
            <div className={`card-body ${compact ? 'p-4' : ''}`}>
                {(title || subtitle) && (
                    <div className="mb-2">
                        {title && <h2 className="card-title text-2xl">{title}</h2>}
                        {subtitle && (
                            <p className="text-base-content/70 text-sm mt-1">{subtitle}</p>
                        )}
                    </div>
                )}
                <div className="flex-grow">{children}</div>
                {actions && <div className="card-actions justify-end mt-4">{actions}</div>}
            </div>
        </div>
    )
}

export default Card
