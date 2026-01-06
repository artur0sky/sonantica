import React from 'react';
import { AnalyticsCard } from '../atoms/AnalyticsAtoms';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils';

interface TopListItem {
  id: string;
  title: string;
  subtitle: string;
  value: string | number;
  image?: string;
  percentage?: number;
}

interface TopListProps {
  title: string;
  items: TopListItem[];
  icon?: React.ReactNode;
  height?: number | string;
  className?: string;
  itemTypeLabel?: string;
  loading?: boolean;
}

/**
 * Organism that displays a list of top items (tracks, artists, etc.)
 * with beautiful progress bars and imagery.
 */
export const TopList: React.FC<TopListProps> = ({
  title,
  items,
  icon,
  height = 'auto',
  className,
  itemTypeLabel = 'Plays',
  loading = false,
}) => {
  return (
    <AnalyticsCard title={title} icon={icon} height={height} className={className} loading={loading}>
      <div className="space-y-4 mt-2">
        <div className="flex justify-between px-1 mb-1 text-[10px] uppercase tracking-widest text-text-muted font-bold opacity-40">
          <span>Item</span>
          <span>{itemTypeLabel}</span>
        </div>
        
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all"
            >
              <div className="relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-surface-elevated">
                {item.image ? (
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs opacity-20">💿</div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-[10px] font-bold">#{index + 1}</span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className="text-sm font-semibold truncate pr-2">{item.title}</h4>
                  <span className="text-sm font-mono font-bold text-accent">{item.value}</span>
                </div>
                
                {/* Background bar */}
                <div className="h-1.5 w-full bg-border/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage || 0}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 + index * 0.05 }}
                    className="h-full bg-gradient-to-r from-accent/40 to-accent rounded-full"
                  />
                </div>
                
                <p className="mt-1.5 text-[10px] text-text-muted truncate uppercase tracking-wide opacity-60">
                  {item.subtitle}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AnalyticsCard>
  );
};
