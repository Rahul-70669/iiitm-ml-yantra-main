// NullsTab - Handle missing values
import { useState, type ChangeEvent } from 'react'
import Button from '../../../atoms/Button'
import { Select } from '../../../atoms/Select'
import { Input } from '../../../atoms/Input'
import { SectionPreview } from '../../../molecules/SectionPreview'
import apiClient from '../../../../services/api'
import toast from 'react-hot-toast'

interface NullsTabProps {
    sessionId: string
    columns: string[]
    onComplete: () => void
}

const NullsTab: React.FC<NullsTabProps> = ({ sessionId, columns, onComplete }) => {
    const [selectedColumns, setSelectedColumns] = useState<string[]>([])
    const [strategy, setStrategy] = useState<'drop' | 'mean' | 'median' | 'mode' | 'custom'>('drop')
    const [fillValue, setFillValue] = useState('')
    const [loading, setLoading] = useState(false)

    const handleApply = async () => {
        if (selectedColumns.length === 0) {
            toast.error('Please select at least one column')
            return
        }

        setLoading(true)
        try {
            const strategyMap: Record<typeof strategy, 'drop' | 'fill_mean' | 'fill_median' | 'fill_mode' | 'fill_value'> = {
                drop: 'drop',
                mean: 'fill_mean',
                median: 'fill_median',
                mode: 'fill_mode',
                custom: 'fill_value'
            }

            await apiClient.handleNulls(
                sessionId,
                strategyMap[strategy],
                selectedColumns,
                strategy === 'custom' ? fillValue : undefined
            )
            toast.success(`Successfully handled nulls in ${selectedColumns.length} column(s)`)
            onComplete()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to handle nulls')
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
                <h3 className="text-lg font-semibold mb-2">Handle Missing Values</h3>
                <p className="text-base-content/70 text-sm">
                    Select columns and choose how to handle null values
                </p>
            </div>

            {/* Column Selection */}
            <div>
                <label className="label">
                    <span className="label-text font-medium">Select Columns</span>
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

            {/* Preview of Rows with Nulls */}
            <SectionPreview
                sessionId={sessionId}
                type="nulls"
                columns={selectedColumns.length > 0 ? selectedColumns : undefined}
            />

            {/* Strategy Selection */}
            <div>
                <label className="label">
                    <span className="label-text font-medium">Strategy</span>
                </label>
                <Select
                    value={strategy}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setStrategy(e.target.value as 'drop' | 'mean' | 'median' | 'mode' | 'custom')}
                    options={[
                        { value: 'drop', label: 'Drop rows with nulls' },
                        { value: 'mean', label: 'Fill with mean (numeric only)' },
                        { value: 'median', label: 'Fill with median (numeric only)' },
                        { value: 'mode', label: 'Fill with mode (most frequent)' },
                        { value: 'custom', label: 'Fill with custom value' },
                    ]}
                />
            </div>

            {/* Custom Fill Value */}
            {strategy === 'custom' && (
                <div>
                    <label className="label">
                        <span className="label-text font-medium">Fill Value</span>
                    </label>
                    <Input
                        type="text"
                        placeholder="Enter value to fill nulls"
                        value={fillValue}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFillValue(e.target.value)}
                    />
                </div>
            )}

            {/* Apply Button */}
            <div className="flex justify-end">
                <Button
                    variant="primary"
                    icon="check"
                    onClick={handleApply}
                    disabled={loading || selectedColumns.length === 0}
                >
                    {loading ? 'Applying...' : 'Apply Changes'}
                </Button>
            </div>
        </div>
    )
}

export default NullsTab
