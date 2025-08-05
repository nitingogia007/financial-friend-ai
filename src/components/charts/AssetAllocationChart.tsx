
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
  'url(#pattern-blue)',
  'url(#pattern-green)',
  'url(#pattern-yellow)',
  'url(#pattern-amber)',
  'url(#pattern-gray)',
];

const STROKE_COLORS = [
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
                 <defs>
                    {/* Pattern 1: Blue Diagonal Lines */}
                    <pattern id="pattern-blue" patternUnits="userSpaceOnUse" width="8" height="8">
                        <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke={'hsl(var(--chart-1))'} strokeWidth="1" />
                    </pattern>
                    {/* Pattern 2: Green Crosshatch */}
                    <pattern id="pattern-green" patternUnits="userSpaceOnUse" width="8" height="8">
                        <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke={'hsl(var(--chart-2))'} strokeWidth="1" />
                        <path d="M2,-2 l4,4 M-8,0 l8,8 M-2,6 l4,4" stroke={'hsl(var(--chart-2))'} strokeWidth="1" />
                    </pattern>
                    {/* Pattern 3: Yellow Dots */}
                    <pattern id="pattern-yellow" patternUnits="userSpaceOnUse" width="10" height="10">
                        <circle cx="5" cy="5" r="1.5" fill={'hsl(var(--chart-3))'} />
                    </pattern>
                    {/* Pattern 4: Amber Horizontal Lines */}
                     <pattern id="pattern-amber" patternUnits="userSpaceOnUse" width="6" height="6">
                        <path d="M0,0 l6,0 M0,3 l6,0 M0,6 l6,0" stroke={'hsl(var(--chart-4))'} strokeWidth="1" />
                    </pattern>
                    {/* Pattern 5: Gray Zigzag */}
                    <pattern id="pattern-gray" patternUnits="userSpaceOnUse" width="10" height="10">
                        <path d="M0,5 l2.5,-5 l2.5,5 l2.5,-5 l2.5,5" stroke={'hsl(var(--chart-5))'} strokeWidth="1" fill="none" />
                    </pattern>
                </defs>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={130}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={10}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                    {chartData.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            stroke={STROKE_COLORS[index % STROKE_COLORS.length]}
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
