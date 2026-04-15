import React, { useEffect, useState } from 'react';
import './AdvancedTableEditor.css';
import { getTemplateBadge } from '../utils/templateInfo.jsx';

const AdvancedTableEditor = ({ page, onChange, textColor = '#e0e6f0', contentTextColor = '#1b1f2a' }) => {
  console.log('🔵 AdvancedTableEditor RENDER - Page:', page.id, 'Has table:', !!page.table);
  
  // Handle both old (.data) and new (.rows) table structures for backward compatibility
  const getInitialTableData = () => {
    if (!page.table) return { rows: [], columns: [] };
    
    // If old structure with 'data' property, convert to 'rows'
    const table = page.table.data && !page.table.rows 
      ? { ...page.table, rows: page.table.data }
      : page.table;
    
    console.log('📊 Table structure - has .data:', !!table.data, 'has .rows:', !!table.rows);
    
    const rawColumns = Array.isArray(table.columns) ? table.columns : [];
    const normalizedColumns = rawColumns.map((col, idx) => {
      if (typeof col === 'string') return col;
      if (col && typeof col === 'object' && col.header) return col.header;
      return `Column ${idx + 1}`;
    });

    const rawRows = Array.isArray(table.rows) ? table.rows : [];
    console.log('🟢 Processing rows - count:', rawRows.length);
    if (rawRows.length > 0) {
      console.log('🟢 First row sample:', rawRows[0]);
      console.log('🟢 First row has rowColor:', !!rawRows[0]?.rowColor, rawRows[0]?.rowColor);
    }
    
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
        // Preserve row-level bold properties
        if (row.__rowBold) rowObj.__rowBold = row.__rowBold;
        if (row.__colBolds) rowObj.__colBolds = row.__colBolds;
        // Preserve row styling (colors, classes)
        if (row.rowClass) rowObj.rowClass = row.rowClass;
        if (row.rowColor) rowObj.rowColor = row.rowColor;
        return rowObj;
      }

      const emptyRow = {};
      normalizedColumns.forEach((columnName) => {
        emptyRow[columnName] = '';
      });
      return emptyRow;
    }).map((row) => {
      // Ensure every row has the bold properties initialized if missing
      if (!row.__rowBold) row.__rowBold = false;
      return row;
    });

    console.log('🟡 After normalization - first row:', normalizedRows[0]);
    console.log('🟡 First normalized row has rowColor:', !!normalizedRows[0]?.rowColor, normalizedRows[0]?.rowColor);

    // Ensure both rows and columns exist as arrays in normalized shape
    return {
      rows: normalizedRows,
      columns: normalizedColumns,
      boldColumns: Array.isArray(table.boldColumns) ? table.boldColumns : []
    };
  };
  
  const [tableData, setTableData] = useState(getInitialTableData());
  const [captionTop, setCaptionTop] = useState(page.captionTop || '');
  const [captionBottom, setCaptionBottom] = useState(page.captionBottom || '');
  const [selectedCell, setSelectedCell] = useState(null);

  // Debug: log table data on mount
  useEffect(() => {
    console.log('=== AdvancedTableEditor Debug ===');
    console.log('Page ID:', page.id);
    console.log('Table data rows:', tableData.rows?.length);
    if (tableData.rows && tableData.rows.length > 0) {
      tableData.rows.forEach((row, idx) => {
        if (row.rowColor) {
          console.log(`Row ${idx} has color: ${row.rowColor}`);
        }
      });
    }
  }, [page.id, tableData.rows]);

  useEffect(() => {
    setTitle(page.title || '');
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
    // New rows start with no bold properties
    newRow.__rowBold = false;
    // New rows inherit styling from first row if available (optional)
    const newTable = {
      columns: tableData.columns,
      rows: position === 'top' ? [newRow, ...tableData.rows] : [...tableData.rows, newRow],
      boldColumns: tableData.boldColumns || []
    };
    
    setTableData(newTable);
    updatePage(newTable);
  };

  const handleDeleteRow = (rowIdx) => {
    const newTable = {
      columns: tableData.columns,
      rows: tableData.rows.filter((_, i) => i !== rowIdx),
      boldColumns: tableData.boldColumns || []
    };
    setTableData(newTable);
    updatePage(newTable);
  };

  const handleAddColumn = (position = 'right') => {
    const newTable = {
      columns: [...(tableData.columns || [])],
      rows: tableData.rows.map(row => ({ ...row })),
      boldColumns: tableData.boldColumns || []
    };
    const newColumnName = `Column ${(newTable.columns || []).length + 1}`;
    
    if (position === 'left') {
      newTable.columns = [newColumnName, ...newTable.columns];
      newTable.rows = newTable.rows.map(row => {
        const updated = { [newColumnName]: '', ...row };
        // Preserve all row properties including styling
        if (row.__rowBold) updated.__rowBold = row.__rowBold;
        if (row.rowClass) updated.rowClass = row.rowClass;
        if (row.rowColor) updated.rowColor = row.rowColor;
        return updated;
      });
    } else {
      newTable.columns = [...newTable.columns, newColumnName];
      newTable.rows = newTable.rows.map(row => {
        const updated = { ...row, [newColumnName]: '' };
        // Preserve all row properties including styling
        if (row.__rowBold) updated.__rowBold = row.__rowBold;
        if (row.rowClass) updated.rowClass = row.rowClass;
        if (row.rowColor) updated.rowColor = row.rowColor;
        return updated;
      });
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
      delete updatedRow[colNameToDelete + '__bold'];
      return updatedRow;
    });
    // Remove from boldColumns if present
    if (Array.isArray(newTable.boldColumns)) {
      newTable.boldColumns = newTable.boldColumns.filter(c => c !== colNameToDelete);
    }
    setTableData(newTable);
    updatePage(newTable);
  };

  const handleToggleTableBold = () => {
    // Check if ALL rows and columns are bold
    const allRowsBold = tableData.rows?.every(row => row.__rowBold);
    const allColsBold = tableData.columns?.every(col => tableData.boldColumns?.includes(col));
    const allBold = allRowsBold && allColsBold;
    
    // Toggle: if all bold, turn all off; if any not bold, turn all on
    const newBoldState = !allBold;
    
    const newTable = {
      columns: tableData.columns,
      rows: tableData.rows.map(row => ({ ...row, __rowBold: newBoldState })),
      boldColumns: newBoldState ? [...(tableData.columns || [])] : []
    };
    setTableData(newTable);
    updatePage(newTable);
  };

  const handleToggleCellBold = (rowIdx, colName) => {
    const newTable = {
      columns: tableData.columns,
      rows: tableData.rows.map((row, i) => {
        if (i !== rowIdx) return row;
        const key = colName + '__bold';
        return { ...row, [key]: !row[key] };
      }),
      boldColumns: tableData.boldColumns || []
    };
    setTableData(newTable);
    updatePage(newTable);
  };

  const handleToggleRowBold = (rowIdx) => {
    const newTable = {
      columns: tableData.columns,
      rows: tableData.rows.map((row, i) => {
        if (i !== rowIdx) return row;
        return { ...row, __rowBold: !row.__rowBold };
      }),
      boldColumns: tableData.boldColumns || []
    };
    setTableData(newTable);
    updatePage(newTable);
  };

  const handleToggleColumnBold = (colName) => {
    const boldCols = Array.isArray(tableData.boldColumns) ? [...tableData.boldColumns] : [];
    const idx = boldCols.indexOf(colName);
    if (idx === -1) boldCols.push(colName);
    else boldCols.splice(idx, 1);
    const newTable = {
      columns: tableData.columns,
      rows: tableData.rows,
      boldColumns: boldCols
    };
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

  const [title, setTitle] = useState(page.title || '');

  useEffect(() => {
    setTitle(page.title || '');
  }, [page.id]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onChange({ ...page, title: newTitle });
  };

  const getReadableEditorTextColor = (color) => {
    if (!color || typeof color !== 'string') return '#1b1f2a';

    const normalized = color.trim().toLowerCase();
    let r;
    let g;
    let b;

    if (/^#([0-9a-f]{3})$/.test(normalized)) {
      r = parseInt(normalized[1] + normalized[1], 16);
      g = parseInt(normalized[2] + normalized[2], 16);
      b = parseInt(normalized[3] + normalized[3], 16);
    } else if (/^#([0-9a-f]{6})$/.test(normalized)) {
      r = parseInt(normalized.slice(1, 3), 16);
      g = parseInt(normalized.slice(3, 5), 16);
      b = parseInt(normalized.slice(5, 7), 16);
    } else {
      return '#1b1f2a';
    }

    // Keep table editor text dark enough for white and light row backgrounds.
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.55 ? '#1b1f2a' : color;
  };

  const getReadableHeaderTextColor = (color) => {
    if (!color || typeof color !== 'string') return '#f3f7ff';

    const normalized = color.trim().toLowerCase();
    let r;
    let g;
    let b;

    if (/^#([0-9a-f]{3})$/.test(normalized)) {
      r = parseInt(normalized[1] + normalized[1], 16);
      g = parseInt(normalized[2] + normalized[2], 16);
      b = parseInt(normalized[3] + normalized[3], 16);
    } else if (/^#([0-9a-f]{6})$/.test(normalized)) {
      r = parseInt(normalized.slice(1, 3), 16);
      g = parseInt(normalized.slice(3, 5), 16);
      b = parseInt(normalized.slice(5, 7), 16);
    } else {
      return '#f3f7ff';
    }

    // Header input background is dark navy (#243146). Keep text light for readability.
    const bg = { r: 36, g: 49, b: 70 };
    const toLinear = (c) => {
      const channel = c / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (rgb) => (0.2126 * toLinear(rgb.r)) + (0.7152 * toLinear(rgb.g)) + (0.0722 * toLinear(rgb.b));
    const l1 = luminance({ r, g, b });
    const l2 = luminance(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return ratio >= 4.5 ? color : '#f3f7ff';
  };

  const editorTextColor = getReadableEditorTextColor(contentTextColor);
  const headerTextColor = getReadableHeaderTextColor(textColor);

  const editorStyle = {
    '--ate-label-color': '#1b1f2a',
    '--ate-header-text-color': headerTextColor,
    '--ate-cell-text-color': editorTextColor,
  };

  return (
    <div className="advanced-table-editor" style={editorStyle}>
      <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
        {getTemplateBadge(page, true)}
      </div>
      {/* Page Title */}
      <div className="caption-section">
        <label htmlFor="page-title">Main Title:</label>
        <input
          id="page-title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Rename main title"
          className="table-editor-input"
        />
      </div>

      {/* Caption Top */}
      <div className="caption-section">
        <label htmlFor="caption-top">Text Above Table:</label>
        <input
          id="caption-top"
          type="text"
          value={captionTop}
          onChange={(e) => handleCaptionChange('top', e.target.value)}
          placeholder="Optional text or title above table"
          className="table-editor-input"
        />
      </div>

      {/* Table Controls */}
      <div className="table-controls">
        <div className="control-group">
          <button onClick={() => handleAddRow('top')} className="control-btn" title="Add row at top">
            ⬆ Row Top
          </button>
          <button onClick={() => handleAddRow('bottom')} className="control-btn" title="Add row at bottom">
            ⬇ Row Bottom
          </button>
        </div>
        <div className="control-group">
          <button onClick={() => handleAddColumn('left')} className="control-btn" title="Add column at left">
            ⬅ Col Left
          </button>
          <button onClick={() => handleAddColumn('right')} className="control-btn" title="Add column at right">
            Col Right ➡
          </button>
        </div>
        <div className="control-group">
          <button onClick={handleToggleTableBold} className="control-btn" title="Toggle bold for entire table">
            ⭐ Table Bold
          </button>
        </div>
      </div>

      {/* Table Editor */}
      <div className="table-wrapper">
        <table className="editable-table">
          <thead>
            <tr>
              <th className="row-action-header">Actions</th>
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
                      className={`bold-col-btn${Array.isArray(tableData.boldColumns) && tableData.boldColumns.includes(col) ? ' bold-active' : ''}`}
                      onClick={() => handleToggleColumnBold(col)}
                      title={`Toggle bold for entire "${col}" column`}
                    >
                      B col
                    </button>
                    <button
                      className="delete-col-btn"
                      onClick={() => handleDeleteColumn(colIdx)}
                      title="Delete column"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows && tableData.rows.map((row, rowIdx) => {
              const rowColorClass = row?.rowClass || row?.rowColor ? `row-${String(row.rowClass || row.rowColor).replace(/^row-/, '')}` : '';
              const trClassName = `${selectedCell?.row === rowIdx ? 'selected-row' : ''} ${rowColorClass}`.trim();
              return (
              <tr key={rowIdx} className={trClassName}>
                <td className="row-action">
                  <button
                    className={`bold-row-btn${row?.__rowBold ? ' bold-active' : ''}`}
                    onClick={() => handleToggleRowBold(rowIdx)}
                    title="Toggle bold for entire row"
                  >
                    B row
                  </button>
                  <button
                    className="delete-row-btn"
                    onClick={() => handleDeleteRow(rowIdx)}
                    title="Delete row"
                  >
                    🗑 Delete
                  </button>
                </td>
                {(tableData.columns || []).map((colName, colIdx) => (
                  <td key={`${rowIdx}-${colIdx}`}>
                    <div className="cell-with-bold">
                      <input
                        type="text"
                        value={row?.[colName] || ''}
                        onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                        onFocus={() => setSelectedCell({ row: rowIdx, col: colIdx })}
                        className={`cell-input${row?.[colName + '__bold'] || row?.__rowBold || tableData.boldColumns?.includes(colName) ? ' bold-text' : ''}`}
                      />
                      <button
                        className={`bold-cell-btn${row?.[colName + '__bold'] ? ' bold-active' : ''}`}
                        onClick={() => handleToggleCellBold(rowIdx, colName)}
                        title="Toggle bold for this cell"
                      >
                        B
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
              );
            })}
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
          className="table-editor-input"
        />
      </div>

      {/* Info */}
      <div className="editor-info">
        <p>Table: {tableData.rows.length} rows x {(tableData.columns || []).length} columns</p>
        <p className="note">Tip: Use the controls to add/remove rows and columns. Click cells to edit.</p>
      </div>
    </div>
  );
};

export default AdvancedTableEditor;
