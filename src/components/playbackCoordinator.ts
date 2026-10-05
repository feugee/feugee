/**
 * One-at-a-time playback across a page's interactive Embedded Videos
 * (CONTEXT.md): a player about to play suspends every other registered
 * player, so two soundtracks can never overlap. Ambient players are
 * unaffected — they are muted.
 */

type InteractivePlayer = { pause: () => void };

const mounted = new Set<InteractivePlayer>();

/** Pauses every other mounted interactive player, leaving the caller alone. */
export const suspendOthers = (self: InteractivePlayer): void => {
  for (const player of mounted) {
    if (player !== self) player.pause();
  }
};

/**
 * Registers a player for the page-wide exclusivity. Returns its teardown —
 * a player unmounting must stop receiving suspensions (and stop being
 * suspended).
 */
export const registerPlayer = (player: InteractivePlayer): (() => void) => {
  mounted.add(player);
  return () => {
    mounted.delete(player);
  };
};
