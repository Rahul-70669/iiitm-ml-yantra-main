import React, { useState } from 'react'
import { Card } from '../../molecules/Card'
import Button from '../../atoms/Button'
import Icon from '../../atoms/Icon'

export interface PredictionPanelProps {
    features: string[]
    onPredict: (values: Record<string, any>) => Promise<any>
    loading?: boolean
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
    features,
    onPredict,
    loading = false
}) => {
    const [values, setValues] = useState<Record<string, string>>({})
    const [result, setResult] = useState<any>(null)

    const handleInputChange = (feature: string, value: string) => {
        setValues(prev => ({ ...prev, [feature]: value }))
    }

    const handlePredict = async () => {
        try {
            // Convert string values to numbers where applicable
            const numericValues: Record<string, any> = {}
            Object.entries(values).forEach(([key, val]) => {
                const num = parseFloat(val)
                numericValues[key] = isNaN(num) ? val : num
            })

            const prediction = await onPredict(numericValues)
            setResult(prediction)
        } catch (error) {
            console.error('Prediction error:', error)
        }
    }

    const allFilled = features.every(f => values[f] && values[f].trim() !== '')

    return (
        <Card className="max-w-2xl mx-auto">
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <Icon name="neurology" className="text-primary text-4xl" />
                    <div>
                        <h3 className="text-2xl font-bold">Make a Prediction</h3>
                        <p className="text-base-content/70">Enter feature values to get a prediction</p>
                    </div>
                </div>

                {/* Input Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map(feature => (
                        <div key={feature} className="form-control">
                            <label className="label">
                                <span className="label-text font-medium">{feature}</span>
                            </label>
                            <input
                                type="text"
                                placeholder={`Enter ${feature}`}
                                className="input input-bordered"
                                value={values[feature] || ''}
                                onChange={(e) => handleInputChange(feature, e.target.value)}
                            />
                        </div>
                    ))}
                </div>

                {/* Predict Button */}
                <Button
                    variant="primary"
                    icon="smart_toy"
                    onClick={handlePredict}
                    disabled={!allFilled || loading}
                    className="w-full"
                >
                    {loading ? 'Predicting...' : 'Predict'}
                </Button>

                {/* Result Display */}
                {result && (
                    <div className="alert alert-success">
                        <Icon name="check_circle" />
                        <div>
                            <div className="font-semibold">Prediction Result</div>
                            <div className="text-lg font-bold">{result}</div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}

export default PredictionPanel
