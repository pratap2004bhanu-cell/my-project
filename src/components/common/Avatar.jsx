import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Avatar = ({ 
  src, 
  alt, 
  size = 'md', 
  online,
  className,
  ...props 
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };
  
  return (
    <div className={twMerge(clsx('relative inline-block', className))} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={twMerge(
            clsx(
              'rounded-full object-cover',
              sizes[size]
            )
          )}
        />
      ) : (
        <div
          className={twMerge(
            clsx(
              'rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-semibold',
              sizes[size]
            )
          )}
        >
          {alt?.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      {online !== undefined && (
        <span
          className={clsx(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-white',
            online ? 'bg-green-400' : 'bg-gray-400',
            size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
          )}
        />
      )}
    </div>
  );
};

export default Avatar;