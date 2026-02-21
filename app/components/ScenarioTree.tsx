'use client'

import React, { useState, useEffect } from 'react'
import { GitFork, ChevronRight, ChevronDown, CheckCircle2, History } from 'lucide-react'

interface ScenarioNode {
    id: string
    name: string
    parent_scenario_id: string | null
    is_baseline: boolean
    created_at: string
    children: ScenarioNode[]
}

interface TreeProps {
    currentScenarioId: string
    onSelectScenario: (id: string) => void
    onFork: (id: string) => void
}

export default function ScenarioTree({ currentScenarioId, onSelectScenario, onFork }: TreeProps) {
    const [treeData, setTreeData] = useState<ScenarioNode[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchTree()
    }, [])

    async function fetchTree() {
        try {
            const res = await fetch('/api/scenarios/tree')
            const data = await res.json()

            // Build tree hierarchy
            const map: Record<string, ScenarioNode> = {}
            const roots: ScenarioNode[] = []

            data.forEach((s: any) => {
                map[s.id] = { ...s, children: [] }
            })

            data.forEach((s: any) => {
                if (s.parent_scenario_id && map[s.parent_scenario_id]) {
                    map[s.parent_scenario_id].children.push(map[s.id])
                } else {
                    roots.push(map[s.id])
                }
            })

            setTreeData(roots)
            // Expand current scenario path
            const path = findPath(roots, currentScenarioId)
            setExpandedIds(new Set(path))
        } catch (err) {
            console.error('Failed to load tree:', err)
        } finally {
            setLoading(false)
        }
    }

    function findPath(nodes: ScenarioNode[], targetId: string, currentPath: string[] = []): string[] {
        for (const node of nodes) {
            if (node.id === targetId) return [...currentPath, node.id]
            if (node.children.length > 0) {
                const found = findPath(node.children, targetId, [...currentPath, node.id])
                if (found.length > 0) return found
            }
        }
        return []
    }

    const toggleExpand = (id: string) => {
        const next = new Set(expandedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setExpandedIds(next)
    }

    const renderNode = (node: ScenarioNode, depth = 0) => {
        const isSelected = node.id === currentScenarioId
        const isExpanded = expandedIds.has(node.id)
        const hasChildren = node.children.length > 0

        return (
            <div key={node.id} className="select-none">
                <div
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg transition-all group cursor-pointer border ${isSelected
                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                        : 'hover:bg-slate-50 border-transparent'
                        }`}
                    style={{ marginLeft: `${depth * 16}px` }}
                >
                    <div
                        className="w-4 h-4 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(node.id)
                        }}
                    >
                        {hasChildren ? (isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />) : null}
                    </div>

                    <div
                        className="flex-1 flex items-center gap-2.5 overflow-hidden"
                        onClick={() => onSelectScenario(node.id)}
                    >
                        {node.is_baseline ? (
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        ) : (
                            <History className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                        )}
                        <span className={`text-[11px] font-bold uppercase tracking-tight truncate ${isSelected ? 'text-blue-900' : 'text-slate-500 group-hover:text-slate-700'
                            }`}>
                            {node.name}
                        </span>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onFork(node.id)
                        }}
                        className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-md transition-all ${isSelected ? 'hover:bg-blue-100 text-blue-600' : 'hover:bg-slate-200 text-slate-400 hover:text-slate-600'}`}
                        title="Duplicate Scenario"
                    >
                        <GitFork className="w-3 h-3" />
                    </button>
                </div>

                {isExpanded && node.children.map(child => renderNode(child, depth + 1))}
            </div>
        )
    }

    if (loading) return <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-50 rounded-lg w-full animate-pulse" />)}
    </div>

    return (
        <div className="space-y-1">
            {treeData.map(node => renderNode(node))}
        </div>
    )
}

