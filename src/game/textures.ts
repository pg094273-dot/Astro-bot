import * as THREE from 'three';

export interface ProceduralTextures {
  techGrid: THREE.CanvasTexture;
  jungleGrass: THREE.CanvasTexture;
  desertSandstone: THREE.CanvasTexture;
  iceCrystal: THREE.CanvasTexture;
  goldTrim: THREE.CanvasTexture;
  crystalCircuit: THREE.CanvasTexture;
  lagoonSurface: THREE.CanvasTexture;
  sandOceanSurface: THREE.CanvasTexture;
  iceSeaSurface: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  skyJungle: THREE.CanvasTexture;
  skyDesert: THREE.CanvasTexture;
  skyIce: THREE.CanvasTexture;
}

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeColorTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  tex.needsUpdate = true;
  return tex;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextures {
  // 1. Clean PlayStation-inspired white/silver hex-tech floor grid
  const [techC, techCtx] = makeCanvas(256, 256);
  techCtx.fillStyle = '#e8eef8';
  techCtx.fillRect(0, 0, 256, 256);
  techCtx.strokeStyle = '#cbd5e1';
  techCtx.lineWidth = 3;
  for (let i = 0; i <= 256; i += 64) {
    techCtx.beginPath();
    techCtx.moveTo(i, 0);
    techCtx.lineTo(i, 256);
    techCtx.stroke();
    techCtx.beginPath();
    techCtx.moveTo(0, i);
    techCtx.lineTo(256, i);
    techCtx.stroke();
  }
  techCtx.fillStyle = '#2563eb';
  for (let x = 32; x < 256; x += 64) {
    for (let y = 32; y < 256; y += 64) {
      techCtx.beginPath();
      techCtx.arc(x, y, 4, 0, Math.PI * 2);
      techCtx.fill();
    }
  }
  const techGrid = finalizeColorTexture(techC, maxAnisotropy);

  // 2. Jungle emerald grass with ancient stone temple inlays
  const [jC, jCtx] = makeCanvas(256, 256);
  jCtx.fillStyle = '#16a34a';
  jCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 480; i++) {
    const gx = (i * 73) % 256;
    const gy = (i * 139) % 256;
    jCtx.fillStyle = i % 3 === 0 ? '#4ade80' : i % 3 === 1 ? '#15803d' : '#86efac';
    jCtx.fillRect(gx, gy, 5, 5);
  }
  jCtx.strokeStyle = 'rgba(254, 240, 138, 0.25)';
  jCtx.lineWidth = 4;
  jCtx.strokeRect(8, 8, 240, 240);
  jCtx.strokeStyle = 'rgba(20, 83, 45, 0.35)';
  jCtx.strokeRect(20, 20, 216, 216);
  const jungleGrass = finalizeColorTexture(jC, maxAnisotropy);

  // 3. Desert carved sandstone blocks with warm gold trim
  const [dC, dCtx] = makeCanvas(256, 256);
  dCtx.fillStyle = '#d97706';
  dCtx.fillRect(0, 0, 256, 256);
  const sandGrad = dCtx.createLinearGradient(0, 0, 256, 256);
  sandGrad.addColorStop(0, '#f59e0b');
  sandGrad.addColorStop(1, '#b45309');
  dCtx.fillStyle = sandGrad;
  dCtx.fillRect(0, 0, 256, 256);
  dCtx.strokeStyle = '#78350f';
  dCtx.lineWidth = 3;
  for (let y = 0; y < 256; y += 64) {
    dCtx.beginPath();
    dCtx.moveTo(0, y);
    dCtx.lineTo(256, y);
    dCtx.stroke();
    const offset = (y / 64) % 2 === 0 ? 0 : 64;
    for (let x = offset; x < 256; x += 128) {
      dCtx.beginPath();
      dCtx.moveTo(x, y);
      dCtx.lineTo(x, y + 64);
      dCtx.stroke();
    }
  }
  dCtx.fillStyle = 'rgba(254, 243, 199, 0.22)';
  for (let i = 0; i < 200; i++) {
    dCtx.fillRect((i * 89) % 256, (i * 53) % 256, 3, 3);
  }
  const desertSandstone = finalizeColorTexture(dC, maxAnisotropy);

  // 4. Ice crystal glacier facets
  const [iC, iCtx] = makeCanvas(256, 256);
  const iceGrad = iCtx.createLinearGradient(0, 0, 256, 256);
  iceGrad.addColorStop(0, '#e0f2fe');
  iceGrad.addColorStop(0.5, '#7dd3fc');
  iceGrad.addColorStop(1, '#38bdf8');
  iCtx.fillStyle = iceGrad;
  iCtx.fillRect(0, 0, 256, 256);
  iCtx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  iCtx.lineWidth = 2;
  for (let k = 0; k < 16; k++) {
    const x1 = (k * 47) % 256;
    const y1 = (k * 83) % 256;
    iCtx.beginPath();
    iCtx.moveTo(x1, y1);
    iCtx.lineTo((x1 + 70) % 256, (y1 + 45) % 256);
    iCtx.lineTo((x1 + 25) % 256, (y1 + 95) % 256);
    iCtx.closePath();
    iCtx.fillStyle = k % 2 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(14,165,233,0.16)';
    iCtx.fill();
    iCtx.stroke();
  }
  const iceCrystal = finalizeColorTexture(iC, maxAnisotropy);

  // 5. Crystal cyber-circuit
  const [crysC, crysCtx] = makeCanvas(256, 256);
  crysCtx.fillStyle = '#0f1c3f';
  crysCtx.fillRect(0, 0, 256, 256);
  crysCtx.strokeStyle = '#38bdf8';
  crysCtx.lineWidth = 3;
  crysCtx.strokeRect(6, 6, 244, 244);
  crysCtx.beginPath();
  crysCtx.moveTo(0, 64);
  crysCtx.lineTo(128, 64);
  crysCtx.lineTo(192, 128);
  crysCtx.lineTo(256, 128);
  crysCtx.stroke();
  const crystalCircuit = finalizeColorTexture(crysC, maxAnisotropy);

  // 6. Brushed gold trim
  const [goldC, goldCtx] = makeCanvas(128, 128);
  goldCtx.fillStyle = '#f59e0b';
  goldCtx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 2) {
    goldCtx.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.16)' : 'rgba(120,53,15,0.14)';
    goldCtx.fillRect(0, y, 128, 1);
  }
  const goldTrim = finalizeColorTexture(goldC, maxAnisotropy);

  // 7. Biome Sea Surfaces (Lagoon, Sand Sea, Frozen Ocean)
  const makeSeaTex = (c1: string, c2: string, waveColor: string) => {
    const [c, ctx] = makeCanvas(256, 256);
    const g = ctx.createLinearGradient(0, 0, 256, 256);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = waveColor;
    ctx.lineWidth = 3;
    for (let y = 16; y < 256; y += 32) {
      ctx.beginPath();
      for (let x = 0; x <= 256; x += 16) {
        const wy = y + Math.sin((x / 256) * Math.PI * 4) * 6;
        if (x === 0) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }
    return finalizeColorTexture(c, maxAnisotropy, 16, 16);
  };

  const lagoonSurface = makeSeaTex('#0284c7', '#0d9488', 'rgba(186, 230, 253, 0.35)');
  const sandOceanSurface = makeSeaTex('#d97706', '#b45309', 'rgba(253, 224, 71, 0.28)');
  const iceSeaSurface = makeSeaTex('#0c4a6e', '#1e3a8a', 'rgba(186, 230, 253, 0.3)');

  // 8. Radial Contact Shadow
  const [shC, shCtx] = makeCanvas(128, 128);
  const shGrad = shCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
  shGrad.addColorStop(0, 'rgba(4, 10, 24, 0.72)');
  shGrad.addColorStop(0.55, 'rgba(4, 10, 24, 0.35)');
  shGrad.addColorStop(1, 'rgba(4, 10, 24, 0)');
  shCtx.fillStyle = shGrad;
  shCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(shC);
  contactShadow.needsUpdate = true;

  // 9. Panoramic Sky Dome Backdrops (1024x512 equirectangular-style painted horizons)
  const makePanoramicSky = (drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const [c, ctx] = makeCanvas(1024, 512);
    drawFn(ctx, 1024, 512);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  };

  // Jungle Panorama: Tropical sky, sunlit clouds, distant misty rainforest mountains & temple peaks
  const skyJungle = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0284c7');
    g.addColorStop(0.45, '#38bdf8');
    g.addColorStop(0.7, '#bbf7d0');
    g.addColorStop(1, '#15803d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Sun glow
    const sunG = ctx.createRadialGradient(780, 130, 12, 780, 130, 140);
    sunG.addColorStop(0, 'rgba(254, 249, 195, 0.95)');
    sunG.addColorStop(0.35, 'rgba(253, 224, 71, 0.4)');
    sunG.addColorStop(1, 'rgba(253, 224, 71, 0)');
    ctx.fillStyle = sunG;
    ctx.fillRect(620, 0, 320, 280);

    // Soft puffy clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    for (let i = 0; i < 14; i++) {
      const cx = (i * 83) % w;
      const cy = 120 + (i % 4) * 35;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 48 + (i % 3) * 18, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Far lush mountain ridges
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 32) {
      const y = 305 + Math.sin(x * 0.012) * 32 + Math.cos(x * 0.029) * 18;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Closer emerald canopy hills
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 24) {
      const y = 345 + Math.sin(x * 0.02 + 1.4) * 24 + Math.cos(x * 0.045) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });

  // Desert Panorama: Golden sunset sky, blazing sun, distant stepped pyramids & layered sandstone dunes
  const skyDesert = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1e1b4b');
    g.addColorStop(0.32, '#9a3412');
    g.addColorStop(0.62, '#f97316');
    g.addColorStop(0.85, '#fdba74');
    g.addColorStop(1, '#b45309');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Setting desert sun
    const sunG = ctx.createRadialGradient(512, 240, 22, 512, 240, 170);
    sunG.addColorStop(0, '#fef9c3');
    sunG.addColorStop(0.3, 'rgba(251, 191, 36, 0.7)');
    sunG.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = sunG;
    ctx.fillRect(320, 60, 384, 360);

    // Distant Pyramid silhouettes
    ctx.fillStyle = '#7c2d12';
    const pyramids = [
      [180, 330, 150, 95],
      [340, 335, 110, 70],
      [740, 330, 180, 110],
      [900, 338, 120, 75],
    ];
    for (const [px, py, pw, ph] of pyramids) {
      ctx.beginPath();
      ctx.moveTo(px - pw / 2, py);
      ctx.lineTo(px, py - ph);
      ctx.lineTo(px + pw / 2, py);
      ctx.closePath();
      ctx.fill();
    }

    // Sweeping dunes
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 24) {
      ctx.lineTo(x, 325 + Math.sin(x * 0.011) * 26);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 24) {
      ctx.lineTo(x, 365 + Math.cos(x * 0.016) * 22);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });

  // Ice Panorama: Polar night-twilight sky, glowing emerald/cyan aurora ribbons, jagged glacier peaks & stars
  const skyIce = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#020617');
    g.addColorStop(0.45, '#0c4a6e');
    g.addColorStop(0.75, '#38bdf8');
    g.addColorStop(1, '#bae6fd');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Polar stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let i = 0; i < 160; i++) {
      const sx = (i * 137) % w;
      const sy = (i * 59) % 240;
      ctx.fillRect(sx, sy, (i % 3) + 1, (i % 3) + 1);
    }

    // Aurora Borealis waves
    const auroraG = ctx.createLinearGradient(0, 80, 0, 240);
    auroraG.addColorStop(0, 'rgba(52, 211, 153, 0)');
    auroraG.addColorStop(0.5, 'rgba(45, 212, 191, 0.42)');
    auroraG.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = auroraG;
    ctx.beginPath();
    ctx.moveTo(0, 210);
    for (let x = 0; x <= w; x += 20) {
      ctx.lineTo(x, 150 + Math.sin(x * 0.015) * 35);
    }
    ctx.lineTo(w, 250);
    for (let x = w; x >= 0; x -= 20) {
      ctx.lineTo(x, 220 + Math.cos(x * 0.015) * 28);
    }
    ctx.closePath();
    ctx.fill();

    // Jagged Glacier Peaks
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 32) {
      const peak = (x % 96 === 0) ? -55 : (x % 64 === 0) ? -25 : 10;
      ctx.lineTo(x, 330 + peak);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 28) {
      const peak = (x % 84 === 0) ? -32 : 8;
      ctx.lineTo(x, 365 + peak);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });

  return {
    techGrid,
    jungleGrass,
    desertSandstone,
    iceCrystal,
    goldTrim,
    crystalCircuit,
    lagoonSurface,
    sandOceanSurface,
    iceSeaSurface,
    contactShadow,
    skyJungle,
    skyDesert,
    skyIce,
  };
}

export function disposeProceduralTextures(tex: ProceduralTextures) {
  Object.values(tex).forEach((t) => {
    if (t && typeof t.dispose === 'function') {
      t.dispose();
    }
  });
}
