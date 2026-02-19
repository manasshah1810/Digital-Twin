'use client'
import LogisticsMap from '@/app/dashboard/LogisticsMap'

interface ResultsProps {
    result: any
    onToggleNode?: (id: string) => void
}

export default function ResultsPanel({ result, onToggleNode }: ResultsProps) {
    if (!result) return null;

    if (result.error) {
        return (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center border-red-500/20 bg-red-500/5">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                    <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Simulation Engine Fault</h3>
                <p className="text-white/40 max-w-md text-sm italic mb-8">"{result.error}"</p>

                {result.type === 'REACHABILITY_ERROR' && (
                    <div className="space-y-4 w-full max-w-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-left">
                                <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Source Status</div>
                                <div className={`text-[10px] font-bold ${result.diagnostics.sourceClosed || result.diagnostics.sourceDeadEnd ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {result.diagnostics.sourceClosed ? 'TERMINATED' : result.diagnostics.sourceDeadEnd ? 'DEAD END' : 'OPERATIONAL'}
                                </div>
                            </div>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-left">
                                <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Target Status</div>
                                <div className={`text-[10px] font-bold ${result.diagnostics.targetClosed || result.diagnostics.targetIsolated ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {result.diagnostics.targetClosed ? 'TERMINATED' : result.diagnostics.targetIsolated ? 'ISOLATED' : 'OPERATIONAL'}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-left space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Topology Health</span>
                                <span className="text-[9px] font-mono text-white/40">v0.1.2-DIAG</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                                <div>
                                    <div className="text-[8px] text-white/30 uppercase font-bold">Active Nodes</div>
                                    <div className="text-xl font-black text-white italic tracking-tighter">{result.diagnostics.constrainedGraphStats.nodesCount} <span className="text-[10px] font-normal text-white/20">/ {result.diagnostics.baseGraphStats.nodesCount}</span></div>
                                </div>
                                <div>
                                    <div className="text-[8px] text-white/30 uppercase font-bold">Active Edges</div>
                                    <div className="text-xl font-black text-white italic tracking-tighter">{result.diagnostics.constrainedGraphStats.edgesCount} <span className="text-[10px] font-normal text-white/20">/ {result.diagnostics.baseGraphStats.edgesCount}</span></div>
                                </div>
                            </div>
                            {result.diagnostics.constrainedGraphStats.edgesCount === 0 && (
                                <p className="text-[10px] text-amber-500 italic border-l-2 border-amber-500/50 pl-3 py-1">
                                    CRITICAL: No active edges found in current constraints. Verify transport modes are enabled.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        )
    }

    if (result.summary) {
        return (
            <div className="glass-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Batch Scale Test Summary</h3>
                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Aggregated</span>
                    </div>
                </div>

                <div className="p-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center bg-white/[0.01]">
                    <div className="space-y-1">
                        <div className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Total Aggregated Cost</div>
                        <div className="text-4xl font-black text-white italic tracking-tighter tabular-nums">${result.summary.totalCost.toLocaleString()}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Avg Cost Variance</div>
                        <div className={`text-4xl font-black italic tracking-tighter tabular-nums ${result.summary.averagePercentageDelta > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            {result.summary.averagePercentageDelta > 0 ? '+' : ''}{result.summary.averagePercentageDelta.toFixed(1)}%
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Routes Processed</div>
                        <div className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{result.summary.routesProcessed}</div>
                    </div>
                </div>

                <div className="p-8 border-t border-white/5">
                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4">Route Variance Distribution</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {result.individualResults.slice(0, 12).map((r: any, i: number) => (
                            <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 flex flex-col gap-2 hover:border-white/10 transition-all group">
                                <div className="text-[8px] font-black text-white/20 uppercase tracking-widest group-hover:text-white/40 transition-colors">Route Segment {i + 1}</div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-white/80">${r.cost.toLocaleString()}</span>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${r.delta > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                        {r.delta > 0 ? '+' : ''}{((r.delta / (r.baselineCost || 1)) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    {result.individualResults.length > 12 && (
                        <div className="mt-6 text-center">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Showing top 12 of {result.individualResults.length} routes</span>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const alternatives = result.alternatives || []
    const allCandidates = [result, ...alternatives]

    return (
        <div className="glass-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* System Alerts */}
            {result.systemAlerts?.length > 0 && (
                <div className="border-b border-white/5 bg-white/[0.01]">
                    {result.systemAlerts.map((alert: any, i: number) => (
                        <div key={i} className={`px-8 py-3 flex items-center gap-3 border-l-4 ${alert.severity === 'CRITICAL' ? 'border-red-600 bg-red-600/5' : 'border-blue-600 bg-blue-600/5'}`}>
                            <div className={`h-2 w-2 rounded-full ${alert.severity === 'CRITICAL' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                            <div className="flex flex-col">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${alert.severity === 'CRITICAL' ? 'text-red-500' : 'text-blue-500'}`}>{alert.type.replace('_', ' ')}</span>
                                <span className="text-[10px] text-white/60 font-medium">{alert.message}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Candidate Selector */}
            <div className="px-8 pt-8 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-white/5 pb-8 mb-2">
                {allCandidates.map((cand, idx) => (
                    <button
                        key={idx}
                        onClick={() => result.onSelectCandidate?.(idx)}
                        className={`p-4 rounded-2xl border transition-all text-left flex flex-col gap-2 group ${cand.rank === result.rank
                            ? 'bg-red-600/10 border-red-500/50 shadow-lg shadow-red-600/5'
                            : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                    >
                        <div className="flex justify-between items-center">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${cand.rank === result.rank ? 'text-red-500' : 'text-white/20'}`}>
                                Candidate #{cand.rank} {cand.rank === 1 ? '(Optimized)' : ''}
                            </span>
                            <div className="flex gap-1">
                                {Object.keys(cand.modeBreakdown || {}).map(m => (
                                    <div key={m} className={`w-1.5 h-1.5 rounded-full ${m === 'truck' ? 'bg-red-500' : m === 'rail' ? 'bg-blue-500' : 'bg-emerald-500'}`} title={m} />
                                ))}
                            </div>
                        </div>
                        <div className="text-2xl font-black text-white italic tracking-tighter tabular-nums">
                            ${cand.totalCost?.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-bold text-white/30 uppercase tracking-tight">
                            {cand.pathDetails?.length} Hops • {Object.keys(cand.modeBreakdown || {}).join(', ')}
                        </div>
                    </button>
                ))}
            </div>

            <div className="px-8 pb-8 pt-4">
                <LogisticsMap
                    baselinePath={result.baselinePath}
                    scenarioPath={result.pathDetails}
                    bottlenecks={result.bottlenecks}
                    onNodeClick={(id) => onToggleNode?.(id)}
                />
            </div>

            <div className="p-8 border-b border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
                <h3 className="text-sm font-black text-white/40 uppercase tracking-[0.2em]">Active Trajectory Details</h3>
                <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">Candidate #{result.rank} Active</span>
                </div>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <div className="text-[10px] text-red-500 uppercase font-black tracking-widest mb-1">Total Route Cost</div>
                    <div className="flex items-end gap-4">
                        <div className="text-5xl font-black text-white tracking-tighter tabular-nums">
                            ${result.totalCost?.toLocaleString() ?? '0.00'}
                        </div>
                        {result.deltas && (
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Impact Variance</span>
                                <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${result.deltas.absolute > 0 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                    {result.deltas.absolute > 0 ? '+' : ''}{result.deltas.percentage.toFixed(1)}% vs Baseline
                                </div>
                            </div>
                        )}
                    </div>

                    {result.baselineMetadata && (
                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.03] border border-white/10 rounded-lg">
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Baseline Locked</span>
                                <div className="h-1 w-1 rounded-full bg-blue-500" />
                            </div>
                            <span className="text-[9px] font-bold text-white/40 italic">
                                Primary Ref: {new Date(result.baselineMetadata.computedAt).toLocaleDateString()} {new Date(result.baselineMetadata.computedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    )}

                    {(result.constraints?.closedNodeIds?.length > 0 || result.constraints?.forbiddenModes?.length > 0) && (
                        <div className="mt-6 p-4 bg-red-600/5 border border-red-500/20 rounded-xl">
                            <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">User Constraint Penalty</h4>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {result.constraints.closedNodeIds.map((id: string) => (
                                    <span key={id} className="px-1.5 py-0.5 bg-red-500/10 rounded text-[8px] font-bold text-red-400 uppercase tracking-tighter border border-red-500/10">
                                        Terminal {id} Locked
                                    </span>
                                ))}
                                {result.constraints.forbiddenModes.map((m: string) => (
                                    <span key={m} className="px-1.5 py-0.5 bg-red-500/10 rounded text-[8px] font-bold text-red-400 uppercase tracking-tighter border border-red-500/10">
                                        No {m.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                            <p className="text-[10px] text-white/40 italic leading-tight">
                                Mandatory rerouting enforced. Optimization represents the least-cost trajectory honoring all active exclusions.
                            </p>
                        </div>
                    )}

                    <div className="mt-10">
                        <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4">Mode Breakdown</h4>
                        <div className="space-y-3">
                            {result.modeBreakdown && Object.entries(result.modeBreakdown).map(([mode, cost]: [any, any]) => (
                                <div key={mode} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-red-500/30 transition-colors">
                                    <span className="capitalize text-white/60 group-hover:text-white transition-colors">{mode}</span>
                                    <span className="font-bold text-white tabular-nums">${cost.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="md:border-l border-white/5 md:pl-12 space-y-10">
                    <div>
                        <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4">Simulation Path</h4>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/10">
                            {(result.pathDetails || result.path)?.map((node: any, i: number) => {
                                const isObject = typeof node === 'object';
                                const name = isObject ? node.name : node;
                                const type = isObject ? node.type : null;

                                return (
                                    <div key={i} className="flex items-center gap-4 group">
                                        <div className="relative flex items-center justify-center shrink-0">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                                            {i < (result.pathDetails || result.path).length - 1 && (
                                                <div className="absolute top-1.5 w-[1px] h-6 bg-white/10" />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white/80 group-hover:text-white transition-colors uppercase tracking-tight">
                                                {name}
                                            </span>
                                            {type && (
                                                <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest leading-none mt-0.5">
                                                    {type}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {result.explanation && (
                        <div className="space-y-6">
                            <div className="p-5 bg-red-600/5 rounded-xl border border-red-500/20 relative">
                                {result.explanation.isDegraded && (
                                    <div className="absolute -top-3 right-4 bg-amber-500 text-[8px] font-black text-black px-2 py-0.5 rounded uppercase tracking-widest shadow-lg">
                                        System Warning: High Latency
                                    </div>
                                )}
                                <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2">Engine Rationale</h4>
                                <p className="text-sm text-white/70 italic leading-relaxed">
                                    "{result.explanation.summary || result.explanation.technical}"
                                </p>
                            </div>

                            {result.explanation.tradeoffs && result.explanation.tradeoffs.length > 0 && (
                                <div>
                                    <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Strategic Tradeoffs</h4>
                                    <ul className="space-y-2 mb-10">
                                        {result.explanation.tradeoffs.map((tradeoff: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-xs text-white/60">
                                                <div className="mt-1.5 h-1 w-1 rounded-full bg-red-600 shrink-0" />
                                                {tradeoff}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {(result.recommendations || result.operationalImplications) && (
                                <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 mb-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Recommended Actions</h4>
                                        <span className="text-[8px] font-bold text-white/20 uppercase tracking-tighter italic">Advisory Control (Non-Binding)</span>
                                    </div>
                                    <ul className="space-y-3">
                                        {(result.recommendations || result.implications || []).map((action: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-[11px] text-white/70 leading-snug">
                                                <div className="mt-1.5 h-1 w-1 rounded-full bg-emerald-500 shrink-0" />
                                                {action}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.confidence && (
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/5">
                                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">System Assumptions</h4>
                                        <div className="space-y-2">
                                            {result.confidence.assumptions?.map((item: string, i: number) => (
                                                <div key={i} className="flex items-center gap-3 text-[10px] text-white/40 font-medium">
                                                    <div className="h-1 w-1 rounded-full bg-white/20" />
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="p-5 bg-red-600/[0.02] rounded-2xl border border-white/5">
                                        <h4 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-4">Model Boundaries</h4>
                                        <div className="space-y-2">
                                            {result.confidence.limitations?.map((item: string, i: number) => (
                                                <div key={i} className="flex items-center gap-3 text-[10px] text-white/40 font-medium">
                                                    <div className="h-1 w-1 rounded-full bg-red-500/20" />
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
