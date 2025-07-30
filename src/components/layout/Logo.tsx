
import React from 'react';

export function Logo() {
  return (
    <svg
      viewBox="0 0 500 100"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ fontFamily: "'Comic Sans MS', 'Roboto', sans-serif" }}
    >
      <text
        x="10"
        y="60"
        fill="#2c3e50"
        fontSize="48"
        fontWeight="bold"
        className="font-headline"
      >
        Financial Friend
      </text>
    </svg>
  );
}
