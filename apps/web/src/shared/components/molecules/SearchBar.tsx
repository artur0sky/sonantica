/**
 * SearchBar Molecule
 * 
 * Search input with icon.
 */

import { Input } from '../atoms';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...', className }: SearchBarProps) {
  return (
    <div className={`relative ${className || ''}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
        🔍
      </div>
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  );
}
