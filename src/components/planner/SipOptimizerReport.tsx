
"use client";

import type { SipOptimizerReportData } from '@/lib/types';
import { Button } from '../ui/button';
import { Printer } from 'lucide-react';
import Image from 'next/image';

interface Props {
  data: SipOptimizerReportData;
}

const formatCurrency = (value: number | '', prefix = '₹') => {
    const num = typeof value === 'number' ? value : 0;
    return `${prefix}${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export function SipOptimizerReport({ data }: Props) {
  const handlePrint = () => {
    window.print();
  };
  
  const additionalSipRequired = Math.max(0, data.investmentStatus.requiredInvestment - data.investmentStatus.currentInvestment);
  const surplusPercentage = (data.cashflow.investibleSurplus / data.cashflow.totalMonthlyIncome) * 100;

  return (
    <div id="report-section" className="bg-white text-gray-800 font-sans">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          #report-container {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
            box-shadow: none;
            border: none;
          }
        }
        #report-container * {
            font-family: 'Poppins', sans-serif;
        }
      `}</style>
      
      <div className="flex justify-end p-4 no-print">
        <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      <div id="report-container" className="w-[210mm] min-h-[297mm] mx-auto p-8 shadow-2xl border">
        {/* Header */}
        <header className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
            <div className="flex items-center space-x-4">
                <Image src="/financial-friend-logo.png" alt="Company Logo" width={50} height={50} />
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">SIP Optimizer Report</h1>
                    <p className="text-gray-600 font-semibold">{data.advisorDetails.companyName}</p>
                </div>
            </div>
            <div className="text-right text-xs text-gray-500">
                <p><span className="font-semibold">ARN Name:</span> {data.advisorDetails.arnName}</p>
                <p><span className="font-semibold">ARN No:</span> {data.advisorDetails.arnNo}</p>
                <p><span className="font-semibold">Mobile:</span> {data.advisorDetails.mobile}</p>
                <p><span className="font-semibold">Email:</span> {data.advisorDetails.email}</p>
            </div>
        </header>

        {/* Investor Details */}
        <section className="mt-6">
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h2 className="text-lg font-semibold mb-2 text-gray-800">Investor details</h2>
                <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm">
                    <p><span className="font-medium text-gray-500">Name:</span> {data.personalDetails.name}</p>
                    <p><span className="font-medium text-gray-500">Date of Birth:</span> {data.personalDetails.dob}</p>
                    <p><span className="font-medium text-gray-500">Dependents:</span> {data.personalDetails.dependents}</p>
                    <p><span className="font-medium text-gray-500">Retirement Age:</span> {data.personalDetails.retirementAge}</p>
                    <p><span className="font-medium text-gray-500">Mobile No.:</span> {data.personalDetails.mobile}</p>
                    <p><span className="font-medium text-gray-500">Email ID:</span> {data.personalDetails.email}</p>
                </div>
            </div>
        </section>

        {/* Cashflow Summary */}
        <section className="mt-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Your monthly cashflow summary</h2>
            <div className="w-full bg-gray-200 rounded-full h-8 flex text-white font-bold text-sm">
                <div className="bg-red-500 flex items-center justify-center rounded-l-full" style={{ width: `${100-surplusPercentage}%` }}>
                    {formatCurrency(data.cashflow.totalMonthlyExpenses)}
                </div>
                <div className="bg-green-500 flex items-center justify-center rounded-r-full relative" style={{ width: `${surplusPercentage}%` }}>
                    {formatCurrency(data.cashflow.investibleSurplus)}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-center">
                        <p className="text-green-600 font-semibold text-xs whitespace-nowrap">This is what you must invest!</p>
                        <div className="h-4 border-l-2 border-dashed border-green-500 mx-auto w-0"></div>
                    </div>
                </div>
            </div>
            <div className="flex justify-between text-xs mt-1 px-1">
                <p className="font-semibold">Total Expenses</p>
                <p className="font-semibold text-green-600">Investible Surplus</p>
            </div>
        </section>

        {/* Investment Status */}
        <section className="mt-10">
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-center">
                <p className="font-semibold text-yellow-800">
                    You are currently underinvesting and need an additional SIP of <span className="font-bold text-lg">{formatCurrency(additionalSipRequired)}</span> per month to stay on track and achieve your goals.
                </p>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-4">
                <div className="border border-gray-200 rounded-lg p-3 text-center">
                    <h3 className="font-semibold text-gray-600">What I am investing</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(data.investmentStatus.currentInvestment)}</p>
                </div>
                <div className="border border-green-400 bg-green-50 rounded-lg p-3 text-center">
                    <h3 className="font-semibold text-green-800">What I must invest</h3>
                    <p className="text-2xl font-bold text-green-800 mt-1">{formatCurrency(data.investmentStatus.requiredInvestment)}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 text-center">
                    <h3 className="font-semibold text-gray-600">What I can invest</h3>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(data.investmentStatus.potentialInvestment)}</p>
                </div>
            </div>
             <p className="text-xs text-gray-500 mt-2 text-center">The 'What I can invest' indicates your maximum potential monthly SIP, enabling you to fast-track your progress toward achieving your goals.</p>
        </section>

        {/* Goals */}
        <section className="mt-6">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Goals</h2>
            <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900">{data.primaryGoal.name}</h3>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(data.primaryGoal.targetCorpus)}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                    <div>
                        <p className="text-sm text-gray-600">Expected in <span className="font-bold text-lg text-red-600">{data.primaryGoal.timeline.current} Yrs</span></p>
                        <p className="text-xs text-gray-500">With {formatCurrency(data.investmentStatus.currentInvestment)}/month</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-600">Achievable in <span className="font-bold text-lg text-yellow-600">{data.primaryGoal.timeline.required} Yrs</span></p>
                        <p className="text-xs text-gray-500">With {formatCurrency(data.investmentStatus.requiredInvestment)}/month</p>
                    </div>
                     <div>
                        <p className="text-sm text-gray-600">Achievable in <span className="font-bold text-lg text-green-600">{data.primaryGoal.timeline.potential} Yrs</span></p>
                        <p className="text-xs text-gray-500">With {formatCurrency(data.investmentStatus.potentialInvestment)}/month</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Detailed Tables */}
        <section className="mt-6 grid grid-cols-2 gap-6">
            <div>
                <h3 className="font-semibold mb-2 text-gray-800">Income & Expenses</h3>
                <table className="w-full text-sm">
                    <tbody>
                        <tr className="border-b"><td className="py-1.5">Total monthly income</td><td className="text-right font-medium">{formatCurrency(data.detailedTables.incomeExpenses.totalMonthlyIncome)}</td></tr>
                        <tr className="border-b"><td className="py-1.5">Monthly fixed expenses</td><td className="text-right font-medium">{formatCurrency(data.detailedTables.incomeExpenses.fixedExpenses)}</td></tr>
                        <tr className="border-b"><td className="py-1.5">Monthly expenses towards EMI</td><td className="text-right font-medium">{formatCurrency(data.detailedTables.incomeExpenses.emiExpenses)}</td></tr>
                        <tr><td className="py-1.5">Other expenses</td><td className="text-right font-medium">{formatCurrency(data.detailedTables.incomeExpenses.otherExpenses)}</td></tr>
                    </tbody>
                </table>
            </div>
            <div>
                <h3 className="font-semibold mb-2 text-gray-800">Current corpus and monthly investments</h3>
                 <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-left text-gray-500 font-medium">
                           <th className="py-1.5 font-medium">Asset name</th>
                           <th className="py-1.5 font-medium text-right">Current corpus</th>
                           <th className="py-1.5 font-medium text-right">Monthly investments</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b"><td className="py-1.5">Mutual funds</td><td className="text-right font-medium">{formatCurrency(data.detailedTables.assetAllocation.mutualFunds.corpus)}</td><td className="text-right font-medium">{formatCurrency(data.detailedTables.assetAllocation.mutualFunds.monthly)}</td></tr>
                        <tr className="border-b"><td className="py-1.5">Gold</td><td className="text-right font-medium">{formatCurrency(data.detailedTables.assetAllocation.gold.corpus)}</td><td className="text-right font-medium">{formatCurrency(data.detailedTables.assetAllocation.gold.monthly)}</td></tr>
                        <tr className="border-b"><td className="py-1.5">Stocks</td><td className="text-right font-medium">{formatCurrency(data.detailedTables.assetAllocation.stocks.corpus)}</td><td className="text-right font-medium">{formatCurrency(data.detailedTables.assetAllocation.stocks.monthly)}</td></tr>
                        <tr><td className="py-1.5">Fixed Deposits</td><td className="text-right font-medium">{formatCurrency(data.detailedTables.assetAllocation.fixedDeposits.corpus)}</td><td className="text-right font-medium">{formatCurrency(data.detailedTables.assetAllocation.fixedDeposits.monthly)}</td></tr>
                    </tbody>
                </table>
            </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t-2 border-gray-200 text-center">
            <p className="font-bold text-green-700">You can comfortably increase your SIP to meet and exceed your goals. Consider a higher SIP amount.</p>
            <p className="text-xs text-gray-500 mt-2">
                <strong>Disclaimer:</strong> The calculators are based on past returns and meant for Illustration purposes only. This information is not investment advice. Mutual Fund investments are subject to market risks, read all scheme related documents carefully. Consult your financial advisor before investing.
            </p>
        </footer>
      </div>
    </div>
  );
}
