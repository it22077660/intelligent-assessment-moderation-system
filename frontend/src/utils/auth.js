/**
 * Authentication Utility Functions
 * Handles token storage and retrieval
 */

const TOKEN_KEY = 'loc_analyzer_token';

/**
 * Save authentication token to localStorage
 */
export const setAuthToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Remove authentication token from localStorage
 */
export const removeAuthToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Get authorization header for API requests
 */
export const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

