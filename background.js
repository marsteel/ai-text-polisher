// Background Service Worker

// Import storage and AI client (note: in service workers, we need to use importScripts)
importScripts('storage.js', 'ai-client.js', 'notifications.js');

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async () => {
    console.log('AI Text Polisher installed');

    // Initialize storage with default settings
    await initializeStorage();

    // Create context menus
    await createContextMenus();
});

// Recreate context menus on startup
chrome.runtime.onStartup.addListener(async () => {
    await createContextMenus();
});

// Listen for storage changes to update context menus
chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'sync' && changes.actions) {
        await createContextMenus();
    }
});

/**
 * Create context menus based on saved actions
 */
async function createContextMenus() {
    // Remove all existing context menus
    await chrome.contextMenus.removeAll();

    // Get actions from storage
    const actions = await getActions();

    if (actions.length === 0) {
        console.warn('No actions configured');
        return;
    }

    // Create parent menu
    chrome.contextMenus.create({
        id: 'ai-text-polisher-parent',
        title: chrome.i18n.getMessage('contextMenuTitle'),
        contexts: ['selection']
    });

    // Create menu item for each action
    actions.forEach(action => {
        chrome.contextMenus.create({
            id: `action_${action.id}`,
            parentId: 'ai-text-polisher-parent',
            title: action.name,
            contexts: ['selection']
        });
    });
}

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!info.menuItemId.startsWith('action_')) {
        return;
    }

    const selectedText = info.selectionText;

    if (!selectedText) {
        showErrorNotification(chrome.i18n.getMessage('noTextSelected'));
        return;
    }

    // Extract action ID
    const actionId = info.menuItemId.replace('action_', '');

    // Get the action
    const actions = await getActions();
    const action = actions.find(a => a.id === actionId);

    if (!action) {
        showErrorNotification('Action not found');
        return;
    }

    // Show visual feedback - badge and notification
    setBadge('⏳', '#FFA500', 'Processing...');
    broadcastStatus('processing', action.name);

    // Show a more prominent notification
    showInfoNotification(
        chrome.i18n.getMessage('processing'),
        `Processing with "${action.name}"...`
    );

    try {
        // Get API settings
        const settings = await getSettings();

        if (!settings.apiKey) {
            throw new Error(chrome.i18n.getMessage('apiKeyMissing'));
        }

        // Create AI client
        const aiClient = new AIClient(
            settings.apiUrl,
            settings.apiKey,
            settings.modelName,
            settings.aiProvider || 'openai'
        );

        // Process text
        const result = await aiClient.processText(action.prompt, selectedText);

        // Copy to clipboard
        await copyToClipboard(result, tab.id);

        // Show success feedback - badge and notification
        setBadge('✓', '#10B981', 'Success!');
        showSuccessNotification(chrome.i18n.getMessage('copiedToClipboard'));

        // Notify popup of success
        broadcastStatus('success', result);

        // Clear badge after 3 seconds
        setTimeout(() => {
            clearBadge();
        }, 3000);

    } catch (error) {
        console.error('Error processing text:', error);

        // Show error feedback - badge and notification
        setBadge('✕', '#EF4444', 'Error');
        showErrorNotification(error.message || chrome.i18n.getMessage('errorProcessing'));

        // Notify popup of error
        broadcastStatus('error', error.message);

        // Clear badge after 5 seconds
        setTimeout(() => {
            clearBadge();
        }, 5000);
    }
});

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @param {number} tabId - Tab ID to execute script in
 */
async function copyToClipboard(text, tabId) {
    try {
        // Use the Clipboard API via content script injection
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: (textToCopy) => {
                navigator.clipboard.writeText(textToCopy);
            },
            args: [text]
        });
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        throw new Error('Failed to copy to clipboard');
    }
}

/**
 * Broadcast status to popup and other listeners
 * @param {string} status - Status type: 'processing', 'success', 'error'
 * @param {string} data - Additional data
 */
function broadcastStatus(status, data) {
    chrome.runtime.sendMessage({
        type: 'status',
        status: status,
        data: data
    }).catch(() => {
        // Popup might not be open, ignore error
    });
}

/**
 * Set badge on extension icon
 * @param {string} text - Badge text
 * @param {string} color - Badge background color
 * @param {string} title - Tooltip text
 */
function setBadge(text, color, title) {
    chrome.action.setBadgeText({ text: text });
    chrome.action.setBadgeBackgroundColor({ color: color });
    chrome.action.setTitle({ title: `AI Text Polisher - ${title}` });
}

/**
 * Clear badge from extension icon
 */
function clearBadge() {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setTitle({ title: 'AI Text Polisher' });
}

/**
 * Handle messages from popup or other components
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'getStatus') {
        sendResponse({ status: 'ready' });
    }
    return true;
});
