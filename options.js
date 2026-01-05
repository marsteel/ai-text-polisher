// Options page script

// Import storage functions (loaded via script tag)
let currentEditingActionId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadI18nStrings();
    loadSettings();
    setupEventListeners();
});

/**
 * Load internationalized strings
 */
function loadI18nStrings() {
    document.getElementById('optionsTitle').textContent = chrome.i18n.getMessage('optionsTitle');
    document.getElementById('apiSettingsTitle').textContent = chrome.i18n.getMessage('apiSettings');
    document.getElementById('apiUrlLabel').textContent = chrome.i18n.getMessage('apiUrl');
    document.getElementById('apiKeyLabel').textContent = chrome.i18n.getMessage('apiKey');
    document.getElementById('modelNameLabel').textContent = chrome.i18n.getMessage('modelName');
    document.getElementById('actionsTitle').textContent = chrome.i18n.getMessage('actions');
    document.getElementById('addActionText').textContent = chrome.i18n.getMessage('addAction');
    document.getElementById('saveText').textContent = chrome.i18n.getMessage('save');
    document.getElementById('actionNameLabel').textContent = chrome.i18n.getMessage('actionName');
    document.getElementById('actionPromptLabel').textContent = chrome.i18n.getMessage('actionPrompt');
    document.getElementById('cancelText').textContent = chrome.i18n.getMessage('cancel');
    document.getElementById('saveActionText').textContent = chrome.i18n.getMessage('save');
}

/**
 * Load settings from storage
 */
async function loadSettings() {
    const settings = await chrome.storage.sync.get(null);

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
    // Save button
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
 * Save settings
 */
async function saveSettings() {
    const settings = {
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
