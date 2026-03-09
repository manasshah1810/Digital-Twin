'use client';

import React from 'react';
import { Book, Calculator, Cpu, Info, Zap, TrendingUp, Shield, Activity, Share2, Target, Globe, Fuel, Clock, Gauge, BarChart3, Bot, Sparkles, Server, Network, Database, Layers, ArrowRight } from 'lucide-react';

export default function GlossaryPage() {
    return (
        <div className="relative min-h-screen bg-surface-50">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />

            <div className="container mx-auto px-6 py-12 relative max-w-7xl">
                {/* Header */}
                <header className="mb-16">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/20">
                            <Book className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-4xl font-black text-surface-900 tracking-tight">Technical <span className="text-brand-500">Glossary</span></h1>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <p className="text-surface-500 max-w-2xl font-bold uppercase tracking-widest text-[10px] opacity-70">
                            Comprehensive documentation for output parameters, computational logic, and AI archetecture.
                        </p>
                        <div className="flex gap-4">
                            <a href="#functions" className="text-[10px] font-black uppercase text-brand-600 hover:underline">Functions</a>
                            <a href="#algorithms" className="text-[10px] font-black uppercase text-brand-600 hover:underline">Algorithms</a>
                            <a href="#physics" className="text-[10px] font-black uppercase text-brand-600 hover:underline">Physics</a>
                            <a href="#ai" className="text-[10px] font-black uppercase text-brand-600 hover:underline">Neural Engine</a>
                        </div>
                    </div>
                </header>

                <div className="space-y-32">
                    {/* Section 0: Functions (The "Output" Part) */}
                    <section id="functions">
                        <div className="flex items-center gap-3 mb-12 border-b-2 border-surface-900 pb-6">
                            <Activity className="w-7 h-7 text-surface-900" />
                            <h2 className="text-3xl font-black text-surface-900 uppercase tracking-tighter italic">Functions & Output Parameters</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <GlossaryCard
                                icon={<Target className="w-5 h-5 text-brand-600" />}
                                title="Total Cost"
                                description="The final financial output representing the sum of all operational expenditures (Fuel + Maintenance + Tolls) across all calculated trips."
                            />
                            <GlossaryCard
                                icon={<Globe className="w-5 h-5 text-emerald-600" />}
                                title="CO2 Emissions"
                                description="Total carbon footprint of the mission. Calculated by multiplying distance and trips by the mode-specific emission factor (mT/km)."
                                badge="SUSTAINABILITY"
                            />
                            <GlossaryCard
                                icon={<Share2 className="w-5 h-5 text-blue-600" />}
                                title="Mode Shift"
                                description="The percentage of the supply chain that has transitioned from its original transport mode to a more optimized alternative."
                            />
                            <GlossaryCard
                                icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                                title="Savings"
                                description="The total capital retained by switching from the baseline scenario to the optimized route, displayed in both USD and Percentage."
                                badge="FINANCIAL"
                            />
                            <GlossaryCard
                                icon={<Gauge className="w-5 h-5 text-amber-600" />}
                                title="Load Factor"
                                description="The utilization efficiency of transport assets. Measures actual cargo mass against the maximum rated capacity of the selected mode."
                            />
                            <GlossaryCard
                                icon={<Clock className="w-5 h-5 text-purple-600" />}
                                title="Transit Time"
                                description="The calculated duration from point A to B, factoring in mode-specific throttle speeds and historical port/hub dwell times."
                            />
                            <GlossaryCard
                                icon={<BarChart3 className="w-5 h-5 text-surface-600" />}
                                title="Distance"
                                description="The total route length in kilometers. Derived from dataset precision or synthesized via geodesic Haversine logic for 'gap' lanes."
                            />
                            <GlossaryCard
                                icon={<Zap className="w-5 h-5 text-amber-500" />}
                                title="Energy Intensity"
                                description="Measures Joules consumed per ton-kilometer, used to rank the physical efficiency of different logistical topologies."
                            />
                            <GlossaryCard
                                icon={<Shield className="w-5 h-5 text-emerald-500" />}
                                title="Resilience Score"
                                description="A proprietary AI-derived metric (0-100) indicating the route's resistance to fuel spikes and port closures."
                                badge="AI ADVISOR"
                            />
                        </div>
                    </section>

                    {/* Section 1: Algorithms (The "Deep" Part) */}
                    <section id="algorithms">
                        <div className="flex items-center gap-3 mb-12 border-b-2 border-surface-900 pb-6">
                            <Network className="w-7 h-7 text-surface-900" />
                            <h2 className="text-3xl font-black text-surface-900 uppercase tracking-tighter italic">Optimization Algorithms</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <TechnicalDive
                                title="Deterministic Dijkstra Search"
                                icon={<Share2 className="w-6 h-6 text-brand-500" />}
                                description="Our core routing engine uses a modified Dijkstra's Algorithm to find the single most efficient path through the logistics graph."
                                bulletPoints={[
                                    "Weight Modes: Optimizes for 'Cost', 'Time', 'CO2', or 'Balanced' based on user priority.",
                                    "Dynamic Re-weighting: Every edge weight is recomputed on-the-fly to account for fuel price spikes.",
                                    "Edge Pruning: Automatically excludes nodes or routes marked as 'Closed' in scenarios.",
                                    "Computational Complexity: O(E + V log V), ensuring sub-50ms results even for 10,000+ nodes."
                                ]}
                            />
                            <TechnicalDive
                                title="Yen's K-Shortest Paths"
                                icon={<Layers className="w-6 h-6 text-amber-500" />}
                                description="To provide alternatives (Route 2, Route 3), we implement Yen's Algorithm to find the next-best paths without cycles."
                                bulletPoints={[
                                    "Strategic Deviation: Identifies spur nodes where a path could branch into a more resilient direction.",
                                    "Path Diversity: Ensures Alternative 1 and 2 are significantly different, not just minor variations.",
                                    "Ranking Model: Paths are ranked by their score delta relative to the baseline path.",
                                    "Sustainability Filtering: Used to find the 'Greenest' possible route even if it costs slightly more."
                                ]}
                            />
                            <TechnicalDive
                                title="Haversine Geodesic Computation"
                                icon={<Globe className="w-6 h-6 text-emerald-500" />}
                                description="When datasets lack explicit edge distances, the system computes the 'as-the-crow-flies' distance using spherical trigonometry."
                                bulletPoints={[
                                    "Earth Radius Constant: 6,371 km used for precise global projections.",
                                    "Synthetic Air Injection: Used to create virtual flight paths between hubs lacking direct road links.",
                                    "Coordinate Mapping: Converts Latitude/Longitude pairs into a 3D vector space for distance measurement.",
                                    "Circuital Deviation: We apply a 1.2x multiplier to Haversine results for road transport to mimic real-world road curvature."
                                ]}
                            />
                            <TechnicalDive
                                title="Hamming Mode-Shift Metric"
                                icon={<Activity className="w-6 h-6 text-surface-600" />}
                                description="Measures the structural change between the baseline dataset and the optimized result."
                                bulletPoints={[
                                    "Comparison Vector: Compares transport modes at every leg of the supply chain.",
                                    "Shift Calculation: Shift % = (Number of Legs with Changed Mode / Total Legs) * 100.",
                                    "Insight Generation: High shift percentages indicate that the historical strategy was significantly sub-optimal.",
                                    "Multi-modal Detection: Automatically flags shifts from expensive Air/Road to efficient Rail/Sea."
                                ]}
                            />
                        </div>
                    </section>

                    {/* Section 2: Physics & Calculations */}
                    <section id="physics">
                        <div className="flex items-center gap-3 mb-12 border-b-2 border-surface-900 pb-6">
                            <Gauge className="w-7 h-7 text-surface-900" />
                            <h2 className="text-3xl font-black text-surface-900 uppercase tracking-tighter italic">Physics & Market Constants</h2>
                        </div>
                        <div className="bg-white border-2 border-surface-900 rounded-[2rem] p-10 shadow-[8px_8px_0px_rgba(0,0,0,0.1)] mb-12">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-2">
                                        <Database className="w-5 h-5 text-brand-500" /> Ground Level Constants
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6">
                                        <ConstantCard label="Diesel Base Price" value="$1.12 / L" sub="USD (Global Avg)" />
                                        <ConstantCard label="Bunker Fuel Base" value="$0.65 / L" sub="Maritime" />
                                        <ConstantCard label="Jet Fuel Base" value="$2.45 / L" sub="Aviation" />
                                        <ConstantCard label="Maint. Rate" value="$0.15 / km" sub="Fixed Mechanical" />
                                        <ConstantCard label="Balanced Time Value" value="$25.00 / hr" sub="Opportunity Cost" />
                                        <ConstantCard label="Load Efficiency Cap" value="35%" sub="Max Mass Penalty" />
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-emerald-500" /> Mode Efficiency Matrix
                                    </h3>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b-2 border-surface-100">
                                                <th className="py-3 text-[10px] font-black uppercase text-surface-400">Mode</th>
                                                <th className="py-3 text-[10px] font-black uppercase text-surface-400">Mileage (KM/L)</th>
                                                <th className="py-3 text-[10px] font-black uppercase text-surface-400">CO2 (mT/KM)</th>
                                                <th className="py-3 text-[10px] font-black uppercase text-surface-400">Avg Speed</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs font-bold text-surface-900">
                                            <tr className="border-b border-surface-50">
                                                <td className="py-4 uppercase italic">Truck (Heavy)</td>
                                                <td className="py-4">3.8</td>
                                                <td className="py-4">0.120</td>
                                                <td className="py-4">60 km/h</td>
                                            </tr>
                                            <tr className="border-b border-surface-50">
                                                <td className="py-4 uppercase italic">Rail (Intermodal)</td>
                                                <td className="py-4">12.0</td>
                                                <td className="py-4">0.040</td>
                                                <td className="py-4">45 km/h</td>
                                            </tr>
                                            <tr className="border-b border-surface-50">
                                                <td className="py-4 uppercase italic">Maritime (Vessel)</td>
                                                <td className="py-4">45.0</td>
                                                <td className="py-4">0.015</td>
                                                <td className="py-4">25 km/h</td>
                                            </tr>
                                            <tr>
                                                <td className="py-4 uppercase italic">Air (Cargo Jet)</td>
                                                <td className="py-4">0.8</td>
                                                <td className="py-4">0.800</td>
                                                <td className="py-4">800 km/h</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <FormulaCard
                                title="Dynamic Fuel Usage"
                                formula="Usage = (Dist / Mileage) × [1.0 + (LoadFactor × 0.35)]"
                                inputs={["Distance", "Mode Efficiency", "Actual Load / Capacity"]}
                                output="Fuel Consumption (Liters)"
                                description="Our most advanced calculation. It penalizes fuel efficiency by up to 35% when the vehicle is running at 100% capacity (LoadFactor = 1.0)."
                            />
                            <FormulaCard
                                title="Balanced Path Score"
                                formula="Score = TotalCost + (TransitHours × $25)"
                                inputs={["Calculated USD Cost", "Transit Time", "Fixed TimeValueFactor"]}
                                output="Weighting Score"
                                description="The 'Secret Sauce' of our balanced optimization. It treats 1 hour of delay as being equal to $25 in lost operational value."
                            />
                        </div>
                    </section>

                    {/* Section 3: AI Advisor Engine */}
                    <section id="ai">
                        <div className="flex items-center gap-3 mb-12 border-b-2 border-surface-900 pb-6">
                            <Cpu className="w-7 h-7 text-surface-900" />
                            <h2 className="text-3xl font-black text-surface-900 uppercase tracking-tighter italic">Advisor Neuro-Engine</h2>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-white border border-surface-200 rounded-3xl p-10 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Bot className="w-48 h-48" />
                                    </div>
                                    <h3 className="text-2xl font-black text-surface-900 uppercase tracking-tight mb-6 italic">Generative Reasoning Phases</h3>
                                    <div className="space-y-10 relative z-10">
                                        <div className="flex gap-6">
                                            <div className="h-14 w-14 shrink-0 bg-brand-50 rounded-2xl flex items-center justify-center font-black text-brand-600 text-xl border border-brand-100">01</div>
                                            <div>
                                                <h4 className="font-black text-surface-900 uppercase tracking-wide mb-2">Conversational Data Gathering</h4>
                                                <p className="text-xs text-surface-500 font-bold leading-relaxed">
                                                    Using <b>Gemini 2.0 Flash (Temp 0.7)</b>, the system interviews the user to understand constraints. It uses a structured prompt to track progress across 7 critical domains (Origins, Destinations, Volume, Cargo Type, etc.).
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="h-14 w-14 shrink-0 bg-amber-50 rounded-2xl flex items-center justify-center font-black text-amber-600 text-xl border border-amber-100">02</div>
                                            <div>
                                                <h4 className="font-black text-surface-900 uppercase tracking-wide mb-2">Synthetic Graph Synthesis</h4>
                                                <p className="text-xs text-surface-500 font-bold leading-relaxed">
                                                    Once information is gathered, the **Neuro-Engine** switches to <b>Temperature 0.3</b> (Precision Mode). It generates a compliant JSON graph including accurate Lat/Long coordinates and Haversine-calculated edges.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-6">
                                            <div className="h-14 w-14 shrink-0 bg-emerald-50 rounded-2xl flex items-center justify-center font-black text-emerald-600 text-xl border border-emerald-100">03</div>
                                            <div>
                                                <h4 className="font-black text-surface-900 uppercase tracking-wide mb-2">Semantic Explanation</h4>
                                                <p className="text-xs text-surface-500 font-bold leading-relaxed">
                                                    Finally, the AI provides a natural language summary of <i>why</i> it chose specific paths, identifying strategic trade-offs between speed and resilience that pure math might miss.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <AIInsight
                                        label="Prompt Architecture"
                                        value="Chain-of-Thought (CoT)"
                                        detail="Our prompts require the model to reason through fuel price impacts before emitting the final JSON structure."
                                    />
                                    <AIInsight
                                        label="Rate Limiting"
                                        value="Token-Aware Throttling"
                                        detail="OpenRouter gateway dynamic scaling ensures 99.9% uptime during simulation spikes."
                                    />
                                </div>
                            </div>

                            <div className="bg-surface-900 text-white rounded-[2.5rem] p-10 shadow-2xl flex flex-col justify-between">
                                <div>
                                    <div className="h-16 w-16 bg-white/10 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-md">
                                        <Sparkles className="w-8 h-8 text-brand-400" />
                                    </div>
                                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">The Stack</h3>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-12">System Specifications</p>

                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="text-brand-500"><Server className="w-5 h-5" /></div>
                                            <div>
                                                <div className="text-[9px] font-black text-white/40 uppercase">Orchestration</div>
                                                <div className="text-sm font-black">Next.js 14 (Edge Runtime)</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-brand-500"><Network className="w-5 h-5" /></div>
                                            <div>
                                                <div className="text-[9px] font-black text-white/40 uppercase">Database</div>
                                                <div className="text-sm font-black">Supabase (PostgreSQL + PostGIS)</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-brand-500"><Cpu className="w-5 h-5" /></div>
                                            <div>
                                                <div className="text-[9px] font-black text-white/40 uppercase">Inference</div>
                                                <div className="text-sm font-black">OpenRouter v1 API</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-brand-500"><Cpu className="w-5 h-5" /></div>
                                            <div>
                                                <div className="text-[9px] font-black text-white/40 uppercase">UI Engine</div>
                                                <div className="text-sm font-black">Tailwind + Framer Motion</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-16 pt-8 border-t border-white/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black uppercase text-white/30">Network Uptime</span>
                                        <span className="text-[10px] font-black uppercase text-emerald-400">99.98%</span>
                                    </div>
                                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[99%]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Multi-Section Detailed Parameters Table */}
                <section className="mt-32">
                    <div className="flex items-center gap-3 mb-12 border-b-2 border-surface-900 pb-6">
                        <BarChart3 className="w-7 h-7 text-surface-900" />
                        <h2 className="text-3xl font-black text-surface-900 uppercase tracking-tighter italic">Technical Parameter Dictionary</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <GlossaryCard
                            icon={<Target className="w-5 h-5" />}
                            title="LCO (Least Cost Path)"
                            description="Calculated using Dijkstra's algorithm. It represents the global minimum of the cost function f(x) = ∑(LegCosts)."
                        />
                        <GlossaryCard
                            icon={<Globe className="w-5 h-5 text-emerald-500" />}
                            title="GHG Protocol Tier 1"
                            description="Our CO2 math follows standard GHG reporting metrics for transportation fuel emissions factors (Scopes 1 and 3)."
                        />
                        <GlossaryCard
                            icon={<TrendingUp className="w-5 h-5 text-emerald-500" />}
                            title="Delta Variance (δ)"
                            description="The percentage of optimization. Formula: ((BaselineCost - ScenarioCost) / BaselineCost) * 100."
                            badge="ROI METRIC"
                        />
                        <GlossaryCard
                            icon={<Zap className="w-5 h-5 text-amber-500" />}
                            title="Bunker Surcharge"
                            description="Specific to maritime legs. A variable cost adder tied to the 'Bunker' fuel index price index (1.0 = Base)."
                        />
                        <GlossaryCard
                            icon={<Shield className="w-5 h-5" />}
                            title="Edge Latency"
                            description="The compute time required to traverse one adjacency list entry during graph exploration. Constant at <1μs."
                        />
                        <GlossaryCard
                            icon={<Cpu className="w-5 h-5" />}
                            title="Synthetic Route"
                            description="A non-historical route generated by AI to fill gaps in legacy datasets, allowing 'what-if' modeling of new lanes."
                            badge="AI GEN"
                        />
                    </div>
                </section>

                {/* Footer */}
                <footer className="mt-32 pt-12 border-t-4 border-surface-900 text-center">
                    <p className="text-surface-900 text-[11px] font-black uppercase tracking-[0.3em]">
                        Logistics Digital Twin Technical Manual v1.0.4-STABLE
                    </p>
                    <p className="text-surface-400 text-[10px] font-bold mt-2 uppercase">
                        Confidential Enterprise Documentation — Proprietary Optimization Logic
                    </p>
                </footer>
            </div>
        </div>
    );
}

function TechnicalDive({ title, icon, description, bulletPoints }: { title: string, icon: React.ReactNode, description: string, bulletPoints: string[] }) {
    return (
        <div className="bg-white border-2 border-surface-200 rounded-3xl p-8 hover:border-surface-900 transition-all group">
            <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 bg-surface-50 rounded-2xl flex items-center justify-center border border-surface-100 group-hover:bg-brand-50 group-hover:border-brand-100">
                    {icon}
                </div>
                <h3 className="text-xl font-black text-surface-900 uppercase tracking-tight">{title}</h3>
            </div>
            <p className="text-xs text-surface-500 font-bold mb-8 leading-relaxed italic border-l-4 border-surface-100 pl-4">
                "{description}"
            </p>
            <ul className="space-y-4">
                {bulletPoints.map((point, i) => {
                    const [head, ...rest] = point.split(':');
                    return (
                        <li key={i} className="flex gap-3 text-[10px] leading-tight">
                            <div className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-1 shrink-0" />
                            <span className="text-surface-600 font-bold">
                                <b className="text-surface-900 uppercase tracking-wide">{head}:</b> {rest.join(':')}
                            </span>
                        </li>
                    )
                })}
            </ul>
        </div>
    );
}

function GlossaryCard({ icon, title, description, badge }: { icon: React.ReactNode, title: string, description: string, badge?: string }) {
    return (
        <div className="bg-white border-2 border-surface-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-brand-200 transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 bg-surface-50 rounded-xl flex items-center justify-center border border-surface-100 group-hover:bg-brand-50 group-hover:border-brand-100 transition-colors">
                    {icon}
                </div>
                {badge && (
                    <span className="text-[8px] font-black px-2 py-1 bg-surface-900 text-white rounded-md uppercase tracking-widest">{badge}</span>
                )}
            </div>
            <h3 className="text-sm font-black text-surface-900 mb-3 tracking-tighter uppercase leading-none">{title}</h3>
            <p className="text-[10px] text-surface-500 font-bold leading-relaxed">{description}</p>
        </div>
    );
}

function FormulaCard({ title, formula, inputs, output, description }: { title: string, formula: string, inputs: string[], output: string, description: string }) {
    return (
        <div className="bg-white border-2 border-surface-900 rounded-[2rem] overflow-hidden shadow-[4px_4px_0px_rgba(0,0,0,0.05)] flex flex-col group">
            <div className="p-10 border-b-2 border-surface-50 bg-surface-50/30 group-hover:bg-brand-50/10 transition-colors">
                <h3 className="text-xs font-black text-surface-400 uppercase tracking-[0.2em] mb-6">{title}</h3>
                <div className="bg-white p-8 rounded-2xl border-2 border-surface-900 font-mono text-xl font-black text-brand-600 overflow-x-auto whitespace-nowrap shadow-inner">
                    {formula}
                </div>
            </div>
            <div className="p-10 flex-grow">
                <div className="grid grid-cols-2 gap-10 mb-8">
                    <div>
                        <div className="text-[10px] font-black text-surface-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-brand-500" /> Inputs
                        </div>
                        <ul className="space-y-2">
                            {inputs.map((input, i) => (
                                <li key={i} className="text-[10px] font-bold text-surface-500 uppercase tracking-tight">
                                    • {input}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-surface-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-brand-500" /> Output
                        </div>
                        <div className="text-[10px] font-black text-brand-600 uppercase italic">
                            {output}
                        </div>
                    </div>
                </div>
                <p className="text-[11px] font-bold text-surface-500 leading-relaxed border-t-2 border-surface-50 pt-6">
                    {description}
                </p>
            </div>
        </div>
    );
}

function ConstantCard({ label, value, sub }: { label: string, value: string, sub: string }) {
    return (
        <div className="p-5 bg-surface-50 rounded-2xl border border-surface-100 hover:border-brand-200 transition-colors">
            <div className="text-[9px] font-black text-surface-400 uppercase tracking-widest mb-2">{label}</div>
            <div className="text-lg font-black text-surface-900 tracking-tighter mb-1">{value}</div>
            <div className="text-[8px] font-black text-brand-500 uppercase">{sub}</div>
        </div>
    );
}

function AIInsight({ label, value, detail }: { label: string, value: string, detail: string }) {
    return (
        <div className="p-6 bg-white border border-surface-200 rounded-3xl shadow-sm hover:border-brand-200 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest">{label}</span>
                <Sparkles className="w-3.5 h-3.5 text-brand-300" />
            </div>
            <div className="text-lg font-black text-surface-900 mb-2 tracking-tight uppercase italic">{value}</div>
            <p className="text-[10px] font-bold text-surface-500 leading-relaxed">{detail}</p>
        </div>
    );
}
