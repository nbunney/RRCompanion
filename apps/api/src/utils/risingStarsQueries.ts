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
  const query = `
    SELECT 
      current.position,
      current.fiction_id,
      f.title,
      f.author_name,
      f.royalroad_id,
      f.image_url,
      prev.position as prev_position,
      prev.captured_at as prev_captured_at
    FROM risingStars current
    JOIN fiction f ON current.fiction_id = f.id
    LEFT JOIN (
      SELECT 
        rs.fiction_id,
        rs.position,
        rs.captured_at
      FROM risingStars rs
      WHERE rs.genre = 'main'
        AND rs.captured_at < ?
        AND rs.captured_at >= DATE_SUB(?, INTERVAL 7 DAY)
      ORDER BY rs.captured_at DESC
    ) prev ON current.fiction_id = prev.fiction_id 
      AND prev.position != current.position
    WHERE current.captured_at = ?
      AND current.genre = 'main'
      AND current.position BETWEEN ? AND ?
    GROUP BY current.fiction_id, current.position
    ORDER BY current.position ASC
  `;

  const result = await client.query(query, [
    currentTimestamp,
    currentTimestamp,
    currentTimestamp,
    startPosition,
    endPosition
  ]);

  return result.map((row: any) => {
    let lastMove: 'up' | 'down' | 'same' | 'new' = 'new';
    let lastPosition: number | undefined;
    let lastMoveDate: string | undefined;

    if (row.prev_position) {
      lastPosition = row.prev_position;
      lastMoveDate = new Date(row.prev_captured_at).toISOString();
      
      if (row.position < row.prev_position) {
        lastMove = 'up';
      } else if (row.position > row.prev_position) {
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
  const query = `
    SELECT 
      current.position as current_position,
      prev.position as prev_position,
      prev.captured_at as prev_captured_at
    FROM risingStars current
    LEFT JOIN (
      SELECT 
        position,
        captured_at
      FROM risingStars
      WHERE fiction_id = ?
        AND genre = ?
        AND captured_at < ?
        AND captured_at >= DATE_SUB(?, INTERVAL 7 DAY)
      ORDER BY captured_at DESC
      LIMIT 1
    ) prev ON 1=1
    WHERE current.fiction_id = ?
      AND current.genre = ?
      AND current.captured_at = ?
    LIMIT 1
  `;

  const result = await client.query(query, [
    fictionId,
    genre,
    currentTimestamp,
    currentTimestamp,
    fictionId,
    genre,
    currentTimestamp
  ]);

  if (result.length === 0) {
    return { lastMove: 'new' };
  }

  const row = result[0];
  let lastMove: 'up' | 'down' | 'same' | 'new' = 'new';
  let lastPosition: number | undefined;
  let lastMoveDate: string | undefined;

  if (row.prev_position) {
    lastPosition = row.prev_position;
    lastMoveDate = new Date(row.prev_captured_at).toISOString();
    
    if (row.current_position < row.prev_position) {
      lastMove = 'up';
    } else if (row.current_position > row.prev_position) {
      lastMove = 'down';
    } else {
      lastMove = 'same';
    }
  } else if (row.current_position) {
    lastMove = 'same';
  }

  return {
    currentPosition: row.current_position,
    lastMove,
    lastPosition,
    lastMoveDate
  };
}

