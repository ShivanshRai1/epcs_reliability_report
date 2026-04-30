import React, { useEffect, useRef, useState } from 'react';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { getTemplateBadge } from '../utils/templateInfo.jsx';

const STARTER_HTML = `
<div class="report-layout">
  <div class="top-band">PAGE TITLE</div>
  <div class="sub-band">
    <div class="sub-band-left">LEFT LABEL</div>
    <div class="sub-band-right">RIGHT LABEL</div>
  </div>
  <div class="content-row">
    <div class="left-panel">
      <p>Write your summary text here.</p>
    </div>
    <div class="right-panel">
      <img src="" alt="Chart or image" />
    </div>
  </div>
</div>
`;

const STARTER_CSS = `
.report-layout {
  width: 100%;
  background: #ffffff;
}

.top-band {
  background: #0b5aa9;
  color: #111827;
  text-align: center;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 12px 14px;
}

.sub-band {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.sub-band-left,
.sub-band-right {
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
}

.sub-band-left {
  background: #ececec;
}

.sub-band-right {
  background: #efb07f;
}

.content-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  min-height: 360px;
}

.left-panel {
  padding: 14px;
  border-right: 1px solid #e5e7eb;
}

.right-panel {
  padding: 14px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.right-panel img {
  max-width: 100%;
  height: auto;
}
`;

const GrapesJSPageEditor = ({ page, onChange }) => {
  const containerRef = useRef(null);
  const blockPanelRef = useRef(null);
  const editorRef = useRef(null);
  const [title, setTitle] = useState(page.title || '');
  const pageIdRef = useRef(page.id);
  const onChangeRef = useRef(onChange);
  const titleRef = useRef(title);

  // Keep refs current without triggering re-mount
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { titleRef.current = title; }, [title]);

  useEffect(() => {
    if (!containerRef.current || !blockPanelRef.current) return;

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
      panels: { defaults: [] },
      components: page.grapesjsHtml || STARTER_HTML,
      style: page.grapesjsCss || STARTER_CSS,
      blockManager: {
        appendTo: blockPanelRef.current,
        blocks: [
          { id: 'text', label: 'Text paragraph', content: '<p>Write something here...</p>', category: 'Basic' },
          { id: 'heading', label: 'Section heading', content: '<h3>Section heading</h3>', category: 'Basic' },
          { id: 'image', label: 'Image', content: '<img src="" alt="" style="max-width:100%;height:auto" />', category: 'Basic' },
          { id: 'columns-2', label: '2 columns', content: '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div><p>Left content</p></div><div><p>Right content</p></div></div>', category: 'Layout' },
          { id: 'title-band', label: 'Blue title band', content: '<div class="top-band">SECTION TITLE</div>', category: 'Report' },
          { id: 'label-row', label: 'Label row (left/right)', content: '<div class="sub-band"><div class="sub-band-left">LEFT LABEL</div><div class="sub-band-right">RIGHT LABEL</div></div>', category: 'Report' },
          { id: 'text-image-row', label: 'Text + image row', content: '<div class="content-row"><div class="left-panel"><p>Left text</p></div><div class="right-panel"><img src="" alt="Chart or image" /></div></div>', category: 'Report' },
          { id: 'divider', label: 'Divider', content: '<hr style="border:1px solid #d1d5db;margin:16px 0" />', category: 'Basic' },
        ]
      },
      selectorManager: {
        componentFirst: true,
      },
      styleManager: {
        sectors: [
          {
            name: 'Layout',
            open: true,
            properties: ['display', 'position', 'top', 'right', 'left', 'bottom', 'width', 'height', 'max-width', 'margin', 'padding']
          },
          {
            name: 'Typography',
            open: true,
            properties: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'line-height', 'text-align', 'color']
          },
          {
            name: 'Decorations',
            open: false,
            properties: ['background-color', 'border', 'border-radius', 'box-shadow', 'opacity']
          }
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

    editor.on('update', persistChange);

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

  const loadStarterLayout = () => {
    if (!editorRef.current) return;
    editorRef.current.setComponents(STARTER_HTML);
    editorRef.current.setStyle(STARTER_CSS);
  };

  const addSection = (html) => {
    if (!editorRef.current) return;
    editorRef.current.addComponents(html);
  };

  return (
    <div className="managed-content-editor" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
        {getTemplateBadge(page, true)}
        <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
          No-code mode: drag ready blocks from the left panel, then edit text/images directly on the canvas.
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

      <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
        <div style={{ width: '260px', minWidth: '260px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#f8fafc', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1f2937' }}>Quick Tools</div>
          <button type="button" onClick={loadStarterLayout} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #b9c7da', background: '#ffffff', cursor: 'pointer', textAlign: 'left' }}>
            Load starter report layout
          </button>
          <button type="button" onClick={() => addSection('<div class="top-band">SECTION TITLE</div>')} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #b9c7da', background: '#ffffff', cursor: 'pointer', textAlign: 'left' }}>
            Add blue title band
          </button>
          <button type="button" onClick={() => addSection('<div class="content-row"><div class="left-panel"><p>Left text</p></div><div class="right-panel"><img src="" alt="Chart or image" /></div></div>')} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #b9c7da', background: '#ffffff', cursor: 'pointer', textAlign: 'left' }}>
            Add text + image row
          </button>
          <div style={{ marginTop: '6px', fontWeight: 700, fontSize: '0.85rem', color: '#334155' }}>Blocks</div>
          <div ref={blockPanelRef} style={{ overflow: 'auto', maxHeight: '420px' }} />
        </div>

        {/* GrapesJS canvas mounts here */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div ref={containerRef} style={{ border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }} />
        </div>
      </div>
    </div>
  );
};

export default GrapesJSPageEditor;
