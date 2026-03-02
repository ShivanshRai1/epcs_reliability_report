const FILE_EXTENSION_PATTERN = /\.(pdf|ppt|pptx|xls|xlsx|doc|docx|csv|txt|zip)(?:[?#].*)?$/i;
const DOMAIN_PATTERN = /^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/:?#].*)?$/i;
const SCHEME_PATTERN = /^[a-z][a-z0-9+.-]*:/i;

export const isLikelyLinkTarget = (value) => {
  if (typeof value !== 'string') return false;

  const target = value.trim();
  if (!target) return false;

  return (
    SCHEME_PATTERN.test(target) ||
    target.startsWith('//') ||
    target.startsWith('www.') ||
    target.startsWith('/') ||
    target.startsWith('./') ||
    target.startsWith('../') ||
    target.includes('\\') ||
    FILE_EXTENSION_PATTERN.test(target) ||
    DOMAIN_PATTERN.test(target)
  );
};

export const toOpenableUrl = (value) => {
  if (typeof value !== 'string') return '';

  const target = value.trim();
  if (!target) return '';

  if (target.startsWith('//')) {
    return `https:${target}`;
  }

  if (target.startsWith('www.')) {
    return `https://${target}`;
  }

  if (DOMAIN_PATTERN.test(target) && !SCHEME_PATTERN.test(target)) {
    return `https://${target}`;
  }

  return target;
};
