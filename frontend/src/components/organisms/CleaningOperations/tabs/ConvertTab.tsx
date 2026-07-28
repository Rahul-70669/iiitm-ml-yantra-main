// ConvertTab - Data type conversion
import { useState, type ChangeEvent } from 'react'
import Button from '../../../atoms/Button'
import { Select } from '../../../atoms/Select'
import apiClient from '../../../../services/api'
import toast from 'react-hot-toast'

interface ConvertTabProps {
    sessionId: string
    columns: string[]
    onComplete: () => void
}

const ConvertTab: React.FC<ConvertTabProps> = ({ sessionId, columns, onComplete }) => {
    const [selectedColumn, setSelectedColumn] = useState('')
    const [targetType, setTargetType] = useState<'numeric' | 'string' | 'datetime'>('numeric')
    const [loading, setLoading] = useState(false)

    const handleApply = async () => {
        if (!selectedColumn) {
            toast.error('Please select a column')
            return
        }

        setLoading(true)
        try {
            const typeMap: Record<typeof targetType, 'int' | 'float' | 'str' | 'datetime'> = {
                numeric: 'float',
                string: 'str',
                datetime: 'datetime'
            }
            await apiClient.convertDataType(sessionId, selectedColumn, typeMap[targetType])
            toast.success(`Successfully converted ${selectedColumn} to ${targetType}`)
            onComplete()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to convert column type')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Convert Data Type</h3>
                <p className="text-base-content/70 text-sm">
                    Change the data type of a column
                </p>
            </div>

            {/* Column Selection */}
            <div>
                <label className="label">
                    <span className="label-text font-medium">Select Column</span>
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

            {/* Target Type */}
            <div>
                <label className="label">
                    <span className="label-text font-medium">Convert To</span>
                </label>
                <Select
                    value={targetType}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setTargetType(e.target.value as 'numeric' | 'string' | 'datetime')}
                    options={[
                        { value: 'numeric', label: 'Numeric (int/float)' },
                        { value: 'string', label: 'String (text)' },
                        { value: 'datetime', label: 'Datetime' },
                    ]}
                />
            </div>

            {/* Apply Button */}
            <div className="flex justify-end">
                <Button
                    variant="primary"
                    icon="check"
                    onClick={handleApply}
                    disabled={loading || !selectedColumn}
                >
                    {loading ? 'Converting...' : 'Convert Type'}
                </Button>
            </div>
        </div>
    )
}

export default ConvertTab
