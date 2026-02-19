import { ArrowRight, Boxes, Cpu, Fuel, Globe, SignalHigh, TrendingUp } from 'lucide-react';

export default function HomePage() {
    return (
        <div className="relative min-height-screen overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

            {/* Hero Section */}
            <section className="container mx-auto px-4 pt-24 pb-20 relative">
                <div className="max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-red-400 mb-6 backdrop-blur-sm animate-fade-in">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        SYSTEM ONLINE: v1.0.4-STABLE
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                        LOGISTICS <br />
                        <span className="premium-gradient">RESILIENCE</span> <br />
                        <span className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">DIGITAL TWIN</span>
                    </h1>

                    <p className="text-xl text-white/50 max-w-2xl mb-10 leading-relaxed">
                        Deterministic recomputation engine for fuel-price sensitive logistics networks.
                        Visualize ripple effects and stress-test global supply chains in a high-fidelity
                        graph environment.
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <a href="/dashboard" className="group flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-red-600/20">
                            Launch Control Center
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </a>
                        <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-xl font-bold transition-all">
                            View Documentation
                        </button>
                    </div>
                </div>
            </section>

            {/* KPI Stats Grid */}
            <section className="container mx-auto px-4 py-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        icon={<Boxes className="text-blue-400" />}
                        label="Network Nodes"
                        value="12,842"
                        delta="+14.2%"
                        isPositive={true}
                    />
                    <StatCard
                        icon={<Globe className="text-emerald-400" />}
                        label="Active Routes"
                        value="42,091"
                        delta="Stable"
                        isPositive={true}
                    />
                    <StatCard
                        icon={<Fuel className="text-amber-400" />}
                        label="Fuel Index"
                        value="1.42x"
                        delta="+0.04"
                        isPositive={false}
                    />
                    <StatCard
                        icon={<SignalHigh className="text-purple-400" />}
                        label="Compute Latency"
                        value="42ms"
                        delta="-12%"
                        isPositive={true}
                    />
                </div>
            </section>

            {/* Feature Section */}
            <section className="container mx-auto px-4 py-20">
                <div className="glass-card p-1 bg-gradient-to-br from-white/10 to-transparent">
                    <div className="bg-[#050505] rounded-[calc(var(--radius)-1px)] p-8 md:p-12 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 blur-[100px] -mr-48 -mt-48 rounded-full" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                            <div className="md:w-1/2">
                                <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                                    <Cpu className="text-red-500 w-6 h-6" />
                                </div>
                                <h2 className="text-4xl font-black mb-4">The Simulation Engine</h2>
                                <p className="text-white/60 text-lg mb-8">
                                    Our core algorithm evaluates millions of possible combinations to find the most resilient path.
                                    When fuel prices spike or ports close, our "Shock Engine" identifies new vulnerabilities instantly.
                                </p>

                                <ul className="space-y-4 mb-8">
                                    {[
                                        "Deterministic Replay API",
                                        "Immutable Scenario Vault",
                                        "Real-time Fuel-Price Injection",
                                        "Predictive Maintenance Modeling"
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-center gap-3 text-white/80">
                                            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button className="text-red-500 font-bold hover:underline flex items-center gap-2">
                                    Learn about Engine V1.2 <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="md:w-1/2 w-full aspect-video bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-center relative group overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-20 filter grayscale" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                                <TrendingUp className="w-16 h-16 text-white/20 group-hover:text-red-500/40 transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="container mx-auto px-4 py-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-white/40 text-sm">
                <div className="flex items-center gap-2 opacity-50">
                    <div className="h-4 w-4 rounded-full bg-red-500" />
                    <span className="font-bold tracking-tight uppercase">Digital Twin</span>
                </div>
                <div>© 2026 Core Resilience Systems. Optimized for Serverless Compute.</div>
                <div className="flex gap-8">
                    <a href="#" className="hover:text-white transition-colors">Privacy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms</a>
                    <a href="#" className="hover:text-white transition-colors">Github</a>
                </div>
            </footer>
        </div>
    );
}

function StatCard({ icon, label, value, delta, isPositive }: { icon: React.ReactNode, label: string, value: string, delta: string, isPositive: boolean }) {
    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
                    {icon}
                </div>
                <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {delta}
                </div>
            </div>
            <div className="text-sm font-medium text-white/40 uppercase tracking-widest">{label}</div>
            <div className="text-3xl font-black mt-1 text-white tabular-nums">{value}</div>
        </div>
    )
}
