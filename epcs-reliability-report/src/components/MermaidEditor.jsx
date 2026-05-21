import React, { useEffect, useState } from "react";
import mermaid from "mermaid";
import { getTemplateBadge } from '../utils/templateInfo.jsx';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
  theme: "default",
});

const defaultDiagram = `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Approved]
    B -->|No| D[Rejected]`;

const MermaidEditor = ({ pageData, onUpdate }) => {
  const [title, setTitle] = useState(pageData?.title || '');
  const [titleColor, setTitleColor] = useState(pageData?.titleColor || '#0052a3');
  const [diagramCode, setDiagramCode] = useState(pageData?.mermaidDiagram || defaultDiagram);
  const [svgContent, setSvgContent] = useState(pageData?.mermaidSvg || '');
  const [error, setError] = useState('');
  const saveTimerRef = React.useRef(null);

  // Sync pageData on mount/change
  useEffect(() => {
    setTitle(pageData?.title || '');
    setTitleColor(pageData?.titleColor || '#0052a3');
    setDiagramCode(pageData?.mermaidDiagram || defaultDiagram);
    setSvgContent(pageData?.mermaidSvg || '');
  }, [pageData?.id]);

  // Render diagram on code change
  useEffect(() => {
    renderDiagram(diagramCode);
  }, [diagramCode]);

  const renderDiagram = async (code) => {
    try {
      setError('');
      const uniqueId = `mermaid-${Date.now()}`;
      const { svg } = await mermaid.render(uniqueId, code);
      setSvgContent(svg);

      // Schedule save with current title/color
      scheduleSave(code, svg);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const scheduleSave = (code, svg) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onUpdate({
        ...pageData,
        title,
        titleColor,
        mermaidDiagram: code,
        mermaidSvg: svg,
      });
    }, 600);
  };

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onUpdate({
        ...pageData,
        title: val,
        titleColor,
        mermaidDiagram: diagramCode,
        mermaidSvg: svgContent,
      });
    }, 600);
  };

  const handleTitleColorChange = (e) => {
    const val = e.target.value;
    setTitleColor(val);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onUpdate({
        ...pageData,
        title,
        titleColor: val,
        mermaidDiagram: diagramCode,
        mermaidSvg: svgContent,
      });
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
        {getTemplateBadge(pageData, true)}
        <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#6b7280' }}>
          Create flowcharts, diagrams, and visualizations using Mermaid syntax.
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

      <h2 style={{ marginBottom: '12px', fontSize: '1rem' }}>Mermaid Diagram Editor</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* LEFT SIDE - CODE EDITOR */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem', color: '#333' }}>
            Diagram Code
          </label>
          <textarea
            className="form-control"
            rows="20"
            value={diagramCode}
            onChange={(e) => setDiagramCode(e.target.value)}
            style={{
              fontFamily: "monospace",
              fontSize: "13px",
              border: '1px solid #b9c7da',
              borderRadius: '6px',
              padding: '10px',
            }}
          />
        </div>

        {/* RIGHT SIDE - PREVIEW */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem', color: '#333' }}>
            Preview
          </label>
          <div style={{
            border: '1px solid #b9c7da',
            borderRadius: '6px',
            padding: '12px',
            background: '#f9fafb',
            minHeight: '400px',
            overflow: 'auto',
          }}>
            {error ? (
              <div style={{ color: '#dc2626', fontSize: '0.9rem', padding: '10px', background: '#fee2e2', borderRadius: '4px' }}>
                <strong>Error:</strong> {error}
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: svgContent }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MermaidEditor;