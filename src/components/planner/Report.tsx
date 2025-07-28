"use client";

import type { ReportData } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { NetWorthBreakdown } from '../charts/NetWorthBreakdown';
import { ExpenseBreakdown } from '../charts/ExpenseBreakdown';
import { Button } from '../ui/button';
import { Printer, FileText } from 'lucide-react';

interface Props {
  data: ReportData;
}

export function Report({ data }: Props) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Card id="report-section" className="shadow-2xl animate-in fade-in-50 duration-500">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="font-headline text-3xl text-primary flex items-center gap-2"><FileText /> Financial Report</CardTitle>
          <CardDescription>A complete overview of your financial health for {data.personalDetails.name}.</CardDescription>
        </div>
        <Button onClick={handlePrint} className="no-print">
            <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
        </Button>
      </CardHeader>
      <CardContent>
        <div className="p-6 border rounded-lg printable-area">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 border-b pb-2">Key Metrics</h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Net Worth</TableCell>
                    <TableCell className="text-right font-bold text-lg">₹{data.netWorth.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Monthly Cashflow</TableCell>
                    <TableCell className="text-right font-bold text-lg">₹{data.monthlyCashflow.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total Insurance Cover</TableCell>
                    <TableCell className="text-right font-bold text-lg">₹{data.totalInsuranceCover.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total Annual Premium</TableCell>
                    <TableCell className="text-right font-bold text-lg">₹{data.totalInsurancePremium.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
             <div className="prose prose-blue max-w-none bg-primary/5 p-4 rounded-lg">
                <h3 className="text-xl font-semibold mt-0">AI Financial Summary</h3>
                <p className="text-sm">{data.aiSummary}</p>
            </div>
          </div>
          
          <Separator className="my-8" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div >
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Asset & Liability Breakdown</h3>
                <div className="h-80">
                   <NetWorthBreakdown assets={data.totalAssets} liabilities={data.totalLiabilities} netWorth={data.netWorth} />
                </div>
            </div>
             <div >
                <h3 className="text-xl font-semibold mb-4 border-b pb-2">Annual Expense Breakdown</h3>
                <div className="h-80">
                   <ExpenseBreakdown expenses={data.expenses} />
                </div>
            </div>
          </div>

          <Separator className="my-8" />

          <div>
            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Financial Goals & SIP</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal</TableHead>
                  <TableHead>Corpus (₹)</TableHead>
                  <TableHead>Years</TableHead>
                  <TableHead>Rate (%)</TableHead>
                  <TableHead className="text-right">Monthly SIP (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.goals.map(goal => (
                  <TableRow key={goal.id}>
                    <TableCell className="font-medium">{goal.name}</TableCell>
                    <TableCell>{Number(goal.corpus).toLocaleString('en-IN')}</TableCell>
                    <TableCell>{goal.years}</TableCell>
                    <TableCell>{goal.rate}%</TableCell>
                    <TableCell className="text-right font-bold text-primary">₹{goal.sip.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
