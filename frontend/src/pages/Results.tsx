import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import toast from 'react-hot-toast'
import apiClient from '../services/api'

type VisualizationTab = 'confusion' | 'comparison' | 'features' | 'metrics'

interface ModelResult {
    modelId: string
    name: string
    algorithm: string
    metrics: Record<string, number | null>
    confusionMatrix?: number[][]
    featureImportance?: Record<string, number>
    trainingTime: number
    isBest: boolean
}


/* ──────────────────────── Confusion Matrix Heatmap ──────────────────────── */
function ConfusionMatrixChart({ matrix }: { matrix: number[][] }) {
    const maxVal = Math.max(...matrix.flat(), 1)
    const size = matrix.length
    const labels = Array.from({ length: size }, (_, i) => `Class ${i}`)

    return (
        <div className="flex flex-col items-center gap-4 w-full">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">Confusion Matrix</h4>
            <div className="flex gap-4 items-start">
                {/* Y-axis label */}
                <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">Actual</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                    {/* Column headers (Predicted) */}
                    <div className="flex gap-1" style={{ marginLeft: '48px' }}>
                        {labels.map((l, i) => (
                            <div key={i} className="w-16 text-center text-[10px] font-bold text-slate-400 truncate">{l}</div>
                        ))}
                    </div>
                    {/* Rows */}
                    {matrix.map((row, ri) => (
                        <div key={ri} className="flex gap-1 items-center">
                            <span className="w-12 text-right text-[10px] font-bold text-slate-400 truncate">{labels[ri]}</span>
                            {row.map((val, ci) => {
                                const isDiagonal = ri === ci
                                const intensity = val / maxVal
                                return (
                                    <div
                                        key={ci}
                                        className="w-16 h-14 flex flex-col items-center justify-center rounded-md transition-all hover:scale-105 cursor-default"
                                        style={{
                                            backgroundColor: isDiagonal
                                                ? `rgba(var(--color-primary-rgb, 229, 62, 62), ${0.15 + intensity * 0.7})`
                                                : `rgba(148, 163, 184, ${0.05 + intensity * 0.25})`,
                                        }}
                                        title={`Actual: ${labels[ri]}, Predicted: ${labels[ci]}`}
                                    >
                                        <span className={`font-black text-sm ${isDiagonal ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>{val}</span>
                                        <span className="text-[8px] text-slate-400">{(val / Math.max(row.reduce((a, b) => a + b, 0), 1) * 100).toFixed(0)}%</span>
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                    {/* X-axis label */}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Predicted</span>
                </div>
            </div>
        </div>
    )
}

/* ──────────────────────── Feature Importance ──────────────────────── */
function FeatureImportanceChart({ importance }: { importance: Record<string, number> }) {
    const sorted = Object.entries(importance).sort(([, a], [, b]) => b - a)
    const maxVal = sorted[0]?.[1] || 1
    const colors = [
        'bg-primary', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500',
        'bg-cyan-500', 'bg-violet-500', 'bg-pink-500', 'bg-blue-500',
    ]
    return (
        <div className="w-full space-y-2.5">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Feature Importance (Best Model)</h4>
            {sorted.map(([feature, val], idx) => (
                <div key={feature} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-32 text-right truncate font-medium shrink-0" title={feature}>{feature}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-6 overflow-hidden relative">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${colors[idx % colors.length]}`}
                            style={{ width: `${(val / maxVal) * 100}%` }}
                        />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 w-14 text-right">{(val * 100).toFixed(1)}%</span>
                </div>
            ))}
        </div>
    )
}

/* ──────────────────────── Model Comparison Bar Chart ──────────────────────── */
function ModelComparisonChart({ models, metricKey, metricLabel }: { models: ModelResult[]; metricKey: string; metricLabel: string }) {
    const vals = models.map(m => m.metrics[metricKey] ?? 0)
    const maxVal = Math.max(...vals, 0.001)
    const colors = [
        'bg-primary', 'bg-orange-500', 'bg-emerald-500', 'bg-violet-500',
        'bg-cyan-500', 'bg-pink-500', 'bg-amber-500', 'bg-blue-500',
    ]

    return (
        <div className="w-full">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">{metricLabel} — All Models</h4>
            <div className="space-y-3">
                {models.map((model, idx) => {
                    const val = model.metrics[metricKey] ?? 0
                    const pct = maxVal > 0 ? Math.min((val / maxVal) * 100, 100) : 0
                    return (
                        <div key={model.modelId} className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-500 w-36 text-right truncate shrink-0">{model.name}</span>
                            <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-7 overflow-hidden relative">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${colors[idx % colors.length]} ${model.isBest ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                                    style={{ width: `${pct}%` }}
                                />
                                <span className="absolute inset-0 flex items-center justify-end pr-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {val.toFixed(4)}
                                </span>
                            </div>
                            {model.isBest && (
                                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">Best</span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ──────────────────────── All Metrics Overview Grid ──────────────────────── */
function AllMetricsGrid({ models, isClassification }: { models: ModelResult[]; isClassification: boolean }) {
    const metricKeys = isClassification
        ? ['accuracy', 'precision', 'recall', 'f1Score', 'rocAuc', 'logLoss']
        : ['r2Score', 'adjR2', 'mae', 'mse', 'rmse', 'mape']
    const metricLabels: Record<string, string> = {
        accuracy: 'Accuracy', precision: 'Precision', recall: 'Recall', f1Score: 'F1 Score',
        rocAuc: 'ROC AUC', logLoss: 'Log Loss',
        r2Score: 'R² Score', adjR2: 'Adj R²', mae: 'MAE', mse: 'MSE', rmse: 'RMSE', mape: 'MAPE',
    }
    // For each metric, is lower better?
    const lowerIsBetter: Record<string, boolean> = { logLoss: true, mae: true, mse: true, rmse: true, mape: true }

    return (
        <div className="w-full overflow-x-auto">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Detailed Metrics — All Models</h4>
            <table className="w-full text-left border-collapse text-sm">
                <thead>
                    <tr className="border-b-2 border-slate-200 dark:border-slate-700">
                        <th className="px-3 py-3 text-xs font-black uppercase tracking-wider text-slate-400">Model</th>
                        {metricKeys.map(k => (
                            <th key={k} className="px-3 py-3 text-xs font-black uppercase tracking-wider text-slate-400 text-center">{metricLabels[k]}</th>
                        ))}
                        <th className="px-3 py-3 text-xs font-black uppercase tracking-wider text-slate-400 text-center">Time</th>
                    </tr>
                </thead>
                <tbody>
                    {models.map((model) => {
                        // Find best val per metric
                        return (
                            <tr key={model.modelId} className={`border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${model.isBest ? 'bg-primary/5' : ''}`}>
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-2">
                                        {model.isBest && <span className="inline-block w-2 h-2 rounded-full bg-primary shrink-0"></span>}
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-white">{model.name}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">{model.algorithm}</span>
                                        </div>
                                    </div>
                                </td>
                                {metricKeys.map(k => {
                                    const val = model.metrics[k]
                                    // Highlight best in each column
                                    const allVals = models.map(m => m.metrics[k]).filter(v => v !== null && v !== undefined) as number[]
                                    const best = lowerIsBetter[k] ? Math.min(...allVals) : Math.max(...allVals)
                                    const isBestMetric = val !== null && val !== undefined && Math.abs(val - best) < 0.0001
                                    return (
                                        <td key={k} className="px-3 py-3 text-center font-mono">
                                            <span className={`${isBestMetric ? 'text-primary font-bold' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>
                                                {val !== null && val !== undefined ? val.toFixed(4) : '—'}
                                            </span>
                                        </td>
                                    )
                                })}
                                <td className="px-3 py-3 text-center font-mono text-xs text-slate-500">{model.trainingTime}s</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}


/* ════════════════════════ MAIN RESULTS PAGE ════════════════════════ */
export default function Results() {
    const navigate = useNavigate()
    const location = useLocation()
    const panelPrefix = location.pathname.startsWith('/non-tech') ? '/non-tech' : '/tech'
    const [activeTab, setActiveTab] = useState<VisualizationTab>('confusion')
    const [trainingResults, setTrainingResults] = useState<any>(null)
    const [models, setModels] = useState<ModelResult[]>([])
    const [bestModel, setBestModel] = useState<ModelResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedModel, setSelectedModel] = useState<string>('')

    useEffect(() => {
        loadResults()
    }, [])

    const loadResults = async () => {
        const storedResults = localStorage.getItem('ml_yantra_training_results')
        const trainingId = localStorage.getItem('ml_yantra_training_id')

        if (storedResults) {
            try {
                const parsed = JSON.parse(storedResults)
                setTrainingResults(parsed)
                setModels(parsed.models || [])
                const best = parsed.models?.find((m: ModelResult) => m.isBest) || parsed.models?.[0] || null
                setBestModel(best)
                setSelectedModel(best?.modelId || '')
                setLoading(false)
                return
            } catch (e) {
                console.error('Failed to parse stored results:', e)
            }
        }

        if (trainingId) {
            try {
                const result = await apiClient.getTrainingResults(trainingId)
                setTrainingResults(result)
                setModels(result.models || [])
                const best = result.models?.find((m: ModelResult) => m.isBest) || result.models?.[0] || null
                setBestModel(best)
                setSelectedModel(best?.modelId || '')
                setLoading(false)
                return
            } catch (e) {
                console.error('Failed to load from API:', e)
            }
        }

        toast.error('No training results found. Please train a model first.')
        navigate(`${panelPrefix}/train`)
    }

    const handleDownloadModel = async (modelId: string) => {
        const trainingId = localStorage.getItem('ml_yantra_training_id')
        if (!trainingId) return
        try {
            const blob = await apiClient.downloadModel(trainingId, modelId)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `model_${modelId.slice(0, 8)}.pkl`
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Model downloaded!')
        } catch (error: any) {
            toast.error(error.message || 'Download failed')
        }
    }

    const handleExportCSV = async () => {
        const sessionId = localStorage.getItem('ml_yantra_session_id')
        if (!sessionId) return
        try {
            const blob = await apiClient.downloadDataset(sessionId)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'dataset_export.csv'
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Dataset exported!')
        } catch (error: any) {
            toast.error(error.message || 'Export failed')
        }
    }

    const isClassification = trainingResults?.problemType === 'classification'
    const viewModel = models.find(m => m.modelId === selectedModel) || bestModel

    const formatMetric = (val: number | null | undefined): string => {
        if (val === null || val === undefined) return '—'
        return val.toFixed(4)
    }

    const tabs: { id: VisualizationTab; label: string; icon: string }[] = isClassification
        ? [
            { id: 'confusion', label: 'Confusion Matrix', icon: 'grid_view' },
            { id: 'comparison', label: 'Model Comparison', icon: 'bar_chart' },
            { id: 'features', label: 'Feature Importance', icon: 'sort' },
            { id: 'metrics', label: 'All Metrics', icon: 'table_chart' },
        ]
        : [
            { id: 'comparison', label: 'Model Comparison', icon: 'bar_chart' },
            { id: 'features', label: 'Feature Importance', icon: 'sort' },
            { id: 'metrics', label: 'All Metrics', icon: 'table_chart' },
        ]

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Loading results...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
            <AppHeader />

            <main className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">

                    {/* Header Row */}
                    <div className="flex flex-wrap justify-between items-end gap-4">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                                Evaluation Results
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400">
                                {isClassification ? 'Classification' : 'Regression'} — {models.length} model(s) trained
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center justify-center gap-2 rounded-xl h-10 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-50 transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">download</span>
                                Export CSV
                            </button>
                            <button
                                onClick={() => navigate(`${panelPrefix}/train`)}
                                className="flex items-center justify-center gap-2 rounded-xl h-10 px-4 bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity"
                            >
                                <span className="material-symbols-outlined text-lg">replay</span>
                                Train Again
                            </button>
                        </div>
                    </div>

                    {/* ─────── Best Model Hero Card ─────── */}
                    {bestModel && (
                        <section>
                            <div className="flex flex-col items-stretch justify-start rounded-2xl md:flex-row shadow-lg bg-white dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
                                <div className="w-full md:w-72 bg-gradient-to-br from-primary to-orange-400 min-h-[180px] flex items-center justify-center text-white relative shrink-0">
                                    <div className="absolute inset-0 bg-black/10"></div>
                                    <div className="relative z-10 flex flex-col items-center gap-2">
                                        <span className="material-symbols-outlined text-6xl">emoji_events</span>
                                        <span className="text-sm font-bold tracking-widest uppercase opacity-80">Best Model</span>
                                        <span className="text-xl font-black">{bestModel.name}</span>
                                    </div>
                                </div>
                                <div className="flex w-full grow flex-col justify-center gap-4 p-6 lg:p-8">
                                    {/* Metric pills */}
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                        {(isClassification
                                            ? [
                                                { label: 'Accuracy', key: 'accuracy' },
                                                { label: 'Precision', key: 'precision' },
                                                { label: 'Recall', key: 'recall' },
                                                { label: 'F1', key: 'f1Score' },
                                                { label: 'ROC AUC', key: 'rocAuc' },
                                                { label: 'Log Loss', key: 'logLoss' },
                                            ]
                                            : [
                                                { label: 'R²', key: 'r2Score' },
                                                { label: 'Adj R²', key: 'adjR2' },
                                                { label: 'MAE', key: 'mae' },
                                                { label: 'MSE', key: 'mse' },
                                                { label: 'RMSE', key: 'rmse' },
                                                { label: 'MAPE', key: 'mape' },
                                            ]
                                        ).map(({ label, key }) => (
                                            <div key={key} className="flex flex-col items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                                                <span className="text-lg font-black text-slate-900 dark:text-white">{formatMetric(bestModel.metrics[key])}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                                            <span className="font-mono">{bestModel.algorithm}</span> — trained in {bestModel.trainingTime}s
                                        </p>
                                        <button
                                            onClick={() => handleDownloadModel(bestModel.modelId)}
                                            className="flex items-center gap-2 rounded-xl h-9 px-5 bg-primary text-white text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-primary/20"
                                        >
                                            <span className="material-symbols-outlined text-base">download</span>
                                            Download
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* ─────── KPI Cards ─────── */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {(isClassification
                            ? [
                                { label: 'Accuracy', value: formatMetric(bestModel?.metrics.accuracy), icon: 'verified', color: 'text-emerald-500' },
                                { label: 'Precision', value: formatMetric(bestModel?.metrics.precision), icon: 'precision_manufacturing', color: 'text-blue-500' },
                                { label: 'Recall', value: formatMetric(bestModel?.metrics.recall), icon: 'replay', color: 'text-violet-500' },
                                { label: 'F1 Score', value: formatMetric(bestModel?.metrics.f1Score), icon: 'balance', color: 'text-orange-500' },
                                { label: 'ROC AUC', value: formatMetric(bestModel?.metrics.rocAuc), icon: 'show_chart', color: 'text-cyan-500' },
                                { label: 'Log Loss', value: formatMetric(bestModel?.metrics.logLoss), icon: 'functions', color: 'text-pink-500' },
                            ]
                            : [
                                { label: 'R² Score', value: formatMetric(bestModel?.metrics.r2Score), icon: 'analytics', color: 'text-emerald-500' },
                                { label: 'Adj R²', value: formatMetric(bestModel?.metrics.adjR2), icon: 'tune', color: 'text-blue-500' },
                                { label: 'MAE', value: formatMetric(bestModel?.metrics.mae), icon: 'straighten', color: 'text-violet-500' },
                                { label: 'MSE', value: formatMetric(bestModel?.metrics.mse), icon: 'square', color: 'text-orange-500' },
                                { label: 'RMSE', value: formatMetric(bestModel?.metrics.rmse), icon: 'square_foot', color: 'text-cyan-500' },
                                { label: 'MAPE', value: formatMetric(bestModel?.metrics.mape), icon: 'percent', color: 'text-pink-500' },
                            ]
                        ).map((kpi) => (
                            <div key={kpi.label} className="flex flex-col gap-1.5 rounded-xl p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">{kpi.label}</p>
                                    <span className={`material-symbols-outlined text-lg ${kpi.color}`}>{kpi.icon}</span>
                                </div>
                                <p className="text-slate-900 dark:text-white text-xl font-black leading-tight">{kpi.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* ─────── Visualization Section ─────── */}
                    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        {/* Tab bar */}
                        <div className="border-b border-slate-200 dark:border-slate-700 px-6 pt-4 flex flex-wrap gap-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 pb-3 text-sm transition-colors border-b-2 ${
                                        activeTab === tab.id
                                            ? 'font-bold text-primary border-primary'
                                            : 'font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-transparent'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-base">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}

                            {/* Model selector for confusion matrix / features */}
                            {(activeTab === 'confusion' || activeTab === 'features') && (
                                <div className="ml-auto flex items-center gap-2 pb-3">
                                    <span className="text-xs text-slate-400 font-medium">Viewing:</span>
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 font-semibold"
                                    >
                                        {models.map(m => (
                                            <option key={m.modelId} value={m.modelId}>{m.name}{m.isBest ? ' ★' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Tab Content */}
                        <div className="p-6 lg:p-8">
                            {/* Confusion Matrix */}
                            {activeTab === 'confusion' && isClassification && (
                                <div className="flex flex-col lg:flex-row gap-8 items-start">
                                    <div className="flex-1 min-h-[300px] flex items-center justify-center">
                                        {viewModel?.confusionMatrix ? (
                                            <ConfusionMatrixChart matrix={viewModel.confusionMatrix} />
                                        ) : (
                                            <div className="text-center">
                                                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">grid_view</span>
                                                <p className="text-slate-400 text-sm">No confusion matrix available for this model</p>
                                            </div>
                                        )}
                                    </div>
                                    {/* Insights panel */}
                                    <div className="w-full lg:w-80 shrink-0 space-y-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base text-primary">insights</span>
                                            Analysis
                                        </h4>
                                        <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                                            {viewModel && (viewModel.metrics.accuracy ?? 0) > 0.9 && (
                                                <li className="flex items-start gap-2">
                                                    <span className="material-symbols-outlined text-green-500 text-base mt-0.5">check_circle</span>
                                                    High accuracy ({formatMetric(viewModel.metrics.accuracy)})
                                                </li>
                                            )}
                                            {viewModel && (viewModel.metrics.accuracy ?? 0) <= 0.9 && (
                                                <li className="flex items-start gap-2">
                                                    <span className="material-symbols-outlined text-amber-500 text-base mt-0.5">warning</span>
                                                    Accuracy is {formatMetric(viewModel.metrics.accuracy)} — consider more feature engineering.
                                                </li>
                                            )}
                                            {viewModel?.confusionMatrix && (() => {
                                                const cm = viewModel.confusionMatrix
                                                const total = cm.flat().reduce((a, b) => a + b, 0)
                                                const diag = cm.reduce((acc, row, i) => acc + row[i], 0)
                                                const misclass = total - diag
                                                return (
                                                    <li className="flex items-start gap-2">
                                                        <span className="material-symbols-outlined text-primary text-base mt-0.5">info</span>
                                                        {misclass} misclassified out of {total} samples ({(misclass / total * 100).toFixed(1)}% error rate)
                                                    </li>
                                                )
                                            })()}
                                            <li className="flex items-start gap-2">
                                                <span className="material-symbols-outlined text-primary text-base mt-0.5">schedule</span>
                                                Trained in {viewModel?.trainingTime}s
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Model Comparison */}
                            {activeTab === 'comparison' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {(isClassification
                                        ? [
                                            { key: 'accuracy', label: 'Accuracy' },
                                            { key: 'f1Score', label: 'F1 Score' },
                                            { key: 'precision', label: 'Precision' },
                                            { key: 'recall', label: 'Recall' },
                                        ]
                                        : [
                                            { key: 'r2Score', label: 'R² Score' },
                                            { key: 'mae', label: 'MAE' },
                                            { key: 'rmse', label: 'RMSE' },
                                            { key: 'mape', label: 'MAPE' },
                                        ]
                                    ).map(({ key, label }) => (
                                        <div key={key} className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5">
                                            <ModelComparisonChart models={models} metricKey={key} metricLabel={label} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Feature Importance */}
                            {activeTab === 'features' && (
                                <div className="flex flex-col lg:flex-row gap-8 items-start">
                                    <div className="flex-1 min-h-[250px]">
                                        {viewModel?.featureImportance ? (
                                            <FeatureImportanceChart importance={viewModel.featureImportance} />
                                        ) : (
                                            <div className="text-center flex flex-col items-center justify-center py-16">
                                                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">bar_chart</span>
                                                <p className="text-slate-400 text-sm">Feature importance not available for {viewModel?.name || 'this model'}</p>
                                                <p className="text-slate-400 text-xs mt-1">Only tree-based models provide feature importance</p>
                                            </div>
                                        )}
                                    </div>
                                    {viewModel?.featureImportance && (
                                        <div className="w-full lg:w-80 shrink-0 space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5">
                                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-base text-primary">insights</span>
                                                Key Takeaways
                                            </h4>
                                            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                                                {(() => {
                                                    const sorted = Object.entries(viewModel.featureImportance!).sort(([, a], [, b]) => b - a)
                                                    const top = sorted[0]
                                                    const topPct = ((top?.[1] ?? 0) * 100).toFixed(1)
                                                    return (
                                                        <>
                                                            <li className="flex items-start gap-2">
                                                                <span className="material-symbols-outlined text-emerald-500 text-base mt-0.5">arrow_upward</span>
                                                                Top feature: <strong>{top?.[0]}</strong> ({topPct}%)
                                                            </li>
                                                            {sorted.length > 1 && (
                                                                <li className="flex items-start gap-2">
                                                                    <span className="material-symbols-outlined text-blue-500 text-base mt-0.5">info</span>
                                                                    Top 3 features account for {((sorted.slice(0, 3).reduce((a, [, v]) => a + v, 0)) * 100).toFixed(1)}% of importance
                                                                </li>
                                                            )}
                                                            {sorted.filter(([, v]) => v < 0.01).length > 0 && (
                                                                <li className="flex items-start gap-2">
                                                                    <span className="material-symbols-outlined text-amber-500 text-base mt-0.5">warning</span>
                                                                    {sorted.filter(([, v]) => v < 0.01).length} feature(s) contribute less than 1% — consider dropping them
                                                                </li>
                                                            )}
                                                        </>
                                                    )
                                                })()}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* All Metrics Table */}
                            {activeTab === 'metrics' && (
                                <AllMetricsGrid models={models} isClassification={isClassification} />
                            )}
                        </div>
                    </section>

                    {/* ─────── Comparison Table ─────── */}
                    {models.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white">Model Comparison</h2>
                                <span className="text-xs font-bold text-slate-400">{models.length} model(s)</span>
                            </div>
                            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                            <th className="px-5 py-4 text-xs font-black uppercase tracking-wider text-slate-400">Model</th>
                                            {isClassification ? (
                                                <>
                                                    <th className="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-center">Accuracy</th>
                                                    <th className="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-center">Precision</th>
                                                    <th className="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-center">Recall</th>
                                                    <th className="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-center">F1</th>
                                                    <th className="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-center">ROC AUC</th>
                                                    <th className="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-center">Log Loss</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-center">R²</th>
                                                    <th className="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-center">Adj R²</th>
                                                    <th className="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-center">MAE</th>
                                                    <th className="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-center">MSE</th>
                                                    <th className="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-center">RMSE</th>
                                                    <th className="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-center">MAPE</th>
                                                </>
                                            )}
                                            <th className="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-center">Time</th>
                                            <th className="px-3 py-4 text-xs font-black uppercase tracking-wider text-slate-400 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {models.map((model) => (
                                            <tr key={model.modelId} className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${model.isBest ? 'bg-primary/5' : ''}`}>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {model.isBest && <span className="inline-block w-2 h-2 rounded-full bg-primary shrink-0"></span>}
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900 dark:text-white text-sm">{model.name}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono">{model.algorithm}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                {(isClassification
                                                    ? ['accuracy', 'precision', 'recall', 'f1Score', 'rocAuc', 'logLoss']
                                                    : ['r2Score', 'adjR2', 'mae', 'mse', 'rmse', 'mape']
                                                ).map(k => (
                                                    <td key={k} className="px-3 py-4 text-center font-mono text-sm font-medium text-slate-600 dark:text-slate-300">
                                                        {formatMetric(model.metrics[k])}
                                                    </td>
                                                ))}
                                                <td className="px-3 py-4 text-center font-mono text-xs text-slate-500">{model.trainingTime}s</td>
                                                <td className="px-3 py-4 text-center">
                                                    <button
                                                        onClick={() => handleDownloadModel(model.modelId)}
                                                        className="text-primary text-xs font-bold hover:underline flex items-center gap-1 justify-center"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">download</span>
                                                        Download
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    )
}
