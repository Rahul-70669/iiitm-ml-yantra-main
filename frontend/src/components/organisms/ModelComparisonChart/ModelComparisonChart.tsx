import React from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'

interface ModelResult {
    modelId: string
    name: string
    algorithm: string
    metrics: {
        accuracy?: number | null
        precision?: number | null
        recall?: number | null
        f1Score?: number | null
        r2Score?: number | null
        mae?: number | null
        rmse?: number | null
    }
    isBest: boolean
}

export interface ModelComparisonChartProps {
    models: ModelResult[]
    problemType: 'classification' | 'regression'
}

export const ModelComparisonChart: React.FC<ModelComparisonChartProps> = ({
    models,
    problemType
}) => {
    if (!models || models.length === 0) {
        return (
            <div className="text-center py-12 text-base-content/50">
                <span className="material-symbols-rounded text-6xl mb-4">leaderboard</span>
                <p>No models to compare</p>
            </div>
        )
    }

    // Prepare data for chart
    const chartData = models.map(model => {
        if (problemType === 'classification') {
            return {
                name: model.name,
                Accuracy: model.metrics.accuracy || 0,
                Precision: model.metrics.precision || 0,
                Recall: model.metrics.recall || 0,
                'F1-Score': model.metrics.f1Score || 0,
                isBest: model.isBest
            }
        } else {
            // For regression, normalize MAE and RMSE for better visualization
            return {
                name: model.name,
                'R² Score': model.metrics.r2Score || 0,
                isBest: model.isBest
            }
        }
    })

    const classificationColors = {
        'Accuracy': '#10b981',
        'Precision': '#3b82f6',
        'Recall': '#8b5cf6',
        'F1-Score': '#f59e0b'
    }

    const regressionColors = {
        'R² Score': '#10b981'
    }

    const colors = problemType === 'classification' ? classificationColors : regressionColors

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Model Performance Comparison</h3>
                <div className="text-sm text-base-content/70">
                    {models.length} model{models.length !== 1 ? 's' : ''} trained
                </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                    <XAxis
                        dataKey="name"
                        stroke="currentColor"
                        style={{ fontSize: '12px' }}
                        angle={-15}
                        textAnchor="end"
                        height={80}
                    />
                    <YAxis
                        domain={problemType === 'classification' ? [0, 1] : [0, 1]}
                        tickFormatter={(value) => value.toFixed(2)}
                        stroke="currentColor"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--b1))',
                            border: '1px solid hsl(var(--bc) / 0.2)',
                            borderRadius: '0.5rem',
                            padding: '0.75rem'
                        }}
                        formatter={(value: number | undefined) => (value ?? 0).toFixed(4)}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="circle"
                    />

                    {Object.entries(colors).map(([key, color]) => (
                        <Bar
                            key={key}
                            dataKey={key}
                            fill={color}
                            radius={[4, 4, 0, 0]}
                        />
                    ))}
                </BarChart>
            </ResponsiveContainer>

            {/* Best Model Highlight */}
            {models.some(m => m.isBest) && (
                <div className="alert alert-success">
                    <span className="material-symbols-rounded">emoji_events</span>
                    <span>
                        <strong>{models.find(m => m.isBest)?.name}</strong> achieved the best performance
                        {problemType === 'classification'
                            ? ` with ${(models.find(m => m.isBest)?.metrics.accuracy! * 100).toFixed(2)}% accuracy`
                            : ` with R² score of ${models.find(m => m.isBest)?.metrics.r2Score?.toFixed(4)}`
                        }
                    </span>
                </div>
            )}
        </div>
    )
}

export default ModelComparisonChart
