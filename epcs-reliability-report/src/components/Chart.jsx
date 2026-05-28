import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  configToPieData,
  getChartAxisSummary,
  normalizeChartConfig,
  rowsToChartRecords,
} from '../utils/chartData';
import './Chart.css';

const SERIES_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

const chartTooltipProps = {
  contentStyle: {
    backgroundColor: '#ffffff',
    border: '1px solid #b9c7da',
    borderRadius: '6px',
    color: '#111827',
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
  },
  labelStyle: { color: '#111827', fontWeight: 600 },
  itemStyle: { color: '#111827' },
};

const chartLegendProps = {
  wrapperStyle: { color: '#1f2937' },
};

const renderPieLabel = (categoryLabel, valueLabel) => (props) => {
  const { name, percent, value, x, y, textAnchor } = props;
  const pct = (percent * 100).toFixed(0);
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      dominantBaseline="central"
      fill="#1f2937"
      fontSize={11}
      fontWeight={600}
    >
      {`${categoryLabel} ${name}: ${value} ${valueLabel} (${pct}%)`}
    </text>
  );
};

const ChartCaption = ({ config }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="report-chart-caption-row">
      <button
        type="button"
        className="report-chart-help-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? 'Hide chart explanation' : 'Show chart explanation'}
        title="What does this chart show?"
      >
        ?
      </button>
      {open && (
        <p className="report-chart-caption" role="note">
          {getChartAxisSummary(config)}
        </p>
      )}
    </div>
  );
};

const ReportChart = ({ page, height = 320 }) => {
  const config = normalizeChartConfig(page);
  const data = rowsToChartRecords(config);
  const xKey = config.headers[config.xColumnIndex];
  const yKeys = config.yColumnIndices
    .map((i) => config.headers[i])
    .filter(Boolean);

  if (!data.length || !xKey || !yKeys.length) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280', border: '1px dashed #b9c7da', borderRadius: '8px' }}>
        Add data rows and select columns to display a chart.
      </div>
    );
  }

  const title = config.chartTitle?.trim();

  if (config.chartType === 'pie') {
    const pieData = configToPieData(config);
    const categoryLabel = pieData[0]?.categoryLabel || config.headers[config.xColumnIndex] || 'Category';
    const valueLabel = pieData[0]?.valueLabel || config.headers[config.yColumnIndices[0]] || 'Value';
    const pieTooltipProps = {
      ...chartTooltipProps,
      formatter: (value, _name, item) => [
        `${valueLabel}: ${value}`,
        `${categoryLabel}: ${item?.payload?.name ?? ''}`,
      ],
    };
    return (
      <div className="report-chart" style={{ width: '100%', margin: '1rem 0' }}>
        <div className="report-chart-title-row">
          {title ? <h3 className="report-chart-title">{title}</h3> : <span className="report-chart-title-spacer" />}
          <ChartCaption config={config} />
        </div>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="legendLabel"
              cx="50%"
              cy="50%"
              outerRadius="65%"
              label={renderPieLabel(categoryLabel, valueLabel)}
              labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
            >
              {pieData.map((_, idx) => (
                <Cell key={idx} fill={SERIES_COLORS[idx % SERIES_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...pieTooltipProps} />
            <Legend
              {...chartLegendProps}
              formatter={(legendValue) => legendValue}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const ChartRoot = config.chartType === 'bar' ? BarChart : LineChart;
  const Series = config.chartType === 'bar' ? Bar : Line;

  return (
    <div className="report-chart" style={{ width: '100%', margin: '1rem 0' }}>
      <div className="report-chart-title-row">
        {title ? <h3 className="report-chart-title">{title}</h3> : <span className="report-chart-title-spacer" />}
        <ChartCaption config={config} />
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <ChartRoot data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={{ fill: '#374151' }} />
          <YAxis tick={{ fill: '#374151' }} />
          <Tooltip {...chartTooltipProps} />
          <Legend {...chartLegendProps} />
          {yKeys.map((key, idx) => (
            <Series
              key={key}
              type="monotone"
              dataKey={key}
              stroke={SERIES_COLORS[idx % SERIES_COLORS.length]}
              fill={SERIES_COLORS[idx % SERIES_COLORS.length]}
              activeDot={config.chartType === 'line' ? { r: 6 } : undefined}
            />
          ))}
        </ChartRoot>
      </ResponsiveContainer>
    </div>
  );
};

/** @deprecated Use ReportChart — kept for any legacy imports */
const Chart = ({ data, xKey, yKey, title }) => {
  if (!data?.length) return <div>No chart data available.</div>;
  return (
    <div style={{ width: '100%', height: 300, margin: '2rem 0' }}>
      {title && <h3>{title}</h3>}
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey={yKey} stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Chart;
export { ReportChart };
