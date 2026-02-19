'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, ChevronRight, Info, LucideIcon, Target, TrendingDown, TrendingUp, Zap } from 'lucide-react'

interface Scenario {
    id: string
    name: string
    is_baseline: boolean
}

interface OptimizationResult {
    id: string
    total_cost: number
    result_data: any
}

export default function ScenarioComparisonPage() {
    const [scenarios, setScenarios] = useState<Scenario[]>([])
    const [idA, setIdA] = useState<string>('')
    const [idB, setIdB] = useState<string>('')
    const [resultA, setResultA] = useState<OptimizationResult | null>(null)
    const [resultB, setResultB] = useState<OptimizationResult | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadScenarios() {
            try {
                const res = await fetch('/api/scenarios')
                const data = await res.json()
                setScenarios(data)
                if (data.length >= 2) {
                    setIdA(data[0].id)
                    setIdB(data[1].id)
                }
            } catch (err) {
                console.error('Failed to load scenarios', err)
            } finally {
                setLoading(false)
            }
        }
        loadScenarios()
    }, [])

    useEffect(() => {
        if (idA) fetchResult(idA, setResultA)
    }, [idA])

    useEffect(() => {
        if (idB) fetchResult(idB, setResultB)
    }, [idB])

    async function fetchResult(id: string, setter: (res: any) => void) {
        try {
            const res = await fetch(`/api/scenarios/${id}`)
            const data = await res.json()
            setter(data.latestResult || null)
        } catch (err) {
            console.error('Failed to fetch scenario result', err)
            setter(null)
        }
    }

    if (loading) return <div className="p-8 text-white/20 font-black uppercase tracking-widest animate-pulse">Initializing Comparison Matrix...</div>

    const costDiff = (resultB?.total_cost || 0) - (resultA?.total_cost || 0)
    const percentChange = resultA?.total_cost ? (costDiff / resultA.total_cost) * 100 : 0

    return (
        <div className="relative min-h-screen grid-pattern p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 flex justify-between items-center">
                    <Link href="/dashboard" className="group flex items-center gap-2 text-white/40 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest text-red-500">Back to Operations</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-red-600" />
                        <h1 className="text-xl font-black text-white uppercase tracking-tighter italic">Scenario.<span className="text-red-600">Cross-Analysis</span></h1>
                    </div>
                </header>

                {/* Selection Bar */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Primary Matrix (A)</label>
                        <select
                            value={idA}
                            onChange={(e) => setIdA(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold appearance-none outline-none focus:border-red-500/50 transition-colors"
                        >
                            {scenarios.map(s => <option key={s.id} value={s.id}>{s.name} {s.is_baseline ? '(Baseline)' : ''}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Comparison Matrix (B)</label>
                        <select
                            value={idB}
                            onChange={(e) => setIdB(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold appearance-none outline-none focus:border-red-500/50 transition-colors"
                        >
                            {scenarios.map(s => <option key={s.id} value={s.id}>{s.name} {s.is_baseline ? '(Baseline)' : ''}</option>)}
                        </select>
                    </div>
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Scenario A Card */}
                    <ComparisonCard title="Scenario A" scenario={scenarios.find(s => s.id === idA)} result={resultA} />

                    {/* Scenario B Card */}
                    <ComparisonCard title="Scenario B" scenario={scenarios.find(s => s.id === idB)} result={resultB} highlight />
                </div>

                {/* Economic Delta Overlay */}
                <div className="mt-12 glass-card p-8 border-red-500/20 bg-red-600/[0.02]">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div>
                            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">Net Variance Matrix</h3>
                            <div className="text-5xl font-black text-white tracking-tighter flex items-center gap-4">
                                ${Math.abs(costDiff).toLocaleString()}
                                {costDiff !== 0 && (
                                    <div className={`text-base font-black px-3 py-1 rounded-full flex items-center gap-1 ${costDiff > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                        {costDiff > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                        {Math.abs(percentChange).toFixed(1)}%
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <MetricMini icon={Zap} label="Mode Stability" value="84.2%" color="text-amber-500" />
                            <MetricMini icon={Target} label="Congestion Risk" value="Low" color="text-emerald-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function ComparisonCard({ title, scenario, result, highlight = false }: any) {
    if (!scenario) return null;

    return (
        <div className={`glass-card p-10 relative overflow-hidden transition-all duration-500 ${highlight ? 'border-red-500/30 bg-red-600/[0.02]' : 'border-white/5'}`}>
            <div className="flex justify-between items-start mb-12">
                <div>
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 block">{title}</span>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">{scenario?.name}</h2>
                </div>
                {scenario?.is_baseline && (
                    <span className="bg-white/10 text-white/40 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest">Ground Truth</span>
                )}
            </div>

            <div className="space-y-12">
                <section>
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-4">Cost Trajectory</label>
                    <div className="text-4xl font-black text-white tabular-nums tracking-tighter">
                        ${result?.total_cost?.toLocaleString() || '---'}
                    </div>
                </section>

                <section>
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-4">Primary Bottlenecks</label>
                    <div className="space-y-2">
                        {result?.result_data?.bottlenecks?.slice(0, 3).map((b: any, i: number) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-xs font-bold text-white/60">{b.entity}</span>
                                <span className="text-[9px] font-black text-red-500 uppercase">{b.severity}</span>
                            </div>
                        )) || <div className="text-xs text-white/20 italic">No critical stressors detected</div>}
                    </div>
                </section>

                <section>
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-4">Strategic Implications</label>
                    <div className="space-y-3">
                        {result?.result_data?.operationalImplications?.slice(0, 3).map((imp: string, i: number) => (
                            <div key={i} className="flex gap-3 text-[11px] text-white/50 leading-relaxed font-medium">
                                <div className="h-1 w-1 rounded-full bg-red-600 shrink-0 mt-1.5" />
                                {imp}
                            </div>
                        )) || <div className="text-xs text-white/20 italic">Awaiting AI synthesis...</div>}
                    </div>
                </section>
            </div>
        </div>
    )
}

function MetricMini({ icon: Icon, label, value, color }: { icon: LucideIcon, label: string, value: string, color: string }) {
    return (
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 min-w-[140px]">
            <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-3 h-3 ${color}`} />
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-lg font-black text-white tracking-tight">{value}</div>
        </div>
    )
}
