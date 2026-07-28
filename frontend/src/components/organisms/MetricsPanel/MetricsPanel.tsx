import React from 'react'

interface MetricsData {
    // Classification metrics
    accuracy?: number | null
    precision?: number | null
    recall?: number | null
    f1Score?: number | null

    // Regression metrics
    r2Score?: number | null
    mae?: number | null
    rmse?: number | null
    mape?: number | null
}

export interface MetricsPanelProps {
    problemType: 'classification' | 'regression'
    metrics: MetricsData
    modelName?: string
    compact?: boolean
}

interface MetricCardProps {
    label: string
    value: number | null | undefined
    icon: string
    format?: (val: number) => string
    colorClass?: string
}

const MetricCard: React.FC<MetricCardProps> = ({
    label,
    value,
    icon,
    format = (val) => val.toFixed(4),
    colorClass = 'text-primary'
}) => {
    const displayValue = value !== null && value !== undefined ? format(value) : 'N/A'

    // Determine color based on value (for metrics where higher is better)
    const getColorClass = () => {
        if (value === null || value === undefined) return 'text-base-content/50'
        if (value >= 0.9) return 'text-success'
        if (value >= 0.7) return 'text-primary'
        if (value >= 0.5) return 'text-warning'
        return 'text-error'
    }

    return (
        <div className="stats shadow bg-base-100">
            <div className="stat">
                <div className="stat-figure text-primary">
                    <span className={`material-symbols-rounded text-4xl ${colorClass}`}>
                        {icon}
                    </span>
                </div>
                <div className="stat-title text-base-content/70">{label}</div>
                <div className={`stat-value text-3xl ${getColorClass()}`}>
                    {displayValue}
                </div>
            </div>
        </div>
    )
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
    problemType,
    metrics,
    modelName,
    compact = false
}) => {
    const classificationMetrics = [
        { label: 'Accuracy', value: metrics.accuracy, icon: 'target', key: 'accuracy', format: (val: number) => val.toFixed(4) },
        { label: 'Precision', value: metrics.precision, icon: 'precision_manufacturing', key: 'precision', format: (val: number) => val.toFixed(4) },
        { label: 'Recall', value: metrics.recall, icon: 'find_in_page', key: 'recall', format: (val: number) => val.toFixed(4) },
        { label: 'F1-Score', value: metrics.f1Score, icon: 'balance', key: 'f1', format: (val: number) => val.toFixed(4) }
    ]

    const regressionMetrics = [
        {
            label: 'R² Score',
            value: metrics.r2Score,
            icon: 'show_chart',
            key: 'r2',
            format: (val: number) => val.toFixed(4)
        },
        {
            label: 'MAE',
            value: metrics.mae,
            icon: 'straighten',
            key: 'mae',
            format: (val: number) => val.toFixed(2)
        },
        {
            label: 'RMSE',
            value: metrics.rmse,
            icon: 'functions',
            key: 'rmse',
            format: (val: number) => val.toFixed(2)
        },
        {
            label: 'MAPE',
            value: metrics.mape,
            icon: 'percent',
            key: 'mape',
            format: (val: number) => `${(val * 100).toFixed(2)}%`
        }
    ]

    const metricsToDisplay = problemType === 'classification'
        ? classificationMetrics
        : regressionMetrics

    return (
        <div className="space-y-4">
            {modelName && (
                <div className="flex items-center gap-2">
                    <span className="material-symbols-rounded text-primary">emoji_events</span>
                    <h3 className="text-xl font-semibold">Best Model: {modelName}</h3>
                </div>
            )}

            <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
                {metricsToDisplay.map((metric) => (
                    <MetricCard
                        key={metric.key}
                        label={metric.label}
                        value={metric.value}
                        icon={metric.icon}
                        format={metric.format}
                    />
                ))}
            </div>
        </div>
    )
}

export default MetricsPanel
