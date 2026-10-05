// PhotoMax — Service category breakdown donut chart
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatMoney } from '@/utils/format';
import type { Currency } from '@/types';

interface Slice {
  name: string;
  value: number;
  color?: string;
}

const COLORS = ['#7c3aed', '#f43f5e', '#06b6d4', '#f59e0b', '#10b981', '#a855f7', '#ec4899'];

interface Props {
  data: Slice[];
  currency: Currency;
}

export function ServiceBreakdownChart({ data, currency }: Props) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return (
    <div className="relative">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={60}
              outerRadius={92}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const p = payload[0];
                return (
                  <div className="rounded-xl border border-ink-200 bg-white/95 p-3 text-xs shadow-card backdrop-blur dark:border-ink-800 dark:bg-ink-900/95">
                    <p className="mb-1 font-semibold text-ink-700 dark:text-ink-200">
                      {String(p.name)}
                    </p>
                    <p className="font-semibold text-ink-900 dark:text-ink-50">
                      {formatMoney(Number(p.value ?? 0), currency)}
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-xs uppercase tracking-wider text-ink-500 dark:text-ink-400">Total</p>
        <p className="text-lg font-bold text-ink-900 dark:text-ink-50">
          {formatMoney(total, currency)}
        </p>
      </div>
    </div>
  );
}