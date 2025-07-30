
"use client";

import type { SipOptimizerReportData, SipOptimizerGoal } from '@/lib/types';
import { Button } from '../ui/button';
import { Printer, Phone, Mail, User, Calendar, Users, Target, ArrowRight, AlertTriangle, Info, Goal as GoalIcon, Download, ShieldCheck, Wallet, PiggyBank } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import type jsPDF from 'jspdf';
import type html2canvas from 'html2canvas';

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

  const handleDownloadPdf = async () => {
    const input = document.getElementById('report-container');
    if (input) {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      const originalHeight = input.style.height;
      input.style.height = `${input.scrollHeight}px`;

      html2canvas(input, {
        scale: 2,
        useCORS: true,
        logging: true,
        height: input.scrollHeight,
        windowHeight: input.scrollHeight
      }).then(canvas => {
        input.style.height = originalHeight;
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;
        const pdfAspectRatio = pdfWidth / pdfHeight;

        let renderWidth = pdfWidth;
        let renderHeight = pdfWidth / canvasAspectRatio;

        const totalPdfHeight = canvasHeight * pdfWidth / canvasWidth;
        let y = 0;
        let position = 0;
        const pageHeight = pdf.internal.pageSize.height;
        
        while (position < canvasHeight) {
          const remainingHeight = canvasHeight - position;
          const imgHeightOnPage = Math.min(remainingHeight, canvas.width * pageHeight / canvas.width);
          
          pdf.addImage(
            imgData,
            'PNG',
            0,
            -position * (pdfWidth / canvasWidth),
            pdfWidth,
            totalPdfHeight
          );

          position += imgHeightOnPage;

          if (position < canvasHeight) {
            pdf.addPage();
          }
        }

        const customPdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [pdfWidth, totalPdfHeight]
        });

        customPdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, totalPdfHeight);
        customPdf.save('sip-optimizer-report.pdf');
      });
    }
  };

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
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Comic+Sans+MS&display=swap');
        
        #report-container * {
            font-family: 'Comic Sans MS', 'Roboto', sans-serif !important;
        }
        .roboto {
            font-family: 'Roboto', sans-serif !important;
        }

        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            background-color: white;
          }
          .no-print {
            display: none !important;
          }
          #report-section {
            padding: 0;
            margin: 0;
            background: none;
          }
          #report-container {
            width: 100%;
            height: auto;
            margin: 0;
            padding: 1cm;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            transform: scale(1);
            min-height: 0;
          }
          #report-container * {
             font-size: 10px !important;
             line-height: 1.2 !important;
          }
           #report-container h1 { font-size: 16px !important; }
           #report-container h2 { font-size: 14px !important; }
           #report-container h3 { font-size: 12px !important; }
           #report-container h4 { font-size: 11px !important; }
           #report-container section {
             margin-top: 0.5rem !important;
             padding-top: 0 !important;
             break-inside: avoid;
           }
           .print-avoid-break {
             break-inside: avoid;
           }
        }
      `}</style>
      
      <div className="container mx-auto flex justify-end p-4 gap-4 no-print">
        <Button onClick={handleViewDetailedReport} variant="outline">
            View Detailed Report
            <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button onClick={handleDownloadPdf}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
        </Button>
        <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
        </Button>
      </div>

      <div id="report-container" className="w-[210mm] min-h-[297mm] mx-auto p-6 shadow-2xl border flex flex-col" style={{
        background: "linear-gradient(to bottom, #FEE7E7, #FFFFFF 60%, #FFFFFF 40%, #FFFFFF 10%)"
      }}>
        {/* Header */}
        <header className="p-4 rounded-t-lg bg-pink-100 print-avoid-break">
            <div className="text-center text-xs">
                <p><strong>RM name:</strong> Gunjan Kataria</p>
                <p><strong>Mobile no:</strong> 9460825477</p>
                <p><strong>Email:</strong> contact@financialfriend.in</p>
            </div>
        </header>

        <section className="text-center py-4 bg-white print-avoid-break">
            <h1 className="text-xl font-bold text-gray-800 tracking-wide">SIP Optimizer Report</h1>
        </section>

        {/* Investor Details */}
        <section className="bg-white p-4 border rounded-lg shadow-sm print-avoid-break">
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
        
        {/* Net Worth */}
        <section className="mt-4 print-avoid-break">
             <div className="p-3 rounded-lg bg-gray-100 text-center">
                <h3 className="font-bold text-gray-700">Your Net Worth</h3>
            </div>
            <div className="mt-3 text-center">
                <p className="text-4xl font-bold roboto text-blue-700">{formatCurrency(data.netWorth)}</p>
            </div>
        </section>

        {/* Monthly Cashflow Summary */}
        <section className="mt-4 print-avoid-break">
             <div className="p-3 rounded-lg bg-gray-100 text-center">
                <h3 className="font-bold text-gray-700">Your Monthly Cashflow Summary</h3>
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
        
        {/* Underinvesting Section */}
        {data.totalInvestmentStatus && (
        <section className="mt-4 print-avoid-break">
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

        {/* Goal Planning */}
        <section className="mt-4 print-avoid-break">
            <h2 className="font-bold text-gray-700 mb-2">Goal Planning</h2>
            {/* Timeline Visual */}
             {Array.isArray(data.goals) && data.goals.length > 0 && data.goals.map(goal => (
                <div key={goal.id} className="mt-4 first:mt-0">
                    {renderGoalTimeline(goal)}
                </div>
            ))}
             <div className="mt-3 flex items-start gap-2 text-xs text-gray-500 p-2 bg-gray-50 rounded-lg">
                <Info className="h-4 w-4 mt-0.5 shrink-0"/>
                <p>To help you reach all your goals, your investable surplus is divided based on each goal's target amount.</p>
            </div>
        </section>

        {/* Goals Table */}
        <section className="mt-4 print-avoid-break">
            <h2 className="font-bold text-gray-700 mb-2">Goals Breakdown</h2>
            <div className="overflow-x-auto text-xs space-y-4">
                {Array.isArray(data.goals) && data.goals.length > 0 && data.goals.map(goal => (
                     <div key={goal.id} className="border-b pb-4 last:border-b-0">
                        <h3 className="font-bold text-base text-gray-800 mb-2">{goal.name}</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-2 rounded-lg border border-red-200 bg-red-50">
                                <h4 className="text-center font-semibold text-red-700 mb-2">What I am investing / Month</h4>
                                <div className="flex flex-col items-center text-center space-y-1">
                                    <div className="flex flex-col"><span className="text-gray-500 text-[10px]">Current SIP</span><span className="font-bold roboto text-sm">{formatCurrency(goal.investmentStatus.currentInvestment)}</span></div>
                                    <div className="flex flex-col"><span className="text-gray-500 text-[10px]">Time</span><span className="font-bold roboto text-sm">{formatYears(goal.timeline.current)}</span></div>
                                    <div className="flex flex-col"><span className="text-gray-500 text-[10px]">Goal amt</span><span className="font-bold roboto text-sm">{formatCurrency(goal.targetCorpus)}</span></div>
                                </div>
                            </div>
                            <div className="p-2 rounded-lg border border-orange-200 bg-orange-50">
                                <h4 className="text-center font-semibold text-orange-700 mb-2">What I must invest / Month</h4>
                                <div className="flex flex-col items-center text-center space-y-1">
                                    <div className="flex flex-col"><span className="text-gray-500 text-[10px]">Required SIP</span><span className="font-bold roboto text-sm">{formatCurrency(goal.investmentStatus.requiredInvestment)}</span></div>
                                    <div className="flex flex-col"><span className="text-gray-500 text-[10px]">Time</span><span className="font-bold roboto text-sm">{formatYears(goal.timeline.required)}</span></div>
                                    <div className="flex flex-col"><span className="text-gray-500 text-[10px]">Expected Corpus</span><span className="font-bold roboto text-sm">{formatCurrency(goal.futureValue)}</span></div>
                                </div>
                            </div>
                             <div className="p-2 rounded-lg border border-green-200 bg-green-50">
                                <h4 className="text-center font-semibold text-green-700 mb-2">What I can invest / Month</h4>
                                <div className="flex flex-col items-center text-center space-y-1">
                                    <div className="flex flex-col"><span className="text-gray-500 text-[10px]">Potential SIP</span><span className="font-bold roboto text-sm">{formatCurrency(goal.investmentStatus.potentialInvestment)}</span></div>
                                    <div className="flex flex-col"><span className="text-gray-500 text-[10px]">Time</span><span className="font-bold roboto text-sm">{formatYears(goal.timeline.potential)}</span></div>
                                    <div className="flex flex-col"><span className="text-gray-500 text-[10px]">Expected Corpus</span><span className="font-bold roboto text-sm">{formatCurrency(goal.futureValue)}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Insurance Analysis */}
        {data.insuranceAnalysis && (
        <section className="mt-4 print-avoid-break">
            <h2 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-gray-500"/>Insurance Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="border rounded-lg p-3 bg-blue-50/50">
                    <h3 className="font-semibold text-blue-800 mb-2">Life Insurance</h3>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><p>Ideal Life Cover:</p><p className="font-bold roboto">{formatCurrency(data.insuranceAnalysis.lifeInsurance.recommendedCover)}</p></div>
                        <div className="flex justify-between"><p>Est. Annual Premium:</p><p className="font-bold roboto">{formatCurrency(data.insuranceAnalysis.lifeInsurance.estimatedPremium)}</p></div>
                        <div className="flex justify-between"><p>Coverage Gap:</p><p className={`font-bold roboto ${data.insuranceAnalysis.lifeInsurance.coverageGap > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(data.insuranceAnalysis.lifeInsurance.coverageGap)}</p></div>
                    </div>
                </div>
                <div className="border rounded-lg p-3 bg-green-50/50">
                    <h3 className="font-semibold text-green-800 mb-2">Health Insurance</h3>
                     <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><p>Ideal Health Cover:</p><p className="font-bold roboto">{data.insuranceAnalysis.healthInsurance.recommendedCover}</p></div>
                        <div className="flex justify-between"><p>Est. Annual Premium:</p><p className="font-bold roboto">{formatCurrency(data.insuranceAnalysis.healthInsurance.estimatedPremium)}</p></div>
                        <div className="flex justify-between"><p>Coverage Gap:</p><p className={`font-bold roboto ${data.insuranceAnalysis.healthInsurance.coverageGap > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(data.insuranceAnalysis.healthInsurance.coverageGap)}</p></div>
                    </div>
                </div>
            </div>
        </section>
        )}
        
        <footer className="mt-auto pt-4 border-t-2 border-gray-300 print-avoid-break">
            <p className="text-xs text-gray-500 text-center leading-tight">
                <strong>Disclaimer:</strong> The calculators are based on past returns and are meant for illustration purposes only. This information is not investment advice. Mutual Fund investments are subject to market risks, read all scheme related documents carefully. Consult your financial advisor before investing.
            </p>
        </footer>
      </div>
    </div>
  );
}
