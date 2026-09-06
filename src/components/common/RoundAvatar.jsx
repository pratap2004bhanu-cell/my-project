import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState } from 'react';

const RoundAvatar = ({
  src,
  name,
  gradient = 'from-lime-500 to-emerald-500',
  online,
  className,
  ...props
}) => {
  const isImage = typeof src === 'string' && /^(https?:|\/|data:)/.test(src);
  const [imgError, setImgError] = useState(false);
  const [prevSrc, setPrevSrc] = useState(src);
  if (prevSrc !== src) {
    setPrevSrc(src);
    setImgError(false);
  }
  const showImage = isImage && !imgError;
  return (
    <div
      className={twMerge(clsx(
        'relative rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold flex-shrink-0',
        gradient,
        className
      ))}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={name || 'avatar'}
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full rounded-full object-cover"
        />
      ) : (
        <span className="flex items-center justify-center w-full h-full">
          {(name ? name[0] : '?').toUpperCase()}
        </span>
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-dark-900"></span>
      )}
    </div>
  );
};

export default RoundAvatar;