'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, LogOut, Shield } from 'lucide-react'

export default function UserMenu({ user }: { user: any }) {
    const supabase = createClient()
    const router = useRouter()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    if (!user) {
        return (
            <a href="/login" className="rounded-lg bg-surface-900 text-white px-5 py-2 text-[11px] font-bold uppercase tracking-widest transition-all hover:bg-black active:scale-95 shadow-lg shadow-surface-900/10 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                Authorize
            </a>
        )
    }

    return (
        <div className="flex items-center gap-4">
            <div className="hidden lg:flex flex-col items-end">
                <span className="text-[10px] font-black text-surface-900 uppercase tracking-wider">{user.email.split('@')[0]}</span>
                <span className="text-[8px] font-bold text-surface-400 uppercase tracking-[0.2em]">Authorized Operator</span>
            </div>
            <button
                onClick={handleSignOut}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-surface-50 border border-surface-200 text-surface-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-all shadow-sm group"
                title="Deauthorize System"
            >
                <LogOut className="w-4 h-4 group-hover:transurface-x-0.5 transition-transform" />
            </button>
        </div>
    )
}
