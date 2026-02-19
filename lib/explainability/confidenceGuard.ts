import { callOpenRouter } from '../llm/openrouter'

export interface ConfidenceConfig {
    scenarioId: string
    sourceNodeId: string
    targetNodeId: string
    constraints: any
}

export interface ConfidenceBoundaries {
    assumptions: string[]
    limitations: string[]
}

/**
 * Generates technical confidence boundaries and limitations for the simulation.
 */
export async function generateConfidenceBoundaries(config: ConfidenceConfig): Promise<ConfidenceBoundaries> {
    const prompt = `
    Analyze this logistics simulation configuration and provide a technical "Confidence and Limitations" report.
    
    SYSTEM STATE:
    - Optimization Engine: Dijkstra Least-Cost Path
    - Active Constraints: ${JSON.stringify(config.constraints)}
    
    Provide:
    1. A list of 3 key technical assumptions made during this recomputation (e.g., static terminal processing times, uniform mode fuel burn).
    2. A list of 2-3 data limitations (e.g., real-time traffic latency, dynamic weather volatility, live port congestion).
    
    The goal is to maintain high confidence in the math while being transparent about boundary conditions.
    
    Format as JSON with "assumptions" and "limitations" keys (both as string arrays).
    `

    try {
        const response = await callOpenRouter({
            model: 'liquid/lfm-2.5-1.2b-instruct:free',
            messages: [
                {
                    role: 'system',
                    content: 'You are a systems verification engineer. Provide professional, technical boundary analysis in JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.2
        })

        const content = response.choices[0].message.content
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)
    } catch (error) {
        console.error('Confidence generation failed:', error)
        return {
            assumptions: [
                'Grid topology remains static during recomputation.',
                'Fuel shock indices are applied linearly across the vector.',
                'Least-cost trajectory is computed via deterministic Dijkstra weighted distance.'
            ],
            limitations: [
                'Real-time traffic and weather-driven latency not modeled.',
                'Terminal dwell times are static based on last known baseline.',
                'Dynamic labor constraints (ELD/HOS) are currently out of scope.'
            ]
        }
    }
}
