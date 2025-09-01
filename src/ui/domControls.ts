import { actions, boolActions, getState } from "./state";

export function initDomControls(renderer: { setShadows: (enabled: boolean) => void }, toggles: {
  ecliptic: { setVisible: (v: boolean) => void };
  lunar: { setVisible: (v: boolean) => void };
  labels: { setVisible: (v: boolean) => void };
  sun: { setVisible: (v: boolean) => void };
}) {
  const panel = document.getElementById("ui-panel") as HTMLElement | null;
  const panelToggle = document.getElementById("panel-toggle") as HTMLButtonElement | null;
  const inc = document.getElementById("inc") as HTMLInputElement | null;
  const speed = document.getElementById("speed") as HTMLInputElement | null;
  const play = document.getElementById("play") as HTMLButtonElement | null;
  const pause = document.getElementById("pause") as HTMLButtonElement | null;

  // New position controls
  const sunAngle = document.getElementById("sunAngle") as HTMLInputElement | null;
  const moonAngle = document.getElementById("moonAngle") as HTMLInputElement | null;
  const nodalRegression = document.getElementById("nodalRegression") as HTMLInputElement | null;
  
  // Scale & thresholds controls
  const earthRadius = document.getElementById("earthRadius") as HTMLInputElement | null;
  const moonRadius = document.getElementById("moonRadius") as HTMLInputElement | null;
  const moonOrbitRadius = document.getElementById("moonOrbitRadius") as HTMLInputElement | null;
  const sunOrbitRadius = document.getElementById("sunOrbitRadius") as HTMLInputElement | null;
  const sunRadius = document.getElementById("sunRadius") as HTMLInputElement | null;

  const showEcliptic = document.getElementById("showEcliptic") as HTMLInputElement | null;
  const showLunar = document.getElementById("showLunar") as HTMLInputElement | null;
  const showLabels = document.getElementById("showLabels") as HTMLInputElement | null;
  const showEclipse = document.getElementById("showEclipse") as HTMLInputElement | null;
  const showFills = document.getElementById("showFills") as HTMLInputElement | null;
  const showDebug = document.getElementById("showDebug") as HTMLInputElement | null;

  const s = getState();
  if (inc) inc.value = String(s.inclinationDeg);
  if (speed) speed.value = String(s.speedMultiplier * 50);
  
  
  // Initialize position controls
  if (sunAngle) sunAngle.value = String(s.sunAngle);
  if (moonAngle) moonAngle.value = String(s.moonAngle);
  if (nodalRegression) nodalRegression.value = String(s.nodalRegression);
  
  // Initialize scale & thresholds
  if (earthRadius) earthRadius.value = String(s.earthRadius);
  if (moonRadius) moonRadius.value = String(s.moonRadius);
  if (moonOrbitRadius) moonOrbitRadius.value = String(s.moonOrbitRadius);
  if (sunOrbitRadius) sunOrbitRadius.value = String(s.sunOrbitRadius);
  if (sunRadius) sunRadius.value = String(s.sunRadius);
  
  if (showEcliptic) showEcliptic.checked = s.showEcliptic;
  if (showLunar) showLunar.checked = s.showLunarPlane;
  if (showLabels) showLabels.checked = s.showLabels;
  if (showEclipse) showEclipse.checked = s.showEclipse;
  if (showFills) showFills.checked = s.showFills;
  if (showDebug) showDebug.checked = s.showDebug;

  // Controls panel visibility
  function applyPanelVisibility(show: boolean) {
    if (panel) panel.classList.toggle("is-collapsed", !show);
    if (panelToggle) {
      panelToggle.setAttribute("aria-expanded", String(show));
      panelToggle.textContent = show ? "«" : "»";
      panelToggle.setAttribute("aria-label", show ? "Hide controls" : "Show controls");
      panelToggle.setAttribute("title", show ? "Hide controls" : "Show controls");
    }
  }
  applyPanelVisibility(s.showControlsPanel);
  if (panelToggle) {
    panelToggle.addEventListener("click", () => {
      const next = !getState().showControlsPanel;
      actions.set("showControlsPanel", next);
      applyPanelVisibility(next);
    });
  }

  function setPlay(p: boolean) {
    actions.set("isPlaying", p);
    if (play) play.setAttribute("aria-pressed", String(p));
    if (pause) pause.setAttribute("aria-pressed", String(!p));
  }

  if (inc) {
    inc.addEventListener("input", () => {
      const next = Number(inc.value);
      actions.set("inclinationDeg", next);
      updateDebugIfEnabled();
    });
  }

  if (speed) {
    speed.addEventListener("input", () => {
      // map 0..100 slider to 0..2x nominal
      const v = Number(speed.value);
      const mult = v / 50; // 50 is 1x
      actions.set("speedMultiplier", mult);
      updateDebugIfEnabled();
    });
  }

  

  // Position control event listeners
  if (sunAngle) {
    sunAngle.addEventListener("input", () => {
      const value = Number(sunAngle.value);
      actions.set("sunAngle", value);
      updateDebugIfEnabled();
    });
  }

  if (moonAngle) {
    moonAngle.addEventListener("input", () => {
      const value = Number(moonAngle.value);
      actions.set("moonAngle", value);
      updateDebugIfEnabled();
    });
  }

  if (nodalRegression) {
    nodalRegression.addEventListener("input", () => {
      const value = Number(nodalRegression.value);
      actions.set("nodalRegression", value);
      updateDebugIfEnabled();
    });
  }
  
  // Debug values functionality
  function updateDebugValuesVisibility(show: boolean) {
    const debugElements = document.querySelectorAll('.debug-value');
    debugElements.forEach(el => {
      (el as HTMLElement).style.display = show ? 'inline' : 'none';
    });
  }

  function updateDebugValues() {
    const state = getState();
    
    // Update debug value spans with current values
    const incValue = document.getElementById('incValue');
    const speedValue = document.getElementById('speedValue');
    
    const sunAngleValue = document.getElementById('sunAngleValue');
    const moonAngleValue = document.getElementById('moonAngleValue');
    const nodalRegressionValue = document.getElementById('nodalRegressionValue');

    if (incValue) incValue.textContent = `(${state.inclinationDeg.toFixed(1)})`;
    if (speedValue) speedValue.textContent = `(${(state.speedMultiplier * 50).toFixed(0)})`;
    
    const sunDeg = (state.sunAngle * 360) % 360;
    const moonDeg = (state.moonAngle * 360) % 360;
    const nodeDeg = (state.nodalRegression * 360) % 360;
    if (sunAngleValue) sunAngleValue.textContent = `(${sunDeg.toFixed(0)}º)`;
    if (moonAngleValue) moonAngleValue.textContent = `(${moonDeg.toFixed(0)}º)`;
    if (nodalRegressionValue) nodalRegressionValue.textContent = `(${nodeDeg.toFixed(0)}º)`;

    const earthRadiusValue = document.getElementById('earthRadiusValue');
    const moonRadiusValue = document.getElementById('moonRadiusValue');
    const moonOrbitRadiusValue = document.getElementById('moonOrbitRadiusValue');
    const sunOrbitRadiusValue = document.getElementById('sunOrbitRadiusValue');
    const sunRadiusValue = document.getElementById('sunRadiusValue');
    const nodeThresholdDegValue = document.getElementById('nodeThresholdDegValue');

    if (earthRadiusValue) earthRadiusValue.textContent = `(${state.earthRadius.toFixed(2)})`;
    if (moonRadiusValue) moonRadiusValue.textContent = `(${state.moonRadius.toFixed(2)})`;
    if (moonOrbitRadiusValue) moonOrbitRadiusValue.textContent = `(${state.moonOrbitRadius.toFixed(1)})`;
    if (sunOrbitRadiusValue) sunOrbitRadiusValue.textContent = `(${state.sunOrbitRadius.toFixed(0)})`;
    if (sunRadiusValue) sunRadiusValue.textContent = `(${state.sunRadius.toFixed(2)})`;
    if (nodeThresholdDegValue) nodeThresholdDegValue.textContent = '';
  }

  // Update debug values when sliders change (if debug is enabled)
  const updateDebugIfEnabled = () => {
    if (getState().showDebug) {
      updateDebugValues();
    }
  };

  // Scale & thresholds listeners (with debug updates)
  if (earthRadius) earthRadius.addEventListener("input", () => {
    actions.set("earthRadius", Number(earthRadius.value));
    updateDebugIfEnabled();
  });
  if (moonRadius) moonRadius.addEventListener("input", () => {
    actions.set("moonRadius", Number(moonRadius.value));
    updateDebugIfEnabled();
  });
  if (moonOrbitRadius) moonOrbitRadius.addEventListener("input", () => {
    actions.set("moonOrbitRadius", Number(moonOrbitRadius.value));
    updateDebugIfEnabled();
  });
  if (sunOrbitRadius) sunOrbitRadius.addEventListener("input", () => {
    actions.set("sunOrbitRadius", Number(sunOrbitRadius.value));
    updateDebugIfEnabled();
  });
  if (sunRadius) sunRadius.addEventListener("input", () => {
    actions.set("sunRadius", Number(sunRadius.value));
    updateDebugIfEnabled();
  });
  // nodeThresholdDeg removed

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
  if (showEclipse)
    showEclipse.addEventListener("change", () => {
      actions.set("showEclipse", showEclipse.checked);
    });
  if (showFills) showFills.addEventListener("change", () => actions.set("showFills", showFills.checked));

  // Initialize debug values display
  updateDebugValuesVisibility(s.showDebug);
  if (s.showDebug) {
    updateDebugValues();
  }

  if (showDebug) {
    showDebug.addEventListener("change", () => {
      actions.set("showDebug", showDebug.checked);
      updateDebugValuesVisibility(showDebug.checked);
      if (showDebug.checked) {
        updateDebugValues();
      }
    });
  }
}


