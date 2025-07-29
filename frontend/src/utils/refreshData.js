/**
 * Utility to force refresh of goal data from backend
 * This clears cached state and fetches fresh structured data
 */

export const forceRefreshGoalData = () => {
  // Clear any cached data
  localStorage.removeItem('cachedGoals');
  localStorage.removeItem('selectedGoalId');
  
  // Force page reload to clear all React state
  window.location.reload();
};

export const clearGoalCache = () => {
  // Clear localStorage cache
  localStorage.removeItem('cachedGoals');
  localStorage.removeItem('selectedGoalId');
  
  console.log('🗑️ Goal cache cleared - fresh data will be fetched');
};
