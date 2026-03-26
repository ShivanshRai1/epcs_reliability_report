import React from 'react';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';

const MIN_ZOOM = 1;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.1;

const clampZoom = (value) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

const Modal = ({ isOpen, imageSrc, imageAlt, onClose, children }) => {
  const isImageOnly = !children && Boolean(imageSrc);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStateRef = React.useRef({
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0
  });

  const resetZoom = React.useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const applyZoomDelta = React.useCallback((delta) => {
    setZoom((prev) => {
      const next = clampZoom(Number((prev + delta).toFixed(2)));
      if (next === MIN_ZOOM) {
        setPan({ x: 0, y: 0 });
      }
      return next;
    });
  }, []);

  const handleDragStart = (e) => {
    if (!isImageOnly || zoom <= MIN_ZOOM) return;
    e.preventDefault();
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y
    };
    setIsDragging(true);
  };

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

  React.useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e) => {
      const dx = e.clientX - dragStateRef.current.startX;
      const dy = e.clientY - dragStateRef.current.startY;
      setPan({
        x: dragStateRef.current.originX + dx,
        y: dragStateRef.current.originY + dy
      });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handlePointerUp);

    return () => {
      document.removeEventListener('mousemove', handlePointerMove);
      document.removeEventListener('mouseup', handlePointerUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} onWheel={handleWheel}>
      <div className={`modal-content${isImageOnly ? ' modal-content-image' : ''}`}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        {children ? (
          children
        ) : (
          <div
            className="modal-image-viewport"
            title={`Zoom: ${Math.round(zoom * 100)}%`}
            style={{ cursor: zoom > MIN_ZOOM ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
            onMouseDown={handleDragStart}
          >
            <img
              src={imageSrc}
              alt={imageAlt}
              className="modal-image modal-image-sharp"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
              draggable={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
