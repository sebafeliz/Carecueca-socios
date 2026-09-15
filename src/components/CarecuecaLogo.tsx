import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  lightText?: boolean;
}

export const CarecuecaLogoIcon: React.FC<{ className?: string; inverted?: boolean }> = ({ className = "w-8 h-8", inverted = false }) => {
  return (
    <img 
      src="/logo.png" 
      onError={(e) => {
        // Fallback to direct ImgBB link if local fails
        (e.target as HTMLImageElement).src = "https://i.ibb.co/k63948Wb/LOGO-BLANCO.png";
      }}
      alt="Carecueca Teatro Logo" 
      className={`object-contain ${inverted ? 'filter invert brightness-0' : ''} ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};

export const CarecuecaLogo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  lightText = true
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl'
  };

  return (
    <div className="flex items-center space-x-2.5 select-none">
      <div className="relative group flex-shrink-0">
        <CarecuecaLogoIcon 
          inverted={!lightText}
          className={`${iconSizes[size]} transition-transform duration-200 group-hover:scale-105`} 
        />
      </div>
      {showText && (
        <div className="flex items-center space-x-1.5 leading-none">
          <span className={`font-black tracking-tight ${textSizes[size]} ${lightText ? 'text-white' : 'text-slate-900'}`}>
            Carecueca
          </span>
          <span className={`font-light tracking-wide ${textSizes[size]} text-amber-600`}>
            Teatro
          </span>
        </div>
      )}
    </div>
  );
};

