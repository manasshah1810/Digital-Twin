'use client'

import React, { useState } from 'react'
import DatasetUploader from '@/app/components/DatasetUploader'
import DatasetSelector from '@/app/components/DatasetSelector'
import { Database, ShieldCheck, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default function DatasetsPage() {
    const [view, setView] = useState<'select' | 'upload'>('select')

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 lg:p-12 space-y-12 max-w-7xl mx-auto">
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="h-10 w-10 flex items-center justify-center bg-white/5 rounded-xl hover:bg-white/10 transition-all text-white/40 hover:text-white group">
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-black italic tracking-tighter premium-gradient uppercase italic">Strategic Inventory & Bio-Grid</h1>
                        <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.5em] mt-1 ml-1 flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3 text-red-600" /> Ground Truth Architecture Management
                        </p>
                    </div>
                </div>

                <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setView('select')}
                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all ${view === 'select' ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'text-white/40 hover:text-white'}`}
                    >
                        Active Bio-Grids
                    </button>
                    <button
                        onClick={() => setView('upload')}
                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] transition-all ${view === 'upload' ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'text-white/40 hover:text-white'}`}
                    >
                        Ingest New Grid
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto">
                {view === 'select' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <DatasetSelector onSelect={(id) => {
                            // Already handled in selector with localStorage
                            alert('Architecture synchronization successful. Reloading environment.')
                            window.location.reload()
                        }} />
                    </div>
                ) : (
                    <DatasetUploader onComplete={(id) => {
                        setView('select')
                        window.location.reload()
                    }} />
                )}
            </main>

            <footer className="pt-12 border-t border-white/5 flex justify-between items-center opacity-40">
                <div className="text-[9px] font-black text-white uppercase tracking-[0.5em] italic">
                    Logistics Digital Twin // Ingestion Protocol v2.1 // STABLE_ENV
                </div>
                <div className="flex gap-8">
                    <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Safety Locked</div>
                    <div className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Audit Log Active</div>
                </div>
            </footer>
        </div>
    )
}
