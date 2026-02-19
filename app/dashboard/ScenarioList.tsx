'use client'

import { useState, useEffect } from 'react'
import ScenarioEditor from '@/app/dashboard/ScenarioEditor'
import Link from 'next/link'
import { Database } from 'lucide-react'

export default function ScenarioList() {
    const [scenarios, setScenarios] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null)

    useEffect(() => {
        const saved = localStorage.getItem('activeDatasetId')
        setActiveDatasetId(saved)
        fetchScenarios(saved)
    }, [])

    async function fetchScenarios(datasetId: string | null) {
        if (!datasetId) {
            setScenarios([])
            setLoading(false)
            return
        }
        try {
            const res = await fetch('/api/scenarios')
            const data = await res.json()
            if (Array.isArray(data)) {
                // Filter by active dataset
                setScenarios(data.filter(s => s.dataset_id === datasetId))
            } else {
                setScenarios([])
            }
        } catch (error) {
            setScenarios([])
        } finally {
            setLoading(false)
        }
    }

    async function handleCreate() {
        const name = prompt('Scenario Name:')
        if (!name || !activeDatasetId) return

        try {
            const res = await fetch('/api/scenarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description: 'User-defined tactical branch', dataset_id: activeDatasetId })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            await fetchScenarios(activeDatasetId)
            setSelectedId(data.id)
        } catch (err: any) {
            alert(err.message)
        }
    }

    if (loading) return <div className="h-64 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-white/20">Decrypting Logistics Fabric...</div>

    if (!activeDatasetId) {
        return (
            <div className="glass-card p-32 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-red-600/10 flex items-center justify-center mb-6 border border-red-500/20">
                    <Database className="w-8 h-8 text-red-500 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black italic premium-gradient uppercase mb-2 text-white">No Bio-Grid Detected</h3>
                <p className="text-white/40 max-w-sm text-sm mb-8 font-medium">To run simulations, you must first ingest a logistics architecture. The system requires nodes, edges, pricing, and fuel schemas.</p>
                <Link href="/dashboard/datasets" className="px-8 py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all transform hover:scale-105 active:scale-95">
                    Enter Ingestion Protocol
                </Link>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 border-r border-white/5 pr-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Active Scenarios</h2>
                    <div className="flex gap-4">
                        <button
                            onClick={handleCreate}
                            className="text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors"
                        >
                            + New Scenario
                        </button>
                        <Link href="/dashboard/datasets" className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors">
                            Switch Grid
                        </Link>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    {scenarios.map((s) => (
                        <button
                            key={s.id}
                            onClick={() => setSelectedId(s.id)}
                            className={`text-left p-4 rounded-xl transition-all duration-300 group ${selectedId === s.id
                                ? 'bg-red-600 text-white shadow-xl shadow-red-600/20 translate-x-1'
                                : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                                }`}
                        >
                            <div className="font-bold tracking-tight">{s.name}</div>
                            <span className="text-[9px] uppercase font-black tracking-widest opacity-50 mt-1 block group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden text-ellipsis">
                                {s.is_baseline ? 'System Baseline' : 'Tactical Branch'}
                            </span>
                        </button>
                    ))}
                    {scenarios.length === 0 && (
                        <p className="text-[10px] text-white/20 italic p-4 border border-dashed border-white/5 rounded-xl">No scenarios found for this Bio-Grid.</p>
                    )}
                </div>
            </div>

            <div className="lg:col-span-3">
                {selectedId ? (
                    <ScenarioEditor scenarioId={selectedId} key={selectedId} />
                ) : (
                    <div className="glass-card p-32 flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                            <div className="h-4 w-4 rounded-full bg-red-600 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 uppercase italic premium-gradient">Initialize Simulation</h3>
                        <p className="text-white/40 max-w-xs text-sm font-medium">Select a tactical branch from the left panel to begin stress-testing logistics resilience for the active architecture.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
