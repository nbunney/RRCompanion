// Test script for campaign data extraction
// This script can be run to test the campaign extraction logic

console.log('Testing campaign data extraction...');

// Mock HTML structure similar to Royal Road advertising dashboard
const mockHTML = `
<div class="table-container">
  <table>
    <tbody>
      <tr>
        <td><a href="/fiction/123">Test Fiction 1</a></td>
        <td>1,234</td>
        <td>56</td>
        <td>4.5%</td>
        <td>12</td>
        <td>8</td>
      </tr>
      <tr>
        <td><a href="/fiction/456">Test Fiction 2</a></td>
        <td>2,345</td>
        <td>78</td>
        <td>3.3%</td>
        <td>15</td>
        <td>10</td>
      </tr>
    </tbody>
  </table>
</div>
`;

// Mock the extractCampaignData function
function extractCampaignData() {
  const campaigns = [];
  
  try {
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

      // Only add campaigns with at least a title
      if (campaign.title) {
        campaigns.push(campaign);
      }
    });

    console.log(`Extracted ${campaigns.length} campaigns:`, campaigns);

  } catch (error) {
    console.error('Error extracting campaign data:', error);
  }

  return campaigns;
}

// Test the extraction
console.log('Mock HTML:', mockHTML);
console.log('Extracted campaigns:', extractCampaignData());

