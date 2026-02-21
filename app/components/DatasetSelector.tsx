'use client'

import React, { useState, useEffect } from 'react'
import { CheckCircle2, ChevronRight, HardDrive, Calendar, Search, Trash2, RefreshCw } from 'lucide-react'

interface Dataset {
    id: string
    name: string
    uploaded_at: string
}

export default function DatasetSelector({ onSelect }: { onSelect: (id: string) => void }) {
    const [datasets, setDatasets] = useState<Dataset[]>([])
    const [loading, setLoading] = useState(true)
    const [activeId, setActiveId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

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
                setError('Failed to establish connection with the central data repository.')
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
        // Force reload to ensure all components pick up the new ID
        setTimeout(() => window.location.reload(), 100)
    }

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (!confirm('Are you sure you want to permanently delete this network model and all its associated scenarios?')) return

        setDeletingIds(prev => new Set(prev).add(id))
        try {
            const res = await fetch(`/api/datasets?id=${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to delete asset')
            setDatasets(datasets.filter(d => d.id !== id))
            if (activeId === id) {
                localStorage.removeItem('activeDatasetId')
                setActiveId(null)
            }
        } catch (err: any) {
            alert(err.message)
        } finally {
            setDeletingIds(prev => {
                const next = new Set(prev)
                next.delete(id)
                return next
            })
        }
    }

    if (loading) return (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <div className="text-xs uppercase font-bold text-slate-400 tracking-widest">Synchronizing Library...</div>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Available Network Models</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">Total: {datasets.length}</span>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-red-500 mt-1" />
                    <div>
                        <div className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Status Error</div>
                        <div className="text-xs text-red-600 font-medium">{error}</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3">
                {datasets.map(d => (
                    <div
                        key={d.id}
                        onClick={() => handleSelect(d.id)}
                        className={`p-5 rounded-2xl border transition-all text-left flex justify-between items-center group relative overflow-hidden cursor-pointer ${activeId === d.id
                            ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                            }`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleSelect(d.id);
                            }
                        }}
                    >
                        <div className="flex items-center gap-5 relative z-10">
                            <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all ${activeId === d.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                <HardDrive className="w-5 h-5" />
                            </div>
                            <div>
                                <div className={`text-sm font-bold tracking-tight mb-1 ${activeId === d.id ? 'text-blue-900' : 'text-slate-900'}`}>{d.name}</div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(d.uploaded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                    <div className="h-1 w-1 rounded-full bg-slate-300" />
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verified State</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                            <button
                                onClick={(e) => handleDelete(e, d.id)}
                                disabled={deletingIds.has(d.id)}
                                className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all ${deletingIds.has(d.id) ? 'text-slate-400 bg-slate-50' : 'text-slate-300 hover:text-red-600 hover:bg-red-50 group-hover:opacity-100 opacity-0'}`}
                                title="Delete Asset"
                            >
                                {deletingIds.has(d.id) ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            </button>

                            {activeId === d.id ? (
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            ) : (
                                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {datasets.length === 0 && (
                    <div className="p-12 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-white">
                        <div className="mx-auto h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                            <Search className="w-6 h-6 text-slate-300" />
                        </div>
                        <h4 className="text-slate-900 font-bold mb-1">No models found</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">Upload a new network configuration to begin running logistics simulations.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

