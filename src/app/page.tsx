
import { AppHeader } from '@/components/layout/AppHeader';
import { Planner } from '@/components/planner/Planner';

export default function Home() {
  return (
    <>
      <AppHeader />
      <main>
        <Planner />
      </main>
    </>
  );
}
