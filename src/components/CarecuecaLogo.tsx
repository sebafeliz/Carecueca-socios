import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  lightText?: boolean;
}

export const CarecuecaLogoIcon: React.FC<{ className?: string; inverted?: boolean }> = ({ 
  className = "h-9 w-auto", 
  inverted = false 
}) => {
  return (
    <img 
      src={inverted ? "/logo-white.png" : "/logo.png"} 
      alt="Carecueca Teatro Logo" 
      className={`object-contain select-none ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};

export const CarecuecaLogo: React.FC<LogoProps> = ({
  className = "",
  size = 'md',
  lightText = false
}) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14'
  };

  return (
    <div className={`flex items-center select-none ${className}`}>
      <CarecuecaLogoIcon 
        inverted={lightText}
        className={`${sizeClasses[size]} w-auto object-contain transition-transform duration-150 hover:scale-[1.02]`} 
      />
    </div>
  );
};

