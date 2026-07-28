import { Link, useLocation, useNavigate } from 'react-router-dom'

/**
 * Non-Tech Panel Header — simplified navigation with only AutoPilot + Reports.
 * Uses the same ML Yantra brand color (#ab3505) as the Tech Panel.
 */

interface AppHeaderProps {
    onExport?: () => void
    rightSlot?: React.ReactNode
}

const nonTechNavItems = [
    { path: '/non-tech', label: 'Home', icon: 'home', exact: true },
    { path: '/non-tech/autopilot', label: 'AutoPilot', icon: 'rocket_launch' },
    { path: '/non-tech/reports', label: 'Reports', icon: 'summarize' },
]

export function NonTechAppHeader({ onExport, rightSlot }: AppHeaderProps) {
    const location = useLocation()
    const navigate = useNavigate()

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
            <div className="flex items-center justify-between px-6 py-2.5">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 shrink-0">
                    <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-lg">database</span>
                    </div>
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">ML Yantra</h2>
                </Link>

                {/* Badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '3px 12px', background: 'rgba(171,53,5,0.08)',
                    borderRadius: 8, fontSize: 10, fontWeight: 700, color: '#ab3505',
                    textTransform: 'uppercase', letterSpacing: 1,
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>auto_awesome</span>
                    Non-Tech Panel
                </div>

                {/* Center Navigation */}
                <nav className="hidden md:flex items-center gap-1 mx-8">
                    {nonTechNavItems.map((item) => {
                        const isActive = item.exact
                            ? location.pathname === item.path
                            : location.pathname.startsWith(item.path)
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-base">{item.icon}</span>
                                {item.label}
                            </button>
                        )
                    })}
                </nav>

                {/* Right side */}
                <div className="flex items-center gap-3 shrink-0">
                    {rightSlot}
                    {onExport && (
                        <button
                            onClick={onExport}
                            className="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
                        >
                            <span className="material-symbols-outlined text-sm">export_notes</span>
                            Export
                        </button>
                    )}
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center justify-center rounded-xl size-9 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 transition-colors"
                        title="Switch Panel"
                    >
                        <span className="material-symbols-outlined text-lg">swap_horiz</span>
                    </button>
                </div>
            </div>
        </header>
    )
}

export default NonTechAppHeader
