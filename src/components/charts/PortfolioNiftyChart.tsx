
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from 'next-themes';

interface Props {
  data: {
    date: string;
    nifty50?: number;
    [key: `fund_${string}`]: number | string | undefined;
  }[];
  fundNames: Record<string, string>;
}

const fundColors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(25, 85%, 65%)',
    'hsl(330, 74%, 66%)'
];

export function PortfolioNiftyChart({ data, fundNames }: Props) {
  const { theme } = useTheme();
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Not enough data to display the chart.
      </div>
    );
  }
  
  const fundKeys = Object.keys(fundNames);

  // Calculate Y-axis domain dynamically
  const allValues = data.flatMap(d => [
      d.nifty50 || null, 
      ...fundKeys.map(key => (d[key] as number) || null)
  ]).filter(v => v !== null) as number[];

  const yDomain = [
      Math.min(...allValues),
      Math.max(...allValues),
  ];
  
  const yAxisMin = allValues.length > 0 ? Math.floor(yDomain[0] / 10) * 10 : 90;
  const yAxisMax = allValues.length > 0 ? Math.ceil(yDomain[1] / 10) * 10 : 110;

  return (
    <Card className="mt-6">
        <CardHeader>
            <CardTitle>Fund Performance vs. NIFTY 50 (Rebased to 100)</CardTitle>
        </CardHeader>
        <CardContent className="h-96 w-full">
            <ResponsiveContainer>
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                    <XAxis 
                        dataKey="date" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(str) => {
                            const date = new Date(str.split('-').reverse().join('-'));
                            if (isNaN(date.getTime())) return str;
                            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                        }}
                        interval={Math.floor(data.length / 6)} // Show around 6 ticks
                    />
                    <YAxis 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        domain={[yAxisMin, yAxisMax]}
                    />
                    <Tooltip
                        contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                            fontSize: "12px",
                        }}
                        labelFormatter={(label) => new Date(label.split('-').reverse().join('-')).toLocaleDateString('en-GB')}
                        formatter={(value: number, name: string) => {
                             const displayName = name === 'nifty50' ? 'NIFTY 50' : (fundNames[name] || name);
                             return [value.toFixed(2), displayName];
                        }}
                    />
                    <Legend iconSize={10} />
                    <Line 
                        type="monotone" 
                        dataKey="nifty50" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={2} 
                        dot={false}
                        name="NIFTY 50"
                    />
                    {fundKeys.map((fundKey, index) => (
                        <Line
                            key={fundKey}
                            type="monotone"
                            dataKey={fundKey}
                            stroke={fundColors[index % fundColors.length]}
                            strokeWidth={2}
                            dot={false}
                            name={fundNames[fundKey]}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
  );
}
