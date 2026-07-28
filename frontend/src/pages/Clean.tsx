import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { CleaningLayout } from '../components/layouts/CleaningLayout'
import apiClient from '../services/api'
import toast from 'react-hot-toast'
import { getOperationInsight, answerDatasetQuery, type OperationLogEntry } from '../utils/operationInsights'

interface SheetInfo {
    sheet_name: string
    session_id: string
    rows: number
    columns: number
    column_names: string[]
    column_types: Record<string, string>
}

// ─── Operations Toolbar (horizontal, inline in main content) ──────
function OperationsToolbar({
    sessionId,
    columns,
    activeOp,
    onActiveOpChange,
    stats,
    onOperationComplete,
    onLogOperation,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    totalRows,
}: {
    sessionId: string | null
    columns: string[]
    activeOp: string | null
    onActiveOpChange: (op: string | null) => void
    stats: any
    onOperationComplete: () => void
    onLogOperation: (operation: string, params: Record<string, any>) => void
    canUndo: boolean
    canRedo: boolean
    onUndo: () => void
    onRedo: () => void
    totalRows: number
}) {
    const [nullStrategy, setNullStrategy] = useState<'drop' | 'fill_mean' | 'fill_median' | 'fill_mode' | 'fill_value'>('fill_median')
    const [selectedColumns, setSelectedColumns] = useState<string[]>([])
    const [encodeColumn, setEncodeColumn] = useState('')
    const [encodeMethod, setEncodeMethod] = useState<'label' | 'onehot' | 'ordinal'>('label')
    const [filterColumn, setFilterColumn] = useState('')
    const [filterOperator, setFilterOperator] = useState<string>('==')
    const [filterValue, setFilterValue] = useState('')
    const [filterValue2, setFilterValue2] = useState('')
    const [convertColumn, setConvertColumn] = useState('')
    const [convertType, setConvertType] = useState<'int' | 'float' | 'str' | 'datetime'>('int')

    // New tab states
    const [dropColumns, setDropColumns] = useState<string[]>([])
    const [renameMap, setRenameMap] = useState<Record<string, string>>({})
    const [strOpColumn, setStrOpColumn] = useState('')
    const [strOperation, setStrOperation] = useState('trim')
    const [strFindStr, setStrFindStr] = useState('')
    const [strReplaceStr, setStrReplaceStr] = useState('')
    const [strRegex, setStrRegex] = useState('')
    const [outlierColumn, setOutlierColumn] = useState('')
    const [outlierMethod, setOutlierMethod] = useState('zscore')
    const [outlierThreshold, setOutlierThreshold] = useState('2')
    const [feNewColumn, setFeNewColumn] = useState('')
    const [feExpression, setFeExpression] = useState('')
    const [dateColumn, setDateColumn] = useState('')
    const [dateOperation, setDateOperation] = useState('extract_all')
    const [dateSecondColumn, setDateSecondColumn] = useState('')
    const [binColumn, setBinColumn] = useState('')
    const [binMethod, setBinMethod] = useState('equal_width')
    const [binCount, setBinCount] = useState('5')
    const [binLabels, setBinLabels] = useState('')
    const [binEdges, setBinEdges] = useState('')
    const [sampleMethod, setSampleMethod] = useState('random')
    const [sampleFraction, setSampleFraction] = useState('0.5')
    const [sampleNRows, setSampleNRows] = useState('')
    const [sampleStratifyCol, setSampleStratifyCol] = useState('')

    const setActiveOp = onActiveOpChange

    const ops = [
        { id: 'preview', label: 'Preview', icon: 'table_chart', color: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600' },
        { id: 'nulls', label: 'Handle Nulls', icon: 'cleaning_services', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600' },
        { id: 'duplicates', label: 'Duplicates', icon: 'content_copy', color: 'from-red-500 to-pink-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600' },
        { id: 'drop_cols', label: 'Drop Columns', icon: 'delete_sweep', color: 'from-rose-500 to-red-500', bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600' },
        { id: 'rename_cols', label: 'Rename', icon: 'edit_note', color: 'from-sky-500 to-blue-500', bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-600' },
        { id: 'string_ops', label: 'String Ops', icon: 'text_format', color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600' },
        { id: 'encode', label: 'Encode', icon: 'label', color: 'from-pink-500 to-purple-500', bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-600' },
        { id: 'convert', label: 'Convert Type', icon: 'swap_horiz', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600' },
        { id: 'filter', label: 'Filter', icon: 'filter_alt', color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600' },
        { id: 'outliers', label: 'Outliers', icon: 'scatter_plot', color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600' },
        { id: 'feature_eng', label: 'Feature Eng.', icon: 'construction', color: 'from-lime-500 to-green-500', bg: 'bg-lime-50 dark:bg-lime-900/20', text: 'text-lime-600' },
        { id: 'date_ops', label: 'Date Ops', icon: 'calendar_month', color: 'from-teal-500 to-cyan-500', bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600' },
        { id: 'binning', label: 'Binning', icon: 'stacked_bar_chart', color: 'from-fuchsia-500 to-pink-500', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', text: 'text-fuchsia-600' },
        { id: 'sampling', label: 'Sampling', icon: 'casino', color: 'from-yellow-500 to-amber-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-600' },
        { id: 'normalize', label: 'Normalize', icon: 'auto_fix_high', color: 'from-green-500 to-emerald-500', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600' },
        { id: 'visualize', label: 'Visualize', icon: 'insights', color: 'from-purple-500 to-violet-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600' },
    ]

    const handleApply = async () => {
        if (!sessionId) return
        try {
            if (activeOp === 'nulls') {
                await apiClient.handleNulls(sessionId, nullStrategy, selectedColumns.length > 0 ? selectedColumns : undefined)
                toast.success('Null handling applied')
                onLogOperation('nulls', { strategy: nullStrategy, columns: selectedColumns })
            } else if (activeOp === 'duplicates') {
                const result = await apiClient.handleDuplicates(sessionId)
                toast.success(`Removed ${result.removed_count} duplicate rows`)
                onLogOperation('duplicates', { removed_count: result.removed_count })
            } else if (activeOp === 'encode') {
                if (!encodeColumn) { toast.error('Select a column to encode'); return }
                const result = await apiClient.encodeColumn(sessionId, encodeColumn, encodeMethod)
                toast.success(result.message)
                onLogOperation('encode', { column: encodeColumn, method: encodeMethod })
            } else if (activeOp === 'filter') {
                const noValueOps = ['is_null', 'is_not_null', 'is_empty']
                if (!filterColumn) { toast.error('Select a column to filter'); return }
                if (!noValueOps.includes(filterOperator) && !filterValue) { toast.error('Enter a filter value'); return }
                if (['between', 'date_between'].includes(filterOperator) && !filterValue2) { toast.error('Enter both range values'); return }
                await apiClient.filterRows(
                    sessionId,
                    filterColumn,
                    filterOperator as any,
                    filterValue,
                    ['between', 'date_between'].includes(filterOperator) ? filterValue2 : undefined,
                    ['in', 'not_in'].includes(filterOperator) ? filterValue.split(',').map(v => v.trim()) : undefined
                )
                toast.success('Filter applied')
                onLogOperation('filter', { column: filterColumn, operator: filterOperator, value: filterValue, value2: filterValue2 })
            } else if (activeOp === 'convert') {
                if (!convertColumn) { toast.error('Select a column to convert'); return }
                const result = await apiClient.convertDataType(sessionId, convertColumn, convertType)
                toast.success(result.message)
                onLogOperation('convert', { column: convertColumn, targetType: convertType })
            } else if (activeOp === 'normalize') {
                const numericCols = stats?.column_types
                    ? Object.entries(stats.column_types as Record<string, string>)
                        .filter(([, t]) => /int|float/i.test(t))
                        .map(([col]) => col)
                    : []
                if (numericCols.length === 0) { toast.error('No numeric columns to normalize'); return }
                const result = await apiClient.normalizeColumns(sessionId, numericCols)
                toast.success(result.message)
                onLogOperation('normalize', { columns: numericCols })
            } else if (activeOp === 'drop_cols') {
                if (dropColumns.length === 0) { toast.error('Select columns to drop'); return }
                await apiClient.manageColumns(sessionId, 'drop', dropColumns)
                toast.success(`Dropped ${dropColumns.length} column(s)`)
                onLogOperation('drop_cols', { columns: dropColumns })
                setDropColumns([])
            } else if (activeOp === 'rename_cols') {
                const entries = Object.entries(renameMap).filter(([, v]) => v.trim())
                if (entries.length === 0) { toast.error('Set at least one new name'); return }
                const mapping = Object.fromEntries(entries)
                await apiClient.manageColumns(sessionId, 'rename', Object.keys(mapping), mapping)
                toast.success(`Renamed ${entries.length} column(s)`)
                onLogOperation('rename_cols', { mapping })
                setRenameMap({})
            } else if (activeOp === 'string_ops') {
                if (!strOpColumn) { toast.error('Select a column'); return }
                await apiClient.stringOperations(sessionId, strOpColumn, strOperation, strFindStr, strReplaceStr, strRegex)
                toast.success(`String operation '${strOperation}' applied`)
                onLogOperation('string_ops', { column: strOpColumn, operation: strOperation })
            } else if (activeOp === 'outliers') {
                if (!outlierColumn) { toast.error('Select a column'); return }
                await apiClient.removeOutliers(sessionId, outlierColumn, outlierMethod, parseFloat(outlierThreshold) || 2)
                toast.success('Outliers removed')
                onLogOperation('outliers', { column: outlierColumn, method: outlierMethod, threshold: outlierThreshold })
            } else if (activeOp === 'feature_eng') {
                if (!feNewColumn || !feExpression) { toast.error('Provide column name and expression'); return }
                await apiClient.featureEngineering(sessionId, feNewColumn, feExpression)
                toast.success(`Column '${feNewColumn}' created`)
                onLogOperation('feature_eng', { newColumn: feNewColumn, expression: feExpression })
            } else if (activeOp === 'date_ops') {
                if (!dateColumn) { toast.error('Select a date column'); return }
                if (dateOperation === 'date_diff' && !dateSecondColumn) { toast.error('Select second column for date diff'); return }
                await apiClient.dateOperations(sessionId, dateColumn, dateOperation, dateOperation === 'date_diff' ? dateSecondColumn : undefined)
                toast.success(`Date operation '${dateOperation}' applied`)
                onLogOperation('date_ops', { column: dateColumn, operation: dateOperation })
            } else if (activeOp === 'binning') {
                if (!binColumn) { toast.error('Select a column to bin'); return }
                const nBins = parseInt(binCount) || 5
                const labels = binLabels.trim() ? binLabels.split(',').map(l => l.trim()) : undefined
                const edges = binEdges.trim() ? binEdges.split(',').map(e => parseFloat(e.trim())) : undefined
                await apiClient.binning(sessionId, binColumn, binMethod, nBins, labels, edges)
                toast.success(`Binned '${binColumn}' into ${nBins} groups`)
                onLogOperation('binning', { column: binColumn, method: binMethod, nBins })
            } else if (activeOp === 'sampling') {
                const fraction = parseFloat(sampleFraction) || 0.5
                const nRows = sampleNRows ? parseInt(sampleNRows) : undefined
                await apiClient.sampling(sessionId, sampleMethod, fraction, nRows, sampleMethod === 'stratified' ? sampleStratifyCol : undefined)
                toast.success('Sampling applied')
                onLogOperation('sampling', { method: sampleMethod, fraction })
            }
            onOperationComplete()
        } catch (error: any) {
            toast.error(error.message || 'Operation failed')
        }
    }

    const activeOpDef = ops.find(o => o.id === activeOp)
    const hasParams = activeOp && ['nulls', 'encode', 'convert', 'filter', 'drop_cols', 'rename_cols', 'string_ops', 'outliers', 'feature_eng', 'date_ops', 'binning', 'sampling'].includes(activeOp)

    return (
        <div className="px-6 pt-5 pb-2">
            {/* Section Label + Undo/Redo */}
            <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-sm text-slate-400">build</span>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Data Operations</h3>

                {/* Undo / Redo buttons */}
                <div className="ml-auto flex items-center gap-1">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        title="Undo (Ctrl+Z)"
                        className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${canUndo
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 hover:shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            }`}
                    >
                        <span className="material-symbols-outlined text-base">undo</span>
                        <span className="hidden sm:inline">Undo</span>
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        title="Redo (Ctrl+Y)"
                        className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${canRedo
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 hover:shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-900 text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            }`}
                    >
                        <span className="material-symbols-outlined text-base">redo</span>
                        <span className="hidden sm:inline">Redo</span>
                    </button>
                </div>
            </div>

            {/* Horizontal pill buttons */}
            <div className="flex flex-wrap gap-2">
                {ops.map((op) => (
                    <button
                        key={op.id}
                        onClick={() => setActiveOp(activeOp === op.id ? null : op.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${activeOp === op.id
                                ? `bg-gradient-to-r ${op.color} text-white shadow-lg shadow-primary/15 scale-[1.03]`
                                : `${op.bg} ${op.text} hover:shadow-md hover:scale-[1.02] border border-transparent hover:border-slate-200 dark:hover:border-slate-700`
                            }`}
                    >
                        <span className="material-symbols-outlined text-lg">{op.icon}</span>
                        <span className="hidden sm:inline">{op.label}</span>
                    </button>
                ))}
            </div>

            {/* Expanded parameter panel — slides open below the toolbar */}
            {activeOp && hasParams && (
                <div className="mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 mb-4">
                        <div className={`size-8 rounded-lg bg-gradient-to-br ${activeOpDef?.color} flex items-center justify-center text-white`}>
                            <span className="material-symbols-outlined text-lg">{activeOpDef?.icon}</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold">{activeOpDef?.label}</h4>
                            <p className="text-[10px] text-slate-400">Configure parameters below</p>
                        </div>
                    </div>

                    {/* Nulls params */}
                    {activeOp === 'nulls' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Strategy</label>
                                <select
                                    value={nullStrategy}
                                    onChange={(e) => setNullStrategy(e.target.value as any)}
                                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary px-3 py-2.5"
                                >
                                    <option value="drop">Drop rows</option>
                                    <option value="fill_median">Fill with Median</option>
                                    <option value="fill_mean">Fill with Mean</option>
                                    <option value="fill_mode">Fill with Mode</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Select Columns</label>
                                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto custom-scrollbar">
                                    {columns.map((col) => (
                                        <label key={col} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg cursor-pointer transition-all border ${selectedColumns.includes(col)
                                                ? 'bg-primary/10 border-primary/30 text-primary font-semibold'
                                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/30'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                className="rounded text-primary focus:ring-primary size-3"
                                                checked={selectedColumns.includes(col)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedColumns([...selectedColumns, col])
                                                    else setSelectedColumns(selectedColumns.filter(c => c !== col))
                                                }}
                                            />
                                            {col}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Encode params */}
                    {activeOp === 'encode' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Column</label>
                                <select
                                    value={encodeColumn}
                                    onChange={(e) => setEncodeColumn(e.target.value)}
                                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary px-3 py-2.5"
                                >
                                    <option value="">Select column...</option>
                                    {columns.map((col) => (
                                        <option key={col} value={col}>{col}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Method</label>
                                <select
                                    value={encodeMethod}
                                    onChange={(e) => setEncodeMethod(e.target.value as 'label' | 'onehot' | 'ordinal')}
                                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary px-3 py-2.5"
                                >
                                    <option value="label">Label Encoding</option>
                                    <option value="onehot">One-Hot Encoding</option>
                                    <option value="ordinal">Ordinal Encoding</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Convert params */}
                    {activeOp === 'convert' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Column</label>
                                <select
                                    value={convertColumn}
                                    onChange={(e) => setConvertColumn(e.target.value)}
                                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary px-3 py-2.5"
                                >
                                    <option value="">Select column...</option>
                                    {columns.map((col) => (
                                        <option key={col} value={col}>{col} {stats?.column_types?.[col] ? `(${stats.column_types[col]})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Target Type</label>
                                <select
                                    value={convertType}
                                    onChange={(e) => setConvertType(e.target.value as 'int' | 'float' | 'str' | 'datetime')}
                                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary px-3 py-2.5"
                                >
                                    <option value="int">Integer (int64)</option>
                                    <option value="float">Float (float64)</option>
                                    <option value="str">String (object)</option>
                                    <option value="datetime">DateTime</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Filter params */}
                    {activeOp === 'filter' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Column Selector */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Column</label>
                                    <select
                                        value={filterColumn}
                                        onChange={(e) => setFilterColumn(e.target.value)}
                                        className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary px-3 py-2.5"
                                    >
                                        <option value="">Select column...</option>
                                        {columns.map((col) => (
                                            <option key={col} value={col}>{col}</option>
                                        ))}
                                    </select>
                                </div>
                                {/* Operator — categorized */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Operator</label>
                                    <select
                                        value={filterOperator}
                                        onChange={(e) => { setFilterOperator(e.target.value); setFilterValue(''); setFilterValue2('') }}
                                        className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary px-3 py-2.5"
                                    >
                                        <optgroup label="Comparison">
                                            <option value="==">Equals (==)</option>
                                            <option value="!=">Not Equals (!=)</option>
                                            <option value=">">Greater Than (&gt;)</option>
                                            <option value="<">Less Than (&lt;)</option>
                                            <option value=">=">Greater or Equal (&gt;=)</option>
                                            <option value="<=">Less or Equal (&lt;=)</option>
                                            <option value="between">Between (range)</option>
                                        </optgroup>
                                        <optgroup label="Ranking">
                                            <option value="top_n">Top N values</option>
                                            <option value="bottom_n">Bottom N values</option>
                                        </optgroup>
                                        <optgroup label="Text">
                                            <option value="contains">Contains</option>
                                            <option value="starts_with">Starts With</option>
                                            <option value="ends_with">Ends With</option>
                                            <option value="regex">Regex Pattern</option>
                                        </optgroup>
                                        <optgroup label="Null / Empty">
                                            <option value="is_null">Is Null (NaN)</option>
                                            <option value="is_not_null">Is Not Null</option>
                                            <option value="is_empty">Is Empty / Blank</option>
                                        </optgroup>
                                        <optgroup label="Categorical">
                                            <option value="in">In List</option>
                                            <option value="not_in">Not In List</option>
                                        </optgroup>
                                        <optgroup label="Date / Time">
                                            <option value="before">Before Date</option>
                                            <option value="after">After Date</option>
                                            <option value="date_between">Date Between</option>
                                        </optgroup>
                                        <optgroup label="Statistical">
                                            <option value="outliers">Outliers (± N std)</option>
                                            <option value="percentile">Percentile Threshold</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            {/* Dynamic value inputs based on operator */}
                            {!['is_null', 'is_not_null', 'is_empty'].includes(filterOperator) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                                            {filterOperator === 'between' ? 'Min Value'
                                                : filterOperator === 'date_between' ? 'Start Date'
                                                    : ['in', 'not_in'].includes(filterOperator) ? 'Values (comma-separated)'
                                                        : ['top_n', 'bottom_n'].includes(filterOperator) ? 'N (count)'
                                                            : filterOperator === 'outliers' ? 'Std Deviations (default: 2)'
                                                                : filterOperator === 'percentile' ? 'Percentile (0-100)'
                                                                    : ['before', 'after'].includes(filterOperator) ? 'Date'
                                                                        : 'Value'}
                                        </label>
                                        <input
                                            type={['before', 'after', 'date_between'].includes(filterOperator) ? 'date' : 'text'}
                                            value={filterValue}
                                            onChange={(e) => setFilterValue(e.target.value)}
                                            placeholder={
                                                ['in', 'not_in'].includes(filterOperator) ? 'e.g. Apple, Banana, Cherry'
                                                    : filterOperator === 'regex' ? 'e.g. ^Dr\\.'
                                                        : filterOperator === 'outliers' ? '2'
                                                            : filterOperator === 'percentile' ? '90'
                                                                : ['top_n', 'bottom_n'].includes(filterOperator) ? '10'
                                                                    : 'Enter value...'
                                            }
                                            className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary px-3 py-2.5"
                                        />
                                    </div>
                                    {/* Second value for range operators */}
                                    {['between', 'date_between'].includes(filterOperator) && (
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">
                                                {filterOperator === 'between' ? 'Max Value' : 'End Date'}
                                            </label>
                                            <input
                                                type={filterOperator === 'date_between' ? 'date' : 'text'}
                                                value={filterValue2}
                                                onChange={(e) => setFilterValue2(e.target.value)}
                                                placeholder={filterOperator === 'between' ? 'Max value...' : ''}
                                                className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-primary focus:border-primary px-3 py-2.5"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Hint for null operators */}
                            {['is_null', 'is_not_null', 'is_empty'].includes(filterOperator) && (
                                <p className="text-xs text-slate-400 italic">No value needed — this filter matches rows where the selected column {filterOperator === 'is_null' ? 'has missing (NaN) values' : filterOperator === 'is_not_null' ? 'has non-null values' : 'is empty or whitespace-only'}.</p>
                            )}
                        </div>
                    )}

                    {/* Drop Columns params */}
                    {activeOp === 'drop_cols' && (
                        <div className="space-y-3">
                            <p className="text-xs text-slate-400">Select columns to permanently remove from the dataset.</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                                {columns.map(col => (
                                    <label key={col} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm ${dropColumns.includes(col) ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 text-rose-700' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                        <input type="checkbox" checked={dropColumns.includes(col)} onChange={() => setDropColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])} className="accent-rose-500" />
                                        <span className="truncate">{col}</span>
                                    </label>
                                ))}
                            </div>
                            {dropColumns.length > 0 && <p className="text-xs text-rose-500 font-medium">{dropColumns.length} column(s) selected for removal</p>}
                        </div>
                    )}

                    {/* Rename Columns params */}
                    {activeOp === 'rename_cols' && (
                        <div className="space-y-3">
                            <p className="text-xs text-slate-400">Enter new names for columns you want to rename. Leave blank to skip.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                                {columns.map(col => (
                                    <div key={col} className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-slate-500 w-28 truncate shrink-0" title={col}>{col}</span>
                                        <span className="text-slate-300">→</span>
                                        <input type="text" value={renameMap[col] || ''} onChange={(e) => setRenameMap(prev => ({ ...prev, [col]: e.target.value }))} placeholder="New name..." className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-primary focus:border-primary" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* String Operations params */}
                    {activeOp === 'string_ops' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Column</label>
                                    <select value={strOpColumn} onChange={(e) => setStrOpColumn(e.target.value)} className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                                        <option value="">Select column...</option>
                                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Operation</label>
                                    <select value={strOperation} onChange={(e) => setStrOperation(e.target.value)} className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                                        <option value="trim">Trim Whitespace</option>
                                        <option value="lowercase">Lowercase</option>
                                        <option value="uppercase">Uppercase</option>
                                        <option value="title_case">Title Case</option>
                                        <option value="replace">Find & Replace</option>
                                        <option value="regex_replace">Regex Replace</option>
                                        <option value="extract">Regex Extract (new col)</option>
                                        <option value="remove_whitespace">Remove Extra Whitespace</option>
                                        <option value="remove_special_chars">Remove Special Characters</option>
                                    </select>
                                </div>
                            </div>
                            {['replace'].includes(strOperation) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Find</label><input type="text" value={strFindStr} onChange={(e) => setStrFindStr(e.target.value)} placeholder="Text to find..." className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" /></div>
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Replace With</label><input type="text" value={strReplaceStr} onChange={(e) => setStrReplaceStr(e.target.value)} placeholder="Replacement text..." className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" /></div>
                                </div>
                            )}
                            {['regex_replace', 'extract'].includes(strOperation) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Regex Pattern</label><input type="text" value={strRegex} onChange={(e) => setStrRegex(e.target.value)} placeholder="e.g. \\d+" className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono" /></div>
                                    {strOperation === 'regex_replace' && <div><label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Replace With</label><input type="text" value={strReplaceStr} onChange={(e) => setStrReplaceStr(e.target.value)} placeholder="Replacement..." className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" /></div>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Outlier Removal params */}
                    {activeOp === 'outliers' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Numeric Column</label>
                                <select value={outlierColumn} onChange={(e) => setOutlierColumn(e.target.value)} className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                                    <option value="">Select column...</option>
                                    {columns.filter(col => stats?.column_types && /int|float/i.test((stats.column_types as Record<string, string>)[col])).map(col => <option key={col} value={col}>{col}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Method</label>
                                <select value={outlierMethod} onChange={(e) => setOutlierMethod(e.target.value)} className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                                    <option value="zscore">Z-Score</option>
                                    <option value="iqr">IQR (Interquartile Range)</option>
                                    <option value="percentile">Percentile Clipping</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">{outlierMethod === 'zscore' ? 'Std Deviations' : outlierMethod === 'iqr' ? 'IQR Multiplier' : 'Clip % (each side)'}</label>
                                <input type="text" value={outlierThreshold} onChange={(e) => setOutlierThreshold(e.target.value)} placeholder="2" className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" />
                            </div>
                        </div>
                    )}

                    {/* Feature Engineering params */}
                    {activeOp === 'feature_eng' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">New Column Name</label>
                                    <input type="text" value={feNewColumn} onChange={(e) => setFeNewColumn(e.target.value)} placeholder="e.g. bmi, age_group" className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Expression</label>
                                    <input type="text" value={feExpression} onChange={(e) => setFeExpression(e.target.value)} placeholder="e.g. weight / (height ** 2)" className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono" />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">Use column names directly in expressions. Available: <span className="font-mono text-[10px] text-primary">{columns.slice(0, 6).join(', ')}{columns.length > 6 ? '...' : ''}</span>. Supports <code className="text-[10px]">np.log()</code>, <code className="text-[10px]">np.sqrt()</code>, arithmetic operators.</p>
                        </div>
                    )}

                    {/* Date Operations params */}
                    {activeOp === 'date_ops' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Date Column</label>
                                    <select value={dateColumn} onChange={(e) => setDateColumn(e.target.value)} className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                                        <option value="">Select column...</option>
                                        {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Operation</label>
                                    <select value={dateOperation} onChange={(e) => setDateOperation(e.target.value)} className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                                        <option value="extract_all">Extract All (year, month, day, weekday)</option>
                                        <option value="extract_year">Extract Year</option>
                                        <option value="extract_month">Extract Month</option>
                                        <option value="extract_day">Extract Day</option>
                                        <option value="extract_weekday">Extract Weekday Name</option>
                                        <option value="extract_hour">Extract Hour</option>
                                        <option value="extract_quarter">Extract Quarter</option>
                                        <option value="date_diff">Date Difference (days)</option>
                                        <option value="to_timestamp">Convert to Timestamp</option>
                                    </select>
                                </div>
                            </div>
                            {dateOperation === 'date_diff' && (
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Second Date Column (subtracted from first)</label>
                                    <select value={dateSecondColumn} onChange={(e) => setDateSecondColumn(e.target.value)} className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                                        <option value="">Select column...</option>
                                        {columns.filter(c => c !== dateColumn).map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Binning params */}
                    {activeOp === 'binning' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Numeric Column</label>
                                    <select value={binColumn} onChange={(e) => setBinColumn(e.target.value)} className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                                        <option value="">Select column...</option>
                                        {columns.filter(col => stats?.column_types && /int|float/i.test((stats.column_types as Record<string, string>)[col])).map(col => <option key={col} value={col}>{col}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Method</label>
                                    <select value={binMethod} onChange={(e) => setBinMethod(e.target.value)} className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                                        <option value="equal_width">Equal Width</option>
                                        <option value="equal_frequency">Equal Frequency (Quantile)</option>
                                        <option value="custom">Custom Edges</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">{binMethod === 'custom' ? 'Edges (comma-separated)' : 'Number of Bins'}</label>
                                    {binMethod === 'custom' ? (
                                        <input type="text" value={binEdges} onChange={(e) => setBinEdges(e.target.value)} placeholder="e.g. 0, 18, 35, 60, 100" className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono" />
                                    ) : (
                                        <input type="number" value={binCount} onChange={(e) => setBinCount(e.target.value)} min="2" max="50" className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" />
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Labels (optional, comma-separated)</label>
                                <input type="text" value={binLabels} onChange={(e) => setBinLabels(e.target.value)} placeholder="e.g. Young, Middle, Senior" className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" />
                            </div>
                        </div>
                    )}

                    {/* Sampling params */}
                    {activeOp === 'sampling' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Method</label>
                                    <select value={sampleMethod} onChange={(e) => setSampleMethod(e.target.value)} className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                                        <option value="random">Random Sample</option>
                                        <option value="stratified">Stratified Sample</option>
                                        <option value="first">First N Rows</option>
                                        <option value="last">Last N Rows</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">{['first', 'last'].includes(sampleMethod) ? 'Number of Rows' : 'Fraction (0-1)'}</label>
                                    {['first', 'last'].includes(sampleMethod) ? (
                                        <input type="number" value={sampleNRows} onChange={(e) => setSampleNRows(e.target.value)} placeholder={`e.g. ${Math.round(totalRows * 0.1) || 100}`} min="1" className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" />
                                    ) : (
                                        <input type="text" value={sampleFraction} onChange={(e) => setSampleFraction(e.target.value)} placeholder="0.5" className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5" />
                                    )}
                                </div>
                                {sampleMethod === 'stratified' && (
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Stratify By Column</label>
                                        <select value={sampleStratifyCol} onChange={(e) => setSampleStratifyCol(e.target.value)} className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                                            <option value="">Select column...</option>
                                            {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            {totalRows > 0 && <p className="text-xs text-slate-400">Current dataset: <strong>{totalRows.toLocaleString()}</strong> rows → ~<strong>{['first', 'last'].includes(sampleMethod) ? (parseInt(sampleNRows) || Math.round(totalRows * 0.5)).toLocaleString() : Math.round(totalRows * (parseFloat(sampleFraction) || 0.5)).toLocaleString()}</strong> rows after sampling</p>}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all">
                            Reset Changes
                        </button>
                        <button
                            onClick={handleApply}
                            disabled={!sessionId}
                            className={`px-6 py-2.5 bg-gradient-to-r ${activeOpDef?.color} hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/15 flex items-center gap-2 disabled:opacity-50`}
                        >
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            Apply Operation
                        </button>
                    </div>
                </div>
            )}

            {/* Minimal action row for no-param operations (duplicates, normalize, visualize, preview) */}
            {activeOp && !hasParams && activeOp !== 'preview' && (
                <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined text-base text-slate-400">info</span>
                        {activeOp === 'duplicates' && 'Click Apply to remove all duplicate rows from the dataset.'}
                        {activeOp === 'normalize' && 'Click Apply to normalize all numeric columns using StandardScaler (mean=0, std=1).'}
                        {activeOp === 'visualize' && 'Charts and distributions are displayed below automatically.'}
                    </div>
                    {activeOp !== 'visualize' && (
                        <button
                            onClick={handleApply}
                            disabled={!sessionId}
                            className={`ml-auto px-5 py-2 bg-gradient-to-r ${activeOpDef?.color} hover:opacity-90 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 shrink-0`}
                        >
                            <span className="material-symbols-outlined text-base">check_circle</span>
                            Apply
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── AI Assistant Panel ───────────────────────────────────────────
function AIAssistantPanel({ stats, operationLog }: { stats: any; operationLog: OperationLogEntry[] }) {
    const [query, setQuery] = useState('')
    const [conversation, setConversation] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
    const chatEndRef = useRef<HTMLDivElement>(null)

    const handleQuerySubmit = () => {
        const q = query.trim()
        if (!q) return
        const answer = answerDatasetQuery(q, stats)
        setConversation(prev => [...prev, { role: 'user', text: q }, { role: 'assistant', text: answer }])
        setQuery('')
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }

    const toggleCard = (id: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const colorMap: Record<string, { bg: string; text: string; border: string; dot: string }> = {
        red: { bg: 'bg-red-50 dark:bg-red-900/10', text: 'text-red-600', border: 'border-red-200 dark:border-red-800/30', dot: 'bg-red-400' },
        blue: { bg: 'bg-blue-50 dark:bg-blue-900/10', text: 'text-blue-600', border: 'border-blue-200 dark:border-blue-800/30', dot: 'bg-blue-400' },
        green: { bg: 'bg-green-50 dark:bg-green-900/10', text: 'text-green-600', border: 'border-green-200 dark:border-green-800/30', dot: 'bg-green-400' },
        purple: { bg: 'bg-purple-50 dark:bg-purple-900/10', text: 'text-purple-600', border: 'border-purple-200 dark:border-purple-800/30', dot: 'bg-purple-400' },
        orange: { bg: 'bg-orange-50 dark:bg-orange-900/10', text: 'text-orange-600', border: 'border-orange-200 dark:border-orange-800/30', dot: 'bg-orange-400' },
        cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/10', text: 'text-cyan-600', border: 'border-cyan-200 dark:border-cyan-800/30', dot: 'bg-cyan-400' },
        pink: { bg: 'bg-pink-50 dark:bg-pink-900/10', text: 'text-pink-600', border: 'border-pink-200 dark:border-pink-800/30', dot: 'bg-pink-400' },
        emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-600', border: 'border-emerald-200 dark:border-emerald-800/30', dot: 'bg-emerald-400' },
        amber: { bg: 'bg-amber-50 dark:bg-amber-900/10', text: 'text-amber-600', border: 'border-amber-200 dark:border-amber-800/30', dot: 'bg-amber-400' },
        slate: { bg: 'bg-slate-50 dark:bg-slate-900/50', text: 'text-slate-600', border: 'border-slate-200 dark:border-slate-800', dot: 'bg-slate-400' },
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5 shrink-0">
                <div className="size-10 bg-gradient-to-br from-primary to-orange-400 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <div>
                    <h3 className="font-bold leading-tight">AI Assistant</h3>
                    <p className="text-[11px] text-slate-400 uppercase tracking-widest font-black">Learning Companion</p>
                </div>
            </div>

            {/* Query Bar */}
            <div className="shrink-0 mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuerySubmit()}
                        placeholder="Ask about your data..."
                        className="flex-1 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                    />
                    <button
                        onClick={handleQuerySubmit}
                        disabled={!query.trim()}
                        className="size-10 bg-primary hover:bg-primary/90 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 rounded-xl flex items-center justify-center transition-all shrink-0"
                    >
                        <span className="material-symbols-outlined text-lg">send</span>
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 min-h-0">

                {/* Chat Conversation */}
                {conversation.length > 0 && (
                    <div className="space-y-3">
                        {conversation.map((msg, i) => (
                            <div key={i} className={`text-xs leading-relaxed ${msg.role === 'user' ? 'text-right' : ''}`}>
                                {msg.role === 'user' ? (
                                    <div className="inline-block bg-primary text-white px-3 py-2 rounded-xl rounded-tr-sm max-w-[90%] text-left">
                                        {msg.text}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl rounded-tl-sm">
                                        {msg.text.split('\n').map((line, j) => (
                                            <p key={j} className={`${j > 0 ? 'mt-1' : ''} ${line.startsWith('  •') ? 'pl-2 text-slate-500' : ''}`}>
                                                {line.split('**').map((part, k) =>
                                                    k % 2 === 1 ? <strong key={k} className="font-bold text-slate-900 dark:text-white">{part}</strong> : <span key={k}>{part}</span>
                                                )}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                )}

                {/* Auto Insights - show when no conversation */}
                {conversation.length === 0 && (
                    <div className="space-y-3">
                        {/* Data Quality Card */}
                        <div className="p-3.5 rounded-xl bg-primary/[0.04] border border-primary/20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary text-lg">psychology</span>
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-primary">Quick Insight</h4>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {stats ? (() => {
                                    const colTypes = Object.values(stats.column_types || {}) as string[];
                                    const numCount = colTypes.filter(t => /int|float/i.test(t)).length;
                                    const catCount = colTypes.length - numCount;
                                    const totalNulls = Object.values(stats.null_counts || {}).reduce((a: any, b: any) => a + (b as number), 0) as number;
                                    const dupes = stats.duplicate_rows || 0;
                                    return `${stats.total_rows} rows × ${stats.total_columns} cols. ${numCount} numeric, ${catCount} categorical. ${totalNulls > 0 ? `⚠️ ${totalNulls} nulls found.` : '✅ No nulls!'} ${dupes > 0 ? `${dupes} duplicates.` : ''}`.trim()
                                })() : 'Upload a dataset to get AI-powered insights.'}
                            </p>
                        </div>

                        {/* Suggestion prompts */}
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Try asking:</p>
                            {['What should I do next?', 'How many nulls are there?', 'Is my data ready for training?'].map(q => (
                                <button
                                    key={q}
                                    onClick={() => { setQuery(q); }}
                                    className="w-full text-left text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/50 hover:text-primary transition-all"
                                >
                                    <span className="material-symbols-outlined text-sm align-text-bottom mr-1.5 text-slate-400">chat</span>
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Operation Activity Log */}
                {operationLog.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                            <span className="material-symbols-outlined text-slate-400 text-base">history</span>
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Operation History</h4>
                            <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{operationLog.length}</span>
                        </div>

                        {operationLog.map((entry) => {
                            const colors = colorMap[entry.insight.color] || colorMap.slate
                            const isExpanded = expandedCards.has(entry.id)
                            const timeAgo = getTimeAgo(entry.timestamp)

                            return (
                                <div key={entry.id} className={`rounded-xl border ${colors.border} overflow-hidden transition-all`}>
                                    {/* Card header — always visible */}
                                    <button
                                        onClick={() => toggleCard(entry.id)}
                                        className={`w-full flex items-start gap-2.5 p-3 text-left ${colors.bg} hover:opacity-90 transition-all`}
                                    >
                                        <span className={`material-symbols-outlined text-lg mt-0.5 ${colors.text}`}>{entry.insight.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{entry.insight.title}</h5>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo}</p>
                                        </div>
                                        <span className={`material-symbols-outlined text-sm text-slate-400 mt-0.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                                    </button>

                                    {/* Expandable details */}
                                    {isExpanded && (
                                        <div className="p-3 pt-0 space-y-3 bg-white dark:bg-slate-950">
                                            {/* Description */}
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-2">
                                                {entry.insight.description}
                                            </p>

                                            {/* Pros */}
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <span className="material-symbols-outlined text-green-500 text-sm">thumb_up</span>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-green-600">Pros</span>
                                                </div>
                                                <ul className="space-y-1">
                                                    {entry.insight.pros.map((pro, i) => (
                                                        <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex gap-1.5">
                                                            <span className="text-green-400 shrink-0">+</span>
                                                            {pro}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Cons */}
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <span className="material-symbols-outlined text-red-500 text-sm">thumb_down</span>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-red-600">Cons</span>
                                                </div>
                                                <ul className="space-y-1">
                                                    {entry.insight.cons.map((con, i) => (
                                                        <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex gap-1.5">
                                                            <span className="text-red-400 shrink-0">−</span>
                                                            {con}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Alternatives */}
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <span className="material-symbols-outlined text-amber-500 text-sm">lightbulb</span>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Alternatives</span>
                                                </div>
                                                <ul className="space-y-1">
                                                    {entry.insight.alternatives.map((alt, i) => (
                                                        <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 flex gap-1.5">
                                                            <span className="text-amber-400 shrink-0">→</span>
                                                            {alt}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Learn More */}
                                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <span className="material-symbols-outlined text-primary text-sm">school</span>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-primary">Learn More</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                                    {entry.insight.learnMore}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Bottom Status */}
            <div className="shrink-0 pt-4 mt-auto">
                <div className="flex items-center gap-3 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[11px] font-semibold text-slate-500">
                        {operationLog.length > 0 ? `${operationLog.length} operation${operationLog.length > 1 ? 's' : ''} tracked` : 'Ready to assist'}
                    </span>
                    <span className="ml-auto material-symbols-outlined text-sm text-slate-400">bolt</span>
                </div>
            </div>
        </div>
    )
}

// Helper for time display
function getTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 10) return 'just now'
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
}

// ─── Main Clean Page ──────────────────────────────────────────────
export default function Clean() {
    const [sessionId, setSessionId] = useState<string | null>(() => {
        return localStorage.getItem('ml_yantra_session_id') || null
    })
    const [previewData, setPreviewData] = useState<any[]>([])
    const [totalRows, setTotalRows] = useState(0)
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [rowCount, setRowCount] = useState(15)
    const [activeOp, setActiveOp] = useState<string | null>('preview')
    const [viewLabel, setViewLabel] = useState('Data Preview')
    const [correlationData, setCorrelationData] = useState<{ columns: string[]; matrix: number[][] } | null>(null)
    const [allDistributions, setAllDistributions] = useState<Record<string, any>>({})
    const [scatterData, setScatterData] = useState<{ pairs: { x_col: string; y_col: string; x: number[]; y: number[] }[]; columns: string[] } | null>(null)
    const [linePlotData, setLinePlotData] = useState<{ x_col: string; y_col: string; data: any[] } | null>(null)
    const [boxPlotData, setBoxPlotData] = useState<{ column: string; min: number; q1: number; median: number; q3: number; max: number; outliers: number[] } | null>(null)
    const [histogramData, setHistogramData] = useState<{ column: string; counts: number[]; bins: number[] } | null>(null)
    const [countPlotData, setCountPlotData] = useState<{ column: string; labels: string[]; counts: number[] } | null>(null)
    const [barPlotData, setBarPlotData] = useState<{ x_col: string; y_col: string; agg: string; labels: string[]; values: number[] } | null>(null)
    const [histError, setHistError] = useState<string | null>(null)
    const [countError, setCountError] = useState<string | null>(null)
    const [barError, setBarError] = useState<string | null>(null)

    // Interactive Visualization State
    const [vizMode, setVizMode] = useState<string>('none') // 'none', 'full', 'overview', 'distribution', 'heatmap', 'scatter', 'lineplot', 'boxplot', 'histogram', 'countplot', 'barplot'
    const [scatterX, setScatterX] = useState<string>('')
    const [scatterY, setScatterY] = useState<string>('')
    const [lineX, setLineX] = useState<string>('')
    const [lineY, setLineY] = useState<string>('')
    const [boxCol, setBoxCol] = useState<string>('')
    const [histCol, setHistCol] = useState<string>('')
    const [countCol, setCountCol] = useState<string>('')
    const [barXCol, setBarXCol] = useState<string>('')
    const [barYCol, setBarYCol] = useState<string>('')
    const [barAgg, setBarAgg] = useState<string>('mean')
    const [selectedDistributions, setSelectedDistributions] = useState<string[]>([])
    const [distLoading, setDistLoading] = useState(false)

    // Multi-sheet state
    const [isMultiSheet, setIsMultiSheet] = useState(false)
    const [groupId, setGroupId] = useState<string | null>(null)
    const [sheets, setSheets] = useState<SheetInfo[]>([])

    // Merge/join modal state
    const [showMergeModal, setShowMergeModal] = useState(false)
    const [mergeSelectedSheets, setMergeSelectedSheets] = useState<string[]>([])
    const [mergeType, setMergeType] = useState<'concat_rows' | 'concat_cols' | 'join'>('concat_rows')
    const [mergeOnColumn, setMergeOnColumn] = useState('')
    const [mergeHow, setMergeHow] = useState('inner')
    const [mergeLoading, setMergeLoading] = useState(false)
    const [activeSheetName, setActiveSheetName] = useState<string>('')

    // Operation log for AI assistant
    const [operationLog, setOperationLog] = useState<OperationLogEntry[]>([])

    // Undo/Redo state
    const [canUndo, setCanUndo] = useState(false)
    const [canRedo, setCanRedo] = useState(false)

    // Sort state for data table
    const [sortColumn, setSortColumn] = useState<string | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)

    const sortedPreviewData = useMemo(() => {
        if (!sortColumn || !sortDirection) return previewData
        return [...previewData].sort((a, b) => {
            const aVal = a[sortColumn]
            const bVal = b[sortColumn]
            if (aVal == null && bVal == null) return 0
            if (aVal == null) return 1
            if (bVal == null) return -1
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
            }
            const aStr = String(aVal)
            const bStr = String(bVal)
            return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
        })
    }, [previewData, sortColumn, sortDirection])

    const handleSortToggle = useCallback((col: string) => {
        if (sortColumn !== col) {
            setSortColumn(col)
            setSortDirection('asc')
        } else if (sortDirection === 'asc') {
            setSortDirection('desc')
        } else {
            setSortColumn(null)
            setSortDirection(null)
        }
    }, [sortColumn, sortDirection])

    const refreshHistory = useCallback(async (sid: string) => {
        try {
            const history = await apiClient.getHistory(sid)
            setCanUndo(history.current_index > 0)
            setCanRedo(history.current_index < history.operations.length - 1)
        } catch {
            setCanUndo(false)
            setCanRedo(false)
        }
    }, [])

    const handleUndo = useCallback(async () => {
        if (!sessionId) return
        try {
            await apiClient.undo(sessionId)
            toast.success('Operation undone')
            await loadSessionData(sessionId, activeOp)
            await refreshHistory(sessionId)
        } catch (error: any) {
            toast.error(error.message || 'Undo failed')
        }
    }, [sessionId, activeOp, refreshHistory])

    const handleRedo = useCallback(async () => {
        if (!sessionId) return
        try {
            await apiClient.redo(sessionId)
            toast.success('Operation redone')
            await loadSessionData(sessionId, activeOp)
            await refreshHistory(sessionId)
        } catch (error: any) {
            toast.error(error.message || 'Redo failed')
        }
    }, [sessionId, activeOp, refreshHistory])

    const handleLogOperation = useCallback((operation: string, params: Record<string, any>) => {
        const insight = getOperationInsight(operation, params, stats)
        const entry: OperationLogEntry = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            operation,
            params,
            timestamp: new Date(),
            insight,
        }
        setOperationLog(prev => [entry, ...prev])
    }, [stats])

    const loadSessionData = async (sid: string, op?: string | null) => {
        const currentOp = op ?? activeOp
        try {
            const statsResponse = await apiClient.getStatistics(sid)
            setStats(statsResponse)

            let data: any[] = []
            let total = 0

            if (currentOp === 'nulls') {
                const res = await apiClient.getNullsPreview(sid)
                data = res.data
                total = res.total_rows
                setViewLabel('Null Values')
            } else if (currentOp === 'duplicates') {
                const res = await apiClient.getDuplicatesPreview(sid)
                data = res.data
                total = res.total_rows
                setViewLabel('Duplicate Rows')
            } else {
                const res = await apiClient.getPreview(sid, rowCount)
                data = res.data
                total = res.total_rows
                setViewLabel('Data Preview')
            }

            setPreviewData(data)
            setTotalRows(total)
        } catch (error) {
            console.error('Error loading session data:', error)
        }
    }

    // Reload data when active operation tab changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (sessionId) loadSessionData(sessionId, activeOp)
    }, [activeOp, sessionId])

    // On mount: validate saved session still exists on backend
    useEffect(() => {
        const savedId = localStorage.getItem('ml_yantra_session_id')
        if (savedId) {
            // Just validate the session exists — loadSessionData is already triggered
            // by the [activeOp, sessionId] effect above
            apiClient.getStatistics(savedId)
                .then(() => {
                    refreshHistory(savedId)
                })
                .catch(() => {
                    // Backend no longer has this session (server restarted)
                    localStorage.removeItem('ml_yantra_session_id')
                    setSessionId(null)
                })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Fetch correlation + scatter + all distributions when visualize tab is selected
    useEffect(() => {
        if (sessionId && activeOp === 'visualize') {
            // Always refresh stats when entering visualize — ensures post-encoding columns appear
            apiClient.getStatistics(sessionId).then(setStats).catch(console.error)
            apiClient.getCorrelation(sessionId).then(setCorrelationData).catch(console.error)
            apiClient.getScatterData(sessionId).then(setScatterData).catch(console.error)

            // Fetch distributions for all columns
            if (stats?.column_types) {
                setDistLoading(true)
                const cols = Object.keys(stats.column_types as Record<string, string>)
                Promise.all(
                    cols.map(col =>
                        apiClient.getDistribution(sessionId, col)
                            .then(data => ({ col, data }))
                            .catch(() => ({ col, data: null }))
                    )
                ).then(results => {
                    const map: Record<string, any> = {}
                    results.forEach(r => { if (r.data) map[r.col] = r.data })
                    setAllDistributions(map)
                    setDistLoading(false)
                })
            }
        }
    }, [sessionId, activeOp, stats])

    useEffect(() => {
        if (vizMode === 'lineplot' && lineX && lineY && sessionId) {
            apiClient.getLinePlotData(sessionId, lineX, lineY).then(setLinePlotData).catch(console.error)
        } else {
            setLinePlotData(null)
        }
    }, [vizMode, lineX, lineY, sessionId])

    useEffect(() => {
        if (vizMode === 'boxplot' && boxCol && sessionId) {
            apiClient.getBoxPlotData(sessionId, boxCol).then(setBoxPlotData).catch(console.error)
        } else {
            setBoxPlotData(null)
        }
    }, [vizMode, boxCol, sessionId])

    useEffect(() => {
        if (vizMode === 'histogram' && histCol && sessionId) {
            setHistError(null)
            setHistogramData(null)
            apiClient.getHistogramData(sessionId, histCol, 30)
                .then(data => setHistogramData(data))
                .catch((err) => {
                    const msg = err?.response?.data?.detail || err?.message || 'Failed to compute histogram.'
                    setHistError(msg)
                })
        } else {
            setHistogramData(null)
            setHistError(null)
        }
    }, [vizMode, histCol, sessionId])

    useEffect(() => {
        if (vizMode === 'countplot' && countCol && sessionId) {
            setCountError(null)
            setCountPlotData(null)
            apiClient.getCountPlotData(sessionId, countCol)
                .then(data => setCountPlotData(data))
                .catch((err) => {
                    const msg = err?.response?.data?.detail || err?.message || 'Failed to compute count plot.'
                    setCountError(msg)
                })
        } else {
            setCountPlotData(null)
            setCountError(null)
        }
    }, [vizMode, countCol, sessionId])

    useEffect(() => {
        if (vizMode === 'barplot' && barXCol && barYCol && sessionId) {
            setBarError(null)
            setBarPlotData(null)
            apiClient.getBarPlotData(sessionId, barXCol, barYCol, barAgg)
                .then(data => setBarPlotData(data))
                .catch((err) => {
                    const msg = err?.response?.data?.detail || err?.message || 'Failed to compute bar plot.'
                    setBarError(msg)
                })
        } else {
            setBarPlotData(null)
            setBarError(null)
        }
    }, [vizMode, barXCol, barYCol, barAgg, sessionId])

    // Keyboard shortcuts for Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault()
                handleUndo()
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault()
                handleRedo()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleUndo, handleRedo])

    const handleMergeSheets = async () => {
        if (!groupId || mergeSelectedSheets.length < 2) {
            toast.error('Select at least 2 sheets to merge')
            return
        }
        if (mergeType === 'join' && !mergeOnColumn) {
            toast.error('Select a join key column')
            return
        }
        setMergeLoading(true)
        try {
            const result = await apiClient.mergeSheets(
                groupId,
                mergeSelectedSheets,
                mergeType,
                mergeType === 'join' ? mergeOnColumn : undefined,
                mergeType === 'join' ? mergeHow : undefined
            )
            // Switch to the merged session
            setSessionId(result.session_id)
            localStorage.setItem('ml_yantra_session_id', result.session_id)
            setIsMultiSheet(false)
            setSheets([])
            setShowMergeModal(false)
            setMergeSelectedSheets([])
            setMergeOnColumn('')
            await loadSessionData(result.session_id)
            await refreshHistory(result.session_id)
            toast.success(result.message)
        } catch (error: any) {
            toast.error(error.message || 'Merge failed')
        } finally {
            setMergeLoading(false)
        }
    }

    const handleFileSelect = async (file: File) => {
        if (file.size > 200 * 1024 * 1024) {
            toast.error('File is too large! Please upload a dataset under 200MB.')
            return
        }
        setLoading(true)
        try {
            const uploadResponse = await apiClient.uploadFile(file)
            setSessionId(uploadResponse.session_id)
            localStorage.setItem('ml_yantra_session_id', uploadResponse.session_id)

            if (uploadResponse.is_multi_sheet && uploadResponse.sheets.length > 1) {
                setIsMultiSheet(true)
                setGroupId(uploadResponse.group_id || null)
                setSheets(uploadResponse.sheets)
                setActiveSheetName(uploadResponse.sheets[0].sheet_name)
                toast.success(`Loaded ${uploadResponse.filename} with ${uploadResponse.sheets.length} sheets`)
            } else {
                setIsMultiSheet(false)
                setGroupId(null)
                setSheets([])
                toast.success(`Successfully loaded ${uploadResponse.filename}`)
            }

            await loadSessionData(uploadResponse.session_id)
            await refreshHistory(uploadResponse.session_id)
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to upload file')
        } finally {
            setLoading(false)
        }
    }

    const handleSheetSelect = async (sid: string, sheetName: string) => {
        setSessionId(sid)
        setActiveSheetName(sheetName)
        localStorage.setItem('ml_yantra_session_id', sid)
        await loadSessionData(sid)
        await refreshHistory(sid)
    }

    const handleRowCountChange = useCallback(async (newCount: number) => {
        if (!sessionId) return
        setRowCount(newCount)
        try {
            const previewResponse = await apiClient.getPreview(sessionId, newCount)
            setPreviewData(previewResponse.data)
        } catch (error) {
            console.error('Preview error:', error)
        }
    }, [sessionId])

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files[0]
        if (file) handleFileSelect(file)
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFileSelect(file)
    }

    const columns = stats?.column_types ? Object.keys(stats.column_types) : []
    const columnHeaders = previewData.length > 0 ? Object.keys(previewData[0]) : []

    const handleExport = useCallback(async () => {
        if (!sessionId) return
        try {
            toast.loading('Preparing download…', { id: 'export' })
            const blob = await apiClient.downloadDataset(sessionId)
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'cleaned_dataset.csv'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            toast.success('Dataset downloaded!', { id: 'export' })
        } catch (error: any) {
            toast.error(error.message || 'Export failed', { id: 'export' })
        }
    }, [sessionId])

    return (
        <CleaningLayout
            aiPanel={<AIAssistantPanel stats={stats} operationLog={operationLog} />}
            onExport={sessionId ? handleExport : undefined}
        >
            {/* Operations Toolbar — integrated into main content */}
            <OperationsToolbar
                sessionId={sessionId}
                columns={columns}
                activeOp={activeOp}
                onActiveOpChange={setActiveOp}
                stats={stats}
                totalRows={totalRows}
                onOperationComplete={async () => {
                    if (sessionId) {
                        await loadSessionData(sessionId, activeOp)
                        await refreshHistory(sessionId)
                    }
                }}
                onLogOperation={handleLogOperation}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={handleUndo}
                onRedo={handleRedo}
            />
            {/* Upload Drop Zone — only on Preview tab or when no session */}
            {(!sessionId || activeOp === 'preview') && (
                <div className="p-6">
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileDrop}
                        className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <div className="size-16 bg-primary/5 rounded-full flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Add New Data Source</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">Drag and drop your CSV or Excel file here. Multi-sheet Excel files will be auto-detected.</p>
                        <button className="mt-6 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-xl text-sm font-bold">Browse Files</button>
                        <input
                            id="file-input"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            className="hidden"
                            onChange={handleFileInput}
                        />
                    </div>
                </div>
            )}
            {/* Hidden file input for other tabs — allows re-upload without showing the card */}
            {sessionId && activeOp !== 'preview' && (
                <input id="file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileInput} />
            )}

            {/* Sheet Tabs */}
            {sessionId && (
                <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    {isMultiSheet && sheets.length > 0 ? (
                        <>
                            {sheets.map((sheet) => (
                                <button
                                    key={sheet.sheet_name}
                                    onClick={() => handleSheetSelect(sheet.session_id, sheet.sheet_name)}
                                    className={`px-4 py-3 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeSheetName === sheet.sheet_name
                                            ? 'border-primary text-primary font-bold'
                                            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-base">table_chart</span>
                                    {sheet.sheet_name}
                                </button>
                            ))}
                            <button
                                onClick={() => {
                                    setMergeSelectedSheets(sheets.map(s => s.sheet_name))
                                    setShowMergeModal(true)
                                }}
                                title="Merge / Join sheets"
                                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition-all"
                            >
                                <span className="material-symbols-outlined text-base">merge</span>
                                Merge Sheets
                            </button>
                        </>
                    ) : (
                        <button className="px-4 py-3 border-b-2 border-primary text-primary font-bold text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">table_chart</span>
                            Dataset
                        </button>
                    )}
                </div>
            )}

            {/* Merge / Join Sheets Modal */}
            {showMergeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
                            <div className="size-10 bg-gradient-to-br from-primary to-orange-400 rounded-xl flex items-center justify-center text-white">
                                <span className="material-symbols-outlined">merge</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900">Merge / Join Sheets</h3>
                                <p className="text-xs text-slate-400">Combine selected sheets into a single dataset</p>
                            </div>
                            <button onClick={() => setShowMergeModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Sheet Selection */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Select Sheets to Merge</label>
                                <div className="flex flex-wrap gap-2">
                                    {sheets.map(sheet => (
                                        <label key={sheet.sheet_name} className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer text-sm font-medium transition-all ${mergeSelectedSheets.includes(sheet.sheet_name)
                                                ? 'bg-primary/10 border-primary/40 text-primary'
                                                : 'border-slate-200 text-slate-500 hover:border-primary/30'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                className="accent-primary size-3.5"
                                                checked={mergeSelectedSheets.includes(sheet.sheet_name)}
                                                onChange={() => setMergeSelectedSheets(prev =>
                                                    prev.includes(sheet.sheet_name)
                                                        ? prev.filter(s => s !== sheet.sheet_name)
                                                        : [...prev, sheet.sheet_name]
                                                )}
                                            />
                                            <span className="material-symbols-outlined text-base">table_chart</span>
                                            {sheet.sheet_name}
                                            <span className="text-[10px] text-slate-400">({sheet.rows.toLocaleString()} rows)</span>
                                        </label>
                                    ))}
                                </div>
                                {mergeSelectedSheets.length < 2 && (
                                    <p className="text-xs text-amber-500 mt-1">⚠ Select at least 2 sheets</p>
                                )}
                            </div>

                            {/* Merge Type */}
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Merge Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: 'concat_rows', label: 'Stack Rows', icon: 'table_rows', desc: 'Append rows vertically' },
                                        { value: 'concat_cols', label: 'Stack Columns', icon: 'view_column', desc: 'Append columns side-by-side' },
                                        { value: 'join', label: 'Join', icon: 'join_inner', desc: 'Join on a common key' },
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setMergeType(opt.value as any)}
                                            className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${mergeType === opt.value
                                                    ? 'bg-primary/10 border-primary/40 text-primary'
                                                    : 'border-slate-200 text-slate-500 hover:border-primary/30'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-xl">{opt.icon}</span>
                                            <span className="text-xs font-bold">{opt.label}</span>
                                            <span className="text-[10px] text-slate-400 leading-tight">{opt.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Join Options — only visible when join type selected */}
                            {mergeType === 'join' && (
                                <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Join Key Column</label>
                                        <select
                                            value={mergeOnColumn}
                                            onChange={e => setMergeOnColumn(e.target.value)}
                                            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                                        >
                                            <option value="">Select column...</option>
                                            {/* Use columns from first selected sheet */}
                                            {sheets
                                                .find(s => s.sheet_name === mergeSelectedSheets[0])
                                                ?.column_names.map(col => (
                                                    <option key={col} value={col}>{col}</option>
                                                ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Join Type</label>
                                        <select
                                            value={mergeHow}
                                            onChange={e => setMergeHow(e.target.value)}
                                            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                                        >
                                            <option value="inner">Inner Join (common rows only)</option>
                                            <option value="outer">Outer Join (all rows)</option>
                                            <option value="left">Left Join (keep all left)</option>
                                            <option value="right">Right Join (keep all right)</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                            <button
                                onClick={() => setShowMergeModal(false)}
                                className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleMergeSheets}
                                disabled={mergeLoading || mergeSelectedSheets.length < 2}
                                className="px-6 py-2 bg-gradient-to-r from-primary to-orange-400 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {mergeLoading ? (
                                    <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span> Merging...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-base">merge</span> Merge {mergeSelectedSheets.length} Sheets</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Preview Stats Cards */}
            {sessionId && stats && activeOp === 'preview' && (
                <div className="px-6 pt-6">
                    <h2 className="text-lg font-bold mb-4">Dataset Overview</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
                            <div className="size-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-500"><span className="material-symbols-outlined">table_rows</span></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Rows</p><p className="text-lg font-bold">{stats.total_rows?.toLocaleString()}</p></div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
                            <div className="size-10 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center text-purple-500"><span className="material-symbols-outlined">view_column</span></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Columns</p><p className="text-lg font-bold">{stats.total_columns}</p></div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
                            <div className="size-10 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-center justify-center text-amber-500"><span className="material-symbols-outlined">warning</span></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Null Values</p><p className="text-lg font-bold">{stats.null_counts ? Object.values(stats.null_counts as Record<string, number>).reduce((a: number, b: number) => a + b, 0) : 0}</p></div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
                            <div className="size-10 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center text-red-500"><span className="material-symbols-outlined">content_copy</span></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Duplicates</p><p className="text-lg font-bold">{stats.duplicate_rows ?? 0}</p></div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
                            <div className="size-10 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center text-green-500"><span className="material-symbols-outlined">numbers</span></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Numeric</p><p className="text-lg font-bold">{stats.column_types ? Object.values(stats.column_types as Record<string, string>).filter((t: string) => /int|float/i.test(t)).length : 0}</p></div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
                            <div className="size-10 bg-pink-50 dark:bg-pink-900/20 rounded-lg flex items-center justify-center text-pink-500"><span className="material-symbols-outlined">label</span></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase">Categorical</p><p className="text-lg font-bold">{stats.column_types ? Object.values(stats.column_types as Record<string, string>).filter((t: string) => ['object', 'category', 'bool'].includes(t)).length : 0}</p></div>
                        </div>
                    </div>

                    {/* Column Types Table */}
                    <div className="mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-slate-400">list</span>
                            <h3 className="text-sm font-bold">Column Details</h3>
                            <span className="text-xs text-slate-400 ml-auto">{stats.total_columns} columns</span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto custom-scrollbar">
                            {stats.column_types && Object.entries(stats.column_types as Record<string, string>).map(([col, dtype]) => {
                                const nullCount = stats.null_counts?.[col] ?? 0
                                const isNumeric = /int|float/i.test(dtype)
                                return (
                                    <div key={col} className="flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-block w-2 h-2 rounded-full ${isNumeric ? 'bg-green-400' : 'bg-pink-400'}`}></span>
                                            <span className="font-medium">{col}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 font-mono">{dtype}</span>
                                            {nullCount > 0 && <span className="text-xs text-amber-500 font-medium">{nullCount} nulls</span>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Encode Categorical View */}
            {sessionId && stats && activeOp === 'encode' && (
                <div className="px-6 pt-6">
                    <h2 className="text-lg font-bold mb-1">Categorical Columns</h2>
                    <p className="text-xs text-slate-400 mb-4">Select a column in the sidebar, choose encoding method, and apply. Changes reflect immediately.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {stats.column_types && Object.entries(stats.column_types as Record<string, string>)
                            .filter(([, dtype]) => ['object', 'category', 'bool'].includes(dtype))
                            .map(([col, dtype]) => {
                                const uniqueValues = previewData.length > 0
                                    ? [...new Set(previewData.map(row => row[col]).filter(v => v !== null && v !== undefined))]
                                    : []
                                return (
                                    <div key={col} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-block w-2 h-2 rounded-full bg-pink-400"></span>
                                                <h4 className="font-bold text-sm">{col}</h4>
                                            </div>
                                            <span className="text-xs px-2 py-0.5 bg-pink-50 dark:bg-pink-900/20 text-pink-500 rounded font-mono">{dtype}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs text-slate-500">{uniqueValues.length} unique values</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {uniqueValues.slice(0, 8).map((val, i) => (
                                                <span key={i} className="text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 font-medium">
                                                    {String(val).length > 20 ? String(val).substring(0, 20) + '…' : String(val)}
                                                </span>
                                            ))}
                                            {uniqueValues.length > 8 && (
                                                <span className="text-[11px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-bold">
                                                    +{uniqueValues.length - 8} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        {stats.column_types && Object.entries(stats.column_types as Record<string, string>).filter(([, dtype]) => ['object', 'category', 'bool'].includes(dtype)).length === 0 && (
                            <div className="col-span-2 text-center py-8 text-slate-400">
                                <span className="material-symbols-outlined text-4xl mb-2 block">check_circle</span>
                                <p className="text-sm font-medium">No categorical columns found — all columns are already numeric!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Datatype Conversion View */}
            {sessionId && stats && activeOp === 'convert' && (
                <div className="px-6 pt-6">
                    <h2 className="text-lg font-bold mb-1">Column Data Types</h2>
                    <p className="text-xs text-slate-400 mb-4">Select a column and target type in the sidebar, then click "Apply Operation" to convert.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stats.column_types && Object.entries(stats.column_types as Record<string, string>).map(([col, dtype]) => {
                            const typeColors: Record<string, string> = {
                                'int64': 'bg-green-50 dark:bg-green-900/20 text-green-600',
                                'int32': 'bg-green-50 dark:bg-green-900/20 text-green-600',
                                'float64': 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
                                'float32': 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600',
                                'object': 'bg-pink-50 dark:bg-pink-900/20 text-pink-600',
                                'bool': 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
                                'datetime64[ns]': 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
                                'category': 'bg-orange-50 dark:bg-orange-900/20 text-orange-600',
                            }
                            const dotColors: Record<string, string> = {
                                'int64': 'bg-green-400', 'int32': 'bg-green-400',
                                'float64': 'bg-emerald-400', 'float32': 'bg-emerald-400',
                                'object': 'bg-pink-400', 'bool': 'bg-purple-400',
                                'datetime64[ns]': 'bg-blue-400', 'category': 'bg-orange-400',
                            }
                            const nullCount = stats.null_counts?.[col] || 0
                            const uniqueCount = stats.unique_counts?.[col] || '—'
                            return (
                                <div key={col} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-block w-2 h-2 rounded-full ${dotColors[dtype] || 'bg-slate-400'}`}></span>
                                            <h4 className="font-bold text-sm truncate" title={col}>{col}</h4>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${typeColors[dtype] || 'bg-slate-100 text-slate-500'}`}>{dtype}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                        <div className="flex justify-between"><span className="text-slate-400">Nulls</span><span className="font-mono font-bold">{nullCount}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400">Unique</span><span className="font-mono font-bold">{uniqueCount}</span></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {sessionId && stats && activeOp === 'normalize' && (
                <div className="px-6 pt-6">
                    <h2 className="text-lg font-bold mb-1">Numeric Columns</h2>
                    <p className="text-xs text-slate-400 mb-4">Click "Apply Operation" to normalize all numeric columns using StandardScaler. Values will be transformed to have mean=0, std=1.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {stats.column_types && Object.entries(stats.column_types as Record<string, string>)
                            .filter(([, dtype]) => /int|float/i.test(dtype))
                            .map(([col, dtype]) => {
                                const colStats = stats.numeric_stats?.[col]
                                const range = colStats ? colStats.max - colStats.min : 0
                                const meanPercent = colStats && range > 0 ? ((colStats.mean - colStats.min) / range) * 100 : 50
                                return (
                                    <div key={col} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                                                <h4 className="font-bold text-sm">{col}</h4>
                                            </div>
                                            <span className="text-xs px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 rounded font-mono">{dtype}</span>
                                        </div>
                                        {colStats ? (
                                            <>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
                                                    <div className="flex justify-between"><span className="text-slate-400">Min</span><span className="font-mono font-bold">{colStats.min.toFixed(2)}</span></div>
                                                    <div className="flex justify-between"><span className="text-slate-400">Max</span><span className="font-mono font-bold">{colStats.max.toFixed(2)}</span></div>
                                                    <div className="flex justify-between"><span className="text-slate-400">Mean</span><span className="font-mono font-bold">{colStats.mean.toFixed(2)}</span></div>
                                                    <div className="flex justify-between"><span className="text-slate-400">Std</span><span className="font-mono font-bold">{colStats.std.toFixed(2)}</span></div>
                                                </div>
                                                {/* Visual range bar */}
                                                <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-300 to-green-500 rounded-full" style={{ width: '100%', opacity: 0.3 }}></div>
                                                    <div className="absolute top-0 h-full w-1 bg-primary rounded" style={{ left: `${meanPercent}%` }} title={`Mean: ${colStats.mean.toFixed(2)}`}></div>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                                    <span>{colStats.min.toFixed(1)}</span>
                                                    <span className="text-primary font-bold">μ {colStats.mean.toFixed(1)}</span>
                                                    <span>{colStats.max.toFixed(1)}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-xs text-slate-400">No stats available</p>
                                        )}
                                    </div>
                                )
                            })}
                        {stats.column_types && Object.entries(stats.column_types as Record<string, string>).filter(([, dtype]) => /int|float/i.test(dtype)).length === 0 && (
                            <div className="col-span-3 text-center py-8 text-slate-400">
                                <span className="material-symbols-outlined text-4xl mb-2 block">check_circle</span>
                                <p className="text-sm font-medium">No numeric columns found to normalize.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Visualize View */}
            {sessionId && stats && activeOp === 'visualize' && (
                <div className="px-6 pt-6 space-y-6 pb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="text-lg font-bold">Data Visualization Dashboard</h2>
                            <p className="text-xs text-slate-500">Pick exactly what you want to chart to keep things fast and clean.</p>
                        </div>
                        {vizMode !== 'none' && (
                            <button onClick={() => setVizMode('none')} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                                Change Chart Type
                            </button>
                        )}
                    </div>

                    {/* Chart Picker Menu */}
                    {vizMode === 'none' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <button onClick={() => setVizMode('overview')} className="p-5 border border-slate-200 hover:border-primary/50 bg-white rounded-xl text-left transition-all hover:shadow-lg group">
                                <span className="material-symbols-outlined text-4xl text-blue-500 mb-3 group-hover:scale-110 transition-transform">dashboard</span>
                                <h4 className="font-bold text-slate-800">Dataset Overview & Nulls</h4>
                                <p className="text-xs text-slate-500 mt-1">High-level statistics, column limits, and null distributions across the whole dataset.</p>
                            </button>
                            <button onClick={() => setVizMode('distribution')} className="p-5 border border-slate-200 hover:border-primary/50 bg-white rounded-xl text-left transition-all hover:shadow-lg group">
                                <span className="material-symbols-outlined text-4xl text-indigo-500 mb-3 group-hover:scale-110 transition-transform">bar_chart</span>
                                <h4 className="font-bold text-slate-800">Feature Distributions</h4>
                                <p className="text-xs text-slate-500 mt-1">Select specific columns to view their underlying shape, bells, and bars.</p>
                            </button>
                            <button onClick={() => { setVizMode('scatter'); setScatterX(''); setScatterY(''); }} className="p-5 border border-slate-200 hover:border-primary/50 bg-white rounded-xl text-left transition-all hover:shadow-lg group">
                                <span className="material-symbols-outlined text-4xl text-teal-500 mb-3 group-hover:scale-110 transition-transform">scatter_plot</span>
                                <h4 className="font-bold text-slate-800">Custom Scatter Plot</h4>
                                <p className="text-xs text-slate-500 mt-1">Explicitly select any X and Y columns to plot their direct relationship.</p>
                            </button>
                            <button onClick={() => setVizMode('heatmap')} className="p-5 border border-slate-200 hover:border-primary/50 bg-white rounded-xl text-left transition-all hover:shadow-lg group">
                                <span className="material-symbols-outlined text-4xl text-purple-500 mb-3 group-hover:scale-110 transition-transform">grid_on</span>
                                <h4 className="font-bold text-slate-800">Correlation Heatmap</h4>
                                <p className="text-xs text-slate-500 mt-1">View the correlation matrix for all numeric metrics in your dataset.</p>
                            </button>
                            <button onClick={() => { setVizMode('lineplot'); setLineX(''); setLineY(''); }} className="p-5 border border-slate-200 hover:border-primary/50 bg-white rounded-xl text-left transition-all hover:shadow-lg group">
                                <span className="material-symbols-outlined text-4xl text-rose-500 mb-3 group-hover:scale-110 transition-transform">show_chart</span>
                                <h4 className="font-bold text-slate-800">Trend Line Plot</h4>
                                <p className="text-xs text-slate-500 mt-1">Select numeric or datetime columns to plot trends across sequential data.</p>
                            </button>
                            <button onClick={() => { setVizMode('boxplot'); setBoxCol(''); }} className="p-5 border border-slate-200 hover:border-primary/50 bg-white rounded-xl text-left transition-all hover:shadow-lg group">
                                <span className="material-symbols-outlined text-4xl text-emerald-500 mb-3 group-hover:scale-110 transition-transform">candlestick_chart</span>
                                <h4 className="font-bold text-slate-800">Box Plot</h4>
                                <p className="text-xs text-slate-500 mt-1">Analyze the 5-number summary and extreme outliers for any single variable.</p>
                            </button>
                            <button onClick={() => { setVizMode('histogram'); setHistCol(''); setHistogramData(null); }} className="p-5 border border-slate-200 hover:border-primary/50 bg-white rounded-xl text-left transition-all hover:shadow-lg group">
                                <span className="material-symbols-outlined text-4xl text-orange-500 mb-3 group-hover:scale-110 transition-transform">bar_chart_4_bars</span>
                                <h4 className="font-bold text-slate-800">Histogram</h4>
                                <p className="text-xs text-slate-500 mt-1">View the frequency distribution of any numeric column using customizable bins.</p>
                            </button>
                            <button onClick={() => { setVizMode('countplot'); setCountCol(''); setCountPlotData(null); }} className="p-5 border border-slate-200 hover:border-primary/50 bg-white rounded-xl text-left transition-all hover:shadow-lg group">
                                <span className="material-symbols-outlined text-4xl text-fuchsia-500 mb-3 group-hover:scale-110 transition-transform">sort</span>
                                <h4 className="font-bold text-slate-800">Count Plot</h4>
                                <p className="text-xs text-slate-500 mt-1">Count the occurrences of each category in any column — great for categorical data.</p>
                            </button>
                            <button onClick={() => { setVizMode('barplot'); setBarXCol(''); setBarYCol(''); setBarAgg('mean'); setBarPlotData(null); }} className="p-5 border border-slate-200 hover:border-primary/50 bg-white rounded-xl text-left transition-all hover:shadow-lg group">
                                <span className="material-symbols-outlined text-4xl text-amber-500 mb-3 group-hover:scale-110 transition-transform">stacked_bar_chart</span>
                                <h4 className="font-bold text-slate-800">Bar Plot</h4>
                                <p className="text-xs text-slate-500 mt-1">Compare aggregated values (mean, sum, max…) across categories in your data.</p>
                            </button>
                            <button onClick={() => setVizMode('full')} className="p-5 border border-slate-200 hover:border-primary/50 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl text-left transition-all hover:shadow-lg group md:col-span-2 lg:col-span-3">
                                <span className="material-symbols-outlined text-4xl text-slate-600 mb-3 group-hover:scale-110 transition-transform">auto_awesome_mosaic</span>
                                <h4 className="font-bold text-slate-800">Generate Full Report</h4>
                                <p className="text-xs text-slate-500 mt-1">Execute the heavy calculation render mode. Pulls up every single chart automatically.</p>
                            </button>
                        </div>
                    )}

                    {/* Correlation Heatmap */}
                    {(vizMode === 'full' || vizMode === 'heatmap') && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-purple-500">grid_on</span>
                                <h3 className="text-sm font-bold">Correlation Heatmap</h3>
                                <span className="text-xs text-slate-400 ml-auto">Pearson correlation coefficients</span>
                            </div>
                            {correlationData && correlationData.columns.length >= 2 ? (
                                <>
                                    <div className="overflow-x-auto custom-scrollbar">
                                        <table className="text-xs border-collapse">
                                            <thead>
                                                <tr>
                                                    <th className="p-1.5 text-right"></th>
                                                    {correlationData.columns.map(col => (
                                                        <th key={col} className="p-1.5 font-medium text-slate-500 min-w-[60px] text-center" style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', maxHeight: '100px' }}>{col.length > 12 ? col.slice(0, 12) + '...' : col}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {correlationData.matrix.map((row, i) => (
                                                    <tr key={i}>
                                                        <td className="p-1.5 text-right font-medium text-slate-500 pr-2 whitespace-nowrap">{correlationData.columns[i].length > 15 ? correlationData.columns[i].slice(0, 15) + '...' : correlationData.columns[i]}</td>
                                                        {row.map((val, j) => {
                                                            const absVal = Math.abs(val)
                                                            const r = val > 0 ? 59 : 239
                                                            const g = val > 0 ? 130 : 68
                                                            const b = val > 0 ? 246 : 68
                                                            return (
                                                                <td key={j} className="p-0">
                                                                    <div className="w-14 h-10 flex items-center justify-center text-[10px] font-mono font-bold rounded-sm mx-0.5 my-0.5" style={{ backgroundColor: `rgba(${r}, ${g}, ${b}, ${absVal * 0.8})`, color: absVal > 0.5 ? 'white' : 'inherit' }} title={`${correlationData.columns[i]} vs ${correlationData.columns[j]}: ${val.toFixed(3)}`}>
                                                                        {val.toFixed(2)}
                                                                    </div>
                                                                </td>
                                                            )
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 mt-3">
                                        <span className="text-[10px] text-slate-400">-1.0</span>
                                        <div className="flex h-3 w-48 rounded-full overflow-hidden">
                                            <div className="flex-1 bg-red-400"></div>
                                            <div className="flex-1 bg-red-200"></div>
                                            <div className="flex-1 bg-slate-100"></div>
                                            <div className="flex-1 bg-blue-200"></div>
                                            <div className="flex-1 bg-blue-400"></div>
                                        </div>
                                        <span className="text-[10px] text-slate-400">+1.0</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                                    <span className="material-symbols-outlined text-4xl mb-2 block text-purple-300">grid_off</span>
                                    <p className="text-sm font-medium">No numeric columns available</p>
                                    <p className="text-xs mt-1">Correlation heatmap requires at least 2 numeric columns (int64, float64).</p>
                                    <p className="text-xs mt-0.5 text-slate-300">Your dataset has only categorical/object columns.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Scatter Plots */}
                    {(vizMode === 'full' || vizMode === 'scatter') && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-teal-500">scatter_plot</span>
                                <h3 className="text-sm font-bold">Scatter Plots</h3>
                                {vizMode === 'full' && scatterData && scatterData.pairs.length > 0 && (
                                    <span className="text-xs text-slate-400 ml-auto">{scatterData.pairs.length} column pair{scatterData.pairs.length > 1 ? 's' : ''}</span>
                                )}
                            </div>
                            {vizMode === 'scatter' && scatterData && (
                                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-end gap-4">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">X Axis Column</label>
                                        <select value={scatterX} onChange={e => setScatterX(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg py-2 px-3 focus:ring-primary">
                                            <option value="">Select numeric X...</option>
                                            {scatterData.columns.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Y Axis Column</label>
                                        <select value={scatterY} onChange={e => setScatterY(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg py-2 px-3 focus:ring-primary">
                                            <option value="">Select numeric Y...</option>
                                            {scatterData.columns.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                            {scatterData && scatterData.pairs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {scatterData.pairs.filter(pair => vizMode === 'full' || (pair.x_col === scatterX && pair.y_col === scatterY) || (pair.x_col === scatterY && pair.y_col === scatterX)).map((pair, idx) => {
                                        const xMin = Math.min(...pair.x)
                                        const xMax = Math.max(...pair.x)
                                        const yMin = Math.min(...pair.y)
                                        const yMax = Math.max(...pair.y)
                                        const xRange = xMax - xMin || 1
                                        const yRange = yMax - yMin || 1
                                        return (
                                            <div key={idx} className={`${vizMode === 'scatter' ? 'md:col-span-2 max-w-2xl mx-auto w-full' : ''} border border-slate-100 dark:border-slate-800 rounded-lg p-4 bg-white shadow-sm`}>
                                                <div className="text-xs text-slate-600 mb-3 font-bold text-center">{pair.x_col} vs {pair.y_col}</div>
                                                <div className="relative bg-slate-50 dark:bg-slate-800/50 rounded" style={{ height: vizMode === 'scatter' ? '300px' : '160px' }}>
                                                    <div className="absolute inset-0 border-l border-b border-slate-200 dark:border-slate-700 rounded"></div>
                                                    <div className="absolute left-1/4 top-0 bottom-0 border-l border-dashed border-slate-200 dark:border-slate-700"></div>
                                                    <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-slate-200 dark:border-slate-700"></div>
                                                    <div className="absolute left-3/4 top-0 bottom-0 border-l border-dashed border-slate-200 dark:border-slate-700"></div>
                                                    <div className="absolute left-0 right-0 top-1/4 border-t border-dashed border-slate-200 dark:border-slate-700"></div>
                                                    <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-slate-200 dark:border-slate-700"></div>
                                                    <div className="absolute left-0 right-0 top-3/4 border-t border-dashed border-slate-200 dark:border-slate-700"></div>
                                                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                        {pair.x.map((xVal, i) => {
                                                            const cx = ((xVal - xMin) / xRange) * 92 + 4
                                                            const cy = 96 - ((pair.y[i] - yMin) / yRange) * 92
                                                            return <circle key={i} cx={cx} cy={cy} r={vizMode === 'scatter' ? "1.5" : "1.2"} className="fill-teal-500 opacity-60"><title>{pair.x_col}: {xVal.toFixed(2)}, {pair.y_col}: {pair.y[i].toFixed(2)}</title></circle>
                                                        })}
                                                    </svg>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1">
                                                    <span>{xMin.toFixed(1)}</span>
                                                    <span className="font-bold text-slate-500">{pair.x_col}</span>
                                                    <span>{xMax.toFixed(1)}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {vizMode === 'scatter' && scatterX && scatterY && scatterData.pairs.filter(pair => (pair.x_col === scatterX && pair.y_col === scatterY) || (pair.x_col === scatterY && pair.y_col === scatterX)).length === 0 && (
                                        <div className="md:col-span-2 text-center py-8 text-slate-400">
                                            Found no intersecting chart points for these columns limits.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                                    <span className="material-symbols-outlined text-4xl mb-2 block text-teal-300">scatter_plot</span>
                                    <p className="text-sm font-medium">No numeric columns available</p>
                                    <p className="text-xs mt-1">Scatter plots require at least 2 numeric columns (int64, float64).</p>
                                    <p className="text-xs mt-0.5 text-slate-300">Your dataset has only categorical/object columns.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Trend Line Plot */}
                    {(vizMode === 'lineplot' || vizMode === 'full') && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-rose-500">show_chart</span>
                                <h3 className="text-sm font-bold">Trend Line Plot</h3>
                            </div>

                            {vizMode === 'lineplot' && scatterData && (
                                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-end gap-4">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">X Axis Column</label>
                                        <select value={lineX} onChange={e => setLineX(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg py-2 px-3 focus:ring-primary">
                                            <option value="">Select X trend...</option>
                                            {scatterData.columns.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Y Axis Column</label>
                                        <select value={lineY} onChange={e => setLineY(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg py-2 px-3 focus:ring-primary">
                                            <option value="">Select numeric Y...</option>
                                            {scatterData.columns.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {linePlotData && linePlotData.data.length > 0 ? (() => {
                                const xVals = linePlotData.data.map(r => Number(r[linePlotData.x_col])).filter(n => !isNaN(n))
                                const yVals = linePlotData.data.map(r => Number(r[linePlotData.y_col])).filter(n => !isNaN(n))
                                const xMin = Math.min(...xVals)
                                const xMax = Math.max(...xVals)
                                const yMin = Math.min(...yVals)
                                const yMax = Math.max(...yVals)
                                const xRange = xMax - xMin || 1
                                const yRange = yMax - yMin || 1

                                const points = linePlotData.data.map((row) => {
                                    const cx = ((Number(row[linePlotData.x_col]) - xMin) / xRange) * 92 + 4
                                    const cy = 96 - ((Number(row[linePlotData.y_col]) - yMin) / yRange) * 92
                                    return `${cx},${cy}`
                                }).join(' ')

                                return (
                                    <div className="max-w-2xl mx-auto w-full border border-slate-100 dark:border-slate-800 rounded-lg p-4 bg-white shadow-sm">
                                        <div className="text-xs text-slate-600 mb-3 font-bold text-center">{linePlotData.x_col} vs {linePlotData.y_col} (sampled trend)</div>
                                        <div className="relative bg-slate-50 dark:bg-slate-800/50 rounded" style={{ height: '300px' }}>
                                            <div className="absolute inset-0 border-l border-b border-slate-200 dark:border-slate-700 rounded"></div>
                                            <div className="absolute left-0 right-0 top-1/4 border-t border-dashed border-slate-200 dark:border-slate-700"></div>
                                            <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-slate-200 dark:border-slate-700"></div>
                                            <div className="absolute left-0 right-0 top-3/4 border-t border-dashed border-slate-200 dark:border-slate-700"></div>
                                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                <polyline points={points} fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-400 mt-2 px-1">
                                            <span>{xMin.toFixed(1)}</span>
                                            <span className="font-bold text-slate-500">{linePlotData.x_col}</span>
                                            <span>{xMax.toFixed(1)}</span>
                                        </div>
                                    </div>
                                )
                            })() : vizMode === 'lineplot' && lineX && lineY ? (
                                <div className="text-center py-8 text-slate-400">Loading trend line...</div>
                            ) : null}

                            {vizMode === 'lineplot' && (!lineX || !lineY) && (
                                <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                                    <span className="material-symbols-outlined text-4xl mb-2 block text-rose-300">show_chart</span>
                                    <p className="text-sm font-medium">Select columns to plot</p>
                                    <p className="text-xs mt-1">Choose X and Y axes above to generate a trend view.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Box Plot */}
                    {(vizMode === 'boxplot' || vizMode === 'full') && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-emerald-500">candlestick_chart</span>
                                <h3 className="text-sm font-bold">Box & Whisker Plot</h3>
                            </div>

                            {vizMode === 'boxplot' && scatterData && (
                                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-sm">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Numeric Column</label>
                                    <select value={boxCol} onChange={e => setBoxCol(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg py-2 px-3 focus:ring-primary">
                                        <option value="">Select column to analyze...</option>
                                        {scatterData.columns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            )}

                            {boxPlotData ? (() => {
                                const allVals = [boxPlotData.min, boxPlotData.max, ...boxPlotData.outliers]
                                const globalMin = Math.min(...allVals)
                                const globalMax = Math.max(...allVals)
                                const range = globalMax - globalMin || 1

                                const getP = (v: number) => ((v - globalMin) / range) * 100

                                return (
                                    <div className="max-w-2xl mx-auto w-full border border-slate-100 dark:border-slate-800 rounded-lg p-6 bg-white shadow-sm mt-4">
                                        <div className="text-xs text-slate-600 mb-6 font-bold text-center">{boxPlotData.column} (5-Number Summary)</div>
                                        <div className="relative h-24 mb-6" style={{ margin: '0 20px' }}>
                                            {/* Center Line (Whisker body) */}
                                            <div className="absolute border-t-2 border-emerald-500/50" style={{ left: `${getP(boxPlotData.min)}%`, right: `${100 - getP(boxPlotData.max)}%`, top: '50%' }}></div>

                                            {/* Min Bound */}
                                            <div className="absolute w-0.5 h-8 bg-emerald-500" style={{ left: `${getP(boxPlotData.min)}%`, top: 'calc(50% - 16px)' }}></div>

                                            {/* Max Bound */}
                                            <div className="absolute w-0.5 h-8 bg-emerald-500" style={{ left: `${getP(boxPlotData.max)}%`, top: 'calc(50% - 16px)' }}></div>

                                            {/* Box (IQR) */}
                                            <div className="absolute h-12 bg-emerald-100 border-2 border-emerald-500 rounded-sm" style={{ left: `${getP(boxPlotData.q1)}%`, width: `${getP(boxPlotData.q3) - getP(boxPlotData.q1)}%`, top: 'calc(50% - 24px)' }}></div>

                                            {/* Median Line */}
                                            <div className="absolute w-0.5 h-12 bg-emerald-700" style={{ left: `${getP(boxPlotData.median)}%`, top: 'calc(50% - 24px)' }}></div>

                                            {/* Outliers */}
                                            {boxPlotData.outliers.map((o, i) => (
                                                <div key={i} className="absolute w-1.5 h-1.5 bg-rose-400 rounded-full" style={{ left: `${getP(o)}%`, top: 'calc(50% - 3px)', marginLeft: '-3px' }} title={`Outlier: ${o}`}></div>
                                            ))}

                                            {/* Labels */}
                                            <div className="absolute text-[9px] text-slate-400 -bottom-6 translate-x-[-50%]" style={{ left: `${getP(boxPlotData.min)}%` }}>{boxPlotData.min.toFixed(1)}</div>
                                            <div className="absolute text-[9px] font-bold text-emerald-700 -top-6 translate-x-[-50%]" style={{ left: `${getP(boxPlotData.median)}%` }}>Med: {boxPlotData.median.toFixed(1)}</div>
                                            <div className="absolute text-[9px] text-slate-400 -bottom-6 translate-x-[-50%]" style={{ left: `${getP(boxPlotData.max)}%` }}>{boxPlotData.max.toFixed(1)}</div>
                                        </div>
                                    </div>
                                )
                            })() : vizMode === 'boxplot' && boxCol ? (
                                <div className="text-center py-8 text-slate-400">Calculating percentiles...</div>
                            ) : null}

                            {vizMode === 'boxplot' && (!boxCol) && (
                                <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                                    <span className="material-symbols-outlined text-4xl mb-2 block text-emerald-300">candlestick_chart</span>
                                    <p className="text-sm font-medium">Select a column</p>
                                    <p className="text-xs mt-1">Choose a numeric column to analyze its quartile boundaries.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Histogram */}
                    {vizMode === 'histogram' && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-orange-500">bar_chart_4_bars</span>
                                <h3 className="text-sm font-bold">Histogram</h3>
                                <span className="text-xs text-slate-400 ml-auto">Frequency distribution</span>
                            </div>
                            {stats?.column_types && (
                                <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-sm">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Numeric Column</label>
                                    <select value={histCol} onChange={e => setHistCol(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg py-2 px-3 focus:ring-primary">
                                        <option value="">Select column...</option>
                                        {Object.entries(stats.column_types as Record<string, string>)
                                            .filter(([, dtype]) => /int|float/i.test(dtype))
                                            .map(([c]) => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            )}
                            {histError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-red-400 text-sm">error</span>
                                    <p className="text-xs text-red-600 font-medium">{histError}</p>
                                </div>
                            )}
                            {histogramData && histogramData.counts.length > 0 ? (() => {
                                const maxCount = Math.max(...histogramData.counts)
                                return (
                                    <div className="max-w-2xl mx-auto w-full">
                                        <div className="flex items-end gap-0.5 h-48 bg-slate-50 rounded-lg p-3">
                                            {histogramData.counts.map((count, i) => {
                                                const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0
                                                const binStart = histogramData.bins[i]?.toFixed(1)
                                                const binEnd = histogramData.bins[i + 1]?.toFixed(1)
                                                return (
                                                    <div key={i} className="flex-1 flex flex-col items-center justify-end group/bar" title={`${binStart}–${binEnd}: ${count} rows`}>
                                                        <div
                                                            className="w-full bg-gradient-to-t from-orange-500 to-orange-300 rounded-t-sm transition-all duration-300 group-hover/bar:from-orange-600 group-hover/bar:to-orange-400 relative"
                                                            style={{ height: `${Math.max(heightPct, count > 0 ? 2 : 0)}%` }}
                                                        >
                                                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">{count}</div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="flex justify-between text-[9px] text-slate-400 mt-1 px-3">
                                            <span>{histogramData.bins[0]?.toFixed(1)}</span>
                                            <span className="font-bold text-slate-500">{histogramData.column}</span>
                                            <span>{histogramData.bins[histogramData.bins.length - 1]?.toFixed(1)}</span>
                                        </div>
                                        <div className="mt-3 flex gap-4 text-[10px] text-slate-400 px-3">
                                            <span>Total Bins: <strong>{histogramData.counts.length}</strong></span>
                                            <span>Max Freq: <strong>{maxCount.toLocaleString()}</strong></span>
                                            <span>Total Rows (non-null): <strong>{histogramData.counts.reduce((a, b) => a + b, 0).toLocaleString()}</strong></span>
                                        </div>
                                    </div>
                                )
                            })() : !histError && histCol ? (
                                <div className="text-center py-8 text-slate-400">Computing histogram...</div>
                            ) : !histError && (
                                <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                                    <span className="material-symbols-outlined text-4xl mb-2 block text-orange-300">bar_chart_4_bars</span>
                                    <p className="text-sm font-medium">Select a numeric column</p>
                                    <p className="text-xs mt-1">Choose any numeric column to view its frequency distribution.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Count Plot */}
                    {vizMode === 'countplot' && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-fuchsia-500">sort</span>
                                <h3 className="text-sm font-bold">Count Plot</h3>
                                <span className="text-xs text-slate-400 ml-auto">Category frequency (Top 25)</span>
                            </div>
                            {columns.length > 0 && (
                                <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-lg max-w-sm">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Column</label>
                                    <select value={countCol} onChange={e => setCountCol(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg py-2 px-3 focus:ring-primary">
                                        <option value="">Select column...</option>
                                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            )}
                            {countError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-red-400 text-sm">error</span>
                                    <p className="text-xs text-red-600 font-medium">{countError}</p>
                                </div>
                            )}
                            {countPlotData && countPlotData.labels.length > 0 ? (() => {
                                const maxCount = Math.max(...countPlotData.counts)
                                return (
                                    <div className="space-y-1.5 max-w-2xl mx-auto">
                                        {countPlotData.labels.map((label, i) => {
                                            const count = countPlotData.counts[i]
                                            const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0
                                            return (
                                                <div key={label} className="flex items-center gap-3 group/bar">
                                                    <span className="text-xs text-slate-500 w-28 text-right truncate flex-shrink-0 font-medium" title={label}>{label}</span>
                                                    <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-6 overflow-hidden relative">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-fuchsia-500 to-purple-400 rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.max(widthPct, 3)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-bold font-mono w-12 text-right flex-shrink-0 text-slate-700">{count.toLocaleString()}</span>
                                                </div>
                                            )
                                        })}
                                        <div className="text-[10px] text-slate-400 mt-2">Showing top {countPlotData.labels.length} categories for <strong>{countPlotData.column}</strong></div>
                                    </div>
                                )
                            })() : !countError && countCol ? (
                                <div className="text-center py-8 text-slate-400">Counting categories...</div>
                            ) : !countError && (
                                <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                                    <span className="material-symbols-outlined text-4xl mb-2 block text-fuchsia-300">sort</span>
                                    <p className="text-sm font-medium">Select a column</p>
                                    <p className="text-xs mt-1">Works best with categorical (object/string) columns.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Bar Plot */}
                    {vizMode === 'barplot' && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-amber-500">stacked_bar_chart</span>
                                <h3 className="text-sm font-bold">Bar Plot</h3>
                                <span className="text-xs text-slate-400 ml-auto">Aggregated category comparison</span>
                            </div>
                            {columns.length > 0 && (
                                <div className="mb-5 p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-end gap-4">
                                    <div className="flex-1 min-w-[140px]">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">X Axis (Category)</label>
                                        <select value={barXCol} onChange={e => setBarXCol(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg py-2 px-3 focus:ring-primary">
                                            <option value="">Select category col...</option>
                                            {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex-1 min-w-[140px]">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Y Axis (Numeric)</label>
                                        <select value={barYCol} onChange={e => setBarYCol(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg py-2 px-3 focus:ring-primary">
                                            <option value="">Select numeric col...</option>
                                            {stats?.column_types && Object.entries(stats.column_types as Record<string, string>)
                                                .filter(([, dtype]) => /int|float/i.test(dtype))
                                                .map(([c]) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="min-w-[110px]">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Aggregation</label>
                                        <select value={barAgg} onChange={e => setBarAgg(e.target.value)} className="w-full text-sm border-slate-200 rounded-lg py-2 px-3 focus:ring-primary">
                                            <option value="mean">Mean (Avg)</option>
                                            <option value="sum">Sum (Total)</option>
                                            <option value="median">Median</option>
                                            <option value="max">Max</option>
                                            <option value="min">Min</option>
                                            <option value="count">Count</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                            {barError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-red-400 text-sm">error</span>
                                    <p className="text-xs text-red-600 font-medium">{barError}</p>
                                </div>
                            )}
                            {barPlotData && barPlotData.labels.length > 0 ? (() => {
                                const maxVal = Math.max(...barPlotData.values)
                                return (
                                    <div className="max-w-2xl mx-auto w-full">
                                        <div className="flex items-end gap-1 h-56 bg-slate-50 rounded-lg p-3">
                                            {barPlotData.labels.map((label, i) => {
                                                const val = barPlotData.values[i]
                                                const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0
                                                return (
                                                    <div key={label} className="flex-1 flex flex-col items-center justify-end group/bar" title={`${label}: ${val.toFixed(2)}`}>
                                                        <div className="text-[7px] text-slate-400 mb-0.5 opacity-0 group-hover/bar:opacity-100 transition-opacity font-mono">{val.toFixed(1)}</div>
                                                        <div
                                                            className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-t-sm transition-all duration-300 group-hover/bar:from-amber-600 group-hover/bar:to-amber-400"
                                                            style={{ height: `${Math.max(heightPct, 2)}%` }}
                                                        ></div>
                                                        <div className="text-[7px] text-slate-400 mt-1 w-full text-center truncate px-0.5" title={label}>{label.length > 8 ? label.slice(0, 7) + '…' : label}</div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                                            <span className="font-bold text-slate-500">{barPlotData.x_col}</span>
                                            <span className="text-indigo-500 font-semibold">{barPlotData.agg.charAt(0).toUpperCase() + barPlotData.agg.slice(1)} of {barPlotData.y_col}</span>
                                        </div>
                                    </div>
                                )
                            })() : !barError && barXCol && barYCol ? (
                                <div className="text-center py-8 text-slate-400">Aggregating data...</div>
                            ) : !barError && (
                                <div className="text-center py-8 text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-lg">
                                    <span className="material-symbols-outlined text-4xl mb-2 block text-amber-300">stacked_bar_chart</span>
                                    <p className="text-sm font-medium">Configure your Bar Plot</p>
                                    <p className="text-xs mt-1">Select a category column, a numeric column, and an aggregation method above.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* All Column Distributions */}
                    {(vizMode === 'full' || vizMode === 'distribution') && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-indigo-500">bar_chart</span>
                                <h3 className="text-sm font-bold">Value Distributions</h3>
                                {distLoading && <span className="text-xs text-slate-400 ml-auto animate-pulse">Loading distributions...</span>}
                            </div>
                            {vizMode === 'distribution' && Object.keys(allDistributions).length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Select Columns to Visualize</label>
                                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                        {Object.keys(allDistributions).map(col => (
                                            <label key={col} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all text-xs font-medium ${selectedDistributions.includes(col) ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}>
                                                <input type="checkbox" className="accent-indigo-500 size-3" checked={selectedDistributions.includes(col)} onChange={() => setSelectedDistributions(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col])} />
                                                {col}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {Object.keys(allDistributions).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(allDistributions).filter(([col]) => vizMode === 'full' || selectedDistributions.includes(col)).map(([col, dist]: [string, any]) => (
                                        <div key={col} className="border border-slate-100 dark:border-slate-800 rounded-lg p-3 shadow-sm">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-bold">{col}</h4>
                                                <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-slate-500">{dist.type}</span>
                                            </div>
                                            {dist.type === 'numeric' ? (
                                                <div>
                                                    <div className="flex items-end gap-px h-24">
                                                        {(dist.counts as number[]).map((count: number, i: number) => {
                                                            const maxCount = Math.max(...(dist.counts as number[]))
                                                            const heightPct = maxCount > 0 ? (count / maxCount) * 100 : 0
                                                            return (
                                                                <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${dist.bins?.[i]?.toFixed(1)}: ${count}`}>
                                                                    <div className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-sm" style={{ height: `${heightPct}%`, minHeight: count > 0 ? '2px' : '0' }}></div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                    <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                                                        <span>{dist.bins?.[0]?.toFixed(1)}</span>
                                                        <span>{dist.bin_edges?.[dist.bin_edges.length - 1]?.toFixed(1)}</span>
                                                    </div>
                                                    {dist.stats && (
                                                        <div className="flex gap-3 mt-2 text-[10px]">
                                                            <span className="text-slate-400">Mean: <strong className="text-primary">{dist.stats.mean.toFixed(2)}</strong></span>
                                                            <span className="text-slate-400">Std: <strong>{dist.stats.std.toFixed(2)}</strong></span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {(dist.labels as string[]).slice(0, 6).map((label: string, i: number) => {
                                                        const count = dist.counts[i] as number
                                                        const maxCount = Math.max(...(dist.counts as number[]))
                                                        const widthPct = maxCount > 0 ? (count / maxCount) * 100 : 0
                                                        return (
                                                            <div key={label} className="flex items-center gap-1.5">
                                                                <span className="text-[10px] text-slate-500 w-20 text-right truncate" title={label}>{label}</span>
                                                                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                                                                    <div className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full" style={{ width: `${Math.max(widthPct, 3)}%` }}></div>
                                                                </div>
                                                                <span className="text-[9px] font-mono font-bold w-8 text-right">{count}</span>
                                                            </div>
                                                        )
                                                    })}
                                                    {(dist.labels as string[]).length > 6 && (
                                                        <span className="text-[10px] text-slate-400">+{(dist.labels as string[]).length - 6} more</span>
                                                    )}
                                                    <div className="text-[10px] text-slate-400 mt-1">{dist.unique_count} unique / {dist.total} total</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                !distLoading && (
                                    <div className="text-center py-6 text-slate-400">
                                        <span className="material-symbols-outlined text-3xl mb-2 block">hourglass_empty</span>
                                        <p className="text-sm">Loading distribution data...</p>
                                    </div>
                                )
                            )}
                            {vizMode === 'distribution' && selectedDistributions.length === 0 && (
                                <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-lg">
                                    Select features above to view their visual distributions.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Null Distribution */}
                    {(vizMode === 'full' || vizMode === 'overview') && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-in fade-in zoom-in duration-300 delay-75">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-amber-500">warning</span>
                                <h3 className="text-sm font-bold">Null Distribution by Column</h3>
                            </div>
                            <div className="space-y-2">
                                {stats.null_counts && Object.entries(stats.null_counts as Record<string, number>)
                                    .sort(([, a], [, b]) => (b as number) - (a as number))
                                    .map(([col, count]) => {
                                        const pct = stats.total_rows > 0 ? ((count as number) / stats.total_rows) * 100 : 0
                                        return (
                                            <div key={col} className="flex items-center gap-3">
                                                <span className="text-xs text-slate-500 w-28 text-right truncate font-medium" title={col}>{col}</span>
                                                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
                                                    <div className={`h-full rounded-full transition-all ${(count as number) > 0 ? 'bg-gradient-to-r from-amber-400 to-red-400' : 'bg-green-400'}`} style={{ width: `${Math.max(pct, (count as number) > 0 ? 2 : 100)}%` }}></div>
                                                </div>
                                                <span className="text-xs font-mono font-bold w-20 text-right">{count as number} <span className="text-slate-400">({pct.toFixed(1)}%)</span></span>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    )}

                    {/* Column Type Distribution */}
                    {(vizMode === 'full' || vizMode === 'overview') && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-in fade-in zoom-in duration-300 delay-150">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-blue-500">donut_large</span>
                                <h3 className="text-sm font-bold">Column Type Distribution</h3>
                            </div>
                            {(() => {
                                const types = stats.column_types ? Object.values(stats.column_types as Record<string, string>) : []
                                const counts: Record<string, number> = {}
                                types.forEach((t: string) => { counts[t] = (counts[t] || 0) + 1 })
                                const total = types.length
                                const colors: Record<string, string> = { 'int64': 'bg-green-400', 'float64': 'bg-emerald-400', 'object': 'bg-pink-400', 'bool': 'bg-purple-400', 'datetime64[ns]': 'bg-blue-400', 'category': 'bg-orange-400', 'int32': 'bg-green-300', 'float32': 'bg-emerald-300' }
                                return (
                                    <>
                                        <div className="flex rounded-full h-6 overflow-hidden mb-4">
                                            {Object.entries(counts).map(([dtype, count]) => (
                                                <div key={dtype} className={`${colors[dtype] || 'bg-slate-300'} transition-all`} style={{ width: `${(count / total) * 100}%` }} title={`${dtype}: ${count}`}></div>
                                            ))}
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {Object.entries(counts).map(([dtype, count]) => (
                                                <div key={dtype} className="flex items-center gap-1.5">
                                                    <div className={`w-3 h-3 rounded ${colors[dtype] || 'bg-slate-300'}`}></div>
                                                    <span className="text-xs font-medium">{dtype}</span>
                                                    <span className="text-xs text-slate-400">({count})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                    )}

                    {/* Numeric Statistics */}
                    {(vizMode === 'full' || vizMode === 'overview') && stats.column_types && Object.entries(stats.column_types as Record<string, string>).some(([, dtype]) => /int|float/i.test(dtype)) && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-in fade-in zoom-in duration-300 delay-200">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-green-500">analytics</span>
                                <h3 className="text-sm font-bold">Numeric Column Statistics</h3>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800">
                                            <th className="p-3 text-left font-bold">Column</th>
                                            <th className="p-3 text-right font-bold">Min</th>
                                            <th className="p-3 text-right font-bold">Max</th>
                                            <th className="p-3 text-right font-bold">Mean</th>
                                            <th className="p-3 text-right font-bold">Median</th>
                                            <th className="p-3 text-right font-bold">Std</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.numeric_stats && Object.entries(stats.numeric_stats as Record<string, any>).map(([col, s]: [string, any]) => (
                                            <tr key={col} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                <td className="p-3 font-medium">{col}</td>
                                                <td className="p-3 text-right font-mono">{s.min.toFixed(2)}</td>
                                                <td className="p-3 text-right font-mono">{s.max.toFixed(2)}</td>
                                                <td className="p-3 text-right font-mono text-primary font-bold">{s.mean.toFixed(2)}</td>
                                                <td className="p-3 text-right font-mono">{s.median.toFixed(2)}</td>
                                                <td className="p-3 text-right font-mono">{s.std.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Data Table */}
            {sessionId && previewData.length > 0 && (
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold">{viewLabel}</h1>
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                                <span className="text-xs text-slate-500 font-medium">Rows:</span>
                                <input
                                    className="w-32 accent-primary"
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={rowCount}
                                    onChange={(e) => handleRowCountChange(Number(e.target.value))}
                                />
                                <span className="text-xs font-bold w-4">{rowCount}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {sortColumn && (
                                <span className="text-xs text-slate-400 font-medium">
                                    Sorted by <strong className="text-slate-600 dark:text-slate-300">{sortColumn}</strong> {sortDirection === 'asc' ? '↑' : '↓'}
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    if (!sortColumn && columnHeaders.length > 0) {
                                        handleSortToggle(columnHeaders[0])
                                    } else if (sortColumn) {
                                        setSortColumn(null)
                                        setSortDirection(null)
                                    }
                                }}
                                title={sortColumn ? 'Clear sort' : 'Click column headers to sort'}
                                className={`p-2 rounded-lg border transition-colors ${sortColumn ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary'}`}
                            >
                                <span className="material-symbols-outlined">sort</span>
                            </button>
                            <button
                                onClick={handleExport}
                                title="Download dataset as CSV"
                                className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
                            >
                                <span className="material-symbols-outlined">download</span>
                            </button>
                        </div>
                    </div>

                    {/* The Table */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                                        {columnHeaders.map((header) => (
                                            <th
                                                key={header}
                                                onClick={() => handleSortToggle(header)}
                                                className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-primary select-none transition-colors"
                                            >
                                                <span className="inline-flex items-center gap-1">
                                                    {header}
                                                    {sortColumn === header && (
                                                        <span className="material-symbols-outlined text-primary text-sm">
                                                            {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                                        </span>
                                                    )}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {sortedPreviewData.map((row, rowIdx) => (
                                        <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            {columnHeaders.map((header) => {
                                                const value = row[header]
                                                const isNull = value === null || value === undefined || value === ''
                                                return (
                                                    <td key={header} className={`p-4 text-sm ${isNull ? 'font-mono text-slate-300 italic' : 'font-medium'}`}>
                                                        {isNull ? 'null' : String(value)}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Showing {previewData.length} of {totalRows} rows</p>
                </div>
            )}

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl flex items-center gap-4 border border-slate-200 dark:border-slate-800">
                        <div className="size-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <div>
                            <h3 className="font-bold text-lg">Processing file...</h3>
                            <p className="text-slate-500 text-sm">Uploading and analyzing your dataset</p>
                        </div>
                    </div>
                </div>
            )}
        </CleaningLayout>
    )
}

// ─── Error Boundary ────────────────────────────────────────────────
class CleanErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
    constructor(props: any) {
        super(props)
        this.state = { hasError: false, error: '' }
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error: error.message }
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50">
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md shadow-lg text-center">
                        <span className="material-symbols-outlined text-5xl text-red-400 mb-4 block">error</span>
                        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
                        <p className="text-slate-500 text-sm mb-4">{this.state.error}</p>
                        <button
                            onClick={() => { this.setState({ hasError: false, error: '' }); window.location.reload() }}
                            className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            )
        }
        return this.props.children
    }
}

export { CleanErrorBoundary }
