
"use client"

import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip, Legend } from 'recharts';
import type { Asset } from '@/lib/types';

interface Props {
  assets: Asset[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(240, 5.9%, 10%)',
];

export function AssetAllocationChart({ assets }: Props) {
  const getNumericAmount = (amount: number | '') => typeof amount === 'number' ? amount : 0;
  
  const liquidAssets = assets
    .filter(a => a.type !== 'Property' && getNumericAmount(a.amount) > 0)
    .map(a => ({ name: a.type, value: getNumericAmount(a.amount) }));
  
  const totalLiquidAssets = liquidAssets.reduce((sum, a) => sum + a.value, 0);
  
  const data = liquidAssets.map(a => ({
      ...a,
      percentage: totalLiquidAssets > 0 ? (a.value / totalLiquidAssets) * 100 : 0
  }));

  if (data.length === 0) {
    return (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No liquid asset data to display.
        </div>
    )
  }

  return (
    <div className="w-full h-full text-xs">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={60}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
              const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
              const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
              return (
                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10}>
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              );
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
              fontSize: '10px',
              padding: '4px 8px'
            }}
            formatter={(value, name, props) => [`₹${Number(value).toLocaleString('en-IN')} (${props.payload.percentage.toFixed(1)}%)`, name]}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
