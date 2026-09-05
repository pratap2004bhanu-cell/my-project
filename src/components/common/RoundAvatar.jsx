import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const RoundAvatar = ({
  src,
  name,
  gradient = 'from-lime-500 to-emerald-500',
  online,
  className,
  ...props
}) => {
  const isImage = typeof src === 'string' && /^(https?:|\/|data:)/.test(src);
  return (
    <div
      className={twMerge(clsx(
        'relative rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold flex-shrink-0',
        gradient,
        className
      ))}
      {...props}
    >
      {isImage ? (
        <img
          src={src}
          alt={name || 'avatar'}
          className="absolute inset-0 w-full h-full rounded-full object-cover"
        />
      ) : (
        (name ? name[0] : '?').toUpperCase()
      )}
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-dark-900"></span>
      )}
    </div>
  );
};

export default RoundAvatar;