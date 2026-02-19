'use client'

import React, { useState, useEffect } from 'react'
import { Database, CheckCircle2, ChevronRight, HardDrive } from 'lucide-react'

interface Dataset {
    id: string
    name: string
    created_at: string
}

export default function DatasetSelector({ onSelect }: { onSelect: (id: string) => void }) {
    const [datasets, setDatasets] = useState<Dataset[]>([])
    const [loading, setLoading] = useState(true)
    const [activeId, setActiveId] = useState<string | null>(null)

    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchDatasets() {
            try {
                const res = await fetch('/api/datasets')
                const data = await res.json()

                if (Array.isArray(data)) {
                    setDatasets(data)
                } else if (data.error) {
                    setError(data.error)
                    setDatasets([])
                } else {
                    setDatasets([])
                }

                const saved = localStorage.getItem('activeDatasetId')
                if (saved) setActiveId(saved)
            } catch (err: any) {
                setError('Failed to contact bio-grid synchronization service.')
                setDatasets([])
            } finally {
                setLoading(false)
            }
        }
        fetchDatasets()
    }, [])

    const handleSelect = (id: string) => {
        setActiveId(id)
        localStorage.setItem('activeDatasetId', id)
        onSelect(id)
    }

    if (loading) return <div className="h-20 flex items-center justify-center text-[10px] uppercase font-black text-white/20 tracking-widest animate-pulse">Scanning Bio-Grid...</div>

    return (
        <div className="space-y-4">
            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4">Available Architectures</h3>

            {error && (
                <div className="mx-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Synchronization Fault</div>
                    <div className="text-xs text-white/60 font-medium">{error}</div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-2">
                {datasets.map(d => (
                    <button
                        key={d.id}
                        onClick={() => handleSelect(d.id)}
                        className={`p-4 rounded-xl border transition-all text-left flex justify-between items-center group ${activeId === d.id ? 'bg-red-600/10 border-red-500/50 shadow-lg shadow-red-600/5' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'}`}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${activeId === d.id ? 'bg-red-600 text-white' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                                <HardDrive className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-white uppercase tracking-tighter tracking-widest">{d.name}</div>
                                <div className="text-[9px] text-white/20 font-black uppercase tracking-widest">{new Date(d.created_at).toLocaleDateString()} // CLOUD_SYNC</div>
                            </div>
                        </div>
                        {activeId === d.id ? <CheckCircle2 className="w-4 h-4 text-red-500" /> : <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-white/40 transition-all group-hover:translate-x-1" />}
                    </button>
                ))}
                {datasets.length === 0 && (
                    <div className="p-8 border border-dashed border-white/10 rounded-xl text-center">
                        <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">No architectures committed to cloud.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
