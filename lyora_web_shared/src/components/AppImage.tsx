import React, { useState } from 'react';

export interface AppImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  rounded?: boolean;
}

export const AppImage: React.FC<AppImageProps> = ({
  src,
  alt = 'Hình ảnh',
  fallbackSrc = 'https://placehold.co/400x300?text=No+Image',
  rounded = false,
  className = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`relative overflow-hidden ${rounded ? 'rounded-full' : 'rounded-lg'} bg-slate-100 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse text-xs text-slate-400">
          Đang tải...
        </div>
      )}
      <img
        src={hasError || !src ? fallbackSrc : src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`w-full h-full object-cover transition-opacity duration-200 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        {...props}
      />
    </div>
  );
};

