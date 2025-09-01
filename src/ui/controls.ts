import GUI from "lil-gui";
import { actions, getState } from "./state";
import { SIDEREAL_MONTH_DAYS } from "../utils/constants";

export function initDevControls() {
  // Dev-only. Do not ship this UI by default in production builds.
  const gui = new GUI({ title: "Controls" });
  const state = getState();

  gui.add(state, "isPlaying").name("Play").onChange((v: boolean) => actions.set("isPlaying", v));
  gui
    .add(state, "speedMultiplier", [0, 0.25, 1, 5, 20, 100])
    .name("Speed")
    .onChange((v: number) => actions.set("speedMultiplier", v));
  gui
    .add(state, "inclinationDeg", 0, 10, 0.01)
    .name("Inclination")
    .onChange((v: number) => actions.set("inclinationDeg", v));
  gui.add(state, "showEcliptic").name("Ecliptic").onChange((v: boolean) => actions.set("showEcliptic", v));
  gui.add(state, "showLunarPlane").name("Lunar Plane").onChange((v: boolean) => actions.set("showLunarPlane", v));
  gui.add(state, "showLabels").name("Labels").onChange((v: boolean) => actions.set("showLabels", v));

  // time scrub 0..1 -> full lunar cycle in days
  const proxy = { phase: (state.time % SIDEREAL_MONTH_DAYS) / SIDEREAL_MONTH_DAYS };
  gui
    .add(proxy, "phase", 0, 1, 0.001)
    .name("Phase")
    .onChange((v: number) => {
      actions.set("isPlaying", false);
      actions.set("time", v * SIDEREAL_MONTH_DAYS);
    });

  return gui;
}


