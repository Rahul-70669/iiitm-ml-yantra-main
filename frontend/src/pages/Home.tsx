import { Link } from 'react-router-dom'

export default function Home() {
    return (
        <div className="bg-[#faf9f6] text-[#1a1c1a] font-body">
            {/* ════════════ Navigation ════════════ */}
            <nav className="sticky top-0 z-50 bg-[#f4f3f1]/80 backdrop-blur-md shadow-[0_24px_48px_-12px_rgba(171,53,5,0.08)]">
                <div className="flex justify-between items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
                    <div className="text-2xl font-bold tracking-tighter text-[#ab3505] flex items-center gap-2">
                        <span className="material-symbols-outlined text-3xl yantra-glow">auto_awesome</span>
                        ML Yantra
                    </div>
                    <div className="hidden md:flex items-center gap-10 font-headline font-bold tracking-tight text-sm uppercase">
                        <Link to="/tech" className="text-[#ab3505] border-b-2 border-[#ab3505] pb-1 hover:scale-[1.02] transition-transform">Home</Link>
                        <Link to="/tech/clean" className="text-zinc-600 hover:text-[#ab3505] transition-colors hover:scale-[1.02]">Clean</Link>
                        <Link to="/tech/train" className="text-zinc-600 hover:text-[#ab3505] transition-colors hover:scale-[1.02]">Train</Link>
                        <Link to="/tech/results" className="text-zinc-600 hover:text-[#ab3505] transition-colors hover:scale-[1.02]">Results</Link>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/tech/clean" className="ml-yantra-gradient text-white px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all">
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            <main>
                {/* ════════════ Hero Section ════════════ */}
                <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-48 overflow-hidden mesh-hero">
                    <div className="absolute inset-0 grid-overlay pointer-events-none"></div>

                    {/* Animated Background Yantra */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.06] pointer-events-none">
                        <div className="relative w-[800px] h-[800px]">
                            <div className="absolute inset-0 animate-spin-slow">
                                <span className="material-symbols-outlined text-[800px] text-[#ab3505]">settings_suggest</span>
                            </div>
                            <div className="absolute inset-0 animate-pulse-slow">
                                <span className="material-symbols-outlined text-[800px] text-[#fe85ad]">hub</span>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-screen-xl mx-auto relative z-10 text-center">
                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-white/50 backdrop-blur-md border border-[#ffdbd0]/30 text-[#ab3505] rounded-full text-[10px] font-bold uppercase tracking-[0.3em] mb-12">
                            <span className="material-symbols-outlined text-sm animate-pulse">bolt</span>
                            Auto-ML Engine v2.0 Live
                        </div>

                        <h1 className="font-headline text-7xl md:text-[9rem] font-bold tracking-tighter leading-[0.85] mb-12">
                            Machine Learning <br />
                            <span className="text-gradient italic relative inline-block">
                                Without Code
                                <span className="absolute -bottom-4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ab3505]/30 to-transparent"></span>
                            </span>
                        </h1>

                        <p className="max-w-3xl mx-auto text-[#59413a] text-xl md:text-2xl font-light leading-relaxed mb-16 tracking-tight">
                            Master the art of <span className="text-[#ab3505] font-medium">Digital Alchemy</span>. Prepare data and train sophisticated models through an editorial interface that teaches you the 'why' at every step.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                            <Link to="/tech/clean" className="ml-yantra-gradient text-white px-12 py-6 rounded-xl font-bold text-xl shadow-[0_32px_64px_-16px_rgba(171,53,5,0.3)] hover:shadow-[0_40px_80px_-20px_rgba(171,53,5,0.4)] hover:-translate-y-1 active:scale-95 transition-all">
                                Start Your First Build
                            </Link>
                        </div>
                    </div>

                    {/* Floating Data Viz Elements */}
                    <div className="absolute right-10 top-1/3 w-64 h-64 animate-float opacity-30 md:opacity-100 hidden lg:block">
                        <div className="glass-card rounded-2xl p-6 rotate-12 shadow-2xl">
                            <div className="h-32 w-full bg-[#ab3505]/10 rounded-lg flex items-end gap-1 p-2">
                                <div className="flex-1 bg-[#ab3505]/40 rounded-t h-1/2"></div>
                                <div className="flex-1 bg-[#ab3505]/60 rounded-t h-4/5"></div>
                                <div className="flex-1 bg-[#ab3505]/30 rounded-t h-2/3"></div>
                                <div className="flex-1 bg-[#ab3505]/80 rounded-t h-full"></div>
                            </div>
                            <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[#ab3505]">ROC Curve Precision</div>
                        </div>
                    </div>

                    <div className="absolute left-10 bottom-1/4 w-72 h-48 animate-float opacity-20 md:opacity-100 hidden lg:block" style={{ animationDelay: '-3s' }}>
                        <div className="glass-card rounded-2xl p-6 -rotate-6 shadow-2xl">
                            <div className="grid grid-cols-4 gap-2 h-full">
                                <div className="bg-[#ab3505]/20 rounded"></div>
                                <div className="bg-[#ab3505]/40 rounded"></div>
                                <div className="bg-[#ab3505]/10 rounded"></div>
                                <div className="bg-[#ab3505]/60 rounded"></div>
                                <div className="bg-[#ab3505]/30 rounded"></div>
                                <div className="bg-[#ab3505]/50 rounded"></div>
                                <div className="bg-[#ab3505]/10 rounded"></div>
                                <div className="bg-[#ab3505]/40 rounded"></div>
                            </div>
                            <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[#59413a]">Correlation Matrix</div>
                        </div>
                    </div>
                </section>

                {/* ════════════ Alchemical Vessels (Features) ════════════ */}
                <section className="py-40 px-8 bg-[#fdfcfb]">
                    <div className="max-w-screen-2xl mx-auto">
                        <div className="mb-32 flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="max-w-2xl">
                                <p className="font-headline font-bold text-[#ab3505] uppercase tracking-[0.4em] text-xs mb-6">The Laboratory</p>
                                <h2 className="font-headline text-6xl md:text-7xl font-bold tracking-tighter text-[#1a1c1a] leading-none">Precision Tools for Modern Alchemy</h2>
                            </div>
                            <p className="text-[#59413a] text-xl max-w-sm font-light">Transforming raw data into predictive gold through refined experimentation.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            {/* Vessel 1 — Data Distillation */}
                            <div className="alchemist-vessel rounded-[2.5rem] p-12 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ab3505]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#ab3505]/10 transition-colors"></div>
                                <div className="w-20 h-20 rounded-2xl bg-[#ffdbd0]/50 flex items-center justify-center mb-10 shadow-inner">
                                    <span className="material-symbols-outlined text-[#ab3505] text-4xl">cleaning_services</span>
                                </div>
                                <h3 className="font-headline text-3xl font-bold mb-6 tracking-tight">Data Distillation</h3>
                                <p className="text-[#59413a] text-lg leading-relaxed mb-10 font-light">Purify your datasets. Remove noise, handle anomalies, and structure variables with a visual editor designed for clarity.</p>
                                <div className="bg-[#efeeeb]/50 p-4 rounded-xl border border-[#e0bfb6]/20 mb-8">
                                    <div className="flex gap-2 mb-2">
                                        <div className="h-2 w-12 bg-[#ab3505]/40 rounded-full"></div>
                                        <div className="h-2 w-8 bg-[#dbdad7] rounded-full"></div>
                                    </div>
                                    <div className="h-2 w-full bg-[#dbdad7]/30 rounded-full"></div>
                                </div>
                                <Link to="/tech/clean" className="inline-flex items-center gap-2 text-[#ab3505] font-bold text-sm uppercase tracking-widest group-hover:gap-4 transition-all">
                                    Master the Distillation <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                            </div>

                            {/* Vessel 2 — The Transmutation */}
                            <div className="alchemist-vessel rounded-[2.5rem] p-12 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#9f3a60]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#9f3a60]/10 transition-colors"></div>
                                <div className="w-20 h-20 rounded-2xl bg-[#ffd9e2]/50 flex items-center justify-center mb-10 shadow-inner">
                                    <span className="material-symbols-outlined text-[#9f3a60] text-4xl">model_training</span>
                                </div>
                                <h3 className="font-headline text-3xl font-bold mb-6 tracking-tight">The Transmutation</h3>
                                <p className="text-[#59413a] text-lg leading-relaxed mb-10 font-light">Train neural networks and ensemble models without writing a line of Python. Our engine selects the optimal path for you.</p>
                                <div className="relative h-12 flex items-center gap-1 overflow-hidden mb-8">
                                    <div className="w-full h-full border-t-2 border-dashed border-[#9f3a60]/20 absolute top-1/2 -translate-y-1/2"></div>
                                    <div className="w-4 h-4 rounded-full bg-[#9f3a60] shadow-lg z-10 animate-float"></div>
                                </div>
                                <Link to="/tech/train" className="inline-flex items-center gap-2 text-[#9f3a60] font-bold text-sm uppercase tracking-widest group-hover:gap-4 transition-all">
                                    Begin Transmutation <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                            </div>

                            {/* Vessel 3 — The Reveal */}
                            <div className="alchemist-vessel rounded-[2.5rem] p-12 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#a73923]/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#a73923]/10 transition-colors"></div>
                                <div className="w-20 h-20 rounded-2xl bg-[#ffdad3]/50 flex items-center justify-center mb-10 shadow-inner">
                                    <span className="material-symbols-outlined text-[#a73923] text-4xl">analytics</span>
                                </div>
                                <h3 className="font-headline text-3xl font-bold mb-6 tracking-tight">The Reveal</h3>
                                <p className="text-[#59413a] text-lg leading-relaxed mb-10 font-light">Unmask model performance with high-fidelity metrics. Understand bias, precision, and recall through visual storytelling.</p>
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-full h-2 bg-[#efeeeb] rounded-full overflow-hidden">
                                        <div className="w-4/5 h-full bg-[#a73923]"></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#a73923]">80%</span>
                                </div>
                                <Link to="/tech/results" className="inline-flex items-center gap-2 text-[#a73923] font-bold text-sm uppercase tracking-widest group-hover:gap-4 transition-all">
                                    Explore Results <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ════════════ AutoPilot CTA Section ════════════ */}
                <section className="py-24 px-8 bg-[#faf9f6]">
                    <div className="max-w-screen-xl mx-auto">
                        <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-[#1a1c1a] via-[#2d1a14] to-[#1a1c1a] p-16 md:p-20 shadow-2xl">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-80 h-80 bg-[#ab3505]/20 blur-[120px] rounded-full -mr-20 -mt-20"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#9f3a60]/15 blur-[100px] rounded-full -ml-16 -mb-16"></div>
                            <div className="absolute inset-0 grid-overlay opacity-10 pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
                                <div className="flex-1">
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#ab3505]/20 backdrop-blur-md border border-[#ab3505]/30 text-[#f06637] rounded-full text-[10px] font-bold uppercase tracking-[0.3em] mb-8">
                                        <span className="material-symbols-outlined text-sm animate-pulse">rocket_launch</span>
                                        New Feature
                                    </div>
                                    <h3 className="font-headline text-4xl md:text-5xl font-bold text-white tracking-tight mb-6 leading-tight">
                                        AutoPilot Mode<br />
                                        <span className="text-[#f06637]">One Click. Full Pipeline.</span>
                                    </h3>
                                    <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mb-8">
                                        Upload once and get everything — intelligent data cleaning, comprehensive EDA, model training with smart hyperparameters, and a downloadable Colab notebook to learn from.
                                    </p>
                                    <div className="flex flex-wrap gap-4 text-sm text-zinc-300 mb-10">
                                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[#f06637] text-lg">cleaning_services</span>Auto-Clean</span>
                                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[#f06637] text-lg">analytics</span>Full EDA</span>
                                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[#f06637] text-lg">model_training</span>Smart Training</span>
                                        <span className="flex items-center gap-2"><span className="material-symbols-outlined text-[#f06637] text-lg">download</span>Colab Export</span>
                                    </div>
                                    <Link to="/tech/autopilot" className="inline-flex items-center gap-3 bg-[#ab3505] hover:bg-[#c7420a] text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-[0_20px_50px_-12px_rgba(171,53,5,0.4)] hover:shadow-[0_25px_60px_-15px_rgba(171,53,5,0.5)] hover:-translate-y-1 active:scale-95 transition-all">
                                        <span className="material-symbols-outlined text-2xl">rocket_launch</span>
                                        Try AutoPilot
                                    </Link>
                                </div>

                                {/* Visual card */}
                                <div className="w-full lg:w-[340px] shrink-0">
                                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-3">
                                        {[
                                            { icon: 'check_circle', text: 'Remove 23 duplicate rows', color: 'text-green-400' },
                                            { icon: 'check_circle', text: "Fill 'Age' with median (28.0)", color: 'text-green-400' },
                                            { icon: 'check_circle', text: "One-hot encode 'Gender'", color: 'text-green-400' },
                                            { icon: 'check_circle', text: 'Train Random Forest (200 trees)', color: 'text-green-400' },
                                            { icon: 'check_circle', text: 'Train XGBoost (lr=0.05)', color: 'text-green-400' },
                                            { icon: 'emoji_events', text: '🏆 Best: Random Forest — 94.2%', color: 'text-[#f06637]' },
                                        ].map((step, i) => (
                                            <div key={i} className="flex items-center gap-3 text-sm" style={{ opacity: 1 - i * 0.08 }}>
                                                <span className={`material-symbols-outlined text-lg ${step.color}`}>{step.icon}</span>
                                                <span className="text-white/80">{step.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ════════════ Report Studio CTA ════════════ */}
                <section className="py-28 px-8 bg-gradient-to-br from-[#faf9f6] to-[#f5ede8]">
                    <div className="max-w-screen-xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#ab3505]/10 text-[#ab3505] rounded-full text-xs font-bold uppercase tracking-widest mb-8">
                            <span className="material-symbols-outlined text-sm">summarize</span>
                            Report Studio
                        </div>
                        <h2 className="font-headline text-5xl font-bold tracking-tight mb-6">AI-Powered Reports in Seconds</h2>
                        <p className="text-[#59413a] text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
                            Generate professional PDF, Markdown, or PowerPoint reports from your data analysis. Choose from 6 templates or describe your own format — our AI handles the rest.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 mb-10 text-sm text-[#59413a]">
                            <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm"><span className="material-symbols-outlined text-[#ab3505] text-lg">picture_as_pdf</span>PDF Export</span>
                            <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm"><span className="material-symbols-outlined text-[#ab3505] text-lg">slideshow</span>PPTX Slides</span>
                            <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm"><span className="material-symbols-outlined text-[#ab3505] text-lg">school</span>PBL / Academic</span>
                            <span className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm"><span className="material-symbols-outlined text-[#ab3505] text-lg">dashboard</span>Power BI Style</span>
                        </div>
                        <Link to="/tech/reports" className="inline-flex items-center gap-3 bg-[#ab3505] hover:bg-[#c7420a] text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-[0_20px_50px_-12px_rgba(171,53,5,0.4)] hover:shadow-[0_25px_60px_-15px_rgba(171,53,5,0.5)] hover:-translate-y-1 active:scale-95 transition-all">
                            <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                            Create a Report
                        </Link>
                    </div>
                </section>

                {/* ════════════ Workflow Section ════════════ */}
                <section className="py-40 px-8 bg-[#faf9f6]">
                    <div className="max-w-screen-xl mx-auto">
                        <div className="text-center mb-32">
                            <h2 className="font-headline text-6xl font-bold tracking-tight mb-8">Simple Workflow. Complex Results.</h2>
                            <p className="text-[#59413a] text-xl max-w-2xl mx-auto font-light leading-relaxed">Our 3-step alchemical process ensures you understand every decision your model makes, removing the 'black box' mystery of AI.</p>
                        </div>

                        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-20">
                            {/* Connector line (desktop) */}
                            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#e0bfb6]/30 to-transparent -translate-y-20"></div>

                            {/* Step 1 */}
                            <div className="flex flex-col items-center text-center relative">
                                <div className="mb-12 w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center text-[#ab3505] relative z-10 border border-[#e0bfb6]/10">
                                    <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                                    <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#ffdbd0] text-[#ab3505] flex items-center justify-center font-headline font-bold">01</div>
                                </div>
                                <h4 className="font-headline text-2xl font-bold mb-4">Ingest Material</h4>
                                <p className="text-[#59413a] leading-relaxed font-light">Drag and drop your datasets. We detect structure, delimiters, and encodings automatically.</p>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center text-center relative">
                                <div className="mb-12 w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center text-[#9f3a60] relative z-10 border border-[#e0bfb6]/10">
                                    <span className="material-symbols-outlined text-4xl">magic_button</span>
                                    <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#ffd9e2] text-[#9f3a60] flex items-center justify-center font-headline font-bold">02</div>
                                </div>
                                <h4 className="font-headline text-2xl font-bold mb-4">Purify Data</h4>
                                <p className="text-[#59413a] leading-relaxed font-light">Address missing values and categorical features with a single click. See transformations in real-time.</p>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center text-center relative">
                                <div className="mb-12 w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center text-[#a73923] relative z-10 border border-[#e0bfb6]/10">
                                    <span className="material-symbols-outlined text-4xl">psychology</span>
                                    <div className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-[#ffdad3] text-[#a73923] flex items-center justify-center font-headline font-bold">03</div>
                                </div>
                                <h4 className="font-headline text-2xl font-bold mb-4">Forge the Model</h4>
                                <p className="text-[#59413a] leading-relaxed font-light">Train and compare multiple architectures. Deploy the highest performing model with confidence.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ════════════ Bottom CTA ════════════ */}
                <section className="py-24 px-8">
                    <div className="max-w-screen-2xl mx-auto">
                        <div className="ml-yantra-gradient rounded-[4rem] p-20 md:p-32 relative overflow-hidden flex flex-col items-center text-center shadow-[0_48px_96px_-24px_rgba(171,53,5,0.3)]">
                            <div className="absolute inset-0 grid-overlay opacity-20"></div>
                            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 blur-[100px] -ml-48 -mt-48 rounded-full"></div>
                            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#9f3a60]/20 blur-[100px] -mr-48 -mb-48 rounded-full"></div>

                            <div className="relative z-10">
                                <h2 className="font-headline text-6xl md:text-[6rem] font-bold text-white tracking-tighter mb-12 leading-[0.9]">
                                    Ready to Begin Your <br />Experiment?
                                </h2>
                                <p className="text-white/90 text-2xl max-w-2xl mx-auto mb-16 font-light">Join thousands of data alchemists who have moved past code to focus on pure insight.</p>
                                <Link to="/tech/clean" className="inline-block bg-white text-[#ab3505] px-16 py-8 rounded-2xl font-bold text-2xl shadow-2xl hover:scale-[1.05] hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] transition-all active:scale-95">
                                    Start Cleaning Data Free
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* ════════════ Footer ════════════ */}
            <footer className="rounded-t-[4rem] mt-32 bg-[#1a1c1a] text-white overflow-hidden relative">
                <div className="absolute inset-0 grid-overlay opacity-5 pointer-events-none"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-16 px-16 py-24 max-w-screen-2xl mx-auto relative z-10">
                    <div className="md:col-span-1">
                        <div className="text-3xl font-bold text-[#f06637] mb-8 tracking-tighter flex items-center gap-2">
                            <span className="material-symbols-outlined text-4xl">auto_awesome</span>
                            ML Yantra
                        </div>
                        <p className="text-zinc-500 mb-10 text-base leading-relaxed font-light">Democratizing Machine Learning through an editorial lens. Experience the art and science of data alchemy.</p>
                        <div className="flex gap-6">
                            <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-400 hover:text-white">
                                <span className="material-symbols-outlined text-xl">language</span>
                            </div>
                            <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-400 hover:text-white">
                                <span className="material-symbols-outlined text-xl">alternate_email</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <h5 className="font-headline font-bold text-white uppercase tracking-[0.3em] text-[10px]">Library</h5>
                        <ul className="space-y-5">
                            <li><a className="text-zinc-500 hover:text-[#f06637] transition-colors font-light text-base" href="#">Documentation</a></li>
                            <li><a className="text-zinc-500 hover:text-[#f06637] transition-colors font-light text-base" href="#">Practical Guides</a></li>
                            <li><a className="text-zinc-500 hover:text-[#f06637] transition-colors font-light text-base" href="#">Community Forum</a></li>
                            <li><a className="text-zinc-500 hover:text-[#f06637] transition-colors font-light text-base" href="#">Case Studies</a></li>
                        </ul>
                    </div>
                    <div className="space-y-8">
                        <h5 className="font-headline font-bold text-white uppercase tracking-[0.3em] text-[10px]">The Forge</h5>
                        <ul className="space-y-5">
                            <li><a className="text-zinc-500 hover:text-[#f06637] transition-colors font-light text-base" href="#">Advanced Features</a></li>
                            <li><a className="text-zinc-500 hover:text-[#f06637] transition-colors font-light text-base" href="#">Pricing Model</a></li>
                            <li><a className="text-zinc-500 hover:text-[#f06637] transition-colors font-light text-base" href="#">API Access</a></li>
                            <li><a className="text-zinc-500 hover:text-[#f06637] transition-colors font-light text-base" href="#">Security Protocols</a></li>
                        </ul>
                    </div>
                    <div className="space-y-8">
                        <h5 className="font-headline font-bold text-white uppercase tracking-[0.3em] text-[10px]">Protocols</h5>
                        <ul className="space-y-5">
                            <li><a className="text-zinc-500 hover:text-[#f06637] transition-colors font-light text-base" href="#">Privacy Policy</a></li>
                            <li><a className="text-zinc-500 hover:text-[#f06637] transition-colors font-light text-base" href="#">Terms of Use</a></li>
                            <li><a className="text-zinc-500 hover:text-[#f06637] transition-colors font-light text-base" href="#">Ethics Statement</a></li>
                        </ul>
                    </div>
                </div>
                <div className="px-16 py-12 border-t border-zinc-800/50 max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                    <p>© 2024 ML YANTRA. THE DIGITAL ALCHEMIST.</p>
                    <div className="flex gap-12">
                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> SYSTEM OPERATIONAL</span>
                        <span>V1.2.4-STABLE</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}
