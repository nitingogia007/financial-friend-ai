
"use client";

import { HandCoins } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserDropdown } from "./UserDropdown";
import Image from "next/image";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-40 animate-logo-bob">
                <Image 
                    src="/financial-friend-logo.png" 
                    alt="FinFriend Planner Logo" 
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                />
            </div>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggle />
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
