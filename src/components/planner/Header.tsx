
"use client";

import Image from "next/image";

export function Header() {
  return (
    <header className="bg-card border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3 animate-logo-bob">
            <div className="relative h-10 w-48">
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
      </div>
    </header>
  );
}
