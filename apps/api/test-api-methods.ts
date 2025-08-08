import { RoyalRoadAPI } from 'https://esm.sh/@fsoc/royalroadl-api';

async function checkApiMethods() {
  try {
    const api = new RoyalRoadAPI();

    console.log('🔍 Checking RoyalRoad API methods...');
    console.log('Available top-level methods:', Object.keys(api));

    if (api.fictions) {
      console.log('Fictions methods:', Object.keys(api.fictions));
    }

    if (api.fiction) {
      console.log('Fiction methods:', Object.keys(api.fiction));
    }

    if (api.profile) {
      console.log('Profile methods:', Object.keys(api.profile));
    }

    // Try to get popular fictions to see what's available
    console.log('\n🔍 Testing getPopular method...');
    const popularResponse = await api.fictions.getPopular();
    console.log('Popular response structure:', Object.keys(popularResponse));
    console.log('Success:', popularResponse.success);
    console.log('Data type:', typeof popularResponse.data);
    console.log('Data length:', Array.isArray(popularResponse.data) ? popularResponse.data.length : 'Not an array');

    if (popularResponse.data && Array.isArray(popularResponse.data) && popularResponse.data.length > 0) {
      console.log('First item structure:', Object.keys(popularResponse.data[0]));
    }

  } catch (error) {
    console.error('❌ Error checking API methods:', error);
  }
}

checkApiMethods(); 