'use client'

import React, { useState } from 'react'
import { Upload, CheckCircle2, AlertCircle, FileText, Loader2 } from 'lucide-react'

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
        if (!name) return 'Dataset name is required'
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
        <div className={`p-4 rounded-xl border transition-all ${files[id] ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'}`}>
            <div className="flex justify-between items-center">
                <div>
                    <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">{label}</div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                        {files[id] ? <FileText className="w-3 h-3 text-emerald-500" /> : <Upload className="w-3 h-3 text-white/20" />}
                        {files[id] ? files[id]?.name : 'Not selected'}
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
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest text-white cursor-pointer transition-colors"
                >
                    {files[id] ? 'Change' : 'Browse'}
                </label>
            </div>
        </div>
    )

    return (
        <div className="glass-card p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-black italic tracking-tighter premium-gradient uppercase italic">Strategic Ingestion Layer</h2>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] mt-1 ml-1">Upload global logistics architecture (CSV)</p>
                </div>
            </header>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">Dataset Identifier</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. FY26 Global Grid Alpha"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500/50 font-medium"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FileSlot label="Nodes (terminals)" id="logistics_nodes" />
                    <FileSlot label="Edges (pathways)" id="route_edges" />
                    <FileSlot label="Carrier Pricing" id="carrier_pricing" />
                    <FileSlot label="Fuel Matrices" id="fuel_indices" />
                    <FileSlot label="Shipments (Optional)" id="shipments" />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-pre-wrap">{error}</span>
                </div>
            )}

            <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-white text-black hover:bg-red-600 hover:text-white rounded-xl py-4 font-black uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3"
            >
                {uploading ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing Schemas & Ingesting...
                    </>
                ) : (
                    <>
                        <Upload className="w-5 h-5" />
                        Commit Architecture to Cloud
                    </>
                )}
            </button>
        </div>
    )
}
