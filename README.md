# Fuel-Price Resilient Digital Twin (FPRT)

An interactive, enterprise-grade logistics digital twin that instantly simulates least-cost route changes under fuel shocks or infrastructure disruptions. Built for Logistics & Supply Chain Heads to move away from days-long Excel what-if analysis and instantly visualize massive supply network changes.

## 🚀 The Core Problem Solved
Fuel price spikes (diesel, bunker fuel) or rail/port disruptions destroy logistics margins overnight. Manual rerouting ignores network-wide second-order effects and cannot recompute thousands of routes in real-time. 

This Digital Twin answers the million-dollar question: **"What happens to my margin if diesel goes up 20% tomorrow or a major rail hub shuts down?"**

## 🏗 Key Features
*   **Sub-Second Graph Computation (Dijkstra/A*)**: Instantly recalculates least-cost routes across synthetic global nodes using an in-memory graph traversal with constraint validation.
*   **AI-Powered Synthetic Data Generation**: Uses LLMs to hallucinate mathematically valid, realistic global transport networks (ports, rail hubs, ocean lanes) and persists them directly into PostgreSQL.
*   **True Physics-Based Map Animation**: Real-time 60fps WebGL rendering of cargo movement with MapLibre, calculated using geodesic math rather than simple CSS dashed lines.
*   **Interactive Disruption Engine ("Logistics Sandbox")**: Click to close ports, spike fuel multipliers, ban modes (e.g., Rail Strike), or use a **Natural Language AI parser** to describe arbitrary "What-If" scenarios.
*   **Tri-State Node Congestion**: Nodes aren't just open or closed; they support capacity degradation (e.g., "Port is at 40% capacity") which dynamically throttles edge throughput and increases transit delay penalties.
*   **Carrier Specific Pricing Integration**: Edge costs inherit specific Carrier Rate Tables, dynamically blending Base Cost + Distance + Carrier Markups + Mode-specific Fuel Type Indexes (Diesel/Bunker/Jet Fuel).
*   **Multi-Objective Optimization**: Toggle between standard least-cost optimization or **CO₂ / Emissions-aware routing**.
*   **Deterministic Explainability**: Generates plain-English rationale for every shifted route (e.g., *"Shifting from Rail to Truck increased cost by 12.4% due to the closure of Hub X"*).
*   **Network diagnostics & Auto-Healing**: If a user creates an impossible scenario causing network disconnection, the AI runs a diagnostic algorithm to propose building new infrastructure links to bridge topological gaps.

## 💻 Tech Stack
*   **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, MapLibre GL JS
*   **Backend**: Node.js, Next.js Serverless API Routes
*   **Database**: Supabase (PostgreSQL)
*   **AI / LLM**: OpenRouter API (`meta-llama/llama-3.1-8b-instruct:free` for fast disruption parsing / `gpt-4o` for dataset generation)
*   **UI/UX Aesthetic**: Custom "Surface" Dark Mode / Zinc neutral palette

## 🛠 Local Development Setup

To run this application locally:

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Set up your local environments (`.env.local` required)
4. Start the development server:
```bash
npm run dev
```
5. Open [http://localhost:3000](http://localhost:3000) with your browser.
