// SectionPreview - Mini preview table for specific filtered data
import { useState, useEffect, useRef, useCallback } from 'react'
import apiClient from '../../../services/api'

interface SectionPreviewProps {
    sessionId: string
    type: 'nulls' | 'duplicates'
    columns?: string[]
}

const PAGE_SIZE = 20

export const SectionPreview: React.FC<SectionPreviewProps> = ({ sessionId, type, columns }) => {
    const [data, setData] = useState<Record<string, any>[]>([])
    const [totalRows, setTotalRows] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const [page, setPage] = useState(0)

    // Build a stable key from columns WITHOUT mutating the array
    const columnsKey = columns && columns.length > 0
        ? [...columns].sort().join(',')
        : 'all'

    // Store previous key to avoid duplicate fetches
    const prevKeyRef = useRef('')
    const fetchIdRef = useRef(0)

    const doFetch = useCallback(async () => {
        const key = `${sessionId}-${type}-${columnsKey}`

        // Skip if same request
        if (prevKeyRef.current === key) return
        prevKeyRef.current = key

        const fetchId = ++fetchIdRef.current

        setLoading(true)
        setError(false)
        setPage(0)
        try {
            let result
            if (type === 'nulls') {
                result = await apiClient.getNullsPreview(
                    sessionId,
                    columns && columns.length > 0 ? columns : undefined
                )
            } else {
                result = await apiClient.getDuplicatesPreview(sessionId)
            }

            if (fetchId === fetchIdRef.current && result) {
                setData(result.data)
                setTotalRows(result.total_rows)
            }
        } catch (err) {
            if (fetchId === fetchIdRef.current) {
                console.error('SectionPreview error:', err)
                setError(true)
                setData([])
                setTotalRows(0)
            }
        } finally {
            if (fetchId === fetchIdRef.current) {
                setLoading(false)
            }
        }
    }, [sessionId, type, columnsKey, columns])

    useEffect(() => {
        doFetch()
    }, [doFetch])

    const totalPages = Math.ceil(data.length / PAGE_SIZE)
    const pagedData = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

    if (loading) {
        return (
            <div className="flex items-center gap-3 py-4 px-4 bg-base-200/50 rounded-lg">
                <span className="loading loading-spinner loading-sm"></span>
                <span className="text-sm text-base-content/70">Loading {type} preview...</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center gap-3 py-4 px-4 bg-warning/10 rounded-lg">
                <span className="material-symbols-rounded text-warning text-lg">warning</span>
                <span className="text-sm text-base-content/70">Failed to load preview</span>
            </div>
        )
    }

    if (totalRows === 0) {
        return (
            <div className="flex items-center gap-3 py-4 px-4 bg-success/10 rounded-lg">
                <span className="material-symbols-rounded text-success text-lg">check_circle</span>
                <span className="text-sm">
                    No {type === 'nulls' ? 'null values' : 'duplicate rows'} found
                </span>
            </div>
        )
    }

    const allColumns = data.length > 0 ? Object.keys(data[0]) : []

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <span className="material-symbols-rounded text-lg text-primary">
                        {type === 'nulls' ? 'report' : 'content_copy'}
                    </span>
                    {type === 'nulls' ? 'Rows with Null Values' : 'Duplicate Rows'}
                </h4>
                <span className="badge badge-sm badge-primary">{totalRows} rows</span>
            </div>

            <div className="overflow-x-auto border border-base-300 rounded-lg max-h-72">
                <table className="table table-xs table-pin-rows">
                    <thead>
                        <tr className="bg-base-200">
                            <th className="font-semibold text-xs bg-base-200">#</th>
                            {allColumns.map((col) => (
                                <th key={col} className="font-semibold text-xs bg-base-200">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {pagedData.map((row, idx) => (
                            <tr key={idx} className="hover">
                                <td className="text-xs text-base-content/50">{page * PAGE_SIZE + idx + 1}</td>
                                {allColumns.map((col) => {
                                    const isNull = row[col] === null || row[col] === undefined || row[col] === ''
                                    return (
                                        <td
                                            key={col}
                                            className={`text-xs ${isNull ? 'bg-error/10 text-error font-bold' : ''
                                                }`}
                                        >
                                            {isNull ? '⚠ NULL' : String(row[col])}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-xs text-base-content/50">
                        Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, data.length)} of {data.length} rows
                        {totalRows > data.length && ` (${totalRows} total in dataset)`}
                    </p>
                    <div className="join">
                        <button
                            className="join-item btn btn-xs"
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                        >
                            «
                        </button>
                        <button className="join-item btn btn-xs btn-disabled">
                            {page + 1} / {totalPages}
                        </button>
                        <button
                            className="join-item btn btn-xs"
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => p + 1)}
                        >
                            »
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SectionPreview
