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
    <div
      className={`relative overflow-hidden ${
        rounded ? 'rounded-full' : 'rounded-lg'
      } bg-[#f8fafc] ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#f8fafc] animate-pulse text-xs text-[#94a3b8]">
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
