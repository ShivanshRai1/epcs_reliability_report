/**
 * Template information mapping and utilities
 * Helps identify and display template types in editors
 */

export const TEMPLATE_INFO = {
  'text-only': { name: 'Text Only', icon: '📝' },
  'just-links': { name: 'Links + Text', icon: '🔗' },
  'link-only': { name: 'Links Only', icon: '🔗' },
  'just-images': { name: 'Just Images', icon: '🖼️' },
  'mixed-content': { name: 'Mixed Content', icon: '📄' },
  'heading': { name: 'Heading', icon: '📌' },
  'index': { name: 'Index', icon: '📑' },
  'image-text': { name: 'Image + Text', icon: '📸' },
  'split-text-image': { name: 'Split Text + Image', icon: '🧩' },
  'split-links-image': { name: 'Split Links + Image', icon: '🧩' },
  'split-image-links': { name: 'Split Image + Links', icon: '🧩' },
  'split-content': { name: 'Split Content', icon: '⬀' },
  'table': { name: 'Table', icon: '📊' },
  'images-gallery': { name: 'Images Gallery', icon: '🖼️' },
  'images-carousel': { name: 'Images Carousel', icon: '🎠' },
  'video-gallery': { name: 'Video Gallery', icon: '📹' }
};

/**
 * Get template info from page object
 * @param {Object} page - Page object from API
 * @returns {Object|null} Template info or null if not found
 */
export const getTemplateInfo = (page) => {
  if (!page) return null;
  
  // Try to get template ID from various keys
  const templateId = page.page_template || page.pageTemplate || page.templateId;
  
  if (!templateId || !TEMPLATE_INFO[templateId]) {
    return null;
  }
  
  return TEMPLATE_INFO[templateId];
};

/**
 * Create a template badge JSX element
 * @param {Object} page - Page object
 * @param {boolean} showBadge - Whether to show the badge
 * @returns {JSX|null} Badge element or null
 */
export const getTemplateBadge = (page, showBadge = true) => {
  if (!showBadge) return null;
  
  const templateInfo = getTemplateInfo(page);
  if (!templateInfo) return null;
  
  return (
    <span style={{
      fontSize: '11px',
      background: '#3b82f6',
      color: '#fff',
      padding: '3px 8px',
      borderRadius: '3px',
      whiteSpace: 'nowrap',
      fontWeight: '500'
    }}>
      Template: {templateInfo.name}
    </span>
  );
};

/**
 * Get template display name
 * @param {string} templateId - Template ID
 * @returns {string} Display name
 */
export const getTemplateName = (templateId) => {
  return TEMPLATE_INFO[templateId]?.name || templateId || 'Unknown';
};

/**
 * Get template icon
 * @param {string} templateId - Template ID
 * @returns {string} Icon emoji
 */
export const getTemplateIcon = (templateId) => {
  return TEMPLATE_INFO[templateId]?.icon || '📄';
};
