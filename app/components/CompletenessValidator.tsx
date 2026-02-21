'use client'

import React from 'react'
import { CheckCircle2, AlertCircle, XCircle, HelpCircle, HardDrive, ShieldCheck, Database } from 'lucide-react'
import { SYSTEM_REQUIREMENTS, Requirement } from '@/lib/validation/requirementsMapping'

export default function CompletenessValidator() {
    const total = SYSTEM_REQUIREMENTS.length
    const implemented = SYSTEM_REQUIREMENTS.filter(r => r.status === 'IMPLEMENTED').length
    const partial = SYSTEM_REQUIREMENTS.filter(r => r.status === 'PARTIAL').length
    const coverage = Math.round((implemented + (partial * 0.5)) / total * 100)

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-card p-6 border-emerald-500/20 bg-emerald-500/5">
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">System Coverage</div>
                    <div className="text-4xl font-black text-white italic tracking-tighter">{coverage}%</div>
                </div>
                <div className="glass-card p-6 border-surface-500/20">
                    <div className="text-[10px] font-black text-surface-500 uppercase tracking-widest mb-2">Total Req.</div>
                    <div className="text-4xl font-black text-white italic tracking-tighter">{total}</div>
                </div>
                <div className="glass-card p-6 border-amber-500/20">
                    <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Partial</div>
                    <div className="text-4xl font-black text-white italic tracking-tighter">{partial}</div>
                </div>
                <div className="glass-card p-6 border-purple-500/20">
                    <div className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-2">Verified</div>
                    <div className="text-4xl font-black text-white italic tracking-tighter">{implemented}</div>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold premium-gradient">Requirement Verification Matrix</h2>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-1">Cross-referencing SYSTEM_FOUNDATION.md vs Implementation State</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.01]">
                                <th className="p-4 text-[10px] font-black text-white/20 uppercase tracking-widest">ID</th>
                                <th className="p-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Requirement</th>
                                <th className="p-4 text-[10px] font-black text-white/20 uppercase tracking-widest">System Feature</th>
                                <th className="p-4 text-[10px] font-black text-white/20 uppercase tracking-widest">Source Trace</th>
                                <th className="p-4 text-[10px] font-black text-white/20 uppercase tracking-widest text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {SYSTEM_REQUIREMENTS.map((req) => (
                                <tr key={req.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="p-4 text-[10px] font-black text-white/20 group-hover:text-white/40 transition-colors uppercase tracking-widest">{req.id}</td>
                                    <td className="p-4">
                                        <div className="text-[11px] font-bold text-white mb-1">{req.description}</div>
                                        <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">{req.section}</div>
                                    </td>
                                    <td className="p-4 text-[11px] font-medium text-white/60 italic">{req.implementation_feature}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 group/trace cursor-help" title={req.technical_source}>
                                            <Database className="w-3 h-3 text-white/20 group-hover/trace:text-surface-500" />
                                            <span className="text-[9px] font-mono text-white/20 group-hover/trace:text-white/60 truncate max-w-[120px]">{req.technical_source}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {req.status === 'IMPLEMENTED' ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                <span className="text-[8px] font-black text-emerald-500/50 uppercase tracking-tighter">Verified</span>
                                            </div>
                                        ) : req.status === 'PARTIAL' ? (
                                            <div className="flex flex-col items-center gap-1">
                                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                                <span className="text-[8px] font-black text-amber-500/50 uppercase tracking-tighter">Partial</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-1">
                                                <XCircle className="w-4 h-4 text-red-500" />
                                                <span className="text-[8px] font-black text-red-500/50 uppercase tracking-tighter">Missing</span>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-8 space-y-4 border-emerald-500/10">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Operational Integrity</h3>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed italic">
                        The current implementation prioritizes **Deterministic Reproducibility**. Every path found by the Dijkstra engine is compared against an immutable baseline, ensuring that "tactical drift" is exactly measurable.
                    </p>
                </div>
                <div className="glass-card p-8 space-y-4 border-amber-500/10">
                    <div className="flex items-center gap-3 mb-2">
                        <HardDrive className="w-5 h-5 text-amber-500" />
                        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Gap Analysis</h3>
                    </div>
                    <p className="text-xs text-white/40 leading-relaxed italic">
                        Missing coverage primarily exists in **Network-Wide Constraints** (e.g. mass conservation across 10,000+ nodes) and **High-Resolution Precision Benchmarking**. These features are scheduled for the next tactical expansion.
                    </p>
                </div>
            </div>
        </div>
    )
}
