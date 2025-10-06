
"use client";

import type { SipOptimizerReportData, SipOptimizerGoal, Asset, RetirementCalculations, LifeInsuranceQuote, HealthInsuranceQuote, FundAllocation, ChartDataPoint, FactsheetData, IndustryAllocation, PortfolioHolding } from '@/lib/types';
import { Button } from '../ui/button';
import { Printer, Phone, Mail, User, Calendar, Users, Target, ArrowRight, AlertTriangle, Info, Goal as GoalIcon, ShieldCheck, Wallet, PiggyBank, Briefcase, FileText, CheckCircle, TrendingUp, Banknote, CandlestickChart, Gem, Building, Calculator, BarChart3, PieChart as PieChartIcon, Check, X, Download, LineChart, Loader2, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import { useEffect, useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AssetAllocationChart } from '../charts/AssetAllocationChart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { getAssetAllocation } from '@/lib/calculations';
import { getFundReturns } from '@/ai/flows/fund-returns-flow';
import { getModelPortfolioData } from '@/ai/flows/model-portfolio-flow';
import { analyzeFactsheet } from '@/ai/flows/analyze-factsheet-flow';
import { PortfolioNiftyChart } from '../charts/PortfolioNiftyChart';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';


const logoUrl = "/financial-friend-logo.png";

interface Props {
  data: SipOptimizerReportData;
}

const formatCurrency = (value: number | '', prefix = '₹') => {
    const num = typeof value === 'number' ? value : 0;
    if (isNaN(num)) return `${prefix}0`;
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

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-start gap-3">
        <div className="bg-black/5 rounded-full p-1.5">
            <Icon className="h-4 w-4 text-pink-800" />
        </div>
        <div>
            <p className="text-xs text-pink-900/70 font-medium">{label}</p>
            <p className="font-bold text-pink-950 text-sm">{value}</p>
        </div>
    </div>
);

const DetailItemWhite = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | number }) => (
    <div className="flex items-start gap-3">
         <div className="bg-gray-100 rounded-full p-1.5">
            <Icon className="h-4 w-4 text-gray-600" />
        </div>
        <div>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="font-bold text-gray-800 text-sm">{value}</p>
        </div>
    </div>
);

const InsuranceQuoteFeature = ({ label, value }: { label: string, value?: string | number | null }) => {
    let displayValue: React.ReactNode = <X className="h-4 w-4 text-red-500" />;
    let valueClass = "text-red-600";

    if (value === 'Covered' || value === 'Included' || value === 'No cap' || (typeof value === 'string' && value.startsWith('('))) {
        displayValue = <Check className="h-4 w-4 text-green-500" />;
        valueClass = "text-green-700";
    } else if (value) {
        displayValue = value;
        valueClass = "text-gray-800"
    }

    return (
        <div className="flex justify-between items-center text-xs py-1.5 border-b last:border-b-0">
            <p className="text-gray-600">{label}</p>
            <p className={cn("font-semibold", valueClass)}>{displayValue}</p>
        </div>
    );
};


const LifeInsuranceQuoteCard = ({ quote }: { quote: LifeInsuranceQuote }) => (
    <Card className="bg-white border-blue-200 mt-4">
        <CardHeader>
            <CardTitle className="text-md text-blue-800">{quote.planName || 'Life Insurance Plan'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
             <div className="flex justify-between"><p>Cover Amount:</p><p className="font-bold roboto">{formatCurrency(quote.coverAmount)}</p></div>
             <div className="flex justify-between"><p>Premium:</p><p className="font-bold roboto">{formatCurrency(quote.premiumAmount)}</p></div>
             <div className="flex justify-between"><p>Policy Term:</p><p className="font-bold roboto">{quote.policyTerm}</p></div>
             <div className="flex justify-between"><p>Premium Payment Term:</p><p className="font-bold roboto">{quote.premiumPaymentTerm}</p></div>
        </CardContent>
    </Card>
);

const HealthInsuranceQuoteCard = ({ quote }: { quote: HealthInsuranceQuote }) => (
    <Card className="bg-white border-green-200 mt-4">
        <CardHeader>
             <p className="text-xs text-gray-500">{quote.company || 'Health Insurance'}</p>
            <CardTitle className="text-md text-green-800 -mt-1">{quote.planName || 'Health Insurance Plan'}</CardTitle>
        </CardHeader>
        <CardContent>
             <div className="flex justify-between items-baseline mb-3">
                <p className="font-bold text-lg roboto">{quote.sumAssured || 'N/A'}</p>
                <p className="text-sm">Premium: <span className="font-bold roboto">{formatCurrency(quote.premium1Y)}</span></p>
             </div>
             <div className="space-y-1">
                <InsuranceQuoteFeature label="Pre-Hospitalization" value={quote.preHospitalization} />
                <InsuranceQuoteFeature label="Post-Hospitalization" value={quote.postHospitalization} />
                <InsuranceQuoteFeature label="Waiting Period (PED)" value={quote.waitingPeriodPED} />
                <InsuranceQuoteFeature label="Room Rent" value={quote.roomRent} />
                <InsuranceQuoteFeature label="Restore Benefit" value={quote.restoreBenefit} />
                <InsuranceQuoteFeature label="Ambulance (Road)" value={quote.ambulanceRoad} />
                <InsuranceQuoteFeature label="Ambulance (Air)" value={quote.ambulanceAir} />
                <InsuranceQuoteFeature label="Health Check-up" value={quote.healthCheckup} />
                <InsuranceQuoteFeature label="E-Consultation" value={quote.eConsultation} />
             </div>
        </CardContent>
    </Card>
);


const AssetCard = ({
    icon,
    title,
    value,
    percentage,
    colorClass,
    isNonLiquid = false,
  }: {
    icon: React.ReactNode;
    title: string;
    value: number;
    percentage?: number;
    colorClass: string;
    isNonLiquid?: boolean;
  }) => (
    <Card className={cn("border-l-4", colorClass)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold roboto">{formatCurrency(value)}</div>
            {isNonLiquid ? (
                 <p className="text-xs text-muted-foreground">(Not in liquid portfolio)</p>
            ) : (
                <p className="text-xs text-muted-foreground">{percentage?.toFixed(2)}% of liquid portfolio</p>
            )}
        </CardContent>
    </Card>
);

const RetirementAnalysisCard = ({ calcs }: { calcs: RetirementCalculations }) => (
    <Card className="bg-blue-50/50 border border-blue-200">
        <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-blue-800">
                <Calculator className="h-5 w-5" />
                Retirement Planning Analysis
            </CardTitle>
        </CardHeader>
        <CardContent className="text-xs">
            <Table>
                <TableBody>
                     <TableRow>
                        <TableCell className="font-medium">Years to Retirement</TableCell>
                        <TableCell className="text-right font-semibold roboto">{calcs.yearsToRetirement}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Inflated Monthly Expense</TableCell>
                        <TableCell className="text-right font-semibold roboto">{formatCurrency(calcs.inflatedMonthlyExpense)}</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">Annual Expense at Retirement</TableCell>
                        <TableCell className="text-right font-semibold roboto">{formatCurrency(calcs.annualExpenseAtRetirement)}</TableCell>
                    </TableRow>
                     <TableRow className="bg-blue-100/50">
                        <TableCell className="font-bold">Required Retirement Corpus</TableCell>
                        <TableCell className="text-right font-bold roboto">{formatCurrency(calcs.requiredRetirementCorpus)}</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell className="font-medium">Monthly Investment Needed</TableCell>
                        <TableCell className="text-right font-semibold roboto">{formatCurrency(calcs.monthlyInvestmentNeeded)}</TableCell>
                    </TableRow>
                     <TableRow>
                        <TableCell className="font-medium">Incremental Monthly Investment</TableCell>
                        <TableCell className="text-right font-semibold roboto">{formatCurrency(calcs.incrementalMonthlyInvestment)}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </CardContent>
    </Card>
);

const FundAllocationRow = ({ alloc, goalName }: { alloc: FundAllocation, goalName: string }) => {
    const [returns, setReturns] = useState<{ threeYearReturn: string | null; fiveYearReturn: string | null; tenYearReturn: string | null; } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchReturns = async () => {
            if (alloc.schemeCode) {
                setIsLoading(true);
                try {
                    const result = await getFundReturns({ schemeCode: Number(alloc.schemeCode) });
                    setReturns(result);
                } catch (error) {
                    console.error(`Failed to fetch returns for ${alloc.schemeName}`, error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchReturns();
    }, [alloc.schemeCode, alloc.schemeName]);

    return (
        <TableRow>
            <TableCell>
                <p className="font-bold">{alloc.schemeName || 'N/A'}</p>
                <p className="text-xs text-gray-500">{alloc.fundName}</p>
            </TableCell>
            <TableCell>{goalName}</TableCell>
            <TableCell>{formatCurrency(alloc.sipRequired)}</TableCell>
            <TableCell>{alloc.fundCategory}</TableCell>
            <TableCell className="text-center">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (returns?.threeYearReturn ?? 'N/A')}
            </TableCell>
            <TableCell className="text-center">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (returns?.fiveYearReturn ?? 'N/A')}
            </TableCell>
            <TableCell className="text-center">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (returns?.tenYearReturn ?? 'N/A')}
            </TableCell>
        </TableRow>
    );
};


const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#64748b'
];


const ConsolidatedDisplay = ({ title, data, icon: Icon }: { title: string; data: { name: string; value: number }[]; icon: React.ElementType }) => {
  const chartData = data.map((item, index) => ({
    ...item,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="md:col-span-2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                innerRadius={40}
                dataKey="value"
                nameKey="name"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
                contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", fontSize: "12px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="md:col-span-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Weight (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chartData.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: item.fill }} />
                    {item.name}
                  </TableCell>
                  <TableCell className="text-right roboto font-semibold">{item.value.toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};



export function SipOptimizerReport({ data }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [equityChartData, setEquityChartData] = useState<ChartDataPoint[] | null>(null);
  const [isEquityChartLoading, setIsEquityChartLoading] = useState(false);
  
  const [factsheets, setFactsheets] = useState<Record<string, FactsheetData>>({});
  const [isFactsheetLoading, setIsFactsheetLoading] = useState(false);
  const [factsheetManifest, setFactsheetManifest] = useState<Record<string, Record<string, string>>>({});

  // Load factsheet manifest
  useEffect(() => {
    fetch('/factsheets.json')
      .then(res => res.json())
      .then(data => setFactsheetManifest(data))
      .catch(err => console.error("Could not load factsheets.json", err));
  }, []);

  // Analyze all factsheets for allocated funds
  useEffect(() => {
    if (data.fundAllocations.length === 0 || Object.keys(factsheetManifest).length === 0) return;

    const analyzeAll = async () => {
      setIsFactsheetLoading(true);
      const factsheetPromises = data.fundAllocations.map(async (alloc) => {
        const fundHouseSchemes = factsheetManifest[alloc.fundName];
        if (!fundHouseSchemes) return null;

        const matchingKey = Object.keys(fundHouseSchemes).find(key =>
          alloc.schemeName.toLowerCase().startsWith(key.toLowerCase())
        );
        
        if (matchingKey && fundHouseSchemes[matchingKey]) {
          try {
            const factsheetData = await analyzeFactsheet(fundHouseSchemes[matchingKey]);
            return { id: alloc.id, data: factsheetData };
          } catch (error) {
            console.error(`Failed to analyze ${alloc.schemeName}:`, error);
            return null;
          }
        }
        return null;
      });

      const results = await Promise.all(factsheetPromises);
      const newFactsheets: Record<string, FactsheetData> = {};
      results.forEach(result => {
        if (result) {
          newFactsheets[result.id] = result.data;
        }
      });
      setFactsheets(newFactsheets);
      setIsFactsheetLoading(false);
    };

    analyzeAll();
  }, [data.fundAllocations, factsheetManifest]);

  const consolidatedHoldings = useMemo(() => {
    const holdingsMap = new Map<string, number>();
    let totalSip = 0;
    data.fundAllocations.forEach(alloc => {
        totalSip += typeof alloc.sipRequired === 'number' ? alloc.sipRequired : 0;
    });

    if (totalSip === 0) return [];
    
    data.fundAllocations.forEach(alloc => {
      const factsheet = factsheets[alloc.id];
      const sip = typeof alloc.sipRequired === 'number' ? alloc.sipRequired : 0;
      if (factsheet && sip > 0) {
        const fundWeightInPortfolio = sip / totalSip;
        factsheet.portfolioHoldings.forEach(holding => {
          const weightedHolding = holding.weight * fundWeightInPortfolio;
          holdingsMap.set(holding.stock, (holdingsMap.get(holding.stock) || 0) + weightedHolding);
        });
      }
    });

    return Array.from(holdingsMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15); // Top 15
  }, [factsheets, data.fundAllocations]);

  const consolidatedIndustryAllocation = useMemo(() => {
    const industryMap = new Map<string, number>();
    let totalSip = 0;
    data.fundAllocations.forEach(alloc => {
        totalSip += typeof alloc.sipRequired === 'number' ? alloc.sipRequired : 0;
    });

    if (totalSip === 0) return [];

    data.fundAllocations.forEach(alloc => {
      const factsheet = factsheets[alloc.id];
      const sip = typeof alloc.sipRequired === 'number' ? alloc.sipRequired : 0;
      if (factsheet && sip > 0) {
        const fundWeightInPortfolio = sip / totalSip;
        factsheet.industryAllocation.forEach(industry => {
          const weightedAllocation = industry.weight * fundWeightInPortfolio;
          industryMap.set(industry.sector, (industryMap.get(industry.sector) || 0) + weightedAllocation);
        });
      }
    });

    return Array.from(industryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [factsheets, data.fundAllocations]);
  

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    const reportElement = document.getElementById('report-container');
    if (!reportElement) return;

    try {
        const canvas = await html2canvas(reportElement, { 
            scale: 2, // Higher scale for better quality
            useCORS: true, 
            allowTaint: true 
        });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        const imgHeight = pdfWidth / ratio;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`${data.personalDetails.name}-financial-report.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Could not generate PDF. Please try again.");
    }
};

  
  const additionalSipRequired = data.totalInvestmentStatus
    ? Math.max(0, data.totalInvestmentStatus.requiredInvestment - data.totalInvestmentStatus.currentInvestment)
    : 0;
  
  const handleViewDetailedReport = () => {
    router.push('/report');
  };

  const getNumericValue = (amount: number | ''): number => typeof amount === 'number' ? amount : 0;
  
  const liquidAssets = (data.assets || [])
    .filter(a => a.type !== 'Real Estate' && a.type && typeof a.amount === 'number');
  
  const nonLiquidAssets = (data.assets || []).filter(a => a.type === 'Real Estate' && a.type && typeof a.amount === 'number');
  
  const totalLiquidAssets = liquidAssets.reduce((sum, asset) => sum + getNumericValue(asset.amount), 0);

  const assetCategories = [
    { name: 'Indian Equity shares', icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />, color: 'hsl(var(--chart-1))' },
    { name: 'Fixed Income instruments', icon: <Banknote className="h-4 w-4 text-muted-foreground" />, color: 'hsl(var(--chart-2))' },
    { name: 'PPF', icon: <Briefcase className="h-4 w-4 text-muted-foreground" />, color: 'hsl(var(--chart-3))' },
    { name: 'EPF', icon: <Briefcase className="h-4 w-4 text-muted-foreground" />, color: 'hsl(var(--chart-3))' },
    { name: 'NPS', icon: <Briefcase className="h-4 w-4 text-muted-foreground" />, color: 'hsl(var(--chart-3))' },
    { name: 'Gold/Gold Bond/ETF/Fund', icon: <Gem className="h-4 w-4 text-muted-foreground" />, color: 'hsl(var(--chart-4))' },
    { name: 'Insurance', icon: <ShieldCheck className="h-4 w-4 text-muted-foreground" />, color: 'hsl(var(--chart-5))' },
    { name: 'Other', icon: <Briefcase className="h-4 w-4 text-muted-foreground" />, color: 'hsl(var(--chart-5))' },
  ];

  const aggregatedLiquidAssets = assetCategories.map(category => {
    const assetsInCategory = liquidAssets.filter(asset => {
        if (category.name === 'Other') {
            return !assetCategories.slice(0, -1).map(c => c.name).includes(asset.type)
        }
        return asset.type === category.name;
    });
    const totalValue = assetsInCategory.reduce((sum, asset) => sum + getNumericValue(asset.amount), 0);
    return {
      name: category.name,
      value: totalValue,
      icon: category.icon,
      color: category.color,
      percentage: totalLiquidAssets > 0 ? (totalValue / totalLiquidAssets) * 100 : 0,
    };
  }).filter(category => category.value > 0);

  const recommendedAllocation = getAssetAllocation(data.assetAllocationProfile.age, data.assetAllocationProfile.riskAppetite);

  const portfolioAnalysis = useMemo(() => {
    const getNum = (val: number | '') => typeof val === 'number' ? val : 0;
    const equityTotal = data.fundAllocations.filter(a => a.fundCategory === 'Equity').reduce((sum, a) => sum + getNum(a.sipRequired), 0);
    const hybridTotal = data.fundAllocations.filter(a => a.fundCategory === 'Hybrid').reduce((sum, a) => sum + getNum(a.sipRequired), 0);
    const debtTotal = data.fundAllocations.filter(a => a.fundCategory === 'Debt').reduce((sum, a) => sum + getNum(a.sipRequired), 0);
    return { equity: equityTotal, hybrid: hybridTotal, debt: debtTotal };
  }, [data.fundAllocations]);

  const equityFundWeights = useMemo(() => {
    const getNum = (val: number | '' | undefined) => (typeof val === 'number' ? val : 0);
    const equityAllocations = data.fundAllocations.filter(a => a.fundCategory === 'Equity' && getNum(a.sipRequired) > 0 && a.schemeCode);
    const totalEquitySip = equityAllocations.reduce((sum, a) => sum + getNum(a.sipRequired), 0);
    if (totalEquitySip === 0) return [];
    return equityAllocations.map(alloc => ({
        ...alloc,
        goalName: data.goals.find(g => g.id === alloc.goalId)?.name || 'Unlinked',
        weight: (getNum(alloc.sipRequired) / totalEquitySip) * 100,
    }));
  }, [data.fundAllocations, data.goals]);


  useEffect(() => {
    const generateEquityGraph = async () => {
        const fundsForApi = equityFundWeights
          .filter(f => f.schemeCode && f.weight > 0)
          .map(f => ({
            schemeCode: Number(f.schemeCode),
            schemeName: f.schemeName!,
            weight: f.weight,
          }));

        if (fundsForApi.length === 0) {
          return;
        }

        setIsEquityChartLoading(true);
        setEquityChartData(null);
        try {
          const result = await getModelPortfolioData({ funds: fundsForApi, includeNifty: true });
          if (result.chartData && result.chartData.length > 0) {
            setEquityChartData(result.chartData);
          } else {
            toast({
              title: "Could Not Fetch Equity Chart Data",
              description: "Unable to retrieve historical data for the selected equity funds.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error(`Error fetching equity portfolio data:`, error);
           toast({
              title: "Equity Chart Generation Failed",
              description: "An unexpected error occurred while generating the equity graph.",
              variant: "destructive"
            });
          setEquityChartData(null);
        } finally {
          setIsEquityChartLoading(false);
        }
    };
    generateEquityGraph();
  }, [equityFundWeights, toast]);
  

  return (
    <div className="bg-gray-100 text-gray-800 font-sans">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;700&display=swap');
        
        body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        #report-container * {
            font-family: 'Poppins', 'Roboto', sans-serif !important;
        }
        .roboto {
            font-family: 'Roboto', sans-serif !important;
        }

        @page {
          size: A4;
          margin: 0;
        }
        @media print {
          html, body {
            width: 210mm;
            min-height: 0;
            height: auto;
            margin: 0;
            padding: 0;
            background: white;
          }
          .no-print {
            display: none !important;
          }
          #report-section {
            padding: 0;
            margin: 0;
            background: none;
            overflow: visible;
            height: auto;
          }
          #report-container {
            width: 100%;
            min-height: 0;
            margin: 0;
            padding: 1cm;
            box-shadow: none !important;
            border: none !important;
            background: linear-gradient(to bottom, #FEE7E7, #FFFFFF 60%, #FFFFFF 40%, #FFFFFF 10%) !important;
            transform: scale(1);
            font-size: 8px !important;
            line-height: 1.2 !important;
            height: auto;
            overflow: visible;
          }
           #report-container h1 { font-size: 14px !important; }
           #report-container h2 { font-size: 12px !important; }
           #report-container h3 { font-size: 10px !important; }
           #report-container h4 { font-size: 9px !important; }
           #report-container section {
             margin-top: 0.5rem !important;
             padding: 0 !important;
             page-break-inside: avoid;
           }
           .print-avoid-break {
             page-break-inside: avoid;
           }
        }
      `}</style>
      
      <div className="container mx-auto flex justify-end p-4 gap-4 no-print">
        <Button onClick={handlePrint} variant="default">
            <Printer className="mr-2 h-4 w-4" />
            Print Report
        </Button>
        <Button onClick={handleDownload} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
        </Button>
        <Button onClick={handleViewDetailedReport} variant="outline">
            View Detailed Report
            <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div id="report-container" className="w-[210mm] min-h-fit mx-auto p-6 shadow-2xl border flex flex-col" style={{
        background: "linear-gradient(to bottom, #FEE7E7, #FFFFFF 60%, #FFFFFF 40%, #FFFFFF 10%)"
      }}>
        {/* Header */}
        <header className="p-4 rounded-t-lg bg-pink-100 print-avoid-break flex justify-between items-center">
             <div className="relative h-12 w-48">
              <Image 
                  src={logoUrl}
                  alt="FinFriend Planner Logo" 
                  width={192}
                  height={48}
                  style={{ objectFit: 'contain' }}
                  priority
              />
            </div>
            <div className="text-center text-xs">
                <p><strong>RM name:</strong> Gunjan Kataria</p>
                <p><strong>Mobile no:</strong> 9460825477</p>
                <p><strong>Email:</strong> contact@financialfriend.in</p>
            </div>
        </header>

        <section className="text-center py-4 bg-white print-avoid-break">
            <h1 className="text-xl font-bold text-gray-800 tracking-wide">Financial Planning Report</h1>
        </section>

        {/* Investor Details */}
        <section className="bg-white p-1 print-avoid-break">
            <div className="rounded-lg shadow-sm border overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <div className="bg-pink-50 p-4 space-y-4">
                       <DetailItem icon={User} label="Name" value={data.personalDetails.name} />
                       <DetailItem icon={Calendar} label="Date of Birth" value={formatDate(data.personalDetails.dob)} />
                       <DetailItem icon={Users} label="Dependents" value={data.personalDetails.dependents} />
                    </div>
                    <div className="bg-white p-4 space-y-4">
                        <DetailItemWhite icon={Target} label="Retirement Age" value={data.personalDetails.retirementAge} />
                        <DetailItemWhite icon={Phone} label="Mobile No." value={data.personalDetails.mobile} />
                        <DetailItemWhite icon={Mail} label="Email ID" value={data.personalDetails.email} />
                    </div>
                </div>
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
                <h3>
                {
                    data.cashflow.investibleSurplus >= data.totalInvestmentStatus.requiredInvestment
                    ? "Investment Status"
                    : "Underinvesting"
                }
                </h3>
            </div>

            {data.cashflow.investibleSurplus >= data.totalInvestmentStatus.requiredInvestment ? (
                <p className="text-sm mt-1">
                    Your investable surplus is sufficient to meet your required investments.
                    <span className="font-bold text-green-600 bg-green-100 rounded-md px-1.5 py-0.5 mx-1">
                        I must invest / month = I can invest / month
                    </span>
                </p>
            ) : (
                <p className="text-sm mt-1">
                    You are currently underinvesting and need an additional SIP of 
                    <span className="font-bold text-red-600 bg-red-100 rounded-md px-1.5 py-0.5 mx-1">{formatCurrency(additionalSipRequired)}</span>
                    per month to stay on track and achieve your goals.
                </p>
            )}

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

        {/* Retirement Analysis */}
        {data.retirementCalculations && (
          <section className="mt-4 print-avoid-break">
            <RetirementAnalysisCard calcs={data.retirementCalculations} />
          </section>
        )}

        {/* Goals Table */}
        <section className="mt-4 print-avoid-break">
            <h2 className="font-bold text-gray-700 mb-2">Goals Breakdown</h2>
            <div className="overflow-x-auto text-xs space-y-4">
                {Array.isArray(data.goals) && data.goals.length > 0 && data.goals.map(goal => {
                    const goalCorpus = goal.futureValue || goal.potentialCorpus;
                    return (
                        <div key={goal.id} className="border-b pb-4 last:border-b-0">
                            <h3 className="font-bold text-base text-gray-800 mb-2">{goal.name}</h3>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-2 rounded-lg border border-red-200 bg-red-50">
                                    <h4 className="text-center font-semibold text-red-700 mb-2">What I am investing / Month</h4>
                                    <div className="flex flex-col items-center text-center space-y-1">
                                        <div className="flex flex-col"><span className="text-gray-500 text-[10px]">Current SIP</span><span className="font-bold roboto text-sm">{formatCurrency(goal.investmentStatus.currentInvestment)}</span></div>
                                        <div className="flex flex-col"><span className="text-gray-500 text-[10px]">Time</span><span className="font-bold roboto text-sm">{formatYears(goal.timeline.current)}</span></div>
                                        <div className="flex flex-col"><span className="text-gray-500 text-[10px]">Goal Amt</span><span className="font-bold roboto text-sm">{formatCurrency(goalCorpus)}</span></div>
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
                                        <div className="flex flex-col"><span className="text-gray-500 text-[10px]">Allocated SIP</span><span className="font-bold roboto text-sm">{formatCurrency(goal.investmentStatus.allocatedInvestment)}</span></div>
                                        <div className="flex flex-col"><span className="text-gray-500 text-[10px]">Time</span><span className="font-bold roboto text-sm">{formatYears(goal.timeline.potential)}</span></div>
                                        <div className="flex flex-col"><span className="text-gray-500 text-[10px]">Expected Corpus</span><span className="font-bold roboto text-sm">{formatCurrency(goal.futureValue)}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>

        {/* Wealth Creation Section */}
        {data.wealthCreationGoal && (
          <section className="mt-4 print-avoid-break">
            <h2 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-gray-500"/>Wealth Creation</h2>
            <div className="p-4 rounded-lg border border-teal-200 bg-teal-50">
                <p className="text-center text-sm text-teal-800 mb-3">Your surplus cashflow after funding all goals has been allocated to wealth creation.</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-xs text-gray-600">Monthly SIP</p>
                        <p className="font-bold text-teal-700 roboto text-lg mt-1">{formatCurrency(data.wealthCreationGoal.sip)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-600">Time Horizon</p>
                        <p className="font-bold text-teal-700 roboto text-lg mt-1">{data.wealthCreationGoal.years} Years</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-600">Projected Wealth</p>
                        <p className="font-bold text-teal-700 roboto text-lg mt-1">{formatCurrency(data.wealthCreationGoal.projectedCorpus)}</p>
                    </div>
                </div>
            </div>
          </section>
        )}


        {/* Insurance Analysis */}
        {data.insuranceAnalysis && (
        <section className="mt-4 print-avoid-break">
            <h2 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-gray-500"/>Insurance Analysis and Quote</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="border rounded-lg p-3 bg-blue-50/50 space-y-2">
                    <h3 className="font-semibold text-blue-800">Life Insurance Analysis</h3>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><p>Ideal Life Cover:</p><p className="font-bold roboto">{formatCurrency(data.insuranceAnalysis.lifeInsurance.recommendedCover)}</p></div>
                        <div className="flex justify-between"><p>Current Annual Cover:</p><p className="font-bold roboto">{formatCurrency(data.insuranceAnalysis.lifeInsurance.currentCover)}</p></div>
                        <div className="flex justify-between"><p>Coverage Gap:</p><p className={`font-bold roboto ${data.insuranceAnalysis.lifeInsurance.coverageGap > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(data.insuranceAnalysis.lifeInsurance.coverageGap)}</p></div>
                    </div>
                    {data.insuranceAnalysis.lifeInsurance.quote && <LifeInsuranceQuoteCard quote={data.insuranceAnalysis.lifeInsurance.quote} />}
                </div>
                <div className="border rounded-lg p-3 bg-green-50/50 space-y-2">
                    <h3 className="font-semibold text-green-800">Health Insurance Analysis</h3>
                     <div className="space-y-1 text-xs">
                        <div className="flex justify-between"><p>Ideal Health Cover:</p><p className="font-bold roboto">{data.insuranceAnalysis.healthInsurance.recommendedCover}</p></div>
                        <div className="flex justify-between"><p>Current Annual Cover:</p><p className="font-bold roboto">{formatCurrency(data.insuranceAnalysis.healthInsurance.currentCover)}</p></div>
                        <div className="flex justify-between"><p>Coverage Gap:</p><p className={`font-bold roboto ${data.insuranceAnalysis.healthInsurance.coverageGap > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(data.insuranceAnalysis.healthInsurance.coverageGap)}</p></div>
                    </div>
                    {data.insuranceAnalysis.healthInsurance.quote && <HealthInsuranceQuoteCard quote={data.insuranceAnalysis.healthInsurance.quote} />}
                </div>
            </div>
        </section>
        )}
        
        {/* Estate Planning Section */}
        {data.willStatus && (
        <section className="mt-4 print-avoid-break">
            <h2 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><FileText className="h-5 w-5 text-gray-500"/>Estate Planning</h2>
            {data.willStatus === 'yes' ? (
                <div className="flex items-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm">
                    <CheckCircle className="h-5 w-5"/>
                    <p className="font-semibold">Estate planning - done</p>
                </div>
            ) : (
                <div className="flex items-start gap-2 p-3 rounded-lg border border-orange-200 bg-orange-50 text-orange-800 text-sm">
                    <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0"/>
                    <p className="font-semibold">Estate planning is pending — we recommend initiating it to ensure smooth and secure wealth transfer.</p>
                </div>
            )}
        </section>
        )}
        
        {/* Existing Asset Allocation Section */}
        <section className="mt-4 print-avoid-break">
            <h2 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><Wallet className="h-5 w-5 text-gray-500"/>Liquid Asset Allocation</h2>
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full md:w-1/2 h-48">
                    <AssetAllocationChart assets={aggregatedLiquidAssets} />
                </div>
                <div className="w-full md:w-1/2">
                    <div className="rounded-lg border bg-white p-2 text-xs">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                    <TableHead className="text-right">%</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {aggregatedLiquidAssets.map((asset, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: asset.color }}></div>
                                            {asset.name}
                                        </TableCell>
                                        <TableCell className="text-right roboto">{formatCurrency(asset.value)}</TableCell>
                                        <TableCell className="text-right roboto">{asset.percentage.toFixed(1)}%</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow className="font-bold bg-gray-50">
                                     <TableCell>Total</TableCell>
                                     <TableCell className="text-right roboto">{formatCurrency(totalLiquidAssets)}</TableCell>
                                     <TableCell className="text-right roboto">100%</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {nonLiquidAssets.length > 0 && (
                <div className="mt-4">
                    <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><Building className="h-5 w-5 text-gray-500"/>Non-Liquid Assets</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                        {nonLiquidAssets.map(asset => (
                             <AssetCard 
                                key={asset.id}
                                icon={<Building className="h-4 w-4 text-muted-foreground" />}
                                title={asset.type === 'Other' && asset.otherType ? asset.otherType : asset.type}
                                value={getNumericValue(asset.amount)}
                                colorClass="border-indigo-500"
                                isNonLiquid={true}
                             />
                        ))}
                    </div>
                </div>
            )}
        </section>
        
        {/* Fund Allocation & Analysis Section */}
        {data.fundAllocations && data.fundAllocations.length > 0 && (
            <section className="mt-4 print-avoid-break">
                 <h2 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><GoalIcon className="h-5 w-5 text-gray-500"/>Fund Allocation & Analysis</h2>
                 <p className="text-xs text-gray-600 mb-3">
                    This section details your chosen mutual fund allocations for each goal, their historical returns, and an analysis of your model portfolio.
                 </p>
                 
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Fund Allocations by Goal & Returns (CAGR)</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto text-xs">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Scheme</TableHead>
                                    <TableHead>Goal</TableHead>
                                    <TableHead>SIP</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-center">3Y</TableHead>
                                    <TableHead className="text-center">5Y</TableHead>
                                    <TableHead className="text-center">10Y</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.fundAllocations.map(alloc => (
                                    <FundAllocationRow 
                                        key={alloc.id} 
                                        alloc={alloc} 
                                        goalName={data.goals.find(g => g.id === alloc.goalId)?.name || 'Unlinked'} 
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                 </Card>

                 {isFactsheetLoading ? (
                    <div className="flex items-center justify-center h-64 mt-6">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-4 text-muted-foreground">Analyzing factsheets and consolidating portfolio...</p>
                    </div>
                 ) : (
                    <>
                        <ConsolidatedDisplay
                            title="Consolidated Industry Allocation (% of Net Assets)"
                            data={consolidatedIndustryAllocation}
                            icon={PieChartIcon}
                        />
                        <Card className="mt-4">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                <Briefcase className="h-5 w-5" />
                                Consolidated Top Portfolio Holdings
                                </CardTitle>
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
                                        {consolidatedHoldings.map((holding) => (
                                        <TableRow key={holding.name}>
                                            <TableCell className="font-medium">{holding.name}</TableCell>
                                            <TableCell className="text-right roboto font-semibold">{holding.value.toFixed(2)}%</TableCell>
                                        </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </>
                 )}


                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                     <div>
                        <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><PieChartIcon className="h-5 w-5"/>Model Portfolio Analysis</h3>
                        <Card className="p-4">
                            <CardContent className="p-2 space-y-4 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Equity Holdings</span>
                                    <span className="font-bold text-lg text-primary roboto">{formatCurrency(portfolioAnalysis.equity)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Hybrid Holdings</span>
                                    <span className="font-bold text-lg text-primary roboto">{formatCurrency(portfolioAnalysis.hybrid)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Debt Holdings</span>
                                    <span className="font-bold text-lg text-primary roboto">{formatCurrency(portfolioAnalysis.debt)}</span>
                                </div>
                            </CardContent>
                        </Card>
                     </div>
                     <div>
                        <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><Percent className="h-5 w-5"/>Equity Fund Weight Analysis</h3>
                         <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fund Name</TableHead>
                                        <TableHead className="text-right">Weightage</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="text-xs">
                                    {equityFundWeights.length > 0 ? (
                                        equityFundWeights.map(fund => (
                                            <TableRow key={fund.id}>
                                                <TableCell className="font-medium">{fund.schemeName}</TableCell>
                                                <TableCell className="text-right font-bold text-primary roboto">{fund.weight.toFixed(2)}%</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center text-gray-500">
                                                No equity fund allocations.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                     </div>
                 </div>
                 
                 <div className="mt-4">
                    {isEquityChartLoading ? (
                        <div className="flex items-center justify-center h-96 mt-6">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="ml-4 text-gray-500">Generating Equity Performance Chart...</p>
                        </div>
                    ) : equityChartData && equityChartData.length > 0 ? (
                        <PortfolioNiftyChart 
                            data={equityChartData} 
                            title="Equity Portfolio vs. NIFTY 50 (2-Year Performance)"
                        />
                    ) : (
                       <div className="text-center text-gray-500 mt-6 h-96 flex items-center justify-center border-2 border-dashed rounded-lg">No equity chart data to display.</div>
                    )}
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

    