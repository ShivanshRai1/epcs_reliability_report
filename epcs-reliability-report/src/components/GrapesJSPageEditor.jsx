import React, { useEffect, useRef, useState } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { getTemplateBadge } from '../utils/templateInfo.jsx';

const GrapesJSPageEditor = ({ page, onChange }) => {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const [title, setTitle] = useState(page.title || '');
  const pageIdRef = useRef(page.id);
  const onChangeRef = useRef(onChange);
  const titleRef = useRef(title);

  // Keep refs current without triggering re-mount
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { titleRef.current = title; }, [title]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy previous instance on re-mount (page id change)
    if (editorRef.current) {
      editorRef.current.destroy();
      editorRef.current = null;
    }

    pageIdRef.current = page.id;

    const editor = grapesjs.init({
      container: containerRef.current,
      fromElement: false,
      height: '620px',
      width: '100%',
      storageManager: false,
      components: page.grapesjsHtml || '<p>Start building your page here.</p>',
      style: page.grapesjsCss || '',
      blockManager: {
        appendTo: '#gjs-blocks-panel',
        blocks: [
          { id: 'text', label: 'Text', content: '<p>Write something here...</p>', category: 'Basic', attributes: { class: 'fa fa-text-height' } },
          { id: 'image', label: 'Image', content: '<img src="" style="max-width:100%" />', category: 'Basic' },
          { id: 'heading', label: 'Heading', content: '<h2>Heading</h2>', category: 'Basic' },
          { id: 'columns-2', label: '2 Columns', content: '<div style="display:flex;gap:12px"><div style="flex:1">Column 1</div><div style="flex:1">Column 2</div></div>', category: 'Layout' },
          { id: 'divider', label: 'Divider', content: '<hr style="border:1px solid #d1d5db;margin:16px 0" />', category: 'Basic' },
        ]
      },
      plugins: [],
      canvas: {
        styles: [],
        scripts: []
      }
    });

    editorRef.current = editor;

    // Persist content on change
    const persistChange = () => {
      const html = editor.getHtml();
      const css = editor.getCss();
      onChangeRef.current({
        ...page,
        title: titleRef.current,
        grapesjsHtml: html,
        grapesjsCss: css
      });
    };

    editor.on('component:add', persistChange);
    editor.on('component:remove', persistChange);
    editor.on('component:update', persistChange);
    editor.on('style:change', persistChange);

    return () => {
      try { editor.destroy(); } catch (_) {}
      editorRef.current = null;
    };
  }, [page.id]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onChange({ ...page, title: newTitle });
  };

  return (
    <div className="managed-content-editor" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
        {getTemplateBadge(page, true)}
        <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
          GrapesJS Page Builder — drag blocks onto the canvas and visually compose your page layout.
        </p>
      </div>

      <div>
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

      {/* GrapesJS canvas mounts here */}
      <div ref={containerRef} style={{ border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }} />
    </div>
  );
};

export default GrapesJSPageEditor;
