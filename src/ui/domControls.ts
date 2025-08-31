import { actions, boolActions, getState } from "./state";

export function initDomControls(renderer: { setShadows: (enabled: boolean) => void }, toggles: {
  ecliptic: { setVisible: (v: boolean) => void };
  lunar: { setVisible: (v: boolean) => void };
  labels: { setVisible: (v: boolean) => void };
  sun: { setVisible: (v: boolean) => void };
}) {
  const inc = document.getElementById("inc") as HTMLInputElement | null;
  const speed = document.getElementById("speed") as HTMLInputElement | null;
  const scrub = document.getElementById("scrub") as HTMLInputElement | null;
  const play = document.getElementById("play") as HTMLButtonElement | null;
  const pause = document.getElementById("pause") as HTMLButtonElement | null;

  const showEcliptic = document.getElementById("showEcliptic") as HTMLInputElement | null;
  const showLunar = document.getElementById("showLunar") as HTMLInputElement | null;
  const showLabels = document.getElementById("showLabels") as HTMLInputElement | null;
  const showSun = document.getElementById("showSun") as HTMLInputElement | null;
  const showShadows = document.getElementById("showShadows") as HTMLInputElement | null;
  const showEclipse = document.getElementById("showEclipse") as HTMLInputElement | null;
  const showTrails = document.getElementById("showTrails") as HTMLInputElement | null;
  const showFills = document.getElementById("showFills") as HTMLInputElement | null;

  const s = getState();
  if (inc) inc.value = String(s.inclinationDeg);
  if (speed) speed.value = String(s.speedMultiplier * 50);
  if (scrub) scrub.value = "0";
  if (showEcliptic) showEcliptic.checked = s.showEcliptic;
  if (showLunar) showLunar.checked = s.showLunarPlane;
  if (showLabels) showLabels.checked = s.showLabels;
  if (showSun) showSun.checked = s.showSun;
  if (showShadows) showShadows.checked = s.showShadows;
  if (showEclipse) showEclipse.checked = s.showEclipse;
  if (showTrails) showTrails.checked = s.showTrails;
  if (showFills) showFills.checked = s.showFills;

  function setPlay(p: boolean) {
    actions.set("isPlaying", p);
    if (play) play.setAttribute("aria-pressed", String(p));
    if (pause) pause.setAttribute("aria-pressed", String(!p));
  }

  if (inc) {
    inc.addEventListener("input", () => {
      const next = Number(inc.value);
      actions.set("inclinationDeg", next);
    });
  }

  if (speed) {
    speed.addEventListener("input", () => {
      // map 0..100 slider to 0..2x nominal
      const v = Number(speed.value);
      const mult = v / 50; // 50 is 1x
      actions.set("speedMultiplier", mult);
    });
  }

  if (scrub) {
    scrub.addEventListener("input", () => {
      const norm = Number(scrub.value); // 0..1
      setPlay(false);
      actions.set("time", norm);
    });
  }

  if (play) play.addEventListener("click", () => setPlay(true));
  if (pause) pause.addEventListener("click", () => setPlay(false));

  if (showEcliptic)
    showEcliptic.addEventListener("change", () => {
      actions.set("showEcliptic", showEcliptic.checked);
      toggles.ecliptic.setVisible(showEcliptic.checked);
    });
  if (showLunar)
    showLunar.addEventListener("change", () => {
      actions.set("showLunarPlane", showLunar.checked);
      toggles.lunar.setVisible(showLunar.checked);
    });
  if (showLabels)
    showLabels.addEventListener("change", () => {
      actions.set("showLabels", showLabels.checked);
      toggles.labels.setVisible(showLabels.checked);
    });
  if (showSun)
    showSun.addEventListener("change", () => {
      actions.set("showSun", showSun.checked);
      toggles.sun.setVisible(showSun.checked);
    });
  if (showShadows)
    showShadows.addEventListener("change", () => {
      actions.set("showShadows", showShadows.checked);
      renderer.setShadows(showShadows.checked);
    });
  if (showEclipse)
    showEclipse.addEventListener("change", () => {
      actions.set("showEclipse", showEclipse.checked);
    });
  if (showTrails) showTrails.addEventListener("change", () => actions.set("showTrails", showTrails.checked));
  if (showFills) showFills.addEventListener("change", () => actions.set("showFills", showFills.checked));
}


