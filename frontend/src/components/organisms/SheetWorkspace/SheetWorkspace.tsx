import { useState } from 'react'
import apiClient from '../../../services/api'
import toast from 'react-hot-toast'

interface SheetInfo {
    sheet_name: string
    session_id: string
    rows: number
    columns: number
    column_names: string[]
    column_types: Record<string, string>
}

interface SheetWorkspaceProps {
    sheets: SheetInfo[]
    groupId: string
    activeSessionId: string
    onSheetSelect: (sessionId: string, sheetName: string) => void
    onMergeComplete: (sessionId: string) => void
}

export const SheetWorkspace: React.FC<SheetWorkspaceProps> = ({
    sheets,
    groupId,
    activeSessionId,
    onSheetSelect,
    onMergeComplete
}) => {
    const [showMerge, setShowMerge] = useState(false)
    const [selectedSheets, setSelectedSheets] = useState<string[]>([])
    const [mergeType, setMergeType] = useState<'concat_rows' | 'concat_cols' | 'join'>('concat_rows')
    const [joinColumn, setJoinColumn] = useState('')
    const [joinHow, setJoinHow] = useState('inner')
    const [commonColumns, setCommonColumns] = useState<string[]>([])
    const [merging, setMerging] = useState(false)
    const [sheetsSameColumns, setSheetsSameColumns] = useState(false)

    const toggleSheetSelection = async (sheetName: string) => {
        const newSelection = selectedSheets.includes(sheetName)
            ? selectedSheets.filter(s => s !== sheetName)
            : [...selectedSheets, sheetName]

        setSelectedSheets(newSelection)

        if (newSelection.length >= 2) {
            try {
                const result = await apiClient.getCommonColumns(groupId, newSelection)
                setCommonColumns(result.common_columns)
                setSheetsSameColumns(result.sheets_have_same_columns)
                if (result.common_columns.length > 0) {
                    setJoinColumn(result.common_columns[0])
                }
            } catch {
                setCommonColumns([])
            }
        }
    }

    const handleMerge = async () => {
        if (selectedSheets.length < 2) {
            toast.error('Select at least 2 sheets to merge')
            return
        }
        if (mergeType === 'join' && !joinColumn) {
            toast.error('Select a column to join on')
            return
        }

        setMerging(true)
        try {
            const result = await apiClient.mergeSheets(
                groupId,
                selectedSheets,
                mergeType,
                mergeType === 'join' ? joinColumn : undefined,
                mergeType === 'join' ? joinHow : undefined
            )
            toast.success(result.message)
            onMergeComplete(result.session_id)
            setShowMerge(false)
            setSelectedSheets([])
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Merge failed')
        } finally {
            setMerging(false)
        }
    }

    return (
        <div className="space-y-3">
            {/* Sheet Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-base-content/60">Sheets:</span>
                <div className="tabs tabs-boxed tabs-sm bg-base-200">
                    {sheets.map(sheet => (
                        <button
                            key={sheet.session_id}
                            className={`tab ${activeSessionId === sheet.session_id ? 'tab-active' : ''}`}
                            onClick={() => onSheetSelect(sheet.session_id, sheet.sheet_name)}
                        >
                            {sheet.sheet_name}
                            <span className="ml-1 badge badge-xs badge-ghost">{sheet.rows}r</span>
                        </button>
                    ))}
                </div>
                <button
                    className="btn btn-xs btn-outline btn-primary"
                    onClick={() => setShowMerge(!showMerge)}
                >
                    <span className="material-symbols-rounded text-sm">merge</span>
                    Merge Sheets
                </button>
            </div>

            {/* Merge Dialog */}
            {showMerge && (
                <div className="card bg-base-100 border border-primary/30 shadow-lg">
                    <div className="card-body p-4 space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                            <span className="material-symbols-rounded text-primary">merge</span>
                            Merge Sheets
                        </h3>

                        {/* Select Sheets */}
                        <div>
                            <label className="label"><span className="label-text font-medium">Select sheets to merge (min 2)</span></label>
                            <div className="flex flex-wrap gap-2">
                                {sheets.map(sheet => (
                                    <label key={sheet.sheet_name} className="flex items-center gap-2 cursor-pointer bg-base-200 px-3 py-2 rounded-lg hover:bg-base-300 transition-colors">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-primary checkbox-sm"
                                            checked={selectedSheets.includes(sheet.sheet_name)}
                                            onChange={() => toggleSheetSelection(sheet.sheet_name)}
                                        />
                                        <span className="text-sm font-medium">{sheet.sheet_name}</span>
                                        <span className="text-xs text-base-content/50">{sheet.rows}×{sheet.columns}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Merge Type */}
                        {selectedSheets.length >= 2 && (
                            <>
                                <div>
                                    <label className="label"><span className="label-text font-medium">Merge Type</span></label>
                                    <div className="space-y-2">
                                        <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mergeType === 'concat_rows' ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-primary/50'}`}>
                                            <input type="radio" name="mergeType" className="radio radio-primary radio-sm mt-0.5" checked={mergeType === 'concat_rows'} onChange={() => setMergeType('concat_rows')} />
                                            <div>
                                                <p className="font-medium text-sm">Concatenate (Row-wise)</p>
                                                <p className="text-xs text-base-content/60">Stack rows vertically. Best when sheets have the same columns. Missing columns will be filled with NULL.</p>
                                            </div>
                                        </label>
                                        <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mergeType === 'concat_cols' ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-primary/50'}`}>
                                            <input type="radio" name="mergeType" className="radio radio-primary radio-sm mt-0.5" checked={mergeType === 'concat_cols'} onChange={() => setMergeType('concat_cols')} />
                                            <div>
                                                <p className="font-medium text-sm">Concatenate (Column-wise)</p>
                                                <p className="text-xs text-base-content/60">Add columns side-by-side. Best when sheets have different columns but same number of rows.</p>
                                            </div>
                                        </label>
                                        <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${mergeType === 'join' ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-primary/50'} ${commonColumns.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <input type="radio" name="mergeType" className="radio radio-primary radio-sm mt-0.5" checked={mergeType === 'join'} onChange={() => setMergeType('join')} disabled={commonColumns.length === 0} />
                                            <div>
                                                <p className="font-medium text-sm">Join (on common column)</p>
                                                <p className="text-xs text-base-content/60">
                                                    {commonColumns.length > 0
                                                        ? `Merge on a shared column like SQL JOIN. Common columns: ${commonColumns.join(', ')}`
                                                        : 'No common columns found between selected sheets'}
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Join Options */}
                                {mergeType === 'join' && commonColumns.length > 0 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="label"><span className="label-text text-sm">Join Column</span></label>
                                            <select className="select select-bordered select-sm w-full" value={joinColumn} onChange={e => setJoinColumn(e.target.value)}>
                                                {commonColumns.map(col => (
                                                    <option key={col} value={col}>{col}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label"><span className="label-text text-sm">Join Type</span></label>
                                            <select className="select select-bordered select-sm w-full" value={joinHow} onChange={e => setJoinHow(e.target.value)}>
                                                <option value="inner">Inner (only matching rows)</option>
                                                <option value="outer">Outer (all rows from both)</option>
                                                <option value="left">Left (all from first sheet)</option>
                                                <option value="right">Right (all from second sheet)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {/* Disclaimer */}
                                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
                                    <p className="text-xs text-warning-content flex items-start gap-2">
                                        <span className="material-symbols-rounded text-warning text-sm mt-0.5">info</span>
                                        <span>
                                            {mergeType === 'concat_rows' && (
                                                <>Data will be merged <strong>row-wise (vertically)</strong>. Rows from all selected sheets will be stacked. {!sheetsSameColumns && 'Columns not present in all sheets will be filled with NULL values.'}</>
                                            )}
                                            {mergeType === 'concat_cols' && (
                                                <>Data will be merged <strong>column-wise (horizontally)</strong>. Columns from all sheets will be placed side-by-side. Sheets should ideally have the same number of rows.</>
                                            )}
                                            {mergeType === 'join' && (
                                                <>Data will be merged using a <strong>{joinHow} join</strong> on column "<strong>{joinColumn}</strong>". Only rows with matching values in the join column will be combined ({joinHow === 'inner' ? 'strict match' : joinHow === 'outer' ? 'all rows kept' : `all from ${joinHow} sheet kept`}).</>
                                            )}
                                        </span>
                                    </p>
                                </div>

                                {/* Merge Button */}
                                <div className="flex justify-end gap-2">
                                    <button className="btn btn-sm btn-ghost" onClick={() => { setShowMerge(false); setSelectedSheets([]) }}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-sm btn-primary" onClick={handleMerge} disabled={merging}>
                                        {merging && <span className="loading loading-spinner loading-xs"></span>}
                                        Merge {selectedSheets.length} Sheets
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default SheetWorkspace
