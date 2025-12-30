/**
 * Module Storage Utility
 * Persists selected module across page navigation
 */

const STORAGE_KEY = 'selectedModuleId';

/**
 * Get the persisted module ID from localStorage
 * @returns {string|null} The module ID or null if not set
 */
export function getPersistedModuleId() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
}

/**
 * Save the selected module ID to localStorage
 * @param {string} moduleId - The module ID to persist
 */
export function setPersistedModuleId(moduleId) {
  try {
    if (moduleId) {
      localStorage.setItem(STORAGE_KEY, moduleId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

/**
 * Clear the persisted module ID
 */
export function clearPersistedModuleId() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

