// Triggering a new deployment.

"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const Planner = dynamic(() => import('@/components/planner/Planner').then(mod => mod.Planner), {
  ssr: false,
  loading: () => <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>,
});


export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <>
      <main>
        <Planner />
      </main>
    </>
  );
}
