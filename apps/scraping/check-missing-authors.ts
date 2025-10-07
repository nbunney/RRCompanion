import { DatabaseService } from './src/services/database';
import './src/utils/config';

async function checkMissingAuthors() {
  const dbService = new DatabaseService();

  try {
    await dbService.connect();

    console.log('🔍 Checking for fictions with missing author data...\n');

    // Find fictions with missing, null, or empty author names
    const query = `
      SELECT id, royalroad_id, title, author_name, author_id, author_avatar, created_at
      FROM fiction
      WHERE author_name IS NULL 
         OR author_name = '' 
         OR author_name = 'Unknown Author'
      ORDER BY created_at DESC
    `;

    const fictions = await dbService.query(query);

    if (fictions.length === 0) {
      console.log('✅ Great! No fictions with missing author data found!\n');
      return;
    }

    console.log(`📚 Found ${fictions.length} fiction(s) with missing author data:\n`);

    fictions.forEach((fiction: any, index: number) => {
      console.log(`${index + 1}. Fiction ID: ${fiction.id}`);
      console.log(`   Royal Road ID: ${fiction.royalroad_id}`);
      console.log(`   Title: ${fiction.title}`);
      console.log(`   Author Name: ${fiction.author_name || '(empty)'}`);
      console.log(`   Author ID: ${fiction.author_id || '(empty)'}`);
      console.log(`   Created: ${fiction.created_at}`);
      console.log(`   URL: https://www.royalroad.com/fiction/${fiction.royalroad_id}`);
      console.log('');
    });

    console.log(`\n📊 Total fictions needing author data: ${fictions.length}`);
    console.log(`\n💡 To fix these issues, run: ./run-fix-missing-authors.sh\n`);

  } catch (error) {
    console.error('❌ Check failed:', error);
    throw error;
  } finally {
    await dbService.disconnect();
  }
}

// Run the check
checkMissingAuthors()
  .then(() => {
    console.log('✅ Check completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });

