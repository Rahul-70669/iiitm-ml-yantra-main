import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import apiClient from '../services/api'
import AppHeader from '../components/AppHeader'

interface ChatMessage {
    id: string;
    role: 'user' | 'agent';
    content: string;
    blueprint?: any;
    isGenerating?: boolean;
}

interface ReportSection {
    id: string; type: string; title: string;
    text?: string; chart?: string; charts?: any[]; metrics?: any[]; columns_table?: any[];
    insights?: string[]; ai_insights?: string; items?: any[]; steps?: any[];
    table?: any[]; top_correlations?: any[]; models?: any[]; cards?: any[];
    score?: number; grade?: string; breakdown?: any[]; best_model?: string;
    subtitle?: string; meta?: string; problem_type?: string; stats_table?: any[];
}

export default function ReportStudio() {
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [filename, setFilename] = useState('')
    const [isUploading, setIsUploading] = useState(false)
    const [report, setReport] = useState<any>(null)
    
    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([{
        id: '1', role: 'agent', content: 'Hi there! I am your ML Yantra Report Agent. Tell me what kind of report you want to build, and I will create a tailored blueprint for you.'
    }])
    const [chatInput, setChatInput] = useState('')
    const [isListening, setIsListening] = useState(false)
    const recognitionRef = useRef<any>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        try {
            const saved = localStorage.getItem('ml_yantra_report_state')
            if (saved) {
                const state = JSON.parse(saved)
                if (state.sessionId) {
                    setSessionId(state.sessionId); setFilename(state.filename || 'Dataset')
                }
                if (state.report) {
                    setReport(state.report);
                }
            }
        } catch {}
    }, [])

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return
        setIsUploading(true)
        try {
            const res = await apiClient.uploadFile(file)
            setSessionId(res.session_id); setFilename(file.name)
            localStorage.setItem('ml_yantra_session_id', res.session_id)
            localStorage.setItem('ml_yantra_report_state', JSON.stringify({ sessionId: res.session_id, filename: file.name }))
            toast.success(`Uploaded ${file.name}`)
        } catch (err: any) { toast.error(err.message || 'Upload failed') }
        finally { setIsUploading(false) }
    }

    const useExisting = () => {
        const sid = localStorage.getItem('ml_yantra_session_id')
        if (sid) {
            setSessionId(sid); setFilename('Dataset from Clean Page')
            localStorage.setItem('ml_yantra_report_state', JSON.stringify({ sessionId: sid, filename: 'Dataset from Clean Page' }))
        } else toast.error('No existing session found')
    }

    const handleSend = async (text: string) => {
        if (!text.trim() || !sessionId) return
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text }
        setMessages(prev => [...prev, userMsg]); setChatInput('')

        const aiId = (Date.now() + 1).toString()
        setMessages(prev => [...prev, { id: aiId, role: 'agent', content: 'Analyzing request...', isGenerating: true }])

        try {
            const suggestions = await apiClient.suggestReport(sessionId, text)
            setMessages(prev => prev.map(m => m.id === aiId ? { 
                ...m, 
                content: suggestions.agent_reply || 'I have designed a custom report structure based on your request. Click below to generate it!', 
                isGenerating: false,
                blueprint: suggestions
            } : m))
        } catch (err: any) {
            setMessages(prev => prev.map(m => m.id === aiId ? { 
                ...m, 
                content: 'Failed to suggest layout: ' + (err.message || ''),
                isGenerating: false 
            } : m))
        }
    }

    const handleGenerate = async (blueprint: any) => {
        if (!sessionId) return
        const aiId = Date.now().toString()
        setMessages(prev => [...prev, { id: aiId, role: 'agent', content: 'Generating your document based on the approved blueprint...', isGenerating: true }])
        try {
            const res = await apiClient.generateCustomReport(sessionId, '', true, blueprint)
            setReport(res)
            try { localStorage.setItem('ml_yantra_report_state', JSON.stringify({ sessionId, filename, report: res })) } catch {}
            setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: 'Report generated successfully! Check the document preview on the right.', isGenerating: false } : m))
        } catch(err: any) {
            setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: 'Failed to generate report.', isGenerating: false } : m))
        }
    }

    const triggerDownload = (blob: Blob, name: string) => {
        const url = URL.createObjectURL(blob); const a = document.createElement('a')
        a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
    }

    const downloadAs = async (format: 'pdf' | 'md' | 'pptx') => {
        if (!report?.report_id) return
        try {
            const blob = await apiClient.downloadReport(report.report_id, format)
            const ext = format === 'md' ? 'md' : format
            triggerDownload(blob, `${filename.split('.')[0]}_report.${ext}`)
            toast.success(`${format.toUpperCase()} downloaded!`)
        } catch { toast.error('Download failed') }
    }

    return (
        <div style={{ minHeight: '100vh', background: '#faf9f7', display: 'flex', flexDirection: 'column' }}>
            <AppHeader />
            <main style={{ flex: 1, padding: '24px 32px', display: 'flex', gap: 24, maxWidth: 1600, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                
                {/* UP-FRONT UPLOAD VIEW */}
                {!sessionId && (
                    <div style={{ margin: 'auto', width: '100%', maxWidth: 600 }}>
                        <div style={{ textAlign: 'center', marginBottom: 40 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(171,53,5,0.08)', color: '#ab3505', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chat</span> Output Agent
                            </div>
                            <h1 style={{ fontSize: 42, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Talk to ReportBot</h1>
                            <p style={{ color: '#64748b', fontSize: 17 }}>Upload a dataset or use an existing session to start conversing with the AI to dynamically generate your analysis documents.</p>
                        </div>
                        <div onClick={() => fileRef.current?.click()} style={{
                            border: '2px dashed #cbd5e1', borderRadius: 24, padding: 60,
                            textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(171,53,5,0.4)'; e.currentTarget.style.background = 'rgba(171,53,5,0.03)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = 'transparent' }}>
                            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleUpload} style={{ display: 'none' }} />
                            {isUploading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                                    <div style={{ width: 48, height: 48, border: '4px solid rgba(171,53,5,0.2)', borderTopColor: '#ab3505', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                    <p style={{ color: '#475569', fontWeight: 600 }}>Uploading...</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ width: 64, height: 64, margin: '0 auto 20px', borderRadius: 16, background: 'rgba(171,53,5,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#ab3505' }}>cloud_upload</span>
                                    </div>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Drop your dataset here</h3>
                                    <p style={{ color: '#94a3b8' }}>CSV, XLSX · Max 200MB</p>
                                </>
                            )}
                        </div>
                        {localStorage.getItem('ml_yantra_session_id') && (
                            <div style={{ textAlign: 'center', marginTop: 24 }}>
                                <button onClick={useExisting} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
                                    border: '2px solid rgba(171,53,5,0.25)', color: '#ab3505', borderRadius: 12,
                                    fontWeight: 700, background: 'transparent', cursor: 'pointer', transition: 'all 0.3s',
                                }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>link</span>Use Existing Dataset</button>
                            </div>
                        )}
                    </div>
                )}

                {/* SPLIT PANE INTERFACE */}
                {sessionId && (
                    <AnimatePresence>
                        {/* ═══ LEFT PANE: Chat ═══ */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} 
                            style={{ flex: '0 0 35%', minWidth: 350, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 24, border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', overflow: 'hidden', height: 'calc(100vh - 120px)' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ab3505', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>smart_toy</span>
                                    </div>
                                    <div>
                                        <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: 15 }}>ML Report Agent</h3>
                                        <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Active · {filename}</p>
                                    </div>
                                </div>
                                <button onClick={() => { setSessionId(null); setReport(null); localStorage.removeItem('ml_yantra_report_state'); localStorage.removeItem('ml_yantra_session_id') }} 
                                    style={{ padding: 6, display: 'flex', borderRadius: 8, background: 'rgba(15,23,42,0.05)', color: '#64748b', border: 'none', cursor: 'pointer' }} title="Change Dataset">
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                                </button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                {messages.map(m => (
                                    <div key={m.id} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                                        <div style={{
                                            background: m.role === 'user' ? '#0f172a' : '#f8fafc',
                                            color: m.role === 'user' ? '#fff' : '#0f172a',
                                            padding: '12px 18px', borderRadius: 16,
                                            borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                                            borderBottomLeftRadius: m.role === 'agent' ? 4 : 16,
                                            border: m.role === 'agent' ? '1px solid #e2e8f0' : 'none',
                                            fontSize: 14, lineHeight: 1.6
                                        }}>
                                            {m.isGenerating && m.role === 'agent' ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 14, height: 14, border: '2px solid rgba(171,53,5,0.3)', borderTopColor: '#ab3505', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                                    <span style={{ color: '#64748b' }}>{m.content}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    {m.content}
                                                    {m.blueprint && (
                                                        <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                                                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#ab3505' }}>description</span>
                                                                <span style={{ fontWeight: 700, fontSize: 13 }}>{m.blueprint.title}</span>
                                                            </div>
                                                            <button onClick={() => handleGenerate(m.blueprint)} style={{
                                                                width: '100%', padding: '8px 12px', background: '#ab3505', color: '#fff', border: 'none', borderRadius: 8,
                                                                fontWeight: 600, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                                                            }}>
                                                                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>task_alt</span> Approve & Generate
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            <div style={{ padding: 16, borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
                                    <button onClick={() => {
                                        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
                                        if (!SR) return toast.error('Voice not supported')
                                        if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return }
                                        const rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = 'en-US'
                                        let final_ = chatInput
                                        rec.onresult = (ev: any) => {
                                            let interim = ''
                                            for (let i = ev.resultIndex; i < ev.results.length; i++) {
                                                if (ev.results[i].isFinal) final_ += (final_ ? ' ' : '') + ev.results[i][0].transcript
                                                else interim += ev.results[i][0].transcript
                                            }
                                            setChatInput(final_ + (interim ? ' ' + interim : ''))
                                        }
                                        rec.onend = () => setIsListening(false); recognitionRef.current = rec; rec.start(); setIsListening(true)
                                    }} style={{ 
                                        width: 44, height: 44, flexShrink: 0, borderRadius: 12, border: 'none', cursor: 'pointer',
                                        background: isListening ? '#ab3505' : '#fff', color: isListening ? '#fff' : '#64748b',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s'
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{isListening ? 'mic' : 'mic_none'}</span>
                                    </button>
                                    <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend(chatInput)}
                                        placeholder={isListening ? "Listening..." : "I want a feature importance report..."}
                                        style={{ 
                                            flex: 1, padding: '0 16px', borderRadius: 12, border: '1px solid #e2e8f0', outline: 'none', 
                                            fontSize: 14, background: '#fff', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' 
                                        }} />
                                    <button onClick={() => handleSend(chatInput)} disabled={!chatInput.trim()} style={{
                                        width: 44, height: 44, flexShrink: 0, borderRadius: 12, border: 'none', cursor: 'pointer',
                                        background: chatInput.trim() ? '#ab3505' : '#cbd5e1', color: '#fff',
                                        boxShadow: chatInput.trim() ? '0 4px 12px rgba(171,53,5,0.2)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s'
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18, marginLeft: 2 }}>send</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>

                        {/* ═══ RIGHT PANE: Live Document ═══ */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} 
                            style={{ flex: '1', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', position: 'relative' }}>
                            
                            {!report ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.5)', borderRadius: 24, border: '2px dashed #cbd5e1' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#cbd5e1', marginBottom: 16 }}>description</span>
                                    <h3 style={{ color: '#64748b', fontSize: 16, fontWeight: 600 }}>Your report will appear here</h3>
                                    <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Chat with the agent on the left to generate it.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Download bar */}
                                    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span className="material-symbols-outlined" style={{ color: '#10b981' }}>verified</span>
                                            </div>
                                            <div>
                                                <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>{report.title}</h3>
                                                <p style={{ fontSize: 12, color: '#94a3b8' }}>{report.template_name} · {report.sections?.length} sections</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {[
                                                { fmt: 'pdf' as const, label: 'PDF', icon: 'picture_as_pdf' },
                                                { fmt: 'md' as const, label: 'Markdown', icon: 'code' },
                                                { fmt: 'pptx' as const, label: 'PPTX', icon: 'slideshow' },
                                            ].map(d => (
                                                <button key={d.fmt} onClick={() => downloadAs(d.fmt)} style={{
                                                    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                                                    background: d.fmt === 'pdf' ? '#ab3505' : 'rgba(171,53,5,0.08)',
                                                    color: d.fmt === 'pdf' ? '#fff' : '#ab3505', borderRadius: 10,
                                                    fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', transition: 'all 0.3s'
                                                }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{d.icon}</span>{d.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Document Scroll View */}
                                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: 8, paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        {report.sections?.map((sec: ReportSection, idx: number) => (
                                            <SectionRenderer key={idx} section={sec} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                )}
            </main>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}

// ═══════════════ Section Renderer ═══════════════

function SectionRenderer({ section }: { section: ReportSection }) {
    const s = section
    const cardStyle: React.CSSProperties = { 
        background: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(16px)',
        borderRadius: 24, 
        border: '1px solid rgba(255,255,255,0.6)', 
        padding: 32, 
        boxShadow: '0 8px 32px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)',
        position: 'relative',
        overflow: 'hidden'
    }
    const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.3px' }

    if (s.type === 'cover') {
        return (
            <motion.div initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} transition={{duration: 0.5}} 
                style={{ ...cardStyle, background: 'linear-gradient(135deg, #111827 0%, #ab3505 100%)', textAlign: 'center', padding: '100px 40px', boxShadow: '0 20px 40px rgba(171,53,5,0.2)' }}>
                <motion.h1 initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.2}} style={{ fontSize: 44, letterSpacing: '-1px', fontWeight: 900, color: '#fff', marginBottom: 16, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{s.title}</motion.h1>
                {s.subtitle && <motion.p initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.3}} style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', marginBottom: 30, fontWeight: 500 }}>{s.subtitle}</motion.p>}
                {s.meta && <motion.p initial={{y: 20, opacity: 0}} animate={{y: 0, opacity: 1}} transition={{delay: 0.4}} style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700 }}>{s.meta}</motion.p>}
            </motion.div>
        )
    }

    return (
        <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true, margin: '-50px'}} transition={{duration: 0.4}}>
            {(s.type === 'stats_grid') && (
                <div style={cardStyle}>
                    <h3 style={titleStyle}><span className="material-symbols-outlined" style={{color: '#ab3505'}}>grid_view</span>{s.title}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, marginBottom: s.columns_table?.length ? 24 : 0 }}>
                        {s.metrics?.map((m, i) => (
                            <motion.div whileHover={{ y: -4 }} key={i} style={{ background: '#f8fafc', borderRadius: 16, padding: 20, textAlign: 'center', border: '1px solid #f1f5f9', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}>
                                <p style={{ fontSize: 26, fontWeight: 800, color: '#ab3505', letterSpacing: '-0.5px' }}>{m.value}</p>
                                <p style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{m.label}</p>
                            </motion.div>
                        ))}
                    </div>
                    {s.columns_table && s.columns_table.length > 0 && (
                        <div style={{ overflowX: 'auto', maxHeight: 350, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                                <thead style={{position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1}}><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                    {['Column', 'Type', 'Nulls', 'Unique'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>)}
                                </tr></thead>
                                <tbody>{s.columns_table.map((c, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '10px 16px', fontWeight: 600, color: '#0f172a' }}>{c.name}</td>
                                        <td style={{ padding: '10px 16px' }}><span style={{background: '#f1f5f9', padding: '4px 8px', borderRadius: 6, fontSize: 11, color: '#475569', fontWeight: 600}}>{c.dtype}</span></td>
                                        <td style={{ padding: '10px 16px' }}>
                                            {c.nulls > 0 ? <span style={{background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700}}>{c.nulls}</span> : <span style={{color: '#94a3b8'}}>-</span>}
                                        </td>
                                        <td style={{ padding: '10px 16px', color: '#64748b' }}>{c.unique}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {(s.type === 'quality_score') && (
                <div style={cardStyle}>
                    <h3 style={titleStyle}><span className="material-symbols-outlined" style={{color: '#ab3505'}}>high_quality</span>{s.title}</h3>
                    <div style={{ textAlign: 'center', padding: '30px 0' }}>
                        <motion.div initial={{scale: 0.8, opacity: 0}} whileInView={{scale: 1, opacity: 1}} transition={{type: 'spring'}}>
                            <p style={{ fontSize: 64, fontWeight: 900, color: '#ab3505', lineHeight: 1, letterSpacing: '-2px', textShadow: '0 4px 12px rgba(171,53,5,0.15)' }}>
                                {s.score}<span style={{ fontSize: 24, color: '#94a3b8', fontWeight: 700, letterSpacing: 0 }}>/100</span>
                            </p>
                            <div style={{ display: 'inline-block', marginTop: 12, padding: '6px 16px', background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', borderRadius: 20, fontWeight: 700, fontSize: 14, letterSpacing: 1, boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                                GRADE {s.grade}
                            </div>
                        </motion.div>
                    </div>
                    <div style={{ display: 'flex', gap: 24, justifyContent: 'center', marginTop: 16 }}>
                        {s.breakdown?.map((b, i) => (
                            <div key={i} style={{ textAlign: 'center', background: '#f8fafc', padding: '16px 24px', borderRadius: 16, minWidth: 120 }}>
                                <p style={{ fontWeight: 800, fontSize: 20, color: '#334155' }}>{b.value}%</p>
                                <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{b.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(s.type === 'analysis') && (
                <div style={cardStyle}>
                    <h3 style={titleStyle}><span className="material-symbols-outlined" style={{color: '#ab3505'}}>analytics</span>{s.title}</h3>
                    {s.text && <p style={{ color: '#475569', marginBottom: 20, lineHeight: 1.8, fontSize: 15 }}>{s.text}</p>}
                    {s.chart && <motion.img whileHover={{scale: 1.01}} src={`data:image/png;base64,${s.chart}`} alt={s.title} style={{ maxWidth: '100%', borderRadius: 12, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }} />}
                    {s.table && s.table.length > 0 && (
                        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                                <thead style={{background: '#f8fafc'}}><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                    {Object.keys(s.table[0]).map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>)}
                                </tr></thead>
                                <tbody>{s.table.map((row, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        {Object.values(row).map((v, j) => <td key={j} style={{ padding: '10px 16px', color: '#334155' }}>{String(v)}</td>)}
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {(s.type === 'charts_grid') && (
                <div style={cardStyle}>
                    <h3 style={titleStyle}><span className="material-symbols-outlined" style={{color: '#ab3505'}}>dashboard</span>{s.title}</h3>
                    {s.stats_table && s.stats_table.length > 0 && (
                        <div style={{ overflowX: 'auto', marginBottom: 24, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                                <thead style={{background: '#f8fafc'}}><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                    {Object.keys(s.stats_table[0]).map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>)}
                                </tr></thead>
                                <tbody>{s.stats_table.map((row, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        {Object.values(row).map((v, j) => <td key={j} style={{ padding: '10px 16px', textAlign: 'center', color: '#334155' }}>{String(v)}</td>)}
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                        {s.charts?.map((c, i) => c.chart && (
                            <motion.img whileHover={{scale: 1.02}} key={i} src={`data:image/png;base64,${c.chart}`} alt={c.title} style={{ width: '100%', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }} />
                        ))}
                    </div>
                </div>
            )}

            {(s.type === 'model_table') && (
                <div style={cardStyle}>
                    <h3 style={titleStyle}><span className="material-symbols-outlined" style={{color: '#ab3505'}}>military_tech</span>{s.title}</h3>
                    {s.chart && <motion.img whileHover={{scale: 1.01}} src={`data:image/png;base64,${s.chart}`} alt="Model Comparison" style={{ maxWidth: '100%', borderRadius: 12, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }} />}
                    
                    <div style={{ background: 'linear-gradient(135deg, rgba(171,53,5,0.05), rgba(171,53,5,0.01))', border: '1px solid rgba(171,53,5,0.2)', padding: '16px 24px', borderRadius: 12, marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                        <div style={{background: '#ab3505', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><span className="material-symbols-outlined" style={{color: '#fff', fontSize: 18}}>trophy</span></div>
                        <div>
                            <p style={{fontSize: 11, color: '#ab3505', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5}}>Best Performing Model</p>
                            <p style={{ fontWeight: 800, color: '#0f172a', fontSize: 16 }}>{s.best_model}</p>
                        </div>
                    </div>

                    {s.models && (
                        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                                <thead style={{background: '#f8fafc'}}><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Model</th>
                                    {s.models[0] && Object.keys(s.models[0].metrics || {}).slice(0, 5).map(k => <th key={k} style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</th>)}
                                </tr></thead>
                                <tbody>{s.models.map((m, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: m.is_best ? 'rgba(171,53,5,0.03)' : 'transparent', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = m.is_best ? 'rgba(171,53,5,0.06)' : '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = m.is_best ? 'rgba(171,53,5,0.03)' : 'transparent'}>
                                        <td style={{ padding: '12px 16px', fontWeight: m.is_best ? 800 : 600, color: m.is_best ? '#ab3505' : '#334155', display: 'flex', alignItems: 'center', gap: 8 }}>
                                            {m.is_best && <span className="material-symbols-outlined" style={{fontSize: 16}}>star</span>}
                                            {m.name}
                                        </td>
                                        {Object.values(m.metrics || {}).slice(0, 5).map((v, j) => <td key={j} style={{ padding: '12px 16px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 500, color: m.is_best ? '#ab3505' : '#64748b' }}>{v != null ? Number(v).toFixed(4) : '—'}</td>)}
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {(s.type === 'insights') && (
                <div style={cardStyle}>
                    <h3 style={titleStyle}><span className="material-symbols-outlined" style={{color: '#ab3505'}}>lightbulb</span>{s.title}</h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                        {s.insights?.map((ins, i) => (
                            <motion.div initial={{opacity: 0, x: -10}} whileInView={{opacity: 1, x: 0}} transition={{delay: i * 0.1}} key={i} style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: 12, borderLeft: '4px solid #ab3505', color: '#334155', lineHeight: 1.6, fontSize: 14 }}>
                                {ins}
                            </motion.div>
                        ))}
                    </div>
                    {s.ai_insights && (
                        <motion.div initial={{opacity: 0, y: 10}} whileInView={{opacity: 1, y: 0}} style={{ marginTop: 24, padding: 24, background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', borderRadius: 16, border: '1px solid #e2e8f0', position: 'relative' }}>
                            <div style={{position: 'absolute', top: -12, left: 24, background: '#1e293b', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 6, letterSpacing: 0.5}}>
                                <span className="material-symbols-outlined" style={{fontSize: 14, color: '#fcd34d'}}>smart_toy</span> AI INSIGHTS
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: '#334155', marginTop: 8 }}>{s.ai_insights}</div>
                        </motion.div>
                    )}
                </div>
            )}

            {(s.type === 'kpi_cards') && (
                <div style={cardStyle}>
                    <h3 style={titleStyle}><span className="material-symbols-outlined" style={{color: '#ab3505'}}>speed</span>{s.title}</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                        {s.cards?.map((c, i) => (
                            <motion.div whileHover={{y: -4, scale: 1.02}} key={i} style={{ background: 'linear-gradient(135deg, #fff 0%, #fef2f2 100%)', borderRadius: 16, padding: 24, textAlign: 'center', border: '1px solid rgba(171,53,5,0.15)', boxShadow: '0 4px 12px rgba(171,53,5,0.05)' }}>
                                <div style={{width: 48, height: 48, borderRadius: '50%', background: 'rgba(171,53,5,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'}}>
                                    <span className="material-symbols-outlined" style={{ color: '#ab3505', fontSize: 24 }}>{c.icon || 'bar_chart'}</span>
                                </div>
                                <p style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>{c.value}</p>
                                <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 4 }}>{c.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* list / ordered_list / log / text fallback */}
            {(!['cover', 'stats_grid', 'quality_score', 'analysis', 'charts_grid', 'model_table', 'insights', 'kpi_cards'].includes(s.type)) && (
                <div style={cardStyle}>
                    <h3 style={titleStyle}><span className="material-symbols-outlined" style={{color: '#ab3505'}}>format_list_bulleted</span>{s.title}</h3>
                    {s.text && <p style={{ color: '#475569', marginBottom: 16, lineHeight: 1.8, fontSize: 15, whiteSpace: 'pre-wrap' }}>{s.text}</p>}
                    
                    {s.items && s.items.length > 0 && (
                        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
                            {s.items.map((item, i) => (
                                <motion.div initial={{opacity: 0, x: -10}} whileInView={{opacity: 1, x: 0}} transition={{delay: i * 0.05}} key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <span style={{color: '#ab3505', fontWeight: 700, flexShrink: 0}}>{s.type === 'ordered_list' ? `${i+1}.` : '•'}</span>
                                    <span style={{ color: '#334155', lineHeight: 1.6, fontSize: 14 }}>{item}</span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                    
                    {s.steps && s.steps.length > 0 && (
                        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                            {s.steps.map((step, i) => (
                                <motion.div initial={{opacity: 0, scale: 0.98}} whileInView={{opacity: 1, scale: 1}} key={i} style={{ display: 'flex', gap: 12, padding: '10px 16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9', alignItems: 'center' }}>
                                    <span style={{ fontSize: 10, fontWeight: 800, color: '#ab3505', textTransform: 'uppercase', padding: '4px 8px', background: 'rgba(171,53,5,0.1)', borderRadius: 6, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{step.category}</span>
                                    <span style={{ color: '#334155', fontSize: 14, fontWeight: 500 }}>{step.step}</span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    )
}

