# System Foundation: Fuel-Price Resilient Logistics Digital Twin

**Version:** 0.1.0  
**Status:** DRAFT  
**Date:** 2026-02-20

---

## 1. Executive Summary

This document defines the architectural foundation for a production-grade **Fuel-Price Resilient Logistics Digital Twin**. The system purpose is to provide deterministic, auditable decision support for logistics operations, specifically modeling the impact of volatile fuel prices on transportation networks. It serves as a "flight simulator" for logistics managers to stress-test their supply chains against economic variables.

This is **not** a simple dashboard or visualization tool. It is a rigorous simulation environment where every computation must be reproducible.

---

## 2. System Goals

### 2.1 Primary Objectives
1.  **Deterministic Recomputation**: Given a set of `shipments`, `transport_routes`, and a specific `fuel_price_index` snapshot, the system must reproduce the exact same total cost and routing path.
2.  **Auditability & Provenance**: Every cost calculation must be attributable to a specific `carrier_id` pricing model and `fuel_sensitivity` factor from `transport_routes.csv`.
3.  **Scenario Replay**: Support for "Delta Scenarios" where users can modify `current_multiplier` in the fuel index to see the immediate ripple effect across 10,000+ active shipments.
4.  **Resilience Modeling**: Identify high-risk segments by correlating `volatility_factor` with `fuel_sensitivity`.

### 2.2 Performance Targets
-   **Graph Traversal**: Compute optimal cost path across `logistics_nodes` in < 100ms.
-   **Bulk Re-Pricing**: Update 10,000+ shipment costs in < 500ms using vectorized pricing logic.

---

## 3. Non-Goals

1.  **Real-Time Execution Control**: This system is for *Decision Support* (planning/strategy), not *Execution* (WMS/TMS). It will not directly dispatch trucks or print shipping labels.
2.  **Hardware Interface**: No direct integration with ELD (Electronic Logging Devices) or telematics hardware. Data ingestion happens via standardized APIs/ETL, not raw hardware streams.
3.  **General Purpose ERP**: We are not building SAP/Oracle. We focus strictly on the logistics physics and financial modeling layer.

---

## 4. Key Invariants

1.  **Conservation of Mass**: Total `volume_units` initiated at an origin must equal the sum of volume at destination + in-transit + at intermediate warehouses.
2.  **Non-Negative Time & Distance**: `distance_km` and `transit_time_hours` must be strictly positive.
3.  **Financial Integrity**: All costs use integer arithmetic (micros). `Route_Cost = Base_Cost + (Distance * Fuel_Sensitivity * Fuel_Price_Index)`.
4.  **Capacity Constraints**: `shipments.volume_units` through a node cannot exceed `base_throughput_capacity`.

---

## 5. Architectural Assumptions

1.  **Read-Dominant Workload**: We assume the system will be used for "What-If" planning more frequently than for updating the baseline network topology.
2.  **Acyclic-ish Graphs**: While the logistics network is large, we assume most cargo flows follow a generally directed path (Origin -> Transit Hub -> Destination), simplifying pathfinding optimization.
3.  **Centralized Simulation**: All authoritative recomputations happen on the Node.js backend. The Frontend may occasionally "optimistically" update for UI responsiveness but must always eventually sync with the Backend.
4.  **Sovereign Data**: Simulation inputs are treated as immutable for the duration of a specific run to prevent "mid-flight" data drift.

---

## 6. Architectural Overview

### 6.1 Tech Stack
-   **Frontend**: Next.js (App Router), React, TypeScript.
-   **Backend**: Node.js, Prisma ORM, PostgreSQL.
-   **Data Model**: For detailed entity definitions and relationships, refer to [DOMAIN_MODEL.md](./DOMAIN_MODEL.md).

### 6.2 Service Architecture
- **Simulation Engine**: Core logic for pathfinding and cost recomputation.
- **Scenario Management Service**: Manages scenario lifecycles, branching, and comparison. Detailed design in [SCENARIO_SERVICE.md](./SCENARIO_SERVICE.md).

---

## 7. System Principles

### 7.1 Determinism: The Golden Rule
The simulation engine must avoid any non-deterministic behavior. 
-   **Decimal Safety**: Use `BigInt` or decimal libraries for currency to avoid floating-point drift between Node.js and Next.js.
-   **Execution Order**: All CSV-sourced data must be indexed by ID to ensure consistent map/reduce operations.

### 7.2 Separation of Concerns
-   **The Brain (Backend)**: Authoritative source of route physics, pathfinding, and pricing.
-   **The Lens (Frontend)**: Responsible for the Map view (lat/long plotting) and Scenario parameter input.

---

## 8. Architectural Boundaries

| Feature | Frontend (Next.js App Router) | Backend (Node.js) |
| :--- | :--- | :--- |
| **Pathfinding** | Visual rendering of edges. | **Core Graph Logic (Dijkstra/A\*)**. |
| **Simulation State** | Client-side "Draft" state. | **Scenario Persistent Store**. |
| **Data Processing** | UI Filters/Aggregations. | **Vectorized Cost Calculation**. |
| **Pricing Secrets** | **HIDDEN**. Only displays results. | **OWNER**. Calculates carrier fees. |

### 8.1 Data Flow (The "Simulation Loop")
1.  **User Action**: User adjusts a "Fuel Price Slider" in UI.
2.  **Intent Dispatch**: Frontend sends `UpdateScenarioParams({ fuel_price_index: 1.2 })` to Backend.
3.  **Simulation Step**: Backend recalculates optimal paths and costs based on new weights.
4.  **State Broadcast**: Backend pushes new `SimulationSnapshot` to Frontend.
5.  **Render**: Frontend updates the map and charts.

---

## 9. Failure Modes & Safety Constraints

### 9.1 Failure Modes
1.  **Divergent Simulation**: Input parameters yield different results on different runs.
    -   *Mitigation*: Strict seeded RNG, containerized execution, no dependency on system clock/entropy.
2.  **Stale Data Ingestion**: The system uses outdated fuel indices during a critical planning phase.
    -   *Mitigation*: explicit "Data Freshness" timestamps on all input vectors. Warn user if data > 24h old.
3.  **Compute Exhaustion**: A complex scenario (e.g., "Traveling Salesman" on huge graph) hangs the server.
    -   *Mitigation*: Hard timeouts on simulation steps. Complexity caps on graph traversal depth.

### 9.2 Safety Constraints (Digital)
1.  **Graceful Degradation**: If the map tile server fails, the tabular data and charts must still function.
2.  **API Rate Limiting**: Prevent a single tenant from monopolizing simulation compute resources.
3.  **Input Sanitization**: Block impossible physics inputs (e.g., negative fuel consumption, infinite speed) at the API gateway level.
