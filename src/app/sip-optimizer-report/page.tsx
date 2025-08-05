
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SipOptimizerReport } from '@/components/planner/SipOptimizerReport';
import type { SipOptimizerReportData } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SipOptimizerReportPage() {
  const [reportData, setReportData] = useState<SipOptimizerReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Using sessionStorage to retrieve data is a simple way for client-side routing
    // It won't work with server-side rendering or if the user opens the link in a new tab
    const data = sessionStorage.getItem('sipOptimizerReportData');
    if (data) {
      try {
        const parsedData: SipOptimizerReportData = JSON.parse(data);
        setReportData(parsedData);
      } catch (e) {
        console.error("Failed to parse SIP optimizer report data:", e);
        setError("Could not load report data. It might be corrupted.");
      }
    } else {
        setError("No report data found. Please generate a report first.");
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen">
            Loading report...
        </div>
    );
  }
  
  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-red-500 gap-4">
            <span>{error}</span>
            <Link href="/">
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Planner
                </Button>
            </Link>
        </div>
    );
  }

  if (!reportData) {
    return (
        <div className="flex items-center justify-center h-screen">
            No report to display.
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <main>
            <SipOptimizerReport data={reportData} />
        </main>
    </div>
  );
}
