import * as THREE from 'three';

export interface ProceduralTextures {
  techGrid: THREE.CanvasTexture;
  jungleGrass: THREE.CanvasTexture;
  desertSandstone: THREE.CanvasTexture;
  iceCrystal: THREE.CanvasTexture;
  volcanicBasalt: THREE.CanvasTexture;
  nebulaDeck: THREE.CanvasTexture;
  climbStone: THREE.CanvasTexture;
  goldTrim: THREE.CanvasTexture;
  crystalCircuit: THREE.CanvasTexture;
  lagoonSurface: THREE.CanvasTexture;
  sandOceanSurface: THREE.CanvasTexture;
  iceSeaSurface: THREE.CanvasTexture;
  lavaSurface: THREE.CanvasTexture;
  nebulaSeaSurface: THREE.CanvasTexture;
  barkTexture: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  skyJungle: THREE.CanvasTexture;
  skyDesert: THREE.CanvasTexture;
  skyIce: THREE.CanvasTexture;
  skyVolcanic: THREE.CanvasTexture;
  skyNebula: THREE.CanvasTexture;
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
  const techG = techCtx.createLinearGradient(0, 0, 256, 256);
  techG.addColorStop(0, '#f1f5f9');
  techG.addColorStop(1, '#dbe6f4');
  techCtx.fillStyle = techG;
  techCtx.fillRect(0, 0, 256, 256);
  techCtx.strokeStyle = '#94a3b8';
  techCtx.lineWidth = 2;
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
      techCtx.arc(x, y, 4.5, 0, Math.PI * 2);
      techCtx.fill();
    }
  }
  const techGrid = finalizeColorTexture(techC, maxAnisotropy);

  // 2. Realistic Jungle Mossy Grass & Carved Mayan Stone
  const [jC, jCtx] = makeCanvas(512, 512);
  const jGrad = jCtx.createRadialGradient(256, 256, 40, 256, 256, 360);
  jGrad.addColorStop(0, '#22c55e');
  jGrad.addColorStop(0.65, '#15803d');
  jGrad.addColorStop(1, '#14532d');
  jCtx.fillStyle = jGrad;
  jCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1800; i++) {
    const gx = (i * 173 + 29) % 512;
    const gy = (i * 313 + 71) % 512;
    jCtx.fillStyle =
      i % 4 === 0
        ? 'rgba(134, 239, 172, 0.35)'
        : i % 4 === 1
          ? 'rgba(21, 128, 61, 0.55)'
          : i % 4 === 2
            ? 'rgba(74, 222, 128, 0.3)'
            : 'rgba(20, 83, 45, 0.45)';
    jCtx.fillRect(gx, gy, 4 + (i % 4), 2 + (i % 5));
  }
  jCtx.strokeStyle = 'rgba(254, 240, 138, 0.32)';
  jCtx.lineWidth = 6;
  jCtx.strokeRect(14, 14, 484, 484);
  jCtx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
  jCtx.strokeRect(32, 32, 448, 448);
  const jungleGrass = finalizeColorTexture(jC, maxAnisotropy);

  // 3. Detailed Desert Sandstone Ashlar Blocks
  const [dC, dCtx] = makeCanvas(512, 512);
  const sandGrad = dCtx.createLinearGradient(0, 0, 512, 512);
  sandGrad.addColorStop(0, '#f59e0b');
  sandGrad.addColorStop(0.5, '#d97706');
  sandGrad.addColorStop(1, '#b45309');
  dCtx.fillStyle = sandGrad;
  dCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1500; i++) {
    const sx = (i * 197) % 512;
    const sy = (i * 263) % 512;
    dCtx.fillStyle = i % 2 === 0 ? 'rgba(254, 243, 199, 0.16)' : 'rgba(120, 53, 15, 0.18)';
    dCtx.fillRect(sx, sy, 6, 2);
  }
  dCtx.strokeStyle = 'rgba(120, 53, 15, 0.72)';
  dCtx.lineWidth = 4;
  for (let y = 0; y < 512; y += 128) {
    dCtx.beginPath();
    dCtx.moveTo(0, y);
    dCtx.lineTo(512, y);
    dCtx.stroke();
    const offset = (y / 128) % 2 === 0 ? 0 : 128;
    for (let x = offset; x < 512; x += 256) {
      dCtx.beginPath();
      dCtx.moveTo(x, y);
      dCtx.lineTo(x, y + 128);
      dCtx.stroke();
    }
  }
  const desertSandstone = finalizeColorTexture(dC, maxAnisotropy);

  // 4. Fractured Glacier Ice Crystal
  const [iC, iCtx] = makeCanvas(512, 512);
  const iceGrad = iCtx.createLinearGradient(0, 0, 512, 512);
  iceGrad.addColorStop(0, '#f0f9ff');
  iceGrad.addColorStop(0.5, '#7dd3fc');
  iceGrad.addColorStop(1, '#0284c7');
  iCtx.fillStyle = iceGrad;
  iCtx.fillRect(0, 0, 512, 512);
  iCtx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  iCtx.lineWidth = 2.5;
  for (let k = 0; k < 36; k++) {
    const x1 = (k * 97) % 512;
    const y1 = (k * 163) % 512;
    iCtx.beginPath();
    iCtx.moveTo(x1, y1);
    iCtx.lineTo((x1 + 95) % 512, (y1 + 52) % 512);
    iCtx.lineTo((x1 + 38) % 512, (y1 + 120) % 512);
    iCtx.closePath();
    iCtx.fillStyle = k % 2 === 0 ? 'rgba(255,255,255,0.22)' : 'rgba(14,165,233,0.18)';
    iCtx.fill();
    iCtx.stroke();
  }
  const iceCrystal = finalizeColorTexture(iC, maxAnisotropy);

  // 5. Volcanic Obsidian Basalt with Glowing Magma Fissures
  const [vC, vCtx] = makeCanvas(512, 512);
  vCtx.fillStyle = '#1c1917';
  vCtx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    vCtx.fillStyle = i % 2 === 0 ? 'rgba(68, 64, 60, 0.45)' : 'rgba(12, 10, 9, 0.6)';
    vCtx.fillRect((i * 131) % 512, (i * 211) % 512, 8, 8);
  }
  vCtx.strokeStyle = '#f97316';
  vCtx.lineWidth = 4;
  for (let k = 0; k < 14; k++) {
    const sx = (k * 109) % 512;
    const sy = (k * 179) % 512;
    vCtx.beginPath();
    vCtx.moveTo(sx, sy);
    vCtx.lineTo(sx + 65, sy + 28);
    vCtx.lineTo(sx + 115, sy - 16);
    vCtx.stroke();
    vCtx.strokeStyle = 'rgba(253, 224, 71, 0.75)';
    vCtx.lineWidth = 1.5;
    vCtx.stroke();
    vCtx.strokeStyle = '#ea580c';
    vCtx.lineWidth = 4;
  }
  const volcanicBasalt = finalizeColorTexture(vC, maxAnisotropy);

  // 6. Nebula Fortress Deck (Dark Titanium + Violet/Cyan Conduit Trim)
  const [nC, nCtx] = makeCanvas(256, 256);
  nCtx.fillStyle = '#0f172a';
  nCtx.fillRect(0, 0, 256, 256);
  nCtx.strokeStyle = '#334155';
  nCtx.lineWidth = 3;
  nCtx.strokeRect(4, 4, 248, 248);
  nCtx.strokeStyle = '#a855f7';
  nCtx.lineWidth = 2;
  nCtx.strokeRect(18, 18, 220, 220);
  nCtx.fillStyle = '#38bdf8';
  for (const cx of [34, 222]) {
    for (const cy of [34, 222]) {
      nCtx.beginPath();
      nCtx.arc(cx, cy, 5, 0, Math.PI * 2);
      nCtx.fill();
    }
  }
  const nebulaDeck = finalizeColorTexture(nC, maxAnisotropy);

  // 7. Monkey Temple Climbing Wall Masonry & Moss
  const [csC, csCtx] = makeCanvas(256, 256);
  csCtx.fillStyle = '#57534e';
  csCtx.fillRect(0, 0, 256, 256);
  csCtx.strokeStyle = '#292524';
  csCtx.lineWidth = 4;
  for (let y = 0; y < 256; y += 48) {
    csCtx.beginPath();
    csCtx.moveTo(0, y);
    csCtx.lineTo(256, y);
    csCtx.stroke();
    const off = (y / 48) % 2 === 0 ? 0 : 32;
    for (let x = off; x < 256; x += 64) {
      csCtx.beginPath();
      csCtx.moveTo(x, y);
      csCtx.lineTo(x, y + 48);
      csCtx.stroke();
    }
  }
  csCtx.fillStyle = 'rgba(34, 197, 94, 0.35)';
  for (let i = 0; i < 240; i++) {
    csCtx.fillRect((i * 61) % 256, (i * 97) % 256, 6, 4);
  }
  const climbStone = finalizeColorTexture(csC, maxAnisotropy, 2, 3);

  // 8. Crystal cyber-circuit
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

  // 9. Brushed gold trim
  const [goldC, goldCtx] = makeCanvas(128, 128);
  goldCtx.fillStyle = '#f59e0b';
  goldCtx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 2) {
    goldCtx.fillStyle = y % 4 === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(120,53,15,0.16)';
    goldCtx.fillRect(0, y, 128, 1);
  }
  const goldTrim = finalizeColorTexture(goldC, maxAnisotropy);

  // 10. Tree Bark Texture for realistic background rainforest trunks
  const [barkC, barkCtx] = makeCanvas(128, 256);
  barkCtx.fillStyle = '#5c3a21';
  barkCtx.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 220; i++) {
    barkCtx.fillStyle = i % 2 === 0 ? 'rgba(38, 22, 10, 0.45)' : 'rgba(120, 82, 48, 0.35)';
    barkCtx.fillRect((i * 19) % 128, (i * 37) % 256, 3, 18 + (i % 14));
  }
  const barkTexture = finalizeColorTexture(barkC, maxAnisotropy, 1, 2);

  // 11. Biome Sea Surfaces
  const makeSeaTex = (c1: string, c2: string, waveColor: string, glowColor?: string) => {
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
    if (glowColor) {
      ctx.fillStyle = glowColor;
      for (let i = 0; i < 65; i++) {
        ctx.beginPath();
        ctx.arc((i * 89) % 256, (i * 149) % 256, 2 + (i % 4), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return finalizeColorTexture(c, maxAnisotropy, 18, 18);
  };

  const lagoonSurface = makeSeaTex('#0284c7', '#0d9488', 'rgba(186, 230, 253, 0.4)');
  const sandOceanSurface = makeSeaTex('#d97706', '#9a3412', 'rgba(253, 224, 71, 0.28)');
  const iceSeaSurface = makeSeaTex('#082f49', '#0c4a6e', 'rgba(186, 230, 253, 0.32)');
  const lavaSurface = makeSeaTex('#9a3412', '#450a0a', 'rgba(251, 146, 60, 0.72)', 'rgba(254, 240, 138, 0.65)');
  const nebulaSeaSurface = makeSeaTex('#090d24', '#1e1b4b', 'rgba(168, 85, 247, 0.35)', 'rgba(56, 189, 248, 0.55)');

  // 12. Radial Contact Shadow
  const [shC, shCtx] = makeCanvas(128, 128);
  const shGrad = shCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
  shGrad.addColorStop(0, 'rgba(4, 10, 24, 0.74)');
  shGrad.addColorStop(0.55, 'rgba(4, 10, 24, 0.35)');
  shGrad.addColorStop(1, 'rgba(4, 10, 24, 0)');
  shCtx.fillStyle = shGrad;
  shCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(shC);
  contactShadow.needsUpdate = true;

  // 13. High-Detail Panoramic Sky Domes (2048x1024 painted horizons with atmospheric layering)
  const makePanoramicSky = (drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const [c, ctx] = makeCanvas(2048, 1024);
    drawFn(ctx, 2048, 1024);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  };

  const paintCloudBank = (ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number, tint: string) => {
    ctx.fillStyle = tint;
    const puffs = [
      [0, 0, 76, 26],
      [-55, 6, 48, 20],
      [55, 8, 52, 20],
      [-24, -12, 42, 22],
      [26, -10, 44, 22],
    ];
    for (const [ox, oy, rx, ry] of puffs) {
      ctx.beginPath();
      ctx.ellipse(cx + ox * scale, cy + oy * scale, rx * scale, ry * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // JUNGLE PANORAMA: Sunbeams, layered cumulus clouds, misty alpine rainforest peaks, waterfalls
  const skyJungle = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#0369a1');
    g.addColorStop(0.35, '#38bdf8');
    g.addColorStop(0.62, '#bae6fd');
    g.addColorStop(0.75, '#dcfce7');
    g.addColorStop(1, '#14532d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Sun + soft atmospheric corona
    const sunG = ctx.createRadialGradient(1520, 240, 24, 1520, 240, 320);
    sunG.addColorStop(0, 'rgba(255, 251, 235, 0.98)');
    sunG.addColorStop(0.22, 'rgba(254, 240, 138, 0.55)');
    sunG.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = sunG;
    ctx.fillRect(1150, 0, 720, 580);

    // Volumetric cloud strata
    for (let i = 0; i < 16; i++) {
      paintCloudBank(ctx, (i * 157 + 80) % w, 240 + (i % 4) * 58, 0.8 + (i % 3) * 0.35, 'rgba(255, 255, 255, 0.62)');
    }

    // Far misty blue-green mountain range
    ctx.fillStyle = '#0f766e';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 24) {
      const y = 595 + Math.sin(x * 0.0065) * 65 + Math.cos(x * 0.017) * 32 + Math.sin(x * 0.04) * 10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Horizon mist band
    const mist = ctx.createLinearGradient(0, 560, 0, 740);
    mist.addColorStop(0, 'rgba(220, 252, 231, 0)');
    mist.addColorStop(0.5, 'rgba(220, 252, 231, 0.42)');
    mist.addColorStop(1, 'rgba(220, 252, 231, 0)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, 560, w, 180);

    // Closer emerald jungle canopy ridges
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 20) {
      const y = 690 + Math.sin(x * 0.011 + 1.2) * 44 + Math.cos(x * 0.032) * 18;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });

  // DESERT PANORAMA: Golden twilight sun, stratified sandstone canyons, distant stepped pyramids & windswept dunes
  const skyDesert = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1e1b4b');
    g.addColorStop(0.28, '#7c2d12');
    g.addColorStop(0.55, '#ea580c');
    g.addColorStop(0.76, '#fdba74');
    g.addColorStop(1, '#9a3412');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const sunG = ctx.createRadialGradient(1024, 460, 42, 1024, 460, 340);
    sunG.addColorStop(0, '#fef9c3');
    sunG.addColorStop(0.32, 'rgba(251, 191, 36, 0.72)');
    sunG.addColorStop(1, 'rgba(249, 115, 22, 0)');
    ctx.fillStyle = sunG;
    ctx.fillRect(640, 120, 768, 680);

    for (let i = 0; i < 12; i++) {
      paintCloudBank(ctx, (i * 193) % w, 300 + (i % 3) * 52, 0.9 + (i % 2) * 0.3, 'rgba(254, 215, 170, 0.25)');
    }

    // Distant sandstone plateaus & pyramids
    ctx.fillStyle = '#7c2d12';
    const pyramids = [
      [340, 670, 320, 210],
      [640, 680, 220, 145],
      [1460, 665, 360, 230],
      [1820, 685, 240, 150],
    ];
    for (const [px, py, pw, ph] of pyramids) {
      ctx.beginPath();
      ctx.moveTo(px - pw / 2, py);
      ctx.lineTo(px, py - ph);
      ctx.lineTo(px + pw / 2, py);
      ctx.closePath();
      ctx.fill();
    }

    // Layered rolling dunes with sunlit crests
    ctx.fillStyle = '#9a3412';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 24) {
      ctx.lineTo(x, 650 + Math.sin(x * 0.006) * 52 + Math.cos(x * 0.015) * 20);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 24) {
      ctx.lineTo(x, 735 + Math.cos(x * 0.0085) * 40);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });

  // ICE PANORAMA: Starry polar cosmos, glowing aurora curtains, snow-capped alpine peaks
  const skyIce = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#020617');
    g.addColorStop(0.42, '#0c4a6e');
    g.addColorStop(0.72, '#38bdf8');
    g.addColorStop(1, '#bae6fd');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    for (let i = 0; i < 320; i++) {
      ctx.fillRect((i * 193) % w, (i * 89) % 480, (i % 3) + 1, (i % 3) + 1);
    }

    const auroraG = ctx.createLinearGradient(0, 150, 0, 480);
    auroraG.addColorStop(0, 'rgba(52, 211, 153, 0)');
    auroraG.addColorStop(0.45, 'rgba(45, 212, 191, 0.52)');
    auroraG.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = auroraG;
    ctx.beginPath();
    ctx.moveTo(0, 410);
    for (let x = 0; x <= w; x += 24) {
      ctx.lineTo(x, 290 + Math.sin(x * 0.008) * 65 + Math.cos(x * 0.019) * 28);
    }
    ctx.lineTo(w, 500);
    for (let x = w; x >= 0; x -= 24) {
      ctx.lineTo(x, 420 + Math.cos(x * 0.009) * 55);
    }
    ctx.closePath();
    ctx.fill();

    // Jagged Alpine Glacier Ridges
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 32) {
      const peak = Math.sin(x * 0.015) * 60 + ((x % 128 === 0) ? -75 : 15);
      ctx.lineTo(x, 650 + peak);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 28) {
      const peak = Math.cos(x * 0.019) * 42 + ((x % 112 === 0) ? -48 : 10);
      ctx.lineTo(x, 730 + peak);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });

  // VOLCANIC PANORAMA: Ash twilight sky, glowing volcano caldera horizon, ember haze & basalt silhouettes
  const skyVolcanic = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#09090b');
    g.addColorStop(0.35, '#450a0a');
    g.addColorStop(0.68, '#b91c1c');
    g.addColorStop(0.86, '#f97316');
    g.addColorStop(1, '#7c2d12');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Rising ember sparks
    for (let i = 0; i < 240; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(253, 224, 71, 0.7)' : 'rgba(251, 146, 60, 0.65)';
      ctx.fillRect((i * 151) % w, 240 + ((i * 97) % 520), 2 + (i % 3), 2 + (i % 3));
    }

    for (let i = 0; i < 14; i++) {
      paintCloudBank(ctx, (i * 163) % w, 280 + (i % 3) * 65, 1.1, 'rgba(28, 25, 23, 0.55)');
    }

    // Volcanic calderas & glowing lava plumes on horizon
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 32) {
      const caldera = (x % 512 === 256) ? -145 : (x % 256 === 128) ? -85 : Math.sin(x * 0.01) * 35;
      ctx.lineTo(x, 680 + caldera);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });

  // NEBULA PANORAMA: Deep cosmos, glowing magenta/cyan nebula clouds, ringed gas giant planet & asteroid belt
  const skyNebula = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#020617');
    g.addColorStop(0.5, '#1e1b4b');
    g.addColorStop(0.82, '#312e81');
    g.addColorStop(1, '#090d24');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Nebula cloud washes
    const neb1 = ctx.createRadialGradient(640, 360, 20, 640, 360, 420);
    neb1.addColorStop(0, 'rgba(168, 85, 247, 0.42)');
    neb1.addColorStop(0.5, 'rgba(56, 189, 248, 0.2)');
    neb1.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = neb1;
    ctx.fillRect(180, 0, 920, 800);

    const neb2 = ctx.createRadialGradient(1560, 420, 20, 1560, 420, 380);
    neb2.addColorStop(0, 'rgba(56, 189, 248, 0.36)');
    neb2.addColorStop(0.6, 'rgba(236, 72, 153, 0.16)');
    neb2.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = neb2;
    ctx.fillRect(1140, 40, 860, 780);

    // Rich starfield
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = i % 5 === 0 ? '#bae6fd' : i % 7 === 0 ? '#f5d0fe' : '#ffffff';
      const s = (i % 4 === 0) ? 3 : 1.5;
      ctx.fillRect((i * 197) % w, (i * 113) % 780, s, s);
    }

    // Ringed Gas Giant Planet on horizon
    const px = 1480;
    const py = 410;
    const pGrad = ctx.createLinearGradient(px - 110, py - 110, px + 110, py + 110);
    pGrad.addColorStop(0, '#38bdf8');
    pGrad.addColorStop(0.55, '#4f46e5');
    pGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(px, py, 108, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.ellipse(px, py, 210, 46, -0.22, 0, Math.PI * 2);
    ctx.stroke();
  });

  return {
    techGrid,
    jungleGrass,
    desertSandstone,
    iceCrystal,
    volcanicBasalt,
    nebulaDeck,
    climbStone,
    goldTrim,
    crystalCircuit,
    lagoonSurface,
    sandOceanSurface,
    iceSeaSurface,
    lavaSurface,
    nebulaSeaSurface,
    barkTexture,
    contactShadow,
    skyJungle,
    skyDesert,
    skyIce,
    skyVolcanic,
    skyNebula,
  };
}

export function disposeProceduralTextures(tex: ProceduralTextures) {
  Object.values(tex).forEach((t) => {
    if (t && typeof t.dispose === 'function') {
      t.dispose();
    }
  });
}
