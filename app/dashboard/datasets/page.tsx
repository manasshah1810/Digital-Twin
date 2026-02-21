'use client'

import React, { useState } from 'react'
import DatasetUploader from '@/app/components/DatasetUploader'
import DatasetSelector from '@/app/components/DatasetSelector'
import { Database, ShieldCheck, ChevronLeft, LayoutGrid, UploadCloud } from 'lucide-react'
import Link from 'next/link'

export default function DatasetsPage() {
    const [view, setView] = useState<'select' | 'upload'>('select')

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 lg:p-12 max-w-7xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-600 shadow-sm group">
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Database className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">Data Management</span>
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Network <span className="text-blue-600">Assets</span></h1>
                        <p className="text-xs text-slate-500 font-medium mt-1">Manage global logistics nodes, pricing matrices, and network topographies.</p>
                    </div>
                </div>

                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setView('select')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${view === 'select' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Active Libraries
                    </button>
                    <button
                        onClick={() => setView('upload')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${view === 'upload' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Import Dataset
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto">
                {view === 'select' ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <DatasetSelector onSelect={(id) => {
                            console.log('Dataset selected:', id)
                        }} />
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <DatasetUploader onComplete={(id) => {
                            setView('select')
                            window.location.reload()
                        }} />
                    </div>
                )}
            </main>

            <footer className="mt-20 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 opacity-60">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Secure Data Environment // System v2.1.0 // Cluster: Stable
                </div>
                <div className="flex gap-8">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Compliance Verified</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Audit Logs Active</div>
                </div>
            </footer>
        </div>
    )
}

