// hero-particles.js — interactive 3D particle hero (Three.js, no build step)
// Particles burst from a scattered cloud and condense into a solid skateboard
// (deck + trucks + wheels) on load. Drag with mouse/touch to freely spin it
// 360° in any direction, like orbiting a model in a CAD viewer — release to
// coast with momentum, then it eases back into a slow showcase auto-rotate.
// Degrades gracefully.

import * as THREE from 'three';

const canvas = document.getElementById('heroCanvas');
const container = canvas ? canvas.closest('.hero-viz') : null;
if (!canvas || !container) {
  // No hero panel on this page — nothing to do.
} else {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Capability tiering ---
  // Instead of assuming "small screen = weak device", score actual hardware
  // signals so a high-end phone gets the full particle ring + tilt response,
  // while a genuinely weak device (phone or desktop) gets the lighter build.
  const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const isNarrowViewport = window.matchMedia('(max-width: 720px)').matches;

  function scoreDeviceTier() {
    const cores = navigator.hardwareConcurrency || 4; // unknown -> assume mid-range
    const memory = navigator.deviceMemory; // GB, undefined on many browsers (e.g. iOS Safari)

    let score = 0;
    if (cores >= 6) score += 2;
    else if (cores >= 4) score += 1;

    // Only weigh memory when the browser actually exposes it — don't punish
    // browsers (Safari/Firefox) that simply don't report deviceMemory.
    if (typeof memory === 'number') {
      if (memory >= 6) score += 2;
      else if (memory >= 4) score += 1;
      else score -= 1;
    }

    // A touch device that also reports strong cores/memory is treated as a
    // high-end phone rather than downgraded purely for being touch-based.
    return score >= 2 ? 'high' : score <= -1 ? 'low' : 'mid';
  }

  let tier = scoreDeviceTier();
  // Narrow viewport + no strong hardware signal at all -> assume low-end phone
  // (protects very old/unknown devices where the APIs above are unavailable).
  if (isNarrowViewport && tier === 'mid' && !navigator.hardwareConcurrency && typeof navigator.deviceMemory !== 'number') {
    tier = 'low';
  }

  function tierToConfig(t) {
    if (t === 'high') return { count: 1500, size: 0.05, tilt: true };
    if (t === 'low') return { count: 500, size: 0.065, tilt: false };
    return { count: 950, size: 0.058, tilt: !isCoarsePointer };
  }

  let config = tierToConfig(tier);

  try {
    initHero();
  } catch (err) {
    // WebGL unavailable or failed — fall back panel (already in DOM) stays visible.
    console.warn('Hero particle system unavailable, using static fallback.', err);
    canvas.style.display = 'none';
    container.classList.add('hero-viz--fallback-active');
  }

  function initHero() {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a0a, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    // Buffers are always allocated at MAX_COUNT so the runtime FPS probe can
    // promote a device to more particles later just by widening the draw
    // range — no reallocation needed. Only `drawCount` (below) is what's
    // actually rendered at any moment.
    const MAX_COUNT = 1500;
    const COUNT = MAX_COUNT;
    let drawCount = config.count;
    let tiltEnabled = config.tilt;

    // --- Target shape: points across a skateboard (deck + trucks + wheels) ---
    // Footprint is a "stadium" (rectangle with rounded nose/tail caps), with a
    // kicktail curve lifting both ends and a slight concave dish across the
    // width — classic deck silhouette. Two trucks bridge down to four wheels.
    const L = 1.85; // half-length of the straight mid-section
    const capR = 0.55; // nose/tail cap radius = half deck width
    const halfLen = L + capR;
    const kickStart = 0.55; // fraction of half-length where the kicktail begins
    const kickHeight = 0.42;
    const concaveDepth = 0.045;
    const deckJitter = 0.05;
    const truckX = 1.25; // truck mounting position along the length
    const truckHalfWidth = 0.08;
    const truckY = 0.46; // truck bar half-span across the width
    const wheelRadius = 0.16;
    const wheelThickness = 0.13;
    const wheelZ = -0.42; // axle depth, below the deck

    function deckZ(x, y) {
      const absT = Math.abs(x) / halfLen;
      const kickT = Math.max(0, (absT - kickStart) / (1 - kickStart));
      const kick = kickHeight * kickT * kickT;
      const concave = concaveDepth * (y / capR) * (y / capR);
      return kick + concave;
    }

    const targetPositions = new Float32Array(COUNT * 3);
    const startPositions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);

    const accent = new THREE.Color(0xff5a1f);
    const accentHot = new THREE.Color(0xff9a63);
    const accentDeep = new THREE.Color(0xa8330f);
    const wheelDark = new THREE.Color(0x8a8a8a);
    const wheelLight = new THREE.Color(0xf2f0ec);

    for (let i = 0; i < COUNT; i++) {
      const roll = Math.random();
      let x, y, z, isWheel;

      if (roll < 0.6) {
        // Deck: rejection-sample the stadium footprint, then bow it into shape.
        isWheel = false;
        do {
          x = (Math.random() * 2 - 1) * halfLen;
          y = (Math.random() * 2 - 1) * capR;
          const capDist = Math.max(0, Math.abs(x) - L);
          if (capDist * capDist + y * y <= capR * capR) break;
        } while (true);
        z = deckZ(x, y) + (Math.random() - 0.5) * deckJitter;
      } else if (roll < 0.75) {
        // Trucks: thin bars bridging the deck underside down toward the axles.
        isWheel = false;
        const side = Math.random() < 0.5 ? -1 : 1;
        const tx = side * truckX;
        x = tx + (Math.random() * 2 - 1) * truckHalfWidth;
        y = (Math.random() * 2 - 1) * truckY;
        const zTop = deckZ(tx, 0) - deckJitter / 2;
        const zBottom = wheelZ + wheelRadius * 0.3;
        z = zTop + (zBottom - zTop) * Math.random();
      } else {
        // Wheels: small discs whose flat face lies in the x/z plane (axle = y).
        isWheel = true;
        const sideX = Math.random() < 0.5 ? -1 : 1;
        const sideY = Math.random() < 0.5 ? -1 : 1;
        const wx = sideX * truckX;
        const wy = sideY * truckY;
        const angle = Math.random() * Math.PI * 2;
        const rr = wheelRadius * (0.55 + 0.45 * Math.random());
        x = wx + rr * Math.cos(angle);
        y = wy + (Math.random() * 2 - 1) * (wheelThickness / 2);
        z = wheelZ + rr * Math.sin(angle);
      }

      targetPositions[i * 3] = x;
      targetPositions[i * 3 + 1] = y;
      targetPositions[i * 3 + 2] = z;

      // Start: scattered near center, will "explode" outward and condense
      // into the solid skateboard shape.
      const r = Math.random() * 1.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      startPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      startPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      startPositions[i * 3 + 2] = r * Math.cos(phi);

      const t = Math.random();
      const c = isWheel
        ? wheelDark.clone().lerp(wheelLight, t)
        : t < 0.5
          ? accentDeep.clone().lerp(accent, t * 2)
          : accent.clone().lerp(accentHot, (t - 0.5) * 2);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(startPositions.slice(), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setDrawRange(0, drawCount);

    // Soft circular sprite drawn on a canvas (no external texture asset needed)
    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const ctx = spriteCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.6)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const spriteTexture = new THREE.CanvasTexture(spriteCanvas);

    const material = new THREE.PointsMaterial({
      size: config.size,
      map: spriteTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // --- Sizing ---
    function resize() {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    // --- Drag-to-rotate (CAD/turntable style — free orbit in any direction) ---
    const DEFAULT_PITCH = -0.32; // resting showcase angle (slightly from above)
    const DRAG_SENSITIVITY = 0.0085; // radians per pixel dragged
    const MOMENTUM_DECAY = 0.94; // per-frame velocity falloff after release
    const IDLE_RESUME_MS = 1600; // wait this long after release before auto-spin resumes
    const AUTO_SPIN_SPEED = 0.22; // radians/sec once idle

    let rotX = DEFAULT_PITCH;
    let rotY = 0;
    let velX = 0;
    let velY = 0;
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastInteractionAt = 0;
    const hint = container.querySelector('.hero-viz__hint');

    container.style.touchAction = 'none';
    container.style.cursor = 'grab';

    function hideHint() {
      if (hint) hint.classList.add('is-hidden');
    }

    container.addEventListener('pointerdown', (e) => {
      isDragging = true;
      velX = 0;
      velY = 0;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      container.style.cursor = 'grabbing';
      container.setPointerCapture?.(e.pointerId);
      hideHint();
    });

    container.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      velY = dx * DRAG_SENSITIVITY;
      velX = dy * DRAG_SENSITIVITY;
      rotY += velY;
      rotX += velX;
      lastInteractionAt = performance.now();
    });

    function releaseDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      lastInteractionAt = performance.now();
      container.style.cursor = 'grab';
      if (e?.pointerId != null) container.releasePointerCapture?.(e.pointerId);
    }
    container.addEventListener('pointerup', releaseDrag);
    container.addEventListener('pointercancel', releaseDrag);

    // --- Pause rendering when off-screen or tab hidden (battery/perf) ---
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 },
    );
    observer.observe(container);

    document.addEventListener('visibilitychange', () => {
      isVisible = isVisible && document.visibilityState === 'visible';
    });

    // --- Morph-in animation (explode from center into ring) then idle ---
    const posAttr = geometry.getAttribute('position');
    const morphDuration = reduceMotion ? 0 : 1900; // ms
    let morphStart = null;
    let morphed = reduceMotion;
    let lastFrameTime = null;

    if (reduceMotion) {
      posAttr.array.set(targetPositions);
      posAttr.needsUpdate = true;
      material.opacity = 0.92;
    }

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    // --- Runtime FPS probe ---
    // Static signals (cores/memory) are a good first guess but can misjudge a
    // device — this confirms the guess against real frame times once the morph
    // has settled, and adjusts once. Skipped entirely for reduced-motion, since
    // there's no ongoing animation to measure.
    let probeDone = reduceMotion;
    let probeArmedAt = null;
    const probeSamples = [];
    const PROBE_SETTLE_MS = 300; // wait this long after morph completes before sampling
    const PROBE_WINDOW_MS = 1200; // then measure over this window

    function maybeRunProbe(now) {
      if (probeDone) return;
      if (probeArmedAt === null) {
        probeArmedAt = now + PROBE_SETTLE_MS;
        return;
      }
      if (now < probeArmedAt) return;

      probeSamples.push(now);
      const windowStart = now - PROBE_WINDOW_MS;
      while (probeSamples.length && probeSamples[0] < windowStart) probeSamples.shift();

      if (now - probeArmedAt < PROBE_WINDOW_MS) return; // still gathering

      const avgFps =
        probeSamples.length > 1
          ? (probeSamples.length - 1) / ((probeSamples[probeSamples.length - 1] - probeSamples[0]) / 1000)
          : 60;

      if (avgFps < 40 && drawCount > 500) {
        // Struggling — drop to the light build and cut the tilt calc regardless
        // of the static guess.
        drawCount = 500;
        tiltEnabled = false;
        geometry.setDrawRange(0, drawCount);
      } else if (avgFps >= 55 && drawCount < MAX_COUNT) {
        // Comfortably fast — this device (often a high-end phone the static
        // signals underrated) can handle the full ring and tilt.
        drawCount = tier === 'low' ? 950 : MAX_COUNT;
        tiltEnabled = true;
        geometry.setDrawRange(0, drawCount);
      }

      probeDone = true;
    }

    function animate(now) {
      requestAnimationFrame(animate);
      if (!isVisible) return;

      if (!morphed) {
        if (morphStart === null) morphStart = now;
        const elapsed = now - morphStart;
        const t = Math.min(1, elapsed / morphDuration);
        const eased = easeOutCubic(t);

        for (let i = 0; i < COUNT; i++) {
          const i3 = i * 3;
          posAttr.array[i3] = startPositions[i3] + (targetPositions[i3] - startPositions[i3]) * eased;
          posAttr.array[i3 + 1] = startPositions[i3 + 1] + (targetPositions[i3 + 1] - startPositions[i3 + 1]) * eased;
          posAttr.array[i3 + 2] = startPositions[i3 + 2] + (targetPositions[i3 + 2] - startPositions[i3 + 2]) * eased;
        }
        posAttr.needsUpdate = true;
        material.opacity = 0.92 * eased;

        if (t >= 1) morphed = true;
      }

      if (morphed) maybeRunProbe(now);

      // Free orbit: while dragging, rotation already follows the pointer
      // directly (see pointermove above). Otherwise coast on momentum, then
      // settle into a slow showcase auto-spin around the vertical axis and
      // ease the pitch back to the default resting angle.
      const dt = lastFrameTime === null ? 0 : Math.min(0.05, (now - lastFrameTime) / 1000);
      lastFrameTime = now;

      if (!isDragging && !reduceMotion) {
        rotX += velX;
        rotY += velY;
        velX *= MOMENTUM_DECAY;
        velY *= MOMENTUM_DECAY;
        if (Math.abs(velX) < 0.0001) velX = 0;
        if (Math.abs(velY) < 0.0001) velY = 0;

        if (now - lastInteractionAt > IDLE_RESUME_MS && velX === 0 && velY === 0) {
          rotX += (DEFAULT_PITCH - rotX) * 0.02;
          rotY += AUTO_SPIN_SPEED * dt;
        }
      }

      points.rotation.set(rotX, rotY, 0);

      renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);
  }
}
