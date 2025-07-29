
"use client";

import type { SipOptimizerReportData } from '@/lib/types';
import { Button } from '../ui/button';
import { Printer, Phone, Mail, User, Calendar, Users, Target, Wallet, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { useRouter } from 'next/navigation';

interface Props {
  data: SipOptimizerReportData;
}

const formatCurrency = (value: number | '', prefix = '₹') => {
    const num = typeof value === 'number' ? value : 0;
    return `${prefix}${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center text-sm">
        <Icon className="h-4 w-4 mr-2 text-gray-500" />
        <span className="font-medium text-gray-600">{label}:</span>
        <span className="ml-2 text-gray-800 font-semibold">{value}</span>
    </div>
);


export function SipOptimizerReport({ data }: Props) {
  const router = useRouter();
  const handlePrint = () => {
    window.print();
  };
  
  const additionalSipRequired = Math.max(0, data.investmentStatus.requiredInvestment - data.investmentStatus.currentInvestment);
  
  const handleViewDetailedReport = () => {
    router.push('/report');
  };

  return (
    <div id="report-section" className="bg-gray-50 text-gray-800 font-sans">
      <style jsx global>{`
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
            background: white;
          }
        }
        #report-container * {
            font-family: 'Poppins', sans-serif;
        }
        .roboto {
            font-family: 'Roboto', sans-serif;
        }
      `}</style>
      
      <div className="flex justify-end p-4 gap-4 no-print">
         <Button onClick={handleViewDetailedReport} variant="secondary">
            View Detailed Wellness Report
            <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      <div id="report-container" className="w-[210mm] min-h-[297mm] mx-auto p-8 shadow-2xl border bg-white">
        {/* Header */}
        <header className="flex justify-between items-start pb-4 border-b-2 border-gray-200">
            <div className="relative h-16 w-48">
              <Image 
                  src="/financial-friend-logo.png" 
                  alt="FinFriend Planner Logo" 
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
              />
            </div>
            <div className="text-right">
                <p className="font-bold text-lg text-gray-900">RM NAME: {data.advisorDetails.arnName}</p>
                <div className="text-sm text-gray-600 mt-1 space-y-1">
                    <p className="flex items-center justify-end gap-2"><Phone size={14} /> {data.advisorDetails.mobile}</p>
                    <p className="flex items-center justify-end gap-2"><Mail size={14} /> {data.advisorDetails.email}</p>
                </div>
            </div>
        </header>

        <section className="text-center my-6">
            <h1 className="text-3xl font-bold text-gray-800 tracking-wide">SIP Optimizer Report</h1>
        </section>

        {/* Investor Details & Net Worth */}
        <section className="grid grid-cols-5 gap-6">
            <Card className="col-span-3 bg-gray-50 border-gray-200">
                <CardHeader>
                    <CardTitle className="text-base">Investor Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <InfoRow icon={User} label="Name" value={data.personalDetails.name} />
                    <InfoRow icon={Calendar} label="Date of Birth" value={data.personalDetails.dob} />
                    <InfoRow icon={Users} label="Dependents" value={data.personalDetails.dependents} />
                    <InfoRow icon={Target} label="Retirement Age" value={data.personalDetails.retirementAge} />
                    <InfoRow icon={Phone} label="Mobile" value={data.personalDetails.mobile} />
                    <InfoRow icon={Mail} label="Email" value={data.personalDetails.email} />
                </CardContent>
            </Card>
            <Card className="col-span-2 bg-blue-50 border-blue-200 flex flex-col justify-center items-center">
                 <CardHeader className="p-2 text-center">
                    <CardTitle className="text-base text-blue-800">Investor's Net Worth</CardTitle>
                 </CardHeader>
                 <CardContent className="p-2 text-center">
                    <p className="text-4xl font-bold text-blue-900 roboto">{formatCurrency(data.netWorth, '₹ ')}</p>
                 </CardContent>
            </Card>
        </section>

        {/* Cashflow & Investment Status */}
        <section className="mt-6">
             <div className="grid grid-cols-3 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h3 className="text-sm font-semibold text-green-800">Total Monthly Income</h3>
                    <p className="text-2xl font-bold text-green-900 roboto mt-1">{formatCurrency(data.cashflow.totalMonthlyIncome)}</p>
                </div>
                 <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <h3 className="text-sm font-semibold text-red-800">Monthly Cash Outflows</h3>
                    <p className="text-2xl font-bold text-red-900 roboto mt-1">{formatCurrency(data.cashflow.totalMonthlyExpenses)}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h3 className="text-sm font-semibold text-blue-800">Investible Surplus</h3>
                    <p className="text-2xl font-bold text-blue-900 roboto mt-1">{formatCurrency(data.cashflow.investibleSurplus)}</p>
                </div>
            </div>
        </section>

        {/* Underinvesting Section */}
        <section className="mt-6">
             <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4" role="alert">
                <p className="font-bold">You are currently underinvesting and need an additional SIP of {formatCurrency(additionalSipRequired)} per month to stay on track and achieve your goals.</p>
            </div>
             <div className="grid grid-cols-3 gap-6 mt-4">
                <div className="text-center border p-3 rounded-lg shadow-sm">
                    <h3 className="font-semibold text-gray-700">What I am investing/month</h3>
                    <p className="text-2xl font-bold text-gray-800 roboto mt-1">{formatCurrency(data.investmentStatus.currentInvestment)}</p>
                </div>
                 <div className="text-center border p-3 rounded-lg shadow-sm bg-yellow-50 border-yellow-300">
                    <h3 className="font-semibold text-yellow-800">What I must invest/month</h3>
                    <p className="text-2xl font-bold text-yellow-900 roboto mt-1">{formatCurrency(data.investmentStatus.requiredInvestment)}</p>
                </div>
                 <div className="text-center border p-3 rounded-lg shadow-sm">
                    <h3 className="font-semibold text-gray-700">What I can invest/month</h3>
                    <p className="text-2xl font-bold text-gray-800 roboto mt-1">{formatCurrency(data.investmentStatus.potentialInvestment)}</p>
                </div>
            </div>
             <p className="text-xs text-gray-500 mt-2 text-center">The 'What I can invest' indicates your maximum potential monthly SIP, enabling you to fast-track your progress toward achieving your goals.</p>
        </section>
        
        {/* Goals Section */}
        <section className="mt-6">
            <h2 className="text-xl font-bold mb-3 text-gray-800">Goals</h2>
            <Card className="border-gray-200">
                <CardContent className="p-4">
                     <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900">{data.primaryGoal.name}</h3>
                        <p className="text-lg font-bold text-gray-900 roboto">{formatCurrency(data.primaryGoal.targetCorpus)}</p>
                    </div>
                    <Separator className="my-3"/>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-gray-600">Expected in <span className="font-bold text-lg text-red-600 roboto">{data.primaryGoal.timeline.current} Yrs</span></p>
                            <p className="text-xs text-gray-500">With {formatCurrency(data.investmentStatus.currentInvestment)}/month</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Achievable in <span className="font-bold text-lg text-yellow-600 roboto">{data.primaryGoal.timeline.required} Yrs</span></p>
                            <p className="text-xs text-gray-500">With {formatCurrency(data.investmentStatus.requiredInvestment)}/month</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Achievable in <span className="font-bold text-lg text-green-600 roboto">{data.primaryGoal.timeline.potential} Yrs</span></p>
                            <p className="text-xs text-gray-500">With {formatCurrency(data.investmentStatus.potentialInvestment)}/month</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </section>

        {/* Detailed Tables */}
        <section className="mt-6 grid grid-cols-2 gap-6">
            <div>
                <h3 className="font-semibold mb-2 text-gray-800">Income & Expenses</h3>
                <table className="w-full text-sm text-left">
                    <tbody>
                        <tr className="border-b"><td className="py-2">Total monthly income</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.incomeExpenses.totalMonthlyIncome)}</td></tr>
                        <tr className="border-b"><td className="py-2">Monthly fixed expenses</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.incomeExpenses.fixedExpenses)}</td></tr>
                        <tr className="border-b"><td className="py-2">Monthly expenses towards EMI</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.incomeExpenses.emiExpenses)}</td></tr>
                        <tr><td className="py-2">Other expenses</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.incomeExpenses.otherExpenses)}</td></tr>
                    </tbody>
                </table>
            </div>
            <div>
                <h3 className="font-semibold mb-2 text-gray-800">Current corpus and monthly investments</h3>
                 <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr className="border-b text-left text-gray-600 font-semibold">
                           <th className="py-2 px-2 font-semibold">Asset name</th>
                           <th className="py-2 px-2 font-semibold text-right">Current corpus</th>
                           <th className="py-2 px-2 font-semibold text-right">Monthly investments</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b"><td className="py-2 px-2">Mutual funds</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.mutualFunds.corpus)}</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.mutualFunds.monthly)}</td></tr>
                        <tr className="border-b"><td className="py-2 px-2">Gold</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.gold.corpus)}</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.gold.monthly)}</td></tr>
                        <tr className="border-b"><td className="py-2 px-2">Stocks</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.stocks.corpus)}</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.stocks.monthly)}</td></tr>
                        <tr><td className="py-2 px-2">Fixed Deposits</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.fixedDeposits.corpus)}</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.fixedDeposits.monthly)}</td></tr>
                    </tbody>
                </table>
            </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t-2 border-gray-200 text-center">
            <p className="font-bold text-green-700">You can comfortably increase your SIP to meet and exceed your goals. Consider a higher SIP amount.</p>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                <strong>Disclaimer:</strong> The calculators are based on past returns and meant for Illustration purposes only. This information is not investment advice. Mutual Fund investments are subject to market risks, read all scheme related documents carefully. Consult your financial advisor before investing.
            </p>
        </footer>
      </div>
    </div>
  );
}
