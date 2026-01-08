# AI Text Polisher - Documentation Site

This directory contains the GitHub Pages site for AI Text Polisher.

## Pages

- **index.html** - Landing page with links to documentation
- **privacy.html** - Privacy policy page
- **changelog.html** - Version history and release notes

## GitHub Pages Setup

To enable GitHub Pages for this repository:

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select:
   - **Branch**: `main`
   - **Folder**: `/docs`
4. Click **Save**

GitHub will automatically publish the site at:
```
https://marsteel.github.io/AI-Text-Polisher/
```

## Privacy Policy URL

Once published, the privacy policy will be available at:
```
https://marsteel.github.io/AI-Text-Polisher/privacy.html
```

Use this URL when submitting to Chrome Web Store or Edge Add-ons store.

## Local Testing

To test locally, you can use Python's built-in HTTP server:

```bash
cd docs
python3 -m http.server 8000
```

Then open http://localhost:8000 in your browser.

## Updating Content

Simply edit the HTML files and commit/push to GitHub. The site will automatically update.
