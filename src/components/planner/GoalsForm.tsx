"use client";

import type { Goal, GoalWithSip } from '@/lib/types';
import { FormSection } from './FormSection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, PlusCircle, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Props {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  goalsWithSip: GoalWithSip[];
}

const goalTypes = ["Retirement", "Child Education", "Marriage", "House", "Other"];

export function GoalsForm({ goals, setGoals, goalsWithSip }: Props) {
  
  const handleUpdate = (id: string, field: 'name' | 'corpus' | 'years' | 'rate', value: string | number) => {
    setGoals(goals.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  
  const handleAdd = () => {
    setGoals([...goals, { id: Date.now().toString(), name: '', corpus: '', years: '', rate: '' }]);
  };
  
  const handleRemove = (id: string) => {
    setGoals(goals.filter(item => item.id !== id));
  };

  return (
    <FormSection
      title="Financial Goals"
      description="Plan your investments for future milestones."
      icon={<Target className="h-6 w-6" />}
      className="xl:col-span-2"
    >
      <div className="space-y-4">
        {goals.map((goal, index) => (
          <div key={goal.id} className="p-4 border rounded-lg space-y-4 relative">
             <div className="absolute top-2 right-2">
                <Button variant="ghost" size="icon" onClick={() => handleRemove(goal.id)} className="text-destructive h-7 w-7">
                  <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2 space-y-1.5">
                <label className="text-sm font-medium">Goal Name</label>
                 <Select
                  value={goal.name}
                  onValueChange={(value) => handleUpdate(goal.id, 'name', value)}
                >
                  <SelectTrigger><SelectValue placeholder="Select goal" /></SelectTrigger>
                  <SelectContent>
                    {goalTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                 <label className="text-sm font-medium">Corpus (₹)</label>
                <Input
                  type="number"
                  placeholder="Target Amount"
                  value={goal.corpus}
                  onChange={(e) => handleUpdate(goal.id, 'corpus', e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Years</label>
                <Input
                  type="number"
                  placeholder="Time Horizon"
                  value={goal.years}
                  onChange={(e) => handleUpdate(goal.id, 'years', e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <div className="space-y-1.5">
                 <label className="text-sm font-medium">Return Rate (%)</label>
                <Input
                  type="number"
                  placeholder="e.g., 12"
                  value={goal.rate}
                  onChange={(e) => handleUpdate(goal.id, 'rate', e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
            </div>
            <div className="bg-accent/20 text-accent-foreground p-3 rounded-md flex justify-between items-center">
                <span className="font-semibold text-sm">Required Monthly SIP</span>
                <Badge variant="secondary" className="text-lg font-bold bg-accent text-accent-foreground">
                    ₹{goalsWithSip[index]?.sip.toLocaleString('en-IN') || 0}
                </Badge>
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="mt-4" onClick={handleAdd}>
        <PlusCircle className="mr-2 h-4 w-4" /> Add Goal
      </Button>
    </FormSection>
  );
}
