import { NextResponse } from 'next/server'
import { callOpenRouter } from '@/lib/llm/openrouter'

export async function POST(request: Request) {
    try {
        const { text, nodes, availableModes } = await request.json()

        if (!text) {
            return NextResponse.json({ error: 'Missing text input' }, { status: 400 })
        }

        // We only send node id, name, and type to save context window sizes
        const nodeStr = nodes.map((n: any) => `${n.id} (${n.name}, ${n.type || 'unknown'})`).join('\n')

        const prompt = `You are a logistics digital twin disruption parser. You must analyze the user's natural language input describing a logistics disruption and convert it into structured constraint updates.

Available Modes: ${availableModes.join(', ')}

Available Nodes (ID (Name, Type)):
${nodeStr}

Your goal is to output ONLY valid JSON that matches this exact schema (do not wrap in markdown code blocks like \`\`\`json, just pure JSON):
{
    "closedNodeIds": ["array of node IDs to close entirely"],
    "congestedNodes": { "node_id_1": 0.4, "node_id_2": 0.5 }, // map of node ID to a capacity multiplier (e.g. 0.4 means 40% capacity = congested)
    "forbiddenModes": ["array of mode strings to ban entirely"],
    "fuelMultiplier": 1.0 // float value, 1.0 is normal, 2.0 is double fuel price
}

Rules:
1. ONLY use exactly the node IDs provided. Guess the best matches based on names or types.
2. ONLY use the exact mode strings provided.
3. Keep fuelMultiplier at 1.0 unless a broader fuel or energy price spike is explicitly mentioned.
4. For "strike" or "closed" items, add it to closedNodeIds OR forbiddenModes depending on if it's a place or a vehicle type.
5. For "congested", "delayed", or "slow" at specific places, add it to congestedNodes with a multiplier between 0.1 and 0.9 (e.g. 0.4).
6. Return purely the JSON object.

User Disruption: "${text}"
`

        const response = await callOpenRouter({
            model: 'meta-llama/llama-3.1-8b-instruct:free', // Using a fast/free model for disruption parsing
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1
        })

        const content = response.choices[0].message.content.trim()

        // Safety parsing in case it included markdown
        let parsed = content
        if (content.startsWith('\`\`\`json')) {
            parsed = content.split('\`\`\`json')[1].split('\`\`\`')[0].trim()
        } else if (content.startsWith('\`\`\`')) {
            parsed = content.split('\`\`\`')[1].split('\`\`\`')[0].trim()
        }

        const data = JSON.parse(parsed)

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('AI Disruption API error:', error)
        return NextResponse.json({ error: error.message || 'Failed to parse disruption' }, { status: 500 })
    }
}
