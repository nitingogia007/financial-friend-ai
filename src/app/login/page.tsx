
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

const logoUrl = "https://firebasestorage.googleapis.com/v0/b/finfriend-planner.firebasestorage.app/o/Artboard.png?alt=media&token=165d5717-85f6-4bc7-a76a-24d8a8a81de5";


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  if (user) {
    router.push('/');
    return null;
  }

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSigningUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: 'Account created successfully! Redirecting...' });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: 'Logged in successfully! Redirecting...' });
      }
      router.push('/');
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Authentication Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-48 relative mb-4">
             <Image 
                src={logoUrl}
                alt="FinFriend Planner Logo" 
                fill
                style={{ objectFit: 'contain' }}
                priority
                unoptimized
            />
          </div>
          <CardTitle className="text-2xl">{isSigningUp ? 'Create an Account' : 'Welcome Back'}</CardTitle>
          <CardDescription>
            {isSigningUp ? 'Enter your details to get started.' : 'Sign in to access your financial planner.'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAuthAction}>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
            </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSigningUp ? 'Sign Up' : 'Sign In'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
                {isSigningUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                type="button"
                onClick={() => setIsSigningUp(!isSigningUp)}
                className="font-medium text-primary underline-offset-4 hover:underline"
                >
                {isSigningUp ? 'Sign In' : 'Sign Up'}
                </button>
            </p>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
