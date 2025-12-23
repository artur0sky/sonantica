/**
 * Header Component
 * 
 * Application header with search and navigation.
 */

import { Link } from 'wouter';
import { IconMenu2, IconUser, IconSettings } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { Button } from '../atoms';
import { useUIStore } from '../../store/uiStore';

export function Header() {
  const { toggleLeftSidebar } = useUIStore();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="h-16 border-b border-border bg-surface flex items-center px-4 justify-between select-none z-30"
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLeftSidebar}
          className="text-text-muted hover:text-text"
        >
          <IconMenu2 size={24} stroke={1.5} />
        </Button>

        <Link href="/">
          <a className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.5 }}
              className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-lg"
            >
              S
            </motion.div>
            <span className="text-xl font-bold tracking-tight group-hover:text-accent transition-colors">
              Sonántica
            </span>
          </a>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-text-muted hover:text-text"
        >
          <IconSettings size={20} stroke={1.5} />
        </Button>
        
        <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-text-muted hover:text-text hover:bg-accent/20 cursor-pointer transition-colors">
          <IconUser size={20} stroke={1.5} />
        </div>
      </div>
    </motion.header>
  );
}
