"use client";

import { HandCoins } from "lucide-react";

export function Header() {
  return (
    <header className="bg-card border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <HandCoins className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              FinFriend Planner
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
