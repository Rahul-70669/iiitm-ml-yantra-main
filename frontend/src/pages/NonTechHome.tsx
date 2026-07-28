import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'

/**
 * Non-Tech Home — simplified landing focused on AutoPilot & Reports.
 * Uses the same ML Yantra brand color (#ab3505) as the Tech Panel.
 */

export default function NonTechHome() {
    return (
        <div style={{ minHeight: '100vh', background: '#faf9f7', fontFamily: '"Public Sans", sans-serif' }}>
            <AppHeader />

            <main style={{ maxWidth: 1000, margin: '0 auto', padding: '48px 24px' }}>
                {/* Hero */}
                <section style={{ textAlign: 'center', marginBottom: 64 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '6px 18px', background: 'rgba(171,53,5,0.08)', color: '#ab3505',
                        borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
                        marginBottom: 24,
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>auto_awesome</span>
                        No-Code AI Platform
                    </div>
                    <h1 style={{
                        fontSize: 48, fontWeight: 800, color: '#0f172a',
                        letterSpacing: -1.5, lineHeight: 1.15, marginBottom: 16,
                    }}>
                        AI-Powered Analysis <br />
                        <span style={{ color: '#ab3505' }}>Without The Complexity</span>
                    </h1>
                    <p style={{
                        fontSize: 17, color: '#64748b', maxWidth: 560, margin: '0 auto', lineHeight: 1.7,
                    }}>
                        Upload your data, and let our intelligent engine handle everything — from cleaning to model training to beautiful reports.
                    </p>
                </section>

                {/* Two big action cards */}
                <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
                    {/* AutoPilot card */}
                    <Link to="/non-tech/autopilot" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{
                            borderRadius: 24, overflow: 'hidden',
                            background: 'linear-gradient(135deg, #1a1c1a 0%, #2d1a14 50%, #3d1a0a 100%)',
                            padding: '48px 36px', position: 'relative',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            boxShadow: '0 16px 48px -12px rgba(171,53,5,0.3)',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 24px 64px -12px rgba(171,53,5,0.4)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 16px 48px -12px rgba(171,53,5,0.3)' }}
                        >
                            {/* Glow */}
                            <div style={{
                                position: 'absolute', top: -40, right: -40, width: 200, height: 200,
                                background: 'rgba(171,53,5,0.2)', borderRadius: '50%', filter: 'blur(60px)',
                                pointerEvents: 'none',
                            }} />

                            <div style={{
                                width: 56, height: 56, borderRadius: 14,
                                background: 'rgba(171,53,5,0.25)', border: '1px solid rgba(171,53,5,0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 24, backdropFilter: 'blur(12px)',
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#f06637' }}>rocket_launch</span>
                            </div>

                            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: -0.5 }}>AutoPilot Engine</h2>
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 28, maxWidth: 340 }}>
                                One click. Full pipeline. Upload your dataset, select a target, and watch as ML Yantra cleans, analyzes, and trains models automatically.
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                                {['Auto-Clean', 'Smart EDA', 'Model Training', 'Colab Export'].map(f => (
                                    <span key={f} style={{
                                        display: 'inline-flex', alignItems: 'center', padding: '5px 12px',
                                        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
                                    }}>{f}</span>
                                ))}
                            </div>

                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                fontSize: 14, fontWeight: 700, color: '#f06637',
                            }}>
                                Get Started <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                            </div>
                        </div>
                    </Link>

                    {/* Report Studio card */}
                    <Link to="/non-tech/reports" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{
                            borderRadius: 24, overflow: 'hidden',
                            background: 'linear-gradient(135deg, #1a1c1a 0%, #2d1a14 50%, #3d1a0a 100%)',
                            padding: '48px 36px', position: 'relative',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            boxShadow: '0 16px 48px -12px rgba(171,53,5,0.25)',
                            cursor: 'pointer',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 24px 64px -12px rgba(171,53,5,0.35)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 16px 48px -12px rgba(171,53,5,0.25)' }}
                        >
                            {/* Glow */}
                            <div style={{
                                position: 'absolute', bottom: -30, left: -30, width: 180, height: 180,
                                background: 'rgba(171,53,5,0.15)', borderRadius: '50%', filter: 'blur(50px)',
                                pointerEvents: 'none',
                            }} />

                            <div style={{
                                width: 56, height: 56, borderRadius: 14,
                                background: 'rgba(171,53,5,0.25)', border: '1px solid rgba(171,53,5,0.35)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 24, backdropFilter: 'blur(12px)',
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#f06637' }}>summarize</span>
                            </div>

                            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: -0.5 }}>Report Studio</h2>
                            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 28, maxWidth: 340 }}>
                                Generate professional PDF, Markdown, or PowerPoint reports from your data. Choose from templates or describe what you need in plain English.
                            </p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
                                {['PDF Export', 'PPTX Slides', 'AI Insights', 'Custom Templates'].map(f => (
                                    <span key={f} style={{
                                        display: 'inline-flex', alignItems: 'center', padding: '5px 12px',
                                        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
                                    }}>{f}</span>
                                ))}
                            </div>

                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                fontSize: 14, fontWeight: 700, color: '#f06637',
                            }}>
                                Create Report <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                            </div>
                        </div>
                    </Link>
                </section>

                {/* How it works */}
                <section style={{ marginTop: 72, textAlign: 'center' }}>
                    <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 40, letterSpacing: -0.5 }}>How It Works</h2>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
                        {[
                            { step: '01', icon: 'cloud_upload', title: 'Upload Data', desc: 'Drop your CSV or Excel file' },
                            { step: '02', icon: 'smart_toy', title: 'AI Analyzes', desc: 'AutoPilot cleans & trains models' },
                            { step: '03', icon: 'download', title: 'Get Results', desc: 'Download reports & models' },
                        ].map(s => (
                            <div key={s.step} style={{ maxWidth: 200, textAlign: 'center' }}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
                                    background: 'rgba(171,53,5,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative',
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#ab3505' }}>{s.icon}</span>
                                    <div style={{
                                        position: 'absolute', top: -4, right: -4, width: 22, height: 22, borderRadius: '50%',
                                        background: '#ab3505', color: '#fff', fontSize: 10, fontWeight: 800,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>{s.step}</div>
                                </div>
                                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{s.title}</h3>
                                <p style={{ fontSize: 13, color: '#94a3b8' }}>{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    )
}
