import React, { useRef, useState, useEffect, useCallback } from 'react';

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const getHandleStyle = (name) => {
  const base = {
    position: 'absolute',
    width: '10px',
    height: '10px',
    background: '#2563eb',
    border: '2px solid #fff',
    borderRadius: '2px',
    boxShadow: '0 0 0 1.5px rgba(37,99,235,0.6)',
    zIndex: 20,
  };
  switch (name) {
    case 'nw': return { ...base, top: 3, left: 3, cursor: 'nw-resize' };
    case 'n':  return { ...base, top: 3, left: 'calc(50% - 5px)', cursor: 'ns-resize' };
    case 'ne': return { ...base, top: 3, right: 3, cursor: 'ne-resize' };
    case 'e':  return { ...base, top: 'calc(50% - 5px)', right: 3, cursor: 'ew-resize' };
    case 'se': return { ...base, bottom: 3, right: 3, cursor: 'se-resize' };
    case 's':  return { ...base, bottom: 3, left: 'calc(50% - 5px)', cursor: 'ns-resize' };
    case 'sw': return { ...base, bottom: 3, left: 3, cursor: 'sw-resize' };
    case 'w':  return { ...base, top: 'calc(50% - 5px)', left: 3, cursor: 'ew-resize' };
    default:   return base;
  }
};

const ResizableImage = ({ src, imageWidth, imageHeight, onResize, alt }) => {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [selected, setSelected] = useState(false);
  const [size, setSize] = useState({
    w: Number(imageWidth) > 0 ? Number(imageWidth) : null,
    h: Number(imageHeight) > 0 ? Number(imageHeight) : null,
  });
  const sizeRef = useRef(size);
  sizeRef.current = size;

  // Sync from external prop changes (e.g. px input fields)
  useEffect(() => {
    setSize({
      w: Number(imageWidth) > 0 ? Number(imageWidth) : null,
      h: Number(imageHeight) > 0 ? Number(imageHeight) : null,
    });
  }, [imageWidth, imageHeight]);

  // Deselect on outside click
  useEffect(() => {
    const handleDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSelected(false);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, []);

  const startDrag = useCallback((e, handle) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = sizeRef.current.w || (imgRef.current ? imgRef.current.offsetWidth : 200);
    const startH = sizeRef.current.h || (imgRef.current ? imgRef.current.offsetHeight : 200);

    const onMove = (me) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;

      let newW = startW;
      let newH = startH;

      if (handle.includes('e')) newW = Math.max(40, startW + dx);
      if (handle.includes('w')) newW = Math.max(40, startW - dx);
      if (handle.includes('s')) newH = Math.max(40, startH + dy);
      if (handle.includes('n')) newH = Math.max(40, startH - dy);

      setSize({ w: Math.round(newW), h: Math.round(newH) });
    };

    const onUp = () => {
      if (onResize) {
        onResize({ imageWidth: sizeRef.current.w, imageHeight: sizeRef.current.h });
      }
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [onResize]);

  if (!src) return null;

  const containerStyle = {
    position: 'relative',
    display: 'inline-block',
    outline: selected ? '2px solid #2563eb' : '2px dashed rgba(100,130,200,0.35)',
    outlineOffset: '2px',
    lineHeight: 0,
    cursor: 'default',
    maxWidth: '100%',
  };

  const imgStyle = {
    display: 'block',
    width: size.w ? `${size.w}px` : '100%',
    height: size.h ? `${size.h}px` : 'auto',
    maxWidth: '100%',
    objectFit: 'contain',
    userSelect: 'none',
    pointerEvents: 'none',
    draggable: false,
  };

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      onMouseDown={() => setSelected(true)}
      title="Click then drag handles to resize"
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt || 'Image'}
        style={imgStyle}
        draggable={false}
      />

      {selected && HANDLES.map((h) => (
        <span
          key={h}
          style={getHandleStyle(h)}
          onMouseDown={(e) => startDrag(e, h)}
        />
      ))}

      {selected && (
        <span style={{
          position: 'absolute',
          bottom: '6px',
          right: '6px',
          fontSize: '10px',
          color: '#fff',
          background: 'rgba(37,99,235,0.85)',
          padding: '2px 6px',
          borderRadius: '3px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          lineHeight: 1.5,
        }}>
          {size.w || '—'} × {size.h || '—'} px
        </span>
      )}

      {!selected && (
        <span style={{
          position: 'absolute',
          bottom: '4px',
          right: '6px',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.7)',
          background: 'rgba(0,0,0,0.45)',
          padding: '1px 5px',
          borderRadius: '3px',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          lineHeight: 1.5,
        }}>
          Click to resize
        </span>
      )}
    </div>
  );
};

export default ResizableImage;
