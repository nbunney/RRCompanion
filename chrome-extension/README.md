# RRCompanion Chrome Extension

A Chrome extension for scraping private pages from Royal Road and sending the
data to your RRCompanion API.

## Features

- 🔍 **Scrape Private Content**: Access and extract data from private/restricted
  Royal Road pages
- 🔐 **Authentication Support**: Works with logged-in Royal Road accounts
- 📊 **Comprehensive Data Extraction**: Extracts fiction details, user profiles,
  chapters, and statistics
- 🌐 **API Integration**: Sends scraped data directly to your RRCompanion API
- 🎯 **Smart Detection**: Automatically detects page types and authentication
  status

## Installation

### Development Installation

1. **Clone or download the extension files** to a directory on your computer
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top right
4. **Click "Load unpacked"** and select the `chrome-extension` directory
5. **Pin the extension** to your toolbar for easy access

### Production Installation

For production use, you'll need to:

1. Create extension icons (16x16, 48x48, 128x128 PNG files)
2. Package the extension using Chrome's developer tools
3. Distribute through the Chrome Web Store or your own distribution method

## Configuration

### API Settings

1. **Open the extension popup** by clicking the extension icon
2. **Enter your API URL** (default: `http://localhost:8000`)
3. **Optionally add an auth token** for API authentication
4. **Click "Save Configuration"**

### Host Permissions

Update the `host_permissions` in `manifest.json` to include your actual API
domain:

```json
"host_permissions": [
  "https://www.royalroad.com/*",
  "http://localhost:8000/*",
  "https://your-actual-domain.com/*"
]
```

## Usage

### Basic Scraping

1. **Navigate to a Royal Road page** (fiction, user profile, etc.)
2. **Click the extension icon** to open the popup
3. **Check the page status** - it will show if you're authenticated and if
   content is private
4. **Click "Scrape Current Page"** to extract data
5. **Review the scraped data** in the preview section
6. **Click "Send to API"** to send the data to your RRCompanion API

### Private Content Access

The extension can access private content when:

- You're logged into Royal Road in the same browser session
- The content is restricted but accessible to your account
- The page requires authentication but you have valid credentials

### Data Types Extracted

#### Fiction Pages

- Title, author, description
- Cover image and status
- Tags, warnings, and type
- Statistics (pages, ratings, followers, etc.)
- Chapter list with details

#### User Profiles

- Username and avatar
- Join date and last seen
- Follower/following counts
- Fiction count

## API Endpoints

The extension sends data to these endpoints:

- **Fiction Data**: `POST /api/royalroad/add-fiction`
- **User Data**: `POST /api/royalroad/user`
- **General Scraping**: `POST /api/royalroad/scrape`

## Security Considerations

### Cookie Access

The extension requests cookie access to:

- Maintain authentication state
- Access private content
- Preserve login sessions

### Data Privacy

- Scraped data is only sent to your configured API
- No data is stored locally beyond configuration
- Cookies are only accessed for Royal Road domains

### Permissions

- `activeTab`: Access current tab content
- `storage`: Save configuration settings
- `cookies`: Access Royal Road authentication
- `scripting`: Execute content scripts

## Development

### File Structure

```
chrome-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js             # Content script
├── popup.html             # Popup interface
├── popup.js               # Popup logic
├── injected.js            # Page-injected script
└── icons/                 # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Customizing Selectors

The extension uses multiple CSS selectors to extract data. To customize for
specific Royal Road page structures:

1. **Edit `injected.js`** to add new selectors
2. **Update `content.js`** for content script logic
3. **Modify `background.js`** for background processing

### Testing

1. **Load the extension** in developer mode
2. **Navigate to Royal Road pages** and test scraping
3. **Check browser console** for debugging information
4. **Verify API integration** with your backend

## Troubleshooting

### Common Issues

**Extension not working on Royal Road pages:**

- Check that the extension is enabled
- Verify host permissions include `https://www.royalroad.com/*`
- Reload the page and try again

**Can't access private content:**

- Ensure you're logged into Royal Road
- Check that the content is accessible to your account
- Verify cookie permissions are granted

**API connection failed:**

- Check your API URL configuration
- Verify your API is running and accessible
- Check CORS settings on your API server

**Data extraction incomplete:**

- Royal Road may have updated their HTML structure
- Check browser console for selector errors
- Update selectors in `injected.js` if needed

### Debug Mode

Enable debug logging by adding this to the browser console on a Royal Road page:

```javascript
localStorage.setItem("rrCompanionDebug", "true");
```

## Legal Considerations

- **Respect Royal Road's Terms of Service**
- **Only scrape content you have permission to access**
- **Don't overload their servers with requests**
- **Use the extension responsibly and ethically**

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify your API configuration
4. Test with different Royal Road pages

## License

This extension is part of the RRCompanion project and follows the same licensing
terms.
