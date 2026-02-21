import { createClient } from '@/lib/supabase/server'
import ScenarioList from '@/app/dashboard/ScenarioList'
import { Database, LayoutDashboard } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="relative min-h-screen bg-surface-50 overflow-x-hidden">
            <div className="w-full px-4 lg:px-8 py-8">
                <header className="mb-8 flex justify-between items-start border-b border-surface-200 pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <LayoutDashboard className="w-4 h-4 text-surface-600" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500 font-black">Operations Intelligence</span>
                        </div>
                        <h1 className="text-3xl font-black text-surface-900 tracking-tight flex items-center gap-3">
                            Strategic Control Center
                        </h1>
                        <p className="text-surface-500 mt-1 text-sm font-bold uppercase tracking-widest opacity-60">Network Simulation & Real-time Optimization</p>
                    </div>
                    <div className="flex flex-col items-end gap-4">
                        <div className="flex gap-2">
                            <a href="/dashboard/datasets" className="px-4 py-2 bg-white hover:bg-surface-50 border border-surface-200 rounded-xl text-xs font-black uppercase tracking-widest text-surface-600 transition-all flex items-center gap-2 shadow-sm border-b-2">
                                <Database className="w-3.5 h-3.5 text-surface-400" />
                                Datasets
                            </a>
                            <a href="/dashboard/compare" className="px-4 py-2 bg-surface-600 hover:bg-surface-700 border border-transparent rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all shadow-lg shadow-surface-500/20 border-b-2 border-surface-800">
                                Compare
                            </a>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-black text-surface-900 tabular-nums">{user?.email ?? 'GUEST_USER'}</span>
                        </div>
                    </div>
                </header>

                <main className="">
                    <ScenarioList />
                </main>
            </div>
        </div>
    )
}

