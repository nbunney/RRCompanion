import { RoyalRoadAPI } from 'https://esm.sh/@fsoc/royalroadl-api';

async function testDirectRequests() {
  try {
    const api = new RoyalRoadAPI();

    console.log('🔍 Testing direct HTTP requests to Royal Road...');

    // Method 1: Try to use the requester to get Rising Stars
    console.log('\n1️⃣ Testing requester for Rising Stars...');
    try {
      const requester = api.requester;
      console.log('Requester URL method:', typeof requester.url);

      // Try to get Rising Stars page
      const response = await requester.url('https://www.royalroad.com/fictions/rising-stars');
      console.log('Rising Stars page response status:', response.status);
      console.log('Response headers:', Object.keys(response.headers));

      if (response.ok) {
        const text = await response.text();
        console.log('Response length:', text.length);
        console.log('First 500 chars:', text.substring(0, 500));
      }
    } catch (error) {
      console.log('❌ Requester method failed:', error.message);
    }

    // Method 2: Try to get Rising Stars for specific genres
    console.log('\n2️⃣ Testing genre-specific Rising Stars...');
    const genres = ['fantasy', 'sci-fi', 'action', 'adventure'];

    for (const genre of genres) {
      try {
        const response = await api.requester.url(`https://www.royalroad.com/fictions/rising-stars/${genre}`);
        console.log(`${genre} Rising Stars status:`, response.status);

        if (response.ok) {
          const text = await response.text();
          console.log(`${genre} response length:`, text.length);
        }
      } catch (error) {
        console.log(`❌ ${genre} Rising Stars failed:`, error.message);
      }
    }

    // Method 3: Try to get the main Rising Stars page
    console.log('\n3️⃣ Testing main Rising Stars page...');
    try {
      const response = await api.requester.url('https://www.royalroad.com/fictions/rising-stars');
      console.log('Main Rising Stars status:', response.status);

      if (response.ok) {
        const text = await response.text();
        console.log('Main Rising Stars response length:', text.length);

        // Look for fiction data in the HTML
        const fictionMatches = text.match(/fiction\/(\d+)/g);
        if (fictionMatches) {
          console.log('Found fiction IDs:', fictionMatches.slice(0, 10));
        }

        // Look for Rising Stars specific content
        if (text.includes('Rising Stars')) {
          console.log('✅ Found "Rising Stars" in response');
        }
      }
    } catch (error) {
      console.log('❌ Main Rising Stars failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error testing direct requests:', error);
  }
}

testDirectRequests(); 