/**
 * Vocal Mode Control Component
 */

import { VocalMode, useDSPStore } from '@sonantica/dsp';
import { motion } from 'framer-motion';
import { IconMicrophone, IconMicrophoneOff, IconMusic } from '@tabler/icons-react';
import { Badge } from '@sonantica/ui';

export function VocalModeControl() {
  const config = useDSPStore(state => state.config);
  const setVocalMode = useDSPStore(state => state.setVocalMode);
  const isInitialized = useDSPStore(state => state.isInitialized);

  if (!isInitialized) return null;

  const modes = [
    {
      id: VocalMode.NORMAL,
      label: 'Normal',
      icon: IconMusic,
      description: 'Original mix'
    },
    {
      id: VocalMode.KARAOKE,
      label: 'Karaoke',
      icon: IconMicrophoneOff,
      description: 'Remove vocals'
    },
    {
      id: VocalMode.MUSICIAN,
      label: 'Musician',
      icon: IconMicrophone,
      description: 'Isolate vocals'
    }
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-text">Vocal Mode</label>
        {config.vocalMode !== VocalMode.NORMAL && (
          <Badge variant="accent" className="text-[10px] px-2 py-0.5">
            Active
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {modes.map((mode) => {
          const isActive = config.vocalMode === mode.id;
          const Icon = mode.icon;
          
          return (
            <motion.button
              key={mode.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setVocalMode(mode.id)}
              className={`
                flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all
                ${isActive 
                  ? 'bg-accent/10 border-accent text-accent' 
                  : 'bg-surface border-border text-text-muted hover:bg-surface-elevated hover:text-text'
                }
              `}
              title={mode.description}
            >
              <Icon size={20} stroke={1.5} />
              <span className="text-[10px] font-medium">{mode.label}</span>
            </motion.button>
          );
        })}
      </div>
      
      <p className="text-[10px] text-text-muted text-center h-4">
        {modes.find(m => m.id === config.vocalMode)?.description}
      </p>
    </div>
  );
}
