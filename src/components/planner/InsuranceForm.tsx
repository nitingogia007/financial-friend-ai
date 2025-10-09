
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { Income, InsuranceAnalysisData, LifeInsuranceQuote, HealthInsuranceQuote } from '@/lib/types';
import { FormSection } from './FormSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Info, PlusCircle, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { Button } from '../ui/button';

interface Props {
  age: number | null;
  incomes: Income[];
  onInsuranceDataChange: (data: InsuranceAnalysisData) => void;
}

// A simple estimation function for premium.
const estimatePremium = (cover: number, factor: number) => Math.round(cover * factor);

let nextId = 0;

const initialLifeQuote: Omit<LifeInsuranceQuote, 'id'> = {
    planName: '',
    premiumAmount: '',
    premiumPaymentTerm: '',
    policyTerm: '',
    coverAmount: ''
};

const initialHealthQuote: Omit<HealthInsuranceQuote, 'id'> = {
    company: '',
    planName: '',
    premium1Y: '',
    sumAssured: '',
    preHospitalization: '',
    postHospitalization: '',
    waitingPeriodPED: '',
    roomRent: '',
    restoreBenefit: '',
    ambulanceRoad: '',
    ambulanceAir: '',
    healthCheckup: '',
    eConsultation: ''
};


export function InsuranceForm({ age, incomes, onInsuranceDataChange }: Props) {
  const [hasLifeInsurance, setHasLifeInsurance] = useState<'yes' | 'no' | null>(null);
  const [hasHealthInsurance, setHasHealthInsurance] = useState<'yes' | 'no' | null>(null);
  
  const [lifeCover, setLifeCover] = useState<number | ''>('');
  const [lifePremium, setLifePremium] = useState<number | ''>('');
  const [healthCover, setHealthCover] = useState<number | ''>('');
  const [healthPremium, setHealthPremium] = useState<number | ''>('');
  
  const [lifeQuotes, setLifeQuotes] = useState<LifeInsuranceQuote[]>([]);
  const [healthQuotes, setHealthQuotes] = useState<HealthInsuranceQuote[]>([]);


  const handleAddQuote = (type: 'life' | 'health') => {
    if (type === 'life') {
      setLifeQuotes(prev => [...prev, { id: `life-${nextId++}`, ...initialLifeQuote }]);
    } else {
      setHealthQuotes(prev => [...prev, { id: `health-${nextId++}`, ...initialHealthQuote }]);
    }
  };

  const handleRemoveQuote = (type: 'life' | 'health', id: string) => {
    if (type === 'life') {
      setLifeQuotes(prev => prev.filter(q => q.id !== id));
    } else {
      setHealthQuotes(prev => prev.filter(q => q.id !== id));
    }
  };

  const handleLifeQuoteChange = (id: string, field: keyof LifeInsuranceQuote, value: string | number) => {
    setLifeQuotes(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleHealthQuoteChange = (id: string, field: keyof HealthInsuranceQuote, value: string | number) => {
    setHealthQuotes(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };
  
  const relevantAnnualIncome = useMemo(() => {
    return incomes
      .filter(i => i.source === 'Salary' || i.source === 'Business')
      .reduce((sum, i) => sum + (typeof i.amount === 'number' ? i.amount : 0), 0);
  }, [incomes]);

  const recommendedLifeCover = useMemo(() => {
    if (!age || !relevantAnnualIncome) return 0;
    if (age >= 20 && age < 35) return relevantAnnualIncome * 20;
    if (age >= 35 && age < 50) return relevantAnnualIncome * 15;
    if (age >= 50 && age < 60) return relevantAnnualIncome * 10;
    if (age >= 60) return relevantAnnualIncome * 1;
    return 0;
  }, [age, relevantAnnualIncome]);

  const lifeCoverGap = useMemo(() => {
    const current = hasLifeInsurance === 'yes' ? (lifeCover || 0) : 0;
    const gap = recommendedLifeCover - Number(current);
    return gap > 0 ? gap : 0;
  }, [hasLifeInsurance, lifeCover, recommendedLifeCover]);

  const recommendedHealthCoverText = useMemo(() => {
    if (!age) return 'N/A';
    if (age < 30) return '₹7 Lac - ₹10 Lac';
    if (age >= 30 && age <= 45) return '₹15 Lac - ₹20 Lac';
    if (age > 45 && age <= 60) return '₹25 Lac - ₹30 Lac';
    return '₹30 Lac - ₹40 Lac';
  }, [age]);

  const numericRecommendedHealthCover = useMemo(() => {
    if (!age) return 0;
    if (age < 30) return 1000000;
    if (age >= 30 && age <= 45) return 2000000;
    if (age > 45 && age <= 60) return 3000000;
    return 4000000;
  }, [age]);

  const healthCoverGap = useMemo(() => {
    const current = hasHealthInsurance === 'yes' ? (healthCover || 0) : 0;
    const gap = numericRecommendedHealthCover - Number(current);
    return gap > 0 ? gap : 0;
  }, [hasHealthInsurance, healthCover, numericRecommendedHealthCover]);
  
  const canShowRecommendations = age !== null && age > 0;

  useEffect(() => {
    onInsuranceDataChange({
      lifeInsurance: {
        recommendedCover: recommendedLifeCover,
        currentCover: hasLifeInsurance === 'yes' ? lifeCover : '',
        currentPremium: hasLifeInsurance === 'yes' ? lifePremium : '',
        coverageGap: lifeCoverGap,
        quotes: lifeQuotes,
      },
      healthInsurance: {
        recommendedCover: recommendedHealthCoverText,
        currentCover: hasHealthInsurance === 'yes' ? healthCover : '',
        currentPremium: hasHealthInsurance === 'yes' ? healthPremium : '',
        coverageGap: healthCoverGap,
        quotes: healthQuotes,
      }
    });
  }, [
    recommendedLifeCover, lifeCoverGap, lifeCover, lifePremium, hasLifeInsurance,
    recommendedHealthCoverText, healthCoverGap, healthCover, healthPremium, hasHealthInsurance,
    onInsuranceDataChange, lifeQuotes, healthQuotes
  ]);
  
  const renderLifeQuoteForm = (quote: LifeInsuranceQuote) => (
    <Card key={quote.id} className="mt-4 p-4 space-y-4 border-dashed animate-in fade-in-50 relative">
        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-destructive" onClick={() => handleRemoveQuote('life', quote.id)}>
            <Trash2 className="h-4 w-4" />
        </Button>
        <h4 className="font-semibold text-md text-primary">Life Insurance Plan Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <Label>Plan Name</Label>
                <Input value={quote.planName} onChange={e => handleLifeQuoteChange(quote.id, 'planName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
                <Label>Premium Amount (₹)</Label>
                <Input type="number" value={quote.premiumAmount} onChange={e => handleLifeQuoteChange(quote.id, 'premiumAmount', Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
                <Label>Premium Payment Term</Label>
                <Input value={quote.premiumPaymentTerm} onChange={e => handleLifeQuoteChange(quote.id, 'premiumPaymentTerm', e.target.value)} />
            </div>
             <div className="space-y-1.5">
                <Label>Policy Term</Label>
                <Input value={quote.policyTerm} onChange={e => handleLifeQuoteChange(quote.id, 'policyTerm', e.target.value)} />
            </div>
             <div className="space-y-1.5">
                <Label>Cover Amount (₹)</Label>
                <Input type="number" value={quote.coverAmount} onChange={e => handleLifeQuoteChange(quote.id, 'coverAmount', Number(e.target.value))} />
            </div>
        </div>
    </Card>
  );

  const renderHealthQuoteForm = (quote: HealthInsuranceQuote) => (
     <Card key={quote.id} className="mt-4 p-4 space-y-4 border-dashed animate-in fade-in-50 relative">
        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-destructive" onClick={() => handleRemoveQuote('health', quote.id)}>
            <Trash2 className="h-4 w-4" />
        </Button>
        <h4 className="font-semibold text-md text-primary">Health Insurance Plan Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label>Company</Label><Input value={quote.company} onChange={e => handleHealthQuoteChange(quote.id, 'company', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Plan Name</Label><Input value={quote.planName} onChange={e => handleHealthQuoteChange(quote.id, 'planName', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Premium (1Y)</Label><Input type="number" value={quote.premium1Y} onChange={e => handleHealthQuoteChange(quote.id, 'premium1Y', Number(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Sum Assured</Label><Input value={quote.sumAssured} onChange={e => handleHealthQuoteChange(quote.id, 'sumAssured', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Pre-Hospitalization</Label><Select value={quote.preHospitalization} onValueChange={(v: any) => handleHealthQuoteChange(quote.id, 'preHospitalization', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Covered">Covered</SelectItem><SelectItem value="Not Covered">Not Covered</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Post-Hospitalization</Label><Select value={quote.postHospitalization} onValueChange={(v: any) => handleHealthQuoteChange(quote.id, 'postHospitalization', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Covered">Covered</SelectItem><SelectItem value="Not Covered">Not Covered</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Waiting Period (PED)</Label><Select value={quote.waitingPeriodPED} onValueChange={(v: any) => handleHealthQuoteChange(quote.id, 'waitingPeriodPED', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Covered">Covered</SelectItem><SelectItem value="Not Covered">Not Covered</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Room Rent</Label><Select value={quote.roomRent} onValueChange={(v: any) => handleHealthQuoteChange(quote.id, 'roomRent', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="No cap">No cap</SelectItem><SelectItem value="Optional cap">Optional cap</SelectItem><SelectItem value="Private room">Private room</SelectItem><SelectItem value="Single private room">Single private room</SelectItem><SelectItem value="All Types of Rooms">All Types of Rooms</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Restore Benefit</Label><Select value={quote.restoreBenefit} onValueChange={(v: any) => handleHealthQuoteChange(quote.id, 'restoreBenefit', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="(Full SI)">(Full SI)</SelectItem><SelectItem value="(Once)">(Once)</SelectItem><SelectItem value="(Unlimited)">(Unlimited)</SelectItem><SelectItem value="(Unlimited for same/different illness)">(Unlimited for same/different illness)</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Ambulance (Road)</Label><Select value={quote.ambulanceRoad} onValueChange={(v: any) => handleHealthQuoteChange(quote.id, 'ambulanceRoad', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Included">Included</SelectItem><SelectItem value="Excluded">Excluded</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Ambulance (Air)</Label><Select value={quote.ambulanceAir} onValueChange={(v: any) => handleHealthQuoteChange(quote.id, 'ambulanceAir', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Optional">Optional</SelectItem><SelectItem value="Included">Included</SelectItem><SelectItem value="Excluded">Excluded</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>Health Check-up</Label><Select value={quote.healthCheckup} onValueChange={(v: any) => handleHealthQuoteChange(quote.id, 'healthCheckup', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Covered">Covered</SelectItem><SelectItem value="Not Covered">Not Covered</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><Label>E-Consultation</Label><Select value={quote.eConsultation} onValueChange={(v: any) => handleHealthQuoteChange(quote.id, 'eConsultation', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Included">Included</SelectItem><SelectItem value="Not included">Not included</SelectItem></SelectContent></Select></div>
        </div>
     </Card>
  );

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
              <RadioGroup value={hasLifeInsurance ?? ''} onValueChange={(value: 'yes' | 'no') => setHasLifeInsurance(value)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="life-yes" /><Label htmlFor="life-yes">Yes</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="life-no" /><Label htmlFor="life-no">No</Label></div>
              </RadioGroup>
            </div>
            
            {hasLifeInsurance === 'yes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-50">
                <div className="space-y-2"><Label htmlFor="life-cover">Total Annual Cover (₹)</Label><Input id="life-cover" type="number" placeholder="e.g., 10000000" value={lifeCover} onChange={e => setLifeCover(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                <div className="space-y-2"><Label htmlFor="life-premium">Total Annual Premium (₹)</Label><Input id="life-premium" type="number" placeholder="e.g., 25000" value={lifePremium} onChange={e => setLifePremium(e.target.value === '' ? '' : Number(e.target.value))} /></div>
              </div>
            )}
            
            {lifeQuotes.map(quote => renderLifeQuoteForm(quote))}
            
            {hasLifeInsurance !== null && (
                <Button variant="outline" size="sm" onClick={() => handleAddQuote('life')} className="animate-in fade-in-50"><PlusCircle className="mr-2 h-4 w-4" /> Add Insurance Plan (Optional)</Button>
            )}

            {canShowRecommendations && relevantAnnualIncome > 0 ? (
              <>
                <Separator />
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3 text-blue-800 dark:text-blue-300">
                  <Info className="h-5 w-5 mt-0.5 shrink-0 text-blue-500"/>
                  <div className="w-full">
                    <p className="font-semibold text-blue-600 dark:text-blue-200">Recommendation:</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-1">
                        <span className="font-medium">Ideal Life Cover:</span><span className="font-bold text-right">₹{recommendedLifeCover.toLocaleString('en-IN')}</span>
                        {hasLifeInsurance === 'no' && (<><span className="font-medium">Est. Annual Premium:</span><span className="font-bold text-right">₹{estimatePremium(recommendedLifeCover, 0.0025).toLocaleString('en-IN')}</span></>)}
                    </div>
                     {lifeCoverGap > 0 && (<div className="text-xs mt-3 pt-2 border-t border-blue-500/20"><p className="font-semibold text-orange-600 dark:text-orange-400">You have a coverage gap of ₹{lifeCoverGap.toLocaleString('en-IN')}.</p></div>)}
                     {lifeCoverGap <= 0 && hasLifeInsurance === 'yes' && (<div className="text-xs mt-3 pt-2 border-t border-blue-500/20"><p className="font-semibold text-green-600 dark:text-green-400">Great! Your cover meets or exceeds the recommendation.</p></div>)}
                    {hasLifeInsurance === 'no' && <p className="text-xs mt-1">This is the suggested minimum cover to ensure your family's financial security.</p>}
                  </div>
                </div>
              </>
            ) : ( <div className="text-center text-muted-foreground p-4 text-sm">Enter your Date of Birth and Salary/Business Income to see recommendations.</div>)}
          </CardContent>
        </Card>

        {/* Health Insurance */}
        <Card className="bg-background/50">
          <CardHeader><CardTitle className="text-lg">Health Insurance</CardTitle></CardHeader>
           <CardContent className="space-y-4">
             <div className="space-y-2">
              <Label>Do you have Health Insurance?</Label>
              <RadioGroup value={hasHealthInsurance ?? ''} onValueChange={(value: 'yes' | 'no') => setHasHealthInsurance(value)} className="flex gap-4">
                <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="health-yes" /><Label htmlFor="health-yes">Yes</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="health-no" /><Label htmlFor="health-no">No</Label></div>
              </RadioGroup>
            </div>
            
            {hasHealthInsurance === 'yes' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in-50">
                <div className="space-y-2"><Label htmlFor="health-cover">Total Annual Cover (₹)</Label><Input id="health-cover" type="number" placeholder="e.g., 1000000" value={healthCover} onChange={e => setHealthCover(e.target.value === '' ? '' : Number(e.target.value))} /></div>
                <div className="space-y-2"><Label htmlFor="health-premium">Total Annual Premium (₹)</Label><Input id="health-premium" type="number" placeholder="e.g., 15000" value={healthPremium} onChange={e => setHealthPremium(e.target.value === '' ? '' : Number(e.target.value))} /></div>
              </div>
            )}
            
            {healthQuotes.map(quote => renderHealthQuoteForm(quote))}

            {hasHealthInsurance !== null && (
                <Button variant="outline" size="sm" onClick={() => handleAddQuote('health')} className="animate-in fade-in-50"><PlusCircle className="mr-2 h-4 w-4" /> Add Insurance Plan (Optional)</Button>
            )}


            {canShowRecommendations ? (
              <>
                <Separator />
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3 text-blue-800 dark:text-blue-300">
                  <Info className="h-5 w-5 mt-0.5 shrink-0 text-blue-500"/>
                   <div className="w-full">
                      <p className="font-semibold text-blue-600 dark:text-blue-200">Recommendation:</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-1">
                        <span className="font-medium">Ideal Health Cover:</span><span className="font-bold text-right">{recommendedHealthCoverText}</span>
                        {hasHealthInsurance === 'no' && (<><span className="font-medium">Est. Annual Premium:</span><span className="font-bold text-right">₹{estimatePremium(numericRecommendedHealthCover, 0.015).toLocaleString('en-IN')}</span></>)}
                    </div>
                    {healthCoverGap > 0 && (<div className="text-xs mt-3 pt-2 border-t border-blue-500/20"><p className="font-semibold text-orange-600 dark:text-orange-400">You have a coverage gap of ₹{healthCoverGap.toLocaleString('en-IN')}.</p></div>)}
                    {healthCoverGap <= 0 && hasHealthInsurance === 'yes' && (<div className="text-xs mt-3 pt-2 border-t border-blue-500/20"><p className="font-semibold text-green-600 dark:text-green-400">Great! Your cover meets or exceeds the recommendation.</p></div>)}
                    {hasHealthInsurance === 'no' && <p className="text-xs mt-1">This is a suggested range for individual health coverage.</p>}
                   </div>
                </div>
              </>
            ) : ( <div className="text-center text-muted-foreground p-4 text-sm">Enter your Date of Birth to see recommendations.</div>)}
          </CardContent>
        </Card>
      </div>
    </FormSection>
  );
}
