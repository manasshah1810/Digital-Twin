'use client'

import React, { useMemo } from 'react'
import MapGL, { Source, Layer, Marker, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin } from 'lucide-react'

interface MapNode {
    id: string
    name: string
    latitude: number
    longitude: number
    type: string
}

interface Bottleneck {
    type: string
    nodeId: string
    entity: string
    severity: 'CRITICAL' | 'WARNING'
    impact: string
    utilization?: number
    marginalCost?: number
}

interface LogisticsMapProps {
    baselinePath?: MapNode[]
    scenarioPath?: MapNode[]
    bottlenecks?: Bottleneck[]
    onNodeClick?: (nodeId: string) => void
}

export default function LogisticsMap({
    baselinePath = [],
    scenarioPath = [],
    bottlenecks = [],
    onNodeClick
}: LogisticsMapProps) {
    const baselineGeoJSON = useMemo(() => {
        if (!baselinePath || baselinePath.length < 2) return null
        return {
            type: 'Feature' as const,
            properties: {},
            geometry: {
                type: 'LineString' as const,
                coordinates: baselinePath.map(n => [n.longitude || 0, n.latitude || 0])
            }
        }
    }, [baselinePath])

    const scenarioGeoJSON = useMemo(() => {
        if (!scenarioPath || scenarioPath.length < 2) return null
        return {
            type: 'Feature' as const,
            properties: {},
            geometry: {
                type: 'LineString' as const,
                coordinates: scenarioPath.map(n => [n.longitude || 0, n.latitude || 0])
            }
        }
    }, [scenarioPath])

    const allNodes = useMemo(() => {
        const nodesMap = new Map<string, MapNode>()
        if (baselinePath) baselinePath.forEach((n: MapNode) => nodesMap.set(n.id, n))
        if (scenarioPath) scenarioPath.forEach((n: MapNode) => nodesMap.set(n.id, n))
        return Array.from(nodesMap.values())
    }, [baselinePath, scenarioPath])

    // Calculate bounds to focus the map
    const initialViewState = useMemo(() => {
        if (allNodes.length === 0) {
            return {
                latitude: 39.8283,
                longitude: -98.5795,
                zoom: 3
            }
        }

        const validNodes = allNodes.filter(n => n.latitude != null && n.longitude != null)
        if (validNodes.length === 0) return { latitude: 39.8283, longitude: -98.5795, zoom: 3 }

        const lats = validNodes.map(n => n.latitude)
        const lngs = validNodes.map(n => n.longitude)

        return {
            latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
            longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
            zoom: 4
        }
    }, [allNodes])

    return (
        <div className="w-full h-[500px] rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl">
            <MapGL
                initialViewState={initialViewState}
                mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                style={{ width: '100%', height: '100%' }}
            >
                <NavigationControl position="top-right" />

                {/* Baseline Route (Gray) */}
                {baselineGeoJSON && (
                    <Source id="baseline-route" type="geojson" data={baselineGeoJSON}>
                        <Layer
                            id="baseline-line"
                            type="line"
                            paint={{
                                'line-color': '#4a4a4a',
                                'line-width': 3,
                                'line-opacity': 0.5,
                                'line-dasharray': [2, 2]
                            }}
                        />
                    </Source>
                )}

                {/* Scenario Route (Red) */}
                {scenarioGeoJSON && (
                    <Source id="scenario-route" type="geojson" data={scenarioGeoJSON}>
                        <Layer
                            id="scenario-line"
                            type="line"
                            paint={{
                                'line-color': '#ef4444',
                                'line-width': 5,
                                'line-opacity': 0.8
                            }}
                        />
                    </Source>
                )}

                {/* Nodes / Iterative Highlight */}
                {allNodes.map((node: MapNode) => {
                    const nodeBottleneck = bottlenecks.find(b => b.nodeId === node.id);
                    const isBottleneck = !!nodeBottleneck;
                    const isCritical = nodeBottleneck?.severity === 'CRITICAL';

                    return (
                        <Marker
                            key={node.id}
                            latitude={node.latitude || 0}
                            longitude={node.longitude || 0}
                            anchor="bottom"
                        >
                            <div
                                className="group cursor-pointer flex flex-col items-center"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onNodeClick?.(node.id)
                                }}
                            >
                                <div className="hidden group-hover:block absolute bottom-full mb-2 bg-black/95 border border-white/10 p-3 rounded-xl text-[10px] whitespace-nowrap z-50 shadow-2xl backdrop-blur-md">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between items-center gap-4">
                                            <span className="text-white font-black uppercase tracking-tighter">{node.name}</span>
                                            <span className="text-white/20 uppercase tracking-[0.2em]">{node.type}</span>
                                        </div>
                                        {isBottleneck && (
                                            <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                                                <div className={`font-black uppercase tracking-widest ${isCritical ? 'text-red-500' : 'text-amber-500'}`}>
                                                    System Alert: {nodeBottleneck.type.replace(/_/g, ' ')}
                                                </div>
                                                <div className="text-white/60 font-medium italic overflow-hidden text-ellipsis max-w-[200px]">{nodeBottleneck.impact}</div>
                                                {nodeBottleneck.utilization !== undefined && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}
                                                                style={{ width: `${nodeBottleneck.utilization}%` }}
                                                            />
                                                        </div>
                                                        <span className="font-mono text-white/40">{nodeBottleneck.utilization.toFixed(0)}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={`relative flex items-center justify-center p-1.5 rounded-full border shadow-lg transition-all group-hover:scale-125 ${isBottleneck
                                        ? (isCritical ? 'bg-red-600 border-red-400 animate-pulse' : 'bg-amber-600 border-amber-400')
                                        : (scenarioPath?.find(n => n.id === node.id) ? 'bg-red-600 border-red-500' : 'bg-white/10 border-white/20')
                                    }`}>
                                    <MapPin className="w-3 h-3 text-white" />
                                </div>
                            </div>
                        </Marker>
                    );
                })}
            </MapGL>

            {/* Map Legend */}
            <div className="absolute bottom-6 left-6 flex flex-col gap-2 p-4 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-1 bg-[#4a4a4a] border-t border-dashed border-white/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Baseline Baseline</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-1.5 bg-red-600 rounded-full shadow-lg shadow-red-600/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Selected Candidate</span>
                </div>
            </div>
        </div>
    )
}
