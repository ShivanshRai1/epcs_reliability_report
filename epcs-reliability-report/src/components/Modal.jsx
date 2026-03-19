import React from 'react';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';

const Modal = ({ isOpen, imageSrc, imageAlt, onClose, children }) => {
  const isImageOnly = !children && Boolean(imageSrc);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  React.useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    lockBodyScroll();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      unlockBodyScroll();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-content${isImageOnly ? ' modal-content-image' : ''}`}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        {children ? (
          children
        ) : (
          <img src={imageSrc} alt={imageAlt} className="modal-image modal-image-sharp" />
        )}
      </div>
    </div>
  );
};

export default Modal;
