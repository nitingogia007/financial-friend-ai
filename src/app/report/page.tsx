

"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Report } from '@/components/planner/Report';
import type { ReportData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ReportPage() {
  const searchParams = useSearchParams();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const data = searchParams.get('data');
    if (data) {
      try {
        const parsedData: ReportData = JSON.parse(decodeURIComponent(data));
        setReportData(parsedData);
      } catch (e) {
        console.error("Failed to parse report data:", e);
        setError("Could not load report data. It might be corrupted.");
      }
    } else {
        setError("No report data found.");
    }
    setIsLoading(false);
  }, [searchParams]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading report...</div>;
  }
  
  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;
  }

  if (!reportData) {
    return <div className="flex items-center justify-center h-screen">No report to display.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
       <header className="bg-card border-b sticky top-0 z-10 no-print">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href="/">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Planner
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
        <main className="container mx-auto p-4 md:p-8">
            <Report data={reportData} />
        </main>
    </div>
  );
}

    