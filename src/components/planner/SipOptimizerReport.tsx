
"use client";

import type { SipOptimizerReportData, SipOptimizerGoal } from '@/lib/types';
import { Button } from '../ui/button';
import { Printer, Phone, Mail, User, Calendar, Users, Target, ArrowRight, AlertTriangle, Info, Goal as GoalIcon, Download } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface Props {
  data: SipOptimizerReportData;
}

const formatCurrency = (value: number | '', prefix = '₹') => {
    const num = typeof value === 'number' ? value : 0;
    return `${prefix}${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
        return format(new Date(dateString), "dd MMM yyyy");
    } catch {
        return dateString;
    }
};

const formatYears = (years: number) => {
    if (!isFinite(years) || years <= 0 || isNaN(years)) return 'N/A';
    const y = Math.floor(years);
    const m = Math.round((years - y) * 12);
    if (y > 0 && m > 0) return `${y}Y ${m}M`;
    if (y > 0) return `${y}Y`;
    if (m > 0) return `${m}M`;
    return '0M';
}

const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-center text-sm gap-2">
        <Icon className="h-4 w-4 text-gray-400" />
        <span className="text-gray-600">{label}:</span>
        <span className="font-semibold text-gray-800">{value}</span>
    </div>
);


export function SipOptimizerReport({ data }: Props) {
  const router = useRouter();
  const handlePrint = () => {
    window.print();
  };
  
  const additionalSipRequired = data.totalInvestmentStatus
    ? Math.max(0, data.totalInvestmentStatus.requiredInvestment - data.totalInvestmentStatus.currentInvestment)
    : 0;
  
  const handleViewDetailedReport = () => {
    router.push('/report');
  };

  const renderGoalTimeline = (goal: SipOptimizerGoal) => (
      <div className="relative pl-8 pr-4 mt-2">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          {/* Goal Header */}
          <div className="flex items-center gap-4">
              <div className="flex-shrink-0 z-10 p-1.5 bg-white border-2 border-blue-600 rounded-full">
                  <GoalIcon className="h-5 w-5 text-blue-600"/>
              </div>
              <p className="font-bold text-blue-800">{goal.name}</p>
              <p className="ml-auto font-bold text-blue-800 roboto">{formatCurrency(goal.futureValue)}</p>
          </div>

          {/* Timelines */}
          <div className="pl-12 mt-2 space-y-2 text-xs">
              <div className="relative">
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 h-0.5 bg-red-200" style={{width: '100%'}}></div>
                  <div className="absolute top-1/2 -translate-y-1/2 -left-1 h-2 w-2 bg-red-500 rounded-full z-10"></div>
                  <p className="relative z-20 bg-white inline-block pr-2">Expected in <span className="font-bold">{formatYears(goal.timeline.current)}</span> with {formatCurrency(goal.investmentStatus.currentInvestment)}/month</p>
              </div>
              <div className="relative">
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 h-0.5 bg-orange-200" style={{width: '75%'}}></div>
                  <div className="absolute top-1/2 -translate-y-1/2 left-[calc(75%-8px)] h-2 w-2 bg-orange-500 rounded-full z-10"></div>
                  <p className="relative z-20 bg-white inline-block pr-2">Achievable in <span className="font-bold">{formatYears(goal.timeline.required)}</span> with {formatCurrency(goal.investmentStatus.requiredInvestment)}/month</p>
              </div>
               <div className="relative">
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 h-0.5 bg-green-200" style={{width: '50%'}}></div>
                  <div className="absolute top-1/2 -translate-y-1/2 left-[calc(50%-8px)] h-2 w-2 bg-green-500 rounded-full z-10"></div>
                  <p className="relative z-20 bg-white inline-block pr-2">Achievable in <span className="font-bold">{formatYears(goal.timeline.potential)}</span> with {formatCurrency(goal.investmentStatus.potentialInvestment)}/month</p>
              </div>
          </div>
      </div>
  )


  return (
    <div id="report-section" className="bg-gray-100 text-gray-800 font-sans">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap');
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
      
      <div className="container mx-auto flex justify-end p-4 gap-4 no-print">
        <Button onClick={handleViewDetailedReport} variant="outline">
            View Detailed Report
            <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button onClick={handlePrint}>
            <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      </div>

      <div id="report-container" className="w-[210mm] min-h-[297mm] mx-auto p-6 shadow-2xl border bg-white flex flex-col">
        {/* Header */}
        <header style={{ background: 'linear-gradient(to right, #002554, #003a7a)', color: 'white' }} className="p-4 rounded-t-lg">
            <div className="flex justify-between items-center">
                <div className="relative h-12 w-36">
                    <Image 
                        src="/financial-friend-logo.png" 
                        alt="FinFriend Planner Logo" 
                        fill
                        style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
                        priority
                    />
                </div>
                <div className="text-right text-xs">
                    <p><strong>ARN name:</strong> {data.advisorDetails.arnName}</p>
                    <p><strong>ARN no:</strong> {data.advisorDetails.arnNo}</p>
                    <p><strong>Mobile no:</strong> {data.advisorDetails.mobile}</p>
                    <p><strong>Email:</strong> {data.advisorDetails.email}</p>
                </div>
            </div>
        </header>

        <section className="text-center py-4 bg-white">
            <h1 className="text-xl font-bold text-gray-800 tracking-wide">SIP Optimizer Report</h1>
        </section>

        {/* Investor Details */}
        <section className="bg-white p-4 border rounded-lg shadow-sm">
            <h2 className="font-bold text-gray-700 mb-3">Investor details</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <InfoRow icon={User} label="Name" value={data.personalDetails.name} />
                <InfoRow icon={Target} label="Retirement age" value={data.personalDetails.retirementAge} />
                <InfoRow icon={Calendar} label="Date of birth" value={formatDate(data.personalDetails.dob)} />
                <InfoRow icon={Phone} label="Mobile no." value={data.personalDetails.mobile} />
                <InfoRow icon={Users} label="Dependents" value={data.personalDetails.dependents} />
                <InfoRow icon={Mail} label="Email Id" value={data.personalDetails.email} />
            </div>
        </section>

        {/* Underinvesting Section */}
        {data.totalInvestmentStatus && (
        <section className="mt-4">
             <div className="text-red-600 font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5"/>
                <h3>Underinvesting</h3>
            </div>
            <p className="text-sm mt-1">
                You are currently underinvesting and need an additional SIP of 
                <span className="font-bold text-red-600 bg-red-100 rounded-md px-1.5 py-0.5 mx-1">{formatCurrency(additionalSipRequired)}</span>
                 per month to stay on track and achieve your goals.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-3 text-center text-xs">
                <div className="border border-red-200 bg-red-50 p-2 rounded-lg">
                    <p className="text-gray-600">What I am investing</p>
                    <p className="font-bold text-red-700 roboto text-lg mt-1">{formatCurrency(data.totalInvestmentStatus.currentInvestment)}</p>
                    <p className="text-gray-500">Monthly</p>
                </div>
                <div className="border border-orange-200 bg-orange-50 p-2 rounded-lg">
                    <p className="text-gray-600">What I must invest</p>
                    <p className="font-bold text-orange-700 roboto text-lg mt-1">{formatCurrency(data.totalInvestmentStatus.requiredInvestment)}</p>
                    <p className="text-gray-500">Monthly</p>
                </div>
                <div className="border border-green-200 bg-green-50 p-2 rounded-lg">
                    <p className="text-gray-600">What I can invest</p>
                    <p className="font-bold text-green-700 roboto text-lg mt-1">{formatCurrency(data.totalInvestmentStatus.potentialInvestment)}</p>
                    <p className="text-gray-500">Monthly</p>
                </div>
            </div>
             <p className="text-xs text-gray-500 mt-2 text-left">The "What I can invest" indicates your maximum potential monthly SIP, enabling you to fast-track your progress toward achieving your goals.</p>
        </section>
        )}

        {/* Timeline Visual */}
         <section className="mt-4">
             {Array.isArray(data.goals) && data.goals.map(goal => (
                <div key={goal.id} className="mt-4 first:mt-0">
                    {renderGoalTimeline(goal)}
                </div>
            ))}
             <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 p-2 bg-gray-50 rounded-lg">
                <Info className="h-4 w-4 mt-0.5 shrink-0"/>
                <p>To help you reach all your goals, your investable surplus is divided based on each goal's target amount.</p>
            </div>
        </section>

        {/* Monthly Cashflow Summary */}
        <section className="mt-4">
             <div className="p-3 rounded-lg bg-gray-100 text-center">
                <h3 className="font-bold text-gray-700">Your monthly cashflow summary</h3>
            </div>
            <div className="mt-3 relative h-8 bg-gray-200 rounded-full overflow-hidden">
                <div className="absolute inset-0 flex">
                    <div className="bg-red-400 h-full" style={{ width: `${(data.cashflow.totalMonthlyExpenses / data.cashflow.totalMonthlyIncome) * 100}%` }}></div>
                    <div className="bg-green-400 h-full" style={{ width: `${(data.cashflow.investibleSurplus / data.cashflow.totalMonthlyIncome) * 100}%` }}></div>
                </div>
                 <div className="absolute inset-0 flex justify-between items-center px-4 text-white text-xs font-bold">
                    <span>Total expenses ({formatCurrency(data.cashflow.totalMonthlyExpenses)})</span>
                    <span>Investible Surplus ({formatCurrency(data.cashflow.investibleSurplus)})</span>
                </div>
            </div>
             <div className="flex justify-between mt-1 text-xs">
                <span>Total income ({formatCurrency(data.cashflow.totalMonthlyIncome)})</span>
                <span>This is what you must invest!</span>
             </div>
        </section>

        {/* Goals Table */}
        <section className="mt-4">
            <h2 className="font-bold text-gray-700 mb-2">Goals</h2>
            <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="text-left">
                            <th className="p-2 font-semibold">Goal Name</th>
                            <th className="p-2 font-semibold text-center bg-red-50">What I am investing / Month</th>
                            <th className="p-2 font-semibold text-center bg-orange-50">What I must invest / Month</th>
                            <th className="p-2 font-semibold text-center bg-green-50">What I can invest / Month</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(data.goals) && data.goals.map(goal => (
                            <tr key={goal.id} className="border-b">
                                <td className="p-2 font-semibold align-top">{goal.name}</td>
                                <td className="p-2 bg-red-50">
                                    <div className="grid grid-flow-row sm:grid-cols-3 text-center gap-1">
                                        <div><span className="font-bold roboto">{formatCurrency(goal.investmentStatus.currentInvestment)}</span><p className="text-gray-500 text-[10px]">Current SIP</p></div>
                                        <div><span className="font-bold roboto">{formatYears(goal.timeline.current)}</span><p className="text-gray-500 text-[10px]">Time</p></div>
                                        <div><span className="font-bold roboto">{formatCurrency(goal.targetCorpus)}</span><p className="text-gray-500 text-[10px]">Goal amt</p></div>
                                    </div>
                                </td>
                                <td className="p-2 bg-orange-50">
                                    <div className="grid grid-flow-row sm:grid-cols-3 text-center gap-1">
                                        <div><span className="font-bold roboto">{formatCurrency(goal.investmentStatus.requiredInvestment)}</span><p className="text-gray-500 text-[10px]">Required SIP</p></div>
                                        <div><span className="font-bold roboto">{formatYears(goal.timeline.required)}</span><p className="text-gray-500 text-[10px]">Time</p></div>
                                        <div><span className="font-bold roboto">{formatCurrency(goal.futureValue)}</span><p className="text-gray-500 text-[10px]">Expected Corpus</p></div>
                                    </div>
                                </td>
                                <td className="p-2 bg-green-50">
                                    <div className="grid grid-flow-row sm:grid-cols-3 text-center gap-1">
                                        <div><span className="font-bold roboto">{formatCurrency(goal.investmentStatus.potentialInvestment)}</span><p className="text-gray-500 text-[10px]">Potential SIP</p></div>
                                        <div><span className="font-bold roboto">{formatYears(goal.timeline.potential)}</span><p className="text-gray-500 text-[10px]">Time</p></div>
                                        <div><span className="font-bold roboto">{formatCurrency(goal.futureValue)}</span><p className="text-gray-500 text-[10px]">Expected Corpus</p></div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>

        {/* Detailed Tables */}
        {data.detailedTables && (
        <section className="mt-4 grid grid-cols-2 gap-6 text-sm flex-grow">
            <div>
                <h3 className="font-bold mb-2 text-gray-700">Income & expenses</h3>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><p>Total monthly income</p><p className="font-bold roboto">{formatCurrency(data.detailedTables.incomeExpenses.totalMonthlyIncome)}</p></div>
                    <div className="flex justify-between"><p>Monthly fixed expenses</p><p className="font-bold roboto">{formatCurrency(data.detailedTables.incomeExpenses.fixedExpenses)}</p></div>
                    <div className="flex justify-between"><p>Monthly expenses towards EMI</p><p className="font-bold roboto">{formatCurrency(data.detailedTables.incomeExpenses.emiExpenses)}</p></div>
                    <div className="flex justify-between"><p>Other expenses</p><p className="font-bold roboto">{formatCurrency(data.detailedTables.incomeExpenses.otherExpenses)}</p></div>
                </div>
            </div>
            <div>
                <h3 className="font-bold mb-2 text-gray-700">Current corpus and monthly investments</h3>
                 <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                        <tr className="text-left text-gray-600 font-semibold">
                           <th className="py-1 px-2 font-semibold">Asset name</th>
                           <th className="py-1 px-2 font-semibold text-right">Current corpus</th>
                           <th className="py-1 px-2 font-semibold text-right">Monthly investments</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b"><td className="py-1 px-2">Mutual funds</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.mutualFunds.corpus)}</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.mutualFunds.monthly)}</td></tr>
                        <tr className="border-b"><td className="py-1 px-2">Gold</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.gold.corpus)}</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.gold.monthly)}</td></tr>
                        <tr className="border-b"><td className="py-1 px-2">Stocks</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.stocks.corpus)}</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.stocks.monthly)}</td></tr>
                        <tr className="border-b"><td className="py-1 px-2">Fixed Deposits</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.fixedDeposits.corpus)}</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.fixedDeposits.monthly)}</td></tr>
                        <tr className="border-b"><td className="py-1 px-2">Others</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.others.corpus)}</td><td className="text-right font-medium roboto">{formatCurrency(data.detailedTables.assetAllocation.others.monthly)}</td></tr>
                        <tr className="bg-gray-100 font-bold"><td className="py-1 px-2">Total</td><td className="text-right font-bold roboto">{formatCurrency(data.detailedTables.assetAllocation.total.corpus)}</td><td className="text-right font-bold roboto">{formatCurrency(data.detailedTables.assetAllocation.total.monthly)}</td></tr>
                    </tbody>
                </table>
            </div>
        </section>
        )}
        
        <footer className="mt-auto pt-4 border-t-2 border-gray-300">
            <p className="text-xs text-gray-500 text-center leading-tight">
                <strong>Disclaimer:</strong> The calculators are based on past returns and meant for Illustration purposes only. This information is not investment advice. Mutual Fund investments are subject to market risks, read all scheme related documents carefully. Consult your financial advisor before investing.
            </p>
        </footer>
      </div>
    </div>
  );
}
