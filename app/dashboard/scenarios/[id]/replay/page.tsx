import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, ShieldCheck, Zap } from 'lucide-react'

interface ReplayPageProps {
    params: {
        id: string
    }
}

export default async function ScenarioReplayPage({ params }: ReplayPageProps) {
    const supabase = createAdminClient()

    // Fetch Latest Optimization Result for this scenario
    const { data: result, error: resultError } = await supabase
        .from('optimization_results')
        .select('*')
        .eq('scenario_id', params.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (resultError || !result) {
        return notFound()
    }

    // Fetch Decision Trace (LLM Explanation)
    const { data: trace } = await supabase
        .from('decision_traces')
        .select('*')
        .eq('optimization_result_id', result.id)
        .single()

    const { constraintsApplied, path, modeBreakdown } = result.result_data

    return (
        <div className="relative min-h-screen grid-pattern p-8">
            <div className="max-w-6xl mx-auto">
                <header className="mb-12 flex justify-between items-center">
                    <Link
                        href="/dashboard"
                        className="group flex items-center gap-2 text-white/40 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Back to Control Center</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Replay Mode</span>
                            <span className="text-xs font-mono text-red-500 font-bold">{new Date(result.created_at).toLocaleString()}</span>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-red-600" />
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Panel: Inputs */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="glass-card p-6 border-white/5">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-2 w-2 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Input Vector</h3>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block mb-2">Fuel Shocks</label>
                                    <div className="space-y-2">
                                        {Object.entries(constraintsApplied?.fuelPriceMultipliers || {}).map(([mode, multiplier]: [any, any]) => (
                                            <div key={mode} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/10">
                                                <span className="capitalize text-white/60 text-xs font-bold">{mode}</span>
                                                <span className="text-red-500 font-mono font-bold">{multiplier}x</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-white/20 uppercase tracking-widest block mb-2">Network State</label>
                                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-xs text-white/60 italic font-medium">
                                        {constraintsApplied?.closedNodeIds?.length || 0} Nodes Terminated
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 border-white/5 bg-red-600/5">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck className="w-4 h-4 text-red-500" />
                                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Immutable Log</span>
                            </div>
                            <p className="text-[11px] text-white/40 leading-relaxed italic">
                                This simulation is a permanent record of scenario execution. Parameters are locked and cannot be modified in replay mode.
                            </p>
                        </div>
                    </div>

                    {/* Right Panel: Data Summary */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="glass-card p-8">
                            <div className="flex justify-between items-start mb-10">
                                <div>
                                    <h2 className="text-sm font-black text-red-500 uppercase tracking-[0.2em] mb-1">Finalized Matrix</h2>
                                    <div className="text-6xl font-black text-white tracking-tighter tabular-nums">
                                        ${result.total_cost?.toLocaleString()}
                                    </div>
                                </div>
                                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                    <Zap className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12">
                                <div>
                                    <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Optimized Routing</h4>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10">
                                        {path?.map((node: string, i: number) => (
                                            <div key={i} className="flex items-center gap-4 group">
                                                <div className="relative flex items-center justify-center shrink-0">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                                                    {i < path.length - 1 && (
                                                        <div className="absolute top-1.5 w-[1px] h-6 bg-white/10" />
                                                    )}
                                                </div>
                                                <span className="text-xs font-mono text-white/40 group-hover:text-white/80 transition-colors uppercase tracking-tight">{node}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div>
                                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Explainability summary</h4>
                                        <p className="text-sm text-white/80 leading-relaxed italic border-l-2 border-red-600 pl-4 py-1">
                                            "{trace?.rationale || 'No explanation generated for this run.'}"
                                        </p>
                                    </div>
                                    {trace?.impact_metrics?.tradeoffs && (
                                        <div>
                                            <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">System Tradeoffs</h4>
                                            <div className="grid grid-cols-1 gap-2">
                                                {trace.impact_metrics.tradeoffs.map((t: string, i: number) => (
                                                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl text-[11px] text-white/60 font-bold uppercase tracking-tight">
                                                        <div className="h-1 w-1 rounded-full bg-red-600" />
                                                        {t}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
