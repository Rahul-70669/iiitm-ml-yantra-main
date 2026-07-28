import { useState } from 'react'
import Button from '../../atoms/Button'
import { Card } from '../../molecules/Card'
import { getAlgorithms } from '../../../data/algorithms'

export interface ModelSelectorProps {
    problemType: 'classification' | 'regression'
    onComplete: (algorithms: string[], trainTestSplit: number) => void
    onBack: () => void
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ problemType, onComplete, onBack }) => {
    const [selectedAlgorithms, setSelectedAlgorithms] = useState<string[]>([])
    const [trainTestSplit, setTrainTestSplit] = useState(80)

    const algorithms = getAlgorithms(problemType)

    const toggleAlgorithm = (algorithmId: string) => {
        setSelectedAlgorithms((prev) =>
            prev.includes(algorithmId) ? prev.filter((id) => id !== algorithmId) : [...prev, algorithmId]
        )
    }

    const selectAll = () => {
        setSelectedAlgorithms(algorithms.map((alg) => alg.id))
    }

    const clearSelection = () => {
        setSelectedAlgorithms([])
    }

    const handleContinue = () => {
        if (selectedAlgorithms.length === 0) {
            return
        }
        onComplete(selectedAlgorithms, trainTestSplit)
    }

    return (
        <div className="space-y-6">
            {/* Problem Type Badge */}
            <div className="alert alert-info">
                <span className="material-symbols-rounded">
                    {problemType === 'classification' ? 'category' : 'show_chart'}
                </span>
                <span>
                    Training for <strong>{problemType === 'classification' ? 'Classification' : 'Regression'}</strong>
                </span>
            </div>

            {/* Algorithm Selection */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                        Select Algorithms ({selectedAlgorithms.length} selected)
                    </h3>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={selectAll}>
                            Select All
                        </Button>
                        <Button variant="ghost" size="sm" onClick={clearSelection}>
                            Clear
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {algorithms.map((algorithm) => (
                        <div
                            key={algorithm.id}
                            className={`
                cursor-pointer transition-all duration-200 rounded-lg
                ${selectedAlgorithms.includes(algorithm.id)
                                    ? 'ring-2 ring-primary'
                                    : ''
                                }
              `}
                            onClick={() => toggleAlgorithm(algorithm.id)}
                        >
                            <Card className="h-full">
                                <div className="flex items-start gap-4">
                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={selectedAlgorithms.includes(algorithm.id)}
                                        readOnly
                                        className="checkbox checkbox-primary checkbox-lg mt-1"
                                        onClick={(e) => e.stopPropagation()}
                                    />

                                    {/* Icon */}
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="material-symbols-rounded text-primary text-2xl">
                                                {algorithm.icon}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-lg mb-1">{algorithm.name}</h4>
                                        <p className="text-sm text-base-content/70 mb-3">{algorithm.description}</p>

                                        {/* Pros/Cons - Collapsed by default */}
                                        <details className="text-sm">
                                            <summary className="cursor-pointer text-primary font-medium">
                                                View Details
                                            </summary>
                                            <div className="mt-2 space-y-2">
                                                <div>
                                                    <span className="font-semibold text-success">Pros:</span>
                                                    <ul className="list-disc list-inside ml-2">
                                                        {algorithm.pros.map((pro, i) => (
                                                            <li key={i} className="text-base-content/70">
                                                                {pro}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-warning">Cons:</span>
                                                    <ul className="list-disc list-inside ml-2">
                                                        {algorithm.cons.map((con, i) => (
                                                            <li key={i} className="text-base-content/70">
                                                                {con}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div>
                                                    <span className="font-semibold">Use Case:</span>{' '}
                                                    <span className="text-base-content/70">{algorithm.useCase}</span>
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>

            {/* Training Configuration */}
            <Card title="Training Configuration">
                <div className="space-y-4">
                    {/* Train/Test Split */}
                    <div>
                        <label className="label">
                            <span className="label-text font-medium">Train/Test Split</span>
                            <span className="label-text-alt">{trainTestSplit}% train / {100 - trainTestSplit}% test</span>
                        </label>
                        <input
                            type="range"
                            min="60"
                            max="90"
                            value={trainTestSplit}
                            onChange={(e) => setTrainTestSplit(Number(e.target.value))}
                            className="range range-primary"
                            step="5"
                        />
                        <div className="w-full flex justify-between text-xs px-2 mt-1">
                            <span>60%</span>
                            <span>70%</span>
                            <span>80%</span>
                            <span>90%</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
                <Button variant="outline" icon="arrow_back" onClick={onBack}>
                    Back to Features
                </Button>
                <Button
                    variant="primary"
                    icon="play_arrow"
                    onClick={handleContinue}
                    disabled={selectedAlgorithms.length === 0}
                >
                    Start Training ({selectedAlgorithms.length} {selectedAlgorithms.length === 1 ? 'model' : 'models'})
                </Button>
            </div>
        </div>
    )
}

export default ModelSelector
