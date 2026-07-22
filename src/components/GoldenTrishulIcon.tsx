import React from "react";

export function GoldenTrishulIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full drop-shadow-[0_0_8px_rgba(230,161,25,0.6)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main intense 3D gold gradient */}
          <linearGradient id="gold3D" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="15%" stopColor="#FFF2B2" />
            <stop offset="45%" stopColor="#FFD34E" />
            <stop offset="70%" stopColor="#D98A00" />
            <stop offset="90%" stopColor="#A65F00" />
            <stop offset="100%" stopColor="#593000" />
          </linearGradient>

          {/* Light gold for highlights */}
          <linearGradient id="lightGold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#FFECA1" />
            <stop offset="100%" stopColor="#E6A119" />
          </linearGradient>

          {/* Darker gold for beveling and 3D shadows */}
          <linearGradient id="darkGold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B37400" />
            <stop offset="50%" stopColor="#734400" />
            <stop offset="100%" stopColor="#D98A00" />
          </linearGradient>

          {/* Core bright radiant lens glow */}
          <radialGradient id="powerGlow" cx="50%" cy="37%" r="40%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="15%" stopColor="#FFF8D6" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#FFC821" stopOpacity="0.7" />
            <stop offset="75%" stopColor="#E6A119" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Ambient space glow behind trident */}
          <radialGradient id="ambientAura" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#E6A119" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#734400" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Subtle star particle filter */}
          <filter id="glowFilt" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Pitch black backdrop circle to emphasize the rich dark presentation */}
        <circle cx="50" cy="50" r="48" fill="#000000" />

        {/* Golden magic dust and glowing backdrop particles */}
        <circle cx="50" cy="40" r="32" fill="url(#ambientAura)" />

        {/* Sparkling stars matched to user's uploaded backdrop */}
        {/* Top left sparkle */}
        <g opacity="0.85" filter="url(#glowFilt)">
          <path d="M 24,30 L 24,36 M 21,33 L 27,33" stroke="#FFF7D1" strokeWidth="0.8" />
          <circle cx="24" cy="33" r="0.8" fill="#FFFFFF" />
        </g>
        {/* Top right sparkle */}
        <g opacity="0.9" filter="url(#glowFilt)">
          <path d="M 74,28 L 74,36 M 70,32 L 78,32" stroke="#FFF7D1" strokeWidth="0.8" />
          <circle cx="74" cy="32" r="1.0" fill="#FFFFFF" />
        </g>
        {/* Mid left tiny spark */}
        <g opacity="0.65" filter="url(#glowFilt)">
          <path d="M 18,52 L 18,56 M 16,54 L 20,54" stroke="#FFF7D1" strokeWidth="0.6" />
        </g>
        {/* Mid right tiny spark */}
        <g opacity="0.7" filter="url(#glowFilt)">
          <path d="M 80,56 L 80,60 M 78,58 L 82,58" stroke="#FFF7D1" strokeWidth="0.6" />
        </g>
        {/* Bottom left star */}
        <g opacity="0.8" filter="url(#glowFilt)">
          <path d="M 32,70 L 32,74 M 30,72 L 34,72" stroke="#FFDF7A" strokeWidth="0.7" />
        </g>
        {/* Bottom right star */}
        <g opacity="0.75" filter="url(#glowFilt)">
          <path d="M 68,74 L 68,78 M 66,76 L 70,76" stroke="#FFDF7A" strokeWidth="0.7" />
        </g>

        {/* Tiny golden specks */}
        <circle cx="34" cy="22" r="0.4" fill="#FFC821" opacity="0.8" />
        <circle cx="65" cy="24" r="0.5" fill="#FFC821" opacity="0.9" />
        <circle cx="28" cy="45" r="0.4" fill="#FFC821" opacity="0.7" />
        <circle cx="72" cy="48" r="0.3" fill="#FFC821" opacity="0.8" />
        <circle cx="40" cy="62" r="0.5" fill="#FFC821" opacity="0.65" />
        <circle cx="58" cy="66" r="0.4" fill="#FFC821" opacity="0.75" />

        {/* MAIN TRIDENT / TRISHUL GEOMETRY */}
        <g id="Trishul-Body">
          {/* Main shaft (staff) */}
          <path
            d="M 50,38 L 50,72"
            stroke="url(#gold3D)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* Symmetrical Left and Right Flame Horn prongs */}
          {/* Detailed sweeping curves starting from the heavy center hub */}
          {/* Outer thick contours with rich organic scroll to simulate the 3D blade edge */}
          <path
            d="M 50,36 C 44,36 34.5,33.5 32,25.5 C 29.5,17.5 32.5,13.5 32.5,13.5 C 32.5,13.5 34.5,18 38,19 C 41.5,20 45,23.5 47,27.5 L 46,18 L 49.5,32"
            fill="url(#gold3D)"
            stroke="url(#darkGold)"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
          <path
            d="M 50,36 C 56,36 65.5,33.5 68,25.5 C 70.5,17.5 67.5,13.5 67.5,13.5 C 67.5,13.5 65.5,18 62,19 C 58.5,20 55,23.5 53,27.5 L 54,18 L 50.5,32"
            fill="url(#gold3D)"
            stroke="url(#darkGold)"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />

          {/* Center spear blade (Arrowhead) with symmetric dual-bevel shading */}
          <path
            d="M 50,5 L 55,19 L 51.5,18.5 L 51.2,34 L 48.8,34 L 48.5,18.5 L 45,19 Z"
            fill="url(#gold3D)"
            stroke="url(#darkGold)"
            strokeWidth="0.5"
          />
          {/* Shading line to divide the center blade and give sharp 3D depth */}
          <path
            d="M 50,5 L 50,34"
            stroke="#FFFFFF"
            strokeWidth="0.7"
            opacity="0.85"
          />

          {/* Heavy central structural binding (Hub Collar) */}
          <rect x="44.5" y="34.5" width="11" height="4" rx="1" fill="url(#gold3D)" stroke="url(#darkGold)" strokeWidth="0.6" />
          <line x1="45" y1="36.5" x2="55" y2="36.5" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.7" />

          {/* Highly decorative sleeve ridges/rings along the staff handle */}
          <rect x="47.5" y="44" width="5" height="2.2" rx="0.5" fill="url(#gold3D)" stroke="url(#darkGold)" strokeWidth="0.4" />
          <rect x="47.8" y="55" width="4.4" height="2" rx="0.5" fill="url(#gold3D)" stroke="url(#darkGold)" strokeWidth="0.4" />
          <rect x="48.2" y="65" width="3.6" height="1.8" rx="0.5" fill="url(#gold3D)" stroke="url(#darkGold)" strokeWidth="0.4" />

          {/* Delicate hanging wire/rope attachment */}
          <path d="M 50,66 C 51.5,67 53.5,69 53,71.5" stroke="url(#gold3D)" strokeWidth="1.2" fill="none" strokeLinecap="round" />

          {/* Spiral ring at the base of the staff to attach the bell */}
          <circle cx="50" cy="73.5" r="1.8" stroke="url(#gold3D)" strokeWidth="1" fill="none" />

          {/* Beautifully Crafted Temple Bell (Ghanta) hanging gracefully */}
          {/* Bell Crown */}
          <path
            d="M 48,75.3 C 48,75.3 48.5,74.5 50,74.5 C 51.5,74.5 52,75.3 52,75.3 L 53,77.5 L 47,77.5 Z"
            fill="url(#gold3D)"
            stroke="url(#darkGold)"
            strokeWidth="0.4"
          />
          {/* Bell Body with gorgeous 3D flares */}
          <path
            d="M 47,77.5 C 47,77.5 48.2,77.8 50,77.8 C 51.8,77.8 53,77.5 53,77.5 C 53,77.5 54.5,79 55,83.5 L 45,83.5 C 45.5,79 47,77.5 47,77.5 Z"
            fill="url(#gold3D)"
            stroke="url(#darkGold)"
            strokeWidth="0.4"
          />
          {/* Bell Heavy bottom ring rim */}
          <rect x="43.5" y="83.2" width="13" height="2.2" rx="0.8" fill="url(#gold3D)" stroke="url(#darkGold)" strokeWidth="0.4" />

          {/* Bell Clapper dangling below with golden droplet tip */}
          <line x1="50" y1="85.4" x2="50" y2="88" stroke="url(#lightGold)" strokeWidth="0.8" />
          <circle cx="50" cy="88.5" r="1.1" fill="#FFFFFF" filter="url(#glowFilt)" />
          {/* Sparkling golden sound wave ripple coming from bell clapper */}
          <path
            d="M 48.5,91 C 49,91.8 51,91.8 51.5,91"
            stroke="url(#lightGold)"
            strokeWidth="0.6"
            strokeLinecap="round"
            opacity="0.8"
          />
        </g>

        {/* Central White-Hot core power lens energy flare - EXACTLY like the user's image */}
        <circle cx="50" cy="36.5" r="7.5" fill="url(#powerGlow)" style={{ mixBlendMode: 'screen' }} />
        {/* Core spark beam */}
        <circle cx="50" cy="36.5" r="1.5" fill="#FFFFFF" />
      </svg>
    </div>
  );
}
