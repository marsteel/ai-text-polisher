# AI Text Polisher - Chrome Extension

A powerful Chrome extension that uses AI to polish, improve, and transform your selected text with customizable actions.

## Features

✨ **AI-Powered Text Processing** - Transform selected text using advanced AI models  
🎯 **Customizable Actions** - Create and manage your own text processing actions  
🔧 **Flexible Configuration** - Support for any OpenAI-compatible API  
🌍 **Internationalization Ready** - Built with i18n support  
⚡ **Visual Feedback** - Real-time status updates and notifications  
📋 **Clipboard Integration** - Results automatically copied to clipboard  

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `ai-text-polisher` directory

## Configuration

### 1. Set Up API Credentials

1. Click the extension icon and select "Open Settings"
2. Configure your API settings:
   - **API URL**: Your AI provider's endpoint (e.g., `https://api.openai.com/v1/chat/completions`)
   - **API Key**: Your API key
   - **Model Name**: The model to use (e.g., `gpt-3.5-turbo`, `gpt-4`)

### 2. Customize Actions

The extension comes with 5 default actions:
- **Polish & Improve** - Enhance text clarity and professionalism
- **Fix Grammar** - Correct grammar and spelling errors
- **Make Professional** - Rewrite in a professional tone
- **Simplify Language** - Make text easier to understand
- **Summarize** - Create concise summaries

You can add, edit, or delete actions in the settings page. Each action has:
- **Name**: Displayed in the context menu
- **Prompt**: The instruction sent to the AI (use `{text}` as placeholder for selected text)

## Usage

1. Select any text on a webpage
2. Right-click to open the context menu
3. Hover over "AI Text Polisher"
4. Choose an action
5. Wait for processing (visual feedback in popup)
6. Paste the improved text from clipboard

## Supported AI Providers

This extension works with any OpenAI-compatible API, including:

- **OpenAI** - `https://api.openai.com/v1/chat/completions`
- **Azure OpenAI** - `https://YOUR_RESOURCE.openai.azure.com/openai/deployments/YOUR_DEPLOYMENT/chat/completions?api-version=2024-02-15-preview`
- **Local LLMs** (via LM Studio, Ollama, etc.) - `http://localhost:1234/v1/chat/completions`
- **Other providers** - Any service with OpenAI-compatible endpoints

## Privacy & Security

- All settings are stored locally in Chrome's sync storage
- Your API key never leaves your browser
- No data is sent to third parties
- Text processing happens directly between your browser and your configured AI provider

## Development

### File Structure

```
ai-text-polisher/
├── manifest.json          # Extension manifest
├── background.js          # Service worker
├── popup.html/js/css      # Popup UI
├── options.html/js/css    # Settings page
├── ai-client.js           # AI API client
├── storage.js             # Storage helpers
├── notifications.js       # Notification helpers
├── _locales/
│   └── en/
│       └── messages.json  # English translations
└── icons/                 # Extension icons
```

### Adding New Languages

1. Create a new directory in `_locales/` (e.g., `_locales/zh/`)
2. Copy `_locales/en/messages.json` to the new directory
3. Translate all message values
4. Chrome will automatically use the appropriate locale

## Troubleshooting

### Extension doesn't appear in context menu
- Make sure you've selected text before right-clicking
- Check that the extension is enabled in `chrome://extensions/`

### API errors
- Verify your API key is correct
- Check that the API URL is properly formatted
- Ensure your API provider is accessible
- Check the browser console for detailed error messages

### Text not copied to clipboard
- Grant clipboard permissions when prompted
- Try reloading the page

## License

MIT License - Feel free to modify and distribute

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Credits

Created with ❤️ for better writing everywhere
