
"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { UserDropdown } from "./UserDropdown";
import Image from "next/image";

const logoUrl = "https://firebasestorage.googleapis.com/v0/b/finfriend-planner.firebasestorage.app/o/Artboard.png?alt=media&token=165d5717-85f6-4bc7-a76a-24d8a8a81de5";

export function AppHeader() {
  return (
    <header className="z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-28 items-center">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-3">
            <div className="relative h-20 w-96 animate-logo-bob">
                <Image 
                  src={logoUrl}
                  alt="FinFriend Planner Logo" 
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                  unoptimized
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
