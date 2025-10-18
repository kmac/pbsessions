// Fisher-Yates shuffle
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Picks a random element from an array
 * @param array - The array to pick from
 * @returns A random element from the array, or undefined if array is empty
 */
export function getRandomElement<T>(array: T[]): T | undefined {
  if (array.length === 0) {
    return undefined;
  }

  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}

/**
 * Picks a random element from an array, throws error if array is empty
 * @param array - The array to pick from
 * @returns A random element from the array
 * @throws Error if array is empty
 */
export function getRandomElementRequired<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error("Cannot pick random element from empty array");
  }

  const randomIndex = Math.floor(Math.random() * array.length);
  return array[randomIndex];
}
