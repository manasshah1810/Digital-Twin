import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message, context } = await request.json()

    if (!process.env.OPENROUTER_API_KEY) {
        return NextResponse.json({ reply: "I'm currently disconnected from my intelligence core (API key missing). I can only offer basic assistance." }, { status: 200 })
    }

    try {
        const systemPrompt = `You are the Logistics Intelligence Assistant for the Digital Twin OS. 
        Your goal is to provide deep, analytical insights into logistics simulations and guide users through the application.

        APP NAVIGATION & STRUCTURE:
        - Landing Page (/): Overview of the system.
        - Strategic Control Center (/dashboard): View and manage simulation scenarios, run optimizations, and analyze results.
        - Datasets (/dashboard/datasets): Upload and manage logistics data (shipments, nodes, routes).
        - Simulation Comparison (/dashboard/compare): Compare results from different scenarios side-by-side.
        - Glossary (/glossary): Detailed documentation of output parameters (Total Cost, CO2, Mode Shift), algorithms (Dijkstra, Yen's), and the AI Advisor Engine.

        CONTEXT OF CURRENT SIMULATION (REAL DATA):
        - Scenario ID: ${context.scenarioId || 'None'}
        - Current Metrics: 
            - Total Cost: ${context.result?.totalCost ? '$' + context.result.totalCost.toLocaleString() : 'N/A'}
            - Total CO2: ${context.result?.totalCO2 ? context.result.totalCO2.toFixed(1) + ' mT' : 'N/A'}
            - Total Time: ${context.result?.totalTransitTime ? context.result.totalTransitTime.toFixed(1) + ' hours' : 'N/A'}
            - Savings: ${context.result?.deltas?.absolute ? '$' + Math.abs(context.result.deltas.absolute).toLocaleString() : 'N/A'} (${context.result?.deltas?.percentage ? context.result.deltas.percentage.toFixed(1) + '%' : 'N/A'})
            - Mode Shift: ${context.result?.pathDetails ? 'Calculated from route' : 'N/A'}
            - Bottlenecks: ${context.result?.bottlenecks?.length || 0} identified.
        
        VISUALIZATION DATA INCLUDES:
        - Cost Breakdown: Fuel, Maintenance, and Fees/Tolls.
        - Network Map: Visualizes the baseline vs. optimized routes.
        - Multi-currency: Results can be toggled between USD and INR in the Results Panel.
        - Alternative Routes: The system provides up to 3 candidate routes (Route 1, 2, 3).
        - Route Stops: A detailed list of every station/node in the selected path.

        GUARD RAILS & PROTOCOLS:
        1. APPLICATION GUIDANCE: If asked about where to find features or how to navigate the app, guide the user specifically. Mention paths (e.g., "/dashboard") and UI elements (buttons/tabs).
        2. DATA & VISUALIZATION: If asked about the current data or what is displayed in the visualization (metrics, maps, breakdowns), use the "Current Metrics" and "VISUALIZATION DATA" context. Be specific and data-driven.
        3. DOMAIN KNOWLEDGE: If asked general questions about logistics datasets, digital twins, or visualization techniques NOT specific to this project's current state, provide a knowledgeable answer based on industry standards. Refer to the Glossary (/glossary) for technical depth.
        4. OUT-OF-BOX FILTER: If the question is totally unrelated to logistics, supply chain, digital twins, or this application, explicitly state: "This question is out of box and I cannot answer it." Do not attempt to answer general knowledge questions outside the project's scope.

        RULES:
        1. Be concise, professional, and data-driven.
        2. Use the provided metrics to back up your claims for Protocol 2.
        3. If no simulation is running and the user asks about data, explain how to start one in the Strategic Control Center.
        4. Tone should be dashboard-first: authoritative and strategic.`

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-001",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ]
            })
        })

        const data = await response.json()
        const reply = data.choices[0].message.content

        return NextResponse.json({ reply })
    } catch (error) {
        console.error('Chat API Error:', error)
        return NextResponse.json({ reply: "I'm having trouble accessing the network data. Please try again in a moment." }, { status: 500 })
    }
}

