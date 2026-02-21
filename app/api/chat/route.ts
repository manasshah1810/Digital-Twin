import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    const { message, context } = await request.json()

    if (!process.env.OPENROUTER_API_KEY) {
        return NextResponse.json({ reply: "I'm currently disconnected from my intelligence core (API key missing). I can only offer basic assistance." }, { status: 200 })
    }

    try {
        const systemPrompt = `You are the Logistics Intelligence Assistant for the Digital Twin OS. 
        Your goal is to provide deep, analytical insights into logistics simulations.
        
        CONTEXT OF CURRENT SIMULATION:
        - Scenario ID: ${context.scenarioId || 'None'}
        - Current Metrics: 
            - Total Cost: ${context.result?.totalCost ? '$' + context.result.totalCost.toLocaleString() : 'N/A'}
            - Total CO2: ${context.result?.totalCO2 ? context.result.totalCO2.toFixed(1) + ' mT' : 'N/A'}
            - Total Time: ${context.result?.totalTransitTime ? context.result.totalTransitTime.toFixed(1) + ' hours' : 'N/A'}
            - Bottlenecks: ${context.result?.bottlenecks?.length || 0} identified.
        
        RULES:
        1. Be concise, professional, and data-driven.
        2. Use the provided metrics to back up your claims.
        3. If no simulation is running, explain how to start one.
        4. Focus on sustainability, economic impact, and resilience.
        5. Tone should be dashboard-first: authoritative and strategic.`

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
