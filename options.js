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

// Import storage functions (loaded via script tag)
let currentEditingActionId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadI18nStrings();
    loadVersion();
    loadSettings();
    setupEventListeners();
});

/**
 * Load internationalized strings
 */
function loadI18nStrings() {
    document.getElementById('optionsTitle').textContent = chrome.i18n.getMessage('optionsTitle');
    document.getElementById('apiSettingsTitle').textContent = chrome.i18n.getMessage('apiSettings');
    document.getElementById('aiProviderLabel').textContent = chrome.i18n.getMessage('aiProvider') || 'AI Provider';
    document.getElementById('apiUrlLabel').textContent = chrome.i18n.getMessage('apiUrl');
    document.getElementById('apiKeyLabel').textContent = chrome.i18n.getMessage('apiKey');
    document.getElementById('modelNameLabel').textContent = chrome.i18n.getMessage('modelName');
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
        showTestStatus('Please fill in all API settings before testing', 'error');
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
            showTestStatus('✓ Connection successful! API is working correctly.', 'success');
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
            showTestStatus(`✗ Connection failed: ${errorMessage}`, 'error');
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
        showApiStatus('API URL is required', 'error');
        return;
    }

    if (!settings.apiKey) {
        showApiStatus('API Key is required', 'error');
        return;
    }

    if (!settings.modelName) {
        showApiStatus('Model Name is required', 'error');
        return;
    }

    // Get current actions to preserve them
    const currentSettings = await chrome.storage.sync.get('actions');
    settings.actions = currentSettings.actions || [];

    // Save to storage
    await chrome.storage.sync.set(settings);

    showApiStatus('API settings saved successfully!', 'success');
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
        showStatus('API URL is required', 'error');
        return;
    }

    if (!settings.apiKey) {
        showStatus('API Key is required', 'error');
        return;
    }

    if (!settings.modelName) {
        showStatus('Model Name is required', 'error');
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
    if (!confirm('Are you sure you want to delete this action?')) {
        return;
    }

    const settings = await chrome.storage.sync.get('actions');
    settings.actions = settings.actions.filter(a => a.id !== actionId);

    await chrome.storage.sync.set({ actions: settings.actions });
    renderActions(settings.actions);
    showStatus('Action deleted', 'success');
}

/**
 * Save action (add or update)
 */
async function saveAction() {
    const name = document.getElementById('actionName').value.trim();
    const prompt = document.getElementById('actionPrompt').value.trim();

    if (!name) {
        alert('Action name is required');
        return;
    }

    if (!prompt) {
        alert('Prompt is required');
        return;
    }

    if (!prompt.includes('{text}')) {
        alert('Prompt must include {text} placeholder');
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
    showStatus(currentEditingActionId ? 'Action updated' : 'Action added', 'success');
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
