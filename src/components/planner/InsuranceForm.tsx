"use client";

import { useState, useMemo } from 'react';
import type { Insurance } from '@/lib/types';
import { FormSection } from './FormSection';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Info } from 'lucide-react';

interface Props {
  age: number | null;
  totalAnnualIncome: number;
}

export function InsuranceForm({ age, totalAnnualIncome }: Props) {
  const [hasLifeInsurance, setHasLifeInsurance] = useState<'yes' | 'no' | null>(null);
  const [hasHealthInsurance, setHasHealthInsurance] = useState<'yes' | 'no' | null>(null);

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
            <CardTitle className="text-lg">Life Insurance</CardTitle>
            <CardDescription>Do you have a life insurance policy?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              onValueChange={(value: 'yes' | 'no') => setHasLifeInsurance(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="life-yes" />
                <Label htmlFor="life-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="life-no" />
                <Label htmlFor="life-no">No</Label>
              </div>
            </RadioGroup>
            {(hasLifeInsurance === 'yes' || hasLifeInsurance === 'no') && (
              <div className="mt-4 p-3 bg-accent/20 rounded-lg flex items-start gap-3 text-accent-foreground">
                <Info className="h-5 w-5 mt-0.5 shrink-0"/>
                <div>
                    <p className="font-semibold">Recommended Life Cover:</p>
                    <p className="text-lg font-bold">₹{recommendedLifeCover.toLocaleString('en-IN')}</p>
                    <p className="text-xs">Based on your age and income, this is the suggested minimum cover to ensure your family's financial security.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Insurance */}
        <Card className="bg-background/50">
          <CardHeader>
            <CardTitle className="text-lg">Health Insurance</CardTitle>
            <CardDescription>Do you have a health insurance policy?</CardDescription>
          </CardHeader>
          <CardContent>
             <RadioGroup
              onValueChange={(value: 'yes' | 'no') => setHasHealthInsurance(value)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="health-yes" />
                <Label htmlFor="health-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="health-no" />
                <Label htmlFor="health-no">No</Label>
              </div>
            </RadioGroup>
             {(hasHealthInsurance === 'yes' || hasHealthInsurance === 'no') && (
              <div className="mt-4 p-3 bg-accent/20 rounded-lg flex items-start gap-3 text-accent-foreground">
                <Info className="h-5 w-5 mt-0.5 shrink-0"/>
                 <div>
                    <p className="font-semibold">Recommended Health Cover:</p>
                    <p className="text-lg font-bold">{recommendedHealthCover}</p>
                    <p className="text-xs">This is a suggested range for individual health coverage to handle medical emergencies without financial strain.</p>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FormSection>
  );
}