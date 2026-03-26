import React from 'react';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';

const MIN_ZOOM = 1;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

const Modal = ({ isOpen, imageSrc, imageAlt, onClose, children }) => {
  const isImageOnly = !children && Boolean(imageSrc);
  const [zoom, setZoom] = React.useState(1);

  const resetZoom = React.useCallback(() => {
    setZoom(1);
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const applyZoomDelta = React.useCallback((delta) => {
    setZoom((prev) => clampZoom(Number((prev + delta).toFixed(2))));
  }, []);

  const handleWheel = (e) => {
    if (!e.ctrlKey || !isImageOnly) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    applyZoomDelta(delta);
  };

  const handleKeyDown = React.useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (!isImageOnly || !e.ctrlKey) return;

    if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      applyZoomDelta(ZOOM_STEP);
      return;
    }

    if (e.key === '-') {
      e.preventDefault();
      applyZoomDelta(-ZOOM_STEP);
      return;
    }

    if (e.key === '0') {
      e.preventDefault();
      resetZoom();
    }
  }, [applyZoomDelta, isImageOnly, onClose, resetZoom]);

  React.useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleKeyDown);
    lockBodyScroll();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      unlockBodyScroll();
    };
  }, [handleKeyDown, isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      resetZoom();
    }
  }, [imageSrc, isOpen, resetZoom]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} onWheel={handleWheel}>
      <div className={`modal-content${isImageOnly ? ' modal-content-image' : ''}`}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        {children ? (
          children
        ) : (
          <div className="modal-image-viewport" title={`Zoom: ${Math.round(zoom * 100)}%`}>
            <img
              src={imageSrc}
              alt={imageAlt}
              className="modal-image modal-image-sharp"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
