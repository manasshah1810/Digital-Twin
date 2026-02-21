'use client'

import React, { useState } from 'react'
import LogisticsMap from '@/app/dashboard/LogisticsMap'
import {
    AlertTriangle, CheckCircle2, Info, Activity, ChevronRight, ChevronDown,
    TrendingUp, TrendingDown, ClipboardList, Target, DollarSign, ArrowRightLeft,
    ShieldAlert, Zap, Clock, Rocket, Layers, Sparkles, Bot
} from 'lucide-react'

interface ResultsProps {
    result: any
    closedNodeIds?: string[]
    onToggleNode?: (id: string) => void
    onSelectCandidate?: (idx: number) => void
}

const formatCurrency = (val: number, currency: 'USD' | 'INR') => {
    if (currency === 'INR') return `₹${(val * 84.3).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    return `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

const KPICard = ({ label, value, subValue, type, icon: Icon, onClick }: { label: string, value: string, subValue?: string, type?: 'positive' | 'negative' | 'neutral', icon: any, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between transition-all ${onClick ? 'cursor-pointer hover:border-blue-500 hover:shadow-md active:scale-95' : ''}`}
    >
        <div className="flex justify-between items-start mb-2">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</div>
            <div className={`p-1.5 rounded-lg ${type === 'positive' ? 'bg-emerald-50 text-emerald-600' :
                type === 'negative' ? 'bg-red-50 text-red-600' :
                    'bg-slate-50 text-slate-400'
                }`}>
                <Icon className="w-3.5 h-3.5" />
            </div>
        </div>
        <div>
            <div className="text-xl font-black text-slate-900 tabular-nums leading-none mb-1">{value}</div>
            {subValue && (
                <div className={`text-[9px] font-black flex items-center gap-1 ${type === 'positive' ? 'text-emerald-600' :
                    type === 'negative' ? 'text-red-600' :
                        'text-slate-400'
                    }`}>
                    {type === 'positive' ? <TrendingDown className="w-3 h-3" /> : type === 'negative' ? <TrendingUp className="w-3 h-3" /> : null}
                    {subValue}
                </div>
            )}
        </div>
    </div>
)

const ExpandableSection = ({ title, icon: Icon, children, defaultExpanded = false }: { title: string, icon: any, children: React.ReactNode, defaultExpanded?: boolean }) => {
    const [expanded, setExpanded] = useState(defaultExpanded)
    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex justify-between items-center px-4 py-3 hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{title}</span>
                </div>
                {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </button>
            {expanded && <div className="p-4 border-t border-slate-100">{children}</div>}
        </div>
    )
}

export default function ResultsPanel({ result, closedNodeIds = [], onToggleNode, onSelectCandidate }: ResultsProps) {
    const [currency, setCurrency] = useState<'USD' | 'INR'>('INR')
    const [showBreakdown, setShowBreakdown] = useState(false)

    if (!result) return null;

    if (result.error) {
        return (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-lg">
                <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mb-6 border border-red-100 animate-pulse">
                    <ShieldAlert className="w-7 h-7 text-red-600" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight uppercase">Route Error</h3>
                <p className="text-slate-500 max-w-md text-[10px] mb-8 leading-relaxed font-bold uppercase italic">"{result.error}"</p>
            </div>
        )
    }

    const baselineCost = result.baselineCost || (result.totalCost - (result.deltas?.absolute || 0))
    const netDelta = result.deltas?.absolute || 0
    const impactType = netDelta <= 0 ? 'positive' : 'negative'

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
            {/* Currency Matrix Control */}
            <div className="flex justify-end gap-2 mb-2">
                <div className="bg-slate-50 p-1 rounded-lg border border-slate-200 flex">
                    <button
                        onClick={() => setCurrency('INR')}
                        className={`px-3 py-1 rounded-md text-[9px] font-black tracking-widest uppercase transition-all ${currency === 'INR' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
                    >INR</button>
                    <button
                        onClick={() => setCurrency('USD')}
                        className={`px-3 py-1 rounded-md text-[9px] font-black tracking-widest uppercase transition-all ${currency === 'USD' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
                    >USD</button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <KPICard label="Before" value={formatCurrency(baselineCost, currency)} icon={ClipboardList} type="neutral" />
                <KPICard
                    label="After"
                    value={formatCurrency(result.totalCost, currency)}
                    icon={DollarSign}
                    type="neutral"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                />
                <KPICard label="Savings" value={`${netDelta >= 0 ? '+' : ''}${formatCurrency(Math.abs(netDelta), currency)}`} subValue={`${result.deltas?.percentage.toFixed(1)}%`} icon={ArrowRightLeft} type={impactType} />
            </div>

            {/* Cost Analysis Breakdown Panel */}
            {showBreakdown && result.costBreakdown && (
                <div className="bg-slate-900 text-white rounded-3xl p-6 border-b-4 border-blue-500 shadow-2xl animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-2 mb-6">
                        <Rocket className="w-4 h-4 text-blue-400" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Cost Details</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-6">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="text-[9px] font-bold text-white/40 uppercase">Fuel Cost</span>
                                <span className="text-[11px] font-black">{formatCurrency(result.costBreakdown.fuel, currency)}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="text-[9px] font-bold text-white/40 uppercase">Maintenance</span>
                                <span className="text-[11px] font-black">{formatCurrency(result.costBreakdown.maintenance, currency)}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                <span className="text-[9px] font-bold text-white/40 uppercase">Fees & Tolls</span>
                                <span className="text-[11px] font-black">{formatCurrency(result.costBreakdown.fees, currency)}</span>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                            <div className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-3">Route Info</div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="text-[7px] font-bold text-white/30 uppercase">Distance</div>
                                    <div className="text-[10px] font-black">{result.costBreakdown.distanceKm} KM</div>
                                </div>
                                <div>
                                    <div className="text-[7px] font-bold text-white/30 uppercase">Diesel/Fuel</div>
                                    <div className="text-[10px] font-black">{formatCurrency(result.costBreakdown.fuelPriceUsed, currency)} / L</div>
                                </div>
                                <div>
                                    <div className="text-[7px] font-bold text-white/30 uppercase">Mileage</div>
                                    <div className="text-[10px] font-black">{result.costBreakdown.efficiencyUsed} KM/L</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setShowBreakdown(false)} className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Close</button>
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <Rocket className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <div className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Carbon Emissions</div>
                            <div className="text-sm font-black text-slate-900 tracking-tight">{(result.totalCO2 || 0).toFixed(1)} mT</div>
                        </div>
                    </div>
                    <div className={`text-[8px] font-black uppercase tracking-tight px-2 py-1 rounded-md ${result.deltas?.co2Percentage <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {result.deltas?.co2Percentage >= 0 ? '+' : ''}{result.deltas?.co2Percentage?.toFixed(1)}%
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <div className="text-[8px] font-black text-slate-400 uppercase mb-0.5">Travel Time</div>
                            <div className="text-sm font-black text-slate-900 tracking-tight">{(result.totalTransitTime || 0).toFixed(1)}h</div>
                        </div>
                    </div>
                    <div className={`text-[8px] font-black uppercase tracking-tight px-2 py-1 rounded-md ${result.deltas?.timePercentage <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {result.deltas?.timePercentage >= 0 ? '+' : ''}{result.deltas?.timePercentage?.toFixed(1)}%
                    </div>
                </div>
            </div>

            {/* Mode Shift Metric */}
            {result.pathDetails && result.pathDetails.length > 0 && (() => {
                const scenarioModes = result.pathDetails.map((p: any) => (p.mode || 'truck').toLowerCase()).filter(Boolean)
                const baselineModes = result.baselinePathDetails?.map((p: any) => (p.mode || 'truck').toLowerCase()).filter(Boolean) || scenarioModes
                let shifted = 0
                const totalLegs = Math.max(scenarioModes.length, baselineModes.length, 1)
                for (let i = 0; i < totalLegs; i++) { if (scenarioModes[i] !== baselineModes[i]) shifted++ }
                const shiftPct = Math.round((shifted / totalLegs) * 100)
                const modeCounts: Record<string, number> = {}
                scenarioModes.forEach((m: string) => { modeCounts[m] = (modeCounts[m] || 0) + 1 })
                return (
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="h-7 w-7 bg-violet-50 rounded-lg flex items-center justify-center">
                                    <Layers className="w-3.5 h-3.5 text-violet-600" />
                                </div>
                                <div className="text-[8px] font-black text-slate-400 uppercase">Mode Shift</div>
                            </div>
                            <div className={`text-sm font-black ${shiftPct > 0 ? 'text-violet-600' : 'text-slate-400'}`}>{shiftPct}%</div>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                            {Object.entries(modeCounts).map(([mode, count]) => (
                                <span key={mode} className="bg-slate-100 text-slate-600 text-[7px] font-black uppercase px-2 py-0.5 rounded">{mode} x{count}</span>
                            ))}
                        </div>
                    </div>
                )
            })()}

            {result.alternatives?.length > 0 && (() => {
                const candidates = [result, ...result.alternatives].slice(0, 3).map((c) => ({
                    ...c,
                    hops: (c.pathDetails || c.path || []).length
                }));
                const minCost = Math.min(...candidates.map(c => c.totalCost || 0));

                return (
                    <div className="grid grid-cols-3 gap-3">
                        {candidates.map((cand, idx) => {
                            const isCheapest = cand.totalCost === minCost;
                            const isSelected = cand.rank === result.rank;
                            const isGenerative = cand.isGenerative;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => onSelectCandidate?.(idx)}
                                    className={`text-left p-3 rounded-xl border-2 transition-all relative ${isSelected ? 'bg-blue-50 border-blue-600 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="text-[8px] font-black uppercase text-slate-400">Route {cand.rank}</div>
                                        {isGenerative && (
                                            <div className="h-4 w-4 bg-amber-500 rounded flex items-center justify-center shrink-0">
                                                <Sparkles className="w-2.5 h-2.5 text-white animate-pulse" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm font-black text-slate-900">{formatCurrency(cand.totalCost, currency)}</div>
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                        {isCheapest && <span className="bg-emerald-100 text-emerald-700 text-[6px] font-black uppercase px-1 rounded">Cheapest</span>}
                                        {isGenerative ? (
                                            <span className="bg-amber-100 text-amber-700 text-[6px] font-black uppercase px-1 rounded">AI Route</span>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-600 text-[6px] font-black uppercase px-1 rounded">From Dataset</span>
                                        )}
                                        <span className="bg-slate-100 text-slate-600 text-[6px] font-black uppercase px-1 rounded">{cand.hops || cand.path?.length} Stops</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                );
            })()}

            {result.isGenerative && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-4 items-start animate-in slide-in-from-left duration-500">
                    <div className="h-10 w-10 bg-white rounded-xl shadow-sm border border-amber-200 flex items-center justify-center shrink-0">
                        <Bot className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <div className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">AI Suggested Route</div>
                        <p className="text-[11px] font-bold text-amber-900 leading-tight">
                            {result.generativeReason || "This route was generated by AI to find a better path than what exists in your dataset."}
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-[300px]">
                <LogisticsMap
                    key={`${result.sourceNodeId}-${result.targetNodeId}-${result.totalCost}`}
                    baselinePath={result.baselinePath}
                    scenarioPath={result.pathDetails}
                    bottlenecks={result.bottlenecks}
                    closedNodeIds={closedNodeIds}
                    onNodeClick={(id) => onToggleNode?.(id)}
                />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Summary</h3>
                </div>
                <p className="text-sm font-bold tracking-tight text-slate-800 leading-snug mb-4 italic">
                    "{result.explanation?.summary || 'Analysis complete.'}"
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        {result.modeBreakdown && Object.entries(result.modeBreakdown).map(([mode, cost]: [any, any]) => (
                            <div key={mode} className="flex justify-between items-center px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="text-[8px] font-black text-slate-500 uppercase">{mode}</span>
                                <span className="text-[10px] font-black text-slate-900">{formatCurrency(cost, currency)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-1">
                        {(result.recommendations || result.implications || []).slice(0, 3).map((action: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/30 rounded-lg border border-emerald-100/50">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                <span className="text-[9px] text-slate-700 font-bold truncate uppercase">{action}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <ExpandableSection title="Route Stops" icon={Activity}>
                    <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                        {(result.pathDetails || result.path)?.map((node: any, i: number) => (
                            <div key={i} className="flex items-start gap-2">
                                <div className="w-2 h-2 rounded-full border border-blue-600 bg-white mt-1 shrink-0" />
                                <div className="text-[9px] font-black text-slate-900 uppercase">{typeof node === 'object' ? node.name : node}</div>
                            </div>
                        ))}
                    </div>
                </ExpandableSection>

                <ExpandableSection title="Notes" icon={Info}>
                    <div className="space-y-2">
                        {result.explanation?.tradeoffs?.slice(0, 2).map((t: string, i: number) => (
                            <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex gap-2">
                                <TrendingDown className="w-3 h-3 text-blue-500 shrink-0" />
                                <p className="text-[8px] text-slate-600 font-bold uppercase">{t}</p>
                            </div>
                        ))}
                    </div>
                </ExpandableSection>
            </div>
        </div>
    )
}


