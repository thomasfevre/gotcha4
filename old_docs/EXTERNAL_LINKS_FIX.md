# External Links Storage Fix

## Issue
External links were being stored as empty arrays `[]` in the Supabase database instead of the actual external link data when creating or updating annoyances.

## Root Cause
The issue was caused by improper handling of empty arrays vs null values:

1. **Frontend**: Form initialized `external_links` as an empty array `[]`
2. **API Processing**: Empty arrays were being passed through without conversion to null
3. **Database Storage**: Supabase was storing empty arrays instead of null or the actual data
4. **Update Endpoint**: Force-defaulted external_links to empty array with `|| []`

## Fixes Applied

### 1. API Route (`/api/annoyances/route.ts`)
- **Before**: Passed empty arrays directly to database
- **After**: Convert empty arrays to `null` before storage
- **Change**: Added `processedExternalLinks = external_links && external_links.length > 0 ? external_links : null`

### 2. Update Endpoint (`/api/annoyances/[id]/route.ts`)
- **Before**: `external_links: validatedData.external_links || []` (forced empty array)
- **After**: `external_links: validatedData.external_links && validatedData.external_links.length > 0 ? validatedData.external_links : null`

### 3. Database Service (`lib/database.ts`)
- **Before**: `externalLinks?: ExternalLink[]`
- **After**: `externalLinks?: ExternalLink[] | null`
- **Change**: Updated parameter type to accept null values
- **Storage**: `external_links: externalLinks || null` ensures proper null storage

### 4. Schema Updates (`lib/schemas.ts`)
- **Before**: `external_links: z.array(ExternalLinkSchema).optional()`
- **After**: `external_links: z.array(ExternalLinkSchema).optional().nullable()`
- **Applied to**: `AnnoyanceSchema`, `CreateAnnoyanceSchema`, `UpdateAnnoyanceSchema`

## Technical Details

### Data Flow Fix
```typescript
// BEFORE (broken)
Frontend: [] → API: [] → Database: [] (empty array stored)

// AFTER (fixed)
Frontend: [] → API: null → Database: null (proper null storage)
Frontend: [links] → API: [links] → Database: [links] (actual data stored)
```

### Storage Logic
- **Empty array (no links)**: Store as `null` in database
- **Array with links**: Store the actual array data
- **Undefined**: Store as `null` in database

## Result
- ✅ External links now properly stored when added
- ✅ Empty external links stored as `null` instead of `[]`
- ✅ Updates correctly handle external link changes
- ✅ No breaking changes to existing functionality
- ✅ Proper TypeScript type safety maintained

## Testing
- Build successful with no compilation errors
- Schema validation handles null and array values correctly
- API endpoints process external links properly for both create and update operations

## Benefits
1. **Data Integrity**: Proper storage of external link data
2. **Consistency**: Null values instead of empty arrays for missing data
3. **Performance**: Cleaner database storage without unnecessary empty arrays
4. **Maintainability**: Proper TypeScript types prevent future issues
