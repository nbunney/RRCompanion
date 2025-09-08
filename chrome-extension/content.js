// Content script for RRCompanion Scraper
// This script runs on Royal Road pages and communicates with the background script

console.log('RRCompanion Scraper content script loaded');

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);

  switch (request.action) {
    case 'getPageData':
      handleGetPageData(request, sendResponse);
      break;
    case 'scrapeCurrentPage':
      handleScrapeCurrentPage(request, sendResponse);
      break;
    case 'extractCampaignData':
      handleExtractCampaignData(request, sendResponse);
      break;
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }

  return true; // Keep message channel open for async response
});

function handleGetPageData(request, sendResponse) {
  try {
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

    // Check if user is authenticated
    pageData.isAuthenticated = checkIfAuthenticated();

    // Check if page is private/restricted
    pageData.isPrivate = checkIfPrivate();

    // Extract data based on page type
    if (window.location.pathname.includes('/fiction/')) {
      pageData.fiction = extractFictionData();
    } else if (window.location.pathname.includes('/profile/')) {
      pageData.user = extractUserData();
    } else if (window.location.pathname.includes('/author-dashboard/advertising')) {
      pageData.campaigns = extractCampaignData();
    } else if (window.location.pathname.includes('/author-dashboard/analytics/retention/')) {
      pageData.retention = extractRetentionData();
    }

    sendResponse({ success: true, data: pageData });
  } catch (error) {
    console.error('Error getting page data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

function handleScrapeCurrentPage(request, sendResponse) {
  try {
    const pageData = scrapePageData();
    sendResponse({ success: true, data: pageData });
  } catch (error) {
    console.error('Error scraping current page:', error);
    sendResponse({ success: false, error: error.message });
  }
}

function handleExtractCampaignData(request, sendResponse) {
  try {
    const campaigns = extractCampaignData();
    sendResponse({ success: true, data: campaigns });
  } catch (error) {
    console.error('Error extracting campaign data:', error);
    sendResponse({ success: false, error: error.message });
  }
}

function checkIfAuthenticated() {
  // Check for various authentication indicators
  const authIndicators = [
    // User menu/logout links
    document.querySelector('a[href*="/logout"]'),
    document.querySelector('a[href*="/account"]'),
    document.querySelector('.user-menu'),
    document.querySelector('.profile-link'),
    // Username display
    document.querySelector('.username'),
    document.querySelector('.user-name'),
    // Avatar
    document.querySelector('.avatar img'),
    document.querySelector('.user-avatar img'),
    // Check for login/logout buttons
    !document.querySelector('a[href*="/login"]'),
    !document.querySelector('a[href*="/register"]')
  ];

  return authIndicators.some(indicator => indicator !== null);
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
    isAuthenticated: false,
    cookies: null
  };

  // Check authentication status
  pageData.isAuthenticated = checkIfAuthenticated();

  // Check if page is private
  pageData.isPrivate = checkIfPrivate();

  // Extract data based on page type
  if (window.location.pathname.includes('/fiction/')) {
    pageData.fiction = extractFictionData();
  } else if (window.location.pathname.includes('/profile/')) {
    pageData.user = extractUserData();
  } else if (window.location.pathname.includes('/author-dashboard/advertising')) {
    pageData.campaigns = extractCampaignData();
  } else if (window.location.pathname.includes('/author-dashboard/analytics/retention/')) {
    pageData.retention = extractRetentionData();
  }

  // Get cookies for authentication
  pageData.cookies = getCookies();

  return pageData;
}

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

    // Extract title - try multiple selectors
    const titleSelectors = [
      'h1',
      '.fiction-title',
      '.title',
      '[data-title]',
      '.page-title'
    ];

    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector);
      if (titleElement && titleElement.textContent.trim()) {
        fiction.title = titleElement.textContent.trim();
        break;
      }
    }

    // Extract author information
    const authorSelectors = [
      'a[href*="/profile/"]',
      '.author a',
      '.fiction-author a',
      '[data-author]'
    ];

    for (const selector of authorSelectors) {
      const authorLink = document.querySelector(selector);
      if (authorLink) {
        fiction.author.name = authorLink.textContent.trim();
        const authorIdMatch = authorLink.href.match(/\/profile\/(\d+)/);
        if (authorIdMatch) {
          fiction.author.id = authorIdMatch[1];
        }
        break;
      }
    }

    // Extract author avatar
    const avatarSelectors = [
      '.author img',
      '.fiction-author img',
      '.avatar img',
      '[data-avatar]'
    ];

    for (const selector of avatarSelectors) {
      const avatarElement = document.querySelector(selector);
      if (avatarElement && avatarElement.src) {
        fiction.author.avatar = avatarElement.src;
        break;
      }
    }

    // Extract description
    const descriptionSelectors = [
      '.description',
      '.fiction-description',
      '.summary',
      '.blurb',
      '[data-description]'
    ];

    for (const selector of descriptionSelectors) {
      const descriptionElement = document.querySelector(selector);
      if (descriptionElement && descriptionElement.textContent.trim()) {
        fiction.description = descriptionElement.textContent.trim();
        break;
      }
    }

    // Extract image
    const imageSelectors = [
      '.fiction-cover img',
      '.cover img',
      '.book-cover img',
      '.thumbnail img',
      '[data-cover]'
    ];

    for (const selector of imageSelectors) {
      const imageElement = document.querySelector(selector);
      if (imageElement && imageElement.src) {
        fiction.image = imageElement.src;
        break;
      }
    }

    // Extract status
    const statusSelectors = [
      '.status',
      '.fiction-status',
      '.book-status',
      '[data-status]'
    ];

    for (const selector of statusSelectors) {
      const statusElement = document.querySelector(selector);
      if (statusElement && statusElement.textContent.trim()) {
        fiction.status = statusElement.textContent.trim();
        break;
      }
    }

    // Extract tags
    const tagSelectors = [
      '.tags .tag',
      '.fiction-tags .tag',
      '.book-tags .tag',
      '[data-tags] .tag'
    ];

    for (const selector of tagSelectors) {
      const tagElements = document.querySelectorAll(selector);
      if (tagElements.length > 0) {
        fiction.tags = Array.from(tagElements).map(tag => tag.textContent.trim());
        break;
      }
    }

    // Extract warnings
    const warningSelectors = [
      '.warnings .warning',
      '.fiction-warnings .warning',
      '.book-warnings .warning',
      '[data-warnings] .warning'
    ];

    for (const selector of warningSelectors) {
      const warningElements = document.querySelectorAll(selector);
      if (warningElements.length > 0) {
        fiction.warnings = Array.from(warningElements).map(warning => warning.textContent.trim());
        break;
      }
    }

    // Extract stats
    const statsSelectors = [
      '.stats .stat',
      '.fiction-stats .stat',
      '.book-stats .stat',
      '[data-stats] .stat'
    ];

    for (const selector of statsSelectors) {
      const statsElements = document.querySelectorAll(selector);
      if (statsElements.length > 0) {
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
        break;
      }
    }

    // Extract chapters
    const chapterSelectors = [
      '.chapter-list .chapter',
      '.chapters .chapter',
      '.fiction-chapters .chapter',
      '[data-chapters] .chapter'
    ];

    for (const selector of chapterSelectors) {
      const chapterElements = document.querySelectorAll(selector);
      if (chapterElements.length > 0) {
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
        break;
      }
    }

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
    const nameSelectors = [
      '.username',
      '.profile-name',
      '.user-name',
      'h1',
      '[data-username]'
    ];

    for (const selector of nameSelectors) {
      const nameElement = document.querySelector(selector);
      if (nameElement && nameElement.textContent.trim()) {
        user.name = nameElement.textContent.trim();
        break;
      }
    }

    // Extract avatar
    const avatarSelectors = [
      '.avatar img',
      '.profile-avatar img',
      '.user-avatar img',
      '[data-avatar]'
    ];

    for (const selector of avatarSelectors) {
      const avatarElement = document.querySelector(selector);
      if (avatarElement && avatarElement.src) {
        user.avatar = avatarElement.src;
        break;
      }
    }

    // Extract title
    const titleSelectors = [
      '.title',
      '.profile-title',
      '.user-title',
      '[data-title]'
    ];

    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector);
      if (titleElement && titleElement.textContent.trim()) {
        user.title = titleElement.textContent.trim();
        break;
      }
    }

    // Extract join date
    const joinSelectors = [
      '.join-date',
      '.profile-join-date',
      '.user-join-date',
      '[data-join-date]'
    ];

    for (const selector of joinSelectors) {
      const joinElement = document.querySelector(selector);
      if (joinElement && joinElement.textContent.trim()) {
        user.joinDate = joinElement.textContent.trim();
        break;
      }
    }

    // Extract last seen
    const lastSeenSelectors = [
      '.last-seen',
      '.profile-last-seen',
      '.user-last-seen',
      '[data-last-seen]'
    ];

    for (const selector of lastSeenSelectors) {
      const lastSeenElement = document.querySelector(selector);
      if (lastSeenElement && lastSeenElement.textContent.trim()) {
        user.lastSeen = lastSeenElement.textContent.trim();
        break;
      }
    }

    // Extract stats
    const statsSelectors = [
      '.profile-stats .stat',
      '.user-stats .stat',
      '.stats .stat',
      '[data-stats] .stat'
    ];

    for (const selector of statsSelectors) {
      const statsElements = document.querySelectorAll(selector);
      if (statsElements.length > 0) {
        statsElements.forEach(stat => {
          const label = stat.querySelector('.label')?.textContent.trim().toLowerCase();
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
        break;
      }
    }

  } catch (error) {
    console.error('Error extracting user data:', error);
  }

  return user;
}

function getCookies() {
  // Use the injected script function if available
  if (window.rrCompanionScraper && window.rrCompanionScraper.getCookies) {
    return window.rrCompanionScraper.getCookies();
  }

  // Fallback implementation
  return document.cookie;
}

// Inject the injected script
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function() {
  console.log('Injected script loaded');
};
(document.head || document.documentElement).appendChild(script);
