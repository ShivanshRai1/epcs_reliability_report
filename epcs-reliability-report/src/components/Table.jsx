import React from 'react';

const Table = ({ columns, data, isEditMode, pageId, onCellChange }) => {
  if (!data || data.length === 0) return <div>No data available.</div>;
  
  // Build a map of spanned cells based on rowspan metadata
  const spannedCells = {};
  data.forEach((row, idx) => {
    if (!spannedCells[idx]) spannedCells[idx] = {};
    
    // Check for any column that has rowspan metadata
    Object.keys(row).forEach((key) => {
      const rowspanKey = key + 'Rowspan';
      if (row[rowspanKey] && row[rowspanKey] > 1) {
        // Mark subsequent rows as spanned for this column
        for (let i = 1; i < row[rowspanKey]; i++) {
          if (!spannedCells[idx + i]) spannedCells[idx + i] = {};
          spannedCells[idx + i][key] = true;
        }
      }
    });
  });

  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className={row.rowColor ? `row-${row.rowColor}` : ''}>
            {columns.map((col) => {
              // Skip if this cell is spanned by a previous row
              if (spannedCells[idx] && spannedCells[idx][col]) {
                return null;
              }

              // Check if this row spans multiple rows for this column
              const rowspanKey = col + 'Rowspan';
              const rowspanAttr = row[rowspanKey] && row[rowspanKey] > 1 ? row[rowspanKey] : undefined;

              return (
                <td key={col} {...(rowspanAttr && { rowSpan: rowspanAttr })} className={isEditMode ? 'editable-cell' : ''}>
                  {isEditMode ? (
                    <input
                      type="text"
                      value={row[col] ?? ''}
                      onChange={(e) => onCellChange(pageId, idx, col, e.target.value)}
                      className="cell-input"
                    />
                  ) : (
                    row[col] ?? ''
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
