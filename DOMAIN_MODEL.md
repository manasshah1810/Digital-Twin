# Domain Data Model: Logistics Digital Twin

## 1. Architectural Strategy: Immutable Snapshots

To meet the requirements for **deterministic replay** and **auditability**, we adopt a "Parent-Child Snapshot" strategy for Scenarios.

### 1.1 Model Versioning Logic
- **Baseline (Global)**: The "Current State of the World" (Nodes, Edges, Carriers).
- **Scenario (Local)**: A collection of "Overridden Params". A Scenario does not mutate the baseline; it overlays it.
- **Optimization Result**: A frozen snapshot of the simulation output linked to the exact state of inputs used.

---

## 2. Entity Relationship Diagram (Conceptual)

- `LogisticsNode` 1 --- N `RouteEdge` (Source)
- `LogisticsNode` 1 --- N `RouteEdge` (Destination)
- `RouteEdge` N --- 1 `CarrierRate` (By Mode/Region)
- `Scenario` 1 --- N `OptimizationResult`
- `OptimizationResult` 1 --- N `DecisionTrace` (Audit log of Dijkstra/Pathing choices)
- **Lifecycle Management**: Detailed in [SCENARIO_SERVICE.md](./SCENARIO_SERVICE.md).

---

## 3. Prisma Schema Definition

```prisma
// ---------------------------------------------
// Reference Data (The Physical Network)
// ---------------------------------------------

model LogisticsNode {
  id                   String      @id @default(uuid())
  name                 String
  type                 NodeType    // WAREHOUSE, PORT, RAIL_HUB
  latitude             Decimal
  longitude            Decimal
  baseThroughput       Int         // volume units per window
  handlingCostMicros   BigInt      // Integer cents/micros for precision
  
  routesFrom           RouteEdge[] @relation("OriginNode")
  routesTo             RouteEdge[] @relation("DestinationNode")
  
  @@index([latitude, longitude])
}

model RouteEdge {
  id                   String         @id @default(uuid())
  fromNodeId           String
  toNodeId             String
  transportMode        TransportMode  // TRUCK, RAIL, SEA, AIR
  distanceKm           Decimal
  fuelSensitivity      Decimal        // 0.0 to 1.0 (How much fuel price affects cost)
  
  origin               LogisticsNode  @relation("OriginNode", fields: [fromNodeId], references: [id])
  destination          LogisticsNode  @relation("DestinationNode", fields: [toNodeId], references: [id])
  
  @@index([fromNodeId, toNodeId])
}

// ---------------------------------------------
// Pricing & Market Data
// ---------------------------------------------

model FuelIndex {
  id                String   @id @default(uuid())
  region            String   // APAC, EU, NA
  fuelType          String   // DIESEL, BUNKER_FUEL
  currentMultiplier Decimal  @default(1.0)
  updatedAt         DateTime @updatedAt
  
  @@index([region, fuelType])
}

model CarrierRate {
  id               String        @id @default(uuid())
  carrierName      String
  transportMode    TransportMode
  costPerKmMicros  BigInt
  isFuelIndexed    Boolean       @default(true)
  reliabilityScore Decimal       @default(0.95)
}

// ---------------------------------------------
// Simulation & Scenarios (The Digital Twin "State")
// ---------------------------------------------

model Scenario {
  id               String               @id @default(uuid())
  name             String
  description      String?
  parentScenarioId String?              // For branching/What-if analysis
  status           ScenarioStatus       @default(DRAFT)
  
  // Scenario Overrides (JSONB for extensibility without schema bloat)
  // Stores specific deltas e.g., "Fuel Price +20%" or "Node X capacity -50%"
  parameterDeltas  Json
  
  results          OptimizationResult[]
  createdAt        DateTime             @default(now())
  
  @@index([parentScenarioId])
}

model OptimizationResult {
  id               String          @id @default(uuid())
  scenarioId       String
  runTimestamp     DateTime        @default(now())
  
  totalCostMicros  BigInt
  totalCO2         Decimal
  avgTransitTime   Decimal
  
  decisionTraces   DecisionTrace[]
  scenario         Scenario        @relation(fields: [scenarioId], references: [id])
  
  @@index([scenarioId, runTimestamp])
}

model DecisionTrace {
  id                   String             @id @default(uuid())
  optimizationResultId String
  shipmentId           String
  
  // The "Why": Deterministic pathing evidence
  selectedRouteId      String
  calculatedCostMicros BigInt
  rationale            String             // e.g., "Least-cost path with current fuel index 1.25"
  alternatives         Json               // Top 3 rejected paths for audit
  
  result               OptimizationResult @relation(fields: [optimizationResultId], references: [id])
}

enum NodeType { Warehouse; Port; RailHub; DistributionCenter }
enum TransportMode { Truck; Rail; Sea; Air }
enum ScenarioStatus { Draft; Active; Published; Archived }
```

---

## 4. Indexing Strategy & Reasoning

### 4.1 Graph Traversal Optimization
- **`RouteEdge(fromNodeId, toNodeId)`**: Critical for Dijkstra/A* pathfinding. Without this index, every hop in a 1,000-node graph would require a full table scan.
- **`LogisticsNode(latitude, longitude)`**: Supports "Radius Search" (e.g., "find all hubs within 200km of this disrupted node").

### 4.2 Audit & Versioning
- **`Scenario(parentScenarioId)`**: Enables the "Branching Tree" view in the UI, allowing users to see how one strategy derived from another.
- **`OptimizationResult(scenarioId, runTimestamp)`**: Ensures that looking up the "last successful run" for a scenario is an $O(log N)$ operation.

---

## 5. Deterministic Replay Protocol

To replay a result, the system must:
1. Load the `OptimizationResult`.
2. Retrieve the `Scenario` and its `parameterDeltas`.
3. Locate the **Temporal State** of `RouteEdge` and `FuelIndex` at the time of `runTimestamp`.
4. Re-run the engine using the same **Seeded Randomness** (stored in `parameterDeltas` if applicable).
5. Compare the output `DecisionTrace` with the original log. A bit-perfect match confirms system integrity.
