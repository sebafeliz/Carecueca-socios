import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  lightText?: boolean;
}

export const CarecuecaLogoIcon: React.FC<{ className?: string }> = ({ className = "w-8 h-8" }) => {
  return (
    <img 
      src="/logo.png" 
      onError={(e) => {
        // Fallback to direct ImgBB link if local fails
        (e.target as HTMLImageElement).src = "https://i.ibb.co/k63948Wb/LOGO-BLANCO.png";
      }}
      alt="Carecueca Teatro Logo" 
      className={`object-contain ${className}`}
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
        <CarecuecaLogoIcon className={`${iconSizes[size]} transition-transform duration-200 group-hover:scale-105 filter drop-shadow`} />
      </div>
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center space-x-1.5">
            <span className={`font-black tracking-tight ${textSizes[size]} ${lightText ? 'text-white' : 'text-slate-900'}`}>
              Carecueca
            </span>
            <span className={`font-light tracking-wide ${textSizes[size]} text-amber-400`}>
              Teatro
            </span>
          </div>
          <span className="text-[9px] font-bold text-indigo-300 tracking-wider uppercase mt-0.5">
            Compañía Teatral
          </span>
        </div>
      )}
    </div>
  );
};

