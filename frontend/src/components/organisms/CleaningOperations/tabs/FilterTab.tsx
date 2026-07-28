// FilterTab - Row filtering
import { useState, type ChangeEvent } from 'react'
import Button from '../../../atoms/Button'
import { Select } from '../../../atoms/Select'
import { Input } from '../../../atoms/Input'
import apiClient from '../../../../services/api'
import toast from 'react-hot-toast'

interface FilterTabProps {
    sessionId: string
    columns: string[]
    onComplete: () => void
}

const FilterTab: React.FC<FilterTabProps> = ({ sessionId, columns, onComplete }) => {
    const [selectedColumn, setSelectedColumn] = useState('')
    const [operator, setOperator] = useState<'>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains'>('==')
    const [value, setValue] = useState('')
    const [loading, setLoading] = useState(false)

    const handleApply = async () => {
        if (!selectedColumn) {
            toast.error('Please select a column')
            return
        }
        if (!value) {
            toast.error('Please enter a filter value')
            return
        }

        setLoading(true)
        try {
            await apiClient.filterRows(sessionId, selectedColumn, operator, value)
            toast.success('Successfully filtered rows')
            onComplete()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to filter rows')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Filter Rows</h3>
                <p className="text-base-content/70 text-sm">
                    Keep only rows that match the specified condition
                </p>
            </div>

            {/* Column Selection */}
            <div>
                <label className="label">
                    <span className="label-text font-medium">Column to Filter By</span>
                </label>
                <Select
                    value={selectedColumn}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedColumn(e.target.value)}
                    options={[
                        { value: '', label: 'Choose a column...' },
                        ...columns.map((col) => ({ value: col, label: col })),
                    ]}
                />
            </div>

            {/* Operator */}
            <div>
                <label className="label">
                    <span className="label-text font-medium">Condition</span>
                </label>
                <Select
                    value={operator}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setOperator(e.target.value as '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains')}
                    options={[
                        { value: '==', label: 'Equals (==)' },
                        { value: '!=', label: 'Not equals (!=)' },
                        { value: '>', label: 'Greater than (>)' },
                        { value: '<', label: 'Less than (<)' },
                        { value: '>=', label: 'Greater or equal (>=)' },
                        { value: '<=', label: 'Less or equal (<=)' },
                        { value: 'contains', label: 'Contains (text)' },
                    ]}
                />
            </div>

            {/* Value */}
            <div>
                <label className="label">
                    <span className="label-text font-medium">Value</span>
                </label>
                <Input
                    type="text"
                    placeholder="Enter comparison value"
                    value={value}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
                />
            </div>

            {/* Preview */}
            {selectedColumn && value && (
                <div className="alert alert-info">
                    <span className="material-symbols-rounded">info</span>
                    <span className="text-sm">
                        Will keep rows where <strong>{selectedColumn}</strong> {operator} <strong>{value}</strong>
                    </span>
                </div>
            )}

            {/* Apply Button */}
            <div className="flex justify-end">
                <Button
                    variant="primary"
                    icon="check"
                    onClick={handleApply}
                    disabled={loading || !selectedColumn || !value}
                >
                    {loading ? 'Filtering...' : 'Apply Filter'}
                </Button>
            </div>
        </div>
    )
}

export default FilterTab
