
"use client"

import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';

interface AssetAllocationChartProps {
    assets: {
        name: string;
        value: number;
        color: string;
    }[];
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function AssetAllocationChart({ assets }: AssetAllocationChartProps) {
  if (assets.length === 0) {
    return (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No liquid asset data to display.
        </div>
    )
  }
  
  const chartData = assets.map(asset => ({
      name: asset.name,
      value: asset.value
  }));

  return (
    <div className="w-full h-full flex flex-col items-center justify-center">
        <ResponsiveContainer width={300} height={300}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                    {chartData.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            stroke={'hsl(var(--background))'}
                            strokeWidth={2}
                            className="focus:outline-none" 
                        />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 text-sm font-semibold text-muted-foreground">Liquid Asset Allocation</div>
    </div>
  );
}
