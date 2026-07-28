import { Card } from '../../molecules/Card'
import Icon from '../../atoms/Icon'

export interface DatasetStatsProps {
    stats: {
        total_rows: number
        total_columns: number
        null_counts: Record<string, number>
        duplicate_rows: number
        column_types: Record<string, string>
        numeric_stats?: Record<
            string,
            {
                mean: number
                median: number
                std: number
                min: number
                max: number
            }
        >
    }
    className?: string
}

export const DatasetStats: React.FC<DatasetStatsProps> = ({
    stats,
    className = '',
}) => {
    const totalNulls = Object.values(stats.null_counts || {}).reduce((a, b) => a + b, 0)
    const columnsWithNulls = Object.entries(stats.null_counts || {}).filter(
        ([, count]) => count > 0
    )

    return (
        <Card title="Dataset Statistics" className={className}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Overview Stats */}
                <div className="stat bg-base-200 rounded-lg">
                    <div className="stat-figure text-primary">
                        <Icon name="table_chart" size="lg" />
                    </div>
                    <div className="stat-title">Total Rows</div>
                    <div className="stat-value text-primary">
                        {stats.total_rows.toLocaleString()}
                    </div>
                </div>

                <div className="stat bg-base-200 rounded-lg">
                    <div className="stat-figure text-secondary">
                        <Icon name="view_column" size="lg" />
                    </div>
                    <div className="stat-title">Total Columns</div>
                    <div className="stat-value text-secondary">{stats.total_columns}</div>
                </div>

                <div className="stat bg-base-200 rounded-lg">
                    <div className="stat-figure text-warning">
                        <Icon name="warning" size="lg" />
                    </div>
                    <div className="stat-title">Null Values</div>
                    <div className="stat-value text-warning">{totalNulls.toLocaleString()}</div>
                    <div className="stat-desc">
                        {columnsWithNulls.length} columns affected
                    </div>
                </div>

                <div className="stat bg-base-200 rounded-lg">
                    <div className="stat-figure text-error">
                        <Icon name="content_copy" size="lg" />
                    </div>
                    <div className="stat-title">Duplicate Rows</div>
                    <div className="stat-value text-error">
                        {stats.duplicate_rows.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Data Quality Alerts */}
            {(totalNulls > 0 || stats.duplicate_rows > 0) && (
                <div className="mt-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Icon name="priority_high" className="text-warning" />
                        Data Quality Issues
                    </h4>
                    <div className="space-y-2">
                        {totalNulls > 0 && (
                            <div className="alert alert-warning">
                                <Icon name="warning" />
                                <div>
                                    <strong>Missing values detected:</strong> {totalNulls} null values
                                    across {columnsWithNulls.length} columns
                                </div>
                            </div>
                        )}
                        {stats.duplicate_rows > 0 && (
                            <div className="alert alert-error">
                                <Icon name="content_copy" />
                                <div>
                                    <strong>Duplicate rows found:</strong> {stats.duplicate_rows}{' '}
                                    duplicate rows detected
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Column Types */}
            <div className="mt-6">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Icon name="category" className="text-accent" />
                    Column Data Types
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(stats.column_types || {}).map(([col, type]) => (
                        <div
                            key={col}
                            className="badge badge-outline badge-lg gap-2 justify-start"
                        >
                            <Icon
                                name={
                                    type.includes('int') || type.includes('float')
                                        ? '123'
                                        : type.includes('datetime')
                                            ? 'calendar_today'
                                            : 'text_fields'
                                }
                                size="sm"
                            />
                            <span className="truncate">{col}</span>
                            <span className="text-base-content/50 text-xs">({type})</span>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    )
}

export default DatasetStats
