
"use client";

import { useMemo } from 'react';
import { FormSection } from './FormSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Info } from 'lucide-react';

interface Props {
  age: number | null;
  totalAnnualIncome: number;
}

export function InsuranceForm({ age, totalAnnualIncome }: Props) {
  const recommendedLifeCover = useMemo(() => {
    if (!age || !totalAnnualIncome) return 0;
    const multiplier = age < 50 ? 15 : 10;
    return totalAnnualIncome * multiplier;
  }, [age, totalAnnualIncome]);

  const recommendedHealthCover = useMemo(() => {
    if (!age) return 'N/A';
    if (age < 30) return '₹7 Lac - ₹10 Lac';
    if (age >= 30 && age <= 45) return '₹15 Lac - ₹20 Lac';
    if (age > 45 && age <= 60) return '₹25 Lac - ₹30 Lac';
    return '₹30 Lac - ₹40 Lac';
  }, [age]);

  const canShowRecommendations = age !== null && totalAnnualIncome > 0;

  return (
    <FormSection
      title="Insurance Checkup"
      description="Assess your insurance coverage against recommendations."
      icon={<ShieldCheck className="h-6 w-6" />}
    >
      <div className="space-y-6">
        {/* Life Insurance */}
        <Card className="bg-background/50">
          <CardHeader>
            <CardTitle className="text-lg">Life Insurance Recommendation</CardTitle>
            <CardDescription>Based on your age and income.</CardDescription>
          </CardHeader>
          <CardContent>
            {canShowRecommendations ? (
              <div className="mt-4 p-3 bg-accent/20 rounded-lg flex items-start gap-3 text-accent-foreground">
                <Info className="h-5 w-5 mt-0.5 shrink-0"/>
                <div>
                  <p className="font-semibold">Recommended Life Cover:</p>
                  <p className="text-lg font-bold">₹{recommendedLifeCover.toLocaleString('en-IN')}</p>
                  <p className="text-xs mt-1">This is the suggested minimum cover to ensure your family's financial security. Please verify your existing policy meets or exceeds this amount.</p>
                </div>
              </div>
            ) : (
                <div className="text-center text-muted-foreground p-4">
                    Enter your Date of Birth and Income to see recommendations.
                </div>
            )}
          </CardContent>
        </Card>

        {/* Health Insurance */}
        <Card className="bg-background/50">
          <CardHeader>
            <CardTitle className="text-lg">Health Insurance Recommendation</CardTitle>
            <CardDescription>Based on your age.</CardDescription>
          </CardHeader>
          <CardContent>
             {canShowRecommendations ? (
              <div className="mt-4 p-3 bg-accent/20 rounded-lg flex items-start gap-3 text-accent-foreground">
                <Info className="h-5 w-5 mt-0.5 shrink-0"/>
                 <div>
                    <p className="font-semibold">Recommended Health Cover:</p>
                    <p className="text-lg font-bold">{recommendedHealthCover}</p>
                    <p className="text-xs mt-1">This is a suggested range for individual health coverage to handle medical emergencies without financial strain.</p>
                 </div>
              </div>
            ) : (
                <div className="text-center text-muted-foreground p-4">
                    Enter your Date of Birth to see recommendations.
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FormSection>
  );
}
