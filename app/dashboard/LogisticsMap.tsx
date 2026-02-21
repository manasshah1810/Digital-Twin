'use client'

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Map as MapLibreMap, Source, Layer, Marker, NavigationControl, MapRef } from 'react-map-gl/maplibre'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin, Info, Activity, Ship, Truck, Train, Plane, Maximize2, CheckCircle } from 'lucide-react'

interface MapNode {
    id: string
    name: string
    latitude: number
    longitude: number
    type: string
    utilization?: number
    mode?: string
    metadata?: {
        instruction?: string
    }
}

interface Bottleneck {
    type: string
    nodeId: string
    entity: string
    severity: 'CRITICAL' | 'WARNING' | 'INFO'
    impact: string
    utilization?: number
    marginalCost?: number
}

interface LogisticsMapProps {
    baselinePath?: MapNode[]
    scenarioPath?: MapNode[]
    bottlenecks?: Bottleneck[]
    closedNodeIds?: string[]
    onNodeClick?: (nodeId: string) => void
}

export default function LogisticsMap({
    baselinePath = [],
    scenarioPath = [],
    bottlenecks = [],
    closedNodeIds = [],
    onNodeClick
}: LogisticsMapProps) {
    const [viewState, setViewState] = useState({
        latitude: 20,
        longitude: 80,
        zoom: 3.5
    })
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
    const mapRef = useRef<MapRef>(null)

    const scenarioGeoJSON = useMemo(() => {
        if (!scenarioPath || scenarioPath.length < 2) return null
        const coordinates: [number, number][] = []
        for (let i = 0; i < scenarioPath.length - 1; i++) {
            const start = scenarioPath[i]
            const end = scenarioPath[i + 1]
            if (!start || !end) continue

            // Critical LngLat Guard
            if (typeof start.latitude !== 'number' || typeof start.longitude !== 'number' ||
                typeof end.latitude !== 'number' || typeof end.longitude !== 'number' ||
                isNaN(start.latitude) || isNaN(start.longitude) || isNaN(end.latitude) || isNaN(end.longitude)) continue

            const endMode = (end.mode || '').toLowerCase()
            const startMode = (start.mode || '').toLowerCase()
            const isNautical = (end as any).isNautical || endMode.includes('sea') || endMode.includes('maritim') || endMode.includes('vessel') || startMode.includes('sea')

            if (isNautical) {
                // High-Fidelity Nautical Arc Generation
                const pts = 16
                const midLat = (start.latitude + end.latitude) / 2
                const midLon = (start.longitude + end.longitude) / 2

                // Nautical Arc Physics: Dip scales with distance to prevent clipping on short hops
                const distV = Math.sqrt(Math.pow(end.latitude - start.latitude, 2) + Math.pow(end.longitude - start.longitude, 2))

                // For coastal/local segments, keep dip minimal. For global lanes, use a full strategic curve.
                const dipScale = distV < 8 ? 0.05 : 0.4
                const dipMagnitude = Math.min(distV * dipScale, 10.0)

                const controlLat = midLat - (start.longitude < 120 ? dipMagnitude : 0)
                const controlLon = midLon + (start.latitude > 15 ? dipMagnitude / 3 : 0)

                for (let j = 0; j <= pts; j++) {
                    const t = j / pts
                    const lat = (1 - t) * (1 - t) * start.latitude + 2 * (1 - t) * t * controlLat + t * t * end.latitude
                    const lon = (1 - t) * (1 - t) * start.longitude + 2 * (1 - t) * t * controlLon + t * t * end.longitude
                    coordinates.push([lon, lat])
                }
            } else {
                coordinates.push([start.longitude, start.latitude])
            }

            if (i === scenarioPath.length - 2) {
                coordinates.push([end.longitude, end.latitude])
            }
        }
        if (coordinates.length < 2) return null
        return { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates } }
    }, [scenarioPath])

    const baselineGeoJSON = useMemo(() => {
        if (!baselinePath || baselinePath.length < 2) return null
        const coordinates: [number, number][] = baselinePath
            .filter(n => typeof n.latitude === 'number' && typeof n.longitude === 'number' && !isNaN(n.latitude) && !isNaN(n.longitude))
            .map(n => [n.longitude, n.latitude] as [number, number])

        if (coordinates.length < 2) return null
        return { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates } }
    }, [baselinePath])

    const midpoints = useMemo(() => {
        if (!scenarioPath || scenarioPath.length < 2) return []
        const pts = []
        for (let i = 0; i < scenarioPath.length - 1; i++) {
            const u = scenarioPath[i], v = scenarioPath[i + 1]
            if (typeof u.latitude !== 'number' || typeof v.latitude !== 'number' || isNaN(u.latitude) || isNaN(v.latitude)) continue
            pts.push({ lat: (u.latitude + v.latitude) / 2, lon: (u.longitude + v.longitude) / 2, mode: v.mode || 'truck' })
        }
        return pts
    }, [scenarioPath])

    const allNodes = useMemo(() => {
        const nodesMap = new Map<string, MapNode>()
        const primaryPath = (scenarioPath && scenarioPath.length > 0) ? scenarioPath : baselinePath
        if (primaryPath) {
            primaryPath.forEach((n: MapNode) => {
                if (typeof n.latitude === 'number' && typeof n.longitude === 'number' && !isNaN(n.latitude) && !isNaN(n.longitude)) {
                    nodesMap.set(n.id, n)
                }
            })
        }
        return Array.from(nodesMap.values())
    }, [baselinePath, scenarioPath])

    useEffect(() => {
        const focusNodes = (scenarioPath && scenarioPath.length > 0) ? scenarioPath : allNodes
        if (focusNodes.length > 0) {
            const valid = focusNodes.filter(n => typeof n.latitude === 'number' && !isNaN(n.latitude))
            if (valid.length > 0) {
                const lats = valid.map(n => n.latitude), lngs = valid.map(n => n.longitude)
                setViewState(prev => ({
                    ...prev,
                    latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
                    longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
                    zoom: 4.5
                }))
            }
        }
    }, [scenarioPath, allNodes])

    useEffect(() => {
        if (!scenarioGeoJSON || !mapRef.current) return
        const coords = scenarioGeoJSON.geometry.coordinates as [number, number][]
        if (coords.length < 2) return

        let totalDist = 0
        const segments: {
            start: [number, number],
            end: [number, number],
            dx: number,
            dy: number,
            dist: number,
            cumulativeDist: number
        }[] = []
        for (let i = 0; i < coords.length - 1; i++) {
            const dx = coords[i + 1][0] - coords[i][0]
            const dy = coords[i + 1][1] - coords[i][1]
            const d = Math.sqrt(dx * dx + dy * dy)
            totalDist += d
            segments.push({ start: coords[i], end: coords[i + 1], dx, dy, dist: d, cumulativeDist: totalDist })
        }

        if (totalDist === 0) return

        let animationId: number
        let startTime: number | null = null
        const duration = Math.min(Math.max(totalDist * 80, 2000), 8000)

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const progress = ((timestamp - startTime) % duration) / duration
            const targetDist = progress * totalDist

            let currentSegment = segments[0]
            let prevDist = 0
            for (let i = 0; i < segments.length; i++) {
                if (targetDist <= segments[i].cumulativeDist) {
                    currentSegment = segments[i]
                    break
                }
                prevDist = segments[i].cumulativeDist
            }

            const segmentProgress = currentSegment.dist > 0 ? (targetDist - prevDist) / currentSegment.dist : 0
            const currentLon = currentSegment.start[0] + currentSegment.dx * segmentProgress
            const currentLat = currentSegment.start[1] + currentSegment.dy * segmentProgress

            const map = mapRef.current?.getMap()
            if (map && map.getSource('animated-pulse-source')) {
                const source = map.getSource('animated-pulse-source') as maplibregl.GeoJSONSource
                source.setData({
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        properties: {},
                        geometry: { type: 'Point', coordinates: [currentLon, currentLat] }
                    }]
                })
            }
            animationId = requestAnimationFrame(animate)
        }
        animationId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationId)
    }, [scenarioGeoJSON])

    const getModeIcon = (mode: string) => {
        const m = mode.toLowerCase()
        if (m.includes('sea') || m.includes('maritim') || m.includes('vessel')) return <Ship className="w-3.5 h-3.5 text-white" />
        if (m.includes('rail') || m.includes('train')) return <Train className="w-3.5 h-3.5 text-white" />
        if (m.includes('air') || m.includes('flight') || m.includes('plane')) return <Plane className="w-3.5 h-3.5 text-white" />
        return <Truck className="w-3.5 h-3.5 text-white" />
    }

    return (
        <div className="w-full h-[600px] rounded-3xl overflow-hidden border border-surface-200 relative shadow-2xl bg-surface-50 group">
            <MapLibreMap
                ref={mapRef}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
                style={{ width: '100%', height: '100%' }}
                onClick={() => setSelectedNodeId(null)}
                mapLib={maplibregl}
            >
                <NavigationControl position="bottom-right" showCompass={false} />

                {/* Baseline Comparison Path */}
                {baselineGeoJSON && (
                    <Source id="baseline-route-source" type="geojson" data={baselineGeoJSON}>
                        <Layer
                            id="baseline-line-layer"
                            type="line"
                            paint={{
                                'line-color': '#94a3b8',
                                'line-width': 2,
                                'line-dasharray': [3, 2],
                                'line-opacity': 0.4
                            }}
                        />
                    </Source>
                )}

                {/* Scenario Primary Route - Glow/Halo */}
                {scenarioGeoJSON && (
                    <Source id="scenario-glow-source" type="geojson" data={scenarioGeoJSON}>
                        <Layer
                            id="scenario-glow-layer"
                            type="line"
                            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                            paint={{
                                'line-color': '#6366f1',
                                'line-width': 14,
                                'line-opacity': 0.15,
                                'line-blur': 8
                            }}
                        />
                    </Source>
                )}

                {/* Scenario Primary Route */}
                {scenarioGeoJSON && (
                    <Source id="scenario-route-source" type="geojson" data={scenarioGeoJSON}>
                        <Layer
                            id="scenario-line-layer"
                            type="line"
                            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                            paint={{
                                'line-color': '#4338ca',
                                'line-width': 5,
                                'line-opacity': 1.0
                            }}
                        />
                    </Source>
                )}

                {/* Animated dash overlay (ant trail effect) */}
                {scenarioGeoJSON && (
                    <Source id="scenario-dash-source" type="geojson" data={scenarioGeoJSON}>
                        <Layer
                            id="scenario-dash-layer"
                            type="line"
                            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                            paint={{
                                'line-color': '#a5b4fc',
                                'line-width': 3,
                                'line-dasharray': [2, 4],
                                'line-opacity': 0.9
                            }}
                        />
                    </Source>
                )}

                {/* Real-time Pulse Orb */}
                {scenarioGeoJSON && (
                    <Source id="animated-pulse-source" type="geojson" data={{ type: 'FeatureCollection', features: [] }}>
                        <Layer
                            id="animated-pulse-glow"
                            type="circle"
                            paint={{
                                'circle-radius': 12,
                                'circle-color': '#4f46e5',
                                'circle-opacity': 0.5,
                                'circle-blur': 1,
                                'circle-pitch-alignment': 'map'
                            }}
                        />
                        <Layer
                            id="animated-pulse-core"
                            type="circle"
                            paint={{
                                'circle-radius': 4,
                                'circle-color': '#ffffff',
                                'circle-stroke-width': 2,
                                'circle-stroke-color': '#4f46e5',
                                'circle-pitch-alignment': 'map'
                            }}
                        />
                    </Source>
                )}

                {midpoints.map((mid, idx) => (
                    <Marker key={idx} latitude={mid.lat} longitude={mid.lon} anchor="center">
                        <div className="bg-surface-700 p-1.5 rounded-lg shadow-xl border border-white/30 scale-90 hover:scale-110 transition-transform cursor-help group/mode relative">
                            {getModeIcon(mid.mode)}
                            <div className="absolute bottom-full left-1/2 -transurface-x-1/2 mb-2 hidden group-hover/mode:block bg-surface-900 text-white text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest whitespace-nowrap">
                                {mid.mode.toUpperCase()} Segment
                            </div>
                        </div>
                    </Marker>
                ))}

                {allNodes.map((node: MapNode) => {
                    const nodeBottleneck = bottlenecks.find(b => b.nodeId === node.id)
                    const isClosed = closedNodeIds.includes(node.id)
                    const utilization = nodeBottleneck?.utilization ?? node.utilization ?? 0
                    const isSelected = selectedNodeId === node.id
                    const instruction = node.metadata?.instruction

                    return (
                        <Marker key={node.id} latitude={node.latitude} longitude={node.longitude} anchor="bottom">
                            <div className="group/marker cursor-pointer flex flex-col items-center" onClick={(e) => { e.stopPropagation(); setSelectedNodeId(isSelected ? null : node.id); onNodeClick?.(node.id) }}>
                                <div className={`${isSelected ? 'block' : 'hidden group-hover/marker:block'} absolute bottom-full mb-3 bg-white border border-surface-200 p-5 rounded-2xl text-[11px] z-50 shadow-2xl min-w-[260px]`}>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex justify-between items-start gap-4 border-b border-surface-100 pb-3 text-surface-900">
                                            <div>
                                                <div className="font-black uppercase tracking-tight text-xs">{node.name}</div>
                                                <div className="text-surface-400 font-bold uppercase text-[9px] tracking-widest mt-0.5">{node.type}</div>
                                            </div>
                                            <div className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-surface-50 text-surface-600">
                                                {isClosed ? 'OFFLINE' : `${utilization.toFixed(0)}% Load`}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {instruction && (
                                                <div className="p-3 bg-surface-50/50 rounded-xl border border-surface-100 text-surface-900 leading-relaxed font-bold text-[10px]">
                                                    <div className="flex items-center gap-2 mb-1.5 font-black uppercase tracking-widest text-[8px] text-surface-600">
                                                        <Activity className="w-3 h-3" /> Master Plan Halt
                                                    </div>
                                                    {instruction}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={`relative flex items-center justify-center p-2 rounded-full border shadow-xl transition-all ${isClosed ? 'bg-surface-200' : (scenarioPath?.some(n => n.id === node.id) ? 'bg-surface-600 border-surface-400' : 'bg-surface-50')}`}>
                                    <MapPin className={`w-4 h-4 ${isClosed ? 'text-surface-500' : (scenarioPath?.some(n => n.id === node.id) ? 'text-white' : 'text-surface-400')}`} />
                                </div>
                            </div>
                        </Marker>
                    )
                })}
            </MapLibreMap>

            <div className="absolute top-6 left-6 flex flex-col items-start gap-4 pointer-events-none">
                <div className="h-10 w-10 bg-white/95 backdrop-blur-xl border border-surface-200 rounded-xl shadow-xl flex items-center justify-center pointer-events-auto shadow-surface-500/10">
                    <Info className="w-5 h-5 text-surface-600" />
                </div>
            </div>

            <div className="absolute bottom-10 left-10 flex items-center gap-4 px-6 py-3 bg-surface-900/95 backdrop-blur-2xl rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white/80 border border-white/10 shadow-2xl">
                <Maximize2 className="w-4 h-4 text-surface-400" />
                <span>AI STRATEGIC NETWORK MAPPING</span>
                {scenarioGeoJSON && (
                    <div className="flex items-center gap-1.5 ml-2 border-l border-white/20 pl-4 text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="animate-pulse">Active Path Synchronized</span>
                    </div>
                )}
            </div>
        </div>
    )
}
