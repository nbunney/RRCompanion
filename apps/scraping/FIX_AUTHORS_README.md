# Fix Missing Authors Script

This script helps identify and fix fictions in the database that are missing
author information.

## Problem

Due to errors during initial scraping, some fictions may have been added to the
database without author names. This script will:

1. Find all fictions with missing, null, or empty author names
2. Re-scrape each fiction from Royal Road to get the author data
3. Update the database with the correct author information

## Prerequisites

- Ensure your `.env` file is properly configured with database credentials
- Make sure you have network access to Royal Road
- The scraping service must be properly set up

## How to Run

### Option 1: Using the Shell Script (Recommended)

```bash
cd apps/scraping
./run-fix-missing-authors.sh
```

### Option 2: Manual Execution

```bash
cd apps/scraping

# Compile TypeScript
npx tsc fix-missing-authors.ts --outDir dist --esModuleInterop --resolveJsonModule --module commonjs --moduleResolution node --target es2020 --lib es2020

# Run the script
node dist/fix-missing-authors.js
```

### Option 3: Using ts-node

```bash
cd apps/scraping
npx ts-node fix-missing-authors.ts
```

## What the Script Does

1. **Searches** for fictions with missing author data:
   - `author_name IS NULL`
   - `author_name = ''`
   - `author_name = 'Unknown Author'`

2. **Re-scrapes** each fiction from Royal Road to extract:
   - Author name
   - Author ID (profile ID)
   - Author avatar URL

3. **Updates** the database with the new author information

4. **Reports** the results:
   - Successfully updated fictions
   - Fictions not found on Royal Road (deleted/moved)
   - Failed updates (errors during processing)

## Rate Limiting

The script includes a 1-second delay between each fiction to avoid rate limiting
from Royal Road. If you have many fictions to update, the script may take some
time to complete.

## Output Example

```
🔍 Searching for fictions with missing author data...
📚 Found 5 fiction(s) with missing author data:
  - ID: 123, RR ID: 12345, Title: Example Fiction, Author: (empty)
  - ID: 124, RR ID: 12346, Title: Another Story, Author: (empty)

🚀 Starting to re-scrape and update...

📖 Processing: Example Fiction (RR ID: 12345)
  ✅ Updated: John Doe (Author ID: 67890)

📖 Processing: Another Story (RR ID: 12346)
  ✅ Updated: Jane Smith (Author ID: 67891)

📊 Summary:
  ✅ Successfully updated: 5
  ⚠️  Not found on Royal Road: 0
  ❌ Failed to update: 0
  📚 Total processed: 5
```

## Troubleshooting

### "Author not found on Royal Road"

This means the fiction may have been deleted or moved on Royal Road. You'll need
to manually handle these cases.

### "Could not extract author name from page"

The scraping logic couldn't find the author information on the page. This could
mean:

- The page structure has changed
- The fiction has unusual formatting
- There was a network issue

### Database Connection Issues

Make sure your `.env` file has the correct database credentials:

```
DATABASE_HOST=your-host
DATABASE_USER=your-user
DATABASE_PASSWORD=your-password
DATABASE_NAME=your-database
```

## After Running

After the script completes successfully:

1. Verify the author names are now showing in the UI
2. Check the database to confirm the updates
3. You can safely delete the script files if you no longer need them

## Files Created

- `fix-missing-authors.ts` - Main TypeScript script
- `run-fix-missing-authors.sh` - Convenient shell script wrapper
- `FIX_AUTHORS_README.md` - This documentation file

You can safely delete these files after fixing the missing authors if you don't
anticipate needing them again.
