import { actions, getState } from "./state";
import { startAngleTweens } from "./tween";
import { isMobile } from "../utils/device";

type ControlCategory = {
  id: string;
  name: string;
  icon: string;
  controls: ControlItem[];
};

type ControlItem = {
  id: string;
  type: 'slider' | 'toggle' | 'button' | 'button-group';
  label: string;
  element?: HTMLElement;
  getValue?: () => any;
  setValue?: (value: any) => void;
  action?: () => void;
};

let currentCategory: string | null = null;
let currentControl: string | null = null;
let isSheetExpanded = false;

export function initMobileControls() {
  if (!isMobile()) return null;

  const categories: ControlCategory[] = [
    {
      id: 'presets',
      name: 'Presets',
      icon: '⚡',
      controls: [
        {
          id: 'preset-solar',
          type: 'button',
          label: 'Solar Eclipse',
          action: () => applyPreset('solar')
        },
        {
          id: 'preset-lunar',
          type: 'button',
          label: 'Lunar Eclipse',
          action: () => applyPreset('lunar')
        },
        {
          id: 'preset-new',
          type: 'button',
          label: 'New Moon',
          action: () => applyPreset('new')
        },
        {
          id: 'preset-full',
          type: 'button',
          label: 'Full Moon',
          action: () => applyPreset('full')
        }
      ]
    },
    {
      id: 'motion',
      name: 'Motion',
      icon: '▶️',
      controls: [
        {
          id: 'inclination',
          type: 'slider',
          label: 'Inclination',
          getValue: () => getState().inclinationDeg,
          setValue: (v) => actions.set("inclinationDeg", v)
        },
        {
          id: 'speed',
          type: 'slider',
          label: 'Speed',
          getValue: () => getState().speedMultiplier * 50,
          setValue: (v) => actions.set("speedMultiplier", v / 50)
        },
        {
          id: 'playback',
          type: 'button-group',
          label: 'Playback',
          action: () => togglePlayback()
        }
      ]
    },
    {
      id: 'positions',
      name: 'Positions',
      icon: '🌍',
      controls: [
        {
          id: 'sun-position',
          type: 'slider',
          label: 'Sun Position',
          getValue: () => getState().sunAngle,
          setValue: (v) => actions.set("sunAngle", v)
        },
        {
          id: 'moon-position',
          type: 'slider',
          label: 'Moon Position',
          getValue: () => getState().moonAngle,
          setValue: (v) => actions.set("moonAngle", v)
        },
        {
          id: 'nodal-axis',
          type: 'slider',
          label: 'Nodal Axis',
          getValue: () => getState().nodalRegression,
          setValue: (v) => actions.set("nodalRegression", v)
        }
      ]
    },
    {
      id: 'scale',
      name: 'Scale',
      icon: '📐',
      controls: [
        {
          id: 'earth-size',
          type: 'slider',
          label: 'Earth Size',
          getValue: () => getState().earthRadius,
          setValue: (v) => actions.set("earthRadius", v)
        },
        {
          id: 'moon-size',
          type: 'slider',
          label: 'Moon Size',
          getValue: () => getState().moonRadius,
          setValue: (v) => actions.set("moonRadius", v)
        },
        {
          id: 'sun-size',
          type: 'slider',
          label: 'Sun Size',
          getValue: () => getState().sunRadius,
          setValue: (v) => actions.set("sunRadius", v)
        },
        {
          id: 'moon-orbit',
          type: 'slider',
          label: 'Moon Orbit',
          getValue: () => getState().moonOrbitRadius,
          setValue: (v) => actions.set("moonOrbitRadius", v)
        },
        {
          id: 'sun-orbit',
          type: 'slider',
          label: 'Sun Orbit',
          getValue: () => getState().sunOrbitRadius,
          setValue: (v) => actions.set("sunOrbitRadius", v)
        }
      ]
    },
    {
      id: 'display',
      name: 'Display',
      icon: '👁️',
      controls: [
        {
          id: 'ecliptic',
          type: 'toggle',
          label: 'Ecliptic',
          getValue: () => getState().showEcliptic,
          setValue: (v) => actions.set("showEcliptic", v)
        },
        {
          id: 'lunar-plane',
          type: 'toggle',
          label: 'Lunar Plane',
          getValue: () => getState().showLunarPlane,
          setValue: (v) => actions.set("showLunarPlane", v)
        },
        {
          id: 'labels',
          type: 'toggle',
          label: 'Labels',
          getValue: () => getState().showLabels,
          setValue: (v) => actions.set("showLabels", v)
        },
        {
          id: 'fills',
          type: 'toggle',
          label: 'Fill Planes',
          getValue: () => getState().showFills,
          setValue: (v) => actions.set("showFills", v)
        },
        {
          id: 'eclipse',
          type: 'toggle',
          label: 'Eclipse Indicator',
          getValue: () => getState().showEclipse,
          setValue: (v) => actions.set("showEclipse", v)
        },
        {
          id: 'pointer',
          type: 'toggle',
          label: 'Presenter Pointer',
          getValue: () => getState().showPointer,
          setValue: (v) => actions.set("showPointer", v)
        }
      ]
    }
  ];

  // Create mobile controls container
  const mobileControls = createMobileControlsHTML();
  document.getElementById('app')?.appendChild(mobileControls);

  // Initialize category buttons
  categories.forEach(category => {
    const button = document.getElementById(`mobile-cat-${category.id}`);
    if (button) {
      button.addEventListener('click', () => openCategory(category.id));
    }
  });

  // Initialize back and close buttons
  const backBtn = document.getElementById('mobile-back-btn');
  const closeBtn = document.getElementById('mobile-close-btn');
  const toggleBtn = document.getElementById('mobile-toggle-btn');

  if (backBtn) backBtn.addEventListener('click', () => goBack());
  if (closeBtn) closeBtn.addEventListener('click', () => closeSheet());
  if (toggleBtn) toggleBtn.addEventListener('click', () => toggleSheet());

  // Hide desktop controls on mobile
  const desktopControls = document.getElementById('ui-panel');
  const desktopToggle = document.getElementById('panel-toggle');
  if (desktopControls) desktopControls.style.display = 'none';
  if (desktopToggle) desktopToggle.style.display = 'none';

  return { categories, openCategory, closeSheet };
}

function createMobileControlsHTML(): HTMLElement {
  const container = document.createElement('div');
  container.id = 'mobile-controls';
  container.className = 'mobile-controls';
  
  container.innerHTML = `
    <!-- Toggle Button -->
    <button id="mobile-toggle-btn" class="mobile-toggle-btn" type="button">
      <span class="mobile-toggle-icon">⚙️</span>
    </button>

    <!-- Bottom Sheet -->
    <div id="mobile-sheet" class="mobile-sheet collapsed">
      <!-- Header -->
      <div class="mobile-sheet-header">
        <button id="mobile-back-btn" class="mobile-back-btn" style="display: none;">←</button>
        <h3 id="mobile-sheet-title" class="mobile-sheet-title">Controls</h3>
        <button id="mobile-close-btn" class="mobile-close-btn">×</button>
      </div>

      <!-- Categories Grid -->
      <div id="mobile-categories" class="mobile-categories">
        <button id="mobile-cat-presets" class="mobile-cat-btn">
          <span class="mobile-cat-icon">⚡</span>
          <span class="mobile-cat-label">Presets</span>
        </button>
        <button id="mobile-cat-motion" class="mobile-cat-btn">
          <span class="mobile-cat-icon">▶️</span>
          <span class="mobile-cat-label">Motion</span>
        </button>
        <button id="mobile-cat-positions" class="mobile-cat-btn">
          <span class="mobile-cat-icon">🌍</span>
          <span class="mobile-cat-label">Positions</span>
        </button>
        <button id="mobile-cat-scale" class="mobile-cat-btn">
          <span class="mobile-cat-icon">📐</span>
          <span class="mobile-cat-label">Scale</span>
        </button>
        <button id="mobile-cat-display" class="mobile-cat-btn">
          <span class="mobile-cat-icon">👁️</span>
          <span class="mobile-cat-label">Display</span>
        </button>
      </div>

      <!-- Active Control Content -->
      <div id="mobile-content" class="mobile-content" style="display: none;">
        <div id="mobile-control-container" class="mobile-control-container">
          <!-- Dynamic content will be inserted here -->
        </div>
      </div>
    </div>
  `;

  return container;
}

function openCategory(categoryId: string) {
  currentCategory = categoryId;
  currentControl = null;
  
  const sheet = document.getElementById('mobile-sheet');
  const categories = document.getElementById('mobile-categories');
  const content = document.getElementById('mobile-content');
  const backBtn = document.getElementById('mobile-back-btn');
  const title = document.getElementById('mobile-sheet-title');
  
  if (!sheet || !categories || !content || !backBtn || !title) return;

  // Show category content
  categories.style.display = 'none';
  content.style.display = 'block';
  backBtn.style.display = 'block';

  // Update title
  const categoryData = getCategoryData(categoryId);
  title.textContent = categoryData?.name || 'Controls';

  // Render category controls
  renderCategoryControls(categoryId);
  
  // Expand sheet if not already expanded
  if (!isSheetExpanded) {
    sheet.classList.remove('collapsed');
    isSheetExpanded = true;
  }
}

function getCategoryData(categoryId: string) {
  const categories = {
    presets: { name: 'Presets', icon: '⚡' },
    motion: { name: 'Motion', icon: '▶️' },
    positions: { name: 'Positions', icon: '🌍' },
    scale: { name: 'Scale', icon: '📐' },
    display: { name: 'Display', icon: '👁️' }
  };
  return categories[categoryId as keyof typeof categories];
}

function renderCategoryControls(categoryId: string) {
  const container = document.getElementById('mobile-control-container');
  if (!container) return;

  container.innerHTML = '';

  if (categoryId === 'presets') {
    container.innerHTML = `
      <div class="mobile-preset-grid">
        <button class="mobile-preset-btn" onclick="mobileApplyPreset('solar')">Solar Eclipse</button>
        <button class="mobile-preset-btn" onclick="mobileApplyPreset('lunar')">Lunar Eclipse</button>
        <button class="mobile-preset-btn" onclick="mobileApplyPreset('new')">New Moon</button>
        <button class="mobile-preset-btn" onclick="mobileApplyPreset('full')">Full Moon</button>
      </div>
    `;
  } else if (categoryId === 'motion') {
    const state = getState();
    container.innerHTML = `
      <div class="mobile-control-list">
        <button class="mobile-control-item" onclick="openControl('inclination')">
          <span class="mobile-control-label">Inclination</span>
          <span class="mobile-control-value">${state.inclinationDeg.toFixed(1)}°</span>
        </button>
        <button class="mobile-control-item" onclick="openControl('speed')">
          <span class="mobile-control-label">Speed</span>
          <span class="mobile-control-value">${(state.speedMultiplier * 50).toFixed(0)}</span>
        </button>
        <div class="mobile-playback-controls">
          <button class="mobile-play-btn ${state.isPlaying ? 'active' : ''}" onclick="mobileTogglePlay()">
            ${state.isPlaying ? '⏸️ Pause' : '▶️ Play'}
          </button>
        </div>
      </div>
    `;
  } else if (categoryId === 'positions') {
    const state = getState();
    container.innerHTML = `
      <div class="mobile-control-list">
        <button class="mobile-control-item" onclick="openControl('sunAngle')">
          <span class="mobile-control-label">Sun Position</span>
          <span class="mobile-control-value">${(state.sunAngle * 360).toFixed(0)}°</span>
        </button>
        <button class="mobile-control-item" onclick="openControl('moonAngle')">
          <span class="mobile-control-label">Moon Position</span>
          <span class="mobile-control-value">${(state.moonAngle * 360).toFixed(0)}°</span>
        </button>
        <button class="mobile-control-item" onclick="openControl('nodalRegression')">
          <span class="mobile-control-label">Nodal Axis</span>
          <span class="mobile-control-value">${(state.nodalRegression * 360).toFixed(0)}°</span>
        </button>
      </div>
    `;
  } else if (categoryId === 'scale') {
    const state = getState();
    container.innerHTML = `
      <div class="mobile-control-list">
        <button class="mobile-control-item" onclick="openControl('earthRadius')">
          <span class="mobile-control-label">Earth Size</span>
          <span class="mobile-control-value">${state.earthRadius.toFixed(2)}</span>
        </button>
        <button class="mobile-control-item" onclick="openControl('moonRadius')">
          <span class="mobile-control-label">Moon Size</span>
          <span class="mobile-control-value">${state.moonRadius.toFixed(2)}</span>
        </button>
        <button class="mobile-control-item" onclick="openControl('sunRadius')">
          <span class="mobile-control-label">Sun Size</span>
          <span class="mobile-control-value">${state.sunRadius.toFixed(2)}</span>
        </button>
        <button class="mobile-control-item" onclick="openControl('moonOrbitRadius')">
          <span class="mobile-control-label">Moon Orbit</span>
          <span class="mobile-control-value">${state.moonOrbitRadius.toFixed(1)}</span>
        </button>
        <button class="mobile-control-item" onclick="openControl('sunOrbitRadius')">
          <span class="mobile-control-label">Sun Orbit</span>
          <span class="mobile-control-value">${state.sunOrbitRadius.toFixed(0)}</span>
        </button>
      </div>
    `;
  } else if (categoryId === 'display') {
    const state = getState();
    container.innerHTML = `
      <div class="mobile-toggle-list">
        <label class="mobile-toggle-item">
          <span class="mobile-toggle-label">Ecliptic</span>
          <input type="checkbox" ${state.showEcliptic ? 'checked' : ''} onchange="mobileToggle('showEcliptic', this.checked)">
        </label>
        <label class="mobile-toggle-item">
          <span class="mobile-toggle-label">Lunar Plane</span>
          <input type="checkbox" ${state.showLunarPlane ? 'checked' : ''} onchange="mobileToggle('showLunarPlane', this.checked)">
        </label>
        <label class="mobile-toggle-item">
          <span class="mobile-toggle-label">Labels</span>
          <input type="checkbox" ${state.showLabels ? 'checked' : ''} onchange="mobileToggle('showLabels', this.checked)">
        </label>
        <label class="mobile-toggle-item">
          <span class="mobile-toggle-label">Fill Planes</span>
          <input type="checkbox" ${state.showFills ? 'checked' : ''} onchange="mobileToggle('showFills', this.checked)">
        </label>
        <label class="mobile-toggle-item">
          <span class="mobile-toggle-label">Eclipse Indicator</span>
          <input type="checkbox" ${state.showEclipse ? 'checked' : ''} onchange="mobileToggle('showEclipse', this.checked)">
        </label>
        <label class="mobile-toggle-item">
          <span class="mobile-toggle-label">Presenter Pointer</span>
          <input type="checkbox" ${state.showPointer ? 'checked' : ''} onchange="mobileToggle('showPointer', this.checked)">
        </label>
      </div>
    `;
  }
}

function goBack() {
  if (currentControl) {
    // Go back to category from control
    currentControl = null;
    if (currentCategory) {
      renderCategoryControls(currentCategory);
    }
  } else if (currentCategory) {
    // Go back to categories from category
    currentCategory = null;
    const categories = document.getElementById('mobile-categories');
    const content = document.getElementById('mobile-content');
    const backBtn = document.getElementById('mobile-back-btn');
    const title = document.getElementById('mobile-sheet-title');
    
    if (categories) categories.style.display = 'grid';
    if (content) content.style.display = 'none';
    if (backBtn) backBtn.style.display = 'none';
    if (title) title.textContent = 'Controls';
  }
}

function closeSheet() {
  const sheet = document.getElementById('mobile-sheet');
  if (sheet) {
    sheet.classList.add('collapsed');
    isSheetExpanded = false;
  }
  currentCategory = null;
  currentControl = null;
  goBack();
}

function toggleSheet() {
  const sheet = document.getElementById('mobile-sheet');
  if (!sheet) return;
  
  if (isSheetExpanded) {
    closeSheet();
  } else {
    sheet.classList.remove('collapsed');
    isSheetExpanded = true;
  }
}

// Global functions for inline event handlers
(window as any).openControl = openControl;
(window as any).mobileApplyPreset = mobileApplyPreset;
(window as any).mobileTogglePlay = mobileTogglePlay;
(window as any).mobileToggle = mobileToggle;

function openControl(controlId: string) {
  currentControl = controlId;
  const container = document.getElementById('mobile-control-container');
  if (!container) return;

  const controlData = getControlData(controlId);
  if (!controlData) return;

  container.innerHTML = `
    <div class="mobile-single-control">
      <h4 class="mobile-control-title">${controlData.label}</h4>
      <div class="mobile-slider-container">
        <input 
          type="range" 
          id="mobile-${controlId}-slider"
          class="mobile-slider"
          min="${controlData.min}"
          max="${controlData.max}"
          step="${controlData.step}"
          value="${controlData.value}"
        />
        <div class="mobile-slider-value">${controlData.displayValue}</div>
      </div>
    </div>
  `;

  // Add event listener for the slider
  const slider = document.getElementById(`mobile-${controlId}-slider`) as HTMLInputElement;
  if (slider && controlData.setValue) {
    slider.addEventListener('input', () => {
      const value = parseFloat(slider.value);
      controlData.setValue!(value);
      
      // Update display value
      const valueDisplay = container.querySelector('.mobile-slider-value');
      if (valueDisplay) {
        valueDisplay.textContent = formatDisplayValue(controlId, value);
      }
    });
  }
}

function getControlData(controlId: string) {
  const state = getState();
  
  const controls: { [key: string]: any } = {
    inclination: {
      label: 'Inclination',
      min: 0,
      max: 45,
      step: 0.1,
      value: state.inclinationDeg,
      displayValue: `${state.inclinationDeg.toFixed(1)}°`,
      setValue: (v: number) => actions.set('inclinationDeg', v)
    },
    speed: {
      label: 'Speed',
      min: 0,
      max: 100,
      step: 0.25,
      value: state.speedMultiplier * 50,
      displayValue: `${(state.speedMultiplier * 50).toFixed(0)}`,
      setValue: (v: number) => actions.set('speedMultiplier', v / 50)
    },
    sunAngle: {
      label: 'Sun Position',
      min: 0,
      max: 1,
      step: 0.001,
      value: state.sunAngle,
      displayValue: `${(state.sunAngle * 360).toFixed(0)}°`,
      setValue: (v: number) => actions.set('sunAngle', v)
    },
    moonAngle: {
      label: 'Moon Position', 
      min: 0,
      max: 1,
      step: 0.001,
      value: state.moonAngle,
      displayValue: `${(state.moonAngle * 360).toFixed(0)}°`,
      setValue: (v: number) => actions.set('moonAngle', v)
    },
    nodalRegression: {
      label: 'Nodal Axis',
      min: 0,
      max: 1, 
      step: 0.001,
      value: state.nodalRegression,
      displayValue: `${(state.nodalRegression * 360).toFixed(0)}°`,
      setValue: (v: number) => actions.set('nodalRegression', v)
    },
    earthRadius: {
      label: 'Earth Size',
      min: 0.2,
      max: 3,
      step: 0.01,
      value: state.earthRadius,
      displayValue: state.earthRadius.toFixed(2),
      setValue: (v: number) => actions.set('earthRadius', v)
    },
    moonRadius: {
      label: 'Moon Size',
      min: 0.05,
      max: 1.5,
      step: 0.01,
      value: state.moonRadius,
      displayValue: state.moonRadius.toFixed(2),
      setValue: (v: number) => actions.set('moonRadius', v)
    },
    sunRadius: {
      label: 'Sun Size',
      min: 0.5,
      max: 6,
      step: 0.05,
      value: state.sunRadius,
      displayValue: state.sunRadius.toFixed(2),
      setValue: (v: number) => actions.set('sunRadius', v)
    },
    moonOrbitRadius: {
      label: 'Moon Orbit',
      min: 5,
      max: 80,
      step: 0.5,
      value: state.moonOrbitRadius,
      displayValue: state.moonOrbitRadius.toFixed(1),
      setValue: (v: number) => actions.set('moonOrbitRadius', v)
    },
    sunOrbitRadius: {
      label: 'Sun Orbit',
      min: 20,
      max: 140,
      step: 1,
      value: state.sunOrbitRadius,
      displayValue: state.sunOrbitRadius.toFixed(0),
      setValue: (v: number) => actions.set('sunOrbitRadius', v)
    }
  };

  return controls[controlId];
}

function formatDisplayValue(controlId: string, value: number): string {
  if (controlId === 'inclination') return `${value.toFixed(1)}°`;
  if (controlId === 'speed') return `${value.toFixed(0)}`;
  if (['sunAngle', 'moonAngle', 'nodalRegression'].includes(controlId)) return `${(value * 360).toFixed(0)}°`;
  if (['earthRadius', 'moonRadius', 'sunRadius'].includes(controlId)) return value.toFixed(2);
  if (controlId === 'moonOrbitRadius') return value.toFixed(1);
  if (controlId === 'sunOrbitRadius') return value.toFixed(0);
  return value.toString();
}

function mobileApplyPreset(preset: string) {
  actions.set('isPlaying', false);
  
  const state = getState();
  const sun = state.sunAngle;

  function wrap01(v: number) {
    return ((v % 1) + 1) % 1;
  }

  let nodalReg: number;
  let moonAng: number;

  switch (preset) {
    case 'solar':
      nodalReg = wrap01(sun);
      moonAng = wrap01(0.25 - sun);
      break;
    case 'lunar':
      nodalReg = wrap01(sun);
      moonAng = wrap01(0.75 - sun);
      break;
    case 'new':
      nodalReg = wrap01(sun + 0.25);
      moonAng = wrap01(-2 * sun);
      break;
    case 'full':
      nodalReg = wrap01(sun + 0.25);
      moonAng = wrap01(0.5 - 2 * sun);
      break;
    default:
      return;
  }

  startAngleTweens({ nodalRegression: nodalReg, moonAngle: moonAng }, 1.0);
  
  // Close sheet after applying preset
  setTimeout(() => closeSheet(), 500);
}

function mobileTogglePlay() {
  const state = getState();
  actions.set('isPlaying', !state.isPlaying);
  
  // Update the button
  if (currentCategory === 'motion') {
    renderCategoryControls('motion');
  }
}

function mobileToggle(key: string, value: boolean) {
  (actions as any).set(key, value);
}

function togglePlayback() {
  const state = getState();
  actions.set('isPlaying', !state.isPlaying);
}

function applyPreset(preset: string) {
  mobileApplyPreset(preset);
}
