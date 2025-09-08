// Test script for retention data extraction
// This script tests the extractRetentionData function with mock HTML

const mockHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <title>Author Dashboard - Analytics - Retention</title>
</head>
<body>
    <div class="container">
        <h1>User Retention Analytics</h1>
        
        <table class="retention-table">
            <thead>
                <tr>
                    <th>Chapter</th>
                    <th>Views</th>
                    <th>User Retention %</th>
                    <th># of Members</th>
                    <th>% of Members</th>
                    <th>% Members Remaining</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Chapter 1: The Beginning</td>
                    <td>1,250</td>
                    <td>85.2%</td>
                    <td>1,200</td>
                    <td>100.0%</td>
                    <td>85.2%</td>
                </tr>
                <tr>
                    <td>Chapter 2: The Journey</td>
                    <td>1,180</td>
                    <td>78.5%</td>
                    <td>1,150</td>
                    <td>95.8%</td>
                    <td>75.1%</td>
                </tr>
                <tr>
                    <td>Chapter 3: The Challenge</td>
                    <td>1,100</td>
                    <td>72.3%</td>
                    <td>1,080</td>
                    <td>90.0%</td>
                    <td>65.1%</td>
                </tr>
                <tr>
                    <td>Chapter 4: The Discovery</td>
                    <td>980</td>
                    <td>68.7%</td>
                    <td>950</td>
                    <td>79.2%</td>
                    <td>54.4%</td>
                </tr>
                <tr>
                    <td>Chapter 5: The Resolution</td>
                    <td>850</td>
                    <td>65.2%</td>
                    <td>820</td>
                    <td>68.3%</td>
                    <td>44.6%</td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
`;

// Mock the extractRetentionData function
function extractRetentionData() {
  const retentionData = {
    fictionId: 122933,
    chapters: [],
    summary: {
      totalViews: 0,
      totalMembers: 0,
      averageRetention: 0
    }
  };
  
  try {
    // Create a mock DOM environment
    const parser = new DOMParser();
    const doc = parser.parseFromString(mockHTML, 'text/html');
    
    // Mock window.location
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/author-dashboard/analytics/retention/122933',
        href: 'https://www.royalroad.com/author-dashboard/analytics/retention/122933'
      },
      writable: true
    });

    // Look for retention table
    const retentionTable = doc.querySelector('table.retention-table');
    
    if (!retentionTable) {
      console.log('No retention table found');
      return retentionData;
    }

    // Extract table headers
    const headers = [];
    const headerRow = retentionTable.querySelector('thead tr');
    if (headerRow) {
      const headerCells = headerRow.querySelectorAll('th');
      headerCells.forEach(cell => {
        headers.push(cell.textContent.trim().toLowerCase());
      });
    }

    console.log('Table headers:', headers);

    // Extract data rows
    const dataRows = retentionTable.querySelectorAll('tbody tr');
    
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

// Test the extraction
console.log('Mock HTML:', mockHTML);
console.log('\n--- Testing Retention Data Extraction ---\n');

const extractedData = extractRetentionData();

console.log('\n--- Extracted Data ---');
console.log('Fiction ID:', extractedData.fictionId);
console.log('Total Chapters:', extractedData.chapters.length);
console.log('Summary:', extractedData.summary);

console.log('\n--- Chapter Details ---');
extractedData.chapters.forEach((chapter, index) => {
  console.log(`Chapter ${index + 1}:`);
  console.log(`  Title: ${chapter.chapter}`);
  console.log(`  Views: ${chapter.views}`);
  console.log(`  User Retention: ${chapter.userRetentionPercent}%`);
  console.log(`  Members: ${chapter.numberOfMembers}`);
  console.log(`  % of Members: ${chapter.percentOfMembers}%`);
  console.log(`  % Remaining: ${chapter.percentMembersRemaining}%`);
  console.log('');
});

