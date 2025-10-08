import { client } from '../config/database.ts';

/**
 * Shared type for movement data
 */
export interface MovementData {
  lastMove: 'up' | 'down' | 'same' | 'new';
  lastPosition?: number;
  lastMoveDate?: string;
}

/**
 * Calculate movement data for a single fiction
 * Compares current position with the most recent different position
 */
export function calculateMovement(
  currentPosition: number | undefined,
  previousPosition?: number,
  previousDate?: string
): MovementData {
  let lastMove: 'up' | 'down' | 'same' | 'new' = 'new';
  let lastPosition: number | undefined;
  let lastMoveDate: string | undefined;

  if (typeof currentPosition === 'number' && previousPosition !== undefined) {
    lastPosition = previousPosition;
    lastMoveDate = previousDate;

    if (currentPosition < previousPosition) {
      lastMove = 'up'; // Better position (lower number)
    } else if (currentPosition > previousPosition) {
      lastMove = 'down'; // Worse position (higher number)
    } else {
      lastMove = 'same';
    }
  } else if (typeof currentPosition === 'number') {
    lastMove = 'same'; // Has position but no previous data
  }

  return {
    lastMove,
    lastPosition,
    lastMoveDate
  };
}

/**
 * Get previous positions for a list of fictions in a specific genre
 * Returns a map of fiction_id -> { position, date }
 */
export async function getPreviousPositions(
  fictionIds: number[],
  genre: string,
  beforeTimestamp: string
): Promise<Map<number, { position: number; date: string }>> {
  if (fictionIds.length === 0) {
    return new Map();
  }

  const previousPositionsQuery = `
    SELECT 
      rs.fiction_id,
      rs.position,
      rs.captured_at
    FROM risingStars rs
    INNER JOIN (
      SELECT fiction_id, MAX(captured_at) as max_captured
      FROM risingStars
      WHERE fiction_id IN (${fictionIds.map(() => '?').join(',')})
        AND genre = ?
        AND captured_at < ?
      GROUP BY fiction_id, position
    ) latest ON rs.fiction_id = latest.fiction_id 
      AND rs.captured_at = latest.max_captured
    WHERE rs.genre = ?
    ORDER BY rs.fiction_id, rs.captured_at DESC
  `;

  const result = await client.query(
    previousPositionsQuery,
    [...fictionIds, genre, beforeTimestamp, genre]
  );

  return new Map(
    result.map((row: any) => [
      row.fiction_id,
      {
        position: row.position,
        date: new Date(row.captured_at).toISOString()
      }
    ])
  );
}

/**
 * Calculate movement for multiple fictions
 * Takes current positions and fetches previous positions to determine movement
 */
export async function calculateMovementForFictions(
  fictions: { fictionId: number; currentPosition?: number }[],
  genre: string,
  beforeTimestamp: string,
  currentPositionMap?: Map<number, number>
): Promise<Map<number, MovementData>> {
  const fictionIds = fictions.map(f => f.fictionId);
  const previousPositions = await getPreviousPositions(fictionIds, genre, beforeTimestamp);
  const movementMap = new Map<number, MovementData>();

  fictions.forEach(fiction => {
    const currentPosition = currentPositionMap?.get(fiction.fictionId) ?? fiction.currentPosition;
    const previousData = previousPositions.get(fiction.fictionId);

    const movement = calculateMovement(
      currentPosition,
      previousData?.position,
      previousData?.date
    );

    movementMap.set(fiction.fictionId, movement);
  });

  return movementMap;
}

