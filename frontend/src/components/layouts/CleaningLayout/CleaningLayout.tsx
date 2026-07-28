import AppHeader from '../../AppHeader'

export interface CleaningLayoutProps {
    children: React.ReactNode
    aiPanel?: React.ReactNode
    onExport?: () => void
}

export const CleaningLayout: React.FC<CleaningLayoutProps> = ({
    children,
    aiPanel,
    onExport,
}) => {
    return (
        <div className="relative flex h-screen w-full flex-col overflow-hidden">
            <AppHeader onExport={onExport} />

            {/* Main 2-Panel Layout */}
            <main className="flex flex-1 min-h-0 overflow-hidden">

                {/* Center: Main Content — scrollable */}
                <div className="flex-1 min-h-0 min-w-0 flex flex-col bg-background-light dark:bg-background-dark overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {/* Right: AI Assistant Panel */}
                {aiPanel && (
                    <aside className="w-80 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col p-6 overflow-y-auto custom-scrollbar">
                        {aiPanel}
                    </aside>
                )}
            </main>
        </div>
    )
}

export default CleaningLayout

