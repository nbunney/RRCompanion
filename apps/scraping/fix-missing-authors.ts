import { DatabaseService } from './src/services/database';
import { RoyalRoadScrapingService } from './src/services/royalroad';
import './src/utils/config';

async function fixMissingAuthors() {
  const dbService = new DatabaseService();
  const scrapingService = new RoyalRoadScrapingService();

  try {
    await dbService.connect();

    console.log('🔍 Searching for fictions with missing author data...');

    // Find fictions with missing, null, or empty author names
    const query = `
      SELECT id, royalroad_id, title, author_name, author_id, author_avatar
      FROM fiction
      WHERE author_name IS NULL 
         OR author_name = '' 
         OR author_name = 'Unknown Author'
      ORDER BY id ASC
    `;

    const fictions = await dbService.query(query);

    if (fictions.length === 0) {
      console.log('✅ No fictions with missing author data found!');
      return;
    }

    console.log(`📚 Found ${fictions.length} fiction(s) with missing author data:`);
    fictions.forEach((fiction: any) => {
      console.log(`  - ID: ${fiction.id}, RR ID: ${fiction.royalroad_id}, Title: ${fiction.title}, Author: ${fiction.author_name || '(empty)'}`);
    });

    console.log('\n🚀 Starting to re-scrape and update...\n');

    let updated = 0;
    let failed = 0;
    let notFound = 0;

    for (const fiction of fictions) {
      try {
        console.log(`📖 Processing: ${fiction.title} (RR ID: ${fiction.royalroad_id})`);

        // Re-scrape the fiction to get author data
        const fictionData = await scrapingService.scrapeFiction(fiction.royalroad_id);

        if (!fictionData) {
          console.log(`  ⚠️  Fiction not found on Royal Road (may have been deleted)`);
          notFound++;
          continue;
        }

        // Check if we got author data
        if (!fictionData.author.name || fictionData.author.name === 'Unknown Author') {
          console.log(`  ⚠️  Could not extract author name from page`);
          failed++;
          continue;
        }

        // Update the fiction with author data
        await dbService.updateFictionAuthor(fiction.id, {
          author_name: fictionData.author.name,
          author_id: fictionData.author.id || undefined,
          author_avatar: fictionData.author.avatar || undefined
        });

        console.log(`  ✅ Updated: ${fictionData.author.name} (Author ID: ${fictionData.author.id || 'N/A'})`);
        updated++;

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`  ❌ Failed to update fiction ${fiction.id}:`, error);
        failed++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Successfully updated: ${updated}`);
    console.log(`  ⚠️  Not found on Royal Road: ${notFound}`);
    console.log(`  ❌ Failed to update: ${failed}`);
    console.log(`  📚 Total processed: ${fictions.length}`);

  } catch (error) {
    console.error('❌ Script failed:', error);
    throw error;
  } finally {
    await dbService.disconnect();
  }
}

// Run the script
fixMissingAuthors()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

