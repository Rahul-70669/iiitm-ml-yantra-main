import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export interface FeatureImportanceChartProps {
    featureImportance: Record<string, number>
    maxFeatures?: number
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({
    featureImportance,
    maxFeatures = 10
}) => {
    if (!featureImportance || Object.keys(featureImportance).length === 0) {
        return (
            <div className="text-center py-12 text-base-content/50">
                <span className="material-symbols-rounded text-6xl mb-4">bar_chart_off</span>
                <p>No feature importance available</p>
                <p className="text-sm mt-2">Tree-based models provide feature importance</p>
            </div>
        )
    }

    // Sort features by importance and take top N
    const sortedData = Object.entries(featureImportance)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxFeatures)
        .map(([name, importance]) => ({
            name,
            importance: importance * 100, // Convert to percentage
            rawImportance: importance
        }))

    // Color gradient from yellow to orange
    const getColor = (index: number, total: number) => {
        const ratio = index / total
        const hue = 45 - (ratio * 15) // 45 (yellow) to 30 (orange)
        const lightness = 60 - (ratio * 20) // 60% to 40%
        return `hsl(${hue}, 90%, ${lightness}%)`
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Feature Importance</h3>
                <div className="text-sm text-base-content/70">
                    Top {Math.min(maxFeatures, sortedData.length)} features
                </div>
            </div>

            <ResponsiveContainer width="100%" height={Math.max(300, sortedData.length * 40)}>
                <BarChart
                    data={sortedData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                    <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                        stroke="currentColor"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={150}
                        stroke="currentColor"
                        style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(var(--b1))',
                            border: '1px solid hsl(var(--bc) / 0.2)',
                            borderRadius: '0.5rem',
                            padding: '0.5rem'
                        }}
                        formatter={(value: number | undefined) => [
                            `${(value ?? 0).toFixed(2)}%`,
                            'Importance'
                        ]}
                        labelFormatter={(label) => label}
                    />
                    <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                        {sortedData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={getColor(index, sortedData.length)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 rounded-lg bg-base-200">
                    <div className="text-2xl font-bold text-primary">
                        {sortedData[0]?.importance.toFixed(1)}%
                    </div>
                    <div className="text-xs text-base-content/70 mt-1">Most Important</div>
                    <div className="text-sm font-medium truncate" title={sortedData[0]?.name}>
                        {sortedData[0]?.name}
                    </div>
                </div>
                <div className="text-center p-3 rounded-lg bg-base-200">
                    <div className="text-2xl font-bold text-primary">
                        {sortedData.reduce((sum, d) => sum + d.importance, 0).toFixed(1)}%
                    </div>
                    <div className="text-xs text-base-content/70 mt-1">Cumulative</div>
                    <div className="text-sm font-medium">Top {sortedData.length}</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-base-200">
                    <div className="text-2xl font-bold text-primary">
                        {Object.keys(featureImportance).length}
                    </div>
                    <div className="text-xs text-base-content/70 mt-1">Total Features</div>
                    <div className="text-sm font-medium">In Model</div>
                </div>
            </div>
        </div>
    )
}

export default FeatureImportanceChart
