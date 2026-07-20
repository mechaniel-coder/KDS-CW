// hero-particles.js — interactive 3D particle hero (Three.js, no build step)
// Particles burst from a scattered cloud into a ring formation on load, then
// idle-rotate and respond to pointer movement. Degrades gracefully.

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

    // --- Target shape: points scattered across a torus surface (ring / wheel motif) ---
    const majorR = 2.4;
    const minorR = 0.85;
    const targetPositions = new Float32Array(COUNT * 3);
    const startPositions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);

    const accent = new THREE.Color(0xff5a1f);
    const accentHot = new THREE.Color(0xff9a63);
    const accentDeep = new THREE.Color(0xa8330f);

    for (let i = 0; i < COUNT; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 0.18;

      const x = (majorR + (minorR + jitter) * Math.cos(v)) * Math.cos(u);
      const y = (majorR + (minorR + jitter) * Math.cos(v)) * Math.sin(u) * 0.55; // flatten to oval
      const z = (minorR + jitter) * Math.sin(v);

      targetPositions[i * 3] = x;
      targetPositions[i * 3 + 1] = y;
      targetPositions[i * 3 + 2] = z;

      // Start: scattered near center, will "explode" outward into the ring
      const r = Math.random() * 1.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      startPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      startPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      startPositions[i * 3 + 2] = r * Math.cos(phi);

      const t = Math.random();
      const c = t < 0.5 ? accentDeep.clone().lerp(accent, t * 2) : accent.clone().lerp(accentHot, (t - 0.5) * 2);
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

    // --- Pointer parallax (desktop only — subtle tilt toward cursor) ---
    let targetPointerRotX = 0;
    let targetPointerRotY = 0;
    let pointerRotX = 0;
    let pointerRotY = 0;

    // Listener is always attached — pointer events fire for touch too on modern
    // browsers, so a high-tier phone gets the same tilt as desktop. Whether it's
    // actually applied is gated by `tiltEnabled`, which the FPS probe can flip.
    container.addEventListener('pointermove', (e) => {
      if (!tiltEnabled) return;
      const rect = container.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      targetPointerRotY = px * 0.35;
      targetPointerRotX = py * -0.2;
    });
    container.addEventListener('pointerleave', () => {
      targetPointerRotX = 0;
      targetPointerRotY = 0;
    });

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

      // Ambient idle motion — gentle wobble (keeps the ring's hole visible face-on)
      // plus pointer-driven tilt layered on top, instead of a full continuous spin
      // (a full spin + additive blending washed the ring out into a blob).
      if (!reduceMotion) {
        const t = now * 0.001;
        const wobbleY = Math.sin(t * 0.18) * 0.24;
        const wobbleX = Math.cos(t * 0.15) * 0.06;
        const wobbleZ = Math.sin(t * 0.11) * 0.05;

        pointerRotX += (targetPointerRotX - pointerRotX) * 0.04;
        pointerRotY += (targetPointerRotY - pointerRotY) * 0.04;

        points.rotation.set(wobbleX + pointerRotX, wobbleY + pointerRotY, wobbleZ);
      }

      renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);
  }
}
