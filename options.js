// Options page script

// AI Provider presets
const AI_PROVIDERS = {
    openai: {
        name: 'OpenAI',
        url: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o-mini'
    },
    azure: {
        name: 'Azure OpenAI',
        url: 'https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT/chat/completions?api-version=2024-02-15-preview',
        model: 'gpt-4'
    },
    anthropic: {
        name: 'Anthropic (Claude)',
        url: 'https://api.anthropic.com/v1/messages',
        model: 'claude-3-5-sonnet-20241022'
    },
    gemini: {
        name: 'Google Gemini',
        url: 'https://generativelanguage.googleapis.com/v1beta/models',
        model: 'gemini-2.5-flash'
    },
    deepseek: {
        name: 'DeepSeek',
        url: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat'
    },
    custom: {
        name: 'Custom',
        url: '',
        model: ''
    }
};

// Smart API Key Detection
/**
 * Detect AI provider from API key format
 * @param {string} key - The API key to analyze
 * @returns {string|null} - Provider ID or null if not recognized
 */
function detectProviderFromKey(key) {
    if (!key || key.startsWith('*')) return null;

    // Anthropic Claude: sk-ant-api03-...
    if (key.startsWith('sk-ant-')) {
        return 'anthropic';
    }

    // OpenAI: sk-proj-... (new project keys) or sk-... (legacy, length > 40)
    if (key.startsWith('sk-proj-') || (key.startsWith('sk-') && key.length > 40)) {
        return 'openai';
    }

    // Google Gemini: AIzaSy...
    if (key.startsWith('AIzaSy')) {
        return 'gemini';
    }

    // DeepSeek: sk-[32 hex characters]
    if (key.startsWith('sk-') && /^sk-[0-9a-f]{32}$/i.test(key)) {
        return 'deepseek';
    }

    return null;
}

/**
 * Handle API key input and auto-detect provider
 * @param {Event} e - Input event
 */
function handleApiKeyInput(e) {
    const key = e.target.value;
    const detectedProvider = detectProviderFromKey(key);
    const detectionStatus = document.getElementById("detectionStatus");

    if (detectedProvider) {
        const providerSelect = document.getElementById("aiProvider");
        const apiUrlInput = document.getElementById("apiUrl");
        const modelNameInput = document.getElementById("modelName");

        // Only update provider and trigger change if it's different
        // This respects user's current configuration when provider matches
        if (providerSelect && providerSelect.value !== detectedProvider) {
            providerSelect.value = detectedProvider;

            // Trigger change event to auto-fill endpoint and model
            providerSelect.dispatchEvent(new Event('change'));

            console.log(`[Smart Detection] Auto-switched to provider: ${detectedProvider}`);
        } else {
            console.log(`[Smart Detection] Detected provider matches current selection: ${detectedProvider}`);
        }

        // Show inline notification after a brief delay to ensure model value is populated
        // This provides confirmation feedback to the user
        setTimeout(() => {
            if (detectionStatus && modelNameInput) {
                const providerNames = {
                    'openai': 'OpenAI',
                    'anthropic': 'Anthropic (Claude)',
                    'gemini': 'Google Gemini',
                    'deepseek': 'DeepSeek',
                    'azure': 'Azure OpenAI',
                    'custom': 'Custom'
                };

                const providerName = providerNames[detectedProvider] || detectedProvider;
                const modelName = modelNameInput.value || 'default';

                detectionStatus.style.display = 'block';
                detectionStatus.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                detectionStatus.style.color = 'white';
                detectionStatus.style.border = 'none';
                detectionStatus.innerHTML = `
          <strong>✓ ${chrome.i18n.getMessage('detectedProvider', [providerName])}</strong><br>
          ${chrome.i18n.getMessage('defaultModelSet')} <code style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px;">${modelName}</code><br>
          <span style="font-size: 12px; opacity: 0.9;">${chrome.i18n.getMessage('checkAdvancedSettings')}</span>
        `;

                // Auto-hide after 8 seconds
                setTimeout(() => {
                    if (detectionStatus) {
                        detectionStatus.style.display = 'none';
                    }
                }, 8000);
            }
        }, 100); // Small delay to let the change event complete
    } else if (detectionStatus && key.length > 10 && !key.startsWith('*')) {
        // Show warning if key doesn't match any pattern
        detectionStatus.style.display = 'block';
        detectionStatus.style.background = '#fef3c7';
        detectionStatus.style.color = '#92400e';
        detectionStatus.style.border = '1px solid #fbbf24';
        detectionStatus.innerHTML = `
      <strong>⚠️ ${chrome.i18n.getMessage('unrecognizedKey')}</strong><br>
      <span style="font-size: 12px;">${chrome.i18n.getMessage('manualSelection')}</span>
    `;

        setTimeout(() => {
            if (detectionStatus) {
                detectionStatus.style.display = 'none';
            }
        }, 5000);
    }
}

// Import storage functions (loaded via script tag)
let currentEditingActionId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadI18nStrings();
    loadVersion();
    loadSettings();
    loadDarkMode();
    setupEventListeners();
});

/**
 * Load internationalized strings
 */
function loadI18nStrings() {
    document.getElementById('optionsTitle').textContent = chrome.i18n.getMessage('optionsTitle');
    document.getElementById('apiSettingsTitle').textContent = chrome.i18n.getMessage('apiSettings');
    document.getElementById('aiProviderLabel').textContent = chrome.i18n.getMessage('aiProvider') || 'AI Provider';
    document.getElementById('aiProviderHelp').textContent = chrome.i18n.getMessage('aiProviderHelp');
    document.getElementById('apiUrlLabel').textContent = chrome.i18n.getMessage('apiUrl');
    document.getElementById('apiUrlHelp').textContent = chrome.i18n.getMessage('apiUrlHelp');
    document.getElementById('apiKeyLabel').textContent = chrome.i18n.getMessage('apiKey');
    document.getElementById('apiKeyHelp').textContent = chrome.i18n.getMessage('apiKeyHelp');
    document.getElementById('modelNameLabel').textContent = chrome.i18n.getMessage('modelName');
    document.getElementById('modelNameHelp').textContent = chrome.i18n.getMessage('modelNameHelp');
    document.getElementById('testConnectionText').textContent = chrome.i18n.getMessage('testConnection') || 'Test Connection';
    document.getElementById('saveApiText').textContent = chrome.i18n.getMessage('saveApiSettings') || 'Save API Settings';
    document.getElementById('websiteLinkText').textContent = chrome.i18n.getMessage('websiteLink') || 'Documentation & Privacy Policy';
    document.getElementById('actionsTitle').textContent = chrome.i18n.getMessage('actions');
    document.getElementById('actionsDescription').textContent = chrome.i18n.getMessage('actionsDescription');
    document.getElementById('addActionText').textContent = chrome.i18n.getMessage('addAction');
    document.getElementById('saveText').textContent = chrome.i18n.getMessage('save');
    document.getElementById('actionNameLabel').textContent = chrome.i18n.getMessage('actionName');
    document.getElementById('actionPromptLabel').textContent = chrome.i18n.getMessage('actionPrompt');
    document.getElementById('cancelText').textContent = chrome.i18n.getMessage('cancel');
    document.getElementById('saveActionText').textContent = chrome.i18n.getMessage('save');
}

/**
 * Load version from manifest
 */
async function loadVersion() {
    const manifest = chrome.runtime.getManifest();
    document.getElementById('versionBadge').textContent = 'v' + manifest.version;
}

/**
 * Load settings from storage
 */
async function loadSettings() {
    const settings = await chrome.storage.sync.get(null);

    // Load AI provider selection
    const provider = settings.aiProvider || 'openai';
    document.getElementById('aiProvider').value = provider;

    // Load API settings
    document.getElementById('apiUrl').value = settings.apiUrl || '';
    document.getElementById('apiKey').value = settings.apiKey || '';
    document.getElementById('modelName').value = settings.modelName || '';

    // Load actions
    renderActions(settings.actions || []);
}

/**
 * Load and apply dark mode based on system preference
 * Automatically detects and follows system theme
 */
async function loadDarkMode() {
    // Check if system prefers dark mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Apply system preference
    applyDarkMode(prefersDark);

    // Listen for system theme changes and update in real-time
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
        applyDarkMode(e.matches);
    });
}

/**
 * Apply dark mode to the page
 * @param {boolean} enabled - Whether dark mode is enabled
 */
function applyDarkMode(enabled) {
    if (enabled) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

/**
 * Render actions list
 */
function renderActions(actions) {
    const actionsList = document.getElementById('actionsList');
    actionsList.innerHTML = '';

    if (actions.length === 0) {
        actionsList.innerHTML = '<div class="empty-state">No actions configured. Click "Add Action" to create one.</div>';
        return;
    }

    actions.forEach(action => {
        const actionCard = document.createElement('div');
        actionCard.className = 'action-card';
        actionCard.innerHTML = `
      <div class="action-info">
        <div class="action-name">${escapeHtml(action.name)}</div>
        <div class="action-prompt-preview">${escapeHtml(action.prompt.substring(0, 100))}${action.prompt.length > 100 ? '...' : ''}</div>
      </div>
      <div class="action-buttons">
        <button class="btn-icon edit-btn" data-id="${action.id}" title="${chrome.i18n.getMessage('editAction')}">
          ✏️
        </button>
        <button class="btn-icon delete-btn" data-id="${action.id}" title="${chrome.i18n.getMessage('deleteAction')}">
          🗑️
        </button>
      </div>
    `;
        actionsList.appendChild(actionCard);
    });

    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => editAction(btn.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteAction(btn.dataset.id));
    });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Smart API key detection
    const apiKeyInput = document.getElementById('apiKey');
    if (apiKeyInput) {
        apiKeyInput.addEventListener('input', handleApiKeyInput);
    }

    // AI Provider selection
    document.getElementById('aiProvider').addEventListener('change', handleProviderChange);

    // Test connection button
    document.getElementById('testConnectionBtn').addEventListener('click', testConnection);

    // Save API settings button
    document.getElementById('saveApiBtn').addEventListener('click', saveApiSettings);

    // Save button (all settings)
    document.getElementById('saveBtn').addEventListener('click', saveSettings);

    // Add action button
    document.getElementById('addActionBtn').addEventListener('click', () => {
        currentEditingActionId = null;
        document.getElementById('modalTitle').textContent = chrome.i18n.getMessage('addAction');
        document.getElementById('actionName').value = '';
        document.getElementById('actionPrompt').value = '';
        showModal();
    });

    // Modal buttons
    document.getElementById('closeModal').addEventListener('click', hideModal);
    document.getElementById('cancelActionBtn').addEventListener('click', hideModal);
    document.getElementById('saveActionBtn').addEventListener('click', saveAction);

    // Close modal on outside click
    document.getElementById('actionModal').addEventListener('click', (e) => {
        if (e.target.id === 'actionModal') {
            hideModal();
        }
    });
}

/**
 * Handle AI provider selection change
 */
function handleProviderChange() {
    const provider = document.getElementById('aiProvider').value;
    const config = AI_PROVIDERS[provider];

    if (config && provider !== 'custom') {
        document.getElementById('apiUrl').value = config.url;
        document.getElementById('modelName').value = config.model;
    }

    // Update model help text with provider-specific recommendations
    updateModelRecommendation(provider);
}

/**
 * Update model recommendation text based on provider
 */
function updateModelRecommendation(provider) {
    const modelHelpEl = document.getElementById('modelNameHelp');
    const baseText = chrome.i18n.getMessage('modelNameHelp');

    const recommendKey = `modelRecommend${provider.charAt(0).toUpperCase() + provider.slice(1)}`;
    const recommendation = chrome.i18n.getMessage(recommendKey);

    if (recommendation) {
        modelHelpEl.textContent = `${baseText}. ${recommendation}`;
    } else {
        modelHelpEl.textContent = baseText;
    }
}

/**
 * Test API connection
 */
async function testConnection() {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    const apiKey = document.getElementById('apiKey').value.trim();
    const modelName = document.getElementById('modelName').value.trim();
    const provider = document.getElementById('aiProvider').value;
    const testBtn = document.getElementById('testConnectionBtn');
    const testStatus = document.getElementById('testStatus');

    // Validate inputs
    if (!apiUrl || !apiKey || !modelName) {
        showTestStatus(chrome.i18n.getMessage('fillAllFields'), 'error');
        return;
    }

    // Show loading state
    testBtn.disabled = true;
    testBtn.classList.add('loading');
    testStatus.className = 'test-status';

    try {
        // Build provider-specific request
        let requestBody, headers, testEndpoint;

        if (provider === 'gemini') {
            // Gemini format
            testEndpoint = `${apiUrl}/${modelName}:generateContent?key=${apiKey}`;
            headers = { 'Content-Type': 'application/json' };
            requestBody = {
                contents: [{ parts: [{ text: 'Hello' }] }]
            };
        } else if (provider === 'anthropic') {
            // Anthropic format
            testEndpoint = apiUrl;
            headers = {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json'
            };
            requestBody = {
                model: modelName,
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hello' }]
            };
        } else if (provider === 'azure') {
            // Azure OpenAI format
            testEndpoint = apiUrl;
            headers = {
                'api-key': apiKey,
                'Content-Type': 'application/json'
            };
            requestBody = {
                model: modelName,
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 10
            };
        } else {
            // OpenAI, DeepSeek, and other OpenAI-compatible formats
            testEndpoint = apiUrl;
            headers = {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            };
            requestBody = {
                model: modelName,
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 10
            };
        }

        const response = await fetch(testEndpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody)
        });

        if (response.ok) {
            showTestStatus(chrome.i18n.getMessage('testConnectionSuccess'), 'success');
        } else {
            // Try to parse error details from response
            let errorMessage = `${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                // Extract detailed error message if available
                if (errorData.error?.message) {
                    errorMessage = `${response.status}: ${errorData.error.message}`;
                } else if (errorData.message) {
                    errorMessage = `${response.status}: ${errorData.message}`;
                } else if (errorData.error) {
                    errorMessage = `${response.status}: ${JSON.stringify(errorData.error)}`;
                }
            } catch (e) {
                // If JSON parsing fails, use text response
                const errorText = await response.text().catch(() => '');
                if (errorText) {
                    errorMessage = `${response.status}: ${errorText.substring(0, 200)}`;
                }
            }
            showTestStatus(`${chrome.i18n.getMessage('testConnectionFailed')} ${errorMessage}`, 'error');
        }
    } catch (error) {
        let errorMsg = error.message;
        // Add helpful hint for CORS/network errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            const networkHint = provider === 'azure'
                ? chrome.i18n.getMessage('azureNetworkErrorHint')
                : chrome.i18n.getMessage('networkErrorHint');
            errorMsg = `${chrome.i18n.getMessage('networkError')} ${networkHint}`;
        }
        showTestStatus(`✗ Connection failed: ${errorMsg}`, 'error');
    } finally {
        testBtn.disabled = false;
        testBtn.classList.remove('loading');
    }
}

/**
 * Show test status message
 */
function showTestStatus(message, type) {
    const testStatus = document.getElementById('testStatus');
    testStatus.textContent = message;
    testStatus.className = `test-status ${type}`;
}

/**
 * Save API settings only
 */
async function saveApiSettings() {
    const settings = {
        aiProvider: document.getElementById('aiProvider').value,
        apiUrl: document.getElementById('apiUrl').value.trim(),
        apiKey: document.getElementById('apiKey').value.trim(),
        modelName: document.getElementById('modelName').value.trim()
    };

    // Validate
    if (!settings.apiUrl) {
        showApiStatus(chrome.i18n.getMessage('apiUrlRequired'), 'error');
        return;
    }

    if (!settings.apiKey) {
        showApiStatus(chrome.i18n.getMessage('apiKeyRequired'), 'error');
        return;
    }

    if (!settings.modelName) {
        showApiStatus(chrome.i18n.getMessage('modelNameRequired'), 'error');
        return;
    }

    // Get current actions to preserve them
    const currentSettings = await chrome.storage.sync.get('actions');
    settings.actions = currentSettings.actions || [];

    // Save to storage
    await chrome.storage.sync.set(settings);

    showApiStatus(chrome.i18n.getMessage('apiSettingsSaved'), 'success');
}

/**
 * Show API save status message
 */
function showApiStatus(message, type) {
    const statusEl = document.getElementById('saveApiStatus');
    statusEl.textContent = message;
    statusEl.className = `save-status ${type}`;
    statusEl.style.display = 'block';

    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

/**
 * Save settings
 */
async function saveSettings() {
    const settings = {
        aiProvider: document.getElementById('aiProvider').value,
        apiUrl: document.getElementById('apiUrl').value.trim(),
        apiKey: document.getElementById('apiKey').value.trim(),
        modelName: document.getElementById('modelName').value.trim()
    };

    // Validate
    if (!settings.apiUrl) {
        showStatus(chrome.i18n.getMessage('apiUrlRequired'), 'error');
        return;
    }

    if (!settings.apiKey) {
        showStatus(chrome.i18n.getMessage('apiKeyRequired'), 'error');
        return;
    }

    if (!settings.modelName) {
        showStatus(chrome.i18n.getMessage('modelNameRequired'), 'error');
        return;
    }

    // Get current actions
    const currentSettings = await chrome.storage.sync.get('actions');
    settings.actions = currentSettings.actions || [];

    // Save to storage
    await chrome.storage.sync.set(settings);

    showStatus(chrome.i18n.getMessage('settingsSaved'), 'success');
}

/**
 * Edit action
 */
async function editAction(actionId) {
    const settings = await chrome.storage.sync.get('actions');
    const action = settings.actions.find(a => a.id === actionId);

    if (!action) return;

    currentEditingActionId = actionId;
    document.getElementById('modalTitle').textContent = chrome.i18n.getMessage('editAction');
    document.getElementById('actionName').value = action.name;
    document.getElementById('actionPrompt').value = action.prompt;
    showModal();
}

/**
 * Delete action
 */
async function deleteAction(actionId) {
    if (!confirm(chrome.i18n.getMessage('confirmDeleteAction'))) {
        return;
    }

    const settings = await chrome.storage.sync.get('actions');
    settings.actions = settings.actions.filter(a => a.id !== actionId);

    await chrome.storage.sync.set({ actions: settings.actions });
    renderActions(settings.actions);
    showStatus(chrome.i18n.getMessage('actionDeleted'), 'success');
}

/**
 * Save action (add or update)
 */
async function saveAction() {
    const name = document.getElementById('actionName').value.trim();
    const prompt = document.getElementById('actionPrompt').value.trim();

    if (!name) {
        alert(chrome.i18n.getMessage('actionNameRequired'));
        return;
    }

    if (!prompt) {
        alert(chrome.i18n.getMessage('promptRequired'));
        return;
    }

    if (!prompt.includes('{text}')) {
        alert(chrome.i18n.getMessage('promptMustIncludePlaceholder'));
        return;
    }

    const settings = await chrome.storage.sync.get('actions');
    let actions = settings.actions || [];

    if (currentEditingActionId) {
        // Update existing action
        const index = actions.findIndex(a => a.id === currentEditingActionId);
        if (index !== -1) {
            actions[index] = { ...actions[index], name, prompt };
        }
    } else {
        // Add new action
        const newAction = {
            id: `action_${Date.now()}`,
            name,
            prompt
        };
        actions.push(newAction);
    }

    await chrome.storage.sync.set({ actions });
    renderActions(actions);
    hideModal();
    showStatus(currentEditingActionId ? chrome.i18n.getMessage('actionUpdated') : chrome.i18n.getMessage('actionAdded'), 'success');
}

/**
 * Show modal
 */
function showModal() {
    document.getElementById('actionModal').style.display = 'flex';
}

/**
 * Hide modal
 */
function hideModal() {
    document.getElementById('actionModal').style.display = 'none';
    currentEditingActionId = null;
}

/**
 * Show status message
 */
function showStatus(message, type) {
    const statusEl = document.getElementById('saveStatus');
    statusEl.textContent = message;
    statusEl.className = `save-status ${type}`;
    statusEl.style.display = 'block';

    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
