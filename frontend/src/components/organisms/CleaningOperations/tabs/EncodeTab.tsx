// EncodeTab - Categorical encoding
import { useState, type ChangeEvent } from 'react'
import Button from '../../../atoms/Button'
import { Select } from '../../../atoms/Select'
import apiClient from '../../../../services/api'
import toast from 'react-hot-toast'

interface EncodeTabProps {
    sessionId: string
    columns: string[]
    onComplete: () => void
}

const EncodeTab: React.FC<EncodeTabProps> = ({ sessionId, columns, onComplete }) => {
    const [selectedColumns, setSelectedColumns] = useState<string[]>([])
    const [method, setMethod] = useState<'label' | 'onehot' | 'ordinal'>('label')
    const [loading, setLoading] = useState(false)

    const handleApply = async () => {
        if (selectedColumns.length === 0) {
            toast.error('Please select at least one column')
            return
        }

        setLoading(true)
        try {
            // Encode columns one at a time
            for (const column of selectedColumns) {
                await apiClient.encodeColumn(sessionId, column, method)
            }
            toast.success(`Successfully encoded ${selectedColumns.length} column(s) using ${method} encoding`)
            onComplete()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to encode columns')
        } finally {
            setLoading(false)
        }
    }

    const toggleColumn = (column: string) => {
        setSelectedColumns((prev) =>
            prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Encode Categorical Variables</h3>
                <p className="text-base-content/70 text-sm">
                    Convert categorical columns to numeric format
                </p>
            </div>

            {/* Column Selection */}
            <div>
                <label className="label">
                    <span className="label-text font-medium">Select Categorical Columns</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 border border-base-300 rounded-lg">
                    {columns.map((column) => (
                        <label key={column} className="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-2 rounded">
                            <input
                                type="checkbox"
                                checked={selectedColumns.includes(column)}
                                onChange={() => toggleColumn(column)}
                                className="checkbox checkbox-primary checkbox-sm"
                            />
                            <span className="text-sm">{column}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Encoding Method */}
            <div>
                <label className="label">
                    <span className="label-text font-medium">Encoding Method</span>
                </label>
                <Select
                    value={method}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setMethod(e.target.value as 'label' | 'onehot' | 'ordinal')}
                    options={[
                        { value: 'label', label: 'Label Encoding (0, 1, 2, ...)' },
                        { value: 'onehot', label: 'One-Hot Encoding (creates new columns)' },
                        { value: 'ordinal', label: 'Ordinal Encoding (preserves order)' },
                    ]}
                />
                <p className="text-sm text-base-content/60 mt-2">
                    {method === 'label' && '→ Each unique value gets a numeric label'}
                    {method === 'onehot' && '→ Each unique value becomes a new binary column'}
                    {method === 'ordinal' && '→ Values are ordered numerically'}
                </p>
            </div>

            {/* Apply Button */}
            <div className="flex justify-end">
                <Button
                    variant="primary"
                    icon="check"
                    onClick={handleApply}
                    disabled={loading || selectedColumns.length === 0}
                >
                    {loading ? 'Encoding...' : 'Apply Encoding'}
                </Button>
            </div>
        </div>
    )
}

export default EncodeTab
