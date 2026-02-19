import { createClient } from '@/lib/supabase/server'
import ScenarioList from '@/app/dashboard/ScenarioList'
import { Database } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="relative min-h-screen grid-pattern">
            <div className="max-w-7xl mx-auto p-8">
                <header className="mb-12 flex justify-between items-end border-b border-white/5 pb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-1 w-8 bg-red-600 rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Operation Center</span>
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">
                            Control.<span className="text-red-600">Matrix</span>
                        </h1>
                        <p className="text-white/40 mt-2 font-medium tracking-tight">Active Simulation Environment & Real-time Optimization</p>
                    </div>
                    <div className="flex flex-col items-end gap-4">
                        <div className="flex gap-4">
                            <a href="/dashboard/datasets" className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 transition-all flex items-center gap-2">
                                <Database className="w-3 h-3" />
                                Manage Bio-Grids
                            </a>
                            <a href="/dashboard/compare" className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all">
                                Compare Scenarios
                            </a>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-mono text-white/20 uppercase block">Authorized Session</span>
                            <span className="text-sm font-bold text-white/80">{user?.email ?? 'Guest Protocol'}</span>
                        </div>
                    </div>
                </header>

                <main className="animate-fade-in">
                    <ScenarioList />
                </main>
            </div>
        </div>
    )
}
