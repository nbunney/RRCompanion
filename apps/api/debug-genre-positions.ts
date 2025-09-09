import { config } from 'https://deno.land/x/dotenv@v3.2.2/mod.ts';
import { Client } from 'https://deno.land/x/mysql@v2.12.0/mod.ts';

// Load environment variables
await config({ export: true });

const client = new Client();
await client.connect({
  hostname: Deno.env.get('DB_HOST') || 'localhost',
  username: Deno.env.get('DB_USER') || 'root',
  password: Deno.env.get('DB_PASSWORD') || '',
  db: Deno.env.get('DB_NAME') || 'RRCompanion',
  port: parseInt(Deno.env.get('DB_PORT') || '3306'),
});

async function debugGenrePositions() {
  try {
    console.log('🔍 Debugging genre positions for fiction ID 1...');
    
    // Check if fiction exists and get its tags
    const fictionQuery = 'SELECT id, title, tags FROM fiction WHERE id = 1';
    const fictionResult = await client.query(fictionQuery);
    
    if (fictionResult.length === 0) {
      console.log('❌ Fiction not found');
      return;
    }
    
    const fiction = fictionResult[0];
    console.log('📚 Fiction:', fiction.title);
    console.log('🏷️ Tags:', fiction.tags);
    console.log('📊 Tags type:', typeof fiction.tags);
    
    // Check if tags is an array or string
    let tags: string[] = [];
    if (Array.isArray(fiction.tags)) {
      tags = fiction.tags;
    } else if (typeof fiction.tags === 'string') {
      try {
        tags = JSON.parse(fiction.tags);
      } catch (e) {
        console.log('❌ Could not parse tags as JSON');
        return;
      }
    }
    
    console.log('📋 Parsed tags:', tags);
    
    // Test the genre mapping
    const tagToGenreMap: { [key: string]: string } = {
      'action': 'action',
      'adventure': 'adventure', 
      'comedy': 'comedy',
      'drama': 'drama',
      'fantasy': 'fantasy',
      'historical': 'historical',
      'horror': 'horror',
      'mystery': 'mystery',
      'romance': 'romance',
      'satire': 'satire',
      'scifi': 'sci_fi',
      'slice_of_life': 'slice_of_life',
      'sports': 'sports',
      'supernatural': 'supernatural',
      'tragedy': 'tragedy',
      'anti-hero_lead': 'anti-hero_lead',
      'antihero_lead': 'anti-hero_lead',
      'antihero': 'anti-hero_lead',
      'artificial_intelligence': 'artificial_intelligence',
      'ai': 'artificial_intelligence',
      'attractive_lead': 'attractive_lead',
      'cyberpunk': 'cyberpunk',
      'dungeon': 'dungeon',
      'dystopia': 'dystopia',
      'dystopian': 'dystopia',
      'female_lead': 'female_lead',
      'first_contact': 'first_contact',
      'gamelit': 'gamelit',
      'game_lit': 'gamelit',
      'gender_bender': 'gender_bender',
      'genetically_engineered': 'genetically_engineered%20',
      'grimdark': 'grimdark',
      'harem': 'harem',
      'high_fantasy': 'high_fantasy',
      'litrpg': 'litrpg',
      'lit_rpg': 'litrpg',
      'low_fantasy': 'low_fantasy',
      'male_lead': 'male_lead',
      'multiple_lead': 'multiple_lead',
      'multiple_lead_characters': 'multiple_lead',
      'mythos': 'mythos',
      'non_human_lead': 'non-human_lead',
      'non-human_lead': 'non-human_lead',
      'post_apocalyptic': 'post_apocalyptic',
      'post_apocalypse': 'post_apocalyptic',
      'progression': 'progression',
      'psychological': 'psychological',
      'reader_interactive': 'reader_interactive',
      'reincarnation': 'reincarnation',
      'ruling_class': 'ruling_class',
      'school_life': 'school_life',
      'schoollife': 'school_life',
      'secret_identity': 'secret_identity',
      'soft_scifi': 'soft_sci-fi',
      'soft_sci_fi': 'soft_sci-fi',
      'soft_sci-fi': 'soft_sci-fi',
      'space_opera': 'space_opera',
      'steampunk': 'steampunk',
      'strong_lead': 'strong_lead',
      'super_heroes': 'super_heroes',
      'superhero': 'super_heroes',
      'superheroes': 'super_heroes',
      'technologically_engineered': 'technologically_engineered',
      'time_loop': 'loop',
      'time_travel': 'time_travel',
      'urban_fantasy': 'urban_fantasy',
      'villainous_lead': 'villainous_lead',
      'virtual_reality': 'virtual_reality',
      'vr': 'virtual_reality',
      'war_and_military': 'war_and_military',
      'military': 'war_and_military',
      'wuxia': 'wuxia',
      'xianxia': 'xianxia',
      'summoned_hero': 'summoned_hero',
      'martial_arts': 'martial_arts',
      'portal_fantasy': 'portal_fantasy',
      'isekai': 'portal_fantasy',
      'magic': 'magic',
      'strategy': 'strategy',
      'contemporary': 'contemporary',
      'hard_sci_fi': 'sci_fi',
      'hard_sci-fi': 'sci_fi'
    };

    const matchedGenres = new Set<string>();
    
    for (const tag of tags) {
      const normalizedTag = tag.toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      
      console.log(`🔍 Checking tag: "${tag}" -> normalized: "${normalizedTag}"`);
      
      if (tagToGenreMap[normalizedTag]) {
        matchedGenres.add(tagToGenreMap[normalizedTag]);
        console.log(`✅ Matched: "${normalizedTag}" -> "${tagToGenreMap[normalizedTag]}"`);
      } else {
        console.log(`❌ No match for: "${normalizedTag}"`);
      }
    }
    
    console.log('🎯 Final matched genres:', Array.from(matchedGenres));
    
    // Check if any of these genres exist in risingStars table
    if (matchedGenres.size > 0) {
      const latestScrapeQuery = 'SELECT MAX(captured_at) as latest_scrape FROM risingStars';
      const latestScrapeResult = await client.query(latestScrapeQuery);
      const latestScrape = latestScrapeResult[0]?.latest_scrape;
      
      console.log('📅 Latest scrape:', latestScrape);
      
      for (const genre of matchedGenres) {
        const positionQuery = `
          SELECT position FROM risingStars 
          WHERE fiction_id = ? AND genre = ? AND captured_at = ? 
          LIMIT 1
        `;
        const positionResult = await client.query(positionQuery, [fiction.id, genre, latestScrape]);
        
        if (positionResult.length > 0) {
          console.log(`✅ Genre "${genre}": Position ${positionResult[0].position}`);
        } else {
          console.log(`❌ Genre "${genre}": Not found in risingStars table`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

debugGenrePositions();
