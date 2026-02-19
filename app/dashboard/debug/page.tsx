'use client'

import CompletenessValidator from '@/app/components/CompletenessValidator'
import { ShieldAlert } from 'lucide-react'

export default function DebugPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 lg:p-12 space-y-12 max-w-7xl mx-auto">
            <header className="space-y-4">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter premium-gradient uppercase">Admin Diagnostic Command</h1>
                        <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.4em] mt-1 ml-1">System Integrity & Requirement Traceability</p>
                    </div>
                </div>
            </header>

            <main>
                <CompletenessValidator />
            </main>

            <footer className="pt-12 border-t border-white/5 opacity-20 hover:opacity-100 transition-opacity">
                <div className="text-[9px] font-black text-white uppercase tracking-[0.5em] text-center italic">
                    Logistics Digital Twin // System Verification Layer // v0.1.0-STABLE
                </div>
            </footer>
        </div>
    )
}
