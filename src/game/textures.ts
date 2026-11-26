import * as THREE from 'three';

export interface ProceduralTextures {
  techGrid: THREE.CanvasTexture;
  jungleGrass: THREE.CanvasTexture;
  jungleSide: THREE.CanvasTexture;
  jungleDirt: THREE.CanvasTexture;
  grassBump: THREE.CanvasTexture;
  jungleSideBump: THREE.CanvasTexture;
  jungleRuinStone: THREE.CanvasTexture;
  jungleRuinBump: THREE.CanvasTexture;
  jungleLeafTex: THREE.CanvasTexture;
  desertSandstone: THREE.CanvasTexture;
  desertSide: THREE.CanvasTexture;
  desertDirt: THREE.CanvasTexture;
  desertRuinStone: THREE.CanvasTexture;
  desertRuinBump: THREE.CanvasTexture;
  sandBump: THREE.CanvasTexture;
  stoneBump: THREE.CanvasTexture;
  iceCrystal: THREE.CanvasTexture;
  iceSide: THREE.CanvasTexture;
  iceBump: THREE.CanvasTexture;
  glacialRock: THREE.CanvasTexture;
  glacialRockBump: THREE.CanvasTexture;
  auroraCurtainTex: THREE.CanvasTexture;
  templeTop: THREE.CanvasTexture;
  templeSide: THREE.CanvasTexture;
  templeCarvedStone: THREE.CanvasTexture;
  templeCarvedBump: THREE.CanvasTexture;
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
  stoneRoughness: THREE.CanvasTexture;
  metalRoughness: THREE.CanvasTexture;
  woodRoughness: THREE.CanvasTexture;
  iceRoughness: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  skyJungle: THREE.CanvasTexture;
  skyTemple: THREE.CanvasTexture;
  skyDesert: THREE.CanvasTexture;
  skyIce: THREE.CanvasTexture;
  skyVolcanic: THREE.CanvasTexture;
  skyNebula: THREE.CanvasTexture;
  parisStone: THREE.CanvasTexture;
  parisRoof: THREE.CanvasTexture;
  parisFacade: THREE.CanvasTexture;
  parisFacadeEmissive: THREE.CanvasTexture;
  seineWaterSurface: THREE.CanvasTexture;
  skyParis: THREE.CanvasTexture;
  riverTimber: THREE.CanvasTexture;
  rapidsWaterSurface: THREE.CanvasTexture;
  calmLakeSurface: THREE.CanvasTexture;
  rapidsRiverbed: THREE.CanvasTexture;
  skyRapids: THREE.CanvasTexture;
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
  // 1. Clean Orbital Explorer titanium-silver hex-tech floor grid
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

  // 3B. Eroded Carved Desert Sandstone Ruins (ashlar masonry, solar reliefs, fractures & drifted sand seams)
  const [drC, drCtx] = makeCanvas(512, 512);
  const [drbC, drbCtx] = makeCanvas(512, 512);
  const drGrad = drCtx.createLinearGradient(0, 0, 512, 512);
  drGrad.addColorStop(0, '#d89b56');
  drGrad.addColorStop(0.5, '#b87639');
  drGrad.addColorStop(1, '#935523');
  drCtx.fillStyle = drGrad;
  drCtx.fillRect(0, 0, 512, 512);
  drbCtx.fillStyle = '#888888';
  drbCtx.fillRect(0, 0, 512, 512);

  for (let row = 0; row < 8; row++) {
    const y = row * 64;
    const offset = (row % 2) * 64;
    // Eroded stone courses + drifted golden sand settled on horizontal ledges
    drCtx.strokeStyle = 'rgba(66, 30, 8, 0.72)';
    drCtx.lineWidth = 5;
    drbCtx.strokeStyle = '#202020';
    drbCtx.lineWidth = 6;
    for (const target of [drCtx, drbCtx]) {
      target.beginPath();
      target.moveTo(0, y);
      target.lineTo(512, y);
      target.stroke();
    }
    drCtx.fillStyle = 'rgba(245, 200, 126, 0.36)';
    drCtx.fillRect(0, y + 3, 512, 5);

    for (let x = offset; x < 512; x += 128) {
      for (const target of [drCtx, drbCtx]) {
        target.beginPath();
        target.moveTo(x, y);
        target.lineTo(x, y + 64);
        target.stroke();
      }
      // Carved solar disk & geometric relief motifs on alternating sandstone blocks
      const blkIndex = row + Math.floor(x / 128);
      if (blkIndex % 2 === 0) {
        drCtx.strokeStyle = 'rgba(78, 36, 10, 0.45)';
        drCtx.lineWidth = 3;
        drCtx.strokeRect(x + 18, y + 12, 92, 40);
        drCtx.beginPath();
        drCtx.arc(x + 64, y + 32, 12, 0, Math.PI * 2);
        drCtx.stroke();

        drbCtx.strokeStyle = '#484848';
        drbCtx.lineWidth = 3;
        drbCtx.strokeRect(x + 18, y + 12, 92, 40);
        drbCtx.beginPath();
        drbCtx.arc(x + 64, y + 32, 12, 0, Math.PI * 2);
        drbCtx.stroke();
      } else {
        // Vertical fluted sandstone chiseling
        for (let fx = x + 22; fx < x + 110; fx += 22) {
          drCtx.strokeStyle = 'rgba(246, 204, 140, 0.22)';
          drCtx.lineWidth = 2;
          drCtx.beginPath();
          drCtx.moveTo(fx, y + 10);
          drCtx.lineTo(fx, y + 54);
          drCtx.stroke();
        }
      }
    }
  }
  // Wind-pitted sandstone grain, weathering cracks & quartz flecks
  for (let i = 0; i < 1400; i++) {
    const px = (i * 157 + 23) % 512;
    const py = (i * 223 + 19) % 512;
    drCtx.fillStyle =
      i % 4 === 0
        ? 'rgba(253, 224, 168, 0.28)'
        : i % 4 === 1
          ? 'rgba(66, 28, 6, 0.34)'
          : 'rgba(184, 108, 44, 0.24)';
    drCtx.fillRect(px, py, 3 + (i % 5), 2 + (i % 3));
    const bv = i % 2 === 0 ? 185 : 44;
    drbCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    drbCtx.fillRect(px, py, 3 + (i % 3), 2 + (i % 3));
  }
  const desertRuinStone = finalizeColorTexture(drC, maxAnisotropy, 2, 2);
  const desertRuinBump = finalizeDataTexture(drbC, maxAnisotropy, 2, 2);

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

  // 4A-2. Fractured Polar Slate & Snow-Dusted Glacier Rock + Bump Map (for Level 3 cliffs, caves & peaks)
  const [grC, grCtx] = makeCanvas(512, 512);
  const [grbC, grbCtx] = makeCanvas(512, 512);
  const grG = grCtx.createLinearGradient(0, 0, 0, 512);
  grG.addColorStop(0, '#eef8ff');
  grG.addColorStop(0.24, '#7bb8de');
  grG.addColorStop(0.45, '#254a6e');
  grG.addColorStop(1, '#0e243a');
  grCtx.fillStyle = grG;
  grCtx.fillRect(0, 0, 512, 512);
  grbCtx.fillStyle = '#7c7c7c';
  grbCtx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 64; i++) {
    const fx = (i * 89 + 13) % 512;
    const fy = (i * 137 + 29) % 512;
    const fw = 36 + (i % 48);
    const fh = 18 + (i % 34);
    grCtx.fillStyle = i % 3 === 0 ? 'rgba(218, 244, 255, 0.34)' : i % 3 === 1 ? 'rgba(11, 29, 48, 0.56)' : 'rgba(42, 95, 138, 0.42)';
    grCtx.beginPath();
    grCtx.moveTo(fx, fy);
    grCtx.lineTo(fx + fw, fy + 8);
    grCtx.lineTo(fx + fw * 0.6, fy + fh);
    grCtx.closePath();
    grCtx.fill();

    grbCtx.fillStyle = i % 2 === 0 ? 'rgba(215,215,215,0.4)' : 'rgba(38,38,38,0.45)';
    grbCtx.beginPath();
    grbCtx.moveTo(fx, fy);
    grbCtx.lineTo(fx + fw, fy + 8);
    grbCtx.lineTo(fx + fw * 0.6, fy + fh);
    grbCtx.closePath();
    grbCtx.fill();
  }
  // Packed snow veins caught in rock strata
  for (let y = 26; y < 440; y += 72) {
    grCtx.fillStyle = 'rgba(240, 250, 255, 0.72)';
    grCtx.beginPath();
    grCtx.moveTo(0, y);
    for (let x = 0; x <= 512; x += 24) {
      grCtx.lineTo(x, y + Math.sin(x * 0.04 + y) * 7);
    }
    grCtx.lineTo(512, y + 12);
    grCtx.lineTo(0, y + 12);
    grCtx.closePath();
    grCtx.fill();
  }
  const glacialRock = finalizeColorTexture(grC, maxAnisotropy, 2, 2);
  const glacialRockBump = finalizeDataTexture(grbC, maxAnisotropy, 2, 2);

  // 4A-3. Aurora Borealis Vertical Ray Curtain Texture (feathered top/bottom alpha + luminous vertical rays)
  const [acC, acCtx] = makeCanvas(512, 256);
  acCtx.clearRect(0, 0, 512, 256);
  for (let i = 0; i < 96; i++) {
    const rx = (i / 96) * 512;
    const rw = 4 + (i % 7) * 2.5;
    const strength = 0.22 + 0.55 * (0.5 + 0.5 * Math.sin(i * 0.67));
    const rg = acCtx.createLinearGradient(0, 0, 0, 256);
    rg.addColorStop(0, 'rgba(139, 92, 246, 0)');
    rg.addColorStop(0.22, `rgba(167, 139, 250, ${(strength * 0.55).toFixed(2)})`);
    rg.addColorStop(0.55, `rgba(34, 211, 238, ${(strength * 0.85).toFixed(2)})`);
    rg.addColorStop(0.84, `rgba(52, 211, 153, ${strength.toFixed(2)})`);
    rg.addColorStop(1, 'rgba(52, 211, 153, 0)');
    acCtx.fillStyle = rg;
    acCtx.fillRect(rx, 0, rw, 256);
  }
  const auroraCurtainTex = finalizeColorTexture(acC, maxAnisotropy, 2, 1);

  // 4B. Ancient Mesoamerican Weathered Limestone, Carved Reliefs & Wet Mossy Jungle Temple Masonry
  const [ttC, ttCtx] = makeCanvas(512, 512);
  const ttG = ttCtx.createLinearGradient(0, 0, 512, 512);
  ttG.addColorStop(0, '#c8ac7a');
  ttG.addColorStop(0.5, '#b1915c');
  ttG.addColorStop(1, '#8c6e40');
  ttCtx.fillStyle = ttG;
  ttCtx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 64) {
    ttCtx.strokeStyle = 'rgba(54, 38, 18, 0.62)';
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
      // Subtle carved square border & inner glyph dot per flagstone
      ttCtx.strokeStyle = 'rgba(236, 218, 178, 0.18)';
      ttCtx.lineWidth = 2;
      ttCtx.strokeRect(x + 10, y + 10, 108, 44);
      ttCtx.strokeStyle = 'rgba(54, 38, 18, 0.62)';
      ttCtx.lineWidth = 4;
    }
  }
  for (let i = 0; i < 1800; i++) {
    const px = (i * 157 + 23) % 512;
    const py = (i * 223 + 31) % 512;
    ttCtx.fillStyle =
      i % 5 === 0
        ? 'rgba(56, 122, 38, 0.42)'
        : i % 3 === 0
          ? 'rgba(238, 222, 184, 0.28)'
          : 'rgba(66, 46, 22, 0.28)';
    ttCtx.fillRect(px, py, 4 + (i % 7), 3 + (i % 6));
  }
  const templeTop = finalizeColorTexture(ttC, maxAnisotropy);

  const [tsC, tsCtx] = makeCanvas(512, 256);
  const tsG = tsCtx.createLinearGradient(0, 0, 0, 256);
  tsG.addColorStop(0, '#bfa16c');
  tsG.addColorStop(0.55, '#8c6d3f');
  tsG.addColorStop(1, '#543f20');
  tsCtx.fillStyle = tsG;
  tsCtx.fillRect(0, 0, 512, 256);
  for (let y = 40; y < 256; y += 52) {
    tsCtx.strokeStyle = 'rgba(38, 25, 10, 0.72)';
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
      // Carved stepped Mayan frieze band on mid-courses
      if (y === 92 || y === 144) {
        tsCtx.strokeStyle = 'rgba(232, 208, 162, 0.22)';
        tsCtx.lineWidth = 2;
        tsCtx.strokeRect(x + 12, y + 10, 72, 32);
        tsCtx.strokeStyle = 'rgba(38, 25, 10, 0.72)';
        tsCtx.lineWidth = 4;
      }
    }
  }
  // Overgrown emerald jungle moss & damp creeping drips over temple stone lip
  tsCtx.fillStyle = '#3f7f24';
  tsCtx.beginPath();
  tsCtx.moveTo(0, 0);
  tsCtx.lineTo(512, 0);
  tsCtx.lineTo(512, 38);
  for (let x = 512; x >= 0; x -= 10) {
    tsCtx.lineTo(x, 34 + Math.sin(x * 0.075) * 12 + Math.cos(x * 0.22) * 6);
  }
  tsCtx.closePath();
  tsCtx.fill();
  // Vertical water-stain moss streaks
  for (let x = 22; x < 512; x += 58) {
    const sg = tsCtx.createLinearGradient(0, 28, 0, 190);
    sg.addColorStop(0, 'rgba(54, 114, 34, 0.56)');
    sg.addColorStop(1, 'rgba(30, 56, 22, 0)');
    tsCtx.fillStyle = sg;
    tsCtx.fillRect(x, 28, 12 + (x % 9), 160);
  }
  const templeSide = finalizeColorTexture(tsC, maxAnisotropy, 2, 1);

  // 4B-2. Sculpted Temple Carved Relief Stone & High-Contrast Bump (for Level 4 arches, guardians, walls & ruins)
  const [tcC, tcCtx] = makeCanvas(512, 512);
  const [tcbC, tcbCtx] = makeCanvas(512, 512);
  const tcG = tcCtx.createLinearGradient(0, 0, 512, 512);
  tcG.addColorStop(0, '#c7ab7c');
  tcG.addColorStop(0.5, '#9d8254');
  tcG.addColorStop(1, '#6f5936');
  tcCtx.fillStyle = tcG;
  tcCtx.fillRect(0, 0, 512, 512);
  tcbCtx.fillStyle = '#808080';
  tcbCtx.fillRect(0, 0, 512, 512);

  for (let row = 0; row < 4; row++) {
    const ry = row * 128;
    const off = row % 2 === 0 ? 0 : 64;
    for (let col = -1; col < 5; col++) {
      const rx = col * 128 + off;
      // Mortar seam
      tcCtx.strokeStyle = 'rgba(32, 24, 14, 0.78)';
      tcCtx.lineWidth = 5;
      tcCtx.strokeRect(rx, ry, 128, 128);
      tcbCtx.strokeStyle = '#1d1d1d';
      tcbCtx.lineWidth = 6;
      tcbCtx.strokeRect(rx, ry, 128, 128);

      // Raised inner sculpted tablet & stepped Mesoamerican sun-spiral relief
      tcCtx.strokeStyle = 'rgba(240, 224, 188, 0.28)';
      tcCtx.lineWidth = 3;
      tcCtx.strokeRect(rx + 14, ry + 14, 100, 100);
      tcCtx.strokeStyle = 'rgba(42, 31, 16, 0.45)';
      tcCtx.strokeRect(rx + 28, ry + 28, 72, 72);
      tcCtx.strokeRect(rx + 46, ry + 46, 36, 36);

      tcbCtx.strokeStyle = '#d4d4d4';
      tcbCtx.lineWidth = 4;
      tcbCtx.strokeRect(rx + 14, ry + 14, 100, 100);
      tcbCtx.strokeStyle = '#404040';
      tcbCtx.lineWidth = 3;
      tcbCtx.strokeRect(rx + 28, ry + 28, 72, 72);
      tcbCtx.strokeStyle = '#e5e5e5';
      tcbCtx.strokeRect(rx + 46, ry + 46, 36, 36);
    }
  }
  // Damp emerald moss patches & pitted stone erosion
  for (let i = 0; i < 1600; i++) {
    const mx = (i * 149 + 17) % 512;
    const my = (i * 227 + 43) % 512;
    const sz = 4 + (i % 8);
    if (i % 7 === 0) {
      tcCtx.fillStyle = 'rgba(54, 126, 36, 0.46)';
      tcbCtx.fillStyle = 'rgba(170, 170, 170, 0.45)';
    } else if (i % 3 === 0) {
      tcCtx.fillStyle = 'rgba(232, 214, 174, 0.22)';
      tcbCtx.fillStyle = 'rgba(198, 198, 198, 0.35)';
    } else {
      tcCtx.fillStyle = 'rgba(48, 36, 20, 0.3)';
      tcbCtx.fillStyle = 'rgba(55, 55, 55, 0.4)';
    }
    tcCtx.fillRect(mx, my, sz, sz);
    tcbCtx.fillRect(mx, my, sz, sz);
  }
  const templeCarvedStone = finalizeColorTexture(tcC, maxAnisotropy, 1, 1);
  const templeCarvedBump = finalizeDataTexture(tcbC, maxAnisotropy, 1, 1);

  // 5. Realistic Volcanic Obsidian Basalt + Hexagonal Jointing + Glowing Magma Fissures
  const [vC, vCtx] = makeCanvas(512, 512);
  const [veC, veCtx] = makeCanvas(512, 512);
  const [vbC, vbCtx] = makeCanvas(512, 512);
  vCtx.fillStyle = '#181113';
  vCtx.fillRect(0, 0, 512, 512);
  veCtx.fillStyle = '#000000';
  veCtx.fillRect(0, 0, 512, 512);
  vbCtx.fillStyle = '#848484';
  vbCtx.fillRect(0, 0, 512, 512);

  // Basalt mineral grain & scorched charcoal pockets
  for (let i = 0; i < 1600; i++) {
    const rx = (i * 131 + 19) % 512;
    const ry = (i * 211 + 37) % 512;
    const sz = 3 + (i % 10);
    vCtx.fillStyle =
      i % 4 === 0
        ? 'rgba(66, 46, 50, 0.45)'
        : i % 4 === 1
          ? 'rgba(14, 9, 11, 0.7)'
          : i % 4 === 2
            ? 'rgba(84, 42, 34, 0.3)'
            : 'rgba(42, 32, 36, 0.5)';
    vCtx.fillRect(rx, ry, sz, sz * 0.85);
    const bv = i % 3 === 0 ? 195 : i % 3 === 1 ? 45 : 120;
    vbCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    vbCtx.fillRect(rx, ry, sz, sz);
  }

  // Hexagonal basalt joint tiling seams
  const hexR = 64;
  const hexH = hexR * Math.sqrt(3);
  for (let row = -1; row < 10; row++) {
    for (let col = -1; col < 10; col++) {
      const cx = col * hexR * 1.5;
      const cy = row * hexH + (col % 2 === 0 ? 0 : hexH * 0.5);
      const pts: [number, number][] = [];
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * Math.PI * 2;
        pts.push([cx + Math.cos(ang) * (hexR - 3), cy + Math.sin(ang) * (hexR - 3)]);
      }
      vCtx.strokeStyle = 'rgba(10, 6, 8, 0.85)';
      vCtx.lineWidth = 4;
      vCtx.beginPath();
      pts.forEach(([px, py], idx) => (idx === 0 ? vCtx.moveTo(px, py) : vCtx.lineTo(px, py)));
      vCtx.closePath();
      vCtx.stroke();

      vbCtx.strokeStyle = '#181818';
      vbCtx.lineWidth = 5;
      vbCtx.beginPath();
      pts.forEach(([px, py], idx) => (idx === 0 ? vbCtx.moveTo(px, py) : vbCtx.lineTo(px, py)));
      vbCtx.closePath();
      vbCtx.stroke();

      // Subtle glowing orange magma along deeper fractured hex joints
      if ((row * 7 + col * 11) % 3 === 0) {
        veCtx.strokeStyle = 'rgba(234, 88, 12, 0.55)';
        veCtx.lineWidth = 2.5;
        veCtx.beginPath();
        veCtx.moveTo(pts[0][0], pts[0][1]);
        veCtx.lineTo(pts[1][0], pts[1][1]);
        veCtx.lineTo(pts[2][0], pts[2][1]);
        veCtx.stroke();
      }
    }
  }

  // Branching incandescent magma fissures across obsidian stone
  for (let k = 0; k < 20; k++) {
    const sx = (k * 109 + 14) % 512;
    const sy = (k * 179 + 22) % 512;
    const mx = sx + 48 + (k % 3) * 14;
    const my = sy + 24 - (k % 2) * 20;
    const ex = sx + 105;
    const ey = sy - 16 + (k % 3) * 18;

    for (const target of [vCtx, veCtx]) {
      target.strokeStyle = '#b91c1c';
      target.lineWidth = 8;
      target.beginPath();
      target.moveTo(sx, sy);
      target.lineTo(mx, my);
      target.lineTo(ex, ey);
      target.stroke();

      target.strokeStyle = '#f97316';
      target.lineWidth = 4.5;
      target.stroke();

      target.strokeStyle = '#fef08a';
      target.lineWidth = 1.6;
      target.stroke();
    }
    vbCtx.strokeStyle = '#101010';
    vbCtx.lineWidth = 7;
    vbCtx.beginPath();
    vbCtx.moveTo(sx, sy);
    vbCtx.lineTo(mx, my);
    vbCtx.lineTo(ex, ey);
    vbCtx.stroke();
  }
  const volcanicBasalt = finalizeColorTexture(vC, maxAnisotropy);
  const volcanicEmissive = finalizeColorTexture(veC, maxAnisotropy);
  const basaltBump = finalizeDataTexture(vbC, maxAnisotropy);

  // Volcanic Cliff Side: fluted columnar basalt ribs + under-lit orange magma glow & glowing vertical fissures
  const [vsC, vsCtx] = makeCanvas(512, 256);
  const [vseC, vseCtx] = makeCanvas(512, 256);
  const vsG = vsCtx.createLinearGradient(0, 0, 0, 256);
  vsG.addColorStop(0, '#2a1c20');
  vsG.addColorStop(0.5, '#191013');
  vsG.addColorStop(0.85, '#3b130e');
  vsG.addColorStop(1, '#7c200d');
  vsCtx.fillStyle = vsG;
  vsCtx.fillRect(0, 0, 512, 256);
  vseCtx.fillStyle = '#000000';
  vseCtx.fillRect(0, 0, 512, 256);

  // Columnar basalt vertical ribs
  for (let x = 0; x < 512; x += 28) {
    vsCtx.fillStyle = x % 56 === 0 ? 'rgba(54, 34, 38, 0.55)' : 'rgba(12, 7, 9, 0.58)';
    vsCtx.fillRect(x, 0, 14, 256);
    vsCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    vsCtx.fillRect(x, 0, 2, 256);
  }

  // Hot glowing magma rim under-edge + vertical volcanic fissures
  const hotRimG = vseCtx.createLinearGradient(0, 165, 0, 256);
  hotRimG.addColorStop(0, 'rgba(234, 88, 12, 0)');
  hotRimG.addColorStop(0.65, 'rgba(234, 88, 12, 0.42)');
  hotRimG.addColorStop(1, 'rgba(251, 146, 60, 0.88)');
  vseCtx.fillStyle = hotRimG;
  vseCtx.fillRect(0, 165, 512, 91);

  for (let i = 0; i < 16; i++) {
    const fx = (i * 37 + 16) % 512;
    for (const target of [vsCtx, vseCtx]) {
      target.strokeStyle = '#dc2626';
      target.lineWidth = 7;
      target.beginPath();
      target.moveTo(fx, 0);
      target.lineTo(fx + (i % 2 === 0 ? 1 : -1) * 14, 88);
      target.lineTo(fx + ((i % 3) - 1) * 12, 180);
      target.lineTo(fx + 5, 256);
      target.stroke();
      target.strokeStyle = '#fb923c';
      target.lineWidth = 3.6;
      target.stroke();
      target.strokeStyle = '#fef08a';
      target.lineWidth = 1.4;
      target.stroke();
    }
  }
  const volcanicSide = finalizeColorTexture(vsC, maxAnisotropy, 2, 1);
  const volcanicSideEmissive = finalizeColorTexture(vseC, maxAnisotropy, 2, 1);

  // 6. Futuristic Nebula Citadel Astral Marble-Alloy Deck & Luminous Titanium-Indigo Hull Side
  const [nC, nCtx] = makeCanvas(512, 512);
  const [nbC, nbCtx] = makeCanvas(512, 512);
  const nBg = nCtx.createLinearGradient(0, 0, 512, 512);
  nBg.addColorStop(0, '#131b42');
  nBg.addColorStop(0.5, '#1b275c');
  nBg.addColorStop(1, '#18194a');
  nCtx.fillStyle = nBg;
  nCtx.fillRect(0, 0, 512, 512);
  nbCtx.fillStyle = '#868686';
  nbCtx.fillRect(0, 0, 512, 512);

  // Brushed iridescent titanium-marble micro-grain & subtle metallic plate tiling
  for (let i = 0; i < 420; i++) {
    const sx = (i * 73) % 512;
    const sy = (i * 131) % 512;
    const w = 14 + (i % 5) * 8;
    nCtx.fillStyle = i % 3 === 0 ? 'rgba(56, 189, 248, 0.08)' : i % 2 === 0 ? 'rgba(139, 92, 246, 0.09)' : 'rgba(255, 255, 255, 0.04)';
    nCtx.fillRect(sx, sy, w, 2);
    const nv = i % 2 === 0 ? 152 : 112;
    nbCtx.fillStyle = `rgb(${nv},${nv},${nv})`;
    nbCtx.fillRect(sx, sy, w, 2);
  }

  // Geometric astral alloy seams (quadrants + octagonal center sanctuary inlay)
  nCtx.strokeStyle = '#3b4f9e';
  nCtx.lineWidth = 4;
  nCtx.strokeRect(8, 8, 496, 496);
  nCtx.beginPath();
  nCtx.moveTo(256, 8);
  nCtx.lineTo(256, 504);
  nCtx.moveTo(8, 256);
  nCtx.lineTo(504, 256);
  nCtx.stroke();

  nbCtx.strokeStyle = '#2a2a2a';
  nbCtx.lineWidth = 5;
  nbCtx.strokeRect(8, 8, 496, 496);
  nbCtx.beginPath();
  nbCtx.moveTo(256, 8);
  nbCtx.lineTo(256, 504);
  nbCtx.moveTo(8, 256);
  nbCtx.lineTo(504, 256);
  nbCtx.stroke();

  // Luminous turquoise & gold concentric astrolabe circuit rings
  nCtx.strokeStyle = 'rgba(34, 211, 238, 0.65)';
  nCtx.lineWidth = 3;
  nCtx.beginPath();
  nCtx.arc(256, 256, 176, 0, Math.PI * 2);
  nCtx.stroke();
  nCtx.strokeStyle = 'rgba(167, 139, 250, 0.55)';
  nCtx.lineWidth = 2;
  nCtx.beginPath();
  nCtx.arc(256, 256, 132, 0, Math.PI * 2);
  nCtx.stroke();

  nbCtx.strokeStyle = '#c8c8c8';
  nbCtx.lineWidth = 3;
  nbCtx.beginPath();
  nbCtx.arc(256, 256, 176, 0, Math.PI * 2);
  nbCtx.stroke();

  // Inner octagonal polished tech frame & cyan circuit traces
  nCtx.strokeStyle = '#22d3ee';
  nCtx.lineWidth = 2.5;
  nCtx.strokeRect(36, 36, 440, 440);
  nCtx.strokeStyle = 'rgba(250, 204, 21, 0.72)';
  nCtx.lineWidth = 2;
  nCtx.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    const px = 256 + Math.cos(a) * 94;
    const py = 256 + Math.sin(a) * 94;
    if (k === 0) nCtx.moveTo(px, py);
    else nCtx.lineTo(px, py);
  }
  nCtx.closePath();
  nCtx.stroke();

  // Gold & turquoise astral node rivets
  for (const cx of [54, 458]) {
    for (const cy of [54, 458]) {
      nCtx.fillStyle = '#38bdf8';
      nCtx.beginPath();
      nCtx.arc(cx, cy, 9, 0, Math.PI * 2);
      nCtx.fill();
      nCtx.fillStyle = '#fde047';
      nCtx.beginPath();
      nCtx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      nCtx.fill();
    }
  }
  const nebulaDeck = finalizeColorTexture(nC, maxAnisotropy);
  const nebulaBump = finalizeDataTexture(nbC, maxAnisotropy);

  const [nsC, nsCtx] = makeCanvas(512, 256);
  const nsG = nsCtx.createLinearGradient(0, 0, 0, 256);
  nsG.addColorStop(0, '#33489e');
  nsG.addColorStop(0.45, '#1e2768');
  nsG.addColorStop(1, '#0f133b');
  nsCtx.fillStyle = nsG;
  nsCtx.fillRect(0, 0, 512, 256);
  // Polished metallic structural ribs & glowing turquoise/violet energy conduits
  for (let x = 0; x < 512; x += 64) {
    nsCtx.fillStyle = 'rgba(148, 163, 184, 0.14)';
    nsCtx.fillRect(x, 0, 6, 256);
    nsCtx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    nsCtx.fillRect(x + 6, 0, 4, 256);
    // Illuminated citadel viewport slits
    for (let wy = 44; wy < 210; wy += 52) {
      nsCtx.fillStyle = wy % 104 === 44 ? 'rgba(34, 211, 238, 0.85)' : 'rgba(192, 132, 252, 0.78)';
      nsCtx.fillRect(x + 22, wy, 20, 7);
    }
  }
  for (const y of [24, 128, 224]) {
    nsCtx.fillStyle = y === 128 ? 'rgba(56, 189, 248, 0.55)' : 'rgba(250, 204, 21, 0.42)';
    nsCtx.fillRect(0, y, 512, 4);
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

  // 7b. Selva Esmeralda Eroded Ancient Limestone Ruins + Relief Bump + Botanical Veined Leaf Texture
  const [jrC, jrCtx] = makeCanvas(512, 512);
  const [jrbC, jrbCtx] = makeCanvas(512, 512);
  const jrGrad = jrCtx.createLinearGradient(0, 0, 512, 512);
  jrGrad.addColorStop(0, '#96937e');
  jrGrad.addColorStop(0.5, '#7c7b67');
  jrGrad.addColorStop(1, '#60634e');
  jrCtx.fillStyle = jrGrad;
  jrCtx.fillRect(0, 0, 512, 512);
  jrbCtx.fillStyle = '#888888';
  jrbCtx.fillRect(0, 0, 512, 512);

  // Carved cyclopean ashlar stone courses + chiselled spiral/step-fret glyphs
  for (let row = 0; row < 8; row++) {
    const y = row * 64;
    const offset = (row % 2) * 64;
    jrCtx.strokeStyle = 'rgba(32, 38, 22, 0.72)';
    jrCtx.lineWidth = 5;
    jrbCtx.strokeStyle = '#222222';
    jrbCtx.lineWidth = 6;
    for (const ctxTarget of [jrCtx, jrbCtx]) {
      ctxTarget.beginPath();
      ctxTarget.moveTo(0, y);
      ctxTarget.lineTo(512, y);
      ctxTarget.stroke();
    }
    for (let x = offset; x < 512; x += 128) {
      for (const ctxTarget of [jrCtx, jrbCtx]) {
        ctxTarget.beginPath();
        ctxTarget.moveTo(x, y);
        ctxTarget.lineTo(x, y + 64);
        ctxTarget.stroke();
      }
      // Subtle weathered relief glyph carved into alternating blocks
      if ((row + Math.floor(x / 128)) % 2 === 0) {
        jrCtx.strokeStyle = 'rgba(46, 54, 34, 0.42)';
        jrCtx.lineWidth = 3;
        jrCtx.strokeRect(x + 22, y + 14, 84, 36);
        jrCtx.strokeRect(x + 36, y + 22, 56, 20);
        jrbCtx.strokeStyle = '#484848';
        jrbCtx.lineWidth = 3;
        jrbCtx.strokeRect(x + 22, y + 14, 84, 36);
        jrbCtx.strokeRect(x + 36, y + 22, 56, 20);
      }
    }
  }
  // Pitted stone grain + damp lichen + moss creeping along mortar seams
  for (let i = 0; i < 1200; i++) {
    const px = (i * 151 + 29) % 512;
    const py = (i * 211 + 17) % 512;
    const isNearSeam = py % 64 < 12 || py % 64 > 54;
    if (isNearSeam || i % 5 === 0) {
      jrCtx.fillStyle = i % 2 === 0 ? 'rgba(54, 114, 32, 0.48)' : 'rgba(88, 148, 42, 0.36)';
      jrCtx.beginPath();
      jrCtx.ellipse(px, py, 5 + (i % 9), 3 + (i % 5), (i % 4) * 0.4, 0, Math.PI * 2);
      jrCtx.fill();
    } else {
      jrCtx.fillStyle = i % 3 === 0 ? 'rgba(218, 214, 186, 0.22)' : 'rgba(42, 44, 32, 0.28)';
      jrCtx.fillRect(px, py, 3 + (i % 4), 2 + (i % 3));
    }
    const bv = i % 2 === 0 ? 190 : 48;
    jrbCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
    jrbCtx.fillRect(px, py, 3 + (i % 3), 3);
  }
  const jungleRuinStone = finalizeColorTexture(jrC, maxAnisotropy, 2, 2);
  const jungleRuinBump = finalizeDataTexture(jrbC, maxAnisotropy, 2, 2);

  // Botanical Veined Rainforest Leaf Texture
  const [jlC, jlCtx] = makeCanvas(256, 256);
  const leafGrad = jlCtx.createLinearGradient(0, 0, 0, 256);
  leafGrad.addColorStop(0, '#62b835');
  leafGrad.addColorStop(0.5, '#3b8c22');
  leafGrad.addColorStop(1, '#235916');
  jlCtx.fillStyle = leafGrad;
  jlCtx.fillRect(0, 0, 256, 256);
  // Central midrib
  jlCtx.strokeStyle = 'rgba(190, 242, 100, 0.55)';
  jlCtx.lineWidth = 6;
  jlCtx.beginPath();
  jlCtx.moveTo(128, 256);
  jlCtx.lineTo(128, 0);
  jlCtx.stroke();
  // Lateral leaf veins
  jlCtx.strokeStyle = 'rgba(163, 230, 53, 0.34)';
  jlCtx.lineWidth = 3;
  for (let vy = 220; vy >= 20; vy -= 22) {
    jlCtx.beginPath();
    jlCtx.moveTo(128, vy);
    jlCtx.quadraticCurveTo(68, vy - 12, 10, vy - 34);
    jlCtx.moveTo(128, vy);
    jlCtx.quadraticCurveTo(188, vy - 12, 246, vy - 34);
    jlCtx.stroke();
  }
  const jungleLeafTex = finalizeColorTexture(jlC, maxAnisotropy);

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

  // Blazing molten yellow-orange-red lava river with cooled basalt crust islands & glowing vein streams
  const [lavaC, lavaCtx] = makeCanvas(512, 512);
  const [lavaEC, lavaECtx] = makeCanvas(512, 512);
  const lavaG = lavaC ? lavaCtx.createLinearGradient(0, 0, 512, 512) : null;
  if (lavaG) {
    lavaG.addColorStop(0, '#dc2626');
    lavaG.addColorStop(0.35, '#f97316');
    lavaG.addColorStop(0.68, '#fbbf24');
    lavaG.addColorStop(1, '#ea580c');
    lavaCtx.fillStyle = lavaG;
    lavaCtx.fillRect(0, 0, 512, 512);
    lavaECtx.fillStyle = lavaG;
    lavaECtx.fillRect(0, 0, 512, 512);
  }
  // Incandescent flowing magma currents
  for (const target of [lavaCtx, lavaECtx]) {
    target.strokeStyle = 'rgba(254, 240, 138, 0.92)';
    target.lineWidth = 8;
    for (let y = 24; y < 512; y += 52) {
      target.beginPath();
      for (let x = 0; x <= 512; x += 16) {
        const wy = y + Math.sin(x * 0.035 + y * 0.05) * 14;
        if (x === 0) target.moveTo(x, wy);
        else target.lineTo(x, wy);
      }
      target.stroke();
    }
  }
  // Dark cooled basalt crust rafts floating in magma with glowing orange borders
  for (let i = 0; i < 42; i++) {
    const cx = (i * 113 + 29) % 512;
    const cy = (i * 179 + 41) % 512;
    const rx = 18 + (i % 18);
    const ry = 9 + (i % 10);
    const rot = (i % 5) * 0.45;
    for (const target of [lavaCtx, lavaECtx]) {
      target.strokeStyle = 'rgba(251, 146, 60, 0.9)';
      target.lineWidth = 3;
      target.beginPath();
      target.ellipse(cx, cy, rx + 2, ry + 2, rot, 0, Math.PI * 2);
      target.stroke();
    }
    lavaCtx.fillStyle = 'rgba(28, 12, 12, 0.84)';
    lavaCtx.beginPath();
    lavaCtx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    lavaCtx.fill();

    lavaECtx.fillStyle = 'rgba(14, 4, 3, 0.88)';
    lavaECtx.beginPath();
    lavaECtx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    lavaECtx.fill();
  }
  // Bright white-yellow hot spots
  for (let b = 0; b < 32; b++) {
    const bx = (b * 157 + 19) % 512;
    const by = (b * 97 + 61) % 512;
    for (const target of [lavaCtx, lavaECtx]) {
      const hg = target.createRadialGradient(bx, by, 1, bx, by, 16);
      hg.addColorStop(0, 'rgba(255, 251, 204, 0.95)');
      hg.addColorStop(0.5, 'rgba(251, 146, 60, 0.45)');
      hg.addColorStop(1, 'rgba(251, 146, 60, 0)');
      target.fillStyle = hg;
      target.fillRect(bx - 16, by - 16, 32, 32);
    }
  }
  const lavaSurface = finalizeColorTexture(lavaC, maxAnisotropy, 16, 16);
  const lavaEmissive = finalizeColorTexture(lavaEC, maxAnisotropy, 16, 16);

  // Deep Cosmic Space Void & Swirling Multi-Color Nebula Sea beneath Ciudadela Nebulosa
  const [nebSeaC, nebSeaCtx] = makeCanvas(512, 512);
  const [nebSeaEC, nebSeaECtx] = makeCanvas(512, 512);
  const nebG = nebSeaCtx.createLinearGradient(0, 0, 512, 512);
  nebG.addColorStop(0, '#070b2b');
  nebG.addColorStop(0.5, '#12124a');
  nebG.addColorStop(1, '#09193e');
  nebSeaCtx.fillStyle = nebG;
  nebSeaCtx.fillRect(0, 0, 512, 512);
  nebSeaECtx.fillStyle = '#030516';
  nebSeaECtx.fillRect(0, 0, 512, 512);

  // Swirling cosmic nebula dust ribbons (violet, turquoise, indigo-magenta)
  const nebBlobs: [number, number, number, string, string][] = [
    [130, 150, 145, 'rgba(139, 92, 246, 0.34)', 'rgba(139, 92, 246, 0.22)'],
    [370, 190, 160, 'rgba(34, 211, 238, 0.28)', 'rgba(34, 211, 238, 0.24)'],
    [250, 390, 155, 'rgba(192, 132, 252, 0.3)', 'rgba(168, 85, 247, 0.22)'],
    [90, 410, 120, 'rgba(45, 212, 191, 0.26)', 'rgba(45, 212, 191, 0.2)'],
  ];
  for (const [bx, by, br, colBase, colEm] of nebBlobs) {
    const gBase = nebSeaCtx.createRadialGradient(bx, by, 8, bx, by, br);
    gBase.addColorStop(0, colBase);
    gBase.addColorStop(1, 'rgba(0,0,0,0)');
    nebSeaCtx.fillStyle = gBase;
    nebSeaCtx.fillRect(0, 0, 512, 512);

    const gEm = nebSeaECtx.createRadialGradient(bx, by, 8, bx, by, br);
    gEm.addColorStop(0, colEm);
    gEm.addColorStop(1, 'rgba(0,0,0,0)');
    nebSeaECtx.fillStyle = gEm;
    nebSeaECtx.fillRect(0, 0, 512, 512);
  }

  // Luminous stardust & distant star-cluster glints in the abyss below
  for (let i = 0; i < 190; i++) {
    const sx = (i * 89 + 17) % 512;
    const sy = (i * 149 + 31) % 512;
    const r = i % 7 === 0 ? 2.4 : 1.3;
    const c = i % 3 === 0 ? '#67e8f9' : i % 5 === 0 ? '#e879f9' : '#e0f2fe';
    nebSeaCtx.fillStyle = c;
    nebSeaCtx.beginPath();
    nebSeaCtx.arc(sx, sy, r, 0, Math.PI * 2);
    nebSeaCtx.fill();
    nebSeaECtx.fillStyle = c;
    nebSeaECtx.beginPath();
    nebSeaECtx.arc(sx, sy, r, 0, Math.PI * 2);
    nebSeaECtx.fill();
  }
  const nebulaSeaSurface = finalizeColorTexture(nebSeaC, maxAnisotropy, 12, 12);
  const nebulaSeaEmissive = finalizeColorTexture(nebSeaEC, maxAnisotropy, 12, 12);

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

  // DESERT PANORAMA: Dramatic golden-orange sunset over layered sandstone mesas, sunken temples & sweeping barchan dunes
  const skyDesert = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#183768');
    g.addColorStop(0.24, '#3a6a9c');
    g.addColorStop(0.46, '#b8745e');
    g.addColorStop(0.60, '#f39b48');
    g.addColorStop(0.71, '#fcc86e');
    g.addColorStop(0.84, '#d9843b');
    g.addColorStop(1, '#7a3b14');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Blazing low golden-amber desert sunset sun + atmospheric corona
    const dSunG = ctx.createRadialGradient(1024, 520, 22, 1024, 520, 440);
    dSunG.addColorStop(0, 'rgba(255, 253, 232, 0.98)');
    dSunG.addColorStop(0.14, 'rgba(255, 226, 138, 0.85)');
    dSunG.addColorStop(0.42, 'rgba(249, 145, 58, 0.42)');
    dSunG.addColorStop(1, 'rgba(249, 145, 58, 0)');
    ctx.fillStyle = dSunG;
    ctx.fillRect(520, 120, 1008, 720);

    // Crisp sun core disc
    ctx.fillStyle = 'rgba(255, 250, 220, 0.96)';
    ctx.beginPath();
    ctx.arc(1024, 520, 34, 0, Math.PI * 2);
    ctx.fill();

    // Warm sunset-lit high dusk cloud streaks
    for (let i = 0; i < 14; i++) {
      const cx = (i * 181 + 50) % w;
      const cy = 240 + (i % 4) * 48;
      const sc = 0.9 + (i % 3) * 0.35;
      paintCloudBank(ctx, cx, cy + 7, sc, 'rgba(134, 68, 78, 0.36)');
      paintCloudBank(ctx, cx, cy, sc, 'rgba(255, 206, 140, 0.46)');
    }

    // Far eroded canyon mesas & natural tablelands in warm dusk haze
    ctx.fillStyle = '#c47242';
    ctx.beginPath();
    ctx.moveTo(0, h);
    const mesaStops = [
      [0, 620], [140, 620], [185, 558], [320, 558], [365, 628], [520, 632],
      [575, 570], [705, 570], [748, 634], [910, 638], [1160, 636],
      [1235, 554], [1395, 554], [1448, 628], [1610, 630], [1680, 566],
      [1825, 566], [1880, 626], [w, 622],
    ];
    for (const [mx, my] of mesaStops) {
      ctx.lineTo(mx, my);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Stepped ancient sandstone temples & eroded obelisks silhouetted along the dusk horizon
    const sanctuaries: [number, number, number, number][] = [
      [250, 646, 200, 128],
      [645, 650, 155, 96],
      [1315, 644, 225, 145],
      [1755, 648, 175, 112],
    ];
    for (const [sx, sy, sw, sh] of sanctuaries) {
      for (let tier = 0; tier < 4; tier++) {
        const tw = sw * (1 - tier * 0.2);
        const th = sh * 0.24;
        const ty = sy - (tier + 1) * th;
        ctx.fillStyle = tier % 2 === 0 ? '#a85a2d' : '#b86736';
        ctx.fillRect(sx - tw * 0.5, ty, tw, th + 2);
      }
    }

    // Warm glowing horizon dust haze veil
    const hazeG = ctx.createLinearGradient(0, 580, 0, 720);
    hazeG.addColorStop(0, 'rgba(253, 186, 116, 0)');
    hazeG.addColorStop(0.55, 'rgba(253, 186, 116, 0.48)');
    hazeG.addColorStop(1, 'rgba(217, 119, 44, 0.14)');
    ctx.fillStyle = hazeG;
    ctx.fillRect(0, 580, w, 140);

    // Sweeping far dune crest ridges
    ctx.fillStyle = '#cf7f36';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 20) {
      ctx.lineTo(x, 658 + Math.sin(x * 0.0055) * 32 + Math.cos(x * 0.017) * 14);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Foreground shadowed amber sand sea
    ctx.fillStyle = '#a3561c';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 20) {
      ctx.lineTo(x, 738 + Math.cos(x * 0.0075) * 26 + Math.sin(x * 0.021) * 10);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });

  // TEMPLE PANORAMA: Sunlit golden-emerald rainforest canyon, waterfall cliffs & monumental distant Mesoamerican citadels
  const skyTemple = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#2c7e76');
    g.addColorStop(0.28, '#6bc7a4');
    g.addColorStop(0.54, '#e9f2bd');
    g.addColorStop(0.7, '#cfe7a6');
    g.addColorStop(1, '#143d1f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Warm sunlit golden mist clouds
    for (let i = 0; i < 16; i++) {
      paintCloudBank(ctx, (i * 173 + 60) % w, 240 + (i % 4) * 44, 1.05 + (i % 3) * 0.26, 'rgba(255, 250, 224, 0.56)');
    }

    // Slanted diagonal atmospheric sun shafts piercing horizon mist
    for (let r = 0; r < 7; r++) {
      const rx = 240 + r * 260;
      const rg = ctx.createLinearGradient(rx, 240, rx + 110, 690);
      rg.addColorStop(0, 'rgba(254, 243, 199, 0.22)');
      rg.addColorStop(1, 'rgba(254, 243, 199, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(rx, 240);
      ctx.lineTo(rx + 64, 240);
      ctx.lineTo(rx + 185, 690);
      ctx.lineTo(rx + 85, 690);
      ctx.closePath();
      ctx.fill();
    }

    // Distant jagged misty emerald canyon mountains
    ctx.fillStyle = '#5da87a';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 20) {
      ctx.lineTo(x, 540 + Math.sin(x * 0.0055) * 46 + Math.cos(x * 0.017) * 24 + Math.sin(x * 0.041) * 10);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Distant cliffside waterfalls pouring into sunlit mist
    for (const wx of [440, 1480]) {
      const wg = ctx.createLinearGradient(0, 520, 0, 690);
      wg.addColorStop(0, 'rgba(224, 242, 254, 0.72)');
      wg.addColorStop(1, 'rgba(224, 242, 254, 0.14)');
      ctx.fillStyle = wg;
      ctx.fillRect(wx, 530, 18, 155);
      paintCloudBank(ctx, wx + 9, 682, 0.7, 'rgba(236, 253, 245, 0.5)');
    }

    // Distant stepped monumental temple citadels perched in rainforest clearings
    const paintTempleSilhouette = (tx: number, baseY: number, scale: number) => {
      for (let tier = 0; tier < 6; tier++) {
        const tw = (360 - tier * 50) * scale;
        const th = 30 * scale;
        const ty = baseY - (tier + 1) * th;
        ctx.fillStyle = tier % 2 === 0 ? '#a98a5b' : '#947548';
        ctx.fillRect(tx - tw / 2, ty, tw, th);
        ctx.fillStyle = '#3f7b31';
        ctx.fillRect(tx - tw / 2, ty, tw, 6 * scale);
      }
      ctx.fillStyle = '#b99968';
      ctx.fillRect(tx - 46 * scale, baseY - 216 * scale, 92 * scale, 38 * scale);
      ctx.fillStyle = '#1f2318';
      ctx.fillRect(tx - 15 * scale, baseY - 202 * scale, 30 * scale, 24 * scale);
    };
    paintTempleSilhouette(1024, 688, 1.05);
    paintTempleSilhouette(310, 675, 0.62);
    paintTempleSilhouette(1720, 675, 0.68);

    // Midground sunlit lime-emerald jungle hills
    ctx.fillStyle = '#4e9144';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 18) {
      ctx.lineTo(x, 628 + Math.sin(x * 0.011 + 1.2) * 28 + Math.cos(x * 0.032) * 14);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Foreground dense emerald rainforest canopy
    ctx.fillStyle = '#1d5224';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 16) {
      ctx.lineTo(x, 682 + Math.cos(x * 0.022) * 26 + Math.sin(x * 0.065) * 13);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });

  // ICE PANORAMA: Polar aurora twilight sky, luminous horizon, stars, faceted alpine glacier peaks & aurora fjord reflections
  const skyIce = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#071b3d');
    g.addColorStop(0.26, '#0f3968');
    g.addColorStop(0.5, '#2976aa');
    g.addColorStop(0.65, '#99def7');
    g.addColorStop(0.72, '#c8f0fe');
    g.addColorStop(0.78, '#176799');
    g.addColorStop(1, '#072a47');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Subtle crisp polar stars at high zenith
    for (let i = 0; i < 160; i++) {
      const sx = (i * 197 + 41) % w;
      const sy = 25 + ((i * 89) % 280);
      ctx.fillStyle = i % 3 === 0 ? 'rgba(224, 247, 255, 0.72)' : 'rgba(186, 230, 253, 0.45)';
      ctx.fillRect(sx, sy, i % 4 === 0 ? 2 : 1.3, i % 4 === 0 ? 2 : 1.3);
    }

    // Distant Aurora Borealis Veil Bands painted across upper dome behind 3D curtains
    for (let a = 0; a < 4; a++) {
      const baseY = 180 + a * 42;
      const aurG = ctx.createLinearGradient(0, baseY - 70, 0, baseY + 65);
      aurG.addColorStop(0, 'rgba(139, 92, 246, 0)');
      aurG.addColorStop(0.45, a % 2 === 0 ? 'rgba(34, 211, 238, 0.24)' : 'rgba(52, 211, 153, 0.28)');
      aurG.addColorStop(1, 'rgba(52, 211, 153, 0)');
      ctx.fillStyle = aurG;
      ctx.beginPath();
      ctx.moveTo(0, baseY + 65);
      for (let x = 0; x <= w; x += 24) {
        ctx.lineTo(x, baseY - 35 + Math.sin(x * 0.008 + a * 1.4) * 32 + Math.cos(x * 0.02 - a) * 16);
      }
      ctx.lineTo(w, baseY + 65);
      ctx.closePath();
      ctx.fill();
    }

    // High-altitude polar ice-cirrus wisps
    for (let i = 0; i < 14; i++) {
      paintCloudBank(ctx, (i * 173 + 60) % w, 315 + (i % 4) * 38, 0.95 + (i % 3) * 0.28, 'rgba(224, 247, 255, 0.36)');
    }

    // Distant misty cobalt-turquoise mountain range
    ctx.fillStyle = '#478ebf';
    ctx.beginPath();
    ctx.moveTo(0, 690);
    for (let x = 0; x <= w; x += 26) {
      const peak = Math.sin(x * 0.009) * 52 + Math.cos(x * 0.025) * 26;
      ctx.lineTo(x, 585 + peak);
    }
    ctx.lineTo(w, 690);
    ctx.closePath();
    ctx.fill();

    // Towering faceted sunlit snow-white & deep polar slate/cobalt alpine peaks
    for (let p = 0; p < 8; p++) {
      const px = 140 + p * 250 + (p % 2) * 35;
      const pw = 240 + (p % 3) * 65;
      const ph = 155 + (p % 3) * 48;
      const isSlateCliff = p === 2 || p === 5;

      ctx.fillStyle = isSlateCliff ? '#163c5e' : '#4a8ec2';
      ctx.beginPath();
      ctx.moveTo(px - pw / 2, 680);
      ctx.lineTo(px, 680 - ph);
      ctx.lineTo(px + pw / 2, 680);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = isSlateCliff ? '#3b749e' : '#e6f7ff';
      ctx.beginPath();
      ctx.moveTo(px - pw / 2, 680);
      ctx.lineTo(px, 680 - ph);
      ctx.lineTo(px - pw * 0.07, 680);
      ctx.closePath();
      ctx.fill();
    }

    // Aurora-tinted turquoise & icy mirror fjord reflection shimmer below horizon
    const reflG = ctx.createLinearGradient(0, 675, 0, 778);
    reflG.addColorStop(0, 'rgba(103, 232, 249, 0.45)');
    reflG.addColorStop(0.5, 'rgba(52, 211, 153, 0.22)');
    reflG.addColorStop(1, 'rgba(7, 42, 71, 0)');
    ctx.fillStyle = reflG;
    ctx.fillRect(0, 675, w, 103);
  });

  // VOLCANIC PANORAMA: Obsidian-crimson ash sky, towering dark smoke plumes, glowing ash streaks & erupting calderas
  const skyVolcanic = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#050103');
    g.addColorStop(0.28, '#23050b');
    g.addColorStop(0.56, '#7f1414');
    g.addColorStop(0.76, '#e25317');
    g.addColorStop(0.9, '#b91c1c');
    g.addColorStop(1, '#451208');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Towering volcano caldera silhouettes with backlit ash plumes & lava cracks
    for (let v = 0; v < 7; v++) {
      const vx = 140 + v * 290;
      const vw = 310;
      const vh = 155 + (v % 3) * 52;
      const smokeG = ctx.createRadialGradient(vx, 700 - vh - 60, 18, vx, 700 - vh - 100, 175);
      smokeG.addColorStop(0, 'rgba(251, 146, 60, 0.35)');
      smokeG.addColorStop(0.45, 'rgba(32, 14, 16, 0.72)');
      smokeG.addColorStop(1, 'rgba(18, 6, 8, 0)');
      ctx.fillStyle = smokeG;
      ctx.fillRect(vx - 180, 700 - vh - 260, 360, 260);

      ctx.fillStyle = '#140a0d';
      ctx.beginPath();
      ctx.moveTo(vx - vw / 2, 740);
      ctx.lineTo(vx - 44, 720 - vh);
      ctx.lineTo(vx + 44, 720 - vh);
      ctx.lineTo(vx + vw / 2, 740);
      ctx.closePath();
      ctx.fill();

      // Glowing magma rim & fountain glow
      const glow = ctx.createRadialGradient(vx, 720 - vh, 6, vx, 720 - vh, 105);
      glow.addColorStop(0, 'rgba(254, 240, 138, 0.96)');
      glow.addColorStop(0.4, 'rgba(249, 115, 22, 0.52)');
      glow.addColorStop(1, 'rgba(249, 115, 22, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(vx - 105, 720 - vh - 105, 210, 150);
    }

    // Swirling dark volcanic ash cloud banks
    for (let i = 0; i < 24; i++) {
      paintCloudBank(
        ctx,
        (i * 137) % w,
        210 + (i % 5) * 52,
        1.2 + (i % 3) * 0.28,
        i % 2 === 0 ? 'rgba(18, 7, 10, 0.68)' : 'rgba(64, 20, 14, 0.42)'
      );
    }

    // Rising glowing embers & suspended dark ash flakes
    for (let i = 0; i < 360; i++) {
      ctx.fillStyle =
        i % 4 === 0
          ? 'rgba(254, 240, 138, 0.85)'
          : i % 4 === 1
            ? 'rgba(251, 146, 60, 0.7)'
            : 'rgba(24, 12, 14, 0.55)';
      ctx.fillRect((i * 151) % w, 140 + ((i * 97) % 600), 2 + (i % 3), 2 + (i % 4));
    }
  });

  // NEBULA PANORAMA: Deep starry space zenith, multi-colored luminous nebulae, planets & distant sky-citadel silhouettes
  const skyNebula = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#02061c');
    g.addColorStop(0.24, '#09194a');
    g.addColorStop(0.48, '#16387d');
    g.addColorStop(0.64, '#1b6e9e');
    g.addColorStop(0.76, '#38bdf8');
    g.addColorStop(0.88, '#28165c');
    g.addColorStop(1, '#08051e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Multi-colored sweeping cosmic nebula glow plumes (violet, magenta, cyan, turquoise)
    const nebulaGlows: [number, number, number, string][] = [
      [280, 320, 260, 'rgba(139, 92, 246, 0.34)'],
      [620, 250, 280, 'rgba(34, 211, 238, 0.28)'],
      [980, 340, 310, 'rgba(217, 70, 239, 0.25)'],
      [1350, 290, 290, 'rgba(45, 212, 191, 0.28)'],
      [1720, 360, 280, 'rgba(99, 102, 241, 0.32)'],
    ];
    for (const [nx, ny, nr, col] of nebulaGlows) {
      const ng = ctx.createRadialGradient(nx, ny, 14, nx, ny, nr);
      ng.addColorStop(0, col);
      ng.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = ng;
      ctx.fillRect(0, 0, w, h);
    }

    // Crisp multi-magnitude cosmic starfield + bright cross glints
    for (let i = 0; i < 620; i++) {
      const sx = (i * 197 + 19) % w;
      const sy = (i * 113 + 7) % 680;
      ctx.fillStyle = i % 5 === 0 ? '#a5f3fc' : i % 7 === 0 ? '#e879f9' : i % 11 === 0 ? '#fef08a' : '#ffffff';
      const s = i % 13 === 0 ? 3.2 : i % 4 === 0 ? 2.1 : 1.3;
      ctx.fillRect(sx, sy, s, s);
    }

    // Distant cloud banks bathed in turquoise & violet starlight
    for (let i = 0; i < 14; i++) {
      paintCloudBank(
        ctx,
        (i * 163 + 30) % w,
        545 + (i % 3) * 34,
        1.15 + (i % 3) * 0.35,
        i % 2 === 0 ? 'rgba(165, 243, 252, 0.26)' : 'rgba(192, 132, 252, 0.22)'
      );
    }

    // Striped amethyst-cyan moon (upper-left)
    const mx = 390;
    const my = 235;
    const mGrad = ctx.createLinearGradient(mx - 54, my - 54, mx + 54, my + 54);
    mGrad.addColorStop(0, '#c4b5fd');
    mGrad.addColorStop(0.55, '#67e8f9');
    mGrad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = mGrad;
    ctx.beginPath();
    ctx.arc(mx, my, 52, 0, Math.PI * 2);
    ctx.fill();

    // Distant amber-rose exoplanet (right horizon)
    const ex = 1610;
    const ey = 320;
    const eGrad = ctx.createLinearGradient(ex - 40, ey - 40, ex + 40, ey + 40);
    eGrad.addColorStop(0, '#fbcfe8');
    eGrad.addColorStop(0.6, '#a78bfa');
    eGrad.addColorStop(1, '#312e81');
    ctx.fillStyle = eGrad;
    ctx.beginPath();
    ctx.arc(ex, ey, 38, 0, Math.PI * 2);
    ctx.fill();

    // Giant luminous ringed cyan-pearl gas giant on the horizon
    const px = 1040;
    const py = 505;
    const pGrad = ctx.createLinearGradient(px - 125, py - 125, px + 125, py + 125);
    pGrad.addColorStop(0, '#ecfeff');
    pGrad.addColorStop(0.55, '#5eead4');
    pGrad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(px, py, 124, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(207, 250, 254, 0.68)';
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.ellipse(px, py, 275, 56, -0.26, 0, Math.PI * 2);
    ctx.stroke();

    // Faint distant suspended futuristic citadel spire silhouettes on horizon
    for (let s = 0; s < 12; s++) {
      const sx = (s * 168 + 60) % w;
      const sh = 75 + (s % 4) * 38;
      const sw = 24 + (s % 3) * 14;
      ctx.fillStyle = 'rgba(23, 21, 74, 0.72)';
      ctx.fillRect(sx - sw / 2, 710 - sh, sw, sh);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
      ctx.fillRect(sx - 2, 710 - sh - 22, 4, 22);
    }
  });

  // PARIS SUNLIT LIMESTONE PAVING & HAUSSMANN ASHLAR
  const parisStone = (() => {
    const [canvas, ctx] = makeCanvas(512, 512);
    ctx.fillStyle = '#dec9aa';
    ctx.fillRect(0, 0, 512, 512);
    const cols = 8;
    const rows = 16;
    const cw = 512 / cols;
    const rh = 512 / rows;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (cw * 0.5);
      for (let c = -1; c <= cols; c++) {
        const x = c * cw + offset;
        const y = r * rh;
        const tone = 212 + (((r * 13 + c * 29) % 24) - 12);
        ctx.fillStyle = `rgb(${tone}, ${tone - 16}, ${tone - 36})`;
        ctx.fillRect(x + 2, y + 2, cw - 4, rh - 4);
        ctx.fillStyle = 'rgba(255,244,224,0.28)';
        ctx.fillRect(x + 2, y + 2, cw - 4, 4);
      }
    }
    return finalizeColorTexture(canvas, maxAnisotropy, 2, 2);
  })();

  // PARIS ZINC SLATE MANSARD ROOF (Standing seams & subtle verdigris patina)
  const parisRoof = (() => {
    const [canvas, ctx] = makeCanvas(256, 256);
    const rGrad = ctx.createLinearGradient(0, 0, 0, 256);
    rGrad.addColorStop(0, '#36495e');
    rGrad.addColorStop(1, '#273549');
    ctx.fillStyle = rGrad;
    ctx.fillRect(0, 0, 256, 256);
    for (let x = 0; x < 256; x += 24) {
      ctx.fillStyle = x % 48 === 0 ? '#475c75' : '#384b63';
      ctx.fillRect(x + 2, 0, 20, 256);
      ctx.fillStyle = '#1b2636';
      ctx.fillRect(x, 0, 2, 256);
    }
    for (let y = 0; y < 256; y += 32) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.38)';
      ctx.fillRect(0, y, 256, 2);
      ctx.fillStyle = 'rgba(148, 197, 212, 0.14)';
      ctx.fillRect(0, y + 2, 256, 1);
    }
    return finalizeColorTexture(canvas, maxAnisotropy, 2, 2);
  })();

  // PARIS ORNATE HAUSSMANN FACADE + WARM GOLDEN LIT WINDOWS AT SUNSET
  const [parisFacade, parisFacadeEmissive] = (() => {
    const [canvas, ctx] = makeCanvas(512, 512);
    const [eCanvas, eCtx] = makeCanvas(512, 512);

    const wallGrad = ctx.createLinearGradient(0, 0, 0, 512);
    wallGrad.addColorStop(0, '#ead8bc');
    wallGrad.addColorStop(0.55, '#dfc7a6');
    wallGrad.addColorStop(1, '#ccb08b');
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, 512, 512);

    eCtx.fillStyle = '#040408';
    eCtx.fillRect(0, 0, 512, 512);

    // Ashlar masonry courses & vertical classical pilasters
    ctx.strokeStyle = 'rgba(130, 102, 72, 0.28)';
    ctx.lineWidth = 2;
    for (let y = 0; y < 512; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // 4 stories × 4 arched French windows with wrought-iron balcony grilles & warm interior lights
    const cols = 4;
    const rows = 4;
    const cellW = 512 / cols;
    const cellH = 512 / rows;

    for (let r = 0; r < rows; r++) {
      // Carved stone cornice stringcourse above each floor
      const floorY = r * cellH;
      ctx.fillStyle = '#f3e5ce';
      ctx.fillRect(0, floorY, 512, 10);
      ctx.fillStyle = 'rgba(110, 82, 52, 0.35)';
      ctx.fillRect(0, floorY + 10, 512, 4);

      for (let c = 0; c < cols; c++) {
        const cx = c * cellW + cellW * 0.5;
        const wy = floorY + 24;
        const ww = 54;
        const wh = 76;

        // Recessed stone window surround & classical pediment cap
        ctx.fillStyle = '#f5e9d6';
        ctx.fillRect(cx - ww / 2 - 7, wy - 8, ww + 14, wh + 10);
        ctx.fillStyle = '#b4946e';
        ctx.fillRect(cx - ww / 2 - 3, wy - 2, ww + 6, wh + 2);

        const isLit = ((r * 7 + c * 11) % 3) !== 0;
        // Window glass pane (warm amber-gold if lit, twilight indigo reflection if unlit)
        ctx.fillStyle = isLit ? '#ffd875' : '#2a3a5c';
        ctx.fillRect(cx - ww / 2, wy + 12, ww, wh - 12);
        ctx.beginPath();
        ctx.arc(cx, wy + 12, ww / 2, Math.PI, 0);
        ctx.fill();

        if (isLit) {
          const glow = eCtx.createRadialGradient(cx, wy + wh * 0.45, 4, cx, wy + wh * 0.45, 42);
          glow.addColorStop(0, '#ffe89e');
          glow.addColorStop(0.65, '#f59e0b');
          glow.addColorStop(1, 'rgba(0,0,0,0)');
          eCtx.fillStyle = glow;
          eCtx.fillRect(cx - ww / 2, wy, ww, wh);
        }

        // French window mullions
        ctx.fillStyle = '#332924';
        ctx.fillRect(cx - 1.5, wy, 3, wh);
        ctx.fillRect(cx - ww / 2, wy + wh * 0.48, ww, 3);

        // Ornate dark wrought-iron balcony railing across lower half
        ctx.fillStyle = '#1e2430';
        ctx.fillRect(cx - ww / 2 - 6, wy + wh - 24, ww + 12, 4);
        ctx.fillRect(cx - ww / 2 - 6, wy + wh - 4, ww + 12, 5);
        for (let b = -ww / 2 - 2; b <= ww / 2 + 2; b += 8) {
          ctx.fillRect(cx + b, wy + wh - 24, 2, 22);
        }
      }
    }
    return [
      finalizeColorTexture(canvas, maxAnisotropy, 1, 1),
      finalizeColorTexture(eCanvas, maxAnisotropy, 1, 1),
    ];
  })();

  // PARIS GOLDEN SUNSET REFLECTING SEINE RIVER SURFACE
  const seineWaterSurface = (() => {
    const [canvas, ctx] = makeCanvas(512, 512);
    const g = ctx.createLinearGradient(0, 0, 512, 512);
    g.addColorStop(0, '#1e3a6d');
    g.addColorStop(0.45, '#2b4d82');
    g.addColorStop(1, '#263a6e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);

    // Shimmering sunset amber-gold & rose reflections across river ripples
    for (let i = 0; i < 180; i++) {
      const rx = (i * 79) % 512;
      const ry = (i * 137) % 512;
      ctx.fillStyle =
        i % 4 === 0
          ? 'rgba(255, 200, 120, 0.34)'
          : i % 3 === 0
            ? 'rgba(251, 146, 130, 0.22)'
            : 'rgba(147, 197, 253, 0.24)';
      ctx.fillRect(rx, ry, 28 + (i % 34), 3);
    }
    return finalizeColorTexture(canvas, maxAnisotropy, 16, 16);
  })();

  // PARIS PANORAMA SKY: Cinematic Golden Sunset (Twilight Indigo Zenith -> Rose-Peach -> Radiant Sunlit Gold Horizon)
  const skyParis = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#141e4d');
    g.addColorStop(0.24, '#363b7a');
    g.addColorStop(0.46, '#874c7d');
    g.addColorStop(0.62, '#de7569');
    g.addColorStop(0.72, '#ffae66');
    g.addColorStop(0.79, '#ffe29c');
    g.addColorStop(0.88, '#534375');
    g.addColorStop(1, '#1d1c42');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Subtle early twilight stars high near the zenith
    for (let i = 0; i < 160; i++) {
      ctx.fillStyle = i % 3 === 0 ? 'rgba(255,244,214,0.75)' : 'rgba(255,255,255,0.55)';
      ctx.fillRect((i * 223 + 17) % w, (i * 89 + 11) % 240, 1.5, 1.5);
    }

    // Radiant setting sun glow near the horizon (aligned ahead toward -Z)
    const sunX = 1024;
    const sunY = 625;
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 18, sunX, sunY, 320);
    sunGlow.addColorStop(0, 'rgba(255, 252, 224, 0.98)');
    sunGlow.addColorStop(0.25, 'rgba(255, 206, 122, 0.72)');
    sunGlow.addColorStop(0.6, 'rgba(249, 134, 102, 0.28)');
    sunGlow.addColorStop(1, 'rgba(249, 134, 102, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, w, h);

    // Sweeping sunset-lit volumetric clouds (warm peach-gold highlights & lavender undersides)
    const drawSunsetCloud = (cx: number, cy: number, sc: number, flip = 1) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(flip * sc, sc);

      ctx.fillStyle = 'rgba(128, 92, 146, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 14, 175, 26, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 222, 186, 0.88)';
      const puffs: [number, number, number, number][] = [
        [-95, 6, 62, 28],
        [-35, -14, 72, 44],
        [40, -6, 60, 36],
        [105, 8, 56, 24],
        [0, 10, 150, 22],
      ];
      for (const [ox, oy, rx, ry] of puffs) {
        ctx.beginPath();
        ctx.ellipse(ox, oy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    for (let i = 0; i < 9; i++) {
      drawSunsetCloud((i * 228 + 90) % w, 290 + (i % 3) * 76, 0.88 + (i % 3) * 0.24, i % 2 === 0 ? 1 : -1);
    }

    // Far dusty-violet Paris urban horizon with domes, mansard roofs & spires
    ctx.fillStyle = '#6b5b8c';
    for (let x = 0; x < w; x += 50) {
      const bh = 62 + ((x * 19 + 31) % 98);
      const bw = 44 + ((x * 7) % 14);
      ctx.fillRect(x, 712 - bh, bw, bh + 95);
      if ((x / 50) % 5 === 2) {
        // Distant dome silhouette
        ctx.beginPath();
        ctx.arc(x + bw * 0.5, 712 - bh, bw * 0.45, Math.PI, 0);
        ctx.fill();
      }
    }

    // Mid-depth warm plum-indigo Haussmann skyline silhouettes + tiny golden lit windows
    ctx.fillStyle = '#4b3f6e';
    for (let x = 14; x < w; x += 64) {
      const bh = 46 + ((x * 23 + 17) % 80);
      const bw = 52 + ((x * 11) % 16);
      ctx.fillRect(x, 718 - bh, bw, bh + 95);
      // Sloped mansard silhouette
      ctx.beginPath();
      ctx.moveTo(x - 2, 718 - bh);
      ctx.lineTo(x + 8, 718 - bh - 16);
      ctx.lineTo(x + bw - 8, 718 - bh - 16);
      ctx.lineTo(x + bw + 2, 718 - bh);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(253, 214, 128, 0.55)';
      for (let wy = 728 - bh; wy < 706; wy += 16) {
        ctx.fillRect(x + 10, wy, 5, 7);
        ctx.fillRect(x + bw - 16, wy, 5, 7);
      }
      ctx.fillStyle = '#4b3f6e';
    }
  });

  // RIVER TIMBER DOCK PLANKS
  const riverTimber = (() => {
    const [canvas, ctx] = makeCanvas(512, 512);
    ctx.fillStyle = '#784826';
    ctx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 64) {
      const shade = ((y * 17) % 24) - 12;
      ctx.fillStyle = `rgb(${128 + shade}, ${78 + Math.floor(shade * 0.7)}, ${42 + Math.floor(shade * 0.4)})`;
      ctx.fillRect(0, y + 2, 512, 60);
      ctx.fillStyle = 'rgba(40, 20, 8, 0.35)';
      ctx.fillRect(0, y, 512, 3);
      for (let k = 0; k < 20; k++) {
        ctx.fillStyle = 'rgba(55, 30, 12, 0.2)';
        ctx.fillRect((k * 53 + y) % 480, y + 10 + (k % 5) * 9, 44, 2);
      }
      // Bronze nail heads
      ctx.fillStyle = '#3b2313';
      ctx.fillRect(24, y + 16, 6, 6);
      ctx.fillRect(24, y + 42, 6, 6);
      ctx.fillRect(482, y + 16, 6, 6);
      ctx.fillRect(482, y + 42, 6, 6);
    }
    return finalizeColorTexture(canvas, maxAnisotropy, 2, 2);
  })();

  // RUSHING RAPIDS WHITE-WATER FOAM & SHALLOW TURQUOISE SURFACE
  const rapidsWaterSurface = (() => {
    const [canvas, ctx] = makeCanvas(512, 512);
    const g = ctx.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(0, '#2dd4bf');
    g.addColorStop(0.12, '#0891b2');
    g.addColorStop(0.35, '#0369a1');
    g.addColorStop(0.5, '#0284c7');
    g.addColorStop(0.65, '#0369a1');
    g.addColorStop(0.88, '#0891b2');
    g.addColorStop(1, '#2dd4bf');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle sunlit caustics & churning turquoise ribbons
    for (let i = 0; i < 190; i++) {
      const sx = (i * 89 + 13) % 512;
      const sy = (i * 137 + 7) % 512;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(103, 232, 249, 0.28)' : 'rgba(45, 212, 191, 0.24)';
      ctx.fillRect(sx, sy, 8 + (i % 10), 48 + (i % 38));
    }

    // Churning directional whitewater streaks along Y (-Z downstream)
    for (let i = 0; i < 310; i++) {
      const sx = (i * 67) % 512;
      const sy = (i * 113) % 512;
      const len = 32 + (i % 6) * 20;
      const isCenterFoam = sx > 95 && sx < 417;
      ctx.fillStyle =
        i % 3 === 0
          ? isCenterFoam
            ? 'rgba(248, 250, 252, 0.8)'
            : 'rgba(224, 242, 254, 0.56)'
          : 'rgba(125, 211, 252, 0.45)';
      ctx.fillRect(sx, sy, 2 + (i % 4), len);
    }

    // Frothy bank-edge surf foam lines
    for (let y = 0; y < 512; y += 14) {
      const wOff = Math.sin(y * 0.08) * 6;
      ctx.fillStyle = 'rgba(240, 249, 255, 0.42)';
      ctx.fillRect(6 + wOff, y, 12, 10);
      ctx.fillRect(494 - wOff, y, 12, 10);
    }
    return finalizeColorTexture(canvas, maxAnisotropy, 1, 22);
  })();

  // CALM LAKE SERENE TURQUOISE SURFACE
  const calmLakeSurface = (() => {
    const [canvas, ctx] = makeCanvas(512, 512);
    const g = ctx.createLinearGradient(0, 0, 512, 512);
    g.addColorStop(0, '#0f766e');
    g.addColorStop(0.5, '#14b8a6');
    g.addColorStop(1, '#0891b2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 180; i++) {
      const rx = (i * 97) % 512;
      const ry = (i * 151) % 512;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(204, 251, 241, 0.25)' : 'rgba(165, 243, 252, 0.2)';
      ctx.fillRect(rx, ry, 34 + (i % 24), 3);
    }
    return finalizeColorTexture(canvas, maxAnisotropy, 8, 8);
  })();

  // SUBMERGED SAND & COBBLESTONE RIVERBED (visible through shallow water edges)
  const rapidsRiverbed = (() => {
    const [canvas, ctx] = makeCanvas(512, 512);
    const g = ctx.createLinearGradient(0, 0, 512, 0);
    g.addColorStop(0, '#a38961');
    g.addColorStop(0.22, '#625e4b');
    g.addColorStop(0.5, '#314542');
    g.addColorStop(0.78, '#625e4b');
    g.addColorStop(1, '#a38961');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 420; i++) {
      const px = (i * 73 + 19) % 512;
      const py = (i * 131 + 29) % 512;
      const r = 4 + (i % 9);
      const tone = i % 4 === 0 ? '#78716c' : i % 4 === 1 ? '#57534e' : i % 4 === 2 ? '#4d7c46' : '#a8a29e';
      ctx.fillStyle = tone;
      ctx.beginPath();
      ctx.ellipse(px, py, r * 1.25, r * 0.85, (i * 0.7) % Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    return finalizeColorTexture(canvas, maxAnisotropy, 2, 22);
  })();

  // RAPIDS JUNGLE CANYON SKY (Matched to Selva Esmeralda bright azure sky, distant blue peak & rainforest ridges)
  const skyRapids = makePanoramicSky((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#1e66b0');
    g.addColorStop(0.32, '#5aa9e6');
    g.addColorStop(0.58, '#bde2f7');
    g.addColorStop(0.75, '#dcf0e8');
    g.addColorStop(1, '#1a4224');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Volumetric sunlit jungle clouds
    for (let i = 0; i < 16; i++) {
      const cx = (i * 157 + 60) % w;
      const cy = 235 + (i % 4) * 50;
      const sc = 0.85 + (i % 3) * 0.32;
      paintCloudBank(ctx, cx, cy + 8, sc, 'rgba(148, 178, 212, 0.38)');
      paintCloudBank(ctx, cx, cy, sc, 'rgba(255, 255, 255, 0.74)');
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

    // Lush emerald rainforest horizon ridges
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 18) {
      ctx.lineTo(x, 640 + Math.sin(x * 0.011 + 1.1) * 34 + Math.cos(x * 0.032) * 16);
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

  // PBR Roughness Data Maps (varying micro-specular response for stone, brushed metal, weathered wood, and polished ice)
  const makeRoughnessMap = (baseVal: number, variance: number, streaks: boolean): THREE.CanvasTexture => {
    const [rC, rCtx] = makeCanvas(256, 256);
    const v0 = Math.round(baseVal * 255);
    rCtx.fillStyle = `rgb(${v0},${v0},${v0})`;
    rCtx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 950; i++) {
      const rx = (i * 137 + 13) % 256;
      const ry = (i * 197 + 29) % 256;
      const delta = (((i * 73) % 100) / 100 - 0.5) * 2 * variance;
      const g = THREE.MathUtils.clamp(Math.round((baseVal + delta) * 255), 16, 245);
      rCtx.fillStyle = `rgba(${g},${g},${g},0.48)`;
      if (streaks) {
        rCtx.fillRect(rx, ry, 18 + (i % 24), 2 + (i % 3));
      } else {
        rCtx.fillRect(rx, ry, 4 + (i % 9), 4 + (i % 7));
      }
    }
    return finalizeDataTexture(rC, maxAnisotropy, 1, 1);
  };

  const stoneRoughness = makeRoughnessMap(0.84, 0.14, false);
  const metalRoughness = makeRoughnessMap(0.28, 0.14, true);
  const woodRoughness = makeRoughnessMap(0.74, 0.14, true);
  const iceRoughness = makeRoughnessMap(0.14, 0.11, true);

  return {
    techGrid,
    jungleGrass,
    jungleSide,
    jungleDirt,
    grassBump,
    jungleSideBump,
    jungleRuinStone,
    jungleRuinBump,
    jungleLeafTex,
    desertSandstone,
    desertSide,
    desertDirt,
    desertRuinStone,
    desertRuinBump,
    sandBump,
    stoneBump,
    iceCrystal,
    iceSide,
    iceBump,
    glacialRock,
    glacialRockBump,
    auroraCurtainTex,
    templeTop,
    templeSide,
    templeCarvedStone,
    templeCarvedBump,
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
    stoneRoughness,
    metalRoughness,
    woodRoughness,
    iceRoughness,
    contactShadow,
    skyJungle,
    skyTemple,
    skyDesert,
    skyIce,
    skyVolcanic,
    skyNebula,
    parisStone,
    parisRoof,
    parisFacade,
    parisFacadeEmissive,
    seineWaterSurface,
    skyParis,
    riverTimber,
    rapidsWaterSurface,
    calmLakeSurface,
    rapidsRiverbed,
    skyRapids,
  };
}

export function disposeProceduralTextures(tex: ProceduralTextures) {
  Object.values(tex).forEach((t) => {
    if (t && typeof t.dispose === 'function') {
      t.dispose();
    }
  });
}
