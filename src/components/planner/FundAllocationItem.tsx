
"use client";

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Trash2 } from 'lucide-react';
import type { FundAllocation, Fund, Goal } from '@/lib/types';

interface FundAllocationItemProps {
  alloc: FundAllocation;
  funds: Fund[];
  fundNames: string[];
  isLoadingFunds: boolean;
  availableGoals: Goal[];
  onUpdate: (id: string, field: keyof FundAllocation, value: string | number) => void;
  onRemove: (id: string) => void;
}

export function FundAllocationItem({
  alloc,
  funds,
  fundNames,
  isLoadingFunds,
  availableGoals,
  onUpdate,
  onRemove,
}: FundAllocationItemProps) {
  const selectedFund = funds.find(f => f.fundName === alloc.fundName);
  const schemes = useMemo(() => selectedFund ? selectedFund.schemes.map(s => s.schemeName) : [], [selectedFund]);

  return (
    <Card key={alloc.id} className="p-4 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 text-destructive"
        onClick={() => onRemove(alloc.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor={`goalId-${alloc.id}`}>Goal Name</Label>
          <Select
            value={alloc.goalId}
            onValueChange={(value) => onUpdate(alloc.id, 'goalId', value)}
          >
            <SelectTrigger id={`goalId-${alloc.id}`}>
              <SelectValue placeholder="Select a goal to link" />
            </SelectTrigger>
            <SelectContent>
              {availableGoals.map(goal => (
                <SelectItem key={goal.id} value={goal.id}>
                  {goal.otherType || goal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`sipRequired-${alloc.id}`}>SIP required for fund</Label>
          <Input
            id={`sipRequired-${alloc.id}`}
            type="number"
            placeholder="e.g., 5000"
            value={alloc.sipRequired}
            onChange={(e) => onUpdate(alloc.id, 'sipRequired', e.target.value === '' ? '' : Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`fundName-${alloc.id}`}>Mutual Fund</Label>
          <SearchableSelect
            options={fundNames}
            value={alloc.fundName}
            onChange={(value) => onUpdate(alloc.id, 'fundName', value)}
            placeholder={isLoadingFunds ? "Loading funds..." : "Search for a fund"}
            disabled={isLoadingFunds}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`schemeName-${alloc.id}`}>Scheme</Label>
          <SearchableSelect
            options={schemes}
            value={alloc.schemeName}
            onChange={(value) => onUpdate(alloc.id, 'schemeName', value)}
            placeholder={!alloc.fundName ? "Select a fund first" : "Search for a scheme"}
            disabled={!alloc.fundName || schemes.length === 0}
          />
        </div>
      </div>
    </Card>
  );
}
