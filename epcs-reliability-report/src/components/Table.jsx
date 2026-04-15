import React from 'react';

const Table = ({
  columns,
  data,
  boldColumns = [],
  isEditMode,
  isLiveMode = false,
  pageId,
  onCellChange,
  textColor,
  contentTextColor,
  headerFontSize,
  contentFontSize,
}) => {
  if (!data || data.length === 0) return <div>No data available.</div>;

  const parseHexColor = (value) => {
    if (!value || typeof value !== 'string') return null;
    const normalized = value.trim().toLowerCase();
    if (/^#([0-9a-f]{3})$/.test(normalized)) {
      return {
        r: parseInt(normalized[1] + normalized[1], 16),
        g: parseInt(normalized[2] + normalized[2], 16),
        b: parseInt(normalized[3] + normalized[3], 16),
      };
    }
    if (/^#([0-9a-f]{6})$/.test(normalized)) {
      return {
        r: parseInt(normalized.slice(1, 3), 16),
        g: parseInt(normalized.slice(3, 5), 16),
        b: parseInt(normalized.slice(5, 7), 16),
      };
    }
    return null;
  };

  const relativeLuminance = ({ r, g, b }) => {
    const toLinear = (c) => {
      const channel = c / 255;
      return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    };
    const R = toLinear(r);
    const G = toLinear(g);
    const B = toLinear(b);
    return (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
  };

  const contrastRatio = (fg, bg) => {
    const L1 = relativeLuminance(fg);
    const L2 = relativeLuminance(bg);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  };

  const pickReadableColor = (candidate, backgroundHex, fallbackHex) => {
    const bg = parseHexColor(backgroundHex);
    const fallback = parseHexColor(fallbackHex);
    const parsedCandidate = parseHexColor(candidate);
    if (!bg || !fallback) return candidate || fallbackHex;
    if (!parsedCandidate) return fallbackHex;
    return contrastRatio(parsedCandidate, bg) >= 4.5 ? candidate : fallbackHex;
  };

  const resolvedHeaderTextColor = isLiveMode
    ? pickReadableColor(textColor, '#2f74c0', '#000000')
    : pickReadableColor(textColor, '#2e7be6', '#f3f7ff');
  const resolvedContentTextColor = isLiveMode
    ? pickReadableColor(contentTextColor, '#ffffff', '#000000')
    : pickReadableColor(contentTextColor, '#232b44', '#eaf1ff');
  const resolvedHeaderFontSize = Number.isFinite(Number(headerFontSize)) ? `${headerFontSize}rem` : undefined;
  const resolvedContentFontSize = Number.isFinite(Number(contentFontSize)) ? `${contentFontSize}rem` : undefined;
  
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
            <th key={col} style={{
              color: resolvedHeaderTextColor,
              fontSize: resolvedHeaderFontSize,
              fontWeight: boldColumns.includes(col) ? 'bold' : undefined,
            }}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className={(row.rowClass || row.rowColor) ? `row-${String(row.rowClass || row.rowColor).replace(/^row-/, '')}` : ''}>
            {columns.map((col) => {
              // Skip if this cell is spanned by a previous row
              if (spannedCells[idx] && spannedCells[idx][col]) {
                return null;
              }

              // Check if this row spans multiple rows for this column
              const rowspanKey = col + 'Rowspan';
              const rowspanAttr = row[rowspanKey] && row[rowspanKey] > 1 ? row[rowspanKey] : undefined;

              const hasRowPalette = Boolean(row.rowClass || row.rowColor);
              const cellStyle = {
                fontSize: resolvedContentFontSize,
              };
              if (isEditMode || !hasRowPalette) {
                cellStyle.color = resolvedContentTextColor;
              }
              // Bold: cell-level > row-level > column-level
              const isCellBold = Boolean(row[col + '__bold']);
              const isRowBold = Boolean(row['__rowBold']);
              const isColBold = boldColumns.includes(col);
              if (isCellBold || isRowBold || isColBold) {
                cellStyle.fontWeight = 'bold';
              }

              return (
                <td
                  key={col}
                  {...(rowspanAttr && { rowSpan: rowspanAttr })}
                  className={isEditMode ? 'editable-cell' : ''}
                  style={cellStyle}
                >
                  {isEditMode ? (
                    <input
                      type="text"
                      value={row[col] ?? ''}
                      onChange={(e) => onCellChange(pageId, idx, col, e.target.value)}
                      className="cell-input"
                      style={{ color: resolvedContentTextColor, fontSize: resolvedContentFontSize }}
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
