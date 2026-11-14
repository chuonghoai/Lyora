import React, { useState } from 'react';

export interface AppImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  rounded?: boolean;
}

export const AppImage: React.FC<AppImageProps> = ({
  src,
  alt = 'Image',
  fallbackSrc = 'https://placehold.co/400x300/F3EFED/766B67?text=No+Image',
  rounded = false,
  className = '',
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(src);
  const [hasError, setHasError] = useState<boolean>(false);

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

