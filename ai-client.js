// AI API Client - Generic client supporting multiple AI providers

class AIClient {
    constructor(apiUrl, apiKey, modelName) {
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.modelName = modelName;
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
        const requestBody = this.buildRequestBody(prompt);

        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return this.extractResponse(data);
    }

    /**
     * Build request body based on API format
     * Supports OpenAI-compatible APIs
     * @param {string} prompt - The prompt
     * @returns {Object} - Request body
     */
    buildRequestBody(prompt) {
        // OpenAI-compatible format (works with OpenAI, Azure OpenAI, many others)
        return {
            model: this.modelName,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        };
    }

    /**
     * Extract response text from API response
     * @param {Object} data - API response data
     * @returns {string} - Extracted text
     */
    extractResponse(data) {
        // OpenAI format
        if (data.choices && data.choices[0]?.message?.content) {
            return data.choices[0].message.content.trim();
        }

        // Anthropic format
        if (data.content && data.content[0]?.text) {
            return data.content[0].text.trim();
        }

        // Generic fallback
        if (data.text) {
            return data.text.trim();
        }

        throw new Error('Unable to extract response from API');
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
