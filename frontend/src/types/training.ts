// Training-related TypeScript types

export type ProblemType = 'classification' | 'regression'
export type ScalingMethod = 'none' | 'standard' | 'minmax'
export type TrainingStatus = 'idle' | 'configuring' | 'training' | 'complete' | 'failed'

export interface TrainingConfig {
    sessionId: string
    features: string[]
    target: string
    problemType: ProblemType
    algorithms: string[]
    trainTestSplit: number
    crossValidation: boolean
    cvFolds?: number
    scaling: ScalingMethod
}

export interface AlgorithmInfo {
    id: string
    name: string
    type: 'classification' | 'regression' | 'both'
    description: string
    icon: string
    pros: string[]
    cons: string[]
    useCase: string
}

export interface TrainingProgress {
    trainingId: string
    status: 'queued' | 'training' | 'complete' | 'failed'
    progress: number
    currentModel?: string
    estimatedTimeRemaining?: number
    error?: string
}

export interface ModelMetrics {
    // Classification metrics
    accuracy?: number
    precision?: number
    recall?: number
    f1Score?: number

    // Regression metrics
    r2Score?: number
    mae?: number
    rmse?: number
    mape?: number
}

export interface ModelResult {
    modelId: string
    name: string
    algorithm: string
    metrics: ModelMetrics
    confusionMatrix?: number[][]
    featureImportance?: Record<string, number>
    trainingTime: number
    isBest: boolean
}

export interface TrainingResults {
    trainingId: string
    problemType: ProblemType
    models: ModelResult[]
    bestModel: string
    completedAt: string
}
