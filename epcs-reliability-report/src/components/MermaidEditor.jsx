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

const diagramTemplates = [
  {
    label: 'Flowchart',
    code: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Approved]
    B -->|No| D[Rejected]`,
  },
  {
    label: 'Process',
    code: `flowchart LR
    Start --> Step1[Step 1]
    Step1 --> Step2[Step 2]
    Step2 --> End[End]`,
  },
  {
    label: 'Sequence',
    code: `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>Alice: I am good thanks!`,
  },
  {
    label: 'Gantt',
    code: `gantt
    title Project timeline
    dateFormat  YYYY-MM-DD
    section Design
    Wireframes       :done,    des1, 2026-05-01, 5d
    section Development
    Build frontend   :active,  dev1, 2026-05-06, 10d`,
  },
];

const quickSnippets = [
  {
    label: 'Add node',
    snippet: 'E[New node]',
  },
  {
    label: 'Add arrow',
    snippet: 'A --> E',
  },
  {
    label: 'Add note',
    snippet: '%% Add note here',
  },
];

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

  const applyTemplate = (code) => {
    setDiagramCode(code);
  };

  const appendSnippet = (snippet) => {
    setDiagramCode((prev) => `${prev.trim()}\n${snippet}`);
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

      <div style={{ display: 'grid', gap: '16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {diagramTemplates.map((template) => (
            <button
              key={template.label}
              type="button"
              onClick={() => applyTemplate(template.code)}
              style={{
                padding: '8px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                background: '#ffffff',
                color: '#1f2937',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {template.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.95rem', color: '#333' }}>
                  Diagram Code
                </label>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  Pick a starter template, then edit the text here.
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {quickSnippets.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => appendSnippet(item.snippet)}
                    style={{
                      padding: '6px 10px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      color: '#1f2937',
                      cursor: 'pointer',
                      fontSize: '0.82rem'
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              className="form-control"
              rows="22"
              value={diagramCode}
              onChange={(e) => setDiagramCode(e.target.value)}
              style={{
                fontFamily: 'monospace',
                fontSize: '13px',
                border: '1px solid #b9c7da',
                borderRadius: '6px',
                padding: '10px',
                minHeight: '560px'
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.95rem', color: '#333' }}>
                Preview
              </label>
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Live rendering from your code</span>
            </div>
            <div style={{
              border: '1px solid #b9c7da',
              borderRadius: '6px',
              padding: '12px',
              background: '#f9fafb',
              minHeight: '320px',
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
            <div style={{ marginTop: '16px', padding: '14px', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#ffffff' }}>
              <h4 style={{ marginBottom: '10px', fontSize: '0.95rem' }}>Quick help</h4>
              <p style={{ margin: '0 0 10px', color: '#475569', fontSize: '0.9rem' }}>
                Use the editor on the left to update diagram syntax. Your diagram preview updates automatically.
              </p>
              <div style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.6 }}>
                <div><strong>Common syntax:</strong></div>
                <div style={{ marginTop: '8px' }}><code>graph TD</code> - left-to-right flowchart</div>
                <div><code>flowchart LR</code> - left-to-right flowchart</div>
                <div><code>sequenceDiagram</code> - sequence diagram</div>
                <div><code>gantt</code> - timeline chart</div>
                <div style={{ marginTop: '8px' }}><code>A[Start] --> B{Decision}</code></div>
                <div><code>Note right of A: An explanation</code></div>
                <div><code>%% comment text</code> - add a comment</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MermaidEditor;