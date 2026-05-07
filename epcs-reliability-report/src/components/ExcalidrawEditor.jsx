import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { getTemplateBadge } from '../utils/templateInfo.jsx';

const ExcalidrawEditor = ({ page, onChange }) => {
  const [title, setTitle] = useState(page.title || '');
  const [titleColor, setTitleColor] = useState(page.titleColor || '#0052a3');
  const excalidrawApiRef = useRef(null);
  const saveTimerRef = useRef(null);
  const initialDataRef = useRef(null);

  const getCurrentSceneFromApi = useCallback(() => {
    const api = excalidrawApiRef.current;
    if (!api) return null;

    return {
      elements: api.getSceneElements(),
      appState: {
        viewBackgroundColor: api.getAppState?.()?.viewBackgroundColor || '#ffffff',
      },
      files: api.getFiles?.() || {},
    };
  }, []);

  // Parse saved scene or start empty
  const getInitialData = () => {
    if (initialDataRef.current) return initialDataRef.current;
    try {
      const parsed = page.excalidrawScene ? JSON.parse(page.excalidrawScene) : null;
      initialDataRef.current = parsed || { elements: [], appState: { viewBackgroundColor: '#ffffff' } };
    } catch {
      initialDataRef.current = { elements: [], appState: { viewBackgroundColor: '#ffffff' } };
    }
    return initialDataRef.current;
  };

  // Debounced save to avoid flooding onChange on every pointer move
  const scheduleChange = useCallback((elements, appState, files) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const scene = JSON.stringify({
        elements,
        appState: { viewBackgroundColor: appState?.viewBackgroundColor || '#ffffff' },
        files: files || {},
      });
      onChange({ ...page, title, titleColor, excalidrawScene: scene });
    }, 600);
  }, [page, title, titleColor, onChange]);

  useEffect(() => {
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, []);

  // Sync title/color changes
  useEffect(() => {
    setTitle(page.title || '');
    setTitleColor(page.titleColor || '#0052a3');
  }, [page.id]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    const currentScene = getCurrentSceneFromApi();
    const scene = currentScene ? JSON.stringify(currentScene) : (page.excalidrawScene || '');
    onChange({ ...page, title: val, titleColor, excalidrawScene: scene });
  };

  const handleTitleColorChange = (e) => {
    const val = e.target.value;
    setTitleColor(val);
    const currentScene = getCurrentSceneFromApi();
    const scene = currentScene ? JSON.stringify(currentScene) : (page.excalidrawScene || '');
    onChange({ ...page, title, titleColor: val, excalidrawScene: scene });
  };

  return (
    <div className="managed-content-editor" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
        {getTemplateBadge(page, true)}
        <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
          Free-form canvas — draw shapes, text, arrows and diagrams like a whiteboard or slide.
        </p>
      </div>

      {/* Title */}
      <div>
        <h3 style={{ marginBottom: '6px', fontSize: '0.9rem' }}>Page Title</h3>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Enter page title"
          className="title-input"
          style={{ width: '100%', padding: '9px 12px', border: '1px solid #b9c7da', borderRadius: '6px', fontSize: '1rem', marginBottom: '8px' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#555' }}>
          Title banner color:
          <input type="color" value={titleColor} onChange={handleTitleColorChange}
            style={{ width: '36px', height: '28px', padding: '2px', border: '1px solid #b9c7da', borderRadius: '4px', cursor: 'pointer' }} />
        </label>
      </div>

      {/* Canvas */}
      <div className="excalidraw-container" style={{ height: '580px', border: '1px solid #b9c7da', borderRadius: '6px', overflow: 'hidden' }}>
        <Excalidraw
          initialData={getInitialData()}
          excalidrawAPI={(api) => { excalidrawApiRef.current = api; }}
          onChange={(elements, appState, files) => scheduleChange(elements, appState, files)}
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              loadScene: false,
              export: false,
              saveAsImage: false,
              clearCanvas: false,
              changeViewBackgroundColor: false,
              toggleTheme: false,
            },
          }}
        />
      </div>

    </div>
  );
};

export default ExcalidrawEditor;
