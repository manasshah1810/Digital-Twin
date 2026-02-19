'use client'

import { useState, useEffect } from 'react'
import ResultsPanel from '@/app/dashboard/ResultsPanel'
import { MapPin, Navigation, FileText, GitFork } from 'lucide-react'
import ScenarioTree from '@/app/components/ScenarioTree'
import { useRouter } from 'next/navigation'

interface Node {
    id: string
    name: string
    type: string
}

interface EditorProps {
    scenarioId: string
}

export default function ScenarioEditor({ scenarioId }: EditorProps) {
    const [fuelMultiplier, setFuelMultiplier] = useState(1.0)
    const [isOptimizing, setIsOptimizing] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [nodes, setNodes] = useState<Node[]>([])
    const [sourceNodeId, setSourceNodeId] = useState<string>('')
    const [targetNodeId, setTargetNodeId] = useState<string>('')
    const [mode, setMode] = useState<'single' | 'batch'>('single')
    const [selectedTargets, setSelectedTargets] = useState<string[]>([])
    const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0)
    const [closedNodeIds, setClosedNodeIds] = useState<string[]>([])
    const [forbiddenModes, setForbiddenModes] = useState<string[]>([])

    useEffect(() => {
        async function fetchNodes() {
            try {
                const res = await fetch(`/api/scenarios/${scenarioId}/nodes`)
                if (!res.ok) throw new Error('Failed to load network topology')
                const data = await res.json()
                setNodes(data)

                if (data.length >= 2) {
                    setSourceNodeId(data[0].id)
                    setTargetNodeId(data[data.length - 1].id)
                    setSelectedTargets([data[data.length - 1].id])
                } else if (data.length === 1) {
                    setSourceNodeId(data[0].id)
                    setTargetNodeId(data[0].id)
                    setSelectedTargets([data[0].id])
                }
            } catch (err: any) {
                console.error('Failed to load nodes:', err)
                setError(err.message)
            }
        }
        fetchNodes()
    }, [scenarioId])

    async function handleOptimize(targetRank: number = 1) {
        if (mode === 'single' && (!sourceNodeId || !targetNodeId)) {
            setError('Please select both Origin and Destination nodes.')
            return
        }
        if (mode === 'batch' && (selectedTargets.length === 0 || !sourceNodeId)) {
            setError('Please select an Origin and at least one Destination.')
            return
        }

        setIsOptimizing(true)
        setError(null)
        // Only reset result if we're not just switching ranks
        if (targetRank === 1) setResult(null)

        try {
            const endpoint = mode === 'single' ? '/api/optimize' : '/api/optimize/batch'
            const body = mode === 'single'
                ? {
                    scenarioId,
                    sourceNodeId,
                    targetNodeId,
                    constraints: {
                        fuelPriceMultipliers: { 'truck': fuelMultiplier },
                        closedNodeIds,
                        forbiddenModes
                    },
                    targetRank // Pass the requested rank to the backend
                }
                : {
                    scenarioId,
                    routePairs: selectedTargets.map(tid => ({ sourceNodeId, targetNodeId: tid })),
                    constraints: {
                        fuelPriceMultipliers: { 'truck': fuelMultiplier },
                        closedNodeIds,
                        forbiddenModes
                    }
                }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Optimization failed')

            // Inject the selection callback into the result object so ResultsPanel can use it
            data.onSelectCandidate = (idx: number) => {
                setSelectedResultIndex(idx)
                handleOptimize(idx + 1)
            }

            setResult(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsOptimizing(false)
        }
    }

    const router = useRouter()

    async function handleFork(id: string) {
        setIsOptimizing(true)
        try {
            const name = prompt('Enter name for forked scenario:')
            if (!name) return

            const res = await fetch(`/api/scenarios/${id}/fork`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            router.push(`/dashboard/scenarios/${data.scenario.id}`)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsOptimizing(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div className="glass-card p-6 min-h-[400px]">
                    <ScenarioTree
                        currentScenarioId={scenarioId}
                        onSelectScenario={(id) => router.push(`/dashboard/scenarios/${id}`)}
                        onFork={handleFork}
                    />
                </div>
            </div>

            <div className="lg:col-span-3 space-y-6">
                <div className="glass-card p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold premium-gradient">Simulation Controls</h2>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`/dashboard/scenarios/${scenarioId}/report`}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-red-500 transition-all group"
                                >
                                    <FileText className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                    Executive Summary
                                </a>
                                <button
                                    onClick={() => handleFork(scenarioId)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-red-500 transition-all group"
                                >
                                    <GitFork className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                                    Fork Current
                                </button>
                            </div>
                        </div>
                        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                            <button
                                onClick={() => setMode('single')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'single' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40 hover:text-white'}`}
                            >
                                Single Route
                            </button>
                            <button
                                onClick={() => setMode('batch')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'batch' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-white/40 hover:text-white'}`}
                            >
                                Scale Test
                            </button>
                        </div>
                    </div>

                    <div className="space-y-8 max-w-md">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] text-white/40 font-black uppercase tracking-widest flex items-center gap-2">
                                    <MapPin className="w-3 h-3 text-red-500" /> Origin Node
                                </label>
                                <select
                                    value={sourceNodeId}
                                    onChange={(e) => setSourceNodeId(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 appearance-none font-medium"
                                >
                                    <option value="" disabled className="bg-black text-white">Select Origin...</option>
                                    {nodes.map(node => (
                                        <option key={node.id} value={node.id} className="bg-[#0a0a0a] text-white">
                                            {node.name} ({node.type})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {mode === 'single' ? (
                                <div className="space-y-2">
                                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest flex items-center gap-2">
                                        <Navigation className="w-3 h-3 text-red-500" /> Destination Node
                                    </label>
                                    <select
                                        value={targetNodeId}
                                        onChange={(e) => setTargetNodeId(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 appearance-none font-medium"
                                    >
                                        <option value="" disabled className="bg-black text-white">Select Destination...</option>
                                        {nodes.map(node => (
                                            <option key={node.id} value={node.id} className="bg-[#0a0a0a] text-white">
                                                {node.name} ({node.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest flex items-center gap-2">
                                        <Navigation className="w-3 h-3 text-red-500" /> Multi-Destination Scale
                                    </label>
                                    <div className="max-h-[150px] overflow-y-auto bg-white/5 border border-white/10 rounded-xl p-2 space-y-1">
                                        {nodes.filter(n => n.id !== sourceNodeId).map(node => (
                                            <label key={node.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTargets.includes(node.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedTargets([...selectedTargets, node.id])
                                                        else setSelectedTargets(selectedTargets.filter(id => id !== node.id))
                                                    }}
                                                    className="accent-red-600 h-3 w-3"
                                                />
                                                <span className="text-[11px] font-bold text-white/60 group-hover:text-white">{node.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="space-y-2">
                                <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">Excluded Terminals</label>
                                <div className="flex flex-wrap gap-2">
                                    {closedNodeIds.map(id => (
                                        <button
                                            key={id}
                                            onClick={() => setClosedNodeIds(closedNodeIds.filter(cid => cid !== id))}
                                            className="px-2 py-1 bg-red-600/20 border border-red-500/50 rounded text-[9px] font-bold text-red-500 hover:bg-red-600/30 transition-colors"
                                        >
                                            {nodes.find(n => n.id === id)?.name || id} ×
                                        </button>
                                    ))}
                                    {closedNodeIds.length === 0 && <span className="text-[9px] text-white/20 italic">No terminals excluded</span>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">Forbidden Transport Modes</label>
                                <div className="flex gap-4">
                                    {['truck', 'rail', 'sea'].map(m => (
                                        <label key={m} className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={forbiddenModes.includes(m)}
                                                onChange={(e) => {
                                                    if (e.target.checked) setForbiddenModes([...forbiddenModes, m])
                                                    else setForbiddenModes(forbiddenModes.filter(fm => fm !== m))
                                                }}
                                                className="accent-red-600 h-3 w-3"
                                            />
                                            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${forbiddenModes.includes(m) ? 'text-red-500' : 'text-white/40 group-hover:text-white/60'}`}>{m}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <span className="text-white/70 font-bold uppercase tracking-widest text-[10px]">Shock Intensity (Fuel Multiplier)</span>
                            <div className="flex justify-between items-center">
                                <span className="text-red-500 font-mono font-bold text-lg">{fuelMultiplier.toFixed(1)}x</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                step="0.1"
                                value={fuelMultiplier}
                                onChange={(e) => setFuelMultiplier(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-600"
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <button
                                onClick={() => handleOptimize()}
                                disabled={isOptimizing || nodes.length === 0}
                                className="w-full bg-red-600 text-white rounded-xl py-4 font-black uppercase tracking-tighter hover:bg-red-500 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-xl shadow-red-600/20"
                            >
                                {isOptimizing ? 'Engine Processing...' : (mode === 'single' ? 'Execute Scenario Analysis' : `Run Batch Scale Test (${selectedTargets.length} Routes)`)}
                            </button>

                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold uppercase tracking-wider text-center leading-relaxed">
                                    System Error: <br /> {error}
                                </div>
                            )}

                            {result && !error && (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs font-bold uppercase tracking-wider text-center">
                                    Optimization Synchronized
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {result && (
                <div className="lg:col-span-4 mt-8">
                    <ResultsPanel
                        result={result}
                        onToggleNode={(id) => {
                            setClosedNodeIds(prev =>
                                prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
                            )
                        }}
                    />
                </div>
            )}
        </div>
    )
}

