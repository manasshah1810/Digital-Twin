import { LogisticsGraph } from '../graph/buildGraph'

export interface ProposedLink {
    sourceNodeId: string
    targetNodeId: string
    mode: string
    reasoning: string
    estimatedDistance: number
}

export async function suggestInfrastructureLink(
    graph: LogisticsGraph,
    sourceId: string,
    targetId: string,
    forbiddenModes: string[]
): Promise<ProposedLink | null> {
    const sourceNode = graph.nodes.get(sourceId)
    const targetNode = graph.nodes.get(targetId)

    if (!sourceNode || !targetNode) return null

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) return null

    // Get a small sample of nearby nodes to provide context
    const context = `
    Origin: ${sourceNode.name} (${sourceNode.type}) at ${sourceNode.latitude}, ${sourceNode.longitude}
    Destination: ${targetNode.name} (${targetNode.type}) at ${targetNode.latitude}, ${targetNode.longitude}
    Forbidden Modes: ${forbiddenModes.join(', ')}
    `

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-001",
                messages: [
                    {
                        role: "system",
                        content: "You are a Logistics Infrastructure Strategist. Your goal is to identify missing links in a supply chain network. Respond only with JSON."
                    },
                    {
                        role: "user",
                        content: ` No path exists from ${sourceNode.name} to ${targetNode.name} in the logistics twin. 
                        Propose ONE single new infrastructure link (edge) that would best resolve this blockage.
                        
                        Current Context:
                        ${context}
                        
                        Return JSON format:
                        {
                          "sourceNodeId": "${sourceId}",
                          "targetNodeId": "${targetId}",
                          "mode": "truck|rail|sea|air",
                          "reasoning": "...",
                          "estimatedDistance": 100
                        }`
                    }
                ],
                response_format: { type: "json_object" }
            })
        })

        const data = await response.json()
        const content = data.choices[0].message.content
        return JSON.parse(content)
    } catch (error) {
        console.error('LLM Link Proposal Failed:', error)
        return null
    }
}
