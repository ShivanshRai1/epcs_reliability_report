let lockCount = 0;
let prevBodyOverflow = '';
let prevHtmlOverflow = '';

export const lockBodyScroll = () => {
  if (typeof document === 'undefined') return;
  lockCount += 1;
  if (lockCount === 1) {
    prevBodyOverflow = document.body.style.overflow;
    prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
};

export const unlockBodyScroll = () => {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = prevBodyOverflow || 'auto';
    document.documentElement.style.overflow = prevHtmlOverflow || 'auto';
  }
};
