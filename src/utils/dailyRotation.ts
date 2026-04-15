/**
 * Daily Rotation Utility
 * Rotates items based on the day of the year to provide fresh suggestions daily
 */

/**
 * Get a subset of items rotated based on the current day of year
 * @param items - Array of items to rotate
 * @param count - Number of items to return (default: 5)
 * @returns Array of rotated items
 */
export const getDailyRotatedItems = <T>(items: T[], count: number = 5): T[] => {
    if (items.length === 0) return [];
    if (items.length <= count) return items;

    // Calculate day of year (1-365/366)
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    // Use day of year as seed for rotation
    const startIndex = dayOfYear % items.length;
    const rotated: T[] = [];

    for (let i = 0; i < count; i++) {
        rotated.push(items[(startIndex + i) % items.length]);
    }

    return rotated;
};

/**
 * Get a single random item from an array based on the current day
 * @param items - Array of items to choose from
 * @returns A single item
 */
export const getDailyItem = <T>(items: T[]): T | null => {
    if (items.length === 0) return null;

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    return items[dayOfYear % items.length];
};
