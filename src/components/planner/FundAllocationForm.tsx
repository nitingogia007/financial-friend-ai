
"use client";

import type { FundAllocation } from '@/lib/types';
import { FormSection } from './FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PieChart } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  allocation: FundAllocation;
  setAllocation: React.Dispatch<React.SetStateAction<FundAllocation>>;
}

export function FundAllocationForm({ allocation, setAllocation }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAllocation(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };

  const totalAllocation = useMemo(() => {
    return Object.values(allocation).reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
  }, [allocation]);

  const categories: (keyof FundAllocation)[] = [
    'largeCap', 'midCap', 'smallCap', 'multiFlexiCap', 'sectoral', 'debt', 'hybrid'
  ];
  
  const categoryLabels: Record<keyof FundAllocation, string> = {
    largeCap: 'Large Cap',
    midCap: 'Mid Cap',
    smallCap: 'Small Cap',
    multiFlexiCap: 'Multi + Flexi Cap',
    sectoral: 'Sectoral',
    debt: 'Debt',
    hybrid: 'Hybrid',
  };

  return (
    <FormSection
      title="Fund Allocation"
      description="Specify your mutual fund allocation percentages."
      icon={<PieChart className="h-6 w-6" />}
      className="xl:col-span-2"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => (
                <div key={category} className="space-y-2">
                    <Label htmlFor={category}>{categoryLabels[category]} (%)</Label>
                    <Input
                        id={category}
                        name={category}
                        type="number"
                        placeholder="e.g., 20"
                        value={allocation[category]}
                        onChange={handleChange}
                    />
                </div>
            ))}
        </div>
         <div className={`p-3 rounded-md text-center font-bold ${totalAllocation !== 100 ? 'bg-destructive/20 text-destructive-foreground' : 'bg-green-500/20 text-green-700'}`}>
            Total Allocation: {totalAllocation}%
            {totalAllocation !== 100 && <p className="text-xs font-normal">(Total should be 100%)</p>}
        </div>
      </div>
    </FormSection>
  );
}
