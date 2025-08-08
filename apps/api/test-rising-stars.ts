import { RoyalRoadAPI } from 'https://esm.sh/@fsoc/royalroadl-api';

async function testRisingStars() {
  try {
    const api = new RoyalRoadAPI();

    console.log('🔍 Testing different ways to get Rising Stars data...');

    // Method 1: Try to get Rising Stars directly
    console.log('\n1️⃣ Testing direct Rising Stars access...');
    try {
      // The API might not have this method, but let's try
      const response = await api.fictions.getRisingStars();
      console.log('Direct Rising Stars response:', response);
    } catch (error) {
      console.log('❌ Direct Rising Stars method not available');
    }

    // Method 2: Try to get Rising Stars with genre parameter
    console.log('\n2️⃣ Testing Rising Stars with genre...');
    try {
      const response = await api.fictions.getRisingStars('fantasy');
      console.log('Rising Stars with genre response:', response);
    } catch (error) {
      console.log('❌ Rising Stars with genre method not available');
    }

    // Method 3: Check if there are other methods that might give us Rising Stars
    console.log('\n3️⃣ Checking all available methods...');
    console.log('All fictions methods:', Object.keys(api.fictions));

    // Method 4: Try to get popular and see if we can filter for Rising Stars
    console.log('\n4️⃣ Testing popular fictions to see structure...');
    const popularResponse = await api.fictions.getPopular();
    console.log('Popular response success:', popularResponse.success);
    console.log('Popular data length:', popularResponse.data.length);

    if (popularResponse.data && popularResponse.data.length > 0) {
      const firstItem = popularResponse.data[0];
      console.log('First popular item structure:', Object.keys(firstItem));
      console.log('First item stats:', firstItem.stats);
    }

    // Method 5: Try to access Rising Stars through a different endpoint
    console.log('\n5️⃣ Testing alternative endpoints...');
    try {
      // Try to see if there's a way to get Rising Stars through the requester
      const requester = api.requester;
      console.log('Requester methods:', Object.keys(requester));
    } catch (error) {
      console.log('❌ No alternative endpoints found');
    }

  } catch (error) {
    console.error('❌ Error testing Rising Stars:', error);
  }
}

testRisingStars(); 