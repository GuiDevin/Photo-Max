// PhotoMax — Revenue chart (last 6 months) with recharts
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TooltipProps } from 'recharts';
import { formatMoney } from '@/utils/format';
import type { Currency } from '@/types';

interface ChartDatum {
  month: string;
  receita: number;
  despesa: number;
}

interface Props {
  data: ChartDatum[];
  currency: Currency;
}

function ChartTooltip({ active, payload, label, currency }: TooltipProps<number, string> & { currency: Currency }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-ink-200 bg-white/95 p-3 text-xs shadow-card backdrop-blur dark:border-ink-800 dark:bg-ink-900/95">
      <p className="mb-1 font-semibold text-ink-700 dark:text-ink-200">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey as string} className="flex items-center gap-2 text-ink-600 dark:text-ink-300">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color }}
            aria-hidden
          />
          <span className="capitalize">{p.dataKey as string}:</span>
          <span className="font-semibold text-ink-900 dark:text-ink-50">
            {formatMoney(Number(p.value ?? 0), currency)}
          </span>
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data, currency }: Props) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="grad-receita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-despesa" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="rgba(148,163,184,0.2)" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="rgba(148,163,184,0.7)"
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <YAxis
            stroke="rgba(148,163,184,0.7)"
            tickFormatter={(v) => `R$${(Number(v) / 100).toLocaleString('pt-BR', { notation: 'compact' })}`}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={70}
          />
          <Tooltip content={<ChartTooltip currency={currency} />} cursor={{ stroke: '#7c3aed', strokeWidth: 1 }} />
          <Legend
            verticalAlign="top"
            height={28}
            wrapperStyle={{ fontSize: 11, color: 'rgba(148,163,184,0.9)' }}
          />
          <Area
            type="monotone"
            dataKey="receita"
            stroke="#7c3aed"
            strokeWidth={2.5}
            fill="url(#grad-receita)"
            activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="despesa"
            stroke="#f43f5e"
            strokeWidth={2}
            fill="url(#grad-despesa)"
            activeDot={{ r: 4, stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}