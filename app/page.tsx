import { ArrowRight, Boxes, Cpu, Fuel, Globe, SignalHigh, TrendingUp } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-50">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />

            {/* Hero Section */}
            <section className="container mx-auto px-6 pt-32 pb-24 relative">
                <div className="max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600 mb-8 backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                        </span>
                        SYSTEM VERSION: v1.0.4-STABLE
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-10 leading-[0.9] text-slate-900">
                        LOGISTICS <br />
                        <span className="text-slate-800">RESILIENCE</span> <br />
                        <span className="text-blue-600">DIGITAL TWIN</span>
                    </h1>

                    <p className="text-xl text-slate-600 max-w-2xl mb-12 leading-relaxed">
                        Enterprise-grade deterministic recomputation engine for fuel-price sensitive logistics networks.
                        Analyze ripple effects and stress-test global supply chains in a high-fidelity
                        graph environment.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <a href="/dashboard" className="group flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-lg font-bold transition-all shadow-lg active:scale-95">
                            Launch Control Center
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </a>
                        <button className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 px-8 py-4 rounded-lg font-bold transition-all shadow-sm">
                            View Documentation
                        </button>
                    </div>
                </div>
            </section>

            {/* KPI Stats Grid */}
            <section className="container mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatCard
                        icon={<Boxes className="text-blue-600" />}
                        label="Network Nodes"
                        value="12,842"
                        delta="+14.2%"
                        type="positive"
                    />
                    <StatCard
                        icon={<Globe className="text-teal-600" />}
                        label="Active Routes"
                        value="42,091"
                        delta="Stable"
                        type="neutral"
                    />
                    <StatCard
                        icon={<Fuel className="text-amber-600" />}
                        label="Fuel Index"
                        value="1.42x"
                        delta="+0.04"
                        type="warning"
                    />
                    <StatCard
                        icon={<SignalHigh className="text-slate-600" />}
                        label="Compute Latency"
                        value="42ms"
                        delta="-12%"
                        type="positive"
                    />
                </div>
            </section>

            {/* Feature Section */}
            <section className="container mx-auto px-6 py-24">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
                    <div className="p-8 md:p-16 relative z-10 flex flex-col md:flex-row items-center gap-16">
                        <div className="md:w-1/2">
                            <div className="h-14 w-14 rounded-xl bg-blue-50 flex items-center justify-center mb-8 border border-blue-100">
                                <Cpu className="text-blue-600 w-7 h-7" />
                            </div>
                            <h2 className="text-4xl font-bold mb-6 text-slate-900">The Simulation Engine</h2>
                            <p className="text-slate-600 text-lg mb-10 leading-relaxed">
                                Our core algorithm evaluates millions of possible combinations to find the most resilient path.
                                When fuel prices spike or ports close, our shock detection algorithms identify new vulnerabilities instantly.
                            </p>

                            <ul className="space-y-4 mb-10">
                                {[
                                    "Deterministic Replay API",
                                    "Immutable Scenario Vault",
                                    "Real-time Fuel-Price Injection",
                                    "Predictive Maintenance Modeling"
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <button className="text-blue-600 font-bold hover:underline flex items-center gap-2">
                                Technical Specifications <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="md:w-1/2 w-full aspect-video bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center relative group overflow-hidden shadow-inner">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-10 filter grayscale" />
                            <TrendingUp className="w-16 h-16 text-slate-300 group-hover:text-blue-400 transition-colors" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="container mx-auto px-6 py-20 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500 text-sm">
                <div className="flex items-center gap-2 font-semibold">
                    <div className="h-4 w-4 rounded bg-slate-900" />
                    <span className="tracking-tight uppercase text-slate-900">Digital Twin</span>
                </div>
                <div>© 2026 Core Resilience Systems. Optimized for enterprise deployment.</div>
                <div className="flex gap-10">
                    <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
                    <a href="#" className="hover:text-slate-900 transition-colors">Terms</a>
                    <a href="#" className="hover:text-slate-900 transition-colors">Github</a>
                </div>
            </footer>
        </div>
    );
}

function StatCard({ icon, label, value, delta, type }: { icon: React.ReactNode, label: string, value: string, delta: string, type: 'positive' | 'warning' | 'neutral' }) {
    const typeStyles = {
        positive: 'bg-blue-50 text-blue-700 border-blue-100',
        warning: 'bg-amber-50 text-amber-700 border-amber-100',
        neutral: 'bg-slate-100 text-slate-700 border-slate-200'
    };

    return (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
                <div className="h-12 w-12 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                    {icon}
                </div>
                <div className={`text-xs font-bold px-3 py-1 rounded-full border ${typeStyles[type]}`}>
                    {delta}
                </div>
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
            <div className="text-3xl font-bold mt-2 text-slate-900 tabular-nums">{value}</div>
        </div>
    )
}

