'use client'

import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, X, Bot, User, RefreshCw, ChevronRight } from 'lucide-react'

interface Message {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
}

export default function SimulationChatbot({ scenarioId, currentResult }: { scenarioId?: string, currentResult?: any }) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Hello! I am your Logistics Intelligence Assistant. Ask me anything about your current simulation, route trade-offs, or network impact.',
            timestamp: new Date()
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isOpen])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: input,
                    context: {
                        scenarioId,
                        result: currentResult
                    }
                })
            })

            const data = await response.json()

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.reply,
                timestamp: new Date()
            }
            setMessages(prev => [...prev, assistantMsg])
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I encountered a synchronization error with the network matrix. Please try again.",
                timestamp: new Date()
            }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-96 h-[500px] bg-white border border-surface-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="p-4 bg-surface-900 text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-surface-600 rounded-xl flex items-center justify-center">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-xs font-black uppercase tracking-widest">Digital Twin AI</div>
                                <div className="text-[10px] text-surface-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active Intelligence
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-50 shadow-inner">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-surface-100 text-surface-600' : 'bg-white border border-surface-200 text-surface-400'}`}>
                                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-[11px] leading-relaxed font-bold ${msg.role === 'user'
                                            ? 'bg-surface-600 text-white rounded-tr-none'
                                            : 'bg-white border border-surface-200 text-surface-700 shadow-sm rounded-tl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex gap-2 items-center bg-white border border-surface-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                                    <RefreshCw className="w-3 h-3 text-surface-600 animate-spin" />
                                    <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Synthesizing...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 bg-white border-t border-surface-100">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Query network dynamics..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                className="w-full bg-surface-50 border border-surface-200 rounded-2xl px-4 py-3 text-xs font-bold text-surface-700 focus:outline-none focus:ring-2 focus:ring-surface-600/20 focus:border-surface-600 placeholder:text-surface-400"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 top-1.5 p-2 bg-surface-600 text-white rounded-xl hover:bg-surface-700 transition-all disabled:opacity-50"
                            >
                                <Send className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 ${isOpen ? 'bg-surface-900 text-white' : 'bg-surface-600 text-white'
                    }`}
            >
                <div className="relative">
                    <MessageSquare className="w-5 h-5" />
                    {!isOpen && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-surface-600" />}
                </div>
                <span className="text-xs font-black uppercase tracking-widest">Network Advisor</span>
            </button>
        </div>
    )
}
