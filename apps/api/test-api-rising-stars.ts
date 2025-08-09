import { client, testConnection, closeDatabase } from './src/config/database.ts';

async function testRisingStarsAPI() {
  console.log('🧪 Testing Rising Stars API endpoint...\n');

  await testConnection();

  try {
    // First, let's find "Just Add Mana" in the fiction table
    const fictionResult = await client.query(
      'SELECT id, royalroad_id, title, author_name FROM fiction WHERE title LIKE ?',
      ['%Just Add Mana%']
    );

    if (fictionResult.length === 0) {
      console.log('❌ "Just Add Mana" not found in fiction table');
      return;
    }

    const fictionId = fictionResult[0].id;
    console.log(`📚 Found "Just Add Mana" with ID: ${fictionId}`);

    // Test the Rising Stars service method directly
    console.log('\n🔍 Testing RisingStarsService.getRisingStarsDataForFiction()...');

    const { RisingStarsService } = await import('./src/services/risingStars.ts');
    const risingStarsService = new RisingStarsService();

    const risingStarsData = await risingStarsService.getRisingStarsDataForFiction(fictionId);

    console.log(`📊 Found ${risingStarsData.length} Rising Stars entries:`);
    risingStarsData.forEach((entry: any, index: number) => {
      console.log(`${index + 1}. Genre: ${entry.genre}, Position: ${entry.position}, Date: ${entry.captured_at}`);
    });

    // Test the API endpoint by simulating the controller
    console.log('\n🔍 Testing API endpoint simulation...');

    const { getRisingStarsForFiction } = await import('./src/controllers/risingStars.ts');

    // Create a mock context
    const mockContext = {
      params: { fictionId: fictionId.toString() },
      response: {
        status: 0,
        body: {}
      }
    };

    await getRisingStarsForFiction(mockContext as any);

    console.log(`📊 API Response Status: ${mockContext.response.status}`);
    console.log(`📊 API Response Body:`, JSON.stringify(mockContext.response.body, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await closeDatabase();
  }
}

testRisingStarsAPI(); 