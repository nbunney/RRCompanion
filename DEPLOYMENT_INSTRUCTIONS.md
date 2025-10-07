# RRCompanion Deployment Instructions

## Recent Updates to Deploy

### 1. Author Extraction Fix (Serverless Scraping)

**Location**: `apps/scraping/src/services/royalroad.ts`

**What Changed**:

- Improved author name extraction from Royal Road pages
- Now correctly extracts authors from "by [Author Name]" pattern in `<h4>`
  elements
- Falls back to profile link selector if needed
- Fixes "Unknown Author" issue

**Status**: ✅ TypeScript compiled successfully

### 2. Rising Stars Best Positions System (API Backend)

**New Files**:

- Migration:
  `apps/api/migrations/020_create_rising_stars_best_positions_table.sql`
- Service: `apps/api/src/services/risingStarsBestPositions.ts`
- Controllers: Updated `apps/api/src/controllers/admin.ts`
- Routes: Updated `apps/api/src/routes/admin.ts`
- Cron: Updated `apps/api/src/services/cron.ts`
- Rising Stars: Updated `apps/api/src/services/risingStarsPosition.ts`

**What Changed**:

- New table to preserve historical best positions
- Daily cron job to update best positions (2am PST)
- Data cleanup script to remove non-noon scrapes
- API endpoints for manual control
- Fiction pages now show true historical best positions

**Status**: ✅ Code complete, ready for deployment

---

## Deployment Steps

### Part 1: Deploy Serverless Scraping Functions (Author Fix)

```bash
# Navigate to scraping directory
cd /Users/nathan/Sites/RRCompanion/apps/scraping

# Ensure environment variables are configured
# Check/edit .env file if needed
cat .env

# Deploy to AWS Lambda
./deploy.sh prod

# Or if you prefer npm commands:
npm run deploy:prod
```

**Expected Result**: Lambda functions will be updated with improved author
extraction logic.

**Verify**: After deployment, newly scraped fictions should have correct author
names (not "Unknown Author").

---

### Part 2: Deploy API Backend (Best Positions System)

#### Step 1: Run Database Migration

The migration will be run automatically when you restart the API server, but you
can verify:

```bash
cd /Users/nathan/Sites/RRCompanion/apps/api

# The migration will run on next server start
# Check if migration has run by looking at the database migrations table
```

#### Step 2: Restart API Server on Production

**On your production server** (not local):

```bash
# Navigate to API directory
cd /var/www/rrcompanion/apps/api

# Pull latest changes from git
git pull origin master

# Restart the API service
sudo systemctl restart rrcompanion-api

# Check service status
sudo systemctl status rrcompanion-api

# View logs to confirm migration ran
sudo journalctl -u rrcompanion-api -f
```

#### Step 3: Initialize Best Positions Data

After the API is running with the new code, populate the initial best positions:

```bash
# Call the admin endpoint to populate best positions
curl -X POST https://rrcompanion.com/api/admin/rising-stars/update-best-positions \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Step 4: Test Data Cleanup (Dry Run First!)

```bash
# Test cleanup (dry run - won't delete anything)
curl -X POST "https://rrcompanion.com/api/admin/rising-stars/cleanup" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Review the response to see what would be deleted

# If satisfied, run actual cleanup
curl -X POST "https://rrcompanion.com/api/admin/rising-stars/cleanup?dryRun=false" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Post-Deployment Verification

### Verify Serverless Functions

1. **Check Lambda deployment**:
   ```bash
   cd /Users/nathan/Sites/RRCompanion/apps/scraping
   serverless info --stage prod
   ```

2. **Test author extraction**:
   - Wait for next scraping run (or manually trigger)
   - Check a newly scraped fiction to see if author is correct

### Verify API Backend

1. **Check migration**:
   ```bash
   # On production server
   mysql -u rrc_user -p -h YOUR_RDS_HOST RRCompanion

   # Check if table exists
   SHOW TABLES LIKE 'risingStarsBestPositions';

   # Check if migration record exists
   SELECT * FROM migrations WHERE name LIKE '%020%';
   ```

2. **Check cron job**:
   - Wait for 2:00am PST or check logs
   - Should see "🏆 Running daily Rising Stars best positions update..."

3. **Check fiction pages**:
   - Visit any fiction page with Rising Stars data
   - Should now show `bestPosition` in genre data

---

## Rollback Plan

### If Serverless Deployment Fails:

```bash
cd /Users/nathan/Sites/RRCompanion/apps/scraping
serverless rollback --stage prod
```

### If API Deployment Has Issues:

```bash
# On production server
cd /var/www/rrcompanion
git log --oneline -5  # Find previous commit
git checkout PREVIOUS_COMMIT_HASH
sudo systemctl restart rrcompanion-api
```

---

## Monitoring

### Serverless Functions:

```bash
# View Lambda logs
cd /Users/nathan/Sites/RRCompanion/apps/scraping
npm run logs -- --function scrapeFiction --stage prod --tail
```

### API Backend:

```bash
# On production server
sudo journalctl -u rrcompanion-api -f
```

### Database:

```sql
-- Check best positions table
SELECT COUNT(*) FROM risingStarsBestPositions;

-- Check risingStars table size before cleanup
SELECT COUNT(*) FROM risingStars;

-- Check risingStars table size after cleanup
-- (Should be much smaller if cleanup ran)
```

---

## Important Notes

⚠️ **Before running cleanup**:

1. ✅ Make sure best positions update has run successfully
2. ✅ Test with dry run first
3. ✅ Have a database backup

✅ **Automatic processes**:

- Best positions update: Daily at 2:00am PST
- Rising Stars scraping: Every 15 minutes
- Fiction history scraping: Every 6 hours

📊 **Expected improvements**:

- Fiction pages show correct author names (not "Unknown Author")
- Fiction pages show accurate historical best positions
- Reduced database size from cleanup (keeping only noon scrapes)
- Faster Rising Stars Main page loads
