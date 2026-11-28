import React, { useEffect, useState } from 'react';

export interface AppImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  rounded?: boolean;
}

const DEFAULT_FALLBACK_SVG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'><rect width='400' height='300' fill='%23F3F4F6'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%236B7280' font-family='sans-serif' font-size='14'>Kh%C3%B4ng%20t%E1%BA%A3i%20%C4%91%C6%B0%E1%BB%A3c%20%E1%BA%A3nh</text></svg>";

export const AppImage: React.FC<AppImageProps> = ({
  src,
  alt = 'Hình ảnh',
  fallbackSrc = DEFAULT_FALLBACK_SVG,
  rounded = false,
  className = '',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string>(src || fallbackSrc);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setImageSrc(src || fallbackSrc);
    setHasError(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      onError={handleError}
      className={`object-cover ${rounded ? 'rounded-full' : 'rounded-lg'} ${className}`}
      loading="lazy"
      {...props}
    />
  );
};
