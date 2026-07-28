import { Link, useLocation } from 'react-router-dom'
import AppHeader from '../../AppHeader'

export interface MainLayoutProps {
    children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const location = useLocation()
    const prefix = location.pathname.startsWith('/non-tech') ? '/non-tech' : '/tech'
    return (
        <div className="min-h-screen flex flex-col">
            <AppHeader />

            {/* Main Content */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <footer className="border-t border-primary/10 bg-background-light py-12 dark:bg-background-dark">
                <div className="mx-auto max-w-7xl px-6 lg:px-10">
                    <div className="flex flex-col justify-between gap-10 md:flex-row">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
                                    <span className="material-symbols-outlined text-xl">database</span>
                                </div>
                                <h2 className="font-heading text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">ML Yantra</h2>
                            </div>
                            <p className="max-w-xs text-sm text-slate-500">Making machine learning accessible to everyone. Built for data scientists, analysts, and business owners.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
                            <div className="flex flex-col gap-4">
                                <h5 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Product</h5>
                                <Link to={`${prefix}/clean`} className="text-sm text-slate-500 hover:text-primary">Clean</Link>
                                <Link to={`${prefix}/train`} className="text-sm text-slate-500 hover:text-primary">Train</Link>
                                <Link to={`${prefix}/results`} className="text-sm text-slate-500 hover:text-primary">Results</Link>
                            </div>
                            <div className="flex flex-col gap-4">
                                <h5 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Company</h5>
                                <a className="text-sm text-slate-500 hover:text-primary" href="#">About</a>
                                <a className="text-sm text-slate-500 hover:text-primary" href="#">Blog</a>
                                <a className="text-sm text-slate-500 hover:text-primary" href="#">Contact</a>
                            </div>
                            <div className="flex flex-col gap-4">
                                <h5 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">Legal</h5>
                                <a className="text-sm text-slate-500 hover:text-primary" href="#">Privacy</a>
                                <a className="text-sm text-slate-500 hover:text-primary" href="#">Terms</a>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 border-t border-primary/10 pt-8 text-center text-sm text-slate-400">
                        © {new Date().getFullYear()} ML Yantra. All rights reserved. Built with passion for a smarter world.
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default MainLayout
