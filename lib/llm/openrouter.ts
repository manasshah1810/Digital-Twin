export interface OpenRouterMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export interface OpenRouterConfig {
    model: string
    messages: OpenRouterMessage[]
    temperature?: number
}

export interface OpenRouterResponse {
    id: string
    choices: {
        message: {
            content: string
        }
    }[]
}

export async function callOpenRouter(config: OpenRouterConfig): Promise<OpenRouterResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not defined')
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://digital-twin.local', // Required by OpenRouter
            'X-Title': 'Logistics Digital Twin'
        },
        body: JSON.stringify({
            model: config.model,
            messages: config.messages,
            temperature: config.temperature ?? 0.7
        })
    })

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenRouter API error: ${response.status} ${JSON.stringify(errorData)}`)
    }

    return response.json()
}
