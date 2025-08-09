/**
 * Converts a fiction title to a URL-friendly format with underscores
 * @param title - The fiction title
 * @returns URL-friendly version of the title
 */
export function createFictionSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/-+/g, '_') // Replace hyphens with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single underscore
    .trim();
}

/**
 * Creates a fiction URL with both the slug and Royal Road ID
 * @param title - The fiction title
 * @param royalroadId - The Royal Road ID
 * @returns Complete fiction URL
 */
export function createFictionUrl(title: string, royalroadId: string): string {
  const slug = createFictionSlug(title);
  return `/fiction/${royalroadId}/${slug}`;
}

/**
 * Extracts the Royal Road ID from a fiction URL
 * @param url - The fiction URL
 * @returns The Royal Road ID
 */
export function extractRoyalRoadIdFromUrl(url: string): string | null {
  const match = url.match(/\/fiction\/([^\/]+)/);
  return match ? match[1] : null;
} 