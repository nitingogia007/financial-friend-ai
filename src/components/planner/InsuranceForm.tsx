"use client";

import type { Insurance } from '@/lib/types';
import { FormSection } from './FormSection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  insurances: Insurance[];
  setInsurances: React.Dispatch<React.SetStateAction<Insurance[]>>;
}

const insuranceTypes = ['Life', 'Health'];

export function InsuranceForm({ insurances, setInsurances }: Props) {
  
  const handleUpdate = (id: string, field: 'type' | 'cover' | 'premium', value: string | number) => {
    setInsurances(insurances.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  
  const handleAdd = () => {
    setInsurances([...insurances, { id: Date.now().toString(), type: '', cover: '', premium: '' }]);
  };
  
  const handleRemove = (id: string) => {
    setInsurances(insurances.filter(item => item.id !== id));
  };

  const getNumericValue = (val: number | '') => typeof val === 'number' ? val : 0;

  const totalCover = useMemo(() => insurances.reduce((sum, i) => sum + getNumericValue(i.cover), 0), [insurances]);
  const totalPremium = useMemo(() => insurances.reduce((sum, i) => sum + getNumericValue(i.premium), 0), [insurances]);


  return (
    <FormSection
      title="Insurance Details"
      description="Review your life and health protection."
      icon={<ShieldCheck className="h-6 w-6" />}
    >
      <div className="space-y-3">
        {insurances.map((insurance) => (
          <div key={insurance.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
            <Select
              value={insurance.type}
              onValueChange={(value: 'Life' | 'Health') => handleUpdate(insurance.id, 'type', value)}
            >
              <SelectTrigger><SelectValue placeholder="Policy Type" /></SelectTrigger>
              <SelectContent>
                {insuranceTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Cover (₹)"
              value={insurance.cover}
              onChange={(e) => handleUpdate(insurance.id, 'cover', e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Input
              type="number"
              placeholder="Premium (₹)"
              value={insurance.premium}
              onChange={(e) => handleUpdate(insurance.id, 'premium', e.target.value === '' ? '' : Number(e.target.value))}
            />
            <Button variant="ghost" size="icon" onClick={() => handleRemove(insurance.id)} className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="mt-3" onClick={handleAdd}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Policy
      </Button>

      <div className="mt-6 space-y-2">
        <div className="bg-primary/5 p-3 rounded-lg flex items-center justify-between">
            <span className="font-semibold text-sm text-foreground">Total Cover Amount</span>
            <span className="font-bold text-md text-primary font-headline">
                ₹{totalCover.toLocaleString('en-IN')}
            </span>
        </div>
        <div className="bg-primary/5 p-3 rounded-lg flex items-center justify-between">
            <span className="font-semibold text-sm text-foreground">Total Annual Premium</span>
            <span className="font-bold text-md text-primary font-headline">
                ₹{totalPremium.toLocaleString('en-IN')}
            </span>
        </div>
      </div>
    </FormSection>
  );
}
