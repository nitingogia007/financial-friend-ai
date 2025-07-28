"use client";

import { useState } from 'react';
import type { Asset, Liability } from '@/lib/types';
import { FormSection } from './FormSection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Landmark, Trash2, PlusCircle, Wallet } from 'lucide-react';

interface Props {
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  liabilities: Liability[];
  setLiabilities: React.Dispatch<React.SetStateAction<Liability[]>>;
  netWorth: number;
}

const assetTypes = ["Bank", "Property", "Stocks", "Mutual Fund", "Gold", "Other"];
const liabilityTypes = ["Home Loan", "Car Loan", "Credit Card", "Other"];

export function AssetsLiabilitiesForm({ assets, setAssets, liabilities, setLiabilities, netWorth }: Props) {
  
  const handleUpdate = <T extends Asset | Liability>(
    items: T[], 
    setItems: React.Dispatch<React.SetStateAction<T[]>>, 
    id: string, 
    field: 'type' | 'amount', 
    value: string | number
  ) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleAdd = <T extends Asset | Liability>(
    items: T[],
    setItems: React.Dispatch<React.SetStateAction<T[]>>,
    newItem: T
  ) => {
    setItems([...items, newItem]);
  };
  
  const handleRemove = <T extends Asset | Liability>(
    items: T[],
    setItems: React.Dispatch<React.SetStateAction<T[]>>,
    id: string
  ) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <FormSection
      title="Assets & Liabilities"
      description="Calculate your current net worth."
      icon={<Landmark className="h-6 w-6" />}
    >
      <div className="space-y-6">
        {/* Assets Section */}
        <div>
          <h3 className="font-semibold text-lg mb-2 text-green-600">Assets</h3>
          <div className="space-y-3">
            {assets.map((asset, index) => (
              <div key={asset.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <Select
                  value={asset.type}
                  onValueChange={(value) => handleUpdate(assets, setAssets, asset.id, 'type', value)}
                >
                  <SelectTrigger><SelectValue placeholder="Select asset type" /></SelectTrigger>
                  <SelectContent>
                    {assetTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Amount (₹)"
                  value={asset.amount}
                  onChange={(e) => handleUpdate(assets, setAssets, asset.id, 'amount', e.target.value === '' ? '' : Number(e.target.value))}
                />
                <Button variant="ghost" size="icon" onClick={() => handleRemove(assets, setAssets, asset.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => handleAdd(assets, setAssets, { id: Date.now().toString(), type: '', amount: '' })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Asset
          </Button>
        </div>

        {/* Liabilities Section */}
        <div>
          <h3 className="font-semibold text-lg mb-2 text-red-600">Liabilities</h3>
          <div className="space-y-3">
            {liabilities.map((liability, index) => (
              <div key={liability.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <Select
                  value={liability.type}
                  onValueChange={(value) => handleUpdate(liabilities, setLiabilities, liability.id, 'type', value)}
                >
                  <SelectTrigger><SelectValue placeholder="Select liability type" /></SelectTrigger>
                  <SelectContent>
                    {liabilityTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Amount (₹)"
                  value={liability.amount}
                  onChange={(e) => handleUpdate(liabilities, setLiabilities, liability.id, 'amount', e.target.value === '' ? '' : Number(e.target.value))}
                />
                 <Button variant="ghost" size="icon" onClick={() => handleRemove(liabilities, setLiabilities, liability.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => handleAdd(liabilities, setLiabilities, { id: Date.now().toString(), type: '', amount: '' })}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Liability
          </Button>
        </div>

        {/* Net Worth Display */}
        <div className="bg-primary/10 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg text-primary">Net Worth</span>
          </div>
          <span className="font-bold text-2xl text-primary font-headline">
            ₹{netWorth.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </FormSection>
  );
}
