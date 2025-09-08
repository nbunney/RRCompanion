// Background service worker for RRCompanion Scraper
// This script handles communication between the popup and content scripts

console.log('RRCompanion Scraper background script loaded');

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background script received message:', request);

  switch (request.action) {
    case 'scrapeCurrentPage':
      handleScrapeCurrentPage(request, sender, sendResponse);
      break;
    case 'sendToAPI':
      handleSendToAPI(request, sender, sendResponse);
      break;
    case 'extractCampaignData':
      handleExtractCampaignData(request, sender, sendResponse);
      break;
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }

  return true; // Keep message channel open for async response
});

async function handleScrapeCurrentPage(request, sender, sendResponse) {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    // Check if we're on a Royal Road page
    if (!tab.url.includes('royalroad.com')) {
      sendResponse({ success: false, error: 'Not on a Royal Road page' });
      return;
    }

    // Execute the scraping function in the content script
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: scrapePageData
    });

    if (results && results[0] && results[0].result) {
      const pageData = results[0].result;
      
      // Get cookies for authentication
      const cookies = await chrome.cookies.getAll({ domain: 'royalroad.com' });
      pageData.cookies = cookies;

      sendResponse({ success: true, data: pageData });
    } else {
      sendResponse({ success: false, error: 'Failed to scrape page data' });
    }

  } catch (error) {
    console.error('Error scraping current page:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleExtractCampaignData(request, sender, sendResponse) {
  try {
    // Get the active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      sendResponse({ success: false, error: 'No active tab found' });
      return;
    }

    // Check if we're on the advertising dashboard page
    if (!tab.url.includes('/author-dashboard/advertising')) {
      sendResponse({ success: false, error: 'Not on the advertising dashboard page' });
      return;
    }

    // Execute the campaign extraction function in the content script
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractCampaignData
    });

    if (results && results[0] && results[0].result) {
      const campaigns = results[0].result;
      sendResponse({ success: true, data: campaigns });
    } else {
      sendResponse({ success: false, error: 'Failed to extract campaign data' });
    }

  } catch (error) {
    console.error('Error extracting campaign data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleSendToAPI(request, sender, sendResponse) {
  try {
    const { apiUrl, authToken, data } = request;

    if (!apiUrl) {
      sendResponse({ success: false, error: 'API URL is required' });
      return;
    }

    // Determine the appropriate endpoint based on data type
    let endpoint = '/api/fiction';
    if (data.campaigns && data.campaigns.length > 0) {
      endpoint = '/api/campaigns';
    } else if (data.retention && data.retention.chapters && data.retention.chapters.length > 0) {
      endpoint = '/api/retention';
    }

    // Prepare the request payload
    const payload = {
      url: data.url,
      title: data.title,
      timestamp: data.timestamp,
      isPrivate: data.isPrivate,
      isAuthenticated: data.isAuthenticated,
      cookies: data.cookies,
      userId: data.userId,
      username: data.username
    };

    // Add data based on endpoint
    if (endpoint === '/api/campaigns') {
      payload.campaigns = data.campaigns;
    } else if (endpoint === '/api/retention') {
      payload.retention = data.retention;
    } else {
      payload.fiction = data.fiction;
      payload.user = data.user;
    }

    // Send data to the API
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      sendResponse({ success: true, data: result });
    } else {
      const errorText = await response.text();
      sendResponse({ success: false, error: `API Error: ${response.status} - ${errorText}` });
    }

  } catch (error) {
    console.error('Error sending data to API:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Function to be injected into the page for scraping
function scrapePageData() {
  const pageData = {
    url: window.location.href,
    title: document.title,
    timestamp: new Date().toISOString(),
    fiction: null,
    user: null,
    campaigns: null,
    retention: null,
    isPrivate: false,
    isAuthenticated: false
  };

  // Check if this is a fiction page
  if (window.location.pathname.includes('/fiction/')) {
    pageData.fiction = extractFictionData();
  }

  // Check if this is a user profile page
  if (window.location.pathname.includes('/profile/')) {
    pageData.user = extractUserData();
  }

  // Check if this is an advertising dashboard page
  if (window.location.pathname.includes('/author-dashboard/advertising')) {
    pageData.campaigns = extractCampaignData();
  }

  // Check if this is a retention analytics page
  if (window.location.pathname.includes('/author-dashboard/analytics/retention/')) {
    pageData.retention = extractRetentionData();
  }

  // Check if page is private/restricted
  pageData.isPrivate = checkIfPrivate();

  // Check if user is authenticated
  pageData.isAuthenticated = checkIfAuthenticated();

  return pageData;
}

// Function to be injected for campaign data extraction
function extractCampaignData() {
  // Use the injected script function if available
  if (window.rrCompanionScraper && window.rrCompanionScraper.extractCampaignData) {
    return window.rrCompanionScraper.extractCampaignData();
  }

  // Fallback implementation
  const campaigns = [];
  
  try {
    // Check if we're on the advertising dashboard page
    if (!window.location.pathname.includes('/author-dashboard/advertising')) {
      console.log('Not on advertising dashboard page');
      return campaigns;
    }

    // Look for campaign containers - try multiple selectors
    const campaignSelectors = [
      '.campaign-item',
      '.advertising-campaign',
      '.campaign',
      '.ad-item',
      '.promotion-item',
      '[data-campaign]',
      '.table-row',
      'tr[data-campaign]',
      '.campaign-row'
    ];

    let campaignElements = [];
    for (const selector of campaignSelectors) {
      campaignElements = document.querySelectorAll(selector);
      if (campaignElements.length > 0) {
        console.log(`Found ${campaignElements.length} campaigns using selector: ${selector}`);
        break;
      }
    }

    // If no specific campaign containers found, look for table rows
    if (campaignElements.length === 0) {
      const tableRows = document.querySelectorAll('table tbody tr');
      if (tableRows.length > 0) {
        console.log(`Found ${tableRows.length} table rows, treating as campaigns`);
        campaignElements = tableRows;
      }
    }

    // Process each campaign element
    campaignElements.forEach((element, index) => {
      const campaign = {
        id: index + 1,
        title: '',
        views: 0,
        clicks: 0,
        ctr: 0,
        follow: 0,
        readLater: 0,
        rawData: {}
      };

      // Extract campaign title
      const titleSelectors = [
        'a[href*="/fiction/"]',
        '.fiction-title',
        '.campaign-title',
        '.title',
        'td:first-child',
        '[data-title]',
        '.book-title',
        '.novel-title'
      ];

      for (const selector of titleSelectors) {
        const titleElement = element.querySelector(selector);
        if (titleElement && titleElement.textContent.trim()) {
          campaign.title = titleElement.textContent.trim();
          break;
        }
      }

      // Extract metrics - look for numeric values in table cells
      const cells = element.querySelectorAll('td');
      if (cells.length > 0) {
        cells.forEach((cell, cellIndex) => {
          const text = cell.textContent.trim();
          const numericValue = parseInt(text.replace(/[^\d]/g, '')) || 0;
          const floatValue = parseFloat(text.replace(/[^\d.]/g, '')) || 0;

          // Store raw data for debugging
          campaign.rawData[`cell_${cellIndex}`] = text;

          // Try to identify metrics based on position and content
          if (cellIndex === 0 && !campaign.title) {
            // First cell might be title
            campaign.title = text;
          } else if (text.includes('%') || (floatValue > 0 && floatValue <= 100)) {
            // Likely CTR (percentage)
            campaign.ctr = floatValue;
          } else if (numericValue > 0) {
            // Assign to available metrics based on position
            if (campaign.views === 0) {
              campaign.views = numericValue;
            } else if (campaign.clicks === 0) {
              campaign.clicks = numericValue;
            } else if (campaign.follow === 0) {
              campaign.follow = numericValue;
            } else if (campaign.readLater === 0) {
              campaign.readLater = numericValue;
            }
          }
        });
      }

      // Alternative: Look for specific metric labels
      const metricLabels = {
        'views': ['views', 'impressions', 'imp'],
        'clicks': ['clicks', 'click'],
        'ctr': ['ctr', 'click-through', 'click through'],
        'follow': ['follow', 'follows', 'followers'],
        'readLater': ['read later', 'read-later', 'bookmark', 'bookmarks']
      };

      // Search for metrics by label
      const elementText = element.textContent.toLowerCase();
      Object.entries(metricLabels).forEach(([metric, labels]) => {
        labels.forEach(label => {
          if (elementText.includes(label)) {
            // Find the number near this label
            const regex = new RegExp(`${label}[^\\d]*(\\d+)`, 'i');
            const match = elementText.match(regex);
            if (match) {
              const value = parseInt(match[1]) || 0;
              if (metric === 'ctr') {
                campaign.ctr = value;
              } else if (campaign[metric] === 0) {
                campaign[metric] = value;
              }
            }
          }
        });
      });

      // Only add campaigns with at least a title
      if (campaign.title) {
        campaigns.push(campaign);
      }
    });

    // If no campaigns found, try to extract from any visible data
    if (campaigns.length === 0) {
      console.log('No campaigns found, attempting to extract from page content');
      
      // Look for any fiction links that might be campaigns
      const fictionLinks = document.querySelectorAll('a[href*="/fiction/"]');
      fictionLinks.forEach((link, index) => {
        const title = link.textContent.trim();
        if (title) {
          campaigns.push({
            id: index + 1,
            title: title,
            views: 0,
            clicks: 0,
            ctr: 0,
            follow: 0,
            readLater: 0,
            rawData: { link: link.href }
          });
        }
      });
    }

    console.log(`Extracted ${campaigns.length} campaigns:`, campaigns);

  } catch (error) {
    console.error('Error extracting campaign data:', error);
  }

  return campaigns;
}

// Function to be injected for retention data extraction
function extractRetentionData() {
  // Use the injected script function if available
  if (window.rrCompanionScraper && window.rrCompanionScraper.extractRetentionData) {
    return window.rrCompanionScraper.extractRetentionData();
  }

  // Fallback implementation
  const retentionData = {
    fictionId: null,
    chapters: [],
    summary: {
      totalViews: 0,
      totalMembers: 0,
      averageRetention: 0
    }
  };
  
  try {
    // Check if we're on the retention analytics page
    if (!window.location.pathname.includes('/author-dashboard/analytics/retention/')) {
      console.log('Not on retention analytics page');
      return retentionData;
    }

    // Extract fiction ID from URL
    const urlMatch = window.location.pathname.match(/\/retention\/(\d+)/);
    if (urlMatch) {
      retentionData.fictionId = parseInt(urlMatch[1]);
    }

    // Look for retention table - try multiple selectors
    const tableSelectors = [
      'table',
      '.retention-table',
      '.analytics-table',
      '.data-table',
      '.table',
      '[data-table="retention"]',
      '.user-retention-table'
    ];

    let retentionTable = null;
    for (const selector of tableSelectors) {
      retentionTable = document.querySelector(selector);
      if (retentionTable) {
        console.log(`Found retention table using selector: ${selector}`);
        break;
      }
    }

    if (!retentionTable) {
      console.log('No retention table found');
      return retentionData;
    }

    // Extract table headers to understand column structure
    const headers = [];
    const headerRow = retentionTable.querySelector('thead tr') || retentionTable.querySelector('tr');
    if (headerRow) {
      const headerCells = headerRow.querySelectorAll('th, td');
      headerCells.forEach(cell => {
        headers.push(cell.textContent.trim().toLowerCase());
      });
    }

    console.log('Table headers:', headers);

    // Extract data rows
    const dataRows = retentionTable.querySelectorAll('tbody tr') || retentionTable.querySelectorAll('tr:not(:first-child)');
    
    dataRows.forEach((row, index) => {
      const cells = row.querySelectorAll('td');
      if (cells.length === 0) return;

      const chapter = {
        id: index + 1,
        chapter: '',
        views: 0,
        userRetentionPercent: 0,
        numberOfMembers: 0,
        percentOfMembers: 0,
        percentMembersRemaining: 0,
        rawData: {}
      };

      // Extract data from each cell
      cells.forEach((cell, cellIndex) => {
        const text = cell.textContent.trim();
        const numericValue = parseInt(text.replace(/[^\d]/g, '')) || 0;
        const floatValue = parseFloat(text.replace(/[^\d.]/g, '')) || 0;

        // Store raw data for debugging
        chapter.rawData[`cell_${cellIndex}`] = text;

        // Try to identify data based on headers and content
        if (headers[cellIndex]) {
          const header = headers[cellIndex];
          
          if (header.includes('chapter') || header.includes('title')) {
            chapter.chapter = text;
          } else if (header.includes('views') || header.includes('impressions')) {
            chapter.views = numericValue;
          } else if (header.includes('retention') && header.includes('%')) {
            chapter.userRetentionPercent = floatValue;
          } else if (header.includes('members') && header.includes('#') || header.includes('number')) {
            chapter.numberOfMembers = numericValue;
          } else if (header.includes('members') && header.includes('%') && !header.includes('remaining')) {
            chapter.percentOfMembers = floatValue;
          } else if (header.includes('remaining') || header.includes('left')) {
            chapter.percentMembersRemaining = floatValue;
          }
        } else {
          // Fallback: assign based on position and content
          if (cellIndex === 0) {
            chapter.chapter = text;
          } else if (text.includes('%') && floatValue > 0 && floatValue <= 100) {
            if (chapter.userRetentionPercent === 0) {
              chapter.userRetentionPercent = floatValue;
            } else if (chapter.percentOfMembers === 0) {
              chapter.percentOfMembers = floatValue;
            } else if (chapter.percentMembersRemaining === 0) {
              chapter.percentMembersRemaining = floatValue;
            }
          } else if (numericValue > 0) {
            if (chapter.views === 0) {
              chapter.views = numericValue;
            } else if (chapter.numberOfMembers === 0) {
              chapter.numberOfMembers = numericValue;
            }
          }
        }
      });

      // Only add chapters with at least a chapter name
      if (chapter.chapter) {
        retentionData.chapters.push(chapter);
      }
    });

    // Calculate summary statistics
    if (retentionData.chapters.length > 0) {
      retentionData.summary.totalViews = retentionData.chapters.reduce((sum, chapter) => sum + chapter.views, 0);
      retentionData.summary.totalMembers = retentionData.chapters.reduce((sum, chapter) => sum + chapter.numberOfMembers, 0);
      
      const retentionValues = retentionData.chapters
        .map(chapter => chapter.userRetentionPercent)
        .filter(value => value > 0);
      
      if (retentionValues.length > 0) {
        retentionData.summary.averageRetention = retentionValues.reduce((sum, value) => sum + value, 0) / retentionValues.length;
      }
    }

    console.log(`Extracted retention data for ${retentionData.chapters.length} chapters:`, retentionData);

  } catch (error) {
    console.error('Error extracting retention data:', error);
  }

  return retentionData;
}

function extractFictionData() {
  // Use the injected script function if available
  if (window.rrCompanionScraper && window.rrCompanionScraper.extractFictionData) {
    return window.rrCompanionScraper.extractFictionData();
  }

  // Fallback implementation
  const fiction = {
    id: null,
    title: '',
    author: {
      name: '',
      id: '',
      avatar: ''
    },
    description: '',
    image: '',
    status: '',
    tags: [],
    warnings: [],
    type: '',
    stats: {
      pages: 0,
      ratings: 0,
      followers: 0,
      favorites: 0,
      views: 0,
      score: 0,
      overall_score: 0,
      style_score: 0,
      story_score: 0,
      grammar_score: 0,
      character_score: 0
    },
    chapters: []
  };

  try {
    // Extract fiction ID from URL
    const urlMatch = window.location.pathname.match(/\/fiction\/(\d+)/);
    if (urlMatch) {
      fiction.id = urlMatch[1];
    }

    // Extract title
    const titleElement = document.querySelector('h1') || document.querySelector('.fiction-title');
    if (titleElement) {
      fiction.title = titleElement.textContent.trim();
    }

    // Extract author information
    const authorLink = document.querySelector('a[href*="/profile/"]');
    if (authorLink) {
      fiction.author.name = authorLink.textContent.trim();
      const authorIdMatch = authorLink.href.match(/\/profile\/(\d+)/);
      if (authorIdMatch) {
        fiction.author.id = authorIdMatch[1];
      }
    }

    // Extract description
    const descriptionElement = document.querySelector('.description') || document.querySelector('.fiction-description');
    if (descriptionElement) {
      fiction.description = descriptionElement.textContent.trim();
    }

    // Extract image
    const imageElement = document.querySelector('.fiction-cover img') || document.querySelector('.cover img');
    if (imageElement) {
      fiction.image = imageElement.src;
    }

    // Extract status
    const statusElement = document.querySelector('.status') || document.querySelector('.fiction-status');
    if (statusElement) {
      fiction.status = statusElement.textContent.trim();
    }

    // Extract tags
    const tagElements = document.querySelectorAll('.tags .tag');
    fiction.tags = Array.from(tagElements).map(tag => tag.textContent.trim());

    // Extract warnings
    const warningElements = document.querySelectorAll('.warnings .warning') || document.querySelectorAll('.fiction-warnings .warning');
    fiction.warnings = Array.from(warningElements).map(warning => warning.textContent.trim());

    // Extract stats
    const statsElements = document.querySelectorAll('.stats .stat');
    statsElements.forEach(stat => {
      const label = stat.querySelector('.label')?.textContent.trim().toLowerCase();
      const value = stat.querySelector('.value')?.textContent.trim();
      
      if (label && value) {
        const numValue = parseInt(value.replace(/,/g, '')) || 0;
        
        switch (label) {
          case 'pages':
            fiction.stats.pages = numValue;
            break;
          case 'ratings':
            fiction.stats.ratings = numValue;
            break;
          case 'followers':
            fiction.stats.followers = numValue;
            break;
          case 'favorites':
            fiction.stats.favorites = numValue;
            break;
          case 'views':
            fiction.stats.views = numValue;
            break;
          case 'score':
            fiction.stats.score = parseFloat(value) || 0;
            break;
        }
      }
    });

    // Extract chapters
    const chapterElements = document.querySelectorAll('.chapter-list .chapter') || document.querySelectorAll('.chapters .chapter');
    fiction.chapters = Array.from(chapterElements).map(chapter => {
      const link = chapter.querySelector('a');
      const title = link?.textContent.trim() || '';
      const url = link?.href || '';
      const date = chapter.querySelector('.date')?.textContent.trim() || '';
      const views = parseInt(chapter.querySelector('.views')?.textContent.replace(/,/g, '') || '0');
      const words = parseInt(chapter.querySelector('.words')?.textContent.replace(/,/g, '') || '0');
      
      return {
        title,
        url,
        date,
        views,
        words
      };
    });

  } catch (error) {
    console.error('Error extracting fiction data:', error);
  }

  return fiction;
}

function extractUserData() {
  // Use the injected script function if available
  if (window.rrCompanionScraper && window.rrCompanionScraper.extractUserData) {
    return window.rrCompanionScraper.extractUserData();
  }

  // Fallback implementation
  const user = {
    id: '',
    name: '',
    avatar: '',
    title: '',
    joinDate: '',
    lastSeen: '',
    stats: {
      followers: 0,
      following: 0,
      fictions: 0
    }
  };

  try {
    // Extract user ID from URL
    const urlMatch = window.location.pathname.match(/\/profile\/(\d+)/);
    if (urlMatch) {
      user.id = urlMatch[1];
    }

    // Extract username
    const nameElement = document.querySelector('.username') || document.querySelector('.profile-name');
    if (nameElement) {
      user.name = nameElement.textContent.trim();
    }

    // Extract avatar
    const avatarElement = document.querySelector('.avatar img') || document.querySelector('.profile-avatar img');
    if (avatarElement) {
      user.avatar = avatarElement.src;
    }

    // Extract title
    const titleElement = document.querySelector('.title') || document.querySelector('.profile-title');
    if (titleElement) {
      user.title = titleElement.textContent.trim();
    }

    // Extract join date
    const joinElement = document.querySelector('.join-date') || document.querySelector('.profile-join-date');
    if (joinElement) {
      user.joinDate = joinElement.textContent.trim();
    }

    // Extract last seen
    const lastSeenElement = document.querySelector('.last-seen') || document.querySelector('.profile-last-seen');
    if (lastSeenElement) {
      user.lastSeen = lastSeenElement.textContent.trim();
    }

    // Extract stats
    const statsElements = document.querySelectorAll('.profile-stats .stat');
    statsElements.forEach(stat => {
      const label = stat.querySelector('.label')?.textContent.trim();
      const value = stat.querySelector('.value')?.textContent.trim();
      
      if (label && value) {
        const numValue = parseInt(value.replace(/,/g, '')) || 0;
        
        switch (label) {
          case 'followers':
            user.stats.followers = numValue;
            break;
          case 'following':
            user.stats.following = numValue;
            break;
          case 'fictions':
            user.stats.fictions = numValue;
            break;
        }
      }
    });

  } catch (error) {
    console.error('Error extracting user data:', error);
  }

  return user;
}

function checkIfPrivate() {
  // Check for common indicators of private/restricted content
  const privateIndicators = [
    'This content is private',
    'You do not have permission',
    'Access denied',
    'Restricted content',
    'Members only',
    'Login required',
    'Private fiction',
    'This fiction is not available',
    'You must be logged in to view this content'
  ];

  const pageText = document.body.textContent.toLowerCase();
  return privateIndicators.some(indicator => 
    pageText.includes(indicator.toLowerCase())
  );
}

function checkIfAuthenticated() {
  // Check for various authentication indicators
  const authIndicators = [
    // User menu/logout links
    !!document.querySelector('a[href*="/logout"]'),
    !!document.querySelector('a[href*="/account"]'),
    !!document.querySelector('.user-menu'),
    !!document.querySelector('.profile-link'),
    // Username display
    !!document.querySelector('.username'),
    !!document.querySelector('.user-name'),
    // Avatar
    !!document.querySelector('.avatar img'),
    !!document.querySelector('.user-avatar img'),
    // Check for login/logout buttons
    !document.querySelector('a[href*="/login"]'),
    !document.querySelector('a[href*="/register"]')
  ];

  return authIndicators.some(indicator => indicator);
}
