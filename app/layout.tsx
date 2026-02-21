import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Logistics Digital Twin | Enterprise Network Optimization',
    description: 'Advanced deterministic simulation for resilient logistics and supply chain optimization.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={cn(inter.className, "antialiased selection:bg-blue-600/10 text-slate-900 bg-slate-50")}>
                <div className="relative min-h-screen">
                    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
                        <div className="container mx-auto flex h-16 items-center justify-between px-6">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                                    <div className="h-2.5 w-2.5 rounded-full bg-white" />
                                </div>
                                <span className="font-black tracking-tighter text-xl uppercase text-slate-900">Digital.<span className="text-blue-600">Twin</span></span>
                            </div>

                            <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                <a href="/dashboard" className="transition-all hover:text-blue-600">Operations</a>
                                <a href="/dashboard/datasets" className="transition-all hover:text-blue-600">Assets</a>
                                <a href="/ai-advisor" className="transition-all hover:text-amber-600 text-amber-500">AI Advisor</a>
                            </nav>

                            <div className="flex items-center gap-6">
                                <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                    System Active
                                </div>
                                <a href="/dashboard" className="rounded-lg bg-slate-900 text-white px-5 py-2 text-[11px] font-bold uppercase tracking-wider transition-all hover:bg-blue-600 active:scale-95 shadow-md shadow-slate-200">
                                    Launch Console
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

