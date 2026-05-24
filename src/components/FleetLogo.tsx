import React from "react";

export default function FleetLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Hexagon with gradient */}
      <path
        d="M20 2L35.5885 11V29L20 38L4.41154 29V11L20 2Z"
        fill="url(#bg_grad)"
      />
      {/* Top face for 3D effect */}
      <path
        d="M20 2L35.5885 11L20 20L4.41154 11L20 2Z"
        fill="white"
        fillOpacity="0.25"
      />
      {/* Right face for 3D effect */}
      <path
        d="M20 20L35.5885 11V29L20 38V20Z"
        fill="black"
        fillOpacity="0.15"
      />
      {/* Center Circle */}
      <circle cx="20" cy="20" r="5" fill="white" />
      {/* Inner Node Lines */}
      <path
        d="M20 20L20 7M20 20L31.2583 26.5M20 20L8.74167 26.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Outer Nodes */}
      <circle cx="20" cy="7" r="2" fill="white" />
      <circle cx="31.2583" cy="26.5" r="2" fill="white" />
      <circle cx="8.74167" cy="26.5" r="2" fill="white" />
      
      <defs>
        <linearGradient id="bg_grad" x1="4" y1="2" x2="35" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>
    </svg>
  );
}