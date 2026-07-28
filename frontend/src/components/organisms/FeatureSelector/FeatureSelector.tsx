import { useState, useEffect } from 'react'
import type { ChangeEvent } from 'react'
import Button from '../../atoms/Button'
import { Select } from '../../atoms/Select'
import toast from 'react-hot-toast'
import apiClient from '../../../services/api'

export interface FeatureSelectorProps {
    sessionId: string
    onComplete: (features: string[], target: string, problemType: 'classification' | 'regression') => void
}

export const FeatureSelector: React.FC<FeatureSelectorProps> = ({ sessionId, onComplete }) => {
    const [columns, setColumns] = useState<string[]>([])
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
    const [targetColumn, setTargetColumn] = useState<string>('')
    const [problemType, setProblemType] = useState<'classification' | 'regression' | null>(null)
    const [loading, setLoading] = useState(true)

    // Fetch columns on mount
    useEffect(() => {
        const fetchColumns = async () => {
            try {
                const stats = await apiClient.getStatistics(sessionId)
                const cols = Object.keys(stats.column_types || {})
                setColumns(cols)
            } catch (error) {
                toast.error('Failed to load dataset columns')
                console.error(error)
            } finally {
                setLoading(false)
            }
        }

        fetchColumns()
    }, [sessionId])

    // Auto-detect problem type when target changes
    useEffect(() => {
        if (!targetColumn) {
            setProblemType(null)
            return
        }

        const detectProblemType = async () => {
            try {
                const stats = await apiClient.getStatistics(sessionId)
                const targetType = stats.column_types[targetColumn]

                // Simple heuristic: if target is object/string, it's classification
                // Otherwise, regression
                if (targetType === 'object' || targetType === 'string') {
                    setProblemType('classification')
                } else {
                    setProblemType('regression')
                }
            } catch (error) {
                console.error('Failed to detect problem type:', error)
                setProblemType('classification') // Default
            }
        }

        detectProblemType()
    }, [targetColumn, sessionId])

    const toggleFeature = (column: string) => {
        if (column === targetColumn) {
            toast.error('Cannot select target column as a feature')
            return
        }

        setSelectedFeatures((prev) =>
            prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
        )
    }

    const selectAll = () => {
        const availableFeatures = columns.filter((c) => c !== targetColumn)
        setSelectedFeatures(availableFeatures)
    }

    const clearSelection = () => {
        setSelectedFeatures([])
    }

    const handleTargetChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const newTarget = e.target.value
        setTargetColumn(newTarget)

        // Remove target from features if selected
        setSelectedFeatures((prev) => prev.filter((f) => f !== newTarget))
    }

    const handleContinue = () => {
        if (selectedFeatures.length === 0) {
            toast.error('Please select at least one feature')
            return
        }

        if (!targetColumn) {
            toast.error('Please select a target variable')
            return
        }

        if (!problemType) {
            toast.error('Problem type could not be determined')
            return
        }

        onComplete(selectedFeatures, targetColumn, problemType)
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Target Variable Selection */}
            <div>
                <label className="label">
                    <span className="label-text font-semibold text-lg">Target Variable</span>
                    <span className="label-text-alt">What are you trying to predict?</span>
                </label>
                <Select
                    value={targetColumn}
                    onChange={handleTargetChange}
                    options={[
                        { value: '', label: 'Select target column...' },
                        ...columns.map((col) => ({ value: col, label: col })),
                    ]}
                />

                {problemType && (
                    <div className={`alert ${problemType === 'classification' ? 'alert-info' : 'alert-success'} mt-2`}>
                        <span className="material-symbols-rounded">
                            {problemType === 'classification' ? 'category' : 'show_chart'}
                        </span>
                        <span>
                            <strong>Detected: {problemType === 'classification' ? 'Classification' : 'Regression'}</strong>
                            <br />
                            <span className="text-sm">
                                {problemType === 'classification'
                                    ? 'Predicting categories or classes'
                                    : 'Predicting continuous numerical values'}
                            </span>
                        </span>
                    </div>
                )}
            </div>

            {/* Feature Selection */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="label">
                        <span className="label-text font-semibold text-lg">
                            Feature Columns ({selectedFeatures.length} selected)
                        </span>
                    </label>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={selectAll}>
                            Select All
                        </Button>
                        <Button variant="ghost" size="sm" onClick={clearSelection}>
                            Clear
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto p-4 border border-base-300 rounded-lg bg-base-100">
                    {columns.map((column) => (
                        <label
                            key={column}
                            className={`
                flex items-center gap-2 cursor-pointer hover:bg-base-200 p-3 rounded transition-colors
                ${selectedFeatures.includes(column) ? 'bg-primary/10 border border-primary/30' : ''}
                ${column === targetColumn ? 'opacity-50 cursor-not-allowed' : ''}
              `}
                        >
                            <input
                                type="checkbox"
                                checked={selectedFeatures.includes(column)}
                                onChange={() => toggleFeature(column)}
                                disabled={column === targetColumn}
                                className="checkbox checkbox-primary checkbox-sm"
                            />
                            <span className="text-sm font-medium">{column}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Continue Button */}
            <div className="flex justify-end">
                <Button
                    variant="primary"
                    icon="arrow_forward"
                    onClick={handleContinue}
                    disabled={selectedFeatures.length === 0 || !targetColumn}
                >
                    Continue to Model Selection
                </Button>
            </div>
        </div>
    )
}

export default FeatureSelector
