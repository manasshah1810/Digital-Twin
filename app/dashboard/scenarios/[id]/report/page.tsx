'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, FileText, PieChart, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react'

interface ReportData {
    scenario: any
    result: any
}

export default function ExecutiveReportPage({ params }: { params: { id: string } }) {
    const [data, setData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            try {
                const res = await fetch(`/api/scenarios/${params.id}`)
                const scenario = await res.json()
                setData({
                    scenario,
                    result: scenario.latestResult
                })
            } catch (err) {
                console.error('Failed to load report data', err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [params.id])

    const downloadJson = () => {
        if (!data) return
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Executive_Summary_${data.scenario.name.replace(/\s+/g, '_')}.json`
        a.click()
    }

    if (loading) return <div className="p-8 text-white/20 font-black uppercase tracking-widest animate-pulse">Generating Executive Intelligence...</div>
    if (!data?.result) return (
        <div className="p-8 text-center glass-card border-red-500/20 m-8">
            <h2 className="text-xl font-black text-white italic uppercase mb-4">No Run Data Detected</h2>
            <p className="text-white/40 mb-8">This scenario has not been optimized. Please run a simulation first.</p>
            <Link href={`/dashboard/scenarios/${params.id}`} className="px-6 py-2 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-red-500 transition-all">Go to Operations</Link>
        </div>
    )

    const { scenario, result } = data
    const resData = result.result_data

    return (
        <div className="min-h-screen bg-[#050505] p-8 md:p-12 print:p-0 print:bg-white print:text-black">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <header className="flex justify-between items-start border-b border-white/5 pb-8 print:border-black/10">
                    <div>
                        <Link href="/dashboard" className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest mb-4 print:hidden">
                            <ArrowLeft className="w-3 h-3" /> Back to Terminal
                        </Link>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic print:text-black">
                            Executive.<span className="text-red-600">Summary</span>
                        </h1>
                        <p className="text-white/40 font-medium mt-1 print:text-black/60">Logistics Network Stress-Test Analysis</p>
                    </div>
                    <div className="flex gap-4 print:hidden">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all"
                        >
                            <FileText className="w-4 h-4" /> Print PDF
                        </button>
                        <button
                            onClick={downloadJson}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-red-600/20 transition-all"
                        >
                            <Download className="w-4 h-4" /> Export JSON
                        </button>
                    </div>
                </header>

                {/* Scenario Context */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h2 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6">Simulation Parameters</h2>
                    <div className="glass-card p-8 border-white/5 bg-white/[0.01] print:bg-white print:border-black/10">
                        <h3 className="text-2xl font-black text-white tracking-tight mb-2 print:text-black">{scenario.name}</h3>
                        <p className="text-white/50 text-sm leading-relaxed mb-8 print:text-black/70">{scenario.description || 'No description provided.'}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 print:bg-gray-50 print:border-black/5">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1">Status</span>
                                <span className="text-emerald-500 font-bold uppercase tracking-widest text-xs">Simulated & Verified</span>
                            </div>
                            <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 print:bg-gray-50 print:border-black/5">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1">Constraints Applied</span>
                                <span className="text-white/80 font-bold uppercase tracking-widest text-xs print:text-black">
                                    {Object.keys(resData.constraintsApplied?.fuelPriceMultipliers || {}).length} Factors
                                </span>
                            </div>
                            <div className="p-6 bg-white/[0.02] rounded-2xl border border-white/5 print:bg-gray-50 print:border-black/5">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1">Network Version</span>
                                <span className="text-white/80 font-bold uppercase tracking-widest text-xs print:text-black">v2.1 Stable</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Financial Impact */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <h2 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6">Financial Divergence</h2>
                    <div className="p-10 bg-red-600/[0.03] rounded-3xl border border-red-500/10 flex flex-col md:flex-row justify-between items-center gap-8 print:bg-gray-50 print:border-black/10 print:text-black">
                        <div>
                            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-2 print:text-black/40">Scenario Optimized Cost</span>
                            <div className="text-5xl font-black text-white tracking-tighter tabular-nums print:text-black">
                                ${result.total_cost.toLocaleString()}
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <span className="text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1 print:text-black/40">Net Variance</span>
                                <div className={`text-2xl font-black italic tabular-nums ${resData.deltas?.percentChange > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {resData.deltas?.percentChange > 0 ? '+' : ''}{resData.deltas?.percentChange?.toFixed(1)}%
                                </div>
                            </div>
                            <div className="h-10 w-[1px] bg-white/10 print:bg-black/10" />
                            <TrendingUp className={`w-8 h-8 ${resData.deltas?.percentChange > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
                        </div>
                    </div>
                </section>

                {/* Strategic Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                    <section>
                        <h2 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3" /> Operational Implications
                        </h2>
                        <ul className="space-y-4">
                            {resData.operationalImplications?.map((imp: string, i: number) => (
                                <li key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 text-xs text-white/60 leading-relaxed font-medium print:bg-gray-50 print:text-black print:border-black/5">
                                    {imp}
                                </li>
                            )) || <p className="text-white/20 italic text-xs">Awaiting synthesis...</p>}
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <PieChart className="w-3 h-3" /> Strategic Recommendations
                        </h2>
                        <ul className="space-y-4">
                            {resData.recommendedActions?.map((rec: string, i: number) => (
                                <li key={i} className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-xs text-white/60 leading-relaxed font-medium print:bg-gray-50 print:text-black print:border-black/5">
                                    {rec}
                                </li>
                            )) || <p className="text-white/20 italic text-xs">No strategic pivots identified.</p>}
                        </ul>
                    </section>
                </div>

                {/* Bottlenecks Warning */}
                {resData.bottlenecks?.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                        <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" /> Critical Network Stressors
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {resData.bottlenecks.map((b: any, i: number) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5 print:bg-gray-50 print:border-black/5">
                                    <span className="text-xs font-bold text-white/80 print:text-black">{b.entity}</span>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${b.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                        {b.severity}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Footer / Legal */}
                <footer className="pt-12 border-t border-white/5 flex justify-between items-center text-[8px] font-black text-white/20 uppercase tracking-[0.4em] print:text-black/40 print:border-black/10">
                    <span>Digital Twin Intelligence Report v2.1</span>
                    <span>Confidential Protocol</span>
                    <span>System Generated: {new Date().toLocaleDateString()}</span>
                </footer>
            </div>
        </div>
    )
}
