import { describe, expect, it } from "vitest";

import { reduceFilterSwap } from "./filterSwap";

interface Item {
  id: number;
}

const a: Item = { id: 1 };
const b: Item = { id: 2 };
const c: Item = { id: 3 };
const d: Item = { id: 4 };

describe("reduceFilterSwap", () => {
  it("pins the stage and raises the exit when cards are on stage", () => {
    const state = { shown: [a, b], exiting: false };

    expect(reduceFilterSwap(state, { type: "sectorChanged", filtered: [c] })).toEqual({
      shown: [a, b],
      exiting: true,
    });
    // The departing set is pinned by reference, not copied — the grid keeps
    // rendering exactly the cards the exit tween is animating.
    expect(
      reduceFilterSwap(state, { type: "sectorChanged", filtered: [c] }).shown,
    ).toBe(state.shown);
  });

  it("ignores further selections while the exit plays — the newest wins at completion", () => {
    const state = { shown: [a, b], exiting: true };

    expect(
      reduceFilterSwap(state, { type: "sectorChanged", filtered: [c, d] }),
    ).toBe(state);
  });

  it("commits the newest filtered set when the exit completes", () => {
    const state = { shown: [a, b], exiting: true };

    expect(
      reduceFilterSwap(state, { type: "exitCompleted", filtered: [c, d] }),
    ).toEqual({ shown: [c, d], exiting: false });
  });

  it("commits straight to the new set from an empty stage", () => {
    const state = { shown: [] as Item[], exiting: false };

    expect(reduceFilterSwap(state, { type: "sectorChanged", filtered: [a] })).toEqual({
      shown: [a],
      exiting: false,
    });
  });

  it("lets an empty stage rest when the next sector is empty too", () => {
    const state = { shown: [] as Item[], exiting: false };

    expect(reduceFilterSwap(state, { type: "sectorChanged", filtered: [] })).toBe(
      state,
    );
  });

  it("commits to an empty set after the exit clears the last cards", () => {
    const state = { shown: [a], exiting: true };

    expect(reduceFilterSwap(state, { type: "exitCompleted", filtered: [] })).toEqual({
      shown: [],
      exiting: false,
    });
  });

  it("commits straight to a deep-linked set whose stage was never seen", () => {
    const state = { shown: [a, b], exiting: false };

    expect(
      reduceFilterSwap(state, {
        type: "sectorChanged",
        filtered: [c],
        unseenStage: true,
      }),
    ).toEqual({ shown: [c], exiting: false });
  });

  it("commits straight over a running exit when the stage was never seen", () => {
    const state = { shown: [a, b], exiting: true };

    expect(
      reduceFilterSwap(state, {
        type: "sectorChanged",
        filtered: [c],
        unseenStage: true,
      }),
    ).toEqual({ shown: [c], exiting: false });
  });

  it("ignores a stale exit completion", () => {
    const state = { shown: [a, b], exiting: false };

    expect(
      reduceFilterSwap(state, { type: "exitCompleted", filtered: [c] }),
    ).toBe(state);
  });
});
