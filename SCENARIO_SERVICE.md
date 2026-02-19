# Scenario Management Service Design

## 1. Service Concept: The "Virtual Branch" Factory

The Scenario Management Service manages the lifecycle of simulation environments. It treats the global logistics network as a "Main" branch and user scenarios as "Virtual Branches" that carry delta parameters (e.g., fuel price spikes, node closures).

---

## 2. API Contracts (REST Architectural Style)

### 2.1 Scenario Lifecycle
| Method | Endpoint | Description | Permission |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/scenarios` | Create a new scenario from baseline. | Analyst |
| `GET` | `/api/scenarios` | List scenarios (paginated). | Viewer |
| `GET` | `/api/scenarios/[id]` | Get scenario detail + parameter deltas. | Viewer |
| `POST` | `/api/scenarios/[id]/clone` | Deep copy scenario into a new branch. | Analyst |
| `PATCH` | `/api/scenarios/[id]` | Update scenario metadata or deltas (if not locked). | Analyst |
| `DELETE` | `/api/scenarios/[id]` | Soft delete scenario. | Admin |
| `POST` | `/api/scenarios/[id]/lock` | Freeze scenario for official reporting. | Admin |

### 2.2 Comparison & Analysis
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/analysis/compare` | JSON body: `{ baseScenarioId, targetScenarioId }`. Returns delta metrics (Cost %, CO2 %, Delay %). |

---

## 3. Backend Service Responsibilities

### 3.1 Data Integrity & Locking
- **Baseline Protection**: The service must enforce a hard-coded check: `if (scenario.isBaseline) throw ForbiddenError`. Baseline changes only happen via system-level ETL.
- **State Transition Management**: Prevents editing a scenario that has a "Published" or "Locked" status.

### 3.2 Delta Resolution Engine
- When a simulation starts, the service resolves the "Effective Parameters":
  - Start with `BaselineData`.
  - Apply `Scenario.parameterDeltas`.
  - Return a consolidated `SimulationExecutionBundle` to the Simulation Engine.

### 3.3 Audit Trail (Decision Tracing)
- Every time a scenario is modified, a record is added to `ScenarioHistory` with `userId` and `timestamp`.

---

## 4. Frontend Interaction Flow (Next.js)

1. **Dashboard (The Library)**: User browses a list of existing scenarios with high-level KPIs from their last `OptimizationResult`.
2. **The "Playground"**:
   - User opens a Scenario.
   - UI displays "Baseline" vs. "Delta" sliders (e.g., "Current Fuel Multiplier: 1.0 (Baseline) -> 1.25 (Scenario)").
   - Interaction triggers `PATCH /api/scenarios/[id]` with debounced updates.
3. **The Comparison View**:
   - User selects two scenarios from the dashboard.
   - The UI overlays two map layers (e.g., Route A in Blue, Route B in Red) to visualize pathing changes driven by fuel fluctuations.

---

## 5. Data Validation Rules (Zod/Prisma)

### 5.1 Business Rules
- **Non-Negative Deltas**: `fuel_multiplier` must be `> 0`.
- **Throughput Caps**: `node_override_capacity` cannot exceed physical `base_capacity` (safety check).
- **Depth Limit**: Max 5 levels of branching to prevent recursive complexity in delta resolution.

### 5.2 Implementation Example (Next.js API Handler Logic)
```typescript
// /pages/api/scenarios/[id]/clone.ts (Pseudocode)

const cloneScenario = async (req, res) => {
  const { id } = req.query;
  const user = await getSessionUser(req);
  
  if (user.role === 'Viewer') return res.status(403).json({ error: 'Insufficent Permission' });

  const original = await prisma.scenario.findUnique({ where: { id } });
  
  const clone = await prisma.scenario.create({
    data: {
      name: `Copy of ${original.name}`,
      parentScenarioId: id,
      parameterDeltas: original.parameterDeltas, // Deep copy deltas
      status: 'DRAFT',
      createdBy: user.id
    }
  });

  return res.status(201).json(clone);
}
```

---

## 6. Role-Based Permissions Logic

| Role | Operations |
| :--- | :--- |
| **Viewer** | Read scenarios, view maps, export result tables. Cannot trigger re-simulations. |
| **Analyst** | Create/Clone scenarios, edit deltas, trigger simulations, compare results. |
| **Admin** | Lock/Unlock scenarios, delete scenarios, manage carrier rate baselines. |
