import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export interface ROCCurveChartProps {
    rocData?: { fpr: number[]; tpr: number[]; thresholds: number[] }
    auc?: number
}

export const ROCCurveChart: React.FC<ROCCurveChartProps> = ({ rocData, auc }) => {
    if (!rocData || !rocData.fpr || !rocData.tpr) {
        return (
            <div className="text-center py-12 text-base-content/50">
                <span className="material-symbols-rounded text-6xl mb-4">show_chart</span>
                <p>ROC Curve not available</p>
                <p className="text-sm mt-2">Only available for binary classification models</p>
            </div>
        )
    }

    // Prepare data for Recharts
    const chartData = rocData.fpr.map((fpr, index) => ({
        fpr: fpr,
        tpr: rocData.tpr[index],
        name: `Point ${index}`
    }))

    // Add diagonal reference line data
    const referenceLine = [
        { fpr: 0, tpr: 0, ref: 0 },
        { fpr: 1, tpr: 1, ref: 1 }
    ]

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">ROC Curve</h3>
                {auc !== undefined && (
                    <div className="badge badge-lg badge-primary">
                        AUC = {auc.toFixed(4)}
                    </div>
                )}
            </div>

            <ResponsiveContainer width="100%" height={400}>
                <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
                    <XAxis
                        dataKey="fpr"
                        type="number"
                        domain={[0, 1]}
                        label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5 }}
                        stroke="currentColor"
                        style={{ fontSize: '12px' }}
                    />
                    <YAxis
                        dataKey="tpr"
                        type="number"
                        domain={[0, 1]}
                        label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft' }}
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
                        formatter={(value: any) => value?.toFixed(4) || 'N/A'}
                    />
                    <Legend />

                    {/* Reference diagonal line */}
                    <Line
                        data={referenceLine}
                        type="monotone"
                        dataKey="ref"
                        stroke="#94a3b8"
                        strokeDasharray="5 5"
                        dot={false}
                        name="Random Classifier"
                        strokeWidth={1}
                    />

                    {/* Actual ROC curve */}
                    <Line
                        data={chartData}
                        type="monotone"
                        dataKey="tpr"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={false}
                        name="Model ROC"
                    />
                </LineChart>
            </ResponsiveContainer>

            {/* Interpretation Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-3 rounded-lg bg-success/10 border border-success/20">
                    <div className="text-2xl font-bold text-success mb-1">
                        {auc && auc >= 0.9 ? 'Excellent' : auc && auc >= 0.8 ? 'Good' : auc && auc >= 0.7 ? 'Fair' : 'Poor'}
                    </div>
                    <div className="text-xs text-base-content/70">Model Performance</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-base-200">
                    <div className="text-lg font-bold mb-1">AUC Meaning</div>
                    <div className="text-xs text-base-content/70">
                        Area Under Curve measures classification quality
                    </div>
                </div>
                <div className="text-center p-3 rounded-lg bg-base-200">
                    <div className="text-lg font-bold mb-1">Baseline: 0.5</div>
                    <div className="text-xs text-base-content/70">
                        Random guessing (diagonal line)
                    </div>
                </div>
            </div>

            {/* AUC Interpretation */}
            <div className="alert alert-info">
                <span className="material-symbols-rounded">info</span>
                <div>
                    <div className="font-semibold">What is ROC-AUC?</div>
                    <div className="text-sm">
                        The ROC curve plots True Positive Rate vs False Positive Rate at different thresholds.
                        AUC of 1.0 = perfect classifier, 0.5 = random guessing.
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ROCCurveChart
