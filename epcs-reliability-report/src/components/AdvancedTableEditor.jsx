import React, { useEffect, useState } from 'react';
import './AdvancedTableEditor.css';

const AdvancedTableEditor = ({ page, onChange }) => {
  // Handle both old (.data) and new (.rows) table structures for backward compatibility
  const getInitialTableData = () => {
    if (!page.table) return { rows: [], columns: [] };
    
    // If old structure with 'data' property, convert to 'rows'
    const table = page.table.data && !page.table.rows 
      ? { ...page.table, rows: page.table.data }
      : page.table;
    
    const rawColumns = Array.isArray(table.columns) ? table.columns : [];
    const normalizedColumns = rawColumns.map((col, idx) => {
      if (typeof col === 'string') return col;
      if (col && typeof col === 'object' && col.header) return col.header;
      return `Column ${idx + 1}`;
    });

    const rawRows = Array.isArray(table.rows) ? table.rows : [];
    const normalizedRows = rawRows.map((row) => {
      if (Array.isArray(row)) {
        const rowObj = {};
        normalizedColumns.forEach((columnName, colIdx) => {
          rowObj[columnName] = row[colIdx] ?? '';
        });
        return rowObj;
      }

      if (row && typeof row === 'object') {
        const rowObj = {};
        normalizedColumns.forEach((columnName) => {
          rowObj[columnName] = row[columnName] ?? '';
        });
        return rowObj;
      }

      const emptyRow = {};
      normalizedColumns.forEach((columnName) => {
        emptyRow[columnName] = '';
      });
      return emptyRow;
    });

    // Ensure both rows and columns exist as arrays in normalized shape
    return {
      rows: normalizedRows,
      columns: normalizedColumns
    };
  };
  
  const [tableData, setTableData] = useState(getInitialTableData());
  const [captionTop, setCaptionTop] = useState(page.captionTop || '');
  const [captionBottom, setCaptionBottom] = useState(page.captionBottom || '');
  const [selectedCell, setSelectedCell] = useState(null);

  useEffect(() => {
    setTableData(getInitialTableData());
    setCaptionTop(page.captionTop || '');
    setCaptionBottom(page.captionBottom || '');
    setSelectedCell(null);
  }, [page.id]);

  const handleAddRow = (position = 'bottom') => {
    const newRow = {};
    (tableData.columns || []).forEach((columnName) => {
      newRow[columnName] = '';
    });
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
    newTable.columns = [...(newTable.columns || [])];
    const newColumnName = `Column ${(newTable.columns || []).length + 1}`;
    
    if (position === 'left') {
      newTable.columns = [newColumnName, ...newTable.columns];
      newTable.rows = newTable.rows.map(row => ({ [newColumnName]: '', ...row }));
    } else {
      newTable.columns = [...newTable.columns, newColumnName];
      newTable.rows = newTable.rows.map(row => ({ ...row, [newColumnName]: '' }));
    }
    
    setTableData(newTable);
    updatePage(newTable);
  };

  const handleDeleteColumn = (colIdx) => {
    const newTable = { ...tableData };
    const colNameToDelete = newTable.columns[colIdx];
    newTable.columns = newTable.columns.filter((_, i) => i !== colIdx);
    newTable.rows = newTable.rows.map(row => {
      const updatedRow = { ...row };
      delete updatedRow[colNameToDelete];
      return updatedRow;
    });
    setTableData(newTable);
    updatePage(newTable);
  };

  const handleCellChange = (rowIdx, colIdx, value) => {
    const newTable = { ...tableData };
    if (newTable.rows[rowIdx]) {
      const colName = newTable.columns[colIdx];
      newTable.rows[rowIdx][colName] = value;
      setTableData(newTable);
      updatePage(newTable);
    }
  };

  const handleColumnHeaderChange = (colIdx, value) => {
    const nextHeader = value?.trim() || `Column ${colIdx + 1}`;
    const newTable = { ...tableData };
    if (!newTable.columns || !newTable.columns[colIdx]) return;

    const oldHeader = newTable.columns[colIdx];
    if (oldHeader === nextHeader) {
      setTableData(newTable);
      updatePage(newTable);
      return;
    }

    newTable.columns[colIdx] = nextHeader;
    newTable.rows = newTable.rows.map((row) => {
      const updatedRow = { ...row };
      updatedRow[nextHeader] = updatedRow[oldHeader] ?? '';
      delete updatedRow[oldHeader];
      return updatedRow;
    });

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
                      value={col || ''}
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
                {(tableData.columns || []).map((colName, colIdx) => (
                  <td key={`${rowIdx}-${colIdx}`}>
                    <input
                      type="text"
                      value={row?.[colName] || ''}
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
