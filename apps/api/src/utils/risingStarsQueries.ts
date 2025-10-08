import { client } from '../config/database.ts';
import { decodeHtmlEntities } from './htmlEntities.ts';

/**
 * Optimized query to get Rising Stars Main bottom positions with movement data
 * Uses a single query with subqueries instead of multiple round trips
 */
export async function getRSMainBottomWithMovement(
  startPosition: number,
  endPosition: number,
  currentTimestamp: string
): Promise<Array<{
  fictionId: number;
  title: string;
  authorName: string;
  royalroadId: string;
  imageUrl?: string;
  position: number;
  lastMove: 'up' | 'down' | 'same' | 'new';
  lastPosition?: number;
  lastMoveDate?: string;
}>> {
  // Use the same query logic as Rising Stars Main (which works correctly)
  // First get all the fictions at current positions
  const currentQuery = `
    SELECT 
      rs.position,
      rs.fiction_id,
      f.title,
      f.author_name,
      f.royalroad_id,
      f.image_url
    FROM risingStars rs
    JOIN fiction f ON rs.fiction_id = f.id
    WHERE rs.captured_at = ?
      AND rs.genre = 'main'
      AND rs.position BETWEEN ? AND ?
    ORDER BY rs.position ASC
  `;

  const currentResult = await client.query(currentQuery, [
    currentTimestamp,
    startPosition,
    endPosition
  ]);

  if (currentResult.length === 0) {
    return [];
  }

  // Get fiction IDs for previous position lookup
  const fictionIds = currentResult.map((row: any) => row.fiction_id);
  const placeholders = fictionIds.map(() => '?').join(',');

  // Get previous positions - same query as RS Main uses
  const previousPositionQuery = `
    SELECT 
      rs.fiction_id,
      rs.position,
      rs.captured_at
    FROM risingStars rs
    INNER JOIN (
      SELECT fiction_id, MAX(captured_at) as max_captured
      FROM risingStars
      WHERE fiction_id IN (${placeholders})
        AND genre = 'main'
        AND captured_at < ?
      GROUP BY fiction_id, position
    ) latest ON rs.fiction_id = latest.fiction_id 
      AND rs.captured_at = latest.max_captured
    WHERE rs.genre = 'main'
    ORDER BY rs.fiction_id, rs.captured_at DESC
  `;

  const previousPositionResult = await client.query(
    previousPositionQuery,
    [...fictionIds, currentTimestamp]
  );

  // Create map of current positions
  const currentPositionMap = new Map<number, number>();
  currentResult.forEach((row: any) => {
    currentPositionMap.set(row.fiction_id, row.position);
  });

  // Create map of previous positions (first different position found)
  const previousPositions = new Map<number, { position: number; date: string }>();
  previousPositionResult.forEach((row: any) => {
    const currentPosition = currentPositionMap.get(row.fiction_id);
    if (currentPosition !== undefined && row.position !== currentPosition && !previousPositions.has(row.fiction_id)) {
      previousPositions.set(row.fiction_id, {
        position: row.position,
        date: new Date(row.captured_at).toISOString()
      });
    }
  });

  const result = currentResult;

  // Map results with movement data (same logic as RS Main)
  return result.map((row: any) => {
    const previousData = previousPositions.get(row.fiction_id);
    let lastMove: 'up' | 'down' | 'same' | 'new' = 'new';
    let lastPosition: number | undefined;
    let lastMoveDate: string | undefined;

    if (previousData !== undefined) {
      lastPosition = previousData.position;
      lastMoveDate = previousData.date;
      
      if (row.position < previousData.position) {
        lastMove = 'up';
      } else if (row.position > previousData.position) {
        lastMove = 'down';
      } else {
        lastMove = 'same';
      }
    }

    return {
      fictionId: row.fiction_id,
      title: decodeHtmlEntities(row.title),
      authorName: decodeHtmlEntities(row.author_name),
      royalroadId: row.royalroad_id,
      imageUrl: row.image_url,
      position: row.position,
      lastMove,
      lastPosition,
      lastMoveDate
    };
  });
}

/**
 * Get movement data for a single fiction
 * Optimized single query approach
 */
export async function getFictionMovement(
  fictionId: number,
  genre: string,
  currentTimestamp: string
): Promise<{
  currentPosition?: number;
  lastMove: 'up' | 'down' | 'same' | 'new';
  lastPosition?: number;
  lastMoveDate?: string;
}> {
  // Use the same query logic as Rising Stars Main (which works correctly)
  const currentQuery = `
    SELECT position
    FROM risingStars
    WHERE fiction_id = ?
      AND genre = ?
      AND captured_at = ?
    LIMIT 1
  `;

  const currentResult = await client.query(currentQuery, [fictionId, genre, currentTimestamp]);

  if (currentResult.length === 0) {
    return { lastMove: 'new' };
  }

  const currentPosition = currentResult[0].position;

  // Get previous positions - same query as RS Main uses
  const previousPositionQuery = `
    SELECT 
      rs.fiction_id,
      rs.position,
      rs.captured_at
    FROM risingStars rs
    INNER JOIN (
      SELECT fiction_id, MAX(captured_at) as max_captured
      FROM risingStars
      WHERE fiction_id = ?
        AND genre = ?
        AND captured_at < ?
      GROUP BY fiction_id, position
    ) latest ON rs.fiction_id = latest.fiction_id 
      AND rs.captured_at = latest.max_captured
    WHERE rs.genre = ?
    ORDER BY rs.fiction_id, rs.captured_at DESC
    LIMIT 1
  `;

  const previousPositionResult = await client.query(
    previousPositionQuery,
    [fictionId, genre, currentTimestamp, genre]
  );

  let lastMove: 'up' | 'down' | 'same' | 'new' = 'new';
  let lastPosition: number | undefined;
  let lastMoveDate: string | undefined;

  if (previousPositionResult.length > 0) {
    const previousData = previousPositionResult[0];
    
    // Only use this if it's a DIFFERENT position
    if (previousData.position !== currentPosition) {
      lastPosition = previousData.position;
      lastMoveDate = new Date(previousData.captured_at).toISOString();
      
      if (currentPosition < previousData.position) {
        lastMove = 'up';
      } else if (currentPosition > previousData.position) {
        lastMove = 'down';
      } else {
        lastMove = 'same';
      }
    }
  }

  return {
    currentPosition,
    lastMove,
    lastPosition,
    lastMoveDate
  };
}

