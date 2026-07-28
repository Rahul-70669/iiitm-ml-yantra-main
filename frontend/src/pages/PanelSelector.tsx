import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const panels = [
    {
        id: 'tech',
        title: 'Tech Panel',
        subtitle: 'Full ML Pipeline',
        description: 'Complete control over data cleaning, feature engineering, model training, evaluation, AutoPilot, and report generation.',
        icon: 'terminal',
        gradient: 'linear-gradient(135deg, #1a1c1a 0%, #2d1a14 50%, #3d1a0a 100%)',
        accentColor: '#ab3505',
        glowColor: 'rgba(171, 53, 5, 0.35)',
        features: [
            { icon: 'cleaning_services', label: 'Data Cleaning' },
            { icon: 'analytics', label: 'Visualization' },
            { icon: 'model_training', label: 'Model Training' },
            { icon: 'leaderboard', label: 'Results & Compare' },
            { icon: 'rocket_launch', label: 'AutoPilot' },
            { icon: 'summarize', label: 'Report Studio' },
        ],
        route: '/tech',
        cta: 'Enter Tech Panel',
    },
    {
        id: 'non-tech',
        title: 'Non-Tech Panel',
        subtitle: 'One-Click Intelligence',
        description: 'Upload your dataset and let AI handle everything — automated analysis, model training, and beautiful reports without any technical knowledge.',
        icon: 'auto_awesome',
        gradient: 'linear-gradient(135deg, #1a1c1a 0%, #2d1a14 50%, #3d1a0a 100%)',
        accentColor: '#f06637',
        glowColor: 'rgba(240, 102, 55, 0.35)',
        features: [
            { icon: 'rocket_launch', label: 'AutoPilot Engine' },
            { icon: 'summarize', label: 'Report Studio' },
        ],
        route: '/non-tech',
        cta: 'Enter Non-Tech Panel',
    },
]

export default function PanelSelector() {
    const navigate = useNavigate()

    return (
        <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: '"Public Sans", sans-serif' }}>
            {/* Navbar */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 50,
                background: 'rgba(250,249,247,0.85)', backdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                padding: '14px 32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: '#ab3505', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 20 }}>database</span>
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>ML Yantra</span>
                </div>
            </nav>

            {/* Hero */}
            <motion.section
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{ textAlign: 'center', padding: '80px 24px 40px' }}
            >
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '6px 18px', background: 'rgba(171,53,5,0.08)', color: '#ab3505',
                    borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
                    marginBottom: 24,
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>hub</span>
                    Choose Your Experience
                </div>
                <h1 style={{
                    fontSize: 52, fontWeight: 800, color: '#0f172a',
                    letterSpacing: -1.5, lineHeight: 1.1, marginBottom: 16,
                }}>
                    How Would You Like to Work?
                </h1>
                <p style={{
                    fontSize: 18, color: '#64748b', maxWidth: 600, margin: '0 auto',
                    lineHeight: 1.7, fontWeight: 400,
                }}>
                    Select your workflow. Full technical control or intelligent automation — the power is yours.
                </p>
            </motion.section>

            {/* Panel Cards */}
            <section style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 32 }}>
                {panels.map((panel, idx) => (
                    <motion.div
                        key={panel.id}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 + idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
                        onClick={() => navigate(panel.route)}
                        style={{
                            cursor: 'pointer',
                            borderRadius: 28,
                            overflow: 'hidden',
                            background: panel.gradient,
                            position: 'relative',
                            transition: 'transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease',
                            boxShadow: `0 20px 60px -15px ${panel.glowColor}`,
                        }}
                        whileHover={{ y: -6, scale: 1.015 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {/* Glow orb */}
                        <div style={{
                            position: 'absolute', top: -60, right: -60, width: 240, height: 240,
                            background: panel.glowColor, borderRadius: '50%', filter: 'blur(80px)',
                            pointerEvents: 'none',
                        }} />
                        <div style={{
                            position: 'absolute', bottom: -40, left: -40, width: 180, height: 180,
                            background: panel.glowColor, borderRadius: '50%', filter: 'blur(60px)',
                            opacity: 0.4, pointerEvents: 'none',
                        }} />

                        {/* Grid overlay */}
                        <div style={{
                            position: 'absolute', inset: 0, opacity: 0.04,
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                            backgroundSize: '40px 40px',
                            pointerEvents: 'none',
                        }} />

                        <div style={{ position: 'relative', zIndex: 1, padding: '48px 40px 40px' }}>
                            {/* Icon + Badge */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                                <div style={{
                                    width: 60, height: 60, borderRadius: 16,
                                    background: `${panel.accentColor}30`,
                                    border: `1px solid ${panel.accentColor}40`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backdropFilter: 'blur(12px)',
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 30, color: panel.accentColor }}>{panel.icon}</span>
                                </div>
                                <div>
                                    <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: -0.5, marginBottom: 2 }}>{panel.title}</h2>
                                    <p style={{ fontSize: 13, color: panel.accentColor, fontWeight: 600, letterSpacing: 0.5 }}>{panel.subtitle}</p>
                                </div>
                            </div>

                            {/* Description */}
                            <p style={{
                                fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7,
                                marginBottom: 32, maxWidth: 420,
                            }}>
                                {panel.description}
                            </p>

                            {/* Feature pills */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 36 }}>
                                {panel.features.map(f => (
                                    <div key={f.label} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 6,
                                        padding: '7px 14px',
                                        background: 'rgba(255,255,255,0.07)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 10, fontSize: 12, fontWeight: 600,
                                        color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 15, color: panel.accentColor }}>{f.icon}</span>
                                        {f.label}
                                    </div>
                                ))}
                            </div>

                            {/* CTA Button */}
                            <button style={{
                                display: 'inline-flex', alignItems: 'center', gap: 10,
                                padding: '14px 28px', borderRadius: 14, border: 'none',
                                background: panel.accentColor, color: '#fff',
                                fontSize: 15, fontWeight: 700, cursor: 'pointer',
                                boxShadow: `0 12px 32px -8px ${panel.glowColor}`,
                                transition: 'all 0.3s ease',
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_forward</span>
                                {panel.cta}
                            </button>
                        </div>
                    </motion.div>
                ))}
            </section>

            {/* Footer strip */}
            <footer style={{
                textAlign: 'center', padding: '20px 24px 32px',
                fontSize: 11, color: '#94a3b8', fontWeight: 600,
                letterSpacing: 1, textTransform: 'uppercase',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                    ML Yantra — System Operational
                </div>
            </footer>
        </div>
    )
}
