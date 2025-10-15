
"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Text } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface Props {
  data: {
    date: string;
    benchmark?: number;
    modelPortfolio?: number;
  }[];
  title: string;
}

const COLORS = {
  modelPortfolio: 'hsl(var(--chart-2))', // Green
  benchmark: 'hsl(var(--chart-1))',      // Blue
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const date = new Date(label.split('-').reverse().join('-'));
    const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    return (
      <div className="rounded-lg border bg-background p-2.5 shadow-xl">
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
        <div className="mt-1 space-y-1 text-sm">
           <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.modelPortfolio }} />
                <span className="font-medium">Model Portfolio:</span>
                <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                    {payload.find(p => p.dataKey === 'modelPortfolio')?.value.toFixed(2)}
                </span>
           </div>
           <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.benchmark }} />
                <span className="font-medium">Benchmark:</span>
                 <span className="ml-auto font-mono font-medium tabular-nums text-foreground">
                    {payload.find(p => p.dataKey === 'benchmark')?.value.toFixed(2)
}
                </span>
           </div>
        </div>
      </div>
    );
  }

  return null;
};


const CustomLegend = ({ payload, title }: { payload?: any[], title: string }) => {
    const formatLegendName = (name: string) => {
        if (name === 'benchmark') {
             if (title.includes('NIFTY 50 Hybrid')) return 'NIFTY 50 Hybrid';
             if (title.includes('NIFTY 10Y')) return 'NIFTY 10Y G-Sec';
             if (title.includes('NIFTY 50')) return 'NIFTY 50';
             return 'Benchmark';
        }
        if (name === 'modelPortfolio') return 'Model Portfolio';
        return name;
    }

    if (!payload) return null;

    return (
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mt-4">
            {payload.map((entry, index) => (
                <div key={`item-${index}`} className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="font-medium text-foreground">{formatLegendName(entry.dataKey)}</span>
                </div>
            ))}
        </div>
    );
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

  const lastDataPoint = data[data.length - 1];
  let alpha: number | null = null;
  if (lastDataPoint && lastDataPoint.modelPortfolio !== undefined && lastDataPoint.benchmark !== undefined) {
    alpha = lastDataPoint.modelPortfolio - lastDataPoint.benchmark;
  }
  
  const AlphaLabel = ({ viewBox }: any) => {
    const { x, y, height } = viewBox;
    if (alpha === null) return null;
    
    const midY = y + height / 2;

    return (
        <Text
            x={x}
            y={midY}
            textAnchor="end"
            verticalAnchor="middle"
            fill={alpha >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}
            fontSize={12}
            fontWeight="bold"
            dx={-5} // Add some padding from the line
        >
            {`α (${alpha.toFixed(1)}%)`}
        </Text>
    );
};
  
  return (
    <Card className="mt-6">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-96 w-full">
            <ResponsiveContainer>
                <LineChart
                    data={data}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" vertical={false} />
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
                        interval="preserveStartEnd"
                    />
                    <YAxis 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => Math.round(value).toString()}
                        domain={['dataMin - 5', 'dataMax + 5']}
                        allowDecimals={false}
                    />
                    <Tooltip
                        content={<CustomTooltip />}
                    />
                    <Legend 
                        content={<CustomLegend title={title}/>}
                        verticalAlign="bottom"
                    />
                    <Line 
                        key="modelPortfolio"
                        type="monotone" 
                        dataKey="modelPortfolio" 
                        stroke={COLORS.modelPortfolio}
                        strokeWidth={1.5} 
                        dot={false}
                        name="Model Portfolio"
                    />
                    <Line 
                        key="benchmark"
                        type="monotone" 
                        dataKey="benchmark" 
                        stroke={COLORS.benchmark}
                        strokeWidth={1.5} 
                        dot={false}
                        name="Benchmark"
                    />
                    {alpha !== null && lastDataPoint && (
                      <ReferenceLine
                          ifOverflow="extendDomain"
                          segment={[{ x: lastDataPoint.date, y: lastDataPoint.benchmark }, { x: lastDataPoint.date, y: lastDataPoint.modelPortfolio }]}
                          stroke={alpha >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}
                          strokeDasharray="3 3"
                          label={<AlphaLabel />}
                      />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </CardContent>
    </Card>
  );
}
