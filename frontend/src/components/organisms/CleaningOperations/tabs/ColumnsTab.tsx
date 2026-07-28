// ColumnsTab - Column management
import { useState } from 'react'
import Button from '../../../atoms/Button'
import apiClient from '../../../../services/api'
import toast from 'react-hot-toast'

interface ColumnsTabProps {
    sessionId: string
    columns: string[]
    onComplete: () => void
}

const ColumnsTab: React.FC<ColumnsTabProps> = ({ sessionId, columns, onComplete }) => {
    const [selectedColumns, setSelectedColumns] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    const handleDrop = async () => {
        if (selectedColumns.length === 0) {
            toast.error('Please select at least one column to drop')
            return
        }

        setLoading(true)
        try {
            await apiClient.manageColumns(sessionId, 'drop', selectedColumns)
            toast.success(`Successfully dropped ${selectedColumns.length} column(s)`)
            setSelectedColumns([])
            onComplete()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to drop columns')
        } finally {
            setLoading(false)
        }
    }

    const toggleColumn = (column: string) => {
        setSelectedColumns((prev) =>
            prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
        )
    }

    const selectAll = () => {
        setSelectedColumns(columns)
    }

    const clearSelection = () => {
        setSelectedColumns([])
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Manage Columns</h3>
                <p className="text-base-content/70 text-sm">
                    Drop unnecessary columns from your dataset
                </p>
            </div>

            {/* Selection Controls */}
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select All
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear Selection
                </Button>
            </div>

            {/* Column Selection */}
            <div>
                <label className="label">
                    <span className="label-text font-medium">
                        Select Columns to Drop ({selectedColumns.length} selected)
                    </span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-96 overflow-y-auto p-3 border border-base-300 rounded-lg">
                    {columns.map((column) => (
                        <label
                            key={column}
                            className={`
                flex items-center gap-2 cursor-pointer hover:bg-base-200 p-3 rounded
                ${selectedColumns.includes(column) ? 'bg-error/10 border border-error/30' : ''}
              `}
                        >
                            <input
                                type="checkbox"
                                checked={selectedColumns.includes(column)}
                                onChange={() => toggleColumn(column)}
                                className="checkbox checkbox-error checkbox-sm"
                            />
                            <span className="text-sm font-medium">{column}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Warning */}
            {selectedColumns.length > 0 && (
                <div className="alert alert-warning">
                    <span className="material-symbols-rounded">warning</span>
                    <div>
                        <p className="font-semibold">Warning: This action cannot be undone</p>
                        <p className="text-sm">
                            You are about to drop {selectedColumns.length} column(s) from your dataset
                        </p>
                    </div>
                </div>
            )}

            {/* Apply Button */}
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    icon="delete"
                    onClick={handleDrop}
                    disabled={loading || selectedColumns.length === 0}
                    className="border-error text-error hover:bg-error hover:text-white"
                >
                    {loading ? 'Dropping...' : `Drop ${selectedColumns.length} Column(s)`}
                </Button>
            </div>

        </div>
    )
}

export default ColumnsTab
