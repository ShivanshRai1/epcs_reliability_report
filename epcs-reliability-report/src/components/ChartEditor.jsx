import React, { useEffect, useRef, useState } from 'react';
import { getTemplateBadge } from '../utils/templateInfo.jsx';
import {
  DEFAULT_CHART_CONFIG,
  SAMPLE_PRESETS,
  normalizeChartConfig,
} from '../utils/chartData';
import { ReportChart } from './Chart';
import './ChartEditor.css';

const ChartEditor = ({ pageData, onUpdate }) => {
  const [title, setTitle] = useState(pageData?.title || '');
  const [titleColor, setTitleColor] = useState(pageData?.titleColor || '#0052a3');
  const [config, setConfig] = useState(() => normalizeChartConfig(pageData));
  const saveTimerRef = useRef(null);

  useEffect(() => {
    setTitle(pageData?.title || '');
    setTitleColor(pageData?.titleColor || '#0052a3');
    setConfig(normalizeChartConfig(pageData));
  }, [pageData?.id]);

  const scheduleSave = (nextConfig, nextTitle = title, nextTitleColor = titleColor) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onUpdate({
        ...pageData,
        title: nextTitle,
        titleColor: nextTitleColor,
        chartConfig: nextConfig,
      });
    }, 500);
  };

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  const updateConfig = (patch) => {
    const next = { ...config, ...patch };
    setConfig(next);
    scheduleSave(next);
  };

  const updateHeader = (index, value) => {
    const headers = [...config.headers];
    headers[index] = value;
    updateConfig({ headers });
  };

  const updateCell = (rowIndex, colIndex, value) => {
    const rows = config.rows.map((row, ri) => {
      if (ri !== rowIndex) return [...row];
      const next = [...row];
      next[colIndex] = value;
      return next;
    });
    updateConfig({ rows });
  };

  const addColumn = () => {
    const label = `Series ${config.headers.length}`;
    updateConfig({
      headers: [...config.headers, label],
      rows: config.rows.map((row) => [...row, '']),
    });
  };

  const removeColumn = (colIndex) => {
    if (config.headers.length <= 1) return;
    const headers = config.headers.filter((_, i) => i !== colIndex);
    const rows = config.rows.map((row) => row.filter((_, i) => i !== colIndex));
    let xColumnIndex = config.xColumnIndex;
    if (xColumnIndex >= colIndex && xColumnIndex > 0) xColumnIndex -= 1;
    if (xColumnIndex >= headers.length) xColumnIndex = 0;
    const yColumnIndices = config.yColumnIndices
      .filter((i) => i !== colIndex)
      .map((i) => (i > colIndex ? i - 1 : i))
      .filter((i) => i >= 0 && i < headers.length);
    updateConfig({
      headers,
      rows,
      xColumnIndex,
      yColumnIndices: yColumnIndices.length ? yColumnIndices : [headers.length > 1 ? 1 : 0],
    });
  };

  const addRow = () => {
    const empty = config.headers.map(() => '');
    updateConfig({ rows: [...config.rows, empty] });
  };

  const removeRow = (rowIndex) => {
    if (config.rows.length <= 1) return;
    updateConfig({ rows: config.rows.filter((_, i) => i !== rowIndex) });
  };

  const toggleYColumn = (colIndex) => {
    if (colIndex === config.xColumnIndex) return;
    const has = config.yColumnIndices.includes(colIndex);
    let yColumnIndices;
    if (config.chartType === 'pie') {
      yColumnIndices = [colIndex];
    } else if (has) {
      yColumnIndices = config.yColumnIndices.filter((i) => i !== colIndex);
      if (!yColumnIndices.length) yColumnIndices = [colIndex];
    } else {
      yColumnIndices = [...config.yColumnIndices, colIndex].sort((a, b) => a - b);
    }
    updateConfig({ yColumnIndices });
  };

  const applyPreset = (preset) => {
    const next = { ...DEFAULT_CHART_CONFIG, ...preset.config };
    setConfig(next);
    scheduleSave(next);
  };

  const previewPage = { ...pageData, chartConfig: config };

  return (
    <div className="chart-editor">
      <div style={{ paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
        {getTemplateBadge({ ...pageData, pageTemplate: 'chart-editor' }, true)}
        <p className="chart-editor-intro">
          Enter labels and numbers in the table, pick a chart type, and preview updates live.
        </p>
      </div>

      <div>
        <h3 style={{ marginBottom: '6px', fontSize: '0.9rem' }}>Page Title</h3>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            const val = e.target.value;
            setTitle(val);
            scheduleSave(config, val, titleColor);
          }}
          placeholder="Enter page title"
          className="title-input"
          style={{ width: '100%', padding: '9px 12px', border: '1px solid #b9c7da', borderRadius: '6px', fontSize: '1rem', marginBottom: '8px' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#555' }}>
          Title banner color:
          <input
            type="color"
            value={titleColor}
            onChange={(e) => {
              const val = e.target.value;
              setTitleColor(val);
              scheduleSave(config, title, val);
            }}
            style={{ width: '36px', height: '28px', padding: '2px', border: '1px solid #b9c7da', borderRadius: '4px', cursor: 'pointer' }}
          />
        </label>
      </div>

      <div className="chart-editor-toolbar">
        <label>
          Chart title
          <input
            type="text"
            value={config.chartTitle}
            onChange={(e) => updateConfig({ chartTitle: e.target.value })}
            placeholder="e.g. Switching life test"
          />
        </label>
        <label>
          Chart type
          <select
            value={config.chartType}
            onChange={(e) => {
              const chartType = e.target.value;
              const patch = { chartType };
              if (chartType === 'pie' && config.yColumnIndices.length) {
                patch.yColumnIndices = [config.yColumnIndices[0]];
              }
              updateConfig(patch);
            }}
          >
            <option value="line">Line (trends)</option>
            <option value="bar">Bar (compare)</option>
            <option value="pie">Pie (shares)</option>
          </select>
        </label>
        <label>
          X axis (labels)
          <select
            value={config.xColumnIndex}
            onChange={(e) => {
              const xColumnIndex = Number(e.target.value);
              const yColumnIndices = config.yColumnIndices.filter((i) => i !== xColumnIndex);
              updateConfig({
                xColumnIndex,
                yColumnIndices: yColumnIndices.length ? yColumnIndices : [xColumnIndex === 0 ? 1 : 0].filter((i) => i < config.headers.length),
              });
            }}
          >
            {config.headers.map((h, i) => (
              <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <div style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '6px' }}>
          {config.chartType === 'pie' ? 'Value column' : 'Y axis (numeric columns)'}
        </div>
        <div className="chart-y-columns">
          {config.headers.map((h, i) => (
            <label key={i}>
              <input
                type={config.chartType === 'pie' ? 'radio' : 'checkbox'}
                name="y-column"
                checked={config.yColumnIndices.includes(i)}
                disabled={i === config.xColumnIndex}
                onChange={() => toggleYColumn(i)}
              />
              {h || `Column ${i + 1}`}
            </label>
          ))}
        </div>
      </div>

      <div className="chart-editor-presets">
        {SAMPLE_PRESETS.map((preset) => (
          <button key={preset.label} type="button" onClick={() => applyPreset(preset)}>
            {preset.label}
          </button>
        ))}
      </div>

      <div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>Data table</div>
        <div className="chart-data-grid-wrap">
          <table className="chart-data-grid">
            <thead>
              <tr>
                {config.headers.map((header, colIndex) => (
                  <th key={colIndex}>
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => updateHeader(colIndex, e.target.value)}
                      placeholder={`Column ${colIndex + 1}`}
                    />
                  </th>
                ))}
                <th style={{ width: 48, minWidth: 48 }} />
              </tr>
            </thead>
            <tbody>
              {config.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {config.headers.map((_, colIndex) => (
                    <td key={colIndex}>
                      <input
                        type="text"
                        value={row[colIndex] ?? ''}
                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      type="button"
                      className="danger"
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem' }}
                      onClick={() => removeRow(rowIndex)}
                      title="Remove row"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="chart-grid-actions" style={{ marginTop: '8px' }}>
          <button type="button" onClick={addRow}>+ Add row</button>
          <button type="button" onClick={addColumn}>+ Add column</button>
          {config.headers.length > 1 && (
            <button type="button" className="danger" onClick={() => removeColumn(config.headers.length - 1)}>
              Remove last column
            </button>
          )}
        </div>
      </div>

      <div className="chart-preview-box">
        <h4>Live preview</h4>
        <ReportChart page={previewPage} height={280} />
      </div>
    </div>
  );
};

export default ChartEditor;
