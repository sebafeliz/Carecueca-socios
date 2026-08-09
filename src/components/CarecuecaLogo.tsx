import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  lightText?: boolean;
}

export const CarecuecaLogoIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Background Badge */}
      <rect width="100" height="100" rx="22" fill="url(#carecueca-grad)" />
      
      {/* Cueca Handkerchief Wave Background Motif */}
      <path 
        d="M20 75 C35 55, 65 90, 80 65 C90 50, 75 35, 60 45 C45 55, 30 30, 20 75 Z" 
        fill="white" 
        fillOpacity="0.12" 
      />

      {/* Cueca Pañuelo - Wave Ribbon */}
      <path 
        d="M15 45 C 30 25, 60 30, 85 20 C 70 45, 45 40, 15 45 Z" 
        fill="url(#gold-grad)" 
        fillOpacity="0.85" 
      />

      {/* Comedy Mask (Left) */}
      <g transform="translate(24, 38) scale(0.65)">
        {/* Mask shape */}
        <path 
          d="M 5 10 C 5 2, 35 2, 35 10 C 37 32, 32 48, 20 52 C 8 48, 3 32, 5 10 Z" 
          fill="#FFFFFF" 
          stroke="#312E81" 
          strokeWidth="3" 
        />
        {/* Smiling Eyes */}
        <path d="M 10 18 Q 15 12 20 18" stroke="#312E81" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 20 18 Q 25 12 30 18" stroke="#312E81" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Smile */}
        <path d="M 12 32 Q 20 44 28 32 Z" fill="#E11D48" />
      </g>

      {/* Tragedy Mask (Right / Behind Overlap) */}
      <g transform="translate(48, 42) scale(0.62) rotate(8)">
        {/* Mask shape */}
        <path 
          d="M 5 10 C 5 2, 35 2, 35 10 C 37 32, 32 48, 20 52 C 8 48, 3 32, 5 10 Z" 
          fill="#F1F5F9" 
          stroke="#1E1B4B" 
          strokeWidth="3.5" 
        />
        {/* Sad Eyes */}
        <path d="M 10 16 Q 15 22 20 16" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M 20 16 Q 25 22 30 16" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Sad Mouth */}
        <path d="M 12 38 Q 20 28 28 38" stroke="#1E1B4B" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </g>

      {/* Gradients */}
      <defs>
        <linearGradient id="carecueca-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4338CA" />
          <stop offset="0.5" stopColor="#3730A3" />
          <stop offset="1" stopColor="#1E1B4B" />
        </linearGradient>

        <linearGradient id="gold-grad" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F59E0B" />
          <stop offset="1" stopColor="#FBBF24" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const CarecuecaLogo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  lightText = true
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };

  return (
    <div className="flex items-center space-x-2.5 select-none">
      <div className="relative group flex-shrink-0">
        <CarecuecaLogoIcon className={`${iconSizes[size]} transition-transform duration-200 group-hover:scale-105 shadow-md rounded-xl`} />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center space-x-1.5">
            <span className={`font-black tracking-tight ${textSizes[size]} ${lightText ? 'text-white' : 'text-slate-900'}`}>
              Carecueca
            </span>
            <span className={`font-light tracking-wide ${textSizes[size]} text-amber-500`}>
              Teatro
            </span>
          </div>
          <span className="text-[9px] font-bold text-indigo-400 tracking-wider uppercase mt-0.5">
            Compañía Teatral
          </span>
        </div>
      )}
    </div>
  );
};
