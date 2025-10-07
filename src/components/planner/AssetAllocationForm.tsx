
"use client";

import { useMemo, useEffect } from 'react';
import { FormSection } from './FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import type { AssetAllocationProfile, RiskAppetite } from '@/lib/types';
import { getAssetAllocation } from '@/lib/calculations';

interface Props {
  age: number | null;
  profile: AssetAllocationProfile;
  setProfile: React.Dispatch<React.SetStateAction<AssetAllocationProfile>>;
}

const riskAppetiteOptions: RiskAppetite[] = ['High Aggressive', 'High', 'Moderate', 'Conservative'];

export function AssetAllocationForm({ age, profile, setProfile }: Props) {
  
  useEffect(() => {
    if (age !== null) {
      setProfile(prev => ({ ...prev, age }));
    }
  }, [age, setProfile]);

  const handleRiskChange = (value: RiskAppetite) => {
    setProfile(prev => ({ ...prev, riskAppetite: value }));
  };

  const allocation = useMemo(() => getAssetAllocation(profile.age, profile.riskAppetite), [profile.age, profile.riskAppetite]);

  return (
    <FormSection
      title="Asset Allocation"
      description="Get a recommended asset allocation based on your age and risk profile."
      icon={<BarChart3 className="h-6 w-6" />}
      className="xl:col-span-2"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-age">Your Age</Label>
            <Input
              id="user-age"
              type="number"
              placeholder="Calculated from DOB"
              value={age ?? ''}
              readOnly
              className="bg-muted/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk-appetite">Risk Appetite</Label>
            <Select value={profile.riskAppetite} onValueChange={handleRiskChange}>
              <SelectTrigger id="risk-appetite">
                <SelectValue placeholder="Select your risk profile" />
              </SelectTrigger>
              <SelectContent>
                {riskAppetiteOptions.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-primary">Recommended Allocation</h3>
            <Card className="bg-accent/5">
                <CardContent className="p-0">
                    {allocation ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset Category</TableHead>
                                    <TableHead className="text-right">Allocation</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(allocation).map(([key, value]) => {
                                    if (value > 0) { // Only show categories with an allocation
                                        return (
                                            <TableRow key={key}>
                                                <TableCell className="font-medium">{key}</TableCell>
                                                <TableCell className="text-right font-bold">{value}%</TableCell>
                                            </TableRow>
                                        )
                                    }
                                    return null;
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-6 text-center text-muted-foreground">
                            Please provide your age and risk appetite to see recommendations.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </FormSection>
  );
}
