import { Planner } from '@/components/planner/Planner';
import { AppHeader } from '@/components/layout/AppHeader';
import { ThemeProvider } from '@/components/theme-provider';

export default function Home() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AppHeader />
      <main>
        <Planner />
      </main>
    </ThemeProvider>
  );
}
