import React, { useState } from 'react';
import './AdvancedTableEditor.css';

const AdvancedTableEditor = ({ page, onChange }) => {
  // Handle both old (.data) and new (.rows) table structures for backward compatibility
  const getInitialTableData = () => {
    if (!page.table) return { rows: [], columns: [] };
    
    // If old structure with 'data' property, convert to 'rows'
    const table = page.table.data && !page.table.rows 
      ? { ...page.table, rows: page.table.data }
      : page.table;
    
    // Ensure both rows and columns exist as arrays
    return {
      rows: table.rows || [],
      columns: table.columns || []
    };
  };
  
  const [tableData, setTableData] = useState(getInitialTableData());
  const [captionTop, setCaptionTop] = useState(page.captionTop || '');
  const [captionBottom, setCaptionBottom] = useState(page.captionBottom || '');
  const [selectedCell, setSelectedCell] = useState(null);

  const handleAddRow = (position = 'bottom') => {
    const newRow = Array(tableData.columns.length || 0).fill('');
    const newTable = { ...tableData };
    
    if (position === 'top') {
      newTable.rows = [newRow, ...newTable.rows];
    } else {
      newTable.rows = [...newTable.rows, newRow];
    }
    
    setTableData(newTable);
    updatePage(newTable);
  };

  const handleDeleteRow = (rowIdx) => {
    const newTable = { ...tableData };
    newTable.rows = newTable.rows.filter((_, i) => i !== rowIdx);
    setTableData(newTable);
    updatePage(newTable);
  };

  const handleAddColumn = (position = 'right') => {
    const newTable = { ...tableData };
    newTable.columns = (newTable.columns || []).map((col, i) => col);
    
    if (position === 'left') {
      newTable.columns = [{ header: '' }, ...newTable.columns];
      newTable.rows = newTable.rows.map(row => ['', ...row]);
    } else {
      newTable.columns = [...newTable.columns, { header: '' }];
      newTable.rows = newTable.rows.map(row => [...row, '']);
    }
    
    setTableData(newTable);
    updatePage(newTable);
  };

  const handleDeleteColumn = (colIdx) => {
    const newTable = { ...tableData };
    newTable.columns = newTable.columns.filter((_, i) => i !== colIdx);
    newTable.rows = newTable.rows.map(row => row.filter((_, i) => i !== colIdx));
    setTableData(newTable);
    updatePage(newTable);
  };

  const handleCellChange = (rowIdx, colIdx, value) => {
    const newTable = { ...tableData };
    if (newTable.rows[rowIdx]) {
      newTable.rows[rowIdx][colIdx] = value;
      setTableData(newTable);
      updatePage(newTable);
    }
  };

  const handleColumnHeaderChange = (colIdx, value) => {
    const newTable = { ...tableData };
    if (!newTable.columns) newTable.columns = [];
    if (!newTable.columns[colIdx]) newTable.columns[colIdx] = {};
    newTable.columns[colIdx].header = value;
    setTableData(newTable);
    updatePage(newTable);
  };

  const handleCaptionChange = (type, value) => {
    if (type === 'top') {
      setCaptionTop(value);
    } else {
      setCaptionBottom(value);
    }
    updatePage(tableData, type === 'top' ? value : captionTop, type === 'bottom' ? value : captionBottom);
  };

  const updatePage = (table, top = captionTop, bottom = captionBottom) => {
    onChange({
      ...page,
      table,
      captionTop: top,
      captionBottom: bottom
    });
  };

  return (
    <div className="advanced-table-editor">
      {/* Caption Top */}
      <div className="caption-section">
        <label htmlFor="caption-top">Text Above Table:</label>
        <input
          id="caption-top"
          type="text"
          value={captionTop}
          onChange={(e) => handleCaptionChange('top', e.target.value)}
          placeholder="Optional text or title above table"
          className="caption-input"
        />
      </div>

      {/* Table Controls */}
      <div className="table-controls">
        <div className="control-group">
          <button onClick={() => handleAddRow('top')} className="control-btn" title="Add row at top">
            ➕ Row Top
          </button>
          <button onClick={() => handleAddRow('bottom')} className="control-btn" title="Add row at bottom">
            ➕ Row Bottom
          </button>
        </div>
        <div className="control-group">
          <button onClick={() => handleAddColumn('left')} className="control-btn" title="Add column at left">
            ➕ Col Left
          </button>
          <button onClick={() => handleAddColumn('right')} className="control-btn" title="Add column at right">
            ➕ Col Right
          </button>
        </div>
      </div>

      {/* Table Editor */}
      <div className="table-wrapper">
        <table className="editable-table">
          <thead>
            <tr>
              {tableData.columns && tableData.columns.map((col, colIdx) => (
                <th key={colIdx}>
                  <div className="header-cell">
                    <input
                      type="text"
                      value={col.header || ''}
                      onChange={(e) => handleColumnHeaderChange(colIdx, e.target.value)}
                      placeholder={`Header ${colIdx + 1}`}
                      className="header-input"
                    />
                    <button
                      className="delete-col-btn"
                      onClick={() => handleDeleteColumn(colIdx)}
                      title="Delete column"
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows && tableData.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className={selectedCell?.row === rowIdx ? 'selected-row' : ''}>
                {row.map((cell, colIdx) => (
                  <td key={`${rowIdx}-${colIdx}`}>
                    <input
                      type="text"
                      value={cell || ''}
                      onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                      onFocus={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                      className="cell-input"
                    />
                  </td>
                ))}
                <td className="row-action">
                  <button
                    className="delete-row-btn"
                    onClick={() => handleDeleteRow(rowIdx)}
                    title="Delete row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Caption Bottom */}
      <div className="caption-section">
        <label htmlFor="caption-bottom">Text Below Table:</label>
        <input
          id="caption-bottom"
          type="text"
          value={captionBottom}
          onChange={(e) => handleCaptionChange('bottom', e.target.value)}
          placeholder="Optional text or notes below table"
          className="caption-input"
        />
      </div>

      {/* Info */}
      <div className="editor-info">
        <p>📊 Table: {tableData.rows.length} rows × {(tableData.columns || []).length} columns</p>
        <p className="note">💡 Tip: Use the controls to add/remove rows and columns. Click cells to edit.</p>
      </div>
    </div>
  );
};

export default AdvancedTableEditor;
