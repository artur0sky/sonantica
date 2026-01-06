import { motion } from 'framer-motion';
import { cn, entranceVariants } from '../../utils';
import { AnalyticsCard, TrendIndicator } from '../atoms/AnalyticsAtoms';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  icon?: React.ReactNode;
  variant?: 'default' | 'accent' | 'glass';
  className?: string;
  loading?: boolean;
}

/**
 * High-level metric display component.
 * Features micro-animations for value entry.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  trend,
  icon,
  variant = 'default',
  className,
  loading = false,
}) => {
  return (
    <AnalyticsCard
      className={cn(
        "min-w-[180px]",
        variant === 'accent' && "border-accent/40 bg-accent/5",
        className
      )}
      glassmorphism={variant === 'glass' || variant === 'default'}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
          {icon}
        </div>
        
        <div className="mt-1 flex items-baseline gap-1.5">
          {loading ? (
            <div className="h-8 w-24 bg-border/20 animate-pulse rounded-lg" />
          ) : (
            <motion.span 
              variants={entranceVariants.slideUp}
              initial="hidden"
              animate="visible"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-text"
            >
              {value !== undefined && value !== null ? value : '--'}
            </motion.span>
          )}
          {(unit && !loading) && (
            <span className="text-sm font-medium text-text-muted">{unit}</span>
          )}
        </div>

        {(trend !== undefined && !loading) && (
          <div className="mt-2 flex items-center gap-2">
            <TrendIndicator value={trend} />
            <span className="text-[10px] text-text-muted opacity-60">vs last period</span>
          </div>
        )}
      </div>
    </AnalyticsCard>
  );
};
