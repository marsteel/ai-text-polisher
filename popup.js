// Popup script for visual feedback

// Load i18n strings
document.addEventListener('DOMContentLoaded', () => {
    loadI18nStrings();
    initializePopup();
});

/**
 * Load internationalized strings
 */
function loadI18nStrings() {
    document.getElementById('popupTitle').textContent = chrome.i18n.getMessage('popupTitle');
    document.getElementById('statusLabel').textContent = chrome.i18n.getMessage('popupStatus') + ':';
    document.getElementById('statusText').textContent = chrome.i18n.getMessage('popupReady');
    document.getElementById('loadingText').textContent = chrome.i18n.getMessage('processing');
    document.getElementById('openOptionsText').textContent = chrome.i18n.getMessage('popupOpenOptions');
}

/**
 * Initialize popup
 */
function initializePopup() {
    // Set up options button
    document.getElementById('openOptionsBtn').addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Listen for status updates from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'status') {
            handleStatusUpdate(message.status, message.data);
        }
    });

    // Request current status
    chrome.runtime.sendMessage({ type: 'getStatus' }, (response) => {
        if (response && response.status) {
            handleStatusUpdate(response.status);
        }
    });
}

/**
 * Handle status updates
 * @param {string} status - Status type: 'ready', 'processing', 'success', 'error'
 * @param {string} data - Additional data
 */
function handleStatusUpdate(status, data) {
    const statusValue = document.getElementById('statusValue');
    const statusText = document.getElementById('statusText');
    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('resultSection');
    const resultIcon = document.getElementById('resultIcon');
    const resultText = document.getElementById('resultText');

    // Hide all sections first
    loadingSection.style.display = 'none';
    resultSection.style.display = 'none';
    statusValue.style.display = 'flex';

    switch (status) {
        case 'processing':
            statusValue.style.display = 'none';
            loadingSection.style.display = 'flex';
            document.getElementById('loadingText').textContent =
                chrome.i18n.getMessage('processing') + (data ? `: ${data}` : '');
            break;

        case 'success':
            statusValue.style.display = 'none';
            resultSection.style.display = 'flex';
            resultIcon.className = 'result-icon success';
            resultIcon.textContent = '✓';
            resultText.textContent = chrome.i18n.getMessage('copiedToClipboard');

            // Auto-hide after 3 seconds
            setTimeout(() => {
                resultSection.style.display = 'none';
                statusValue.style.display = 'flex';
                updateStatusIndicator('ready');
            }, 3000);
            break;

        case 'error':
            statusValue.style.display = 'none';
            resultSection.style.display = 'flex';
            resultIcon.className = 'result-icon error';
            resultIcon.textContent = '✕';
            resultText.textContent = data || chrome.i18n.getMessage('errorProcessing');

            // Auto-hide after 5 seconds
            setTimeout(() => {
                resultSection.style.display = 'none';
                statusValue.style.display = 'flex';
                updateStatusIndicator('ready');
            }, 5000);
            break;

        case 'ready':
        default:
            updateStatusIndicator('ready');
            statusText.textContent = chrome.i18n.getMessage('popupReady');
            break;
    }
}

/**
 * Update status indicator
 * @param {string} status - Status type
 */
function updateStatusIndicator(status) {
    const indicator = document.querySelector('.status-indicator');
    indicator.className = `status-indicator ${status}`;
}
