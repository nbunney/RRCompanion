export interface RisingStarsData {
  genreTrends: { genre: string; trend: 'up' | 'down' | 'flat'; position?: number }[];
}

export interface RisingStarEntry {
  fiction_id: number;
  genre: string;
  position: number;
  captured_at: string;
}

/**
 * Analyzes Rising Stars data for a fiction to determine trends for each genre
 */
export function analyzeRisingStarsData(
  fictionId: number,
  risingStarsData: RisingStarEntry[]
): RisingStarsData {
  if (!risingStarsData || risingStarsData.length === 0) {
    return {
      genreTrends: []
    };
  }

  // Filter data for this specific fiction
  const fictionData = risingStarsData.filter(entry => entry.fiction_id === fictionId);
  
  if (fictionData.length === 0) {
    return {
      genreTrends: []
    };
  }

  // Group by genre
  const genreGroups = groupBy(fictionData, 'genre');
  const genreTrends: { genre: string; trend: 'up' | 'down' | 'flat'; position?: number }[] = [];

  // Process each genre
  Object.entries(genreGroups).forEach(([genre, entries]) => {
    if (entries.length === 0) return;

    // Sort by date (newest first)
    const sorted = entries.sort((a, b) =>
      new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime()
    );

    const latest = sorted[0];
    let trend: 'up' | 'down' | 'flat' = 'flat';

    // Determine trend by comparing with previous entry
    if (sorted.length >= 2) {
      const previous = sorted[1];
      if (latest.position < previous.position) {
        trend = 'up';
      } else if (latest.position > previous.position) {
        trend = 'down';
      }
    } else {
      // If only one entry, it's new (count as up)
      trend = 'up';
    }

    genreTrends.push({
      genre,
      trend,
      position: latest.position
    });
  });

  // Sort: main first, then alphabetically
  genreTrends.sort((a, b) => {
    if (a.genre === 'main') return -1;
    if (b.genre === 'main') return 1;
    return a.genre.localeCompare(b.genre);
  });

  return {
    genreTrends
  };
}

/**
 * Groups an array by a specified key
 */
function groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {} as { [key: string]: T[] });
}

/**
 * Gets the appropriate icon for the trend
 */
export function getTrendIcon(trend: 'up' | 'down' | 'flat'): string {
  switch (trend) {
    case 'up':
      return '↗️';
    case 'down':
      return '↘️';
    case 'flat':
      return '→';
    default:
      return '→';
  }
}

/**
 * Gets the appropriate color class for the trend
 */
export function getTrendColor(trend: 'up' | 'down' | 'flat'): string {
  switch (trend) {
    case 'up':
      return 'text-green-600';
    case 'down':
      return 'text-red-600';
    case 'flat':
      return 'text-gray-600';
    default:
      return 'text-gray-600';
  }
} 