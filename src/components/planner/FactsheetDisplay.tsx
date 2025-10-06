"use client";

import type { FactsheetData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface FactsheetDisplayProps {
  data: FactsheetData;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'
];

export function FactsheetDisplay({ data }: FactsheetDisplayProps) {
  const industryData = data.industryAllocation.map((item, index) => ({
    name: item.sector,
    value: item.weight,
    fill: COLORS[index % COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Industry Allocation (% of Net Assets)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={industryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {industryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`, 'Weight']} />
                <Legend layout="vertical" verticalAlign="middle" align="right" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-sm">
             <div className="grid grid-cols-2 gap-2">
                {industryData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: item.fill }}/>
                        <span className="truncate">{item.name}</span>
                        <span className="ml-auto font-semibold">{item.value.toFixed(2)}%</span>
                    </div>
                ))}
             </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Portfolio Holdings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Weight (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.portfolioHoldings.map((holding) => (
                <TableRow key={holding.stock}>
                  <TableCell className="font-medium">{holding.stock}</TableCell>
                  <TableCell className="text-right">{holding.weight.toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="text-center text-lg font-bold">Net Assets: {data.netAssets}</div>
    </div>
  );
}
