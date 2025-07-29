
import { Planner } from '@/components/planner/Planner';
import { AppHeader } from '@/components/layout/AppHeader';

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
