import { useLocation } from 'react-router-dom'
import TechAppHeader from './TechAppHeader'
import NonTechAppHeader from './NonTechAppHeader'

/**
 * Smart AppHeader — auto-detects the current panel from the route prefix
 * and renders the appropriate navigation header.
 */

interface AppHeaderProps {
    onExport?: () => void
    rightSlot?: React.ReactNode
}

export default function AppHeader({ onExport, rightSlot }: AppHeaderProps) {
    const location = useLocation()

    if (location.pathname.startsWith('/non-tech')) {
        return <NonTechAppHeader onExport={onExport} rightSlot={rightSlot} />
    }

    // Default: Tech panel (covers /tech/* and any legacy routes)
    return <TechAppHeader onExport={onExport} rightSlot={rightSlot} />
}
