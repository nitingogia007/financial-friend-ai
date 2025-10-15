
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from 'next-themes';

interface Props {
  data: {
    date: string;
    benchmark?: number;
    modelPortfolio?: number;
  }[];
  title: string;
}

const COLORS = {
  modelPortfolio: 'hsl(var(--chart-1))',
  benchmark: 'hsl(var(--chart-2))',
};

export function PortfolioNiftyChart({ data, title }: Props) {
  const { theme } = useTheme();
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Not enough data to display the chart.
      </div>
    );
  }

  const keys = Object.keys(data[0]).filter(key => key !== 'date') as (keyof typeof COLORS)[];

  const allValues = data.flatMap(d => 
      keys.map(key => d[key])
  ).filter(v => typeof v === 'number') as number[];

  const yDomain = allValues.length > 0 
      ? [Math.min(...allValues), Math.max(...allValues)] 
      : [90, 110];
  
  const yAxisMin = Math.floor(yDomain[0] / 10) * 10;
  const yAxisMax = Math.ceil(yDomain[1] / 10) * 10;

  const formatLegendName = (name: string) => {
    if (name === 'benchmark' && title.includes('NIFTY 50')) return 'NIFTY 50';
    if (name === 'benchmark') return 'Benchmark';
    if (name === 'modelPortfolio') return 'Model Portfolio';
    return name;
  }
  
  const lastDataPoint = data[data.length - 1];
  let alpha: number | null = null;
  if (lastDataPoint && lastDataPoint.modelPortfolio !== undefined && lastDataPoint.benchmark !== undefined) {
    alpha = lastDataPoint.modelPortfolio - lastDataPoint.benchmark;
  }
  
  const alphaYPosition = lastDataPoint.modelPortfolio !== undefined && lastDataPoint.benchmark !== undefined
    ? (lastDataPoint.modelPortfolio + lastDataPoint.benchmark) / 2
    : yDomain[1];


  return (
    <Card className="mt-6">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-96 w-full">
            <ResponsiveContainer>
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 50, left: 0, bottom: 5 }}
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
                        formatter={(value: number, name: string) => [value.toFixed(2), formatLegendName(name)]}
                    />
                    <Legend iconSize={10} formatter={(value) => formatLegendName(value)} />
                    {keys.map((key) => (
                         <Line 
                            key={key}
                            type="monotone" 
                            dataKey={key} 
                            stroke={COLORS[key]} 
                            strokeWidth={2} 
                            dot={false}
                            name={formatLegendName(key)}
                        />
                    ))}
                    {alpha !== null && lastDataPoint && (
                      <ReferenceLine
                        x={lastDataPoint.date}
                        y={alphaYPosition}
                        stroke="hsl(var(--border))"
                        strokeDasharray="3 3"
                        label={{
                          position: 'right',
                          value: `↔ α(${alpha.toFixed(2)})`,
                          fill: alpha >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))',
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
  );
}
