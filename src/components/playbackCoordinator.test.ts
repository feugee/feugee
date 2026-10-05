import { describe, expect, it, vi } from "vitest";

import {
  registerPlayer,
  suspendOthers,
} from "@/components/playbackCoordinator";

const makePlayer = () => ({ pause: vi.fn() });

describe("suspendOthers", () => {
  it("pauses every other registered player but not the caller", () => {
    const a = makePlayer();
    const b = makePlayer();
    const c = makePlayer();
    const releases = [registerPlayer(a), registerPlayer(b), registerPlayer(c)];

    suspendOthers(b);

    expect(a.pause).toHaveBeenCalledOnce();
    expect(c.pause).toHaveBeenCalledOnce();
    expect(b.pause).not.toHaveBeenCalled();

    for (const release of releases) release();
  });

  it("stops suspending a player after it unregisters", () => {
    const a = makePlayer();
    const b = makePlayer();
    const releaseA = registerPlayer(a);
    const releaseB = registerPlayer(b);
    releaseA();

    suspendOthers(b);

    expect(a.pause).not.toHaveBeenCalled();
    releaseB();
  });

  it("is a no-op for a lone player", () => {
    const a = makePlayer();
    const release = registerPlayer(a);

    suspendOthers(a);

    expect(a.pause).not.toHaveBeenCalled();
    release();
  });
});
