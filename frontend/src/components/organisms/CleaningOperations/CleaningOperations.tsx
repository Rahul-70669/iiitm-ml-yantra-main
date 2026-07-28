// CleaningOperations - Tabbed interface for data cleaning operations
import { useState } from 'react'
import NullsTab from './tabs/NullsTab'
import DuplicatesTab from './tabs/DuplicatesTab'
import ConvertTab from './tabs/ConvertTab'
import EncodeTab from './tabs/EncodeTab'
import FilterTab from './tabs/FilterTab'
import ColumnsTab from './tabs/ColumnsTab'

export interface CleaningOperationsProps {
    sessionId: string
    columns: string[]
    onOperationComplete: () => void
}

type TabType = 'nulls' | 'duplicates' | 'convert' | 'encode' | 'filter' | 'columns'

export const CleaningOperations: React.FC<CleaningOperationsProps> = ({
    sessionId,
    columns,
    onOperationComplete,
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('nulls')

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'nulls', label: 'Nulls', icon: 'water_drop' },
        { id: 'duplicates', label: 'Duplicates', icon: 'content_copy' },
        { id: 'convert', label: 'Convert', icon: 'transform' },
        { id: 'encode', label: 'Encode', icon: 'label' },
        { id: 'filter', label: 'Filter', icon: 'filter_alt' },
        { id: 'columns', label: 'Columns', icon: 'view_column' },
    ]

    const renderTabContent = () => {
        switch (activeTab) {
            case 'nulls':
                return <NullsTab sessionId={sessionId} columns={columns} onComplete={onOperationComplete} />
            case 'duplicates':
                return <DuplicatesTab sessionId={sessionId} columns={columns} onComplete={onOperationComplete} />
            case 'convert':
                return <ConvertTab sessionId={sessionId} columns={columns} onComplete={onOperationComplete} />
            case 'encode':
                return <EncodeTab sessionId={sessionId} columns={columns} onComplete={onOperationComplete} />
            case 'filter':
                return <FilterTab sessionId={sessionId} columns={columns} onComplete={onOperationComplete} />
            case 'columns':
                return <ColumnsTab sessionId={sessionId} columns={columns} onComplete={onOperationComplete} />
        }
    }

    return (
        <div className="card bg-base-100 shadow-lg">
            <div className="card-body p-0">
                {/* Tabs Header */}
                <div className="border-b border-base-300">
                    <div className="flex overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  flex items-center gap-2 px-6 py-4 font-medium transition-all
                  border-b-2 whitespace-nowrap
                  ${activeTab === tab.id
                                        ? 'border-primary text-primary bg-primary/5'
                                        : 'border-transparent text-base-content/70 hover:text-base-content hover:bg-base-200'
                                    }
                `}
                            >
                                <span className="material-symbols-rounded text-xl">{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">{renderTabContent()}</div>
            </div>
        </div>
    )
}

export default CleaningOperations
