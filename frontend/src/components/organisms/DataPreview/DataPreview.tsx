import { useState, useCallback, useRef } from 'react'
import { Card } from '../../molecules/Card'
import Icon from '../../atoms/Icon'

export interface DataPreviewProps {
    data: Record<string, any>[]
    totalRows: number
    onRowCountChange?: (count: number) => void
    initialRowCount?: number
    minRows?: number
    maxRows?: number
    className?: string
}

export const DataPreview: React.FC<DataPreviewProps> = ({
    data,
    totalRows,
    onRowCountChange,
    initialRowCount = 5,
    minRows = 1,
    maxRows = 50,
    className = '',
}) => {
    const [rowCount, setRowCount] = useState(initialRowCount)
    const callbackRef = useRef(onRowCountChange)
    callbackRef.current = onRowCountChange

    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newCount = parseInt(e.target.value)
        setRowCount(newCount)
        callbackRef.current?.(newCount)
    }, [])

    if (!data || data.length === 0) {
        return (
            <Card className={className}>
                <div className="text-center py-12">
                    <Icon name="table_chart" size="xl" className="text-base-content/30 mb-4" />
                    <p className="text-base-content/70">No data to display</p>
                </div>
            </Card>
        )
    }

    const columns = Object.keys(data[0] || {})

    return (
        <Card className={className}>
            {/* Preview Controls */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <Icon name="visibility" className="text-primary" />
                        <h3 className="font-semibold text-lg">Data Preview</h3>
                    </div>
                    <div className="badge badge-primary badge-lg">
                        {data.length} / {totalRows} rows
                    </div>
                </div>

                {/* Row Count Slider */}
                <div className="form-control">
                    <label className="label">
                        <span className="label-text font-medium">
                            Rows to display: <span className="text-primary font-bold">{rowCount}</span>
                        </span>
                    </label>
                    <input
                        type="range"
                        min={minRows}
                        max={Math.min(maxRows, totalRows)}
                        value={rowCount}
                        onChange={handleSliderChange}
                        className="range range-primary range-sm"
                        step="1"
                    />
                    <div className="flex justify-between text-xs text-base-content/60 px-1 mt-1">
                        <span>{minRows}</span>
                        <span>{Math.min(maxRows, totalRows)}</span>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto rounded-lg border border-base-300">
                <table className="table table-zebra table-pin-rows table-pin-cols">
                    <thead className="bg-base-200">
                        <tr>
                            <th className="bg-base-200 text-base-content font-bold">#</th>
                            {columns.map((col) => (
                                <th key={col} className="bg-base-200 text-base-content font-bold">
                                    <div className="flex items-center gap-2">
                                        <Icon name="table_rows" size="sm" />
                                        {col}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.slice(0, rowCount).map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover">
                                <th className="bg-base-200 font-mono text-sm">{rowIndex + 1}</th>
                                {columns.map((col) => (
                                    <td key={col} className="font-mono text-sm">
                                        {row[col] === null || row[col] === undefined ? (
                                            <span className="text-error italic">null</span>
                                        ) : (
                                            String(row[col])
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary Footer */}
            <div className="mt-4 flex items-center justify-between text-sm text-base-content/70">
                <div className="flex items-center gap-2">
                    <Icon name="info" size="sm" />
                    <span>
                        {columns.length} columns • {totalRows.toLocaleString()} total rows
                    </span>
                </div>
                {rowCount < totalRows && (
                    <span className="text-warning flex items-center gap-1">
                        <Icon name="warning" size="sm" />
                        Showing partial data
                    </span>
                )}
            </div>
        </Card>
    )
}

export default DataPreview
