// Notification helper functions

/**
 * Show a success notification
 * @param {string} message - The message to display
 */
function showSuccessNotification(message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: chrome.i18n.getMessage('success'),
        message: message,
        priority: 1
    });
}

/**
 * Show an error notification
 * @param {string} message - The error message to display
 */
function showErrorNotification(message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: chrome.i18n.getMessage('error'),
        message: message,
        priority: 2
    });
}

/**
 * Show an info notification
 * @param {string} title - The notification title
 * @param {string} message - The message to display
 */
function showInfoNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: title,
        message: message,
        priority: 1
    });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showSuccessNotification,
        showErrorNotification,
        showInfoNotification
    };
}
