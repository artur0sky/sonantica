/**
 * Action Icon Button Atom
 *
 * Used for secondary actions (EQ, Lyrics, Queue, etc).
 * Atomic design: built on top of PlayerButton.
 */

import { PlayerButton, PlayerButtonProps } from "./PlayerButton";

interface ActionIconButtonProps extends Omit<PlayerButtonProps, "onClick"> {
  onClick: () => void;
}

export function ActionIconButton(props: ActionIconButtonProps) {
  return (
    <PlayerButton
      {...props}
      variant={props.variant || "ghost"}
      size={props.size || "sm"}
    />
  );
}
