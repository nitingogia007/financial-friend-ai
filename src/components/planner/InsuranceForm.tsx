
"use client";

import { useState, useMemo } from 'react';
import { FormSection } from './FormSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Info } from 'lucide-react';
import { Separator } from '../ui/separator';

interface Props {
  age: number | null;
  totalAnnualIncome: number;
}

export function InsuranceForm({ age, totalAnnualIncome }: Props) {
  const [hasLifeInsurance, setHasLifeInsurance] = useState<'yes' | 'no'>('no');
  const [hasHealthInsurance, setHasHealthInsurance] = useState<'yes' | 'no'>('no');
  const [lifeCover, setLifeCover] = useState<number | ''>('');
  const [lifePremium, setLifePremium] = useState<number | ''>('');
  const [healthCover, setHealthCover] = useState<number | ''>('');
  const [healthPremium, setHealthPremium] = useState<number | ''>('');

  const recommendedLifeCover = useMemo(() => {
    if (!age || !totalAnnualIncome) return 0;
    if (age >= 20 && age <= 35) return totalAnnualIncome * 20;
    if (age > 35 && age <= 50) return totalAnnualIncome * 15;
    if (age > 50 && age <= 60) return totalAnnualIncome * 10;
    if (age > 60) return totalAnnualIncome * 1;
    return 0;
  }, [age, totalAnnualIncome]);

  const lifeCoverGap = useMemo(() => {
    if (hasLifeInsurance === 'no' || !lifeCover) return recommendedLifeCover;
    const gap = recommendedLifeCover - Number(lifeCover);
    return gap > 0 ? gap : 0;
  }, [hasLifeInsurance, lifeCover, recommendedLifeCover]);
  
  const recommendedHealthCover = useMemo(() => {
    if (!age) return 'N/A';
    if (age < 30) return '₹7 Lac - ₹10 Lac';
    if (age >= 30 && age <= 45) return '₹15 Lac - ₹20 Lac';
    if (age > 45 && age <= 60) return '₹25 Lac - ₹30 Lac';
    return '₹30 Lac - ₹40 Lac';
  }, [age]);

  const canShowRecommendations = age !== null && age > 0;

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
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Do you have Life Insurance?</Label>
              <RadioGroup value={hasLifeInsurance} onValueChange={(value: 'yes' | 'no') => setHasLifeInsurance(value)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="life-yes" />
                  <Label htmlFor="life-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="life-no" />
                  <Label htmlFor="life-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            
            {hasLifeInsurance === 'yes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-50">
                <div className="space-y-2">
                  <Label htmlFor="life-cover">Annual Cover (₹)</Label>
                  <Input id="life-cover" type="number" placeholder="e.g., 10000000" value={lifeCover} onChange={e => setLifeCover(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="life-premium">Annual Premium (₹)</Label>
                  <Input id="life-premium" type="number" placeholder="e.g., 25000" value={lifePremium} onChange={e => setLifePremium(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>
            )}

            {canShowRecommendations && totalAnnualIncome > 0 && <Separator />}

            {canShowRecommendations && totalAnnualIncome > 0 ? (
              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3 text-blue-800 dark:text-blue-200">
                <Info className="h-5 w-5 mt-0.5 shrink-0"/>
                <div>
                  <p className="font-semibold">Recommended Life Cover:</p>
                  <p className="text-lg font-bold">₹{recommendedLifeCover.toLocaleString('en-IN')}</p>
                   {hasLifeInsurance === 'yes' && lifeCover !== '' && (
                    <div className="text-xs mt-2">
                      {lifeCoverGap > 0 ? (
                         <p className="font-semibold">You have a coverage gap of ₹{lifeCoverGap.toLocaleString('en-IN')}.</p>
                      ) : (
                        <p className="font-semibold">Great! Your cover (₹{Number(lifeCover).toLocaleString('en-IN')}) meets the recommendation.</p>
                      )}
                    </div>
                  )}
                  {hasLifeInsurance === 'no' && <p className="text-xs mt-1">This is the suggested minimum cover to ensure your family's financial security.</p>}
                </div>
              </div>
            ) : (
                <div className="text-center text-muted-foreground p-4 text-sm">
                    Enter your Date of Birth and Income to see recommendations.
                </div>
            )}
          </CardContent>
        </Card>

        {/* Health Insurance */}
        <Card className="bg-background/50">
          <CardHeader>
            <CardTitle className="text-lg">Health Insurance</CardTitle>
          </CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-2">
              <Label>Do you have Health Insurance?</Label>
              <RadioGroup value={hasHealthInsurance} onValueChange={(value: 'yes' | 'no') => setHasHealthInsurance(value)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="health-yes" />
                  <Label htmlFor="health-yes">Yes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="health-no" />
                  <Label htmlFor="health-no">No</Label>
                </div>
              </RadioGroup>
            </div>
            
            {hasHealthInsurance === 'yes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-50">
                <div className="space-y-2">
                  <Label htmlFor="health-cover">Annual Cover (₹)</Label>
                  <Input id="health-cover" type="number" placeholder="e.g., 1000000" value={healthCover} onChange={e => setHealthCover(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="health-premium">Annual Premium (₹)</Label>
                  <Input id="health-premium" type="number" placeholder="e.g., 15000" value={healthPremium} onChange={e => setHealthPremium(e.target.value === '' ? '' : Number(e.target.value))} />
                </div>
              </div>
            )}

            {canShowRecommendations && <Separator />}

            {canShowRecommendations ? (
              <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3 text-blue-800 dark:text-blue-200">
                <Info className="h-5 w-5 mt-0.5 shrink-0"/>
                 <div>
                    <p className="font-semibold">Recommended Health Cover:</p>
                    <p className="text-lg font-bold">{recommendedHealthCover}</p>
                    <p className="text-xs mt-1">This is a suggested range for individual health coverage to handle medical emergencies without financial strain.</p>
                 </div>
              </div>
            ) : (
                <div className="text-center text-muted-foreground p-4 text-sm">
                    Enter your Date of Birth to see recommendations.
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FormSection>
  );
}
