import React, { useEffect, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "loose",
  theme: "default",
});

const defaultDiagram = `
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Approved]
    B -->|No| D[Rejected]
`;

const MermaidEditor = () => {
  const [diagramCode, setDiagramCode] = useState(defaultDiagram);
  const [svgContent, setSvgContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    renderDiagram(diagramCode);
  }, [diagramCode]);

  const renderDiagram = async (code) => {
    try {
      setError("");

      const uniqueId = `mermaid-${Date.now()}`;

      const { svg } = await mermaid.render(uniqueId, code);

      setSvgContent(svg);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className="container-fluid p-3">
      <h2 className="mb-3">Mermaid Diagram Editor</h2>

      <div className="row">
        
        {/* LEFT SIDE - CODE EDITOR */}
        <div className="col-md-6">
          <textarea
            className="form-control"
            rows="22"
            value={diagramCode}
            onChange={(e) => setDiagramCode(e.target.value)}
            style={{
              fontFamily: "monospace",
              fontSize: "14px",
            }}
          />
        </div>

        {/* RIGHT SIDE - PREVIEW */}
        <div className="col-md-6">
          <div className="card p-3">
            <h5>Preview</h5>

            {error ? (
              <div className="alert alert-danger">
                {error}
              </div>
            ) : (
              <div
                dangerouslySetInnerHTML={{
                  __html: svgContent,
                }}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default MermaidEditor;