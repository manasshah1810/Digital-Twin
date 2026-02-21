'use client'

import { useState, useEffect } from 'react'
import ResultsPanel from './ResultsPanel'
import { MapPin, Navigation, FileText, GitFork, Settings2, PlayCircle, AlertCircle, CheckCircle2, Sparkles, Bot, Clock, ShieldAlert, Activity } from 'lucide-react'
import ScenarioTree from '../components/ScenarioTree'
import SimulationChatbot from '../components/SimulationChatbot'
import AutonomousWizard from '../components/AutonomousWizard'
import { useRouter } from 'next/navigation'

interface Node {
    id: string
    name: string
    type: string
}

interface EditorProps {
    scenarioId: string
    onSelectScenario?: (id: string) => void
}

export default function ScenarioEditor({ scenarioId, onSelectScenario }: EditorProps) {
    const [fuelMultiplier, setFuelMultiplier] = useState(1.0)
    const [isOptimizing, setIsOptimizing] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<any | null>(null)
    const [nodes, setNodes] = useState<Node[]>([])
    const [sourceNodeId, setSourceNodeId] = useState<string>('')
    const [targetNodeId, setTargetNodeId] = useState<string>('')
    const [mode, setMode] = useState<'single' | 'batch'>('single')
    const [selectedTargets, setSelectedTargets] = useState<string[]>([])
    const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0)
    const [closedNodeIds, setClosedNodeIds] = useState<string[]>([])
    const [forbiddenModes, setForbiddenModes] = useState<string[]>([])
    const [availableModes, setAvailableModes] = useState<string[]>([])
    const [parcelCount, setParcelCount] = useState<number>(1000)
    const [parcelWeight, setParcelWeight] = useState<number>(20)
    const [editorMode, setEditorMode] = useState<'expert' | 'autonomous'>('autonomous')
    const [weightMode, setWeightMode] = useState<'balanced' | 'co2' | 'time'>('balanced')
    const [isAIDataset, setIsAIDataset] = useState(false)

    const router = useRouter()

    // Interactive "What-If" Reactive Loop
    useEffect(() => {
        if (!sourceNodeId) return;
        if (mode === 'single' && !targetNodeId) return;
        if (mode === 'batch' && selectedTargets.length === 0) return;

        const timer = setTimeout(() => {
            handleOptimize(1);
        }, 150);

        return () => clearTimeout(timer);
    }, [closedNodeIds, forbiddenModes, fuelMultiplier, sourceNodeId, targetNodeId, selectedTargets, mode, parcelCount, parcelWeight]);

    // Persist Tactical Constraints to Database
    useEffect(() => {
        if (!scenarioId) return;
        const timer = setTimeout(async () => {
            try {
                await fetch(`/api/scenarios/${scenarioId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        parameter_deltas: {
                            closedNodeIds,
                            forbiddenModes,
                            fuelMultiplier,
                            sourceNodeId,
                            targetNodeId,
                            selectedTargets,
                            parcelCount,
                            parcelWeight
                        }
                    })
                });
            } catch (err) {
                console.error('Failed to persist tactical state:', err);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [scenarioId, closedNodeIds, forbiddenModes, fuelMultiplier, sourceNodeId, targetNodeId, selectedTargets, parcelCount, parcelWeight]);

    useEffect(() => {
        async function fetchNodes() {
            try {
                const nodesRes = await fetch(`/api/scenarios/${scenarioId}/nodes`)
                if (!nodesRes.ok) throw new Error('Failed to load network topology')
                const data = await nodesRes.json()
                setNodes(data)

                const modesRes = await fetch(`/api/scenarios/${scenarioId}/modes`)
                if (modesRes.ok) {
                    const modesData = await modesRes.json()
                    setAvailableModes(modesData.sort())
                }

                const scRes = await fetch(`/api/scenarios/${scenarioId}`)
                const scData = await scRes.json()

                // Detect AI-generated datasets
                if (scData.metadata?.source === 'ai_advisor' || scData.dataset_upload_type === 'ai_generated') {
                    setIsAIDataset(true)
                    setEditorMode('expert')
                }

                if (scData.parameter_deltas) {
                    const pd = scData.parameter_deltas
                    if (pd.closedNodeIds) setClosedNodeIds(pd.closedNodeIds)
                    if (pd.forbiddenModes) setForbiddenModes(pd.forbiddenModes)
                    if (pd.fuelMultiplier) setFuelMultiplier(pd.fuelMultiplier)
                    if (pd.sourceNodeId) setSourceNodeId(pd.sourceNodeId)
                    if (pd.targetNodeId) setTargetNodeId(pd.targetNodeId)
                    if (pd.selectedTargets) setSelectedTargets(pd.selectedTargets)
                    if (pd.parcelCount) setParcelCount(pd.parcelCount)
                    if (pd.parcelWeight) setParcelWeight(pd.parcelWeight)
                } else if (data.length >= 2) {
                    setSourceNodeId(data[0].id)
                    setTargetNodeId(data[data.length - 1].id)
                    setSelectedTargets([data[data.length - 1].id])
                }
            } catch (err: any) {
                console.error('Failed to load nodes:', err)
                if (err.message.includes('valid Bio-Grid')) {
                    const activeDatasetId = localStorage.getItem('activeDatasetId')
                    if (activeDatasetId) {
                        try {
                            await fetch(`/api/scenarios/${scenarioId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ dataset_id: activeDatasetId })
                            })
                            return fetchNodes()
                        } catch (patchErr) {
                            console.error('Failed to auto-heal scenario:', patchErr)
                        }
                    }
                }
                setError({ error: err.message })
            }
        }
        fetchNodes()
    }, [scenarioId])

    async function handleOptimize(targetRank: number = 1) {
        if (mode === 'single' && (!sourceNodeId || !targetNodeId)) return
        if (mode === 'batch' && (selectedTargets.length === 0 || !sourceNodeId)) return

        setIsOptimizing(true)
        setError(null)

        try {
            const endpoint = mode === 'single' ? '/api/optimize' : '/api/optimize/batch'
            const body = mode === 'single'
                ? {
                    scenarioId, sourceNodeId, targetNodeId,
                    constraints: { fuelPriceMultipliers: { 'truck': fuelMultiplier, 'rail': fuelMultiplier, 'sea': fuelMultiplier, 'air': fuelMultiplier }, closedNodeIds, forbiddenModes },
                    targetRank, weightMode, skipAI: editorMode === 'autonomous',
                    cargo: { packageCount: parcelCount, packageWeight: parcelWeight }
                }
                : {
                    scenarioId,
                    routePairs: selectedTargets.map(tid => ({ sourceNodeId, targetNodeId: tid })),
                    constraints: { fuelPriceMultipliers: { 'truck': fuelMultiplier, 'rail': fuelMultiplier, 'sea': fuelMultiplier, 'air': fuelMultiplier }, closedNodeIds, forbiddenModes },
                    weightMode,
                    cargo: { packageCount: parcelCount, packageWeight: parcelWeight }
                }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            const data = await res.json()
            if (!res.ok) {
                setError(data)
                return
            }

            data.onSelectCandidate = (idx: number) => {
                setSelectedResultIndex(idx)
                handleOptimize(idx + 1)
            }
            setResult(data)
        } catch (err: any) {
            setError({ error: err.message })
        } finally {
            setIsOptimizing(false)
        }
    }

    const handleWizardRun = (config: any) => {
        setSourceNodeId(config.sourceNodeId)
        setTargetNodeId(config.targetNodeId)
        setFuelMultiplier(config.fuelMultiplier)
        setForbiddenModes(config.forbiddenModes)
        setWeightMode(config.weightMode || 'balanced')
        setEditorMode('autonomous')
    }

    async function handleFork(id: string) {
        setIsOptimizing(true)
        try {
            const name = prompt('Name for duplicate scenario:')
            if (!name) return
            const res = await fetch(`/api/scenarios/${id}/fork`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            if (onSelectScenario) {
                onSelectScenario(data.scenario.id)
            } else {
                router.push(`/dashboard?scenarioId=${data.scenario.id}`)
            }
        } catch (err: any) {
            setError({ error: err.message })
        } finally {
            setIsOptimizing(false)
        }
    }

    return (
        <div className="space-y-12 pb-24 relative">
            <SimulationChatbot scenarioId={scenarioId} currentResult={result} />

            <div className="flex justify-between items-center mb-12">
                {isAIDataset ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Generated Dataset
                    </div>
                ) : (
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setEditorMode('expert')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editorMode === 'expert' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Settings2 className="w-3.5 h-3.5" />
                            Expert Mode
                        </button>
                        <button
                            onClick={() => setEditorMode('autonomous')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editorMode === 'autonomous' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Navigation className="w-3.5 h-3.5" />
                            Normal Mode
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    {isAIDataset ? (
                        <>
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            AI Routes Active
                        </>
                    ) : editorMode === 'autonomous' ? (
                        <>
                            <Navigation className="w-4 h-4 text-blue-600" />
                            CSV Routes Only
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            CSV + AI Generated Routes
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start animate-in fade-in duration-500">
                {/* Column 1: History */}
                <div className="xl:col-span-2 space-y-4 sticky top-8">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
                            <GitFork className="w-3.5 h-3.5 text-blue-600" />
                            <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">Tactical History</h3>
                        </div>
                        <ScenarioTree
                            currentScenarioId={scenarioId}
                            onSelectScenario={(id) => onSelectScenario ? onSelectScenario(id) : router.push(`/dashboard?scenarioId=${id}`)}
                            onFork={handleFork}
                        />
                    </div>
                </div>

                {/* Column 2: Configuration */}
                <div className="xl:col-span-4 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <Settings2 className="w-4 h-4 text-blue-600" />
                                <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest">Protocol Config</h2>
                            </div>
                            <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                                <button onClick={() => setMode('single')} className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-tighter transition-all ${mode === 'single' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Single</button>
                                <button onClick={() => setMode('batch')} className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-tighter transition-all ${mode === 'batch' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>Batch</button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 px-1">
                                        <MapPin className="w-3 h-3" /> Origin Station
                                    </label>
                                    <select value={sourceNodeId} onChange={(e) => setSourceNodeId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none appearance-none transition-all">
                                        <option value="" disabled>Select Station...</option>
                                        {nodes.map(node => <option key={node.id} value={node.id}>{node.name}</option>)}
                                    </select>
                                </div>

                                {mode === 'single' ? (
                                    <div className="space-y-2">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 px-1">
                                            <Navigation className="w-3 h-3" /> Target Destination
                                        </label>
                                        <select value={targetNodeId} onChange={(e) => setTargetNodeId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none appearance-none transition-all">
                                            <option value="" disabled>Select Station...</option>
                                            {nodes.map(node => <option key={node.id} value={node.id}>{node.name}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 px-1">
                                            <Navigation className="w-3 h-3" /> Registry Targets
                                        </label>
                                        <div className="max-h-[120px] overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                                            {nodes.filter(n => n.id !== sourceNodeId).map(node => (
                                                <label key={node.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors group">
                                                    <input type="checkbox" checked={selectedTargets.includes(node.id)} onChange={(e) => e.target.checked ? setSelectedTargets([...selectedTargets, node.id]) : setSelectedTargets(selectedTargets.filter(id => id !== node.id))} className="accent-blue-600 h-3.5 w-3.5" />
                                                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 uppercase">{node.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 px-1">
                                            <FileText className="w-3 h-3" /> Parcel Count
                                        </label>
                                        <input
                                            type="number"
                                            value={parcelCount}
                                            onChange={(e) => setParcelCount(parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all"
                                            min="1"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 px-1">
                                            <Activity className="w-3 h-3" /> Unit Weight (kg)
                                        </label>
                                        <input
                                            type="number"
                                            value={parcelWeight}
                                            onChange={(e) => setParcelWeight(parseInt(e.target.value) || 0)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all"
                                            min="1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Fuel Price</span>
                                <span className="text-blue-600 font-black text-lg tabular-nums">{fuelMultiplier.toFixed(1)}x</span>
                            </div>
                            <input type="range" min="1" max="5" step="0.1" value={fuelMultiplier} onChange={(e) => setFuelMultiplier(parseFloat(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600" />

                            <div className="pt-6 border-t border-slate-100 space-y-4">
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Exclude Modes ({availableModes.length})</label>
                                        <button
                                            onClick={() => setForbiddenModes(forbiddenModes.length === availableModes.length ? [] : [...availableModes])}
                                            className="text-[8px] font-black text-blue-600 uppercase hover:underline"
                                        >
                                            {forbiddenModes.length === availableModes.length ? 'Clear All' : 'Ban All'}
                                        </button>
                                    </div>
                                    <div className="max-h-[160px] overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-3 grid grid-cols-2 gap-2 custom-scrollbar">
                                        {availableModes.map(m => (
                                            <label key={m} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${forbiddenModes.includes(m) ? 'bg-red-50/50 border-red-100' : 'bg-white border-transparent hover:border-slate-200'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={forbiddenModes.includes(m)}
                                                    onChange={(e) => e.target.checked ? setForbiddenModes([...forbiddenModes, m]) : setForbiddenModes(forbiddenModes.filter(fm => fm !== m))}
                                                    className="accent-red-600 h-3.5 w-3.5"
                                                />
                                                <span className={`text-[9px] font-black uppercase tracking-tighter truncate ${forbiddenModes.includes(m) ? 'text-red-600' : 'text-slate-600'}`}>{m}</span>
                                            </label>
                                        ))}
                                        {availableModes.length === 0 && <div className="col-span-2 py-4 text-center text-[9px] font-bold text-slate-300 uppercase italic">Analyzing dataset for modes...</div>}
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-slate-100">
                                    <label className="text-[9px] text-slate-400 font-bold uppercase tracking-widest px-1">Optimization Priority</label>
                                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
                                        {[
                                            { id: 'balanced', label: 'Economy', icon: <Activity className="w-2.5 h-2.5" /> },
                                            { id: 'co2', label: 'Eco', icon: <Sparkles className="w-2.5 h-2.5 text-emerald-500" /> },
                                            { id: 'time', label: 'Velocity', icon: <Clock className="w-2.5 h-2.5 text-blue-500" /> }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setWeightMode(opt.id as any)}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[8px] font-black uppercase transition-all ${weightMode === opt.id ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {opt.icon}
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2 min-h-[40px]">
                                    {closedNodeIds.map(id => (
                                        <button key={id} onClick={() => setClosedNodeIds(closedNodeIds.filter(cid => cid !== id))} className="px-3 py-1 bg-red-50 border border-red-100 rounded-lg text-[9px] font-black text-red-600 hover:bg-red-100 flex items-center gap-1.5 transition-all">
                                            <AlertCircle className="w-2.5 h-2.5" /> {nodes.find(n => n.id === id)?.name || 'Node'}
                                        </button>
                                    ))}
                                    {closedNodeIds.length === 0 && <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest italic py-1">No exclusions active</span>}
                                </div>
                            </div>

                            <button onClick={() => handleOptimize()} disabled={isOptimizing} className="w-full bg-slate-900 text-white rounded-xl py-4 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-slate-200">
                                {isOptimizing ? <Clock className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4 text-blue-500" />}
                                {isOptimizing ? 'Finding best route...' : 'Find Route'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Column 3: Results */}
                <div className="xl:col-span-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 animate-in slide-in-from-top-2 duration-500 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-8 w-8 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black text-red-900 uppercase tracking-widest">No Route Found</h3>
                                    <p className="text-[8px] text-red-500 font-black uppercase tracking-widest mt-0.5">Could not connect these locations</p>
                                </div>
                            </div>
                            <div className="text-[11px] font-bold text-red-700 bg-white/50 p-3 rounded-lg border border-red-100 mb-4 italic">
                                {error.error}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setForbiddenModes([]); setClosedNodeIds([]) }} className="px-4 py-2 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-red-200">Reset</button>
                                <button onClick={() => handleOptimize()} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Retry</button>
                            </div>

                            {error.diagnostics?.infrastructureProposal && (
                                <div className="mt-6 pt-6 border-t border-red-100">
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="text-[8px] font-black text-blue-600 uppercase mb-1">AI Recommendation</div>
                                                <div className="text-[10px] font-black text-slate-800 uppercase italic">New {error.diagnostics.infrastructureProposal.mode} Link ({error.diagnostics.infrastructureProposal.estimatedDistance}km)</div>
                                            </div>
                                        </div>
                                        <button onClick={() => { setForbiddenModes([]); handleOptimize(); }} className="w-full mt-2 py-2.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                            Apply Fix
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {result && !error && (
                        <div className="animate-in fade-in duration-700 slide-in-from-bottom-2">
                            <ResultsPanel
                                result={result}
                                closedNodeIds={closedNodeIds}
                                onToggleNode={(id) => {
                                    setClosedNodeIds(prev =>
                                        prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
                                    )
                                }}
                                onSelectCandidate={(idx) => handleOptimize(idx + 1)}
                            />
                        </div>
                    )}

                    {!result && !error && !isOptimizing && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                            <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                                <Settings2 className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Ready</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-xs mx-auto">Select origin and destination, then click Find Route</p>
                        </div>
                    )}

                    {isOptimizing && (
                        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-slate-50 overflow-hidden">
                                <div className="h-full bg-blue-600 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
                            </div>
                            <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-100 animate-pulse">
                                <Bot className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-black text-blue-900 uppercase tracking-tight mb-2">Finding Routes</h3>
                            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Checking all possible paths...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
