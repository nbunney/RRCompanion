/**
 * Utility functions for consistent date formatting in the user's local timezone
 */

/**
 * Format a date string or Date object to show the date in the user's local timezone
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export function formatLocalDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return 'Unknown Date';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  return dateObj.toLocaleDateString(undefined, options);
}

/**
 * Format a date string or Date object to show the time in the user's local timezone
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted time string
 */
export function formatLocalTime(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return 'Unknown Time';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return 'Invalid Time';

  return dateObj.toLocaleTimeString(undefined, options);
}

/**
 * Format a date string or Date object to show both date and time in the user's local timezone
 * @param date - Date string or Date object
 * @param dateOptions - Intl.DateTimeFormatOptions for date formatting
 * @param timeOptions - Intl.DateTimeFormatOptions for time formatting
 * @returns Formatted date and time string
 */
export function formatLocalDateTime(
  date: string | Date | null | undefined,
  dateOptions?: Intl.DateTimeFormatOptions,
  timeOptions?: Intl.DateTimeFormatOptions
): string {
  if (!date) return 'Unknown Date/Time';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) return 'Invalid Date/Time';

  const dateStr = dateObj.toLocaleDateString(undefined, dateOptions);
  const timeStr = dateObj.toLocaleTimeString(undefined, timeOptions);

  return `${dateStr} at ${timeStr}`;
}

/**
 * Get the current year in the user's local timezone
 * @returns Current year as number
 */
export function getCurrentYear(): number {
  return new Date().getFullYear();
}

/**
 * Check if a date is valid
 * @param date - Date string or Date object
 * @returns True if date is valid, false otherwise
 */
export function isValidDate(date: string | Date | null | undefined): boolean {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return !isNaN(dateObj.getTime());
} 