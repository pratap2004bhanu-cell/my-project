import { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const Input = forwardRef(({ 
  label, 
  error, 
  className, 
  type = 'text',
  ...props 
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-dark-300 mb-2">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={twMerge(
          clsx(
            'w-full px-4 py-3 border border-dark-700 rounded-lg bg-dark-800/50 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-lime-500/40 focus:border-transparent transition-all duration-200',
            error && 'border-red-500 focus:ring-red-500',
            className
          )
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;