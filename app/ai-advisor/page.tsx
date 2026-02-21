'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, ArrowRight, Loader2, BarChart3, RefreshCw, MessageCircle, Save, CheckCircle2, ArrowLeft, Building2, MapPin, Package, Truck, Target } from 'lucide-react'
import LogisticsMap from '@/app/dashboard/LogisticsMap'
import { useRouter } from 'next/navigation'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface GeneratedRoute {
    rank: number
    name: string
    description: string
    pathDetails: any[]
    totalCost: number
    totalCO2: number
    totalTransitTime: number
    modeBreakdown: Record<string, number>
    isGenerative: boolean
    strategyName: string
    generativeReason: string
}

interface GeneratedData {
    companyName: string
    nodes: any[]
    edges: any[]
    cargo: any
    routes: GeneratedRoute[]
    summary: string
    recommendations: string[]
}

const greetingMessage = `Hi there! 👋 I'm your logistics advisor. I can help you analyze and optimize your supply chain — even without CSV data.

Let me ask you a few questions to understand your logistics needs. Then I'll generate routes, costs, and a full visual analysis for you.

**Let's start — what's your company name and what does it do?**`

// Progress steps to track conversation completeness
const PROGRESS_STEPS = [
    { id: 'company', label: 'Company', icon: Building2, keywords: ['company', 'business', 'industry', 'manufacture', 'produce'] },
    { id: 'origins', label: 'Origins', icon: MapPin, keywords: ['warehouse', 'factory', 'origin', 'ship from', 'located'] },
    { id: 'destinations', label: 'Destinations', icon: Target, keywords: ['deliver', 'destination', 'customer', 'distribute', 'ship to'] },
    { id: 'cargo', label: 'Cargo', icon: Package, keywords: ['weight', 'goods', 'product', 'shipment', 'package', 'unit'] },
    { id: 'transport', label: 'Transport', icon: Truck, keywords: ['truck', 'rail', 'sea', 'air', 'mode', 'transport'] },
]

export default function AIAdvisorPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: greetingMessage }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isReady, setIsReady] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedData, setGeneratedData] = useState<GeneratedData | null>(null)
    const [selectedRouteIdx, setSelectedRouteIdx] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [savedDataset, setSavedDataset] = useState<{ datasetId: string; scenarioId: string } | null>(null)
    const [showComparison, setShowComparison] = useState(false)
    const chatEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    // Calculate which progress steps are complete based on user messages
    const completedSteps = PROGRESS_STEPS.filter(step => {
        const allUserText = messages
            .filter(m => m.role === 'user')
            .map(m => m.content.toLowerCase())
            .join(' ')
        return step.keywords.some(kw => allUserText.includes(kw))
    })

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = { role: 'user', content: input.trim() }
        const updatedMessages = [...messages, userMessage]
        setMessages(updatedMessages)
        setInput('')
        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/ai-advisor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages,
                    phase: 'conversation'
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])

            if (data.isReady) {
                setIsReady(true)
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
            inputRef.current?.focus()
        }
    }

    const generateRoutes = async () => {
        setIsGenerating(true)
        setError(null)

        try {
            const res = await fetch('/api/ai-advisor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, phase: 'generate' })
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error)

            setGeneratedData(json.data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsGenerating(false)
        }
    }

    const saveToDataset = async () => {
        if (!generatedData || isSaving) return
        setIsSaving(true)
        setError(null)

        try {
            const res = await fetch('/api/ai-advisor/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: generatedData })
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error)

            setSavedDataset({ datasetId: json.datasetId, scenarioId: json.scenarioId })
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    const backToChat = () => {
        setGeneratedData(null)
        setSelectedRouteIdx(0)
        setSavedDataset(null)
        setIsReady(false)
    }

    const resetChat = () => {
        setMessages([{ role: 'assistant', content: greetingMessage }])
        setInput('')
        setIsReady(false)
        setGeneratedData(null)
        setSelectedRouteIdx(0)
        setError(null)
        setSavedDataset(null)
        setShowComparison(false)
    }

    const formatCurrency = (val: number) => `$${val?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}`

    // ── RESULTS VIEW ─────────────────────────────────────────────────
    if (generatedData) {
        const selectedRoute = generatedData.routes[selectedRouteIdx]

        return (
            <div className="container mx-auto px-6 py-8 max-w-7xl">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">
                            <Sparkles className="w-3 h-3" />
                            AI Generated Analysis
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
                            {generatedData.companyName}
                        </h1>
                        <p className="text-slate-500 text-sm font-medium mt-1 max-w-2xl">{generatedData.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={backToChat}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Refine
                        </button>

                        {savedDataset ? (
                            <button
                                onClick={() => router.push(`/dashboard?scenarioId=${savedDataset.scenarioId}`)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Open in Dashboard
                            </button>
                        ) : (
                            <button
                                onClick={saveToDataset}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/20"
                            >
                                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                {isSaving ? 'Saving...' : 'Save to Dashboard'}
                            </button>
                        )}

                        <button
                            onClick={resetChat}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            New
                        </button>
                    </div>
                </div>

                {/* Route Comparison Table */}
                {generatedData.routes.length > 1 && (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Route Comparison</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="text-[8px] font-black text-slate-400 uppercase tracking-widest py-2 px-3">Route</th>
                                        <th className="text-[8px] font-black text-slate-400 uppercase tracking-widest py-2 px-3">Cost</th>
                                        <th className="text-[8px] font-black text-slate-400 uppercase tracking-widest py-2 px-3">Time</th>
                                        <th className="text-[8px] font-black text-slate-400 uppercase tracking-widest py-2 px-3">CO2</th>
                                        <th className="text-[8px] font-black text-slate-400 uppercase tracking-widest py-2 px-3">Stops</th>
                                        <th className="text-[8px] font-black text-slate-400 uppercase tracking-widest py-2 px-3">Modes</th>
                                        <th className="text-[8px] font-black text-slate-400 uppercase tracking-widest py-2 px-3"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {generatedData.routes.map((route, idx) => {
                                        const isSelected = idx === selectedRouteIdx
                                        const isCheapest = route.totalCost === Math.min(...generatedData.routes.map(r => r.totalCost))
                                        const isFastest = route.totalTransitTime === Math.min(...generatedData.routes.map(r => r.totalTransitTime))
                                        const isGreenest = route.totalCO2 === Math.min(...generatedData.routes.map(r => r.totalCO2))

                                        return (
                                            <tr key={idx}
                                                onClick={() => setSelectedRouteIdx(idx)}
                                                className={`cursor-pointer transition-all ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                            >
                                                <td className="py-3 px-3">
                                                    <div className="text-xs font-black text-slate-900">{route.name || route.strategyName}</div>
                                                    <div className="text-[8px] font-bold text-slate-400 mt-0.5">{route.description?.slice(0, 60)}</div>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className={`text-sm font-black ${isCheapest ? 'text-emerald-600' : 'text-slate-900'}`}>
                                                        {formatCurrency(route.totalCost)}
                                                    </span>
                                                    {isCheapest && <div className="text-[7px] font-black text-emerald-600 uppercase">Cheapest</div>}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className={`text-sm font-black ${isFastest ? 'text-blue-600' : 'text-slate-900'}`}>
                                                        {(route.totalTransitTime || 0).toFixed(1)}h
                                                    </span>
                                                    {isFastest && <div className="text-[7px] font-black text-blue-600 uppercase">Fastest</div>}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className={`text-sm font-black ${isGreenest ? 'text-teal-600' : 'text-slate-900'}`}>
                                                        {(route.totalCO2 || 0).toFixed(1)} mT
                                                    </span>
                                                    {isGreenest && <div className="text-[7px] font-black text-teal-600 uppercase">Greenest</div>}
                                                </td>
                                                <td className="py-3 px-3 text-sm font-black text-slate-900">{route.pathDetails?.length || 0}</td>
                                                <td className="py-3 px-3">
                                                    <div className="flex gap-1 flex-wrap">
                                                        {route.modeBreakdown && Object.keys(route.modeBreakdown).map(mode => (
                                                            <span key={mode} className="bg-slate-100 text-slate-500 text-[7px] font-black uppercase px-1.5 py-0.5 rounded">{mode}</span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <button
                                                        className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                                    >
                                                        {isSelected ? 'Viewing' : 'View'}
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-12 gap-6">
                    {/* Left: Route Stops + Cargo */}
                    <div className="col-span-3 space-y-4">
                        {/* Route Stops */}
                        {selectedRoute && (
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                    {selectedRoute.name} — Route Stops
                                </h4>
                                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                                    {selectedRoute.pathDetails?.map((node: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-lg">
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${i === 0 ? 'bg-emerald-500' : i === selectedRoute.pathDetails.length - 1 ? 'bg-red-500' : 'bg-blue-500'}`} />
                                            <div className="min-w-0">
                                                <div className="text-[10px] font-black text-slate-900 truncate">{node.name}</div>
                                                <div className="text-[8px] font-bold text-slate-400 uppercase">{node.type} {node.mode ? `• via ${node.mode}` : ''}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Mode Breakdown */}
                        {selectedRoute?.modeBreakdown && (
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Cost by Mode</h4>
                                <div className="space-y-2">
                                    {Object.entries(selectedRoute.modeBreakdown).map(([mode, cost]) => (
                                        <div key={mode} className="flex justify-between items-center px-3 py-2 bg-slate-50 rounded-lg">
                                            <span className="text-[9px] font-black text-slate-500 uppercase">{mode}</span>
                                            <span className="text-[11px] font-black text-slate-900">{formatCurrency(cost as number)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Cargo Info */}
                        {generatedData.cargo && (
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Cargo</h4>
                                <div className="text-xs font-bold text-slate-700">{generatedData.cargo.description}</div>
                                <div className="flex justify-between mt-2 text-[9px] text-slate-500 font-bold">
                                    <span>{generatedData.cargo.packageCount?.toLocaleString()} units</span>
                                    <span>{generatedData.cargo.packageWeight} kg each</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Map + KPIs + Recommendations */}
                    <div className="col-span-9 space-y-6">
                        {/* KPIs */}
                        {selectedRoute && (
                            <div className="grid grid-cols-4 gap-3">
                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Cost</div>
                                    <div className="text-xl font-black text-slate-900">{formatCurrency(selectedRoute.totalCost)}</div>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Travel Time</div>
                                    <div className="text-xl font-black text-slate-900">{(selectedRoute.totalTransitTime || 0).toFixed(1)}h</div>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Carbon Emissions</div>
                                    <div className="text-xl font-black text-slate-900">{(selectedRoute.totalCO2 || 0).toFixed(1)} mT</div>
                                </div>
                                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stops</div>
                                    <div className="text-xl font-black text-slate-900">{selectedRoute.pathDetails?.length || 0}</div>
                                </div>
                            </div>
                        )}

                        {/* Map */}
                        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-[400px]">
                            {selectedRoute?.pathDetails && (
                                <LogisticsMap
                                    key={`ai-${selectedRouteIdx}`}
                                    scenarioPath={selectedRoute.pathDetails}
                                />
                            )}
                        </div>

                        {/* Recommendations */}
                        {generatedData.recommendations?.length > 0 && (
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                                <h4 className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-3">AI Recommendations</h4>
                                <div className="space-y-2">
                                    {generatedData.recommendations.map((rec, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <Sparkles className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                                            <span className="text-xs font-bold text-amber-900">{rec}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Network Stats */}
                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Network Overview</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-black text-slate-900">{generatedData.nodes?.length || 0}</div>
                                    <div className="text-[8px] font-bold text-slate-400 uppercase">Locations</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-black text-slate-900">{generatedData.edges?.length || 0}</div>
                                    <div className="text-[8px] font-bold text-slate-400 uppercase">Connections</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-black text-slate-900">{generatedData.routes?.length || 0}</div>
                                    <div className="text-[8px] font-bold text-slate-400 uppercase">Route Options</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ── CONVERSATION VIEW ────────────────────────────────────────────
    return (
        <div className="container mx-auto px-6 py-12 max-w-3xl">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                    <Sparkles className="w-3 h-3" />
                    AI Advisor
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-3">
                    Logistics <span className="text-amber-500">Intelligence</span>
                </h1>
                <p className="text-slate-500 font-medium max-w-md mx-auto">
                    No CSV needed. Tell me about your business and I'll build your supply chain analysis.
                </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {PROGRESS_STEPS.map((step, idx) => {
                    const isComplete = completedSteps.some(s => s.id === step.id)
                    const Icon = step.icon
                    return (
                        <div key={step.id} className="flex items-center gap-2">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${isComplete
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-400'
                                }`}>
                                <Icon className="w-3 h-3" />
                                {step.label}
                                {isComplete && <CheckCircle2 className="w-2.5 h-2.5" />}
                            </div>
                            {idx < PROGRESS_STEPS.length - 1 && (
                                <div className={`w-4 h-0.5 rounded-full ${isComplete ? 'bg-emerald-200' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Chat Area */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="h-[450px] overflow-y-auto p-6 space-y-4" id="chat-area">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[80%] rounded-2xl px-5 py-3.5 ${msg.role === 'user'
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-50 text-slate-800 border border-slate-100'
                                }`}>
                                {msg.role === 'assistant' && (
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Bot className="w-3 h-3 text-amber-500" />
                                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">AI Advisor</span>
                                    </div>
                                )}
                                <div className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                                    {msg.content.split('**').map((part, i) =>
                                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start animate-in fade-in duration-200">
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 flex items-center gap-3">
                                <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                                <span className="text-xs font-bold text-slate-400">Thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-slate-100 p-4">
                    {error && (
                        <div className="mb-3 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold">
                            {error}
                        </div>
                    )}

                    {isReady && !isGenerating ? (
                        <div className="space-y-3">
                            <button
                                onClick={generateRoutes}
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-2xl py-4 flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                            >
                                <BarChart3 className="w-5 h-5" />
                                Generate Routes & Analysis
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <div className="flex gap-3">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    placeholder="Or add more details..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={isLoading || !input.trim()}
                                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-3 transition-all disabled:opacity-30 shadow-md active:scale-95"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : isGenerating ? (
                        <div className="w-full bg-amber-50 rounded-2xl py-4 flex items-center justify-center gap-3 text-amber-600">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-black text-sm uppercase tracking-widest">Building your logistics network...</span>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder="Type your answer..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
                                disabled={isLoading}
                                autoFocus
                            />
                            <button
                                onClick={sendMessage}
                                disabled={isLoading || !input.trim()}
                                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-3 transition-all disabled:opacity-30 shadow-md active:scale-95"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    AI generates routes using real coordinates · Realistic cost estimates · Save results to your dashboard
                </p>
            </div>
        </div>
    )
}
