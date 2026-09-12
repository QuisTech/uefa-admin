import React, { useState, useEffect } from 'react';
import { getTeamKit, JerseySVG } from './JerseySVG';

const PHOTO_SEASONS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];

export interface PlayerPhotoProps {
  playerId: number;
  playerName: string;
  position?: string;
  teamShortName?: string;
  className?: string;
  imgClassName?: string;
  sizeClassName?: string;
  roundedClassName?: string;
  showSpotlight?: boolean;
}

/**
 * HD Player Photo component using UEFA's official 324x324 studio portrait assets.
 * Cascades across UEFA registration seasons [2025 -> 2018] and gracefully falls
 * back to high-res SVG club kit jersey if no portrait exists.
 *
 * Applies hardware-accelerated contrast optimization and edge preservation
 * for razor-sharp Retina/4K display.
 */
export const PlayerPhoto: React.FC<PlayerPhotoProps> = ({
  playerId,
  playerName,
  position = 'MID',
  teamShortName = 'UCL',
  className = '',
  imgClassName = '',
  sizeClassName = 'w-12 h-12',
  roundedClassName = 'rounded-xl',
  showSpotlight = false,
}) => {
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Reset when player ID changes
  useEffect(() => {
    setSeasonIndex(0);
    setImgError(false);
  }, [playerId]);

  const isGkp = position === 'GKP';
  const teamShort = (teamShortName || 'UCL').toUpperCase();
  const kit = getTeamKit(teamShort, isGkp);

  const currentSeason = PHOTO_SEASONS[seasonIndex] || 2025;
  const uefaPhotoUrl = `https://img.uefa.com/imgml/TP/players/1/${currentSeason}/324x324/${playerId}.jpg`;

  const handleImageError = () => {
    if (seasonIndex < PHOTO_SEASONS.length - 1) {
      setSeasonIndex(prev => prev + 1);
    } else {
      setImgError(true);
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center shrink-0 overflow-hidden ${sizeClassName} ${roundedClassName} ${
        showSpotlight
          ? 'bg-gradient-to-b from-white/20 via-white/10 to-white/5 border border-white/25 backdrop-blur-md p-0.5 shadow-md drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]'
          : 'bg-slate-900/90 border border-white/15 shadow-inner'
      } ${className}`}
    >
      {!imgError ? (
        <img
          src={uefaPhotoUrl}
          alt=""
          aria-hidden="true"
          onError={handleImageError}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover object-top filter contrast-[1.06] brightness-[1.02] saturate-[1.06] transition-transform duration-300 pointer-events-none ${roundedClassName} ${imgClassName}`}
          style={{ imageRendering: '-webkit-optimize-contrast' }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center p-1" aria-hidden="true">
          <JerseySVG kit={kit} className="w-full h-full max-w-[85%] max-h-[85%]" />
        </div>
      )}
    </div>
  );
};
