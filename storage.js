// Storage helper functions for managing extension settings

const DEFAULT_SETTINGS = {
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    modelName: 'gpt-3.5-turbo',
    actions: [
        {
            id: 'polish',
            name: chrome.i18n.getMessage('defaultActionPolish'),
            prompt: 'Please polish and improve the following text, making it clearer and more professional while maintaining its original meaning:\n\n{text}'
        },
        {
            id: 'grammar',
            name: chrome.i18n.getMessage('defaultActionGrammar'),
            prompt: 'Please fix all grammar and spelling errors in the following text:\n\n{text}'
        },
        {
            id: 'professional',
            name: chrome.i18n.getMessage('defaultActionProfessional'),
            prompt: 'Please rewrite the following text in a professional tone:\n\n{text}'
        },
        {
            id: 'simplify',
            name: chrome.i18n.getMessage('defaultActionSimplify'),
            prompt: 'Please simplify the following text to make it easier to understand:\n\n{text}'
        },
        {
            id: 'summarize',
            name: chrome.i18n.getMessage('defaultActionSummarize'),
            prompt: 'Please provide a concise summary of the following text:\n\n{text}'
        }
    ]
};

// Initialize storage with default settings
async function initializeStorage() {
    const stored = await chrome.storage.sync.get(null);

    if (!stored.apiUrl) {
        await chrome.storage.sync.set(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
    }

    return stored;
}

// Get all settings
async function getSettings() {
    const settings = await chrome.storage.sync.get(null);

    // Ensure we have default values
    if (!settings.apiUrl) {
        return await initializeStorage();
    }

    return settings;
}

// Save settings
async function saveSettings(settings) {
    await chrome.storage.sync.set(settings);
}

// Get specific setting
async function getSetting(key) {
    const result = await chrome.storage.sync.get(key);
    return result[key];
}

// Save specific setting
async function saveSetting(key, value) {
    await chrome.storage.sync.set({ [key]: value });
}

// Get all actions
async function getActions() {
    const settings = await getSettings();
    return settings.actions || DEFAULT_SETTINGS.actions;
}

// Save actions
async function saveActions(actions) {
    await saveSetting('actions', actions);
}

// Add new action
async function addAction(action) {
    const actions = await getActions();
    action.id = `action_${Date.now()}`;
    actions.push(action);
    await saveActions(actions);
    return action;
}

// Update action
async function updateAction(actionId, updatedAction) {
    const actions = await getActions();
    const index = actions.findIndex(a => a.id === actionId);

    if (index !== -1) {
        actions[index] = { ...actions[index], ...updatedAction };
        await saveActions(actions);
        return actions[index];
    }

    return null;
}

// Delete action
async function deleteAction(actionId) {
    const actions = await getActions();
    const filtered = actions.filter(a => a.id !== actionId);
    await saveActions(filtered);
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeStorage,
        getSettings,
        saveSettings,
        getSetting,
        saveSetting,
        getActions,
        saveActions,
        addAction,
        updateAction,
        deleteAction,
        DEFAULT_SETTINGS
    };
}
