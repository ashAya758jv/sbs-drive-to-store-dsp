import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { chartColors } from "../../styles/theme";
import { formatShortDate } from "../../data/reportingData";

/** 1_245_000 → "1,2M", 820_000 → "820k". */
function formatCompact(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${value}`;
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-lg shadow-slate-200/60">
      <p className="mb-2 text-xs font-semibold text-slate-500">{formatShortDate(label)}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="capitalize text-slate-600">{entry.name}</span>
          <span className="ml-auto font-medium text-slate-900">
            {entry.value.toLocaleString("fr-FR")}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Daily trend of impressions (left axis) and clics (right axis) over the
 * selected reporting period. Same visual language as the Dashboard's
 * PerformanceChart, kept as a separate component so the Dashboard chart is
 * never touched by the Reporting screen.
 */
export default function ReportingTrendChart({ data }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={chartColors.grid} vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: chartColors.axis }}
            dy={8}
            minTickGap={24}
          />
          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: chartColors.axis }}
            tickFormatter={formatCompact}
            width={48}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: chartColors.axis }}
            tickFormatter={formatCompact}
            width={40}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: chartColors.axis, strokeDasharray: "4 4" }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="impressions"
            name="Impressions"
            stroke={chartColors.impressions}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="clicks"
            name="Clics"
            stroke={chartColors.clics}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
