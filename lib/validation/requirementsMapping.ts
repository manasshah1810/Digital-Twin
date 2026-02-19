export interface Requirement {
    id: string;
    section: string;
    description: string;
    implementation_feature: string;
    status: 'IMPLEMENTED' | 'PARTIAL' | 'MISSING' | 'N/A';
    technical_source?: string;
}

export const SYSTEM_REQUIREMENTS: Requirement[] = [
    {
        id: 'REQ-001',
        section: 'System Goals - 2.1',
        description: 'Deterministic Recomputation: Reproduce exact same total cost and routing path.',
        implementation_feature: 'Dijkstra Engine + Immutable Baseline Snapshots',
        status: 'IMPLEMENTED',
        technical_source: 'lib/optimization/dijkstra.ts'
    },
    {
        id: 'REQ-002',
        section: 'System Goals - 2.1',
        description: 'Auditability & Provenance: Every cost calculation must be attributable.',
        implementation_feature: 'decision_traces table + LLM Explanations',
        status: 'IMPLEMENTED',
        technical_source: 'app/api/optimize/route.ts'
    },
    {
        id: 'REQ-003',
        section: 'System Goals - 2.1',
        description: 'Scenario Replay: Support for Delta Scenarios (Fuel Price Shocks).',
        implementation_feature: 'Scenario Branching API + Fuel Multiplier logic',
        status: 'IMPLEMENTED',
        technical_source: 'app/api/scenarios/[id]/fork/route.ts'
    },
    {
        id: 'REQ-004',
        section: 'System Goals - 2.1',
        description: 'Resilience Modeling: Identify high-risk segments (volatility vs sensitivity).',
        implementation_feature: 'Tactical Constraint Engine (Hyper-shock alerts)',
        status: 'IMPLEMENTED',
        technical_source: 'lib/graph/applyConstraints.ts'
    },
    {
        id: 'REQ-005',
        section: 'Performance Targets - 2.2',
        description: 'Graph Traversal: Compute optimal cost path in < 100ms.',
        implementation_feature: 'Dijkstra with Adjacency List indexing',
        status: 'PARTIAL', // We haven't added a benchmark display yet
        technical_source: 'lib/optimization/dijkstra.ts'
    },
    {
        id: 'REQ-006',
        section: 'Key Invariants - 4.1',
        description: 'Conservation of Mass: volume units must be conserved.',
        implementation_feature: 'Single-route optimization (Mass conservation is implicit for single shipment)',
        status: 'PARTIAL', // Network-wide flow conservation not yet implemented
        technical_source: 'N/A'
    },
    {
        id: 'REQ-007',
        section: 'Key Invariants - 4.3',
        description: 'Financial Integrity: Precision cost calculations using integer/decimal micros.',
        implementation_feature: 'Supabase Decimal types + Backend Number conversion',
        status: 'IMPLEMENTED',
        technical_source: 'supabase/migrations/001_init_digital_twin.sql'
    },
    {
        id: 'REQ-008',
        section: 'Key Invariants - 4.4',
        description: 'Capacity Constraints: Shipments cannot exceed node capacity.',
        implementation_feature: 'Edge Capacity Throttling within Dijkstra loop',
        status: 'IMPLEMENTED',
        technical_source: 'lib/optimization/dijkstra.ts'
    },
    {
        id: 'REQ-009',
        section: 'System Principles - 7.1',
        description: 'Determinism: Avoid floating-point drift between Node and Next.js.',
        implementation_feature: 'Manual precision handling in API layer',
        status: 'PARTIAL', // Floating point is still used in JS layer, should move to Decimal.js
        technical_source: 'app/api/optimize/route.ts'
    },
    {
        id: 'REQ-010',
        section: 'Failure Modes - 9.1',
        description: 'Disconnected Graph Handling: No silent failures for unreachable routes.',
        implementation_feature: 'REACHABILITY_ERROR with diagnostics',
        status: 'IMPLEMENTED',
        technical_source: 'app/api/optimize/route.ts'
    },
    {
        id: 'REQ-011',
        section: 'Baselines',
        description: 'Immutable Baseline Locking: Ensure comparison reference is stable.',
        implementation_feature: 'baseline_routes table + getOrSetBaselineSnapshot',
        status: 'IMPLEMENTED',
        technical_source: 'lib/optimization/baselineSnapshot.ts'
    }
];
