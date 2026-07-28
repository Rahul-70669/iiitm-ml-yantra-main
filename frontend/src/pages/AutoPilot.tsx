import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import apiClient from '../services/api'
import AppHeader from '../components/AppHeader'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    ScatterChart, Scatter, CartesianGrid, Cell
} from 'recharts'

// ═══════════════════════ TYPES ═══════════════════════

type Stage = 'upload' | 'configure' | 'running' | 'results'

interface TargetSuggestion {
    column: string
    confidence: number
    problem_type: string
    reason: string
}

interface PipelineStep {
    step: string
    category: string
    description: string
    details?: Record<string, any>
    duration_ms?: number
}

interface EDAChart {
    chart_type: string
    title: string
    data: any
}

interface AutoPilotResult {
    autopilot_id: string
    session_id: string
    problem_type: string
    pipeline_log: PipelineStep[]
    before_summary: Record<string, any>
    after_summary: Record<string, any>
    eda_charts: EDAChart[]
    training_results: {
        models: Array<{
            modelId: string
            name: string
            algorithm: string
            metrics: Record<string, number | null>
            confusionMatrix?: number[][]
            featureImportance?: Record<string, number>
            trainingTime: number
            hyperparameters?: Record<string, any>
            isBest: boolean
        }>
        bestModel: string
        problemType: string
        smoteApplied?: boolean
    }
    best_model_name: string
    best_model_id: string
    best_metrics: Record<string, number | null>
    feature_importance?: Record<string, number>
}

// ═══════════════════════ COLORS ═══════════════════════
const CHART_COLORS = ['#ab3505', '#d4583b', '#e87c5f', '#f0a58e', '#9f3a60', '#c75b85', '#e88aaf', '#f4b8d0']

// ═══════════════════════ COMPONENT ═══════════════════════

export default function AutoPilot() {
    const [searchParams] = useSearchParams()
    const [stage, setStage] = useState<Stage>('upload')
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [filename, setFilename] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)

    // Configure stage
    const [analysis, setAnalysis] = useState<any>(null)
    const [targetSuggestions, setTargetSuggestions] = useState<TargetSuggestion[]>([])
    const [selectedTarget, setSelectedTarget] = useState('')
    const [selectedProblemType, setSelectedProblemType] = useState('')

    // Running stage
    const [visibleSteps, setVisibleSteps] = useState<PipelineStep[]>([])
    const [isRunning, setIsRunning] = useState(false)

    // Results stage
    const [result, setResult] = useState<AutoPilotResult | null>(null)
    const [activeEDATab, setActiveEDATab] = useState('distributions')
    const [showPipelineLog, setShowPipelineLog] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    // Restore saved state on mount OR check query params
    useEffect(() => {
        const sid = searchParams.get('session')
        if (sid) {
            setSessionId(sid)
            setFilename('Existing Dataset')
            handleAnalyze(sid)
            return
        }
        // Restore from localStorage
        try {
            const saved = localStorage.getItem('ml_yantra_autopilot_state')
            if (saved) {
                const state = JSON.parse(saved)
                if (state.result) {
                    setSessionId(state.sessionId)
                    setFilename(state.filename || 'Dataset')
                    setResult(state.result)
                    setAnalysis(state.analysis)
                    setSelectedTarget(state.selectedTarget || '')
                    setSelectedProblemType(state.selectedProblemType || '')
                    setStage('results')
                } else if (state.analysis && state.sessionId) {
                    setSessionId(state.sessionId)
                    setFilename(state.filename || 'Dataset')
                    setAnalysis(state.analysis)
                    setTargetSuggestions(state.analysis.target_suggestions || [])
                    setSelectedTarget(state.selectedTarget || '')
                    setSelectedProblemType(state.selectedProblemType || '')
                    setStage('configure')
                }
            }
        } catch {}
    }, [searchParams])

    // ═══════════════════════ UPLOAD ═══════════════════════

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        try {
            const res = await apiClient.uploadFile(file)
            setSessionId(res.session_id)
            setFilename(file.name)
            localStorage.setItem('ml_yantra_session_id', res.session_id)
            toast.success(`Uploaded ${file.name}`)
            handleAnalyze(res.session_id)
        } catch (err: any) {
            toast.error(err.message || 'Upload failed')
        } finally {
            setIsUploading(false)
        }
    }

    // ═══════════════════════ ANALYZE ═══════════════════════

    const handleAnalyze = async (sid: string) => {
        setIsAnalyzing(true)
        try {
            const res = await apiClient.analyzeForAutoPilot(sid)
            setAnalysis(res)
            setTargetSuggestions(res.target_suggestions || [])
            const target = res.target_suggestions?.[0]?.column || ''
            const ptype = res.target_suggestions?.[0]?.problem_type || ''
            if (res.target_suggestions?.length > 0) {
                setSelectedTarget(target)
                setSelectedProblemType(ptype)
            }
            setStage('configure')
            // Persist analysis state
            localStorage.setItem('ml_yantra_autopilot_state', JSON.stringify({
                sessionId: sid, filename: filename || 'Dataset', analysis: res,
                selectedTarget: target, selectedProblemType: ptype,
            }))
        } catch (err: any) {
            toast.error(err.message || 'Analysis failed')
        } finally {
            setIsAnalyzing(false)
        }
    }

    // ═══════════════════════ RUN PIPELINE ═══════════════════════

    const handleRunPipeline = async () => {
        if (!sessionId || !selectedTarget) return

        setStage('running')
        setIsRunning(true)
        setVisibleSteps([])

        try {
            const res = await apiClient.runAutoPilot(sessionId, {
                target: selectedTarget,
                problem_type: selectedProblemType
            })

            // Animate pipeline steps one by one
            const steps = res.pipeline_log || []
            for (let i = 0; i < steps.length; i++) {
                await new Promise(resolve => setTimeout(resolve, 400))
                setVisibleSteps(prev => [...prev, steps[i]])
            }

            await new Promise(resolve => setTimeout(resolve, 800))
            setResult(res)
            setStage('results')
            // Persist results to localStorage
            try {
                localStorage.setItem('ml_yantra_autopilot_state', JSON.stringify({
                    sessionId, filename, analysis, result: res,
                    selectedTarget, selectedProblemType,
                }))
            } catch {}
            toast.success(`🏆 AutoPilot complete! Best: ${res.best_model_name}`)
        } catch (err: any) {
            toast.error(err.message || 'AutoPilot failed')
            setStage('configure')
        } finally {
            setIsRunning(false)
        }
    }

    // ═══════════════════════ DOWNLOADS ═══════════════════════

    const triggerDownload = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
    }

    const downloadNotebook = async () => {
        if (!result) return
        try {
            const blob = await apiClient.downloadNotebook(result.autopilot_id)
            triggerDownload(blob, `AutoPilot_${filename.split('.')[0]}.ipynb`)
            toast.success('Notebook downloaded!')
        } catch { toast.error('Download failed') }
    }

    const downloadCleaned = async () => {
        if (!result) return
        try {
            const blob = await apiClient.downloadAutoPilotCleaned(result.autopilot_id)
            triggerDownload(blob, `${filename.split('.')[0]}_cleaned.csv`)
            toast.success('Cleaned dataset downloaded!')
        } catch { toast.error('Download failed') }
    }

    const downloadModel = async () => {
        if (!result) return
        try {
            const blob = await apiClient.downloadAutoPilotModel(result.autopilot_id)
            triggerDownload(blob, `best_model_${result.best_model_name.replace(/\s/g, '_')}.pkl`)
            toast.success('Model downloaded!')
        } catch { toast.error('Download failed') }
    }

    // ═══════════════════════ RENDER ═══════════════════════

    return (
        <div className="min-h-screen bg-slate-50">
            <AppHeader />

            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* Top bar: New Dataset button + Progress Indicator */}
                <div className="flex items-center justify-center gap-4 mb-10 relative">
                    {stage !== 'upload' && (
                        <button
                            onClick={() => {
                                setStage('upload')
                                setSessionId(null)
                                setFilename('')
                                setAnalysis(null)
                                setTargetSuggestions([])
                                setSelectedTarget('')
                                setSelectedProblemType('')
                                setResult(null)
                                setVisibleSteps([])
                                localStorage.removeItem('ml_yantra_autopilot_state')
                                fileInputRef.current?.click()
                            }}
                            className="absolute left-0 inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-primary/25 text-primary rounded-xl font-bold text-sm hover:bg-primary/5 hover:border-primary/50 transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-lg">upload_file</span>
                            New Dataset
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                    {(['upload', 'configure', 'running', 'results'] as Stage[]).map((s, i) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                                stage === s ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' :
                                (['upload', 'configure', 'running', 'results'].indexOf(stage) > i) ? 'bg-primary/20 text-primary' :
                                'bg-slate-200 text-slate-400'
                            }`}>
                                {(['upload', 'configure', 'running', 'results'].indexOf(stage) > i) ?
                                    <span className="material-symbols-outlined text-lg">check</span> :
                                    i + 1
                                }
                            </div>
                            {i < 3 && <div className={`w-16 h-0.5 ${
                                (['upload', 'configure', 'running', 'results'].indexOf(stage) > i) ? 'bg-primary/40' : 'bg-slate-200'
                            }`} />}
                        </div>
                    ))}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* ════════ STAGE 1: UPLOAD ════════ */}
                    {stage === 'upload' && (
                        <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            <div className="text-center mb-12">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                                    AutoPilot Mode
                                </div>
                                <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-4">Let the Machine Think for You</h1>
                                <p className="text-slate-500 text-lg max-w-2xl mx-auto">Upload a dataset and AutoPilot will clean it, analyze it, train the best models, and generate a Colab notebook — all automatically.</p>
                            </div>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="mx-auto max-w-2xl border-2 border-dashed border-slate-300 hover:border-primary/50 rounded-3xl p-16 text-center cursor-pointer transition-all hover:bg-primary/5 group"
                            >
                                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                                {isUploading || isAnalyzing ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        <p className="text-slate-600 font-semibold">{isUploading ? 'Uploading...' : 'Analyzing dataset...'}</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <span className="material-symbols-outlined text-primary text-4xl">cloud_upload</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">Drop your dataset here</h3>
                                        <p className="text-slate-400">Supports CSV, XLSX · Max 200MB</p>
                                    </>
                                )}
                            </div>

                            {/* Use existing session from Clean page */}
                            {localStorage.getItem('ml_yantra_session_id') && (
                                <div className="text-center mt-6">
                                    <p className="text-sm text-slate-400 mb-3">Or use your existing dataset from the Clean page:</p>
                                    <button
                                        onClick={() => {
                                            const sid = localStorage.getItem('ml_yantra_session_id')
                                            if (sid) {
                                                setSessionId(sid)
                                                setFilename('Dataset from Clean Page')
                                                handleAnalyze(sid)
                                            }
                                        }}
                                        className="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary/30 text-primary rounded-xl font-bold hover:bg-primary/5 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-lg">link</span>
                                        Use Existing Dataset
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ════════ STAGE 2: CONFIGURE ════════ */}
                    {stage === 'configure' && analysis && (
                        <motion.div key="configure" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold text-slate-900 mb-2">Configure AutoPilot</h2>
                                <p className="text-slate-500">We analyzed your dataset. Confirm the target column and hit launch.</p>
                            </div>

                            {/* Dataset Summary Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-primary">dataset</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{filename}</h3>
                                        <p className="text-sm text-slate-400">{analysis.rows?.toLocaleString()} rows × {analysis.columns} columns</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-primary">{analysis.numeric_columns?.length || 0}</p>
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Numeric</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-[#9f3a60]">{analysis.categorical_columns?.length || 0}</p>
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Categorical</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-amber-600">{Object.values(analysis.null_summary || {}).reduce((a: number, b: any) => a + b, 0).toLocaleString()}</p>
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Null Values</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-slate-600">{analysis.duplicate_rows}</p>
                                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Duplicates</p>
                                    </div>
                                </div>
                            </div>

                            {/* Target Selection */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">target</span>
                                    Select Target Column
                                </h3>

                                {/* AI Suggestions */}
                                {targetSuggestions.length > 0 && (
                                    <div className="mb-5">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🤖 Smart Suggestions</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {targetSuggestions.map((s) => (
                                                <button
                                                    key={s.column}
                                                    onClick={() => { setSelectedTarget(s.column); setSelectedProblemType(s.problem_type); }}
                                                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                                                        selectedTarget === s.column
                                                            ? 'border-primary bg-primary/5 shadow-md'
                                                            : 'border-slate-200 hover:border-primary/30 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-bold text-slate-800">{s.column}</span>
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                            s.confidence >= 0.6 ? 'bg-green-100 text-green-700' :
                                                            s.confidence >= 0.3 ? 'bg-amber-100 text-amber-700' :
                                                            'bg-slate-100 text-slate-500'
                                                        }`}>{Math.round(s.confidence * 100)}% match</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400">{s.reason}</p>
                                                    <span className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                                        s.problem_type === 'classification' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                    }`}>{s.problem_type}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Manual Override */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Target Column</label>
                                        <select
                                            value={selectedTarget}
                                            onChange={(e) => setSelectedTarget(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                        >
                                            <option value="">Select target...</option>
                                            {analysis.column_names?.map((col: string) => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Problem Type</label>
                                        <select
                                            value={selectedProblemType}
                                            onChange={(e) => setSelectedProblemType(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                                        >
                                            <option value="classification">Classification</option>
                                            <option value="regression">Regression</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Launch Button */}
                            <div className="text-center">
                                <button
                                    onClick={handleRunPipeline}
                                    disabled={!selectedTarget}
                                    className="inline-flex items-center gap-3 px-12 py-5 bg-primary hover:bg-primary/90 disabled:bg-slate-300 text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95 transition-all disabled:shadow-none disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-2xl">rocket_launch</span>
                                    Launch AutoPilot
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ════════ STAGE 3: RUNNING ════════ */}
                    {stage === 'running' && (
                        <motion.div key="running" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                            <div className="text-center mb-10">
                                <h2 className="text-3xl font-bold text-slate-900 mb-2">AutoPilot Running...</h2>
                                <p className="text-slate-500">Sit back. The engine is cleaning, analyzing, and training.</p>
                            </div>

                            <div className="max-w-3xl mx-auto space-y-3">
                                <AnimatePresence>
                                    {visibleSteps.map((step, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -30 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4 }}
                                            className="flex items-start gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                step.category === 'clean' ? 'bg-blue-100 text-blue-600' :
                                                step.category === 'encode' ? 'bg-purple-100 text-purple-600' :
                                                step.category === 'eda' ? 'bg-amber-100 text-amber-600' :
                                                'bg-green-100 text-green-600'
                                            }`}>
                                                <span className="material-symbols-outlined text-lg">
                                                    {step.category === 'clean' ? 'cleaning_services' :
                                                     step.category === 'encode' ? 'shuffle' :
                                                     step.category === 'eda' ? 'analytics' :
                                                     'model_training'}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-800">{step.description}</p>
                                                {step.duration_ms != null && step.duration_ms > 0 && (
                                                    <p className="text-xs text-slate-400 mt-0.5">{step.duration_ms}ms</p>
                                                )}
                                            </div>
                                            <span className="material-symbols-outlined text-green-500 text-lg shrink-0">check_circle</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {isRunning && (
                                    <div className="flex items-center justify-center gap-3 py-6">
                                        <div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
                                        <span className="text-sm text-slate-500 font-semibold">Processing...</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* ════════ STAGE 4: RESULTS ════════ */}
                    {stage === 'results' && result && (
                        <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>

                            {/* ── Download Bar ── */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 shadow-sm flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-green-600">verified</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">AutoPilot Complete</h3>
                                        <p className="text-sm text-slate-400">Best Model: <span className="font-semibold text-primary">{result.best_model_name}</span></p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button onClick={downloadNotebook} className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors">
                                        <span className="material-symbols-outlined text-base">description</span>
                                        Colab Notebook
                                    </button>
                                    <button onClick={downloadCleaned} className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors">
                                        <span className="material-symbols-outlined text-base">table_chart</span>
                                        Cleaned CSV
                                    </button>
                                    <button onClick={downloadModel} className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold transition-colors shadow-md">
                                        <span className="material-symbols-outlined text-base">download</span>
                                        Best Model (.pkl)
                                    </button>
                                </div>
                            </div>

                            {/* ── Before/After Summary ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <SummaryCard title="Before Cleaning" data={result.before_summary} variant="before" />
                                <SummaryCard title="After Cleaning" data={result.after_summary} variant="after" />
                            </div>

                            {/* ── Best Model Metrics ── */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">emoji_events</span>
                                    Best Model: {result.best_model_name}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {Object.entries(result.best_metrics).filter(([, v]) => v !== null).map(([k, v]) => (
                                        <div key={k} className="bg-slate-50 rounded-xl p-4 text-center">
                                            <p className="text-2xl font-bold text-primary">{typeof v === 'number' ? (v < 1 ? (v * 100).toFixed(1) + '%' : v.toFixed(4)) : v}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{formatMetricName(k)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Model Comparison Table ── */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm overflow-x-auto">
                                <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">compare</span>
                                    Model Comparison
                                </h3>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="text-left py-3 px-3 font-bold text-slate-500 uppercase text-xs tracking-wider">Model</th>
                                            {result.problem_type === 'classification' ? (
                                                <>
                                                    <th className="text-center py-3 px-3 font-bold text-slate-500 uppercase text-xs">Accuracy</th>
                                                    <th className="text-center py-3 px-3 font-bold text-slate-500 uppercase text-xs">F1 Score</th>
                                                    <th className="text-center py-3 px-3 font-bold text-slate-500 uppercase text-xs">Precision</th>
                                                    <th className="text-center py-3 px-3 font-bold text-slate-500 uppercase text-xs">Recall</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="text-center py-3 px-3 font-bold text-slate-500 uppercase text-xs">R²</th>
                                                    <th className="text-center py-3 px-3 font-bold text-slate-500 uppercase text-xs">MAE</th>
                                                    <th className="text-center py-3 px-3 font-bold text-slate-500 uppercase text-xs">RMSE</th>
                                                    <th className="text-center py-3 px-3 font-bold text-slate-500 uppercase text-xs">MAPE</th>
                                                </>
                                            )}
                                            <th className="text-center py-3 px-3 font-bold text-slate-500 uppercase text-xs">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.training_results.models.map((m) => (
                                            <tr key={m.modelId} className={`border-b border-slate-100 ${m.isBest ? 'bg-primary/5' : 'hover:bg-slate-50'}`}>
                                                <td className="py-3 px-3 font-semibold text-slate-800">
                                                    {m.isBest && <span className="text-primary mr-1">🏆</span>}
                                                    {m.name}
                                                </td>
                                                {result.problem_type === 'classification' ? (
                                                    <>
                                                        <td className="text-center py-3 px-3 font-mono">{fmtMetric(m.metrics.accuracy)}</td>
                                                        <td className="text-center py-3 px-3 font-mono">{fmtMetric(m.metrics.f1Score)}</td>
                                                        <td className="text-center py-3 px-3 font-mono">{fmtMetric(m.metrics.precision)}</td>
                                                        <td className="text-center py-3 px-3 font-mono">{fmtMetric(m.metrics.recall)}</td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="text-center py-3 px-3 font-mono">{fmtMetric(m.metrics.r2Score)}</td>
                                                        <td className="text-center py-3 px-3 font-mono">{fmtMetric(m.metrics.mae)}</td>
                                                        <td className="text-center py-3 px-3 font-mono">{fmtMetric(m.metrics.rmse)}</td>
                                                        <td className="text-center py-3 px-3 font-mono">{fmtMetric(m.metrics.mape)}</td>
                                                    </>
                                                )}
                                                <td className="text-center py-3 px-3 text-slate-400">{m.trainingTime}s</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── EDA Visualizations ── */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">analytics</span>
                                    Exploratory Data Analysis
                                </h3>

                                {/* Tabs */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {[
                                        { key: 'distributions', label: 'Distributions', icon: 'bar_chart' },
                                        { key: 'categories', label: 'Categories', icon: 'pie_chart' },
                                        { key: 'boxplots', label: 'Outliers', icon: 'candlestick_chart' },
                                        { key: 'correlation', label: 'Correlation', icon: 'grid_on' },
                                        { key: 'scatter', label: 'Scatter', icon: 'scatter_plot' },
                                        { key: 'importance', label: 'Feature Importance', icon: 'sort' },
                                    ].map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveEDATab(tab.key)}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                                activeEDATab === tab.key ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-base">{tab.icon}</span>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Chart Content */}
                                <EDAContent charts={result.eda_charts} activeTab={activeEDATab} featureImportance={result.feature_importance} />
                            </div>

                            {/* ── Pipeline Log (collapsible) ── */}
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
                                <button
                                    onClick={() => setShowPipelineLog(!showPipelineLog)}
                                    className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors"
                                >
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">terminal</span>
                                        Pipeline Log ({result.pipeline_log.length} steps)
                                    </h3>
                                    <span className={`material-symbols-outlined text-slate-400 transition-transform ${showPipelineLog ? 'rotate-180' : ''}`}>expand_more</span>
                                </button>
                                {showPipelineLog && (
                                    <div className="px-6 pb-6 space-y-2">
                                        {result.pipeline_log.map((step, i) => (
                                            <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                                                    step.category === 'clean' ? 'bg-blue-100 text-blue-600' :
                                                    step.category === 'encode' ? 'bg-purple-100 text-purple-600' :
                                                    step.category === 'eda' ? 'bg-amber-100 text-amber-600' :
                                                    'bg-green-100 text-green-600'
                                                }`}>{step.category}</span>
                                                <p className="text-sm text-slate-700 flex-1">{step.description}</p>
                                                {step.duration_ms != null && step.duration_ms > 0 && (
                                                    <span className="text-xs text-slate-400 shrink-0">{step.duration_ms}ms</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    )
}

// ═══════════════════════ SUB-COMPONENTS ═══════════════════════

function SummaryCard({ title, data, variant }: { title: string; data: Record<string, any>; variant: 'before' | 'after' }) {
    const color = variant === 'before' ? 'text-slate-500' : 'text-green-600'
    const bg = variant === 'before' ? 'bg-slate-50' : 'bg-green-50'
    return (
        <div className={`${bg} rounded-2xl p-6 border ${variant === 'before' ? 'border-slate-200' : 'border-green-200'}`}>
            <h4 className={`font-bold ${color} text-sm uppercase tracking-wider mb-4`}>{title}</h4>
            <div className="grid grid-cols-2 gap-4">
                <div><p className="text-2xl font-bold text-slate-800">{data.rows?.toLocaleString()}</p><p className="text-xs text-slate-400">Rows</p></div>
                <div><p className="text-2xl font-bold text-slate-800">{data.columns}</p><p className="text-xs text-slate-400">Columns</p></div>
                <div><p className="text-2xl font-bold text-slate-800">{data.nulls?.toLocaleString()}</p><p className="text-xs text-slate-400">Nulls</p></div>
                <div><p className="text-2xl font-bold text-slate-800">{data.duplicates}</p><p className="text-xs text-slate-400">Duplicates</p></div>
            </div>
        </div>
    )
}

function EDAContent({ charts, activeTab, featureImportance }: { charts: EDAChart[]; activeTab: string; featureImportance?: Record<string, number> }) {
    const filteredCharts = charts.filter(c => {
        if (activeTab === 'distributions') return c.chart_type === 'histogram'
        if (activeTab === 'categories') return c.chart_type === 'countplot'
        if (activeTab === 'boxplots') return c.chart_type === 'boxplot'
        if (activeTab === 'correlation') return c.chart_type === 'correlation'
        if (activeTab === 'scatter') return c.chart_type === 'scatter'
        if (activeTab === 'importance') return c.chart_type === 'feature_importance'
        return false
    })

    // Feature importance special handling
    if (activeTab === 'importance' && featureImportance) {
        const fiData = Object.entries(featureImportance)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 15)
            .map(([name, value]) => ({ name, value: Math.round(value * 10000) / 100 }))

        return (
            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fiData} layout="vertical" margin={{ left: 100, right: 20, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Bar dataKey="value" fill="#ab3505" radius={[0, 6, 6, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        )
    }

    // Correlation heatmap
    if (activeTab === 'correlation') {
        const corrChart = charts.find(c => c.chart_type === 'correlation')
        if (!corrChart) return <EmptyState msg="No correlation data available" />
        const { columns, matrix } = corrChart.data
        return (
            <div className="overflow-x-auto">
                <table className="text-xs font-mono">
                    <thead>
                        <tr>
                            <th className="p-1"></th>
                            {columns.map((c: string) => (
                                <th key={c} className="p-1 text-slate-500 max-w-[60px] truncate" title={c}>{c.slice(0, 6)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row: number[], i: number) => (
                            <tr key={i}>
                                <td className="p-1 font-bold text-slate-600 max-w-[80px] truncate" title={columns[i]}>{columns[i].slice(0, 8)}</td>
                                {row.map((val: number, j: number) => (
                                    <td key={j} className="p-1 text-center" style={{
                                        backgroundColor: val > 0 ? `rgba(171,53,5,${Math.abs(val) * 0.6})` : `rgba(59,130,246,${Math.abs(val) * 0.6})`,
                                        color: Math.abs(val) > 0.5 ? 'white' : '#334155'
                                    }}>{val.toFixed(2)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    if (filteredCharts.length === 0) return <EmptyState msg={`No ${activeTab} charts available`} />

    // Histograms
    if (activeTab === 'distributions') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCharts.map((chart, i) => {
                    const d = chart.data
                    const chartData = d.counts?.map((count: number, idx: number) => ({
                        bin: d.bins?.[idx]?.toFixed(2) || idx,
                        count
                    })) || []
                    return (
                        <div key={i} className="bg-slate-50 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-slate-700 mb-3 truncate">{chart.title}</h4>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={chartData}>
                                    <XAxis dataKey="bin" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                                    <YAxis tick={{ fontSize: 9 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#ab3505" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                            {d.mean != null && (
                                <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1">
                                    <span>Mean: {d.mean.toFixed(2)}</span>
                                    <span>Median: {d.median.toFixed(2)}</span>
                                    <span>Std: {d.std.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    // Count plots
    if (activeTab === 'categories') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCharts.map((chart, i) => {
                    const d = chart.data
                    const chartData = d.labels?.map((label: string, idx: number) => ({
                        name: label,
                        count: d.counts?.[idx] || 0
                    })) || []
                    return (
                        <div key={i} className="bg-slate-50 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-slate-700 mb-3 truncate">{chart.title}</h4>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                                    <YAxis tick={{ fontSize: 9 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#9f3a60" radius={[4, 4, 0, 0]}>
                                        {chartData.map((_: any, idx: number) => (
                                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )
                })}
            </div>
        )
    }

    // Box plots
    if (activeTab === 'boxplots') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCharts.map((chart, i) => {
                    const d = chart.data
                    return (
                        <div key={i} className="bg-slate-50 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-slate-700 mb-3 truncate">{chart.title}</h4>
                            <div className="flex items-center justify-center h-[160px]">
                                <div className="w-full max-w-[200px]">
                                    <BoxPlotVisual min={d.min} q1={d.q1} median={d.median} q3={d.q3} max={d.max} />
                                </div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1">
                                <span>Min: {d.min?.toFixed(2)}</span>
                                <span>Q1: {d.q1?.toFixed(2)}</span>
                                <span>Med: {d.median?.toFixed(2)}</span>
                                <span>Q3: {d.q3?.toFixed(2)}</span>
                                <span>Max: {d.max?.toFixed(2)}</span>
                            </div>
                            {d.outliers?.length > 0 && (
                                <p className="text-[10px] text-amber-500 mt-1 text-center">{d.outliers.length} outliers detected</p>
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    // Scatter plots
    if (activeTab === 'scatter') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredCharts.map((chart, i) => {
                    const d = chart.data
                    const chartData = d.x?.map((xVal: number, idx: number) => ({
                        x: xVal,
                        y: d.y?.[idx] || 0
                    })) || []
                    return (
                        <div key={i} className="bg-slate-50 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-slate-700 mb-3 truncate">{chart.title}</h4>
                            <ResponsiveContainer width="100%" height={220}>
                                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="x" type="number" tick={{ fontSize: 9 }} name={d.x_col} />
                                    <YAxis dataKey="y" type="number" tick={{ fontSize: 9 }} name={d.y_col} />
                                    <Tooltip />
                                    <Scatter data={chartData} fill="#ab3505" fillOpacity={0.6} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    )
                })}
            </div>
        )
    }

    return <EmptyState msg="Select a tab to explore" />
}

function BoxPlotVisual({ min, q1, median, q3, max }: { min: number; q1: number; median: number; q3: number; max: number }) {
    const range = max - min || 1
    const pct = (v: number) => ((v - min) / range) * 100

    return (
        <div className="relative h-12 w-full">
            {/* Whisker line */}
            <div className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-slate-400" style={{ left: `${pct(min)}%`, width: `${pct(max) - pct(min)}%` }} />
            {/* Box */}
            <div className="absolute top-1 bottom-1 bg-primary/20 border-2 border-primary rounded" style={{ left: `${pct(q1)}%`, width: `${pct(q3) - pct(q1)}%` }} />
            {/* Median line */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-primary" style={{ left: `${pct(median)}%` }} />
            {/* Min whisker */}
            <div className="absolute top-2 bottom-2 w-0.5 bg-slate-400" style={{ left: `${pct(min)}%` }} />
            {/* Max whisker */}
            <div className="absolute top-2 bottom-2 w-0.5 bg-slate-400" style={{ left: `${pct(max)}%` }} />
        </div>
    )
}

function EmptyState({ msg }: { msg: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-3">info</span>
            <p className="text-sm font-semibold">{msg}</p>
        </div>
    )
}

// ═══════════════════════ HELPERS ═══════════════════════

function formatMetricName(key: string): string {
    const map: Record<string, string> = {
        accuracy: 'Accuracy', precision: 'Precision', recall: 'Recall',
        f1Score: 'F1 Score', rocAuc: 'ROC AUC', logLoss: 'Log Loss',
        r2Score: 'R² Score', adjR2: 'Adj R²', mae: 'MAE', mse: 'MSE', rmse: 'RMSE', mape: 'MAPE'
    }
    return map[key] || key
}

function fmtMetric(v: number | null | undefined): string {
    if (v === null || v === undefined) return '—'
    return v.toFixed(4)
}
