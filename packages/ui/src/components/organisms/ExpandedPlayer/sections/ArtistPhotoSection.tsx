/**
 * Artist Photo Section (Molecule)
 * Placeholder for future artist photo implementation
 */

import { IconMusic } from "@tabler/icons-react";

export function ArtistPhotoSection() {
  return (
    <div className="border border-white/5 bg-white/[0.02] rounded-lg p-4 flex items-center justify-center">
      <div className="text-text-muted/40 text-center">
        <IconMusic size={48} stroke={1} className="mx-auto mb-2" />
        <span className="text-xs uppercase tracking-wider font-bold">
          Artist Photo
        </span>
      </div>
    </div>
  );
}
