import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: 'primary' | 'security' | 'intelligence' | 'emergency' | 'none';
  variant?: 'glass' | 'solid' | 'borderless';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glowColor = 'none',
  variant = 'glass',
  interactive = false,
  ...props
}) => {
  // Map old cyberpunk parameters to modern, clean borders/shadows
  const accentBorderClasses = {
    none: 'border-slate-200',
    primary: 'border-l-4 border-l-primary-600 border-slate-200',
    security: 'border-l-4 border-l-security border-slate-200',
    intelligence: 'border-l-4 border-l-intelligence border-slate-200',
    emergency: 'border-l-4 border-l-emergency border-slate-200',
  };

  const variantClasses = {
    glass: 'bg-white text-slate-800 border',
    solid: 'bg-slate-50 text-slate-800 border border-slate-200',
    borderless: 'bg-transparent text-slate-800 border-0 shadow-none',
  };

  const hoverClasses = interactive
    ? 'clean-panel-hover cursor-pointer transform hover:-translate-y-0.5'
    : '';

  return (
    <div
      className={`
        rounded-2xl 
        p-6 
        transition-all 
        duration-200 
        clean-panel
        ${variantClasses[variant]} 
        ${accentBorderClasses[glowColor]} 
        ${hoverClasses} 
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`flex flex-col space-y-1.5 mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className = '', ...props }) => (
  <h3 className={`text-sm font-semibold leading-none tracking-tight text-slate-900 ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ children, className = '', ...props }) => (
  <p className={`text-xs text-slate-500 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => (
  <div className={`flex items-center pt-4 border-t border-slate-100 mt-4 ${className}`} {...props}>
    {children}
  </div>
);
