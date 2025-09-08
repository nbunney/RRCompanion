// Popup script for RRCompanion Scraper
// This script handles the popup UI and user interactions

document.addEventListener('DOMContentLoaded', function() {
  console.log('RRCompanion Scraper popup loaded');

  // Initialize popup
  initializePopup();

  // Add event listeners
  document.getElementById('scrapeBtn').addEventListener('click', handleScrape);
  document.getElementById('sendBtn').addEventListener('click', handleSend);
  document.getElementById('extractCampaignsBtn').addEventListener('click', handleExtractCampaigns);
  document.getElementById('saveConfigBtn').addEventListener('click', handleSaveConfig);
});

async function initializePopup() {
  try {
    // Load saved configuration
    const config = await chrome.storage.local.get(['apiUrl', 'authToken']);
    
    if (config.apiUrl) {
      document.getElementById('apiUrl').value = config.apiUrl;
    }
    
    if (config.authToken) {
      document.getElementById('authToken').value = config.authToken;
    }

    // Update page information
    await updatePageInfo();

  } catch (error) {
    console.error('Error initializing popup:', error);
    showMessage('Error initializing popup: ' + error.message, 'error');
  }
}

async function updatePageInfo() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      showMessage('No active tab found', 'error');
      return;
    }

    // Update URL display
    document.getElementById('currentUrl').textContent = tab.url;
    
    // Check if we're on a Royal Road page
    if (tab.url.includes('royalroad.com')) {
      document.getElementById('pageStatus').textContent = 'Royal Road page detected';
      document.getElementById('pageStatus').className = 'status success';
      
      // Check if we're on the advertising dashboard
      if (tab.url.includes('/author-dashboard/advertising')) {
        document.getElementById('pageStatus').textContent = 'Royal Road Advertising Dashboard detected';
        document.getElementById('extractCampaignsBtn').style.display = 'block';
      } else {
        document.getElementById('extractCampaignsBtn').style.display = 'none';
      }
    } else {
      document.getElementById('pageStatus').textContent = 'Not on Royal Road';
      document.getElementById('pageStatus').className = 'status error';
      document.getElementById('extractCampaignsBtn').style.display = 'none';
    }

  } catch (error) {
    console.error('Error updating page info:', error);
    showMessage('Error updating page info: ' + error.message, 'error');
  }
}

async function handleScrape() {
  try {
    showMessage('Scraping page data...', 'info');
    
    const response = await chrome.runtime.sendMessage({
      action: 'scrapeCurrentPage'
    });

    if (response.success) {
      const data = response.data;
      console.log('Scraped data:', data);
      
      // Display scraped data
      displayScrapedData(data);
      
      showMessage('Page data scraped successfully!', 'success');
    } else {
      showMessage('Error scraping page: ' + response.error, 'error');
    }

  } catch (error) {
    console.error('Error handling scrape:', error);
    showMessage('Error scraping page: ' + error.message, 'error');
  }
}

async function handleExtractCampaigns() {
  try {
    showMessage('Extracting campaign data...', 'info');
    
    const response = await chrome.runtime.sendMessage({
      action: 'extractCampaignData'
    });

    if (response.success) {
      const campaigns = response.data;
      console.log('Extracted campaigns:', campaigns);
      
      // Display campaign data
      displayCampaignData(campaigns);
      
      showMessage(`Extracted ${campaigns.length} campaigns successfully!`, 'success');
    } else {
      showMessage('Error extracting campaigns: ' + response.error, 'error');
    }

  } catch (error) {
    console.error('Error handling campaign extraction:', error);
    showMessage('Error extracting campaigns: ' + error.message, 'error');
  }
}

async function handleSend() {
  try {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    const authToken = document.getElementById('authToken').value.trim();

    if (!apiUrl) {
      showMessage('Please enter an API URL', 'error');
      return;
    }

    showMessage('Sending data to API...', 'info');

    // Get the scraped data from the display
    const scrapedData = getDisplayedData();
    
    if (!scrapedData) {
      showMessage('No data to send. Please scrape the page first.', 'error');
      return;
    }

    // Determine the appropriate endpoint based on data type
    let endpoint = '/api/royalroad/scrape';
    if (scrapedData.campaigns && scrapedData.campaigns.length > 0) {
      endpoint = '/api/campaigns';
    }

    const response = await chrome.runtime.sendMessage({
      action: 'sendToAPI',
      apiUrl: apiUrl + endpoint,
      authToken: authToken,
      data: scrapedData
    });

    if (response.success) {
      showMessage('Data sent to API successfully!', 'success');
      console.log('API response:', response.data);
    } else {
      showMessage('Error sending to API: ' + response.error, 'error');
    }

  } catch (error) {
    console.error('Error handling send:', error);
    showMessage('Error sending to API: ' + error.message, 'error');
  }
}

async function handleSaveConfig() {
  try {
    const apiUrl = document.getElementById('apiUrl').value.trim();
    const authToken = document.getElementById('authToken').value.trim();

    await chrome.storage.local.set({
      apiUrl: apiUrl,
      authToken: authToken
    });

    showMessage('Configuration saved!', 'success');

  } catch (error) {
    console.error('Error saving configuration:', error);
    showMessage('Error saving configuration: ' + error.message, 'error');
  }
}

function displayScrapedData(data) {
  const dataDisplay = document.getElementById('dataDisplay');
  
  let html = '<h3>Scraped Page Data</h3>';
  html += '<div class="data-section">';
  html += `<p><strong>URL:</strong> ${data.url}</p>`;
  html += `<p><strong>Title:</strong> ${data.title}</p>`;
  html += `<p><strong>Timestamp:</strong> ${data.timestamp}</p>`;
  html += `<p><strong>Authenticated:</strong> ${data.isAuthenticated ? 'Yes' : 'No'}</p>`;
  html += `<p><strong>Private:</strong> ${data.isPrivate ? 'Yes' : 'No'}</p>`;
  html += '</div>';

  if (data.fiction) {
    html += '<div class="data-section">';
    html += '<h4>Fiction Data</h4>';
    html += `<p><strong>Title:</strong> ${data.fiction.title}</p>`;
    html += `<p><strong>Author:</strong> ${data.fiction.author.name}</p>`;
    html += `<p><strong>Status:</strong> ${data.fiction.status}</p>`;
    html += `<p><strong>Views:</strong> ${data.fiction.stats.views}</p>`;
    html += `<p><strong>Followers:</strong> ${data.fiction.stats.followers}</p>`;
    html += '</div>';
  }

  if (data.user) {
    html += '<div class="data-section">';
    html += '<h4>User Data</h4>';
    html += `<p><strong>Name:</strong> ${data.user.name}</p>`;
    html += `<p><strong>Title:</strong> ${data.user.title}</p>`;
    html += `<p><strong>Followers:</strong> ${data.user.stats.followers}</p>`;
    html += '</div>';
  }

  if (data.campaigns && data.campaigns.length > 0) {
    html += '<div class="data-section">';
    html += '<h4>Campaign Data</h4>';
    data.campaigns.forEach((campaign, index) => {
      html += `<div class="campaign-item">`;
      html += `<p><strong>Campaign ${index + 1}:</strong> ${campaign.title}</p>`;
      html += `<p><strong>Views:</strong> ${campaign.views}</p>`;
      html += `<p><strong>Clicks:</strong> ${campaign.clicks}</p>`;
      html += `<p><strong>CTR:</strong> ${campaign.ctr}%</p>`;
      html += `<p><strong>Follow:</strong> ${campaign.follow}</p>`;
      html += `<p><strong>Read Later:</strong> ${campaign.readLater}</p>`;
      html += '</div>';
    });
    html += '</div>';
  }

  dataDisplay.innerHTML = html;
  dataDisplay.style.display = 'block';
}

function displayCampaignData(campaigns) {
  const dataDisplay = document.getElementById('dataDisplay');
  
  let html = '<h3>Campaign Data</h3>';
  
  if (campaigns.length === 0) {
    html += '<p>No campaigns found on this page.</p>';
  } else {
    html += '<div class="data-section">';
    html += '<h4>Extracted Campaigns</h4>';
    campaigns.forEach((campaign, index) => {
      html += `<div class="campaign-item">`;
      html += `<p><strong>Campaign ${index + 1}:</strong> ${campaign.title}</p>`;
      html += `<p><strong>Views:</strong> ${campaign.views}</p>`;
      html += `<p><strong>Clicks:</strong> ${campaign.clicks}</p>`;
      html += `<p><strong>CTR:</strong> ${campaign.ctr}%</p>`;
      html += `<p><strong>Follow:</strong> ${campaign.follow}</p>`;
      html += `<p><strong>Read Later:</strong> ${campaign.readLater}</p>`;
      if (Object.keys(campaign.rawData).length > 0) {
        html += '<p><strong>Raw Data:</strong></p>';
        html += '<ul>';
        Object.entries(campaign.rawData).forEach(([key, value]) => {
          html += `<li>${key}: ${value}</li>`;
        });
        html += '</ul>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  dataDisplay.innerHTML = html;
  dataDisplay.style.display = 'block';
}

function getDisplayedData() {
  // This would need to be implemented to extract data from the display
  // For now, we'll return null and rely on the last scraped data
  return null;
}

function showMessage(message, type = 'info') {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = message;
  messageDiv.className = `message ${type}`;
  messageDiv.style.display = 'block';

  // Hide message after 5 seconds
  setTimeout(() => {
    messageDiv.style.display = 'none';
  }, 5000);
}
