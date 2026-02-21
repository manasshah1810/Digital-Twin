'use client'

import React, { useState, useEffect } from 'react'
import { Search, Navigation, ArrowRight, Target, ShieldCheck, ChevronRight, RefreshCw } from 'lucide-react'

interface Node {
    id: string
    name: string
    type: string
}

interface WizardProps {
    nodes: Node[]
    onRun: (config: any) => void
    isOptimizing: boolean
}

export default function AutonomousWizard({ nodes, onRun, isOptimizing }: WizardProps) {
    const [step, setStep] = useState(1)
    const [sourceSearch, setSourceSearch] = useState('')
    const [targetSearch, setTargetSearch] = useState('')
    const [selectedSource, setSelectedSource] = useState<Node | null>(null)
    const [selectedTarget, setSelectedTarget] = useState<Node | null>(null)
    const [priority, setPriority] = useState<'cost' | 'co2' | 'speed'>('cost')

    const filteredSources = nodes
        .filter(n => n.name.toLowerCase().includes(sourceSearch.toLowerCase()))
        .slice(0, 5)

    const filteredTargets = nodes
        .filter(n => n.name.toLowerCase().includes(targetSearch.toLowerCase()))
        .slice(0, 5)

    const handleRun = () => {
        if (!selectedSource || !selectedTarget) return

        // AI Logic: Map natural language priority to system constraints
        const weightMode = priority === 'cost' ? 'balanced' : (priority === 'co2' ? 'co2' : 'time')

        const config = {
            sourceNodeId: selectedSource.id,
            targetNodeId: selectedTarget.id,
            fuelMultiplier: priority === 'cost' ? 1.0 : (priority === 'speed' ? 1.2 : 1.0),
            forbiddenModes: priority === 'co2' ? ['truck'] : [],
            weightMode,
            skipAI: true,
            mode: 'single'
        }
        onRun(config)
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-50 text-surface-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                    <Navigation className="w-3 h-3" />
                    Route Finder
                </div>
                <h2 className="text-4xl font-black text-surface-900 tracking-tighter uppercase mb-4">
                    Where is your <span className="text-surface-600">Cargo</span> heading?
                </h2>
                <p className="text-surface-500 font-medium max-w-lg mx-auto">
                    Pick your origin and destination. We'll find the best routes from your dataset.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Source Selection */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-2">From</label>
                    <div className="relative group">
                        <div className={`absolute left-4 top-1/2 -transurface-y-1/2 p-2 rounded-lg transition-colors ${selectedSource ? 'bg-surface-600 text-white' : 'bg-surface-100 text-surface-400'}`}>
                            <Navigation className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search origin..."
                            value={selectedSource ? selectedSource.name : sourceSearch}
                            onChange={(e) => {
                                setSourceSearch(e.target.value)
                                setSelectedSource(null)
                            }}
                            className="w-full bg-white border-2 border-surface-100 rounded-3xl pl-16 pr-6 py-5 text-sm font-bold text-surface-900 focus:outline-none focus:border-surface-600 transition-all shadow-sm"
                        />
                        {!selectedSource && sourceSearch && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-surface-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                {filteredSources.map(n => (
                                    <button
                                        key={n.id}
                                        onClick={() => setSelectedSource(n)}
                                        className="w-full px-6 py-4 text-left hover:bg-surface-50 flex justify-between items-center group/item"
                                    >
                                        <div>
                                            <div className="text-sm font-bold text-surface-900">{n.name}</div>
                                            <div className="text-[9px] font-black text-surface-400 uppercase tracking-widest">{n.type}</div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-surface-300 group-hover/item:transurface-x-1 transition-transform" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Target Selection */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-2">To</label>
                    <div className="relative group">
                        <div className={`absolute left-4 top-1/2 -transurface-y-1/2 p-2 rounded-lg transition-colors ${selectedTarget ? 'bg-surface-600 text-white' : 'bg-surface-100 text-surface-400'}`}>
                            <Target className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search destination..."
                            value={selectedTarget ? selectedTarget.name : targetSearch}
                            onChange={(e) => {
                                setTargetSearch(e.target.value)
                                setSelectedTarget(null)
                            }}
                            className="w-full bg-white border-2 border-surface-100 rounded-3xl pl-16 pr-6 py-5 text-sm font-bold text-surface-900 focus:outline-none focus:border-surface-600 transition-all shadow-sm"
                        />
                        {!selectedTarget && targetSearch && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-surface-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                {filteredTargets.map(n => (
                                    <button
                                        key={n.id}
                                        onClick={() => setSelectedTarget(n)}
                                        className="w-full px-6 py-4 text-left hover:bg-surface-50 flex justify-between items-center group/item"
                                    >
                                        <div>
                                            <div className="text-sm font-bold text-surface-900">{n.name}</div>
                                            <div className="text-[9px] font-black text-surface-400 uppercase tracking-widest">{n.type}</div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-surface-300 group-hover/item:transurface-x-1 transition-transform" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Step 2: Priorities */}
            {selectedSource && selectedTarget && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-3 mb-8 px-4">
                        <div className="h-1.5 w-1.5 rounded-full bg-surface-600" />
                        <h3 className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em]">Priority</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        {[
                            { id: 'cost', label: 'Lowest Cost', desc: 'Find the cheapest route available.' },
                            { id: 'co2', label: 'Low Emissions', desc: 'Prefer rail and sea over road.' },
                            { id: 'speed', label: 'Fastest', desc: 'Shortest travel time, air if available.' }
                        ].map(p => (
                            <button
                                key={p.id}
                                onClick={() => setPriority(p.id as any)}
                                className={`p-8 rounded-3xl border-2 text-left transition-all ${priority === p.id ? 'bg-surface-600 border-surface-600 text-white shadow-xl shadow-surface-500/20' : 'bg-white border-surface-100 text-surface-900 hover:border-surface-300'}`}
                            >
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-3 ${priority === p.id ? 'text-surface-100' : 'text-surface-600'}`}>{p.id.toUpperCase()}</div>
                                <div className="text-lg font-black tracking-tight mb-2">{p.label}</div>
                                <p className={`text-[11px] font-medium leading-relaxed ${priority === p.id ? 'text-surface-100/80' : 'text-surface-500'}`}>{p.desc}</p>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleRun}
                        disabled={isOptimizing}
                        className="w-full bg-surface-900 text-white rounded-3xl py-6 flex items-center justify-center gap-4 hover:bg-surface-800 transition-all font-black text-sm uppercase tracking-[0.2em] shadow-2xl relative overflow-hidden group"
                    >
                        {isOptimizing ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Navigation className="w-5 h-5 text-surface-400" />
                                Find Route
                                <ArrowRight className="w-5 h-5 group-hover:transurface-x-2 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            )}

            <div className="mt-24 pt-12 border-t border-surface-100 flex flex-col items-center">
                <div className="flex items-center gap-3 mb-4">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Dataset Verified</span>
                </div>
                <p className="text-[10px] text-surface-400 font-bold uppercase text-center max-w-md tracking-widest leading-loose">
                    Routes are calculated from your uploaded CSV data. AI is only used for generating the summary text.
                </p>
            </div>
        </div>
    )
}
