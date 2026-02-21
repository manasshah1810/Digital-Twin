export async function diagnoseDisruption(
    sourceNode: any,
    targetNode: any,
    constraints: any,
    diagnostics: any
) {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) return "The logistics network is disconnected. Please check your terminal exclusions and mode restrictions."

    try {
        const prompt = `
        The logistics simulation has failed to find a path.
        
        Origin: ${sourceNode.name} (${sourceNode.type})
        Destination: ${targetNode.name} (${targetNode.type})
        
        ACTIVE CONSTRAINTS:
        - Forbidden Modes: ${constraints.forbiddenModes.length > 0 ? constraints.forbiddenModes.join(', ') : 'None'}
        - Closed Terminals: ${constraints.closedNodeIds.length > 0 ? constraints.closedNodeIds.length + ' hubs offline' : 'None'}
        - Fuel Multiplier: ${constraints.fuelPriceMultipliers?.truck || 1.0}x
        
        TOPOLOGY STATS:
        - Total Edges in Baseline: ${diagnostics.edgesCount}
        
        TASK:
        Provide a concise, authoritative diagnosis (max 2 sentences) of why this network is likely disjointed. 
        Focus on whether it's a specific mode ban or a node closure causing the bottleneck.
        Tone: Professional, Strategic, Authoritative.
        `

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-001",
                messages: [
                    { role: "system", content: "You are a Logistics Topology Expert." },
                    { role: "user", content: prompt }
                ]
            })
        })

        const data = await response.json()
        return data.choices[0].message.content
    } catch (error) {
        return "Critical network disjoint detected. Check intermediate terminal connectivity."
    }
}
