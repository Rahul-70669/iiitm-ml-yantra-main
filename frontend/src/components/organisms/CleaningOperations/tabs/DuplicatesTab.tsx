// DuplicatesTab - Detect and remove duplicates
import { useState, type ChangeEvent } from 'react'
import Button from '../../../atoms/Button'
import { Select } from '../../../atoms/Select'
import { SectionPreview } from '../../../molecules/SectionPreview'
import apiClient from '../../../../services/api'
import toast from 'react-hot-toast'

interface DuplicatesTabProps {
    sessionId: string
    columns: string[]
    onComplete: () => void
}

const DuplicatesTab: React.FC<DuplicatesTabProps> = ({ sessionId, columns: _columns, onComplete }) => {
    const [keep, setKeep] = useState<'first' | 'last' | 'none'>('first')
    const [loading, setLoading] = useState(false)

    const handleApply = async () => {
        setLoading(true)
        try {
            await apiClient.handleDuplicates(sessionId, keep)
            toast.success('Successfully removed duplicates')
            onComplete()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to remove duplicates')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Remove Duplicate Rows</h3>
                <p className="text-base-content/70 text-sm">
                    Find and remove duplicate rows from your dataset
                </p>
            </div>

            {/* Preview of Duplicate Rows */}
            <SectionPreview
                sessionId={sessionId}
                type="duplicates"
            />

            {/* Keep Strategy */}
            <div>
                <label className="label">
                    <span className="label-text font-medium">Keep Which Duplicate?</span>
                </label>
                <Select
                    value={keep}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setKeep(e.target.value as 'first' | 'last' | 'none')}
                    options={[
                        { value: 'first', label: 'Keep first occurrence' },
                        { value: 'last', label: 'Keep last occurrence' },
                        { value: 'none', label: 'Remove all duplicates' },
                    ]}
                />
            </div>

            {/* Apply Button */}
            <div className="flex justify-end">
                <Button variant="primary" icon="check" onClick={handleApply} disabled={loading}>
                    {loading ? 'Applying...' : 'Remove Duplicates'}
                </Button>
            </div>
        </div>
    )
}

export default DuplicatesTab
