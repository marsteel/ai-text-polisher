// AI API Client - Generic client supporting multiple AI providers

class AIClient {
    constructor(apiUrl, apiKey, modelName, provider = 'openai') {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.modelName = modelName;
        this.provider = provider;
    }

    /**
     * Get provider-specific adapter
     * @returns {Object} - Provider adapter with methods for building requests and parsing responses
     */
    getProviderAdapter() {
        const adapters = {
            openai: {
                buildRequest: (prompt, model) => ({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 2000
                }),
                parseResponse: (data) => {
                    if (!data?.choices?.[0]?.message?.content) {
                        throw new Error('Invalid API response format');
                    }
                    return data.choices[0].message.content.trim();
                },
                getHeaders: (apiKey) => ({
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }),
                getEndpoint: (baseEndpoint) => baseEndpoint
            },

            azure: {
                buildRequest: (prompt, model) => ({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 2000
                }),
                parseResponse: (data) => {
                    if (!data?.choices?.[0]?.message?.content) {
                        throw new Error('Invalid API response format');
                    }
                    return data.choices[0].message.content.trim();
                },
                getHeaders: (apiKey) => ({
                    'Content-Type': 'application/json',
                    'api-key': apiKey
                }),
                getEndpoint: (baseEndpoint) => baseEndpoint
            },

            anthropic: {
                buildRequest: (prompt, model) => ({
                    model: model,
                    max_tokens: 2000,
                    messages: [{ role: 'user', content: prompt }]
                }),
                parseResponse: (data) => {
                    if (!data?.content?.[0]?.text) {
                        throw new Error('Invalid API response format');
                    }
                    return data.content[0].text.trim();
                },
                getHeaders: (apiKey) => ({
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                }),
                getEndpoint: (baseEndpoint) => baseEndpoint
            },

            gemini: {
                buildRequest: (prompt, model) => ({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                }),
                parseResponse: (data) => {
                    if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                        throw new Error('Invalid API response format');
                    }
                    return data.candidates[0].content.parts[0].text.trim();
                },
                getHeaders: (apiKey) => ({
                    'Content-Type': 'application/json'
                }),
                getEndpoint: (baseEndpoint, apiKey, model) => {
                    // Gemini needs model in URL path and API key as query parameter
                    return `${baseEndpoint}/${model}:generateContent?key=${apiKey}`;
                }
            },

            deepseek: {
                buildRequest: (prompt, model) => ({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 2000
                }),
                parseResponse: (data) => {
                    if (!data?.choices?.[0]?.message?.content) {
                        throw new Error('Invalid API response format');
                    }
                    return data.choices[0].message.content.trim();
                },
                getHeaders: (apiKey) => ({
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                }),
                getEndpoint: (baseEndpoint) => baseEndpoint
            }
        };

        return adapters[this.provider] || adapters.openai;
    }

    /**
     * Process text using AI
     * @param {string} prompt - The prompt to send to the AI
     * @param {string} text - The text to process
     * @returns {Promise<string>} - The processed text
     */
    async processText(prompt, text) {
        if (!this.apiKey) {
            throw new Error(chrome.i18n.getMessage('apiKeyMissing'));
        }

        // Replace {text} placeholder in prompt
        const fullPrompt = prompt.replace('{text}', text);

        try {
            const response = await this.makeRequest(fullPrompt);
            return response;
        } catch (error) {
            console.error('AI API Error:', error);
            throw this.handleError(error);
        }
    }

    /**
     * Make API request to AI service
     * @param {string} prompt - The full prompt
     * @returns {Promise<string>} - The AI response
     */
    async makeRequest(prompt) {
        const adapter = this.getProviderAdapter();
        const requestBody = adapter.buildRequest(prompt, this.modelName);
        const headers = adapter.getHeaders(this.apiKey);
        const endpoint = adapter.getEndpoint(this.apiUrl, this.apiKey, this.modelName);

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                // Extract detailed error message from various API formats
                if (errorData.error?.message) {
                    errorMessage = errorData.error.message;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = JSON.stringify(errorData.error);
                }
            } catch (e) {
                // If JSON parsing fails, try to get text
                const errorText = await response.text().catch(() => '');
                if (errorText) {
                    errorMessage = `${response.status}: ${errorText.substring(0, 200)}`;
                }
            }
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return adapter.parseResponse(data);
    }

    /**
     * Handle and format errors
     * @param {Error} error - The error object
     * @returns {Error} - Formatted error
     */
    handleError(error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return new Error(chrome.i18n.getMessage('networkError'));
        }

        if (error.message.includes('401') || error.message.includes('403')) {
            return new Error('Invalid API key');
        }

        if (error.message.includes('429')) {
            return new Error('Rate limit exceeded. Please try again later.');
        }

        return error;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIClient;
}
