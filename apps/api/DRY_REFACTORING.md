# DRY Refactoring - Shared Utilities

## Overview

To maintain DRY (Don't Repeat Yourself) principles, we've consolidated duplicate code into shared utility modules that are used across all services.

## Shared Utilities Created

### 1. **HTML Entity Decoding** (`src/utils/htmlEntities.ts`)

**Purpose**: Decode HTML entities in fiction titles, author names, and descriptions

**Function**: `decodeHtmlEntities(text: string | null | undefined): string`

**Handles**:
- Hexadecimal numeric entities: `&#x2014;` → `—`
- Decimal numeric entities: `&#8212;` → `—`
- Named entities: `&mdash;` → `—`
- 20+ common HTML entities

**Used By**:
- `fiction.ts` - All fiction data returned to frontend
- `risingStarsMain.ts` - Rising Stars Main page data
- `risingStarsPosition.ts` - Position calculator data
- `userFiction.ts` - User fiction lists

### 2. **Rising Stars Movement Calculation** (`src/utils/risingStarsMovement.ts`)

**Purpose**: Calculate position movement (up/down/same/new) for fictions on Rising Stars

**Functions**:

#### `calculateMovement(currentPosition?, previousPosition?, previousDate?): MovementData`
- Determines if a fiction moved up, down, stayed the same, or is new
- Returns: `{ lastMove, lastPosition, lastMoveDate }`

#### `getPreviousPositions(fictionIds[], genre, beforeTimestamp): Map<fictionId, {position, date}>`
- Fetches previous positions for multiple fictions efficiently
- Single database query instead of N queries
- Returns map for easy lookup

#### `calculateMovementForFictions(fictions[], genre, beforeTimestamp): Map<fictionId, MovementData>`
- Batch calculate movement for multiple fictions
- Combines fetching and calculation in one call

**Used By**:
- `risingStarsMain.ts` - Calculate movement for all 50 fictions on Main
- `risingStarsPosition.ts` - Calculate movement for RS Main bottom 5, user's fiction, and competing fictions

## Benefits

### ✅ **Single Source of Truth**
- HTML entity decoding logic in ONE place
- Movement calculation logic in ONE place
- Changes propagate to all services automatically

### ✅ **Consistency**
- All services decode entities the same way
- All services calculate movement the same way
- Consistent behavior across entire application

### ✅ **Maintainability**
- Fix a bug once, it's fixed everywhere
- Add a new entity, it works everywhere
- Easier to test and debug

### ✅ **Performance**
- Batch database queries instead of N+1 queries
- Shared logic is optimized once
- Reduced code duplication = smaller bundles

## Code Reduction

### Before DRY Refactoring:
- HTML entity decoding: **Duplicated in 4 files** (46 lines × 4 = 184 lines)
- Movement calculation: **Duplicated in 2 files** (30 lines × 2 = 60 lines)
- **Total**: ~244 lines of duplicated code

### After DRY Refactoring:
- HTML entity decoding: **1 shared file** (46 lines)
- Movement calculation: **1 shared file** (115 lines)
- **Total**: 161 lines (saving ~83 lines of duplicate code)
- Plus imports are cleaner and more maintainable

## Usage Examples

### HTML Entity Decoding

```typescript
import { decodeHtmlEntities } from '../utils/htmlEntities.ts';

// Before (duplicated in each file)
const title = fiction.title.replace(/&#x([0-9a-fA-F]+);/g, ...);

// After (shared utility)
const title = decodeHtmlEntities(fiction.title);
```

### Movement Calculation

```typescript
import { calculateMovement, getPreviousPositions } from '../utils/risingStarsMovement.ts';

// Before (duplicated logic in each service)
let lastMove = 'new';
if (currentPosition < previousPosition) {
  lastMove = 'up';
} else if (currentPosition > previousPosition) {
  lastMove = 'down';
}

// After (shared utility)
const movement = calculateMovement(currentPosition, previousPosition, previousDate);
// movement = { lastMove, lastPosition, lastMoveDate }
```

### Batch Movement Calculation

```typescript
// Get previous positions for multiple fictions at once
const previousPositions = await getPreviousPositions(fictionIds, 'main', timestamp);

// Calculate movement for each fiction
fictions.forEach(fiction => {
  const previousData = previousPositions.get(fiction.id);
  const movement = calculateMovement(fiction.position, previousData?.position, previousData?.date);
});
```

## Testing

To ensure the shared utilities work correctly:

1. **HTML Entity Decoding**: Check that titles like `Re:Hero &#x2014; Starting Over` display correctly everywhere
2. **Movement Calculation**: Verify up/down arrows show consistently on RS Main and Position pages
3. **Performance**: Monitor database query counts (should be reduced with batch functions)

## Future Enhancements

Potential additional shared utilities:
- Date formatting functions (used in multiple components)
- Genre mapping/transformation functions
- Fiction status badge generation
- Common validation functions

## Files Modified

### Created:
- `apps/api/src/utils/htmlEntities.ts`
- `apps/api/src/utils/risingStarsMovement.ts`

### Updated:
- `apps/api/src/services/fiction.ts`
- `apps/api/src/services/risingStarsMain.ts`
- `apps/api/src/services/risingStarsPosition.ts`
- `apps/api/src/services/userFiction.ts`

All now import and use the shared utilities instead of duplicate code.

---

**Principle**: Write it once, use it everywhere. This is the foundation of maintainable code.

