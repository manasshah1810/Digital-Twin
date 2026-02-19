import { callOpenRouter } from '../llm/openrouter'
import { compressBullets } from '../llm/compressor'

export interface RecommendationConfig {
    deltas: {
        absolute: number
        percentage: number
    }
    bottlenecks: any[]
    modeBreakdown: Record<string, number>
}

/**
 * Generates actionable recommendations based on scenario results.
 */
export async function generateRecommendations(config: RecommendationConfig): Promise<string[]> {
    const prompt = `
    Logistics simulation output:
    - Cost Delta: $${config.deltas.absolute.toLocaleString()} (${config.deltas.percentage.toFixed(1)}%)
    - Bottlenecks: ${config.bottlenecks.map(b => `${b.entity}: ${b.impact}`).join('; ') || 'None'}
    
    Task: Return 3 high-priority actionable recommendations (JSON array).
    Constraint: Telegrammatic style. No pleasantries. High density. No filler phrases.
    `

    try {
        const response = await callOpenRouter({
            model: 'nvidia/nemotron-3-nano-30b-a3b:free',
            messages: [
                {
                    role: 'system',
                    content: 'You are a supply chain kernel. Output high-density strategic JSON arrays.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.1
        })

        const content = response.choices[0].message.content
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        const rawRecs = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)

        return compressBullets(rawRecs, { maxChars: 90 })
    } catch (error) {
        console.error('Recommendation generation failed:', error)
        return compressBullets([
            'Audit high-variance segments for modal shift eligibility.',
            'Trigger contract review for fuel surcharge protection.',
            'Allocate buffer capacity for identified congestion zones.'
        ])
    }
}
