import { NextResponse } from 'next/server'
import { callOpenRouter } from '@/lib/llm/openrouter'

export const maxDuration = 60

export async function POST(request: Request) {
    try {
        const { messages, phase } = await request.json()

        if (phase === 'conversation') {
            // Phase 1: Conversational data gathering — stream questions
            const systemPrompt = `You are a friendly logistics advisor helping a company set up their supply chain analysis. 
You are having a conversation to gather information. Based on what the user has told you so far, ask the NEXT most important question.

You need to collect ALL of the following before you can generate routes:
1. Company name and industry
2. Origin locations (warehouses, factories) — need city names
3. Destination locations (customers, distribution centers) — need city names  
4. Types of goods being shipped (weight per unit, fragility, etc.)
5. Preferred transport modes (truck, rail, sea, air)
6. Approximate shipment volume (packages per month)
7. Any constraints (budget limits, time requirements, eco preferences)

RULES:
- Ask ONE question at a time
- Be conversational and friendly, not robotic
- After the user answers, acknowledge their answer briefly, then ask the next question
- When you have enough information for ALL 7 categories above, respond with EXACTLY this on a new line at the end:
[READY_TO_GENERATE]
- Never say [READY_TO_GENERATE] until you have origins, destinations, goods, and transport modes at minimum
- Keep responses short (2-3 sentences max)`

            const response = await callOpenRouter({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                temperature: 0.7
            })

            const content = response.choices[0].message.content
            const isReady = content.includes('[READY_TO_GENERATE]')
            const cleanContent = content.replace('[READY_TO_GENERATE]', '').trim()

            return NextResponse.json({
                reply: cleanContent,
                isReady
            })
        }

        if (phase === 'generate') {
            // Phase 2: Generate full logistics data from conversation
            const generatePrompt = `Based on this conversation, generate a complete logistics network as JSON.

CONVERSATION:
${messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

Generate VALID JSON with this exact structure:
{
  "companyName": "string",
  "nodes": [
    { "id": "node_1", "name": "Location Name", "type": "WAREHOUSE|PORT|AIRPORT|DISTRIBUTION_CENTER|FACTORY", "latitude": number, "longitude": number, "city": "string", "country": "string" }
  ],
  "edges": [
    { "source": "node_1", "target": "node_2", "mode": "truck|rail|sea|air", "distance": number_km, "cost_per_unit": number_usd, "capacity": number_kg }
  ],
  "cargo": {
    "description": "string",
    "packageCount": number,
    "packageWeight": number_kg
  },
  "routes": [
    {
      "name": "Route Name",
      "description": "Brief description",
      "path": ["node_1", "node_2", "node_3"],
      "totalCost": number_usd,
      "totalCO2": number_metric_tons,
      "totalTransitTime": number_hours,
      "modeBreakdown": { "truck": cost, "sea": cost }
    }
  ],
  "summary": "A 2-3 sentence executive summary of the logistics network",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}

STRICT RULES:
1. Latitude/Longitude MUST be accurate for real cities
2. Distances must be realistic (use Haversine approximation)
3. Costs: truck ~$0.10/km, rail ~$0.05/km, sea ~$0.03/km, air ~$2.50/km
4. Generate at least 3 different route options with different mode mixes
5. Include at least one eco-friendly route (rail/sea heavy) and one fast route (air/truck)
6. All node IDs must be referenced correctly in edges and routes
7. Output ONLY valid JSON, no markdown, no explanation`

            const response = await callOpenRouter({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    { role: 'system', content: 'You are a logistics data engine. Output ONLY valid JSON. Never use markdown.' },
                    { role: 'user', content: generatePrompt }
                ],
                temperature: 0.3
            })

            const raw = response.choices[0].message.content.trim()
            const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()

            try {
                const data = JSON.parse(cleaned)

                // Post-process: ensure all routes have pathDetails for map rendering
                if (data.routes && data.nodes) {
                    const nodeMap: Map<string, any> = new Map(data.nodes.map((n: any) => [n.id, n]))

                    data.routes = data.routes.map((route: any, idx: number) => {
                        const pathDetails = (route.path || []).map((nodeId: string, i: number) => {
                            const node = nodeMap.get(nodeId)
                            const nextNodeId = route.path[i + 1]
                            const edge = nextNodeId ? data.edges?.find((e: any) =>
                                (e.source === nodeId && e.target === nextNodeId) ||
                                (e.target === nodeId && e.source === nextNodeId)
                            ) : null

                            return {
                                id: nodeId,
                                name: node?.name || nodeId,
                                type: node?.type || 'HUB',
                                latitude: node?.latitude,
                                longitude: node?.longitude,
                                mode: edge?.mode || (i === 0 ? undefined : 'truck'),
                                isNautical: edge?.mode === 'sea'
                            }
                        })

                        return {
                            rank: idx + 1,
                            ...route,
                            pathDetails,
                            isGenerative: true,
                            isStrategicAI: true,
                            strategyName: route.name,
                            generativeReason: route.description,
                            steps: pathDetails
                        }
                    })
                }

                return NextResponse.json({ data })
            } catch (parseError) {
                console.error('[AI Advisor] JSON parse failed:', parseError)
                return NextResponse.json({ error: 'Failed to parse AI response. Please try again.' }, { status: 500 })
            }
        }

        return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
    } catch (error: any) {
        console.error('[AI Advisor] Error:', error)
        return NextResponse.json({ error: error.message || 'AI Advisor failed' }, { status: 500 })
    }
}
