import React from 'react';

export interface TeamKit {
  primary: string;
  secondary: string;
  sleeve: string;
  pattern?: 'stripes' | 'sleeves' | 'chest' | 'solid';
  textColor: string;
}

export const getTeamKit = (teamCode: string = '', isGkp: boolean = false): TeamKit => {
  if (isGkp) {
    return {
      primary: '#00e676', // Neon GKP Emerald Green
      secondary: '#00a152',
      sleeve: '#00e676',
      pattern: 'solid',
      textColor: '#020617'
    };
  }

  const code = (teamCode || '').toUpperCase().trim();

  switch (code) {
    case 'RMA': // Real Madrid - All White with Gold
      return { primary: '#ffffff', secondary: '#e2b13c', sleeve: '#ffffff', pattern: 'solid', textColor: '#0f172a' };
    case 'MCI': // Man City - Sky Blue
      return { primary: '#6cabdd', secondary: '#1c2d5a', sleeve: '#6cabdd', pattern: 'solid', textColor: '#ffffff' };
    case 'BAY': // Bayern Munich - Red
      return { primary: '#dc052d', secondary: '#ffffff', sleeve: '#dc052d', pattern: 'solid', textColor: '#ffffff' };
    case 'BAR': // Barcelona - Blaugrana Stripes
      return { primary: '#004d98', secondary: '#a50044', sleeve: '#004d98', pattern: 'stripes', textColor: '#ffffff' };
    case 'ARS': // Arsenal - Red body, White sleeves
      return { primary: '#ef0107', secondary: '#ffffff', sleeve: '#ffffff', pattern: 'sleeves', textColor: '#ffffff' };
    case 'PSG': // Paris Saint-Germain - Navy with Red stripe
      return { primary: '#002342', secondary: '#da291c', sleeve: '#002342', pattern: 'chest', textColor: '#ffffff' };
    case 'INT': // Inter Milan - Nerazzurri Black & Blue
      return { primary: '#000000', secondary: '#0053a0', sleeve: '#000000', pattern: 'stripes', textColor: '#ffffff' };
    case 'LIV': // Liverpool - Crimson Red
      return { primary: '#c8102e', secondary: '#f6eb61', sleeve: '#c8102e', pattern: 'solid', textColor: '#ffffff' };
    case 'BVB': // Dortmund - Yellow & Black
      return { primary: '#fde100', secondary: '#000000', sleeve: '#fde100', pattern: 'solid', textColor: '#000000' };
    case 'LEV': // Bayer Leverkusen - Red body, Black sleeves
      return { primary: '#e32219', secondary: '#000000', sleeve: '#000000', pattern: 'sleeves', textColor: '#ffffff' };
    case 'ATM': // Atletico Madrid - Red & White Stripes
      return { primary: '#cb3524', secondary: '#ffffff', sleeve: '#cb3524', pattern: 'stripes', textColor: '#ffffff' };
    case 'PSV': // PSV Eindhoven - Red & White Stripes
      return { primary: '#ee1c25', secondary: '#ffffff', sleeve: '#ee1c25', pattern: 'stripes', textColor: '#ffffff' };
    case 'AVL': // Aston Villa - Claret body, Sky sleeves
      return { primary: '#670e36', secondary: '#95bfe6', sleeve: '#95bfe6', pattern: 'sleeves', textColor: '#ffffff' };
    case 'RBL': // RB Leipzig - White body, Red shoulders
      return { primary: '#ffffff', secondary: '#dd0741', sleeve: '#dd0741', pattern: 'sleeves', textColor: '#0f172a' };
    case 'JUV': // Juventus - Black & White Stripes
      return { primary: '#000000', secondary: '#ffffff', sleeve: '#000000', pattern: 'stripes', textColor: '#ffffff' };
    case 'MIL': // AC Milan - Red & Black Stripes
      return { primary: '#fb090b', secondary: '#000000', sleeve: '#000000', pattern: 'stripes', textColor: '#ffffff' };
    case 'ATA': // Atalanta - Blue & Black Stripes
      return { primary: '#1e71b8', secondary: '#000000', sleeve: '#000000', pattern: 'stripes', textColor: '#ffffff' };
    case 'BEN': // Benfica - Red
      return { primary: '#e30613', secondary: '#ffffff', sleeve: '#e30613', pattern: 'solid', textColor: '#ffffff' };
    case 'SCP': // Sporting CP - Green & White Stripes
      return { primary: '#008057', secondary: '#ffffff', sleeve: '#008057', pattern: 'stripes', textColor: '#ffffff' };
    case 'BET': // Real Betis - Green & White Stripes
      return { primary: '#00954c', secondary: '#ffffff', sleeve: '#00954c', pattern: 'stripes', textColor: '#ffffff' };
    case 'STU': // VfB Stuttgart - White body with Red chest ring
      return { primary: '#ffffff', secondary: '#e32219', sleeve: '#ffffff', pattern: 'chest', textColor: '#0f172a' };
    case 'LIL': // Lille OSC - Red with Navy
      return { primary: '#d71920', secondary: '#002342', sleeve: '#d71920', pattern: 'solid', textColor: '#ffffff' };
    case 'MUN': // Manchester United - Classic Red
      return { primary: '#da291c', secondary: '#ffffff', sleeve: '#da291c', pattern: 'solid', textColor: '#ffffff' };
    case 'VIL': // Villarreal - Yellow Submarine
      return { primary: '#ffe600', secondary: '#004d98', sleeve: '#ffe600', pattern: 'solid', textColor: '#004d98' };
    case 'COM': // Como 1907 - Royal Blue
      return { primary: '#004d98', secondary: '#ffffff', sleeve: '#004d98', pattern: 'solid', textColor: '#ffffff' };
    case 'FEY': // Feyenoord - Red & White Halves
      return { primary: '#e30613', secondary: '#ffffff', sleeve: '#e30613', pattern: 'stripes', textColor: '#ffffff' };
    case 'GAL': // Galatasaray - Red & Yellow
      return { primary: '#a90432', secondary: '#fdb913', sleeve: '#a90432', pattern: 'chest', textColor: '#ffffff' };
    case 'POR': // FC Porto - Blue & White Stripes
      return { primary: '#003882', secondary: '#ffffff', sleeve: '#003882', pattern: 'stripes', textColor: '#ffffff' };
    default:
      return { primary: '#00e5ff', secondary: '#002342', sleeve: '#00e5ff', pattern: 'solid', textColor: '#0f172a' };
  }
};

export const JerseySVG: React.FC<{ kit: TeamKit; size?: number; className?: string }> = ({ kit, size, className }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      className={className || "w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain drop-shadow-md filter shrink-0"}
    >
      {/* Left Sleeve */}
      <path d="M 30 15 L 12 35 L 25 48 L 30 42 Z" fill={kit.sleeve || kit.primary} stroke="#000000" strokeWidth="1.8" />
      {/* Right Sleeve */}
      <path d="M 70 15 L 88 35 L 75 48 L 70 42 Z" fill={kit.sleeve || kit.primary} stroke="#000000" strokeWidth="1.8" />
      {/* Main Body */}
      <path d="M 30 15 L 42 22 C 46 25 54 25 58 22 L 70 15 L 70 85 C 70 88 68 90 65 90 L 35 90 C 32 90 30 88 30 85 Z" fill={kit.primary} stroke="#000000" strokeWidth="2" />
      
      {/* Pattern Overlay */}
      {kit.pattern === 'stripes' && (
        <g stroke="#000000" strokeWidth="0.8">
          <rect x="42" y="24" width="6" height="66" fill={kit.secondary} />
          <rect x="52" y="24" width="6" height="66" fill={kit.secondary} />
          <rect x="62" y="22" width="5" height="66" fill={kit.secondary} />
          <rect x="33" y="22" width="5" height="66" fill={kit.secondary} />
        </g>
      )}
      {kit.pattern === 'chest' && (
        <rect x="44" y="24" width="12" height="66" fill={kit.secondary} stroke="#000000" strokeWidth="1" />
      )}

      {/* Collar */}
      <path d="M 42 22 C 46 25 54 25 58 22" fill="none" stroke={kit.secondary || '#ffffff'} strokeWidth="3" />
    </svg>
  );
};
