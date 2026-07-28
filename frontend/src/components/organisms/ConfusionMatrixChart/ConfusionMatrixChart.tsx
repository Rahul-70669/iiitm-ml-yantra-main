import React from 'react'

export interface ConfusionMatrixChartProps {
    confusionMatrix: number[][]
    labels?: string[]
}

export const ConfusionMatrixChart: React.FC<ConfusionMatrixChartProps> = ({
    confusionMatrix,
    labels
}) => {
    if (!confusionMatrix || confusionMatrix.length === 0) {
        return (
            <div className="text-center py-12 text-base-content/50">
                <span className="material-symbols-rounded text-6xl mb-4">grid_off</span>
                <p>No confusion matrix available</p>
            </div>
        )
    }

    const numClasses = confusionMatrix.length

    // Generate default labels if not provided
    const classLabels = labels || Array.from({ length: numClasses }, (_, i) => `Class ${i}`)

    // Find max value for color scaling
    const maxValue = Math.max(...confusionMatrix.flat())

    // Get cell color based on value
    const getCellColor = (value: number) => {
        const intensity = maxValue > 0 ? value / maxValue : 0
        // HSL color: hue=220 (blue), saturation=80%, lightness varies
        const lightness = 90 - (intensity * 40) // 90% to 50%
        return `hsl(220, 80%, ${lightness}%)`
    }

    // Get text color based on background intensity
    const getTextColor = (value: number) => {
        const intensity = maxValue > 0 ? value / maxValue : 0
        return intensity > 0.5 ? 'text-white' : 'text-base-content'
    }

    // Calculate total for percentage
    const rowTotals = confusionMatrix.map(row => row.reduce((sum, val) => sum + val, 0))

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Confusion Matrix</h3>
                <div className="text-sm text-base-content/70">
                    Predicted vs Actual
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                    {/* Header */}
                    <div className="flex items-center mb-2">
                        <div className="w-32" /> {/* Empty corner */}
                        <div className="flex-1">
                            <div className="text-center font-semibold text-sm text-base-content/70 mb-1">
                                Predicted
                            </div>
                            <div className="flex justify-around">
                                {classLabels.map((label, i) => (
                                    <div key={i} className="flex-1 text-center text-sm font-medium">
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Matrix */}
                    <div className="flex">
                        {/* Y-axis label */}
                        <div className="flex flex-col justify-center mr-2">
                            <div
                                className="writing-mode-vertical text-sm font-semibold text-base-content/70"
                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                            >
                                Actual
                            </div>
                        </div>

                        {/* Rows */}
                        <div className="flex-1 space-y-1">
                            {confusionMatrix.map((row, rowIndex) => (
                                <div key={rowIndex} className="flex items-center gap-1">
                                    {/* Row label */}
                                    <div className="w-24 text-right text-sm font-medium pr-2">
                                        {classLabels[rowIndex]}
                                    </div>

                                    {/* Cells */}
                                    <div className="flex flex-1 gap-1">
                                        {row.map((value, colIndex) => {
                                            const percentage = rowTotals[rowIndex] > 0
                                                ? ((value / rowTotals[rowIndex]) * 100).toFixed(1)
                                                : '0.0'
                                            const isCorrect = rowIndex === colIndex

                                            return (
                                                <div
                                                    key={colIndex}
                                                    className={`
                            flex-1 aspect-square flex flex-col items-center justify-center
                            rounded transition-all hover:scale-105 cursor-pointer
                            ${isCorrect ? 'ring-2 ring-success' : ' ring-1 ring-base-300'}
                            ${getTextColor(value)}
                          `}
                                                    style={{ backgroundColor: getCellColor(value) }}
                                                    title={`Actual: ${classLabels[rowIndex]}, Predicted: ${classLabels[colIndex]}\n${value} samples (${percentage}%)`}
                                                >
                                                    <div className="text-lg font-bold">{value}</div>
                                                    <div className="text-xs opacity-80">{percentage}%</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 flex items-center justify-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded ring-2 ring-success" style={{ background: getCellColor(maxValue) }} />
                            <span className="text-base-content/70">Correct Predictions</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <div className="w-4 h-4 rounded" style={{ background: getCellColor(maxValue) }} />
                                <div className="w-4 h-4 rounded" style={{ background: getCellColor(maxValue * 0.5) }} />
                                <div className="w-4 h-4 rounded" style={{ background: getCellColor(0) }} />
                            </div>
                            <span className="text-base-content/70">High → Low Frequency</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConfusionMatrixChart
