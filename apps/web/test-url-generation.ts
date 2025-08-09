// Test script for URL generation functions
function createFictionSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/-+/g, '_') // Replace hyphens with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single underscore
    .trim();
}

function createFictionUrl(title: string, royalroadId: string): string {
  const slug = createFictionSlug(title);
  return `/fiction/${royalroadId}/${slug}`;
}

// Test cases
const testCases = [
  { title: "The Wandering Inn", id: "122197" },
  { title: "Mother of Learning", id: "21220" },
  { title: "He Who Fights with Monsters", id: "110569" },
  { title: "A Practical Guide to Evil", id: "122197" },
  { title: "The Good Student", id: "123456" },
  { title: "Super Powereds: Year 1", id: "789012" },
  { title: "Worm - A Complete Web Serial", id: "345678" },
  { title: "The Legendary Mechanic", id: "901234" },
];

console.log('🧪 Testing URL generation functions...\n');

testCases.forEach(({ title, id }) => {
  const slug = createFictionSlug(title);
  const url = createFictionUrl(title, id);

  console.log(`Title: "${title}"`);
  console.log(`ID: ${id}`);
  console.log(`Slug: ${slug}`);
  console.log(`URL: ${url}`);
  console.log('---');
});

console.log('\n✅ URL generation test completed!'); 