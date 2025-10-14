/**
 * Image Utility Functions
 * Handles various image URL formats (relative paths, full URLs, cloudinary, etc.)
 */

/**
 * Get full URL for a logo (handles both relative paths and full URLs)
 * @param {string} logoUrl - The logo URL (can be relative or absolute)
 * @returns {string|null} - Full URL or null if no logo
 */
export const getLogoUrl = (logoUrl) => {
  if (!logoUrl) return null;
  
  // If already a full URL (starts with http), return as is
  if (logoUrl.startsWith('http')) {
    return logoUrl;
  }
  
  // Otherwise, it's a relative path, prepend base URL
  return `${window.location.origin}${logoUrl}`;
};

/**
 * Get logo URL from club object (handles both .logo and .logoUrl properties)
 * @param {object} club - Club object
 * @returns {string|null} - Full logo URL or null
 */
export const getClubLogoUrl = (club) => {
  if (!club) return null;
  
  // Try logoUrl first (standard field)
  if (club.logoUrl) {
    return getLogoUrl(club.logoUrl);
  }
  
  // Fallback to .logo field (some older code uses this)
  if (club.logo) {
    return getLogoUrl(club.logo);
  }
  
  return null;
};

/**
 * Get fallback/placeholder for club logo
 * @param {object} club - Club object
 * @returns {string} - First letter of club name
 */
export const getClubLogoPlaceholder = (club) => {
  if (!club || !club.name) return '?';
  return club.name.charAt(0).toUpperCase();
};

/**
 * Handle image load error by showing placeholder
 * @param {Event} e - Error event
 * @param {string} placeholderText - Text to show in placeholder
 */
export const handleImageError = (e, placeholderText = '?') => {
  e.target.style.display = 'none';
  
  // If there's a parent with club-logo class, show placeholder
  const parent = e.target.parentElement;
  if (parent) {
    const placeholder = document.createElement('div');
    placeholder.className = 'club-logo-placeholder';
    placeholder.textContent = placeholderText;
    parent.appendChild(placeholder);
  }
};
