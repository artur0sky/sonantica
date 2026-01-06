/**
 * Widgets Section (Molecule)
 * Placeholder for future widgets implementation
 */

import { IconSparkles } from "@tabler/icons-react";

export function WidgetsSection() {
  return (
    <div className="border border-white/5 bg-white/[0.02] rounded-lg p-4 flex items-center justify-center">
      <div className="text-text-muted/40 text-center">
        <IconSparkles size={48} stroke={1} className="mx-auto mb-2" />
        <span className="text-xs uppercase tracking-wider font-bold">
          Widgets
        </span>
      </div>
    </div>
  );
}
