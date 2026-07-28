import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppRoutes from './routes.tsx'
import { BubbleCursor } from './components/atoms/BubbleCursor'

// ── Clear all stored sessions on every fresh page load / refresh ──
;(() => {
    const keysToRemove = Object.keys(localStorage).filter(k => k.startsWith('ml_yantra_'))
    keysToRemove.forEach(k => localStorage.removeItem(k))
})()

function App() {
    return (
        <div className="relative flex min-h-screen flex-col overflow-x-hidden">
            <BubbleCursor />
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#ffffff',
                        color: '#1e293b',
                        borderRadius: '0.75rem',
                        border: '1px solid rgba(216, 90, 116, 0.1)',
                        fontSize: '0.875rem',
                        fontFamily: '"Public Sans", sans-serif',
                    },
                }}
            />
        </div>
    )
}

export default App
