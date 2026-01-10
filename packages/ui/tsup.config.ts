import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  // Explicitly externalize peer dependencies to prevent bundling
  external: [
    'react', 
    'react-dom', 
    'framer-motion', 
    '@tabler/icons-react',
    // also externalize sonantica internal packages if they are treated as peers/dependencies
    '@sonantica/media-library',
    '@sonantica/player-core',
    '@sonantica/shared',
    '@sonantica/audio-analyzer'
  ],
});
