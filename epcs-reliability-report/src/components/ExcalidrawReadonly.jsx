import React, { useMemo } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

const ExcalidrawReadonly = ({ scene }) => {
  const initialData = useMemo(() => {
    try {
      const parsed = scene ? JSON.parse(scene) : null;
      return parsed || { elements: [], appState: { viewBackgroundColor: '#ffffff' } };
    } catch {
      return { elements: [], appState: { viewBackgroundColor: '#ffffff' } };
    }
  }, [scene]);

  return (
    <div style={{ height: '580px', border: '1px solid #b9c7da', borderRadius: '6px', overflow: 'hidden' }}>
      <Excalidraw
        initialData={initialData}
        viewModeEnabled={true}
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
  );
};

export default ExcalidrawReadonly;
