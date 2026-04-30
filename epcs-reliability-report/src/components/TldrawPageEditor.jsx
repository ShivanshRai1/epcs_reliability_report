import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { getTemplateBadge } from '../utils/templateInfo.jsx';

const TldrawPageEditor = ({ page, onChange }) => {
  const [title, setTitle] = useState(page.title || '');
  const editorRef = useRef(null);
  const saveTimerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const titleRef = useRef(title);
  const pageRef = useRef(page);
  const lastSnapshotHashRef = useRef('');

  useEffect(() => {
    setTitle(page.title || '');
  }, [page.id]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onChangeRef.current({ ...pageRef.current, title: newTitle });
  };

  const persistSnapshot = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      const snapshot = editor.store.getSnapshot();
      const snapshotHash = JSON.stringify(snapshot);
      if (snapshotHash === lastSnapshotHashRef.current) return;
      lastSnapshotHashRef.current = snapshotHash;

      onChangeRef.current({
        ...pageRef.current,
        title: titleRef.current,
        tldrawSnapshot: snapshot
      });
    } catch (e) {
      console.warn('TldrawPageEditor: could not save snapshot', e);
    }
  }, []);

  const handleMount = useCallback((editor) => {
    editorRef.current = editor;

    // Load saved snapshot if present
    if (pageRef.current?.tldrawSnapshot) {
      try {
        const snapshot = typeof pageRef.current.tldrawSnapshot === 'string'
          ? JSON.parse(pageRef.current.tldrawSnapshot)
          : pageRef.current.tldrawSnapshot;
        editor.store.loadSnapshot(snapshot);
      } catch (e) {
        console.warn('TldrawPageEditor: could not load snapshot', e);
      }
    }

    // Persist less often to prevent heavy parent rerenders while users draw.
    const unsub = editor.store.listen(() => {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        persistSnapshot();
      }, 8000);
    }, { scope: 'document', source: 'user' });

    return () => {
      persistSnapshot();
      unsub();
      clearTimeout(saveTimerRef.current);
    };
  }, [page.id, persistSnapshot]);

  return (
    <div className="managed-content-editor" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
        {getTemplateBadge(page, true)}
        <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
          Tldraw Canvas Editor — drag, resize, draw, add text, shapes and images freely.
        </p>
      </div>

      <div style={{ marginBottom: '4px' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px', color: '#1f2937' }}>
          Page Title
        </label>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Enter page title"
          className="title-input"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #b9c7da',
            borderRadius: '6px',
            fontSize: '1rem',
          }}
        />
      </div>

      {/* Tldraw canvas */}
      <div style={{ position: 'relative', width: '100%', height: '650px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #d1d5db' }}>
        <Tldraw
          onMount={handleMount}
          autoFocus={false}
        />
      </div>
    </div>
  );
};

export default TldrawPageEditor;
