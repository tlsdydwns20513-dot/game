import React from 'react';
import { StickerConfig } from '../data/dictationData';

interface HeroProps {
  mood: 'idle' | 'attack' | 'hurt' | 'happy';
  className?: string;
}

export const CompanionHeroSvg: React.FC<HeroProps> = ({ mood, className = 'w-28 h-28' }) => {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-label="수호 캐릭터 달콩이">
      {/* Shadow */}
      <ellipse cx="60" cy="108" rx="34" ry="7" fill="#CBD5E1" opacity="0.55" />
      {/* Ears */}
      <circle cx="33" cy="32" r="14" fill="#F59E0B" />
      <circle cx="33" cy="32" r="8" fill="#FDE68A" />
      <circle cx="87" cy="32" r="14" fill="#F59E0B" />
      <circle cx="87" cy="32" r="8" fill="#FDE68A" />
      {/* Cape */}
      <path d="M28 70 Q60 60 92 70 L98 102 Q60 96 22 102 Z" fill="#2563EB" />
      {/* Body */}
      <ellipse cx="60" cy="84" rx="26" ry="22" fill="#FBBF24" />
      <ellipse cx="60" cy="86" rx="16" ry="14" fill="#FEF3C7" />
      {/* Head */}
      <circle cx="60" cy="48" r="28" fill="#FBBF24" />
      {/* Cheeks */}
      <circle cx="39" cy="54" r="5" fill="#FB7185" opacity="0.55" />
      <circle cx="81" cy="54" r="5" fill="#FB7185" opacity="0.55" />
      {/* Eyes based on mood */}
      {mood === 'hurt' ? (
        <>
          <path d="M44 44 L51 49 L44 54" stroke="#0F172A" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M76 44 L69 49 L76 54" stroke="#0F172A" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : mood === 'happy' || mood === 'attack' ? (
        <>
          <path d="M42 48 Q48 41 54 48" stroke="#0F172A" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <path d="M66 48 Q72 41 78 48" stroke="#0F172A" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="48" cy="47" r="4.2" fill="#0F172A" />
          <circle cx="49.5" cy="45.5" r="1.4" fill="#FFFFFF" />
          <circle cx="72" cy="47" r="4.2" fill="#0F172A" />
          <circle cx="73.5" cy="45.5" r="1.4" fill="#FFFFFF" />
        </>
      )}
      {/* Nose & Mouth */}
      <ellipse cx="60" cy="54" rx="4" ry="3" fill="#78350F" />
      {mood === 'hurt' ? (
        <path d="M54 63 Q60 59 66 63" stroke="#78350F" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M53 60 Q60 66 67 60" stroke="#78350F" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      )}
      {/* Magic Pencil Wand */}
      <g transform={mood === 'attack' ? 'translate(92, 50) rotate(22)' : 'translate(88, 62) rotate(-18)'}>
        <rect x="-4" y="-22" width="8" height="32" rx="3" fill="#3B82F6" stroke="#1E3A8A" strokeWidth="1.5" />
        <polygon points="-4,-22 4,-22 0,-31" fill="#FDE68A" stroke="#1E3A8A" strokeWidth="1.5" />
        <polygon points="-1.5,-28 1.5,-28 0,-31" fill="#0F172A" />
        <circle cx="0" cy="-34" r={mood === 'attack' ? 6 : 3} fill="#FACC15" opacity={mood === 'attack' ? 0.9 : 0.6} />
      </g>
    </svg>
  );
};

interface MonsterProps {
  stageId: number;
  color: string;
  state: 'idle' | 'hit' | 'defeated';
  className?: string;
}

export const MonsterSvg: React.FC<MonsterProps> = ({ stageId, color, state, className = 'w-28 h-28' }) => {
  const isBossStage = stageId === 8;

  return (
    <svg viewBox="0 0 120 120" className={className} aria-label="받아쓰기 몬스터">
      <ellipse cx="60" cy="108" rx="36" ry="7" fill="#CBD5E1" opacity="0.55" />
      {/* Crown for Stage 8 or horned monsters */}
      {isBossStage ? (
        <polygon points="36,30 44,12 60,24 76,12 84,30" fill="#FACC15" stroke="#B45309" strokeWidth="2.5" strokeLinejoin="round" />
      ) : stageId % 2 === 0 ? (
        <>
          <polygon points="38,34 30,18 48,28" fill="#FDE047" stroke="#0F172A" strokeWidth="2" strokeLinejoin="round" />
          <polygon points="82,34 90,18 72,28" fill="#FDE047" stroke="#0F172A" strokeWidth="2" strokeLinejoin="round" />
        </>
      ) : (
        <path d="M52 26 Q60 10 68 26" stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" />
      )}

      {/* Main Monster Blob Body */}
      <path
        d="M24 74 Q22 30 60 28 Q98 30 96 74 Q96 102 60 102 Q24 102 24 74 Z"
        fill={color}
        stroke="#0F172A"
        strokeWidth="2.5"
      />
      {/* Belly */}
      <ellipse cx="60" cy="82" rx="22" ry="13" fill="#FFFFFF" opacity="0.3" />

      {/* Eyes */}
      {state === 'hit' || state === 'defeated' ? (
        <>
          <path d="M40 52 L50 60 M50 52 L40 60" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M70 52 L80 60 M80 52 L70 60" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="45" cy="56" r="8" fill="#FFFFFF" />
          <circle cx="44" cy="56" r="4" fill="#0F172A" />
          <circle cx="75" cy="56" r="8" fill="#FFFFFF" />
          <circle cx="74" cy="56" r="4" fill="#0F172A" />
          {/* Playful mischievous brows */}
          <path d="M36 46 L52 50" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
          <path d="M84 46 L68 50" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {/* Mouth */}
      {state === 'defeated' ? (
        <ellipse cx="60" cy="76" rx="8" ry="6" fill="#0F172A" />
      ) : (
        <path d="M46 73 Q60 82 74 73" stroke="#0F172A" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}

      {/* Tiny Hangul syllable badge on belly */}
      <text x="60" y="92" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#FFFFFF" opacity="0.9">
        {['아', '받', '음', '쌍', '모', '겹', '!', '왕'][stageId - 1] || '글'}
      </text>
    </svg>
  );
};

export const StickerBadgeSvg: React.FC<{ sticker: StickerConfig; unlocked: boolean }> = ({ sticker, unlocked }) => {
  const fill = unlocked ? sticker.color : '#CBD5E1';
  const stroke = unlocked ? '#0F172A' : '#94A3B8';

  return (
    <svg viewBox="0 0 80 80" className="w-16 h-16 shrink-0" aria-hidden="true">
      <circle cx="40" cy="40" r="35" fill={unlocked ? '#FFFFFF' : '#F1F5F9'} stroke={fill} strokeWidth="4" strokeDasharray={unlocked ? 'none' : '5 4'} />
      <circle cx="40" cy="40" r="28" fill={fill} opacity={unlocked ? 0.16 : 0.25} />
      {sticker.iconType === 'crown' && (
        <polygon points="22,50 26,30 35,39 40,24 45,39 54,30 58,50" fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      )}
      {sticker.iconType === 'star' && (
        <polygon points="40,18 46,32 61,34 50,44 53,59 40,51 27,59 30,44 19,34 34,32" fill={fill} stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
      )}
      {sticker.iconType === 'sprout' && (
        <g stroke={stroke} strokeWidth="2" fill={fill}>
          <path d="M40 56 L40 34" fill="none" strokeWidth="3" strokeLinecap="round" />
          <path d="M40 42 Q24 38 26 24 Q40 24 40 42 Z" />
          <path d="M40 36 Q56 32 54 20 Q40 20 40 36 Z" />
        </g>
      )}
      {sticker.iconType === 'pencil' && (
        <g transform="translate(40,40) rotate(35)" stroke={stroke} strokeWidth="2">
          <rect x="-6" y="-16" width="12" height="26" rx="2" fill={fill} />
          <polygon points="-6,10 6,10 0,22" fill="#FDE68A" />
        </g>
      )}
      {sticker.iconType === 'rocket' && (
        <g stroke={stroke} strokeWidth="2" fill={fill}>
          <path d="M40 18 Q52 30 48 50 L32 50 Q28 30 40 18 Z" />
          <circle cx="40" cy="34" r="4" fill="#FFFFFF" />
          <path d="M35 52 L40 62 L45 52" fill="#F59E0B" />
        </g>
      )}
      {sticker.iconType === 'heart' && (
        <path d="M40 56 C22 44 18 30 26 24 C32 20 38 24 40 28 C42 24 48 20 54 24 C62 30 58 44 40 56 Z" fill={fill} stroke={stroke} strokeWidth="2" />
      )}
      {sticker.iconType === 'shield' && (
        <path d="M24 24 L40 18 L56 24 L54 44 Q40 58 40 58 Q40 58 26 44 Z" fill={fill} stroke={stroke} strokeWidth="2" />
      )}
      {sticker.iconType === 'book' && (
        <g stroke={stroke} strokeWidth="2" fill={fill}>
          <rect x="22" y="24" width="36" height="30" rx="4" />
          <line x1="40" y1="24" x2="40" y2="54" stroke="#FFFFFF" strokeWidth="2.5" />
        </g>
      )}
      {sticker.iconType === 'rainbow' && (
        <g fill="none" strokeWidth="4" strokeLinecap="round">
          <path d="M22 48 A18 18 0 0 1 58 48" stroke={unlocked ? '#EF4444' : '#94A3B8'} />
          <path d="M27 48 A13 13 0 0 1 53 48" stroke={unlocked ? '#F59E0B' : '#CBD5E1'} />
          <path d="M32 48 A8 8 0 0 1 48 48" stroke={unlocked ? '#10B981' : '#94A3B8'} />
        </g>
      )}
      {sticker.iconType === 'rabbit' && (
        <g fill={fill} stroke={stroke} strokeWidth="2">
          <ellipse cx="33" cy="26" rx="5" ry="12" />
          <ellipse cx="47" cy="26" rx="5" ry="12" />
          <circle cx="40" cy="44" r="14" />
        </g>
      )}
      {sticker.iconType === 'medal' && (
        <g stroke={stroke} strokeWidth="2">
          <polygon points="32,20 48,20 44,34 36,34" fill="#3B82F6" />
          <circle cx="40" cy="44" r="13" fill={fill} />
          <circle cx="40" cy="44" r="7" fill="#FFFFFF" opacity="0.4" />
        </g>
      )}
      {sticker.iconType === 'trophy' && (
        <g fill={fill} stroke={stroke} strokeWidth="2">
          <path d="M26 24 H54 V36 Q54 48 40 48 Q26 48 26 36 Z" />
          <rect x="36" y="48" width="8" height="8" />
          <rect x="30" y="56" width="20" height="5" rx="2" />
        </g>
      )}
    </svg>
  );
};
