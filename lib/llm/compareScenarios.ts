import { callOpenRouter } from './openrouter'

export interface ScenarioMetrics {
    name: string
    totalCost: number
    avgDistance: number
    modeMix: Record<string, number>
}

export interface ComparisonReport {
    executiveSummary: string
    risks: string[]
    costDrivers: string[]
}

/**
 * Generates an executive comparison between a baseline and a test scenario.
 */
export async function compareScenarios(
    baseline: ScenarioMetrics,
    scenario: ScenarioMetrics
): Promise<ComparisonReport> {
    const prompt = `
    Compare the following logistics scenarios:

    BASELINE (${baseline.name}):
    - Total Cost: $${baseline.totalCost.toLocaleString()}
    - Avg Distance: ${baseline.avgDistance}km
    - Mode Mix: ${JSON.stringify(baseline.modeMix)}

    TEST SCENARIO (${scenario.name}):
    - Total Cost: $${scenario.totalCost.toLocaleString()}
    - Avg Distance: ${scenario.avgDistance}km
    - Mode Mix: ${JSON.stringify(scenario.modeMix)}

    Generate:
    1. An executive summary (5-7 lines) characterizing the impact of the changes.
    2. A list of potential supply chain risks.
    3. The primary cost drivers causing the variance.

    Format the response as JSON with keys: "executiveSummary", "risks" (array), and "costDrivers" (array).
  `

    try {
        const response = await callOpenRouter({
            model: 'liquid/lfm-2.5-1.2b-instruct:free',
            messages: [
                {
                    role: 'system',
                    content: 'You are a Chief Supply Chain Officer analyzing network resilience. Return only JSON.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.4
        })

        const content = response.choices[0].message.content
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        const result = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content)

        return {
            executiveSummary: result.executiveSummary,
            risks: result.risks,
            costDrivers: result.costDrivers
        }
    } catch (error) {
        console.error('Scenario comparison failed:', error)
        return {
            executiveSummary: 'Comparison analysis unavailable due to system latency.',
            risks: ['Unknown network vulnerabilities'],
            costDrivers: ['Mode-specific cost variance']
        }
    }
}
