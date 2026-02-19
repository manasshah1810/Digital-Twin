import { callOpenRouter } from '../llm/openrouter'
import { compressBullets } from '../llm/compressor'

export interface ImplicationConfig {
    deltas: {
        absolute: number
        percentage: number
    }
    bottlenecks: any[]
    modeBreakdown: Record<string, number>
    baselineModeBreakdown?: Record<string, number>
}

/**
 * Generates concise operational implications of a logistics scenario change.
 */
export async function generateOperationalImplications(config: ImplicationConfig): Promise<string[]> {
    const prompt = `
    Analyze logistics simulation:
    - Delta: $${config.deltas.absolute.toLocaleString()} (${config.deltas.percentage.toFixed(1)}%)
    - Bottlenecks: ${config.bottlenecks.map(b => `${b.entity} [${b.type}]`).join(', ') || 'None'}
    - Modes: ${JSON.stringify(config.modeBreakdown)}
    
    Output exactly 3-4 high-density operational bullet points (JSON array).
    Constraint: No filler phrases like "the analysis suggests". Use professional telegrammatic style.
    `

    try {
        const response = await callOpenRouter({
            model: 'liquid/lfm-2.5-1.2b-instruct:free',
            messages: [
                {
                    role: 'system',
                    content: 'You are a logistics dashboard API. Return only a JSON array of concise strings.'
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
        const rawImplications = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)

        return compressBullets(rawImplications, { maxChars: 85 })
    } catch (error) {
        console.error('Operational implication generation failed:', error)
        return compressBullets([
            `Fiscal exposure: $${config.deltas.absolute.toLocaleString()} variance.`,
            'Corridor rerouting active due to capacity boundaries.',
            'Manual throughput monitoring required at primary terminals.'
        ])
    }
}
