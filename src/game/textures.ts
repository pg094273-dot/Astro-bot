import * as THREE from 'three';

export interface ProceduralTextures {
  techGrid: THREE.CanvasTexture;
  jungleGrass: THREE.CanvasTexture;
  jungleSide: THREE.CanvasTexture;
  jungleDirt: THREE.CanvasTexture;
  grassBump: THREE.CanvasTexture;
  jungleSideBump: THREE.CanvasTexture;
  desertSandstone: THREE.CanvasTexture;
  desertSide: THREE.CanvasTexture;
  desertDirt: THREE.CanvasTexture;
  sandBump: THREE.CanvasTexture;
  stoneBump: THREE.CanvasTexture;
  iceCrystal: THREE.CanvasTexture;
  iceSide: THREE.CanvasTexture;
  iceBump: THREE.CanvasTexture;
  templeTop: THREE.CanvasTexture;
  templeSide: THREE.CanvasTexture;
  templeFloorSurface: THREE.CanvasTexture;
  volcanicBasalt: THREE.CanvasTexture;
  volcanicSide: THREE.CanvasTexture;
  basaltBump: THREE.CanvasTexture;
  volcanicEmissive: THREE.CanvasTexture;
  volcanicSideEmissive: THREE.CanvasTexture;
  lavaEmissive: THREE.CanvasTexture;
  nebulaDeck: THREE.CanvasTexture;
  nebulaSide: THREE.CanvasTexture;
  nebulaBump: THREE.CanvasTexture;
  nebulaSeaEmissive: THREE.CanvasTexture;
  climbStone: THREE.CanvasTexture;
  goldTrim: THREE.CanvasTexture;
  crystalCircuit: THREE.CanvasTexture;
  lagoonSurface: THREE.CanvasTexture;
  waterfallSurface: THREE.CanvasTexture;
  waterBump: THREE.CanvasTexture;
  sandOceanSurface: THREE.CanvasTexture;
  iceSeaSurface: THREE.CanvasTexture;
  lavaSurface: THREE.CanvasTexture;
  nebulaSeaSurface: THREE.CanvasTexture;
  barkTexture: THREE.CanvasTexture;
  barkBump: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  skyJungle: THREE.CanvasTexture;
  skyTemple: THREE.CanvasTexture;
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

function finalizeDataTexture(
  canvas: HTMLCanvasElement,
  anisotropy: number,
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.NoColorSpace;
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

  // 2. Realistic Botanical Jungle Turf + Mossy Loam Cross-Section + PBR Bump Maps
  const [jC, jCtx] = makeCanvas(512, 512);
  const [gbC, gbCtx] = makeCanvas(512, 512);
  const jGrad = jCtx.createRadialGradient(256, 256, 30, 256, 256, 360);
  jGrad.addColorStop(0, '#5a9e2a');
  jGrad.addColorStop(0.55, '#3b7a1c');
  jGrad.addColorStop(1, '#235213');
  jCtx.fillStyle = jGrad;
  jCtx.fillRect(0, 0, 512, 512);
  gbCtx.fillStyle = '#707070';
  gbCtx.fillRect(0, 0, 512, 512);

  // Dappled soil micro-mottling & dense fine botanical grass blades
  for (let i = 0; i < 3200; i++) {
    const gx = (i * 173 + 29) % 512;
    const gy = (i * 313 + 71) % 512;
    const len = 5 + (i % 8);
    const tilt = ((i % 9) - 4) * 0.14;
    jCtx.strokeStyle =
      i % 5 === 0
        ? 'rgba(132, 204, 48, 0.42)'
        : i % 5 === 1
          ? 'rgba(42, 98, 22, 0.55)'
          : i % 5 === 2
            ? 'rgba(92, 156, 40, 0.48)'
            : i % 5 === 3
              ? 'rgba(26, 66, 16, 0.52)'
              : 'rgba(110, 82, 42, 0.24)';
    jCtx.lineWidth = 1.6;
    jCtx.beginPath();
    jCtx.moveTo(gx, gy);
    jCtx.lineTo(gx + tilt * len, gy - len);
    jCtx.stroke();

    const bShade = i % 3 === 0 ? 210 : i % 3 === 1 ? 150 : 60;
    gbCtx.strokeStyle = `rgb(${bShade},${bShade},${bShade})`;
    gbCtx.lineWidth = 1.6;
    gbCtx.beginPath();
    gbCtx.moveTo(gx, gy);
    gbCtx.lineTo(gx + tilt * len, gy - len);
    gbCtx.stroke();
  }
  const jungleGrass = finalizeColorTexture(jC, maxAnisotropy);
  const grassBump = finalizeDataTexture(gbC, maxAnisotropy);

  // Realistic overhanging mossy turf lip + rocky clay/root cliff cross-section
  const [jsC, jsCtx] = makeCanvas(512, 256);
  const [jsbC, jsbCtx] = makeCanvas(512, 256);
  const soilG = jsCtx.createLinearGradient(0, 48, 0, 256);
  soilG.addColorStop(0, '#5a3920');
  soilG.addColorStop(0.45, '#472c18');
  soilG.addColorStop(1, '#2b1a0d');
  jsCtx.fillStyle = soilG;
  jsCtx.fillRect(0, 0, 512, 256);
  jsbCtx.fillStyle = '#5a5a5a';
  jsbCtx.fillRect(0, 0, 512, 256);

  // Embedded sedimentary stone pebbles, soil grit & root tendrils
  for (let i = 0; i < 480; i++) {
    const px = (i * 137 + 19) % 512;
    const py = 66 + ((i * 89) % 184);
    const rw = 4 + (i % 10);
    const rh = 2 + (i % 5);
    jsCtx.fillStyle =
      i % 4 === 0
        ? 'rgba(120, 113, 108, 0.45)'
        : i % 4 === 1
          ? 'rgba(38, 22, 10, 0.58)'
          : i % 4 === 2
            ? 'rgba(138, 92, 52, 0.42)'
            : 'rgba(68, 92, 34, 0.28)';
    jsCtx.beginPath();
    jsCtx.ellipse(px, py, rw, rh, (i % 5) * 0.25, 0, Math.PI * 2);
    jsCtx.fill();

    const bv = i % 2 === 0 ? 175 : 42;
    jsbCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    jsbCtx.beginPath();
    jsbCtx.ellipse(px, py, rw, rh, (i % 5) * 0.25, 0, Math.PI * 2);
    jsbCtx.fill();
  }

  // Deep ambient shadow occlusion beneath overhanging grass roots
  const occlG = jsCtx.createLinearGradient(0, 44, 0, 108);
  occlG.addColorStop(0, 'rgba(12, 24, 6, 0.72)');
  occlG.addColorStop(1, 'rgba(12, 24, 6, 0)');
  jsCtx.fillStyle = occlG;
  jsCtx.fillRect(0, 44, 512, 68);

  // Textured mossy turf overhang lip
  const turfSideG = jsCtx.createLinearGradient(0, 0, 0, 76);
  turfSideG.addColorStop(0, '#5a9e2a');
  turfSideG.addColorStop(0.55, '#3b7a1c');
  turfSideG.addColorStop(1, '#214d12');
  jsCtx.fillStyle = turfSideG;
  jsbCtx.fillStyle = '#dcdcdc';
  for (const ctxTarget of [jsCtx, jsbCtx]) {
    ctxTarget.beginPath();
    ctxTarget.moveTo(0, 0);
    ctxTarget.lineTo(512, 0);
    ctxTarget.lineTo(512, 62);
    for (let x = 512; x >= 0; x -= 8) {
      const drop = 58 + Math.sin(x * 0.085) * 11 + Math.cos(x * 0.24) * 6 + Math.sin(x * 0.55) * 3;
      ctxTarget.lineTo(x, drop);
    }
    ctxTarget.closePath();
    ctxTarget.fill();
  }
  const jungleSide = finalizeColorTexture(jsC, maxAnisotropy, 2, 1);
  const jungleSideBump = finalizeDataTexture(jsbC, maxAnisotropy, 2, 1);

  const [jdC, jdCtx] = makeCanvas(256, 256);
  jdCtx.fillStyle = '#3b2413';
  jdCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 240; i++) {
    jdCtx.fillStyle = i % 2 === 0 ? 'rgba(24, 14, 6, 0.5)' : 'rgba(92, 62, 38, 0.36)';
    jdCtx.fillRect((i * 47) % 256, (i * 83) % 256, 4 + (i % 5), 3 + (i % 4));
  }
  const jungleDirt = finalizeColorTexture(jdC, maxAnisotropy);

  // 3. Photorealistic Wind-Rippled Desert Sand + Stratified Canyon Sandstone + PBR Bump Maps
  const [dC, dCtx] = makeCanvas(512, 512);
  const [sbC, sbCtx] = makeCanvas(512, 512);
  const sandGrad = dCtx.createLinearGradient(0, 0, 512, 512);
  sandGrad.addColorStop(0, '#e3ad6d');
  sandGrad.addColorStop(0.5, '#d19553');
  sandGrad.addColorStop(1, '#ba7c3d');
  dCtx.fillStyle = sandGrad;
  dCtx.fillRect(0, 0, 512, 512);
  sbCtx.fillStyle = '#808080';
  sbCtx.fillRect(0, 0, 512, 512);

  // Natural barchan wind-ripple ridges across sand
  for (let y = 0; y < 512; y += 16) {
    dCtx.strokeStyle = 'rgba(253, 224, 178, 0.34)';
    dCtx.lineWidth = 4;
    sbCtx.strokeStyle = '#d8d8d8';
    sbCtx.lineWidth = 5;
    for (const ctxTarget of [dCtx, sbCtx]) {
      ctxTarget.beginPath();
      for (let x = 0; x <= 512; x += 16) {
        const wy = y + Math.sin(x * 0.036 + y * 0.08) * 5;
        if (x === 0) ctxTarget.moveTo(x, wy);
        else ctxTarget.lineTo(x, wy);
      }
      ctxTarget.stroke();
    }
    dCtx.strokeStyle = 'rgba(138, 76, 28, 0.25)';
    dCtx.lineWidth = 3;
    sbCtx.strokeStyle = '#424242';
    sbCtx.lineWidth = 4;
    for (const ctxTarget of [dCtx, sbCtx]) {
      ctxTarget.beginPath();
      for (let x = 0; x <= 512; x += 16) {
        const wy = y + 5 + Math.sin(x * 0.036 + y * 0.08) * 5;
        if (x === 0) ctxTarget.moveTo(x, wy);
        else ctxTarget.lineTo(x, wy);
      }
      ctxTarget.stroke();
    }
  }
  // Fine mineral quartz/sand grain sparkle & grit
  for (let i = 0; i < 2600; i++) {
    const sx = (i * 197 + 13) % 512;
    const sy = (i * 263 + 41) % 512;
    dCtx.fillStyle = i % 3 === 0 ? 'rgba(255, 245, 224, 0.25)' : 'rgba(112, 58, 20, 0.22)';
    dCtx.fillRect(sx, sy, 2, 2);
    const sv = i % 2 === 0 ? 195 : 70;
    sbCtx.fillStyle = `rgb(${sv},${sv},${sv})`;
    sbCtx.fillRect(sx, sy, 2, 2);
  }
  const desertSandstone = finalizeColorTexture(dC, maxAnisotropy);
  const sandBump = finalizeDataTexture(sbC, maxAnisotropy);

  // Side cross-section: wind-drifted sand cap over stratified sandstone & gravelly dark earth
  const [dsC, dsCtx] = makeCanvas(512, 256);
  const [stbC, stbCtx] = makeCanvas(512, 256);
  const earthG = dsCtx.createLinearGradient(0, 48, 0, 256);
  earthG.addColorStop(0, '#78441c');
  earthG.addColorStop(0.35, '#593012');
  earthG.addColorStop(1, '#3b1e0a');
  dsCtx.fillStyle = earthG;
  dsCtx.fillRect(0, 0, 512, 256);
  stbCtx.fillStyle = '#686868';
  stbCtx.fillRect(0, 0, 512, 256);

  // Sedimentary strata bands & embedded gravel rocks
  for (let y = 76; y < 256; y += 22) {
    dsCtx.strokeStyle = y % 44 === 0 ? 'rgba(154, 96, 48, 0.35)' : 'rgba(42, 18, 4, 0.42)';
    dsCtx.lineWidth = 4;
    stbCtx.strokeStyle = y % 44 === 0 ? '#a8a8a8' : '#3a3a3a';
    stbCtx.lineWidth = 4;
    for (const ctxTarget of [dsCtx, stbCtx]) {
      ctxTarget.beginPath();
      for (let x = 0; x <= 512; x += 24) {
        const sy = y + Math.sin(x * 0.028 + y) * 4;
        if (x === 0) ctxTarget.moveTo(x, sy);
        else ctxTarget.lineTo(x, sy);
      }
      ctxTarget.stroke();
    }
  }
  for (let i = 0; i < 360; i++) {
    const px = (i * 113 + 17) % 512;
    const py = 68 + ((i * 79) % 180);
    const rw = 3 + (i % 6);
    const rh = 2 + (i % 4);
    dsCtx.fillStyle = i % 3 === 0 ? 'rgba(34, 15, 2, 0.65)' : 'rgba(168, 114, 62, 0.42)';
    dsCtx.beginPath();
    dsCtx.ellipse(px, py, rw, rh, 0.2, 0, Math.PI * 2);
    dsCtx.fill();
    const bv = i % 2 === 0 ? 185 : 38;
    stbCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    stbCtx.beginPath();
    stbCtx.ellipse(px, py, rw, rh, 0.2, 0, Math.PI * 2);
    stbCtx.fill();
  }
  const dsOccl = dsCtx.createLinearGradient(0, 48, 0, 96);
  dsOccl.addColorStop(0, 'rgba(28, 12, 2, 0.6)');
  dsOccl.addColorStop(1, 'rgba(28, 12, 2, 0)');
  dsCtx.fillStyle = dsOccl;
  dsCtx.fillRect(0, 48, 512, 48);

  const crustG = dsCtx.createLinearGradient(0, 0, 0, 66);
  crustG.addColorStop(0, '#e5b071');
  crustG.addColorStop(0.6, '#cf8f4e');
  crustG.addColorStop(1, '#a9682e');
  dsCtx.fillStyle = crustG;
  stbCtx.fillStyle = '#d4d4d4';
  for (const ctxTarget of [dsCtx, stbCtx]) {
    ctxTarget.beginPath();
    ctxTarget.moveTo(0, 0);
    ctxTarget.lineTo(512, 0);
    ctxTarget.lineTo(512, 58);
    for (let x = 512; x >= 0; x -= 12) {
      const wave = 56 + Math.sin(x * 0.048) * 7 + Math.cos(x * 0.14) * 3;
      ctxTarget.lineTo(x, wave);
    }
    ctxTarget.closePath();
    ctxTarget.fill();
  }
  const desertSide = finalizeColorTexture(dsC, maxAnisotropy, 2, 1);
  const stoneBump = finalizeDataTexture(stbC, maxAnisotropy, 2, 1);

  const [ddC, ddCtx] = makeCanvas(256, 256);
  ddCtx.fillStyle = '#422209';
  ddCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 160; i++) {
    ddCtx.fillStyle = i % 2 === 0 ? 'rgba(24, 10, 2, 0.55)' : 'rgba(104, 62, 24, 0.36)';
    ddCtx.fillRect((i * 53) % 256, (i * 89) % 256, 4 + (i % 4), 4);
  }
  const desertDirt = finalizeColorTexture(ddC, maxAnisotropy);

  // 4. Realistic Alaskan Glacial Snow & Fractured Blue Ice + Cross-Section Side + Bump Map
  const [iC, iCtx] = makeCanvas(512, 512);
  const [ibC, ibCtx] = makeCanvas(512, 512);
  const iceGrad = iCtx.createLinearGradient(0, 0, 512, 512);
  iceGrad.addColorStop(0, '#f4fbff');
  iceGrad.addColorStop(0.5, '#cdecfc');
  iceGrad.addColorStop(1, '#8bd3f5');
  iCtx.fillStyle = iceGrad;
  iCtx.fillRect(0, 0, 512, 512);
  ibCtx.fillStyle = '#8a8a8a';
  ibCtx.fillRect(0, 0, 512, 512);

  // Crisp wind-drifted snow sastrugi & crystalline ice facets
  for (let i = 0; i < 1800; i++) {
    const sx = (i * 181 + 17) % 512;
    const sy = (i * 251 + 43) % 512;
    iCtx.fillStyle = i % 3 === 0 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(56, 152, 212, 0.16)';
    iCtx.fillRect(sx, sy, 4 + (i % 6), 2);
    const iv = i % 2 === 0 ? 190 : 75;
    ibCtx.fillStyle = `rgb(${iv},${iv},${iv})`;
    ibCtx.fillRect(sx, sy, 4 + (i % 6), 2);
  }
  for (let k = 0; k < 40; k++) {
    const x1 = (k * 97) % 512;
    const y1 = (k * 163) % 512;
    const x2 = (x1 + 88) % 512;
    const y2 = (y1 + 48) % 512;
    const x3 = (x1 + 34) % 512;
    const y3 = (y1 + 114) % 512;
    for (const target of [iCtx, ibCtx]) {
      target.beginPath();
      target.moveTo(x1, y1);
      target.lineTo(x2, y2);
      target.lineTo(x3, y3);
      target.closePath();
      if (target === iCtx) {
        target.fillStyle = k % 2 === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(14,116,174,0.16)';
        target.strokeStyle = 'rgba(255, 255, 255, 0.72)';
      } else {
        target.fillStyle = k % 2 === 0 ? 'rgba(220,220,220,0.35)' : 'rgba(70,70,70,0.35)';
        target.strokeStyle = '#323232';
      }
      target.lineWidth = 2.2;
      target.fill();
      target.stroke();
    }
  }
  const iceCrystal = finalizeColorTexture(iC, maxAnisotropy);
  const iceBump = finalizeDataTexture(ibC, maxAnisotropy);

  // Side cross-section: wind-packed white snow cap overhanging deep cobalt/turquoise glacier cliff & arctic slate
  const [isC, isCtx] = makeCanvas(512, 256);
  const iceWallG = isCtx.createLinearGradient(0, 44, 0, 256);
  iceWallG.addColorStop(0, '#38a3dc');
  iceWallG.addColorStop(0.5, '#136da6');
  iceWallG.addColorStop(1, '#183754');
  isCtx.fillStyle = iceWallG;
  isCtx.fillRect(0, 0, 512, 256);

  for (let i = 0; i < 42; i++) {
    const fx = (i * 83) % 512;
    const fy = 58 + ((i * 59) % 180);
    isCtx.fillStyle = i % 3 === 0 ? 'rgba(186, 230, 253, 0.28)' : i % 3 === 1 ? 'rgba(12, 46, 78, 0.42)' : 'rgba(56, 189, 248, 0.25)';
    isCtx.beginPath();
    isCtx.moveTo(fx, fy);
    isCtx.lineTo(fx + 28 + (i % 24), fy + 8);
    isCtx.lineTo(fx + 14, fy + 44 + (i % 28));
    isCtx.closePath();
    isCtx.fill();
  }
  const snowLipG = isCtx.createLinearGradient(0, 0, 0, 68);
  snowLipG.addColorStop(0, '#ffffff');
  snowLipG.addColorStop(0.65, '#e2f3fd');
  snowLipG.addColorStop(1, '#9fd6f7');
  isCtx.fillStyle = snowLipG;
  isCtx.beginPath();
  isCtx.moveTo(0, 0);
  isCtx.lineTo(512, 0);
  isCtx.lineTo(512, 58);
  for (let x = 512; x >= 0; x -= 12) {
    isCtx.lineTo(x, 54 + Math.sin(x * 0.055) * 9 + Math.cos(x * 0.16) * 4);
  }
  isCtx.closePath();
  isCtx.fill();
  const iceSide = finalizeColorTexture(isC, maxAnisotropy, 2, 1);

  // 4B. Ancient Aztec/Maya Weathered Sandstone & Mossy Jungle Temple Masonry
  const [ttC, ttCtx] = makeCanvas(512, 512);
  const ttG = ttCtx.createLinearGradient(0, 0, 512, 512);
  ttG.addColorStop(0, '#d8b783');
  ttG.addColorStop(0.5, '#c19a62');
  ttG.addColorStop(1, '#a67f48');
  ttCtx.fillStyle = ttG;
  ttCtx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 64) {
    ttCtx.strokeStyle = 'rgba(72, 49, 22, 0.55)';
    ttCtx.lineWidth = 4;
    ttCtx.beginPath();
    ttCtx.moveTo(0, y);
    ttCtx.lineTo(512, y);
    ttCtx.stroke();
    const off = (y / 64) % 2 === 0 ? 0 : 64;
    for (let x = off; x < 512; x += 128) {
      ttCtx.beginPath();
      ttCtx.moveTo(x, y);
      ttCtx.lineTo(x, y + 64);
      ttCtx.stroke();
    }
  }
  for (let i = 0; i < 1400; i++) {
    const px = (i * 157 + 23) % 512;
    const py = (i * 223 + 31) % 512;
    ttCtx.fillStyle =
      i % 6 === 0
        ? 'rgba(74, 128, 42, 0.34)'
        : i % 3 === 0
          ? 'rgba(244, 226, 184, 0.28)'
          : 'rgba(92, 62, 28, 0.24)';
    ttCtx.fillRect(px, py, 4 + (i % 6), 3 + (i % 5));
  }
  const templeTop = finalizeColorTexture(ttC, maxAnisotropy);

  const [tsC, tsCtx] = makeCanvas(512, 256);
  const tsG = tsCtx.createLinearGradient(0, 0, 0, 256);
  tsG.addColorStop(0, '#cca56d');
  tsG.addColorStop(0.55, '#9d7440');
  tsG.addColorStop(1, '#684a22');
  tsCtx.fillStyle = tsG;
  tsCtx.fillRect(0, 0, 512, 256);
  for (let y = 40; y < 256; y += 52) {
    tsCtx.strokeStyle = 'rgba(46, 28, 10, 0.65)';
    tsCtx.lineWidth = 4;
    tsCtx.beginPath();
    tsCtx.moveTo(0, y);
    tsCtx.lineTo(512, y);
    tsCtx.stroke();
    const off = (y / 52) % 2 === 0 ? 0 : 48;
    for (let x = off; x < 512; x += 96) {
      tsCtx.beginPath();
      tsCtx.moveTo(x, y);
      tsCtx.lineTo(x, y + 52);
      tsCtx.stroke();
    }
  }
  // Overgrown emerald jungle moss & creeping roots over temple stone lip
  tsCtx.fillStyle = '#488a28';
  tsCtx.beginPath();
  tsCtx.moveTo(0, 0);
  tsCtx.lineTo(512, 0);
  tsCtx.lineTo(512, 34);
  for (let x = 512; x >= 0; x -= 10) {
    tsCtx.lineTo(x, 30 + Math.sin(x * 0.08) * 10 + Math.cos(x * 0.22) * 5);
  }
  tsCtx.closePath();
  tsCtx.fill();
  const templeSide = finalizeColorTexture(tsC, maxAnisotropy, 2, 1);

  // 5. Realistic Volcanic Obsidian Basalt + Glowing Magma Fissures + Emissive & Bump Maps
  const [vC, vCtx] = makeCanvas(512, 512);
  const [veC, veCtx] = makeCanvas(512, 512);
  const [vbC, vbCtx] = makeCanvas(512, 512);
  vCtx.fillStyle = '#1b1416';
  vCtx.fillRect(0, 0, 512, 512);
  veCtx.fillStyle = '#000000';
  veCtx.fillRect(0, 0, 512, 512);
  vbCtx.fillStyle = '#7c7c7c';
  vbCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 1100; i++) {
    const rx = (i * 131 + 19) % 512;
    const ry = (i * 211 + 37) % 512;
    const sz = 4 + (i % 9);
    vCtx.fillStyle = i % 3 === 0 ? 'rgba(64, 42, 46, 0.5)' : i % 3 === 1 ? 'rgba(18, 11, 13, 0.65)' : 'rgba(92, 46, 36, 0.28)';
    vCtx.fillRect(rx, ry, sz, sz);
    const bv = i % 2 === 0 ? 185 : 38;
    vbCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    vbCtx.fillRect(rx, ry, sz, sz);
  }
  for (let k = 0; k < 18; k++) {
    const sx = (k * 109 + 14) % 512;
    const sy = (k * 179 + 22) % 512;
    const mx = sx + 54 + (k % 3) * 12;
    const my = sy + 26 - (k % 2) * 18;
    const ex = sx + 110;
    const ey = sy - 14 + (k % 3) * 16;

    for (const target of [vCtx, veCtx]) {
      target.strokeStyle = '#dc2626';
      target.lineWidth = 7;
      target.beginPath();
      target.moveTo(sx, sy);
      target.lineTo(mx, my);
      target.lineTo(ex, ey);
      target.stroke();

      target.strokeStyle = '#f97316';
      target.lineWidth = 4;
      target.stroke();

      target.strokeStyle = '#fef08a';
      target.lineWidth = 1.8;
      target.stroke();
    }
    vbCtx.strokeStyle = '#1e1e1e';
    vbCtx.lineWidth = 6;
    vbCtx.beginPath();
    vbCtx.moveTo(sx, sy);
    vbCtx.lineTo(mx, my);
    vbCtx.lineTo(ex, ey);
    vbCtx.stroke();
  }
  const volcanicBasalt = finalizeColorTexture(vC, maxAnisotropy);
  const volcanicEmissive = finalizeColorTexture(veC, maxAnisotropy);
  const basaltBump = finalizeDataTexture(vbC, maxAnisotropy);

  // Volcanic Cliff Side: dark faceted obsidian strata with vertical glowing lava fissures
  const [vsC, vsCtx] = makeCanvas(512, 256);
  const [vseC, vseCtx] = makeCanvas(512, 256);
  const vsG = vsCtx.createLinearGradient(0, 0, 0, 256);
  vsG.addColorStop(0, '#291c20');
  vsG.addColorStop(0.55, '#191114');
  vsG.addColorStop(1, '#3b120e');
  vsCtx.fillStyle = vsG;
  vsCtx.fillRect(0, 0, 512, 256);
  vseCtx.fillStyle = '#000000';
  vseCtx.fillRect(0, 0, 512, 256);

  // Hot glowing magma rim under-edge + vertical volcanic fissures
  const hotRimG = vseCtx.createLinearGradient(0, 180, 0, 256);
  hotRimG.addColorStop(0, 'rgba(234, 88, 12, 0)');
  hotRimG.addColorStop(1, 'rgba(249, 115, 22, 0.72)');
  vseCtx.fillStyle = hotRimG;
  vseCtx.fillRect(0, 180, 512, 76);

  for (let i = 0; i < 12; i++) {
    const fx = (i * 43 + 18) % 512;
    for (const target of [vsCtx, vseCtx]) {
      target.strokeStyle = '#ea580c';
      target.lineWidth = 6;
      target.beginPath();
      target.moveTo(fx, 0);
      target.lineTo(fx + ((i % 2 === 0 ? 1 : -1) * 16), 95);
      target.lineTo(fx + ((i % 3) - 1) * 14, 185);
      target.lineTo(fx + 6, 256);
      target.stroke();
      target.strokeStyle = '#fde047';
      target.lineWidth = 2;
      target.stroke();
    }
  }
  const volcanicSide = finalizeColorTexture(vsC, maxAnisotropy, 2, 1);
  const volcanicSideEmissive = finalizeColorTexture(vseC, maxAnisotropy, 2, 1);

  // 6. Realistic Nebula Citadel Deck & Alien Violet Basalt Cliff Side
  const [nC, nCtx] = makeCanvas(256, 256);
  const [nbC, nbCtx] = makeCanvas(256, 256);
  nCtx.fillStyle = '#1d1646';
  nCtx.fillRect(0, 0, 256, 256);
  nbCtx.fillStyle = '#888888';
  nbCtx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 240; i++) {
    const sx = (i * 59) % 256;
    const sy = (i * 97) % 256;
    nCtx.fillStyle = i % 2 === 0 ? 'rgba(99, 102, 241, 0.14)' : 'rgba(15, 23, 42, 0.35)';
    nCtx.fillRect(sx, sy, 6, 4);
    const nv = i % 2 === 0 ? 150 : 60;
    nbCtx.fillStyle = `rgb(${nv},${nv},${nv})`;
    nbCtx.fillRect(sx, sy, 6, 4);
  }
  nCtx.strokeStyle = '#4c3494';
  nCtx.lineWidth = 4;
  nCtx.strokeRect(4, 4, 248, 248);
  nbCtx.strokeStyle = '#303030';
  nbCtx.lineWidth = 4;
  nbCtx.strokeRect(4, 4, 248, 248);

  nCtx.strokeStyle = '#22d3ee';
  nCtx.lineWidth = 2.5;
  nCtx.strokeRect(18, 18, 220, 220);
  nCtx.fillStyle = '#fde047';
  for (const cx of [34, 222]) {
    for (const cy of [34, 222]) {
      nCtx.beginPath();
      nCtx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      nCtx.fill();
    }
  }
  const nebulaDeck = finalizeColorTexture(nC, maxAnisotropy);
  const nebulaBump = finalizeDataTexture(nbC, maxAnisotropy);

  const [nsC, nsCtx] = makeCanvas(512, 256);
  const nsG = nsCtx.createLinearGradient(0, 0, 0, 256);
  nsG.addColorStop(0, '#4f2fa3');
  nsG.addColorStop(0.5, '#341d73');
  nsG.addColorStop(1, '#1e1147');
  nsCtx.fillStyle = nsG;
  nsCtx.fillRect(0, 0, 512, 256);
  for (let y = 32; y < 256; y += 28) {
    nsCtx.strokeStyle = y % 56 === 0 ? 'rgba(94, 234, 212, 0.22)' : 'rgba(17, 9, 44, 0.55)';
    nsCtx.lineWidth = 3;
    nsCtx.beginPath();
    for (let x = 0; x <= 512; x += 24) {
      const sy = y + Math.sin(x * 0.03 + y) * 4;
      if (x === 0) nsCtx.moveTo(x, sy);
      else nsCtx.lineTo(x, sy);
    }
    nsCtx.stroke();
  }
  const nebulaSide = finalizeColorTexture(nsC, maxAnisotropy, 2, 1);

  // 7. Monkey Temple Climbing Wall Masonry & Moss (warm weathered Aztec blocks)
  const [csC, csCtx] = makeCanvas(256, 256);
  csCtx.fillStyle = '#9c784c';
  csCtx.fillRect(0, 0, 256, 256);
  csCtx.strokeStyle = '#47321a';
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
  csCtx.fillStyle = 'rgba(66, 130, 38, 0.42)';
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

  // 10. Realistic Weathered Tropical Hardwood Bark + Deep Fissure Bump Map
  const [barkC, barkCtx] = makeCanvas(256, 256);
  const [bbC, bbCtx] = makeCanvas(256, 256);
  const barkGrad = barkCtx.createLinearGradient(0, 0, 256, 0);
  barkGrad.addColorStop(0, '#4a2614');
  barkGrad.addColorStop(0.5, '#6e3b1f');
  barkGrad.addColorStop(1, '#4a2614');
  barkCtx.fillStyle = barkGrad;
  barkCtx.fillRect(0, 0, 256, 256);
  bbCtx.fillStyle = '#808080';
  bbCtx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 110; i++) {
    const bx = (i * 29) % 256;
    const by = (i * 47) % 256;
    const bh = 28 + (i % 44);
    barkCtx.strokeStyle = i % 3 === 0 ? 'rgba(30, 14, 6, 0.72)' : i % 3 === 1 ? 'rgba(128, 76, 44, 0.48)' : 'rgba(58, 86, 36, 0.35)';
    barkCtx.lineWidth = 2 + (i % 4);
    barkCtx.beginPath();
    barkCtx.moveTo(bx, by);
    barkCtx.bezierCurveTo(bx + ((i % 3) - 1) * 8, by + bh * 0.4, bx - ((i % 3) - 1) * 6, by + bh * 0.7, bx, by + bh);
    barkCtx.stroke();

    const bv = i % 2 === 0 ? 32 : 205;
    bbCtx.strokeStyle = `rgb(${bv},${bv},${bv})`;
    bbCtx.lineWidth = 2 + (i % 4);
    bbCtx.beginPath();
    bbCtx.moveTo(bx, by);
    bbCtx.bezierCurveTo(bx + ((i % 3) - 1) * 8, by + bh * 0.4, bx - ((i % 3) - 1) * 6, by + bh * 0.7, bx, by + bh);
    bbCtx.stroke();
  }
  const barkTexture = finalizeColorTexture(barkC, maxAnisotropy, 1, 2);
  const barkBump = finalizeDataTexture(bbC, maxAnisotropy, 1, 2);

  // 11. Biome Sea Surfaces + Water Caustics/Wave Bump + Waterfall Ribbon
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

  // Water Caustics & Ripple Bump Map
  const [wbC, wbCtx] = makeCanvas(256, 256);
  wbCtx.fillStyle = '#808080';
  wbCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 42; i++) {
    wbCtx.strokeStyle = i % 2 === 0 ? 'rgba(240,240,240,0.45)' : 'rgba(35,35,35,0.45)';
    wbCtx.lineWidth = 4;
    wbCtx.beginPath();
    wbCtx.ellipse((i * 71) % 256, (i * 113) % 256, 18 + (i % 16), 8 + (i % 8), (i % 5) * 0.4, 0, Math.PI * 2);
    wbCtx.stroke();
  }
  const waterBump = finalizeDataTexture(wbC, maxAnisotropy, 18, 18);

  // Realistic Tropical Lagoon Water (deep teal + turquoise caustic shimmer)
  const [lagC, lagCtx] = makeCanvas(256, 256);
  const lagG = lagCtx.createLinearGradient(0, 0, 256, 256);
  lagG.addColorStop(0, '#0284c7');
  lagG.addColorStop(0.5, '#0d9488');
  lagG.addColorStop(1, '#0369a1');
  lagCtx.fillStyle = lagG;
  lagCtx.fillRect(0, 0, 256, 256);
  lagCtx.strokeStyle = 'rgba(165, 243, 252, 0.34)';
  lagCtx.lineWidth = 2.5;
  for (let i = 0; i < 36; i++) {
    lagCtx.beginPath();
    lagCtx.ellipse((i * 67) % 256, (i * 101) % 256, 22 + (i % 14), 10 + (i % 8), (i % 4) * 0.5, 0, Math.PI * 2);
    lagCtx.stroke();
  }
  const lagoonSurface = finalizeColorTexture(lagC, maxAnisotropy, 18, 18);

  // Cascading Waterfall Streaks
  const [wfC, wfCtx] = makeCanvas(128, 256);
  const wfG = wfCtx.createLinearGradient(0, 0, 128, 0);
  wfG.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
  wfG.addColorStop(0.5, 'rgba(186, 230, 253, 0.92)');
  wfG.addColorStop(1, 'rgba(56, 189, 248, 0.5)');
  wfCtx.fillStyle = wfG;
  wfCtx.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 40; i++) {
    wfCtx.fillStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.65)' : 'rgba(14, 165, 233, 0.4)';
    wfCtx.fillRect((i * 17) % 128, (i * 37) % 256, 3 + (i % 4), 38 + (i % 40));
  }
  const waterfallSurface = finalizeColorTexture(wfC, maxAnisotropy, 1, 2);

  const sandOceanSurface = makeSeaTex('#d4954b', '#eab875', 'rgba(254, 243, 199, 0.32)');

  // Lush rainforest floor for Templo del Mono
  const templeFloorSurface = makeSeaTex('#195c3c', '#257348', 'rgba(134, 239, 172, 0.2)', 'rgba(217, 179, 108, 0.22)');

  // Calm mirror-like Alaskan fjord blue water
  const [iceSeaC, iceSeaCtx] = makeCanvas(256, 256);
  const isSeaG = iceSeaCtx.createLinearGradient(0, 0, 256, 256);
  isSeaG.addColorStop(0, '#0d6ca3');
  isSeaG.addColorStop(0.5, '#1e8bc3');
  isSeaG.addColorStop(1, '#09598a');
  iceSeaCtx.fillStyle = isSeaG;
  iceSeaCtx.fillRect(0, 0, 256, 256);
  iceSeaCtx.strokeStyle = 'rgba(224, 247, 255, 0.35)';
  iceSeaCtx.lineWidth = 2;
  for (let y = 14; y < 256; y += 26) {
    iceSeaCtx.beginPath();
    iceSeaCtx.moveTo(0, y);
    iceSeaCtx.lineTo(256, y + Math.sin(y) * 3);
    iceSeaCtx.stroke();
  }
  const iceSeaSurface = finalizeColorTexture(iceSeaC, maxAnisotropy, 16, 16);

  // Blazing molten yellow-orange-red lava river + emissive map
  const [lavaC, lavaCtx] = makeCanvas(256, 256);
  const [lavaEC, lavaECtx] = makeCanvas(256, 256);
  const lavaG = lavaC ? lavaCtx.createLinearGradient(0, 0, 256, 256) : null;
  if (lavaG) {
    lavaG.addColorStop(0, '#ea580c');
    lavaG.addColorStop(0.5, '#f59e0b');
    lavaG.addColorStop(1, '#dc2626');
    lavaCtx.fillStyle = lavaG;
    lavaCtx.fillRect(0, 0, 256, 256);
    lavaECtx.fillStyle = lavaG;
    lavaECtx.fillRect(0, 0, 256, 256);
  }
  for (let i = 0; i < 24; i++) {
    const cx = (i * 61) % 256;
    const cy = (i * 97) % 256;
    lavaCtx.fillStyle = 'rgba(42, 12, 10, 0.65)';
    lavaCtx.beginPath();
    lavaCtx.ellipse(cx, cy, 18 + (i % 14), 7 + (i % 6), (i % 4) * 0.4, 0, Math.PI * 2);
    lavaCtx.fill();

    lavaECtx.fillStyle = 'rgba(20, 4, 2, 0.72)';
    lavaECtx.beginPath();
    lavaECtx.ellipse(cx, cy, 18 + (i % 14), 7 + (i % 6), (i % 4) * 0.4, 0, Math.PI * 2);
    lavaECtx.fill();
  }
  for (const target of [lavaCtx, lavaECtx]) {
    target.strokeStyle = 'rgba(254, 240, 138, 0.85)';
    target.lineWidth = 3.5;
    for (let y = 18; y < 256; y += 36) {
      target.beginPath();
      for (let x = 0; x <= 256; x += 16) {
        const wy = y + Math.sin(x * 0.06 + y * 0.1) * 8;
        if (x === 0) target.moveTo(x, wy);
        else target.lineTo(x, wy);
      }
      target.stroke();
    }
  }
  const lavaSurface = finalizeColorTexture(lavaC, maxAnisotropy, 16, 16);
  const lavaEmissive = finalizeColorTexture(lavaEC, maxAnisotropy, 16, 16);

  // Alien Violet/Indigo Rocky Plain dotted with Glowing Golden-Amber Energy Pools
  const [nebSeaC, nebSeaCtx] = makeCanvas(256, 256);
  const [nebSeaEC, nebSeaECtx] = makeCanvas(256, 256);
  const nebG = nebSeaCtx.createLinearGradient(0, 0, 256, 256);
  nebG.addColorStop(0, '#44248a');
  nebG.addColorStop(0.5, '#341a6e');
  nebG.addColorStop(1, '#542ba3');
  nebSeaCtx.fillStyle = nebG;
  nebSeaCtx.fillRect(0, 0, 256, 256);
  nebSeaECtx.fillStyle = '#080314';
  nebSeaECtx.fillRect(0, 0, 256, 256);

  for (let y = 20; y < 256; y += 28) {
    nebSeaCtx.strokeStyle = 'rgba(139, 92, 246, 0.28)';
    nebSeaCtx.lineWidth = 2.5;
    nebSeaCtx.beginPath();
    for (let x = 0; x <= 256; x += 16) {
      const wy = y + Math.sin(x * 0.05 + y) * 5;
      if (x === 0) nebSeaCtx.moveTo(x, wy);
      else nebSeaCtx.lineTo(x, wy);
    }
    nebSeaCtx.stroke();
  }
  // Glowing golden-amber pools matching image
  for (let i = 0; i < 8; i++) {
    const px = (i * 73 + 28) % 256;
    const py = (i * 109 + 36) % 256;
    const rx = 14 + (i % 3) * 6;
    const ry = 6 + (i % 2) * 3;
    for (const target of [nebSeaCtx, nebSeaECtx]) {
      target.fillStyle = '#f59e0b';
      target.beginPath();
      target.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
      target.fill();
      target.fillStyle = '#fef08a';
      target.beginPath();
      target.ellipse(px, py, rx * 0.62, ry * 0.58, 0, 0, Math.PI * 2);
      target.fill();
    }
  }
  const nebulaSeaSurface = finalizeColorTexture(nebSeaC, maxAnisotropy, 16, 16);
  const nebulaSeaEmissive = finalizeColorTexture(nebSeaEC, maxAnisotropy, 16, 16);

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

  // JUNGLE PANORAMA: Natural atmospheric sky, volumetric sunlit clouds, misty alpine peaks & rainforest canopy
  const skyJungle = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1e66b0');
    g.addColorStop(0.32, '#5aa9e6');
    g.addColorStop(0.58, '#bde2f7');
    g.addColorStop(0.75, '#dcf0e8');
    g.addColorStop(1, '#1a4224');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const sunG = ctx.createRadialGradient(1480, 200, 18, 1480, 200, 340);
    sunG.addColorStop(0, 'rgba(255, 253, 240, 0.98)');
    sunG.addColorStop(0.24, 'rgba(254, 245, 200, 0.5)');
    sunG.addColorStop(1, 'rgba(254, 245, 200, 0)');
    ctx.fillStyle = sunG;
    ctx.fillRect(1120, 0, 720, 560);

    // Volumetric sunlit cumulus clouds with soft shaded undersides
    for (let i = 0; i < 16; i++) {
      const cx = (i * 157 + 60) % w;
      const cy = 240 + (i % 4) * 52;
      const sc = 0.85 + (i % 3) * 0.32;
      paintCloudBank(ctx, cx, cy + 8, sc, 'rgba(148, 178, 212, 0.38)');
      paintCloudBank(ctx, cx, cy, sc, 'rgba(255, 255, 255, 0.72)');
    }

    // Far mist-shrouded mountain silhouettes
    ctx.fillStyle = '#538bb5';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 20) {
      const ridge = Math.sin(x * 0.0065) * 68 + Math.cos(x * 0.019) * 32 + Math.sin(x * 0.048) * 14;
      ctx.lineTo(x, 585 + ridge);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Atmospheric valley mist veil
    const mistG = ctx.createLinearGradient(0, 560, 0, 710);
    mistG.addColorStop(0, 'rgba(220, 242, 248, 0)');
    mistG.addColorStop(0.55, 'rgba(220, 242, 248, 0.52)');
    mistG.addColorStop(1, 'rgba(220, 242, 248, 0)');
    ctx.fillStyle = mistG;
    ctx.fillRect(0, 560, w, 150);

    // Mid-distance forested ridges & dense rainforest horizon
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 18) {
      ctx.lineTo(x, 635 + Math.sin(x * 0.011 + 1.1) * 36 + Math.cos(x * 0.032) * 16);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1b4d27';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 14) {
      ctx.lineTo(x, 695 + Math.cos(x * 0.025) * 24 + Math.sin(x * 0.075) * 12);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });

  // DESERT PANORAMA: Realistic sunlit desert atmosphere, warm scattering horizon, eroded mesas & stone pyramids
  const skyDesert = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2a7da8');
    g.addColorStop(0.28, '#72b7ce');
    g.addColorStop(0.52, '#d8dfc2');
    g.addColorStop(0.66, '#f6d692');
    g.addColorStop(0.82, '#e3a556');
    g.addColorStop(1, '#9c5a25');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Warm desert sun scattering halo
    const dSunG = ctx.createRadialGradient(920, 420, 24, 920, 420, 340);
    dSunG.addColorStop(0, 'rgba(255, 250, 224, 0.92)');
    dSunG.addColorStop(0.32, 'rgba(253, 215, 130, 0.5)');
    dSunG.addColorStop(1, 'rgba(253, 215, 130, 0)');
    ctx.fillStyle = dSunG;
    ctx.fillRect(540, 80, 760, 680);

    // High-altitude desert clouds
    for (let i = 0; i < 12; i++) {
      paintCloudBank(ctx, (i * 193 + 40) % w, 230 + (i % 3) * 52, 1.1 + (i % 3) * 0.3, 'rgba(255, 245, 224, 0.32)');
    }

    // Eroded stone pyramids & mesa silhouettes in atmospheric distance haze
    const pyramids: [number, number, number, number, string, string][] = [
      [340, 665, 300, 185, '#c98653', '#e8b674'],
      [700, 670, 220, 140, '#d1925c', '#ecc07c'],
      [1040, 662, 330, 210, '#c27e4b', '#e6b16e'],
      [1460, 672, 250, 155, '#cf905b', '#ecc07c'],
      [1800, 665, 280, 175, '#c78451', '#e8b674'],
    ];
    for (const [px, py, pw, ph, shadeCol, litCol] of pyramids) {
      ctx.fillStyle = shadeCol;
      ctx.beginPath();
      ctx.moveTo(px - pw / 2, py);
      ctx.lineTo(px, py - ph);
      ctx.lineTo(px + pw / 2, py);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = litCol;
      ctx.beginPath();
      ctx.moveTo(px, py - ph);
      ctx.lineTo(px + pw / 2, py);
      ctx.lineTo(px + pw * 0.08, py);
      ctx.closePath();
      ctx.fill();
    }

    // Heat-haze horizon band & windswept sand dune ridges
    const hazeG = ctx.createLinearGradient(0, 600, 0, 710);
    hazeG.addColorStop(0, 'rgba(253, 224, 160, 0)');
    hazeG.addColorStop(0.5, 'rgba(253, 224, 160, 0.42)');
    hazeG.addColorStop(1, 'rgba(253, 224, 160, 0)');
    ctx.fillStyle = hazeG;
    ctx.fillRect(0, 600, w, 110);

    ctx.fillStyle = '#d9984a';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 24) {
      ctx.lineTo(x, 660 + Math.sin(x * 0.006) * 34 + Math.cos(x * 0.015) * 14);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#bd7b32';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 24) {
      ctx.lineTo(x, 735 + Math.cos(x * 0.008) * 28);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });

  // TEMPLE PANORAMA: Sunlit golden-emerald Mesoamerican rainforest clearing & stepped Aztec stone pyramid
  const skyTemple = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#54b7a4');
    g.addColorStop(0.32, '#a7e4be');
    g.addColorStop(0.58, '#f4f6ca');
    g.addColorStop(0.74, '#dff0b8');
    g.addColorStop(1, '#1d562c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Warm sunlit clouds
    for (let i = 0; i < 14; i++) {
      paintCloudBank(ctx, (i * 173 + 60) % w, 250 + (i % 4) * 44, 1.0 + (i % 3) * 0.25, 'rgba(255, 252, 232, 0.62)');
    }

    // Distant sunlit lime-green jungle canopy hills
    ctx.fillStyle = '#97ca68';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 22) {
      ctx.lineTo(x, 600 + Math.sin(x * 0.008) * 34 + Math.cos(x * 0.025) * 16);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Distant stepped Aztec stone pyramid silhouette in clearing
    const tx = 1024;
    const baseY = 690;
    for (let tier = 0; tier < 5; tier++) {
      const tw = 340 - tier * 54;
      const th = 34;
      const ty = baseY - (tier + 1) * th;
      ctx.fillStyle = tier % 2 === 0 ? '#caa068' : '#b88d54';
      ctx.fillRect(tx - tw / 2, ty, tw, th);
      ctx.fillStyle = '#538a34';
      ctx.fillRect(tx - tw / 2, ty, tw, 6);
    }
    ctx.fillStyle = '#d9b27a';
    ctx.fillRect(tx - 48, baseY - 210, 96, 42);
    ctx.fillStyle = '#292218';
    ctx.fillRect(tx - 16, baseY - 196, 32, 28);

    // Foreground dense emerald rainforest canopy
    ctx.fillStyle = '#28642e';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 18) {
      ctx.lineTo(x, 675 + Math.cos(x * 0.022) * 28 + Math.sin(x * 0.065) * 14);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });

  // ICE PANORAMA: Crisp Alaskan Arctic daylight sky, wispy cirrus streaks, towering snow peaks & dark slate cliffs
  const skyIce = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1367ad');
    g.addColorStop(0.32, '#4ba3db');
    g.addColorStop(0.56, '#b7e1f7');
    g.addColorStop(0.68, '#d9f0fc');
    g.addColorStop(0.75, '#2b8cc4');
    g.addColorStop(1, '#0b5c8e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Crisp windswept Arctic cirrus cloud streaks
    for (let i = 0; i < 18; i++) {
      paintCloudBank(ctx, (i * 151 + 80) % w, 195 + (i % 4) * 42, 0.9 + (i % 3) * 0.3, 'rgba(255, 255, 255, 0.52)');
    }

    // Distant misty blue mountain chain
    ctx.fillStyle = '#7db9e3';
    ctx.beginPath();
    ctx.moveTo(0, 690);
    for (let x = 0; x <= w; x += 28) {
      const peak = Math.sin(x * 0.008) * 46 + Math.cos(x * 0.024) * 24;
      ctx.lineTo(x, 590 + peak);
    }
    ctx.lineTo(w, 690);
    ctx.closePath();
    ctx.fill();

    // Towering faceted sunlit snow-white & cobalt-shaded alpine peaks
    for (let p = 0; p < 7; p++) {
      const px = 180 + p * 270 + ((p % 2) * 40);
      const pw = 250 + (p % 3) * 65;
      const ph = p < 3 || p > 5 ? 185 + (p % 2) * 55 : 130;
      const isSlateCliff = p >= 4 && p <= 5;

      // Shadowed cobalt/slate facet
      ctx.fillStyle = isSlateCliff ? '#1d4d73' : '#7cb8e4';
      ctx.beginPath();
      ctx.moveTo(px - pw / 2, 680);
      ctx.lineTo(px, 680 - ph);
      ctx.lineTo(px + pw / 2, 680);
      ctx.closePath();
      ctx.fill();

      // Sunlit snow-white left facet
      ctx.fillStyle = isSlateCliff ? '#4d82ab' : '#f4fbff';
      ctx.beginPath();
      ctx.moveTo(px - pw / 2, 680);
      ctx.lineTo(px, 680 - ph);
      ctx.lineTo(px - pw * 0.06, 680);
      ctx.closePath();
      ctx.fill();
    }

    // Calm mirror fjord reflection shimmer below horizon
    const reflG = ctx.createLinearGradient(0, 675, 0, 770);
    reflG.addColorStop(0, 'rgba(224, 244, 255, 0.58)');
    reflG.addColorStop(1, 'rgba(13, 103, 155, 0)');
    ctx.fillStyle = reflG;
    ctx.fillRect(0, 675, w, 95);
  });

  // VOLCANIC PANORAMA: Obsidian-crimson ash sky, swirling dark smoke plumes, embers & erupting volcano silhouettes
  const skyVolcanic = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#070204');
    g.addColorStop(0.32, '#2d060d');
    g.addColorStop(0.62, '#8f1616');
    g.addColorStop(0.8, '#e85d1a');
    g.addColorStop(1, '#7c2d12');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Rising glowing embers
    for (let i = 0; i < 280; i++) {
      ctx.fillStyle = i % 3 === 0 ? 'rgba(254, 240, 138, 0.8)' : 'rgba(251, 146, 60, 0.65)';
      ctx.fillRect((i * 151) % w, 180 + ((i * 97) % 560), 2 + (i % 3), 2 + (i % 3));
    }

    // Swirling dark volcanic ash plumes
    for (let i = 0; i < 18; i++) {
      paintCloudBank(ctx, (i * 149) % w, 260 + (i % 4) * 58, 1.15 + (i % 3) * 0.25, 'rgba(20, 8, 10, 0.64)');
    }

    // Jagged obsidian volcano caldera silhouettes with glowing orange crater tops
    for (let v = 0; v < 6; v++) {
      const vx = 170 + v * 330;
      const vw = 280;
      const vh = 140 + (v % 3) * 45;
      ctx.fillStyle = '#180d10';
      ctx.beginPath();
      ctx.moveTo(vx - vw / 2, 720);
      ctx.lineTo(vx - 38, 720 - vh);
      ctx.lineTo(vx + 38, 720 - vh);
      ctx.lineTo(vx + vw / 2, 720);
      ctx.closePath();
      ctx.fill();

      // Glowing magma rim & fountain glow
      const glow = ctx.createRadialGradient(vx, 720 - vh, 6, vx, 720 - vh, 95);
      glow.addColorStop(0, 'rgba(254, 240, 138, 0.92)');
      glow.addColorStop(0.45, 'rgba(249, 115, 22, 0.45)');
      glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(vx - 95, 720 - vh - 95, 190, 140);
    }
  });

  // NEBULA PANORAMA: Deep starry cobalt-teal sky -> luminous cyan horizon, striped moon, ringed planet & jagged indigo mountains
  const skyNebula = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#04234a');
    g.addColorStop(0.28, '#0b5c8a');
    g.addColorStop(0.55, '#2ec4d6');
    g.addColorStop(0.7, '#9ffaf6');
    g.addColorStop(0.84, '#43258c');
    g.addColorStop(1, '#241157');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Crisp cosmic starfield
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = i % 5 === 0 ? '#a5f3fc' : i % 7 === 0 ? '#fef08a' : '#ffffff';
      const s = (i % 4 === 0) ? 2.5 : 1.5;
      ctx.fillRect((i * 197) % w, (i * 113) % 580, s, s);
    }

    // Sweeping luminous cyan-white nebula cloud wisps
    for (let i = 0; i < 12; i++) {
      paintCloudBank(ctx, (i * 181 + 40) % w, 460 + (i % 3) * 40, 1.3 + (i % 3) * 0.35, 'rgba(186, 248, 255, 0.32)');
    }

    // Secondary striped pale-cyan moon (upper-left)
    const mx = 420;
    const my = 260;
    const mGrad = ctx.createLinearGradient(mx - 45, my - 45, mx + 45, my + 45);
    mGrad.addColorStop(0, '#a5f3fc');
    mGrad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.arc(mx, my, 46, 0, Math.PI * 2);
    ctx.fill();

    // Giant luminous ringed cyan-white gas giant on the horizon
    const px = 1040;
    const py = 520;
    const pGrad = ctx.createLinearGradient(px - 125, py - 125, px + 125, py + 125);
    pGrad.addColorStop(0, '#e0fafe');
    pGrad.addColorStop(0.55, '#7ee8f5');
    pGrad.addColorStop(1, '#2694b8');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(px, py, 128, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(207, 250, 254, 0.72)';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.ellipse(px, py, 275, 58, -0.26, 0, Math.PI * 2);
    ctx.stroke();

    // Sharp jagged indigo-violet crystal mountain silhouettes left and right
    for (let m = 0; m < 8; m++) {
      const xPos = m < 4 ? m * 210 + 90 : 1220 + (m - 4) * 210;
      const mw = 230;
      const mh = 135 + (m % 3) * 45;
      ctx.fillStyle = '#312382';
      ctx.beginPath();
      ctx.moveTo(xPos - mw / 2, 730);
      ctx.lineTo(xPos, 730 - mh);
      ctx.lineTo(xPos + mw / 2, 730);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#6052db';
      ctx.beginPath();
      ctx.moveTo(xPos - mw / 2, 730);
      ctx.lineTo(xPos, 730 - mh);
      ctx.lineTo(xPos - mw * 0.08, 730);
      ctx.closePath();
      ctx.fill();
    }
  });

  return {
    techGrid,
    jungleGrass,
    jungleSide,
    jungleDirt,
    grassBump,
    jungleSideBump,
    desertSandstone,
    desertSide,
    desertDirt,
    sandBump,
    stoneBump,
    iceCrystal,
    iceSide,
    iceBump,
    templeTop,
    templeSide,
    templeFloorSurface,
    volcanicBasalt,
    volcanicSide,
    basaltBump,
    volcanicEmissive,
    volcanicSideEmissive,
    lavaEmissive,
    nebulaDeck,
    nebulaSide,
    nebulaBump,
    nebulaSeaEmissive,
    climbStone,
    goldTrim,
    crystalCircuit,
    lagoonSurface,
    waterfallSurface,
    waterBump,
    sandOceanSurface,
    iceSeaSurface,
    lavaSurface,
    nebulaSeaSurface,
    barkTexture,
    barkBump,
    contactShadow,
    skyJungle,
    skyTemple,
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
