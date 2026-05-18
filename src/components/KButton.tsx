interface KButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

export default function KButton({
  children,
  onClick,
  variant = 'primary',
  className = ''
}: KButtonProps) {
  const baseClasses = 'px-6 py-3 rounded-xl font-semibold transition-colors';

  const variantClasses = {
    primary: 'bg-k-green-dark text-white hover:bg-k-green-dark/90',
    secondary: 'bg-k-green text-white hover:bg-k-green/90',
    ghost: 'bg-transparent text-k-green-dark hover:bg-k-green/10',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
