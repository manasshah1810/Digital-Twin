'use client'

import { useState, useEffect } from 'react'
import ScenarioEditor from '@/app/dashboard/ScenarioEditor'
import Link from 'next/link'
import { Database, Plus, RefreshCcw } from 'lucide-react'

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
                body: JSON.stringify({ name, description: 'Tactical simulation branch', dataset_id: activeDatasetId })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            await fetchScenarios(activeDatasetId)
            setSelectedId(data.id)
        } catch (err: any) {
            alert(err.message)
        }
    }

    useEffect(() => {
        if (!selectedId && scenarios.length > 0) {
            // Auto-select baseline or first scenario
            const baseline = scenarios.find(s => s.is_baseline)
            setSelectedId(baseline ? baseline.id : scenarios[0].id)
        }
    }, [scenarios, selectedId])

    if (loading) return (
        <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
            <RefreshCcw className="w-6 h-6 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest">Synchronizing Network State...</span>
        </div>
    )

    if (!activeDatasetId) {
        return (
            <div className="bg-white border border-slate-200 rounded-3xl p-32 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="h-20 w-20 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 border border-slate-100 shadow-inner">
                    <Database className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black mb-4 text-slate-900 tracking-tight uppercase">Control Center Offline</h3>
                <p className="text-slate-500 max-w-sm text-sm mb-10 leading-relaxed font-bold uppercase tracking-widest opacity-60">Authorize a logistics dataset to initialize simulation capabilities.</p>
                <Link href="/dashboard/datasets" className="px-10 py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:bg-black transition-all shadow-xl shadow-slate-200">
                    Connect Dataset
                </Link>
            </div>
        )
    }

    return (
        <div className="w-full">
            {selectedId ? (
                <ScenarioEditor
                    scenarioId={selectedId}
                    key={selectedId}
                    onSelectScenario={(id) => setSelectedId(id)}
                />
            ) : scenarios.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-32 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="h-20 w-20 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 border border-slate-100 italic font-black text-slate-300">?</div>
                    <h3 className="text-xl font-black mb-4 text-slate-900 uppercase">No Tactical Branches</h3>
                    <p className="text-slate-500 max-w-sm text-[10px] mb-10 leading-relaxed font-black uppercase tracking-widest opacity-60">This dataset has no active scenarios. Create a baseline to start.</p>
                    <button onClick={handleCreate} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px]">Initialize Baseline</button>
                </div>
            ) : (
                <div className="h-64 flex items-center justify-center text-slate-300 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
                    Routing...
                </div>
            )}
        </div>
    )
}

