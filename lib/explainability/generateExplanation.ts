import { callOpenRouter } from '../llm/openrouter'
import { compressText, compressBullets } from '../llm/compressor'

export interface RouteData {
    path: string[]
    totalCost: number
}

export interface ExplanationResponse {
    summary: string
    tradeoffs: string[]
    isDegraded?: boolean
}

/**
 * Generates a plain-English explanation of routing changes using LLM.
 */
export async function generateExplanation(
    baselineRoute: RouteData,
    optimizedRoute: RouteData,
    costDelta: number,
    constraints: any
): Promise<ExplanationResponse> {
    const prompt = `
    Analyze logistics routing change. Use high-density, professional language.
    
    BASELINE: ${baselineRoute.path.join(' -> ')} ($${baselineRoute.totalCost.toLocaleString()})
    NEW: ${optimizedRoute.path.join(' -> ')} ($${optimizedRoute.totalCost.toLocaleString()})
    DELTA: $${costDelta.toLocaleString()}
    
    CONSTRAINTS: ${JSON.stringify(constraints)}
    
    Format: JSON { "summary": "string (max 150 chars)", "tradeoffs": ["string", "string", "string"] }
    Constraint: No conversational filler. Direct impact only.
    `

    try {
        const response = await callOpenRouter({
            model: 'nvidia/nemotron-3-nano-30b-a3b:free',
            messages: [
                {
                    role: 'system',
                    content: 'You are a logistics engine. Output concise JSON. Strip all pleasantries.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.1
        })

        const content = response.choices[0].message.content
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)

        return {
            summary: compressText(result.summary, { maxChars: 160 }),
            tradeoffs: compressBullets(result.tradeoffs, { maxChars: 70 })
        }
    } catch (error) {
        console.error('Explanation generation failed:', error)
        return {
            summary: `Scenario shift identified. Cost variance of $${costDelta.toLocaleString()} recorded due to network constraints.`,
            tradeoffs: compressBullets(['Direct fiscal variance', 'Tactical network reroute', 'Capacity boundary shift']),
            isDegraded: true
        }
    }
}
