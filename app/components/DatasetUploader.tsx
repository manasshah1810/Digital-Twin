'use client'

import React, { useState } from 'react'
import { Upload, CheckCircle2, AlertCircle, FileText, Loader2, Info } from 'lucide-react'

export default function DatasetUploader({ onComplete }: { onComplete: (id: string) => void }) {
    const [name, setName] = useState('')
    const [files, setFiles] = useState<Record<string, File | null>>({
        logistics_nodes: null,
        route_edges: null,
        carrier_pricing: null,
        fuel_indices: null,
        shipments: null
    })
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (key: string, file: File | null) => {
        setFiles(prev => ({ ...prev, [key]: file }))
        setError(null)
    }

    const validate = () => {
        if (!name) return 'Dataset identifier is required'
        if (!files.logistics_nodes) return 'logistics_nodes.csv is required'
        if (!files.route_edges) return 'route_edges.csv is required'
        if (!files.carrier_pricing) return 'carrier_pricing.csv is required'
        if (!files.fuel_indices) return 'fuel_indices.csv is required'
        return null
    }

    const handleUpload = async () => {
        const err = validate()
        if (err) {
            setError(err)
            return
        }

        setUploading(true)
        setError(null)

        try {
            const formData = new FormData()
            formData.append('name', name)
            Object.entries(files).forEach(([key, file]) => {
                if (file) formData.append(key, file)
            })

            const res = await fetch('/api/datasets/upload', {
                method: 'POST',
                body: formData
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Upload failed')

            onComplete(data.datasetId)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setUploading(false)
        }
    }

    const FileSlot = ({ label, id }: { label: string, id: string }) => (
        <div className={`p-4 rounded-xl border transition-all ${files[id]
            ? 'border-surface-200 bg-surface-50/50 shadow-sm'
            : 'border-surface-200 bg-white hover:border-surface-300'}`}
        >
            <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0 mr-4">
                    <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-1">{label}</div>
                    <div className="text-xs font-bold text-surface-700 flex items-center gap-2 truncate">
                        {files[id] ? <FileText className="w-3.5 h-3.5 text-surface-600" /> : <Upload className="w-3.5 h-3.5 text-surface-300" />}
                        {files[id] ? files[id]?.name : 'Unassigned'}
                    </div>
                </div>
                <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    id={`file-${id}`}
                    onChange={(e) => handleFileChange(id, e.target.files?.[0] || null)}
                />
                <label
                    htmlFor={`file-${id}`}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${files[id]
                        ? 'bg-surface-600 text-white hover:bg-surface-700'
                        : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}`}
                >
                    {files[id] ? 'Replace' : 'Browse'}
                </label>
            </div>
        </div>
    )

    return (
        <div className="bg-white border border-surface-200 rounded-3xl p-8 lg:p-10 space-y-10 shadow-xl shadow-surface-200/50">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-surface-50 flex items-center justify-center">
                        <Upload className="w-5 h-5 text-surface-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-surface-900 uppercase">Asset Import <span className="text-surface-600">Console</span></h2>
                        <p className="text-[10px] text-surface-400 font-bold uppercase tracking-widest mt-0.5 ml-0.5">Define network topology via RFC-compliant CSV structures</p>
                    </div>
                </div>
            </header>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] text-surface-500 font-bold uppercase tracking-widest ml-1">Dataset Label</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Q3 Global Logistics Baseline"
                        className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3.5 text-surface-900 focus:outline-none focus:ring-2 focus:ring-surface-600/20 focus:border-surface-600 transition-all font-bold placeholder:text-surface-300"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileSlot label="Nodes (Facility Registry)" id="logistics_nodes" />
                    <FileSlot label="Edges (Transit Lanes)" id="route_edges" />
                    <FileSlot label="Carrier Rate Cards" id="carrier_pricing" />
                    <FileSlot label="Fuel Index Matrices" id="fuel_indices" />
                    <FileSlot label="Shipment Ledger (Optional)" id="shipments" />

                    <div className="p-4 rounded-xl border border-dashed border-surface-200 bg-surface-50 flex items-center gap-4">
                        <Info className="w-5 h-5 text-surface-400 shrink-0" />
                        <p className="text-[10px] text-surface-400 font-medium leading-relaxed uppercase tracking-tight">
                            Ensure all files follow the standard schema. Incomplete datasets may cause simulation instability.
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-3 animate-shake">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-pre-wrap">{error}</span>
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-surface-600 text-white hover:bg-surface-700 rounded-xl py-4.5 font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-surface-200 hover:-transurface-y-0.5 active:transurface-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 overflow-hidden"
            >
                {uploading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Validating & Synchronizing...
                    </>
                ) : (
                    <>
                        <CheckCircle2 className="w-5 h-5" />
                        Finalize Data Ingestion
                    </>
                )}
            </button>
        </div>
    )
}

