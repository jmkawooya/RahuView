export type PointerOverlay = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  setEnabled: (v: boolean) => void;
  resize: () => void;
  update: (dt: number) => void;
};

type TrailPoint = { x: number; y: number; life: number };

export function createPointerOverlay(root: HTMLElement): PointerOverlay {
  const canvas = document.getElementById("pointer-overlay") as HTMLCanvasElement | null
    || (function(){
      const c = document.createElement("canvas");
      c.id = "pointer-overlay";
      c.className = "pointer-overlay";
      root.appendChild(c);
      return c;
    })();
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D context unavailable for pointer overlay");

  let enabled = true;
  let dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  let mouseX = 0;
  let mouseY = 0;
  const trail: TrailPoint[] = [];

  function resize() {
    dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(2, Math.floor(rect.width * dpr));
    canvas.height = Math.max(2, Math.floor(rect.height * dpr));
  }

  function setEnabled(v: boolean) {
    enabled = v;
    if (!enabled) {
      trail.length = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function addPoint(x: number, y: number) {
    const rect = canvas.getBoundingClientRect();
    const px = (x - rect.left) * dpr;
    const py = (y - rect.top) * dpr;
    trail.push({ x: px, y: py, life: 1 });
    // Keep trail bounded
    if (trail.length > 120) trail.splice(0, trail.length - 120);
  }

  // Mouse tracking on the whole window; canvas has pointer-events none
  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (enabled) addPoint(mouseX, mouseY);
  });

  function draw(dt: number) {
    if (!enabled) return;

    // Decay trail
    for (let i = 0; i < trail.length; i++) {
      trail[i].life -= dt * 1.5; // fade speed
    }
    while (trail.length && trail[0].life <= 0) trail.shift();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw trail with additive glow
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      const t = Math.max(0, Math.min(1, p.life));
      const radius = 10 + 30 * t; // leading points bigger
      const alpha = 0.12 * t;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      grad.addColorStop(0, `rgba(255, 240, 120, ${alpha * 1.0})`);
      grad.addColorStop(0.4, `rgba(255, 210, 60, ${alpha * 0.7})`);
      grad.addColorStop(1, "rgba(255, 160, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Draw bright head at current mouse
    const rect = canvas.getBoundingClientRect();
    const hx = (mouseX - rect.left) * dpr;
    const hy = (mouseY - rect.top) * dpr;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    // Outer glow
    let radius = 22;
    let grad = ctx.createRadialGradient(hx, hy, 0, hx, hy, radius * 2.2);
    grad.addColorStop(0, "rgba(255, 255, 200, 0.35)");
    grad.addColorStop(1, "rgba(255, 180, 0, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(hx, hy, radius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Core
    radius = 10;
    grad = ctx.createRadialGradient(hx, hy, 0, hx, hy, radius);
    grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    grad.addColorStop(1, "rgba(255, 240, 120, 0.0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(hx, hy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Initial sizing
  resize();
  window.addEventListener("resize", resize);

  return {
    canvas,
    ctx,
    setEnabled,
    resize,
    update: draw,
  };
}


