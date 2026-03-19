'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Shield, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [view, setView] = useState<'signin' | 'signup'>('signin')
    const router = useRouter()
    const supabase = createClient()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (view === 'signin') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                })
                if (error) throw error
                setError('Registration successful! Please check your email for the confirmation link.')
                setLoading(false)
                return
            }
            router.push('/dashboard')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-surface-50 flex items-center justify-center p-6 bg-[url('/grid.svg')] bg-center">
            <div className="w-full max-w-md bg-white border border-surface-200 rounded-3xl p-10 shadow-xl shadow-surface-200/50">
                <div className="flex flex-col items-center text-center mb-10">
                    <div className="h-16 w-16 bg-brand-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-brand-500/20">
                        <Shield className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-surface-900 tracking-tight uppercase mb-2">
                        {view === 'signin' ? 'Launch Console' : 'Initialize Access'}
                    </h1>
                    <p className="text-surface-500 text-sm font-bold uppercase tracking-widest opacity-60">
                        Secure Network Gateway // Simulation Access
                    </p>
                </div>

                {error && (
                    <div className={`p-4 rounded-xl text-xs font-bold mb-8 border ${error.includes('successful') ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">Identity Vector (Email)</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-surface-50 border border-surface-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                                placeholder="commander@enterprise.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">Access Cipher (Password)</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-surface-50 border border-surface-200 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                                placeholder="••••••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-surface-900 hover:bg-black text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                {view === 'signin' ? 'Verify Credentials' : 'Request Access'}
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-surface-100 text-center">
                    <button
                        onClick={() => setView(view === 'signin' ? 'signup' : 'signin')}
                        className="text-[10px] font-black text-surface-400 uppercase tracking-widest hover:text-brand-500 transition-colors"
                    >
                        {view === 'signin' ? 'Need system access? Request initialization' : 'Already authorized? Return to gateway'}
                    </button>
                </div>
            </div>
        </div>
    )
}
