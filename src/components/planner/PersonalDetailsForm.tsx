"use client";

import type { PersonalDetails } from '@/lib/types';
import { FormSection } from './FormSection';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

interface Props {
  details: PersonalDetails;
  setDetails: React.Dispatch<React.SetStateAction<PersonalDetails>>;
}

export function PersonalDetailsForm({ details, setDetails }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setDetails(prev => ({ ...prev, [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value }));
  };

  return (
    <FormSection
      title="Personal Details"
      description="Let's start with some basic information."
      icon={<User className="h-6 w-6" />}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" value={details.name} onChange={handleChange} placeholder="John Doe" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input id="dob" name="dob" type="date" value={details.dob} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dependents">Number of Dependents</Label>
          <Input id="dependents" name="dependents" type="number" min="0" value={details.dependents} onChange={handleChange} placeholder="2" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="retirementAge">Retirement Age</Label>
          <Input id="retirementAge" name="retirementAge" type="number" min="0" value={details.retirementAge} onChange={handleChange} placeholder="60" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mobile">Mobile Number</Label>
          <Input id="mobile" name="mobile" value={details.mobile} onChange={handleChange} placeholder="9876543210" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" name="email" type="email" value={details.email} onChange={handleChange} placeholder="john.doe@example.com" />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="arn">ARN (Optional)</Label>
          <Input id="arn" name="arn" value={details.arn} onChange={handleChange} placeholder="Enter ARN if available" />
        </div>
      </div>
    </FormSection>
  );
}
