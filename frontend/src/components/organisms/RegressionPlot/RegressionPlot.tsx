import React from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts'

export interface RegressionPlotProps {
    predictions: number[]
    actuals: number[]
    title?: string
}

export const RegressionPlot: React.FC<RegressionPlotProps> = ({ predictions, actuals, title = "Actual vs Predicted" }) => {
    if (!predictions || !actuals || predictions.length === 0) {
        return (
            <div className="text-center py-12 text-base-content/50">
                <span className="material-symbols-rounded text-6xl mb-4">scatter_plot</span>
                <p>Regression plot not available</p>
                <p className="text-sm mt-2">Only available for regression models</p>
            </div>
        )
    }

    // Prepare scatter data
    const scatterData = predictions.map((pred, index) => ({
        predicted: pred,
        actual: actuals[index],
        index: index
    }))

    // Calculate perfect prediction line bounds
    const allValues = [...predictions, ...actuals]
    const minVal = Math.min(...allValues)
    const maxVal = Math.max(...allValues)



    // Calculate R² score
    const meanActual = actuals.reduce((a, b) => a + b, 0) / actuals.length
    const ssTot = actuals.reduce((sum, y) => sum + Math.pow(y - meanActual, 2), 0)
    const ssRes = actuals.reduce((sum, y, i) => sum + Math.pow(y - predictions[i], 2), 0)
    const r2 = 1 - (ssRes / ssTot)

    // Calculate MAE
    const mae = actuals.reduce((sum, y, i) => sum + Math.abs(y - predictions[i]), 0) / actuals.length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{title}</h3>
                <div className="flex gap-2">
                    <div className="badge badge-primary">R² = {r2.toFixed(4)}</div>
                    <div className="badge badge-secondary">MAE = {mae.toFixed(2)}</div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                    <XAxis
                        type="number"
                        dataKey="predicted"
                        name="Predicted"
                        label={{ value: 'Predicted Values', position: 'insideBottom', offset: -10 }}
                        stroke="currentColor"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        type="number"
                        dataKey="actual"
                        name="Actual"
                        label={{ value: 'Actual Values', angle: -90, position: 'insideLeft' }}
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
                        formatter={(value: any) => value?.toFixed(2) || 'N/A'}
                        cursor={{ strokeDasharray: '3 3' }}
                    />
                    <Legend />

                    {/* Perfect prediction line (y=x) */}
                    <ReferenceLine
                        segment={[{ x: minVal, y: minVal }, { x: maxVal, y: maxVal }]}
                        stroke="#94a3b8"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        label="Perfect Prediction"
                    />

                    {/* Actual scatter points */}
                    <Scatter
                        name="Predictions"
                        data={scatterData}
                        fill="#3b82f6"
                        fillOpacity={0.6}
                    />
                </ScatterChart>
            </ResponsiveContainer>

            {/* Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-base-200">
                    <div className="text-2xl font-bold text-primary">{scatterData.length}</div>
                    <div className="text-xs text-base-content/70 mt-1">Data Points</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-base-200">
                    <div className="text-2xl font-bold text-success">
                        {r2 >= 0.9 ? 'Excellent' : r2 >= 0.7 ? 'Good' : r2 >= 0.5 ? 'Fair' : 'Poor'}
                    </div>
                    <div className="text-xs text-base-content/70 mt-1">Model Fit Quality</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-base-200">
                    <div className="text-2xl font-bold text-secondary">{(Math.abs(r2 - 1) * 100).toFixed(1)}%</div>
                    <div className="text-xs text-base-content/70 mt-1">Error from Perfect</div>
                </div>
            </div>

            {/* Interpretation Guide */}
            <div className="alert alert-info">
                <span className="material-symbols-rounded">info</span>
                <div>
                    <div className="font-semibold">Reading the Plot</div>
                    <div className="text-sm">
                        Points closer to the diagonal line indicate better predictions.
                        R² of 1.0 means perfect predictions, closer to 0 means poor fit.
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RegressionPlot
