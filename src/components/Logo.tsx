import { Link } from 'react-router-dom';

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-7', md: 'h-9', lg: 'h-14' };
  return (
    <Link to="/" className="flex items-center gap-2 select-none">
      <div className={`${sizes[size]} aspect-square rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20`}>
        <span className={`${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-xl'} font-black text-white tracking-tighter`}>N</span>
      </div>
      <span className={`font-bold tracking-tight text-white ${size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-xl'}`}>
        nover
      </span>
    </Link>
  );
}
