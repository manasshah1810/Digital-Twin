import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import ThemeProvider, { ThemeToggle } from './components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'Cogniify Digital-Twin | Enterprise Network Optimization',
    description: 'Advanced deterministic simulation for resilient logistics and supply chain optimization.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={cn(inter.className, "antialiased selection:bg-brand-500/10 text-surface-900 bg-surface-50")}>
                <ThemeProvider>
                    <div className="relative min-h-screen">
                        <header className="sticky top-0 z-50 border-b border-surface-200 bg-white/80 backdrop-blur-xl">
                            <div className="container mx-auto flex h-16 items-center justify-between px-6">
                                <div className="flex items-center gap-3">
                                    <img src="/logo.png" alt="Cogniify Logo" className="h-8 w-auto object-contain drop-shadow-md" />
                                    <span className="font-black tracking-tighter text-xl uppercase text-surface-900">Cogniify <span className="text-brand-500">Digital-Twin</span></span>
                                </div>

                                <nav className="hidden md:flex items-center gap-8 text-[11px] font-bold uppercase tracking-widest text-surface-400">
                                    <a href="/dashboard" className="transition-all hover:text-surface-600">Operations</a>
                                    <a href="/dashboard/datasets" className="transition-all hover:text-surface-600">Assets</a>
                                    <a href="/ai-advisor" className="transition-all hover:text-amber-600 text-amber-500">AI Advisor</a>
                                    <a href="/glossary" className="transition-all hover:text-brand-500">Glossary</a>
                                </nav>

                                <div className="flex items-center gap-6">
                                    <ThemeToggle />
                                    <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-surface-400 uppercase tracking-wider">
                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                        System Active
                                    </div>
                                    <a href="/dashboard" className="rounded-lg bg-brand-500 text-white px-5 py-2 text-[11px] font-bold uppercase tracking-wider transition-all hover:bg-black active:scale-95 shadow-md shadow-brand-500/20">
                                        Launch Console
                                    </a>
                                </div>
                            </div>
                        </header>
                        <main>{children}</main>
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}

