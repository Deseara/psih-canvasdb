import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
          variant === 'default' ? 'bg-blue-600 text-white hover:bg-blue-700' :
          variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700' :
          variant === 'outline' ? 'border border-gray-300 bg-white hover:bg-gray-50' :
          variant === 'secondary' ? 'bg-gray-200 text-gray-900 hover:bg-gray-300' :
          variant === 'ghost' ? 'hover:bg-gray-100' :
          'text-blue-600 underline-offset-4 hover:underline'
        } ${
          size === 'default' ? 'h-10 px-4 py-2' :
          size === 'sm' ? 'h-9 px-3' :
          size === 'lg' ? 'h-11 px-8' :
          'h-10 w-10'
        } ${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
