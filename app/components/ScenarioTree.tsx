'use client'

import React, { useState, useEffect } from 'react'
import { GitFork, ChevronRight, ChevronDown, Database, Activity } from 'lucide-react'

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
                    className={`flex items-center gap-2 py-2 px-3 rounded-xl transition-all group cursor-pointer ${isSelected ? 'bg-red-600/20 border border-red-500/30' : 'hover:bg-white/5 border border-transparent'
                        }`}
                    style={{ marginLeft: `${depth * 20}px` }}
                >
                    <div
                        className="w-4 h-4 flex items-center justify-center text-white/20 hover:text-white transition-colors"
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(node.id)
                        }}
                    >
                        {hasChildren ? (isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) : null}
                    </div>

                    <div
                        className="flex-1 flex items-center gap-3 overflow-hidden"
                        onClick={() => onSelectScenario(node.id)}
                    >
                        {node.is_baseline ? (
                            <Database className={`w-3.5 h-3.5 ${isSelected ? 'text-red-500' : 'text-blue-500'}`} />
                        ) : (
                            <Activity className={`w-3.5 h-3.5 ${isSelected ? 'text-red-500' : 'text-emerald-500'}`} />
                        )}
                        <span className={`text-[11px] font-black uppercase tracking-tighter truncate ${isSelected ? 'text-white' : 'text-white/40 group-hover:text-white/60'
                            }`}>
                            {node.name}
                        </span>
                    </div>

                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onFork(node.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-red-500"
                        title="Fork Scenario"
                    >
                        <GitFork className="w-3 h-3" />
                    </button>
                </div>

                {isExpanded && node.children.map(child => renderNode(child, depth + 1))}
            </div>
        )
    }

    if (loading) return <div className="animate-pulse space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-10 bg-white/5 rounded-xl w-full" />)}
    </div>

    return (
        <div className="space-y-1">
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 px-3">Scenario Lineage</h3>
            {treeData.map(node => renderNode(node))}
        </div>
    )
}
