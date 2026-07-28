import { Routes, Route, Navigate } from 'react-router-dom'
import PanelSelector from './pages/PanelSelector.tsx'
import Home from './pages/Home.tsx'
import NonTechHome from './pages/NonTechHome.tsx'
import Clean from './pages/Clean.tsx'
import Train from './pages/Train.tsx'
import Results from './pages/Results.tsx'
import AutoPilot from './pages/AutoPilot.tsx'
import ReportStudio from './pages/ReportStudio.tsx'

export default function AppRoutes() {
  return (
    <Routes>
      {/* ═══ Panel Selector (Landing) ═══ */}
      <Route path="/" element={<PanelSelector />} />

      {/* ═══ Tech Panel — full ML pipeline ═══ */}
      <Route path="/tech" element={<Home />} />
      <Route path="/tech/clean" element={<Clean />} />
      <Route path="/tech/train" element={<Train />} />
      <Route path="/tech/results" element={<Results />} />
      <Route path="/tech/autopilot" element={<AutoPilot />} />
      <Route path="/tech/reports" element={<ReportStudio />} />

      {/* ═══ Non-Tech Panel — AutoPilot + Reports only ═══ */}
      <Route path="/non-tech" element={<NonTechHome />} />
      <Route path="/non-tech/autopilot" element={<AutoPilot />} />
      <Route path="/non-tech/reports" element={<ReportStudio />} />

      {/* ═══ Legacy route redirects ═══ */}
      <Route path="/clean" element={<Navigate to="/tech/clean" replace />} />
      <Route path="/train" element={<Navigate to="/tech/train" replace />} />
      <Route path="/results" element={<Navigate to="/tech/results" replace />} />
      <Route path="/autopilot" element={<Navigate to="/tech/autopilot" replace />} />
      <Route path="/reports" element={<Navigate to="/tech/reports" replace />} />
    </Routes>
  )
}
