import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Logistics Digital Twin | Fuel-Price Resilience',
    description: 'Deterministic simulation for logistics optimization.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={cn(inter.className, "antialiased selection:bg-red-500/30")}>
                <div className="relative min-h-screen border-t-2 border-red-600">
                    <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
                        <div className="container mx-auto flex h-20 items-center justify-between px-4">
                            <div className="flex items-center gap-3">
                                <div className="h-6 w-6 rounded-lg bg-red-600 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                                    <div className="h-2 w-2 rounded-full bg-white opacity-80" />
                                </div>
                                <span className="font-black tracking-tighter text-2xl uppercase italic">Twin.<span className="text-red-600">OS</span></span>
                            </div>

                            <nav className="hidden md:flex items-center gap-10 text-xs font-bold uppercase tracking-widest text-white/40">
                                <a href="/dashboard" className="transition-all hover:text-white hover:tracking-[0.2em]">Dashboard</a>
                                <a href="/scenarios" className="transition-all hover:text-white hover:tracking-[0.2em]">Matrix</a>
                                <a href="/nodes" className="transition-all hover:text-white hover:tracking-[0.2em]">Topology</a>
                                <a href="/dashboard/debug" className="transition-all hover:text-white hover:tracking-[0.2em]">Validator</a>
                            </nav>

                            <div className="flex items-center gap-6">
                                <div className="hidden lg:block text-[10px] font-mono text-white/20">
                                    NODE_HASH: <span className="text-red-500/50">8f2a...e91</span>
                                </div>
                                <a href="/dashboard" className="rounded-xl bg-white text-black px-6 py-2.5 text-xs font-black uppercase tracking-tighter transition-all hover:bg-red-600 hover:text-white active:scale-95 shadow-xl shadow-white/5">
                                    Enter Dashboard
                                </a>
                            </div>
                        </div>
                    </header>
                    <main>{children}</main>
                </div>
            </body>
        </html>
    );
}
