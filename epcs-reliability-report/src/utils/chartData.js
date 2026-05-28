export const DEFAULT_CHART_CONFIG = {
  chartType: 'line',
  chartTitle: 'Reliability data',
  headers: ['Hours', 'Failures'],
  rows: [
    ['0', '0'],
    ['1000', '1'],
    ['2000', '2'],
    ['4000', '3'],
  ],
  xColumnIndex: 0,
  yColumnIndices: [1],
};

const SAMPLE_PRESETS = [
  {
    label: 'Life test (hours vs failures)',
    config: {
      chartType: 'line',
      chartTitle: 'Switching life test',
      headers: ['Hours', 'Failures'],
      rows: [['0', '0'], ['1000', '0'], ['2000', '1'], ['4000', '2']],
      xColumnIndex: 0,
      yColumnIndices: [1],
    },
  },
  {
    label: 'Compare parts (bar)',
    config: {
      chartType: 'bar',
      chartTitle: 'Part comparison',
      headers: ['Part', 'Count'],
      rows: [['FBG10N30', '12'], ['FBG20N18', '8'], ['EPC7019D', '15']],
      xColumnIndex: 0,
      yColumnIndices: [1],
    },
  },
];

export { SAMPLE_PRESETS };

export const normalizeChartConfig = (page) => {
  const raw = page?.chartConfig;
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_CHART_CONFIG };
  }
  const headers = Array.isArray(raw.headers) && raw.headers.length > 0
    ? raw.headers.map((h) => String(h ?? ''))
    : [...DEFAULT_CHART_CONFIG.headers];
  const rows = Array.isArray(raw.rows) && raw.rows.length > 0
    ? raw.rows.map((row) => (Array.isArray(row) ? row.map((c) => String(c ?? '')) : []))
    : DEFAULT_CHART_CONFIG.rows.map((r) => [...r]);
  const yColumnIndices = Array.isArray(raw.yColumnIndices) && raw.yColumnIndices.length > 0
    ? raw.yColumnIndices.filter((i) => Number.isFinite(Number(i)))
    : [Math.min(1, headers.length - 1)];
  const xColumnIndex = Number.isFinite(Number(raw.xColumnIndex))
    ? Math.max(0, Math.min(Number(raw.xColumnIndex), headers.length - 1))
    : 0;

  return {
    chartType: ['line', 'bar', 'pie'].includes(raw.chartType) ? raw.chartType : 'line',
    chartTitle: String(raw.chartTitle ?? ''),
    headers,
    rows,
    xColumnIndex,
    yColumnIndices,
  };
};

export const rowsToChartRecords = (config) => {
  const { headers, rows, xColumnIndex, yColumnIndices } = config;
  const xKey = headers[xColumnIndex] || 'category';
  return rows
    .filter((row) => Array.isArray(row) && row.some((cell) => String(cell).trim() !== ''))
    .map((row) => {
      const record = { [xKey]: row[xColumnIndex] ?? '' };
      yColumnIndices.forEach((colIdx) => {
        const key = headers[colIdx];
        if (!key) return;
        const raw = row[colIdx];
        const num = Number(raw);
        record[key] = Number.isFinite(num) && String(raw).trim() !== '' ? num : raw;
      });
      return record;
    });
};

export const configToPieData = (config) => {
  const records = rowsToChartRecords(config);
  const xKey = config.headers[config.xColumnIndex];
  const yKey = config.headers[config.yColumnIndices[0]];
  if (!xKey || !yKey) return [];
  return records.map((r) => ({
    name: String(r[xKey] ?? ''),
    value: Number(r[yKey]) || 0,
  }));
};
