import * as THREE from 'three';
import { BossStyle, DestructibleKind, EnemyKind, ThrowableKind } from './types';
import { ProceduralTextures } from './textures';

export interface AstroBotRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  capeGroup: THREE.Group;
  leftEye: THREE.Mesh;
  rightEye: THREE.Mesh;
  hoverBeam: THREE.Mesh;
  spinRing: THREE.Mesh;
  thrusterLeft: THREE.Mesh;
  thrusterRight: THREE.Mesh;
  antennaTip: THREE.Mesh;
  bowMesh: THREE.Group;
  monkeyParts: THREE.Object3D[];
  monkeyTail: THREE.Group;
  astroParts: THREE.Object3D[];
  spiderParts: THREE.Object3D[];
  spiderEyeL: THREE.Mesh;
  spiderEyeR: THREE.Mesh;
  webShooterL: THREE.Mesh;
  webShooterR: THREE.Mesh;
  hulkParts: THREE.Object3D[];
  hulkFistL: THREE.Group;
  hulkFistR: THREE.Group;
  transformAura: THREE.Mesh;
  botRocketRig: THREE.Group;
}

export function createAstroBot(): AstroBotRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  // Original "Nova Explorer" Palette: Pearl-Titanium + Deep Cobalt + Warm Amber-Gold + Cyan Plasma
  const titaniumMat = new THREE.MeshPhysicalMaterial({
    color: 0xeff6ff,
    roughness: 0.22,
    metalness: 0.28,
    clearcoat: 0.9,
    clearcoatRoughness: 0.14,
  });

  const cobaltArmor = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    roughness: 0.26,
    metalness: 0.78,
  });

  const amberGold = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xb45309,
    emissiveIntensity: 0.35,
    roughness: 0.22,
    metalness: 0.85,
  });

  const darkCarbon = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.54,
    metalness: 0.38,
  });

  const visorGlass = new THREE.MeshPhysicalMaterial({
    color: 0x041226,
    roughness: 0.04,
    metalness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
  });

  const cyanGlow = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 2.35,
    roughness: 0.16,
  });

  const capeMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    emissive: 0x0369a1,
    emissiveIntensity: 0.32,
    roughness: 0.42,
    metalness: 0.25,
    side: THREE.DoubleSide,
  });

  const astroParts: THREE.Object3D[] = [];

  // Sculpted Torso Core & Layered Chest Armor
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.42, 12), titaniumMat);
  torso.position.y = 0.7;
  torso.castShadow = true;
  bodyGroup.add(torso);
  astroParts.push(torso);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.042, 8, 16), amberGold);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 0.9;
  bodyGroup.add(collar);
  astroParts.push(collar);

  const chestBevel = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.24, 6), cobaltArmor);
  chestBevel.rotation.y = Math.PI / 6;
  chestBevel.position.set(0, 0.74, 0.06);
  chestBevel.castShadow = true;
  bodyGroup.add(chestBevel);
  astroParts.push(chestBevel);

  const coreRing = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.022, 8, 16), amberGold);
  coreRing.position.set(0, 0.75, 0.23);
  bodyGroup.add(coreRing);
  astroParts.push(coreRing);

  const coreLight = new THREE.Mesh(new THREE.OctahedronGeometry(0.065, 0), cyanGlow);
  coreLight.scale.set(1, 1, 0.55);
  coreLight.position.set(0, 0.75, 0.24);
  bodyGroup.add(coreLight);
  astroParts.push(coreLight);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.075, 12), darkCarbon);
  belt.position.y = 0.51;
  bodyGroup.add(belt);
  astroParts.push(belt);

  // Twin-Turbine Vector Jetpack
  const pack = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.32, 8), darkCarbon);
  pack.scale.set(1.2, 1, 0.72);
  pack.position.set(0, 0.74, -0.22);
  pack.castShadow = true;
  bodyGroup.add(pack);
  astroParts.push(pack);

  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0);
  finShape.lineTo(0.2, 0.22);
  finShape.lineTo(0.05, 0.3);
  finShape.lineTo(-0.04, 0.08);
  finShape.closePath();
  const finGeo = new THREE.ExtrudeGeometry(finShape, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01 });
  const finL = new THREE.Mesh(finGeo, amberGold);
  finL.position.set(-0.18, 0.76, -0.25);
  finL.rotation.set(0.2, -0.45, 0.35);
  const finR = finL.clone();
  finR.scale.x = -1;
  finR.position.x = 0.18;
  finR.rotation.set(0.2, 0.45, -0.35);
  bodyGroup.add(finL, finR);
  astroParts.push(finL, finR);

  const nozzleGeo = new THREE.CylinderGeometry(0.06, 0.082, 0.14, 12);
  const nozzleL = new THREE.Mesh(nozzleGeo, amberGold);
  nozzleL.position.set(-0.12, 0.55, -0.24);
  const nozzleR = new THREE.Mesh(nozzleGeo, amberGold);
  nozzleR.position.set(0.12, 0.55, -0.24);
  bodyGroup.add(nozzleL, nozzleR);
  astroParts.push(nozzleL, nozzleR);

  const thrusterLeft = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 12), cyanGlow);
  thrusterLeft.rotation.x = Math.PI;
  thrusterLeft.position.set(-0.12, 0.39, -0.24);
  thrusterLeft.visible = false;
  bodyGroup.add(thrusterLeft);

  const thrusterRight = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 12), cyanGlow);
  thrusterRight.rotation.x = Math.PI;
  thrusterRight.position.set(0.12, 0.39, -0.24);
  thrusterRight.visible = false;
  bodyGroup.add(thrusterRight);

  // Flowing Split-Tail Energy Scarf / Cape
  const capeGroup = new THREE.Group();
  capeGroup.position.set(0, 0.88, -0.25);
  const capeShape = new THREE.Shape();
  capeShape.moveTo(-0.18, 0);
  capeShape.lineTo(0.18, 0);
  capeShape.lineTo(0.32, -0.52);
  capeShape.lineTo(0.12, -0.66);
  capeShape.lineTo(0, -0.5);
  capeShape.lineTo(-0.12, -0.66);
  capeShape.lineTo(-0.32, -0.52);
  capeShape.closePath();
  const capeMesh = new THREE.Mesh(new THREE.ShapeGeometry(capeShape), capeMat);
  capeMesh.rotation.x = 0.22;
  capeGroup.add(capeMesh);
  bodyGroup.add(capeGroup);
  astroParts.push(capeGroup);

  // Original Angular Aero-Explorer Helmet (Faceted crown + swept side telemetry fins + panoramic visor)
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.18, 0);
  bodyGroup.add(headGroup);

  const helmetBase = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 1), titaniumMat);
  helmetBase.scale.set(1.06, 0.95, 1.08);
  helmetBase.castShadow = true;
  headGroup.add(helmetBase);
  astroParts.push(helmetBase);

  // Cobalt Aero-Hood Crest sweeping back
  const hoodCrest = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.52, 6), cobaltArmor);
  hoodCrest.rotation.x = Math.PI / 2 - 0.16;
  hoodCrest.position.set(0, 0.28, -0.08);
  headGroup.add(hoodCrest);
  astroParts.push(hoodCrest);

  // Twin Swept Telemetry Ear Fins (Gold + Cyan accent)
  for (const sx of [-1, 1]) {
    const earPod = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.1, 6), cobaltArmor);
    earPod.rotation.z = Math.PI / 2;
    earPod.position.set(sx * 0.36, 0.02, -0.02);

    const earWing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.15), amberGold);
    earWing.position.set(sx * 0.42, 0.14, -0.1);
    earWing.rotation.set(-0.42, 0, -sx * 0.18);

    const earGlow = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.05), cyanGlow);
    earGlow.position.set(sx * 0.43, 0.04, 0.05);
    headGroup.add(earPod, earWing, earGlow);
    astroParts.push(earPod, earWing, earGlow);
  }

  // Panoramic Angular Visor + Amber Rim
  const visorBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.29, 0.25, 8, 1, false, -Math.PI * 0.36, Math.PI * 0.72), amberGold);
  visorBezel.position.set(0, 0.01, 0.09);
  headGroup.add(visorBezel);
  astroParts.push(visorBezel);

  const visorFront = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.3, 0.21, 12, 1, false, -Math.PI * 0.33, Math.PI * 0.66), visorGlass);
  visorFront.position.set(0, 0.01, 0.11);
  headGroup.add(visorFront);
  astroParts.push(visorFront);

  // Expressive Hex-Cut Optic Eyes
  const eyeGeo = new THREE.BoxGeometry(0.085, 0.095, 0.05);
  const leftEye = new THREE.Mesh(eyeGeo, cyanGlow);
  leftEye.position.set(-0.11, 0.02, 0.38);
  leftEye.rotation.y = -0.22;
  headGroup.add(leftEye);
  astroParts.push(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, cyanGlow);
  rightEye.position.set(0.11, 0.02, 0.38);
  rightEye.rotation.y = 0.22;
  headGroup.add(rightEye);
  astroParts.push(rightEye);

  // Orbital Compass Antenna
  const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.22, 8), amberGold);
  antennaStem.position.set(0, 0.42, -0.06);
  antennaStem.rotation.x = -0.22;
  headGroup.add(antennaStem);
  astroParts.push(antennaStem);

  const antennaTip = new THREE.Mesh(new THREE.OctahedronGeometry(0.072, 0), cyanGlow);
  antennaTip.position.set(0, 0.54, -0.09);
  headGroup.add(antennaTip);
  astroParts.push(antennaTip);

  // Articulated Arms with Angular Pauldrons & Gauntlets
  const makeArm = (side: number) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.32, 0.84, 0);
    const pauldron = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.12, 6), cobaltArmor);
    pauldron.rotation.z = -side * 0.35;
    arm.add(pauldron);

    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.17, 6, 10), darkCarbon);
    upper.position.y = -0.15;
    upper.castShadow = true;
    arm.add(upper);

    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.068, 0.07, 8), amberGold);
    cuff.position.y = -0.24;
    arm.add(cuff);

    const glove = new THREE.Mesh(new THREE.DodecahedronGeometry(0.095, 0), titaniumMat);
    glove.position.y = -0.32;
    glove.castShadow = true;
    arm.add(glove);
    astroParts.push(pauldron, upper, cuff, glove);
    return arm;
  };
  const leftArm = makeArm(-1);
  const rightArm = makeArm(1);
  bodyGroup.add(leftArm, rightArm);

  // Equipped Energy Bow on leftArm (hidden until collected)
  const bowMesh = createBowMesh();
  bowMesh.position.set(-0.08, -0.31, 0.14);
  bowMesh.rotation.set(0.15, 0, 0.25);
  bowMesh.scale.setScalar(0.78);
  bowMesh.visible = false;
  leftArm.add(bowMesh);

  // Articulated Legs & Thruster Sabatons
  const makeLeg = (side: number) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.13, 0.45, 0);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.078, 0.25, 8), darkCarbon);
    shin.position.y = -0.15;
    shin.castShadow = true;
    leg.add(shin);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.14, 0.26), titaniumMat);
    boot.position.set(0, -0.35, 0.04);
    boot.castShadow = true;
    leg.add(boot);

    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.27), cobaltArmor);
    sole.position.set(0, -0.435, 0.04);
    leg.add(sole);

    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.18), cyanGlow);
    vent.position.set(0, -0.455, 0.04);
    leg.add(vent);
    astroParts.push(shin, boot, sole, vent);

    return leg;
  };
  const leftLeg = makeLeg(-1);
  const rightLeg = makeLeg(1);
  bodyGroup.add(leftLeg, rightLeg);

  // Hover Laser Beam Cone
  const beamGeo = new THREE.ConeGeometry(0.58, 2.9, 18, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const hoverBeam = new THREE.Mesh(beamGeo, beamMat);
  hoverBeam.position.set(0, -1.35, 0);
  hoverBeam.visible = false;
  root.add(hoverBeam);

  // Spin Attack Ring
  const spinGeo = new THREE.TorusGeometry(1.05, 0.09, 10, 32);
  const spinMat = new THREE.MeshBasicMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const spinRing = new THREE.Mesh(spinGeo, spinMat);
  spinRing.rotation.x = Math.PI / 2;
  spinRing.position.y = 0.65;
  spinRing.visible = false;
  root.add(spinRing);

  // Monkey Suit Costume Parts (hidden until collected)
  const monkeyParts: THREE.Object3D[] = [];
  const monkeyFurMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.72, metalness: 0.08 });
  const monkeySkinMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.52, metalness: 0.04 });
  const monkeyEmeraldMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.7,
    roughness: 0.25,
    metalness: 0.6,
  });

  const monkeyHood = new THREE.Mesh(
    new THREE.SphereGeometry(0.415, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.62),
    monkeyFurMat
  );
  monkeyHood.rotation.x = -0.18;
  monkeyHood.visible = false;
  headGroup.add(monkeyHood);
  monkeyParts.push(monkeyHood);

  const mEarOuterGeo = new THREE.SphereGeometry(0.15, 14, 12);
  const mEarInnerGeo = new THREE.SphereGeometry(0.095, 12, 10);
  const mEarL = new THREE.Mesh(mEarOuterGeo, monkeyFurMat);
  mEarL.scale.set(0.45, 1.0, 0.95);
  mEarL.position.set(-0.46, 0.08, -0.02);
  mEarL.visible = false;
  const mEarLIn = new THREE.Mesh(mEarInnerGeo, monkeySkinMat);
  mEarLIn.scale.set(0.5, 0.9, 0.9);
  mEarLIn.position.set(-0.04, 0, 0.04);
  mEarL.add(mEarLIn);
  headGroup.add(mEarL);
  monkeyParts.push(mEarL);

  const mEarR = mEarL.clone();
  mEarR.position.set(0.46, 0.08, -0.02);
  mEarR.children[0].position.set(0.04, 0, 0.04);
  mEarR.visible = false;
  headGroup.add(mEarR);
  monkeyParts.push(mEarR);

  const bandana = new THREE.Mesh(new THREE.TorusGeometry(0.375, 0.045, 8, 22), monkeyEmeraldMat);
  bandana.rotation.x = Math.PI / 2 - 0.14;
  bandana.position.set(0, 0.2, 0.02);
  bandana.visible = false;
  headGroup.add(bandana);
  monkeyParts.push(bandana);

  const harness = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.34), monkeyFurMat);
  harness.position.set(0, 0.68, 0.02);
  harness.visible = false;
  bodyGroup.add(harness);
  monkeyParts.push(harness);

  const beltBuckle = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), monkeyEmeraldMat);
  beltBuckle.position.set(0, 0.56, 0.26);
  beltBuckle.visible = false;
  bodyGroup.add(beltBuckle);
  monkeyParts.push(beltBuckle);

  const gripGloveGeo = new THREE.SphereGeometry(0.125, 12, 12);
  const mGloveL = new THREE.Mesh(gripGloveGeo, monkeyEmeraldMat);
  mGloveL.position.y = -0.32;
  mGloveL.visible = false;
  leftArm.add(mGloveL);
  monkeyParts.push(mGloveL);

  const mGloveR = new THREE.Mesh(gripGloveGeo, monkeyEmeraldMat);
  mGloveR.position.y = -0.32;
  mGloveR.visible = false;
  rightArm.add(mGloveR);
  monkeyParts.push(mGloveR);

  const monkeyTail = new THREE.Group();
  monkeyTail.position.set(0, 0.5, -0.24);
  const tailSeg1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.042, 0.32, 6, 10), monkeyFurMat);
  tailSeg1.rotation.x = -0.95;
  tailSeg1.position.set(0, 0.1, -0.18);
  const tailSeg2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.28, 6, 10), monkeyFurMat);
  tailSeg2.rotation.x = 0.55;
  tailSeg2.position.set(0, 0.32, -0.36);
  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), monkeySkinMat);
  tailTip.position.set(0, 0.45, -0.28);
  monkeyTail.add(tailSeg1, tailSeg2, tailTip);
  monkeyTail.visible = false;
  bodyGroup.add(monkeyTail);
  monkeyParts.push(monkeyTail);

  // Full Spider-Man Transformation Suit (sculpted red-webbed + cobalt-blue suit, large white angular eyes, chest/back spider emblems, wrist web-shooters)
  const spiderParts: THREE.Object3D[] = [];
  const webCanvas = document.createElement('canvas');
  webCanvas.width = 256;
  webCanvas.height = 256;
  const wCtx = webCanvas.getContext('2d')!;
  const wGrad = wCtx.createLinearGradient(0, 0, 0, 256);
  wGrad.addColorStop(0, '#ef4444');
  wGrad.addColorStop(0.5, '#dc2626');
  wGrad.addColorStop(1, '#b91c1c');
  wCtx.fillStyle = wGrad;
  wCtx.fillRect(0, 0, 256, 256);
  wCtx.strokeStyle = '#111827';
  wCtx.lineWidth = 2.6;
  for (let c = 0; c <= 8; c++) {
    wCtx.beginPath();
    wCtx.moveTo(c * 32, 0);
    wCtx.lineTo(c * 32, 256);
    wCtx.stroke();
  }
  for (let r = 0; r < 8; r++) {
    const y0 = r * 32;
    for (let c = 0; c < 8; c++) {
      const x0 = c * 32;
      wCtx.beginPath();
      wCtx.moveTo(x0, y0);
      wCtx.quadraticCurveTo(x0 + 16, y0 + 13, x0 + 32, y0);
      wCtx.stroke();
    }
  }
  const webTex = new THREE.CanvasTexture(webCanvas);
  webTex.colorSpace = THREE.SRGBColorSpace;
  webTex.wrapS = THREE.RepeatWrapping;
  webTex.wrapT = THREE.RepeatWrapping;

  const spiderRedMat = new THREE.MeshPhysicalMaterial({
    map: webTex,
    roughness: 0.34,
    metalness: 0.08,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
  });
  const spiderBlueMat = new THREE.MeshPhysicalMaterial({
    color: 0x1d4ed8,
    roughness: 0.38,
    metalness: 0.1,
    clearcoat: 0.28,
  });
  const spiderBlackMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.35,
    metalness: 0.25,
  });
  const spiderWhiteEyeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe0f2fe,
    emissiveIntensity: 0.72,
    roughness: 0.14,
    metalness: 0.05,
  });
  const webShooterSilverMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    metalness: 0.85,
    roughness: 0.22,
  });

  // Spider-Man Sculpted Masked Head + Large Iconic White Angular Eyes
  const spHeadMask = new THREE.Mesh(new THREE.SphereGeometry(0.345, 24, 20), spiderRedMat);
  spHeadMask.scale.set(0.95, 1.03, 1.02);
  spHeadMask.castShadow = true;
  spHeadMask.visible = false;
  headGroup.add(spHeadMask);
  spiderParts.push(spHeadMask);

  const makeSpiderEyeShape = (w: number, h: number) => {
    const s = new THREE.Shape();
    s.moveTo(-w * 0.45, -h * 0.28);
    s.quadraticCurveTo(0, -h * 0.45, w * 0.5, -h * 0.05);
    s.quadraticCurveTo(w * 0.46, h * 0.46, w * 0.08, h * 0.48);
    s.quadraticCurveTo(-w * 0.42, h * 0.24, -w * 0.45, -h * 0.28);
    return s;
  };
  const spEyeFrameGeo = new THREE.ExtrudeGeometry(makeSpiderEyeShape(0.24, 0.19), {
    depth: 0.032,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.008,
    bevelSegments: 2,
  });
  const spEyeLensGeo = new THREE.ExtrudeGeometry(makeSpiderEyeShape(0.185, 0.135), {
    depth: 0.025,
    bevelEnabled: false,
  });

  const spEyeFrameL = new THREE.Mesh(spEyeFrameGeo, spiderBlackMat);
  spEyeFrameL.position.set(-0.145, 0.03, 0.305);
  spEyeFrameL.rotation.set(-0.08, -0.34, -0.34);
  spEyeFrameL.scale.x = -1;
  spEyeFrameL.visible = false;
  headGroup.add(spEyeFrameL);
  spiderParts.push(spEyeFrameL);

  const spiderEyeL = new THREE.Mesh(spEyeLensGeo, spiderWhiteEyeMat);
  spiderEyeL.position.set(-0.145, 0.03, 0.318);
  spiderEyeL.rotation.set(-0.08, -0.34, -0.34);
  spiderEyeL.scale.x = -1;
  spiderEyeL.visible = false;
  headGroup.add(spiderEyeL);
  spiderParts.push(spiderEyeL);

  const spEyeFrameR = new THREE.Mesh(spEyeFrameGeo, spiderBlackMat);
  spEyeFrameR.position.set(0.145, 0.03, 0.305);
  spEyeFrameR.rotation.set(-0.08, 0.34, 0.34);
  spEyeFrameR.visible = false;
  headGroup.add(spEyeFrameR);
  spiderParts.push(spEyeFrameR);

  const spiderEyeR = new THREE.Mesh(spEyeLensGeo, spiderWhiteEyeMat);
  spiderEyeR.position.set(0.145, 0.03, 0.318);
  spiderEyeR.rotation.set(-0.08, 0.34, 0.34);
  spiderEyeR.visible = false;
  headGroup.add(spiderEyeR);
  spiderParts.push(spiderEyeR);

  // Athletic Red & Cobalt Torso + Chest/Back Spider Emblems
  const spWaist = new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.175, 0.43, 14), spiderBlueMat);
  spWaist.position.y = 0.7;
  spWaist.castShadow = true;
  spWaist.visible = false;
  bodyGroup.add(spWaist);
  spiderParts.push(spWaist);

  const spChest = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.185, 0.26, 12), spiderRedMat);
  spChest.scale.set(1.06, 1, 0.92);
  spChest.position.set(0, 0.78, 0.02);
  spChest.castShadow = true;
  spChest.visible = false;
  bodyGroup.add(spChest);
  spiderParts.push(spChest);

  const spBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.186, 0.186, 0.072, 14), spiderRedMat);
  spBelt.position.y = 0.525;
  spBelt.visible = false;
  bodyGroup.add(spBelt);
  spiderParts.push(spBelt);

  const buildSpiderEmblem = (mat: THREE.Material) => {
    const em = new THREE.Group();
    const abd = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), mat);
    abd.scale.set(0.8, 1.35, 0.5);
    const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), mat);
    thorax.position.y = 0.052;
    em.add(abd, thorax);
    const legGeo = new THREE.BoxGeometry(0.085, 0.014, 0.015);
    for (const sx of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(legGeo, mat);
        leg.position.set(sx * 0.052, (i - 1.5) * 0.028 + 0.02, 0);
        leg.rotation.z = sx * (i < 2 ? -0.58 + i * 0.25 : 0.45 - (i - 2) * 0.22);
        em.add(leg);
      }
    }
    return em;
  };

  const frontEmblem = buildSpiderEmblem(spiderBlackMat);
  frontEmblem.position.set(0, 0.76, 0.215);
  frontEmblem.visible = false;
  bodyGroup.add(frontEmblem);
  spiderParts.push(frontEmblem);

  const backEmblem = buildSpiderEmblem(spiderRedMat);
  backEmblem.scale.setScalar(1.25);
  backEmblem.position.set(0, 0.76, -0.205);
  backEmblem.rotation.y = Math.PI;
  backEmblem.visible = false;
  bodyGroup.add(backEmblem);
  spiderParts.push(backEmblem);

  // Spider-Man Sculpted Limbs + Wrist Web-Shooters
  const addSpiderArmParts = (arm: THREE.Group): THREE.Mesh => {
    const spShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), spiderRedMat);
    spShoulder.visible = false;
    arm.add(spShoulder);
    spiderParts.push(spShoulder);

    const spUpper = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.16, 6, 10), spiderBlueMat);
    spUpper.position.y = -0.14;
    spUpper.castShadow = true;
    spUpper.visible = false;
    arm.add(spUpper);
    spiderParts.push(spUpper);

    const spForearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.13, 6, 10), spiderRedMat);
    spForearm.position.y = -0.25;
    spForearm.visible = false;
    arm.add(spForearm);
    spiderParts.push(spForearm);

    const spHand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 10), spiderRedMat);
    spHand.position.y = -0.35;
    spHand.visible = false;
    arm.add(spHand);
    spiderParts.push(spHand);

    const shooter = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.055, 10), webShooterSilverMat);
    shooter.position.y = -0.27;
    shooter.visible = false;
    const nozzle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.055), spiderBlackMat);
    nozzle.position.set(0, -0.01, 0.068);
    shooter.add(nozzle);
    arm.add(shooter);
    spiderParts.push(shooter);
    return shooter;
  };
  const webShooterL = addSpiderArmParts(leftArm);
  const webShooterR = addSpiderArmParts(rightArm);

  const addSpiderLegParts = (leg: THREE.Group) => {
    const spThigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.074, 0.18, 6, 10), spiderBlueMat);
    spThigh.position.y = -0.14;
    spThigh.castShadow = true;
    spThigh.visible = false;
    leg.add(spThigh);
    spiderParts.push(spThigh);

    const spBoot = new THREE.Mesh(new THREE.CapsuleGeometry(0.076, 0.14, 6, 10), spiderRedMat);
    spBoot.position.y = -0.31;
    spBoot.visible = false;
    leg.add(spBoot);
    spiderParts.push(spBoot);

    const spFoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.24), spiderRedMat);
    spFoot.position.set(0, -0.4, 0.045);
    spFoot.castShadow = true;
    spFoot.visible = false;
    leg.add(spFoot);
    spiderParts.push(spFoot);

    const spSole = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.032, 0.245), spiderBlackMat);
    spSole.position.set(0, -0.45, 0.045);
    spSole.visible = false;
    leg.add(spSole);
    spiderParts.push(spSole);
  };
  addSpiderLegParts(leftLeg);
  addSpiderLegParts(rightLeg);

  // Full Hulk Transformation Suit (massive green musculature, giant clenched fists, purple tattered pants, furrowed brow & heavy jaw)
  const hulkParts: THREE.Object3D[] = [];
  const hulkSkinMat = new THREE.MeshStandardMaterial({
    color: 0x3b8c25,
    roughness: 0.48,
    metalness: 0.04,
  });
  const hulkMuscleShadeMat = new THREE.MeshStandardMaterial({
    color: 0x2c6e1b,
    roughness: 0.52,
    metalness: 0.04,
  });
  const hulkPantsMat = new THREE.MeshStandardMaterial({
    color: 0x6d28d9,
    roughness: 0.72,
    metalness: 0.05,
  });
  const hulkHairMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.78,
    metalness: 0.06,
  });
  const hulkEyeMat = new THREE.MeshStandardMaterial({
    color: 0xd9f99d,
    emissive: 0x84cc16,
    emissiveIntensity: 1.55,
    roughness: 0.15,
  });

  // Hulk Sculpted Head with massive square jaw, heavy brow & dark hair
  const hkCranium = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 16), hulkSkinMat);
  hkCranium.scale.set(1.04, 0.96, 1.0);
  hkCranium.position.y = 0.06;
  hkCranium.castShadow = true;
  hkCranium.visible = false;
  headGroup.add(hkCranium);
  hulkParts.push(hkCranium);

  const hkJaw = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.24, 0.42), hulkSkinMat);
  hkJaw.position.set(0, -0.1, 0.06);
  hkJaw.castShadow = true;
  hkJaw.visible = false;
  headGroup.add(hkJaw);
  hulkParts.push(hkJaw);

  const hkBrow = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.09, 0.16), hulkMuscleShadeMat);
  hkBrow.position.set(0, 0.13, 0.26);
  hkBrow.rotation.x = 0.22;
  hkBrow.visible = false;
  headGroup.add(hkBrow);
  hulkParts.push(hkBrow);

  const hkHair = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.56), hulkHairMat);
  hkHair.position.set(0, 0.28, -0.02);
  hkHair.visible = false;
  headGroup.add(hkHair);
  hulkParts.push(hkHair);

  for (let h = -2; h <= 2; h++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.2, 6), hulkHairMat);
    spike.position.set(h * 0.1, 0.34, 0.18 - Math.abs(h) * 0.04);
    spike.rotation.x = 0.48;
    spike.visible = false;
    headGroup.add(spike);
    hulkParts.push(spike);
  }

  const hkEyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.045, 0.05), hulkEyeMat);
  hkEyeL.position.set(-0.11, 0.07, 0.3);
  hkEyeL.rotation.z = -0.18;
  hkEyeL.visible = false;
  const hkEyeR = hkEyeL.clone();
  hkEyeR.position.x = 0.11;
  hkEyeR.rotation.z = 0.18;
  headGroup.add(hkEyeL, hkEyeR);
  hulkParts.push(hkEyeL, hkEyeR);

  // Gritted fierce mouth
  const hkMouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.045, 0.04),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
  );
  hkMouth.position.set(0, -0.1, 0.27);
  hkMouth.visible = false;
  headGroup.add(hkMouth);
  hulkParts.push(hkMouth);

  // Massive Hulking Chest, Traps, Pectorals, Abs & Purple Tattered Shorts Waist
  const hkTorsoMain = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.29, 0.54, 12), hulkSkinMat);
  hkTorsoMain.scale.set(1.18, 1.0, 0.92);
  hkTorsoMain.position.set(0, 0.78, 0.01);
  hkTorsoMain.castShadow = true;
  hkTorsoMain.visible = false;
  bodyGroup.add(hkTorsoMain);
  hulkParts.push(hkTorsoMain);

  const hkTraps = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 12), hulkMuscleShadeMat);
  hkTraps.scale.set(1.45, 0.72, 0.92);
  hkTraps.position.set(0, 0.98, -0.02);
  hkTraps.visible = false;
  bodyGroup.add(hkTraps);
  hulkParts.push(hkTraps);

  for (const sx of [-1, 1]) {
    const pec = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), hulkSkinMat);
    pec.scale.set(1.1, 0.85, 0.72);
    pec.position.set(sx * 0.19, 0.84, 0.24);
    pec.visible = false;
    bodyGroup.add(pec);
    hulkParts.push(pec);
  }

  for (let row = 0; row < 3; row++) {
    for (const sx of [-0.09, 0.09]) {
      const ab = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), hulkMuscleShadeMat);
      ab.scale.set(1.05, 0.78, 0.65);
      ab.position.set(sx, 0.68 - row * 0.085, 0.26);
      ab.visible = false;
      bodyGroup.add(ab);
      hulkParts.push(ab);
    }
  }

  const hkPelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.33, 0.24, 12), hulkPantsMat);
  hkPelvis.scale.set(1.12, 1, 0.95);
  hkPelvis.position.set(0, 0.45, 0);
  hkPelvis.castShadow = true;
  hkPelvis.visible = false;
  bodyGroup.add(hkPelvis);
  hulkParts.push(hkPelvis);

  // Huge Muscular Arms + Oversized Clenched Fists
  const addHulkArmParts = (arm: THREE.Group, side: number): THREE.Group => {
    const offsetX = side * 0.21;
    const delt = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), hulkSkinMat);
    delt.position.set(offsetX * 0.8, 0.04, 0);
    delt.castShadow = true;
    delt.visible = false;
    arm.add(delt);
    hulkParts.push(delt);

    const bicep = new THREE.Mesh(new THREE.CapsuleGeometry(0.145, 0.22, 6, 12), hulkSkinMat);
    bicep.position.set(offsetX, -0.17, 0);
    bicep.castShadow = true;
    bicep.visible = false;
    arm.add(bicep);
    hulkParts.push(bicep);

    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.155, 0.22, 6, 12), hulkMuscleShadeMat);
    forearm.position.set(offsetX * 1.05, -0.37, 0.02);
    forearm.castShadow = true;
    forearm.visible = false;
    arm.add(forearm);
    hulkParts.push(forearm);

    const fist = new THREE.Group();
    fist.position.set(offsetX * 1.05, -0.54, 0.04);
    fist.visible = false;
    const fistBlock = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.25, 0.28), hulkSkinMat);
    fistBlock.castShadow = true;
    fist.add(fistBlock);
    for (let k = -1; k <= 1; k++) {
      const knuckle = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), hulkMuscleShadeMat);
      knuckle.position.set(k * 0.075, -0.05, 0.13);
      fist.add(knuckle);
    }
    arm.add(fist);
    hulkParts.push(fist);
    return fist;
  };
  const hulkFistL = addHulkArmParts(leftArm, -1);
  const hulkFistR = addHulkArmParts(rightArm, 1);

  // Powerful Thighs in Purple Tattered Pants + Huge Green Calves & Bare Feet
  const addHulkLegParts = (leg: THREE.Group, side: number) => {
    const offsetX = side * 0.07;
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.165, 0.22, 6, 12), hulkPantsMat);
    thigh.position.set(offsetX, -0.12, 0);
    thigh.castShadow = true;
    thigh.visible = false;
    leg.add(thigh);
    hulkParts.push(thigh);

    // Jagged torn pants cuff flaps
    for (let t = 0; t < 4; t++) {
      const ang = (t / 4) * Math.PI * 2 + side * 0.4;
      const shred = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 4), hulkPantsMat);
      shred.rotation.x = Math.PI;
      shred.position.set(offsetX + Math.cos(ang) * 0.13, -0.27, Math.sin(ang) * 0.13);
      shred.visible = false;
      leg.add(shred);
      hulkParts.push(shred);
    }

    const calf = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.18, 6, 12), hulkSkinMat);
    calf.position.set(offsetX, -0.32, 0);
    calf.castShadow = true;
    calf.visible = false;
    leg.add(calf);
    hulkParts.push(calf);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.13, 0.34), hulkMuscleShadeMat);
    foot.position.set(offsetX, -0.44, 0.06);
    foot.castShadow = true;
    foot.visible = false;
    leg.add(foot);
    hulkParts.push(foot);
  };
  addHulkLegParts(leftLeg, -1);
  addHulkLegParts(rightLeg, 1);

  // Transformation Energy Cocoon Sphere (animated during Level 09 start transformation)
  const transformAura = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.95, 1),
    new THREE.MeshBasicMaterial({
      color: 0xef4444,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  transformAura.position.y = 0.78;
  transformAura.visible = false;
  root.add(transformAura);

  // Emergency Companion Drone Rocket Rescue Booster beneath boots
  const botRocketRig = new THREE.Group();
  botRocketRig.position.set(0, -0.32, 0);
  botRocketRig.visible = false;

  const rescueHead = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), titaniumMat);
  rescueHead.position.y = 0.22;
  const rescueVisor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.14), visorGlass);
  rescueVisor.position.set(0, 0.22, 0.19);
  const rescueEyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.04);
  const rescueEyeL = new THREE.Mesh(rescueEyeGeo, cyanGlow);
  rescueEyeL.position.set(-0.07, 0.23, 0.26);
  const rescueEyeR = new THREE.Mesh(rescueEyeGeo, cyanGlow);
  rescueEyeR.position.set(0.07, 0.23, 0.26);

  const rescueCore = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.34, 10), amberGold);
  rescueCore.position.y = -0.02;
  const rescueFlameMat = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.9 });
  const rescueInnerMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.92 });
  const rFlameOuter = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.95, 12), rescueFlameMat);
  rFlameOuter.rotation.x = Math.PI;
  rFlameOuter.position.y = -0.62;
  const rFlameInner = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.65, 10), rescueInnerMat);
  rFlameInner.rotation.x = Math.PI;
  rFlameInner.position.y = -0.5;
  botRocketRig.add(rescueHead, rescueVisor, rescueEyeL, rescueEyeR, rescueCore, rFlameOuter, rFlameInner);
  root.add(botRocketRig);

  return {
    root,
    bodyGroup,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    capeGroup,
    leftEye,
    rightEye,
    hoverBeam,
    spinRing,
    thrusterLeft,
    thrusterRight,
    antennaTip,
    bowMesh,
    monkeyParts,
    monkeyTail,
    astroParts,
    spiderParts,
    spiderEyeL,
    spiderEyeR,
    webShooterL,
    webShooterR,
    hulkParts,
    hulkFistL,
    hulkFistR,
    transformAura,
    botRocketRig,
  };
}

export interface RocketVehicleRig {
  root: THREE.Group;
  hullGroup: THREE.Group;
  flameL: THREE.Mesh;
  flameR: THREE.Mesh;
  seatAnchor: THREE.Vector3;
}

export function createRocketVehicle(): RocketVehicleRig {
  const root = new THREE.Group();
  const hullGroup = new THREE.Group();
  root.add(hullGroup);

  // Original "Vértice MK-II" Orbital Interceptor Starfighter
  const titaniumMat = new THREE.MeshPhysicalMaterial({
    color: 0xf1f5f9,
    roughness: 0.16,
    metalness: 0.24,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });
  const cobaltMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    roughness: 0.24,
    metalness: 0.82,
  });
  const copperMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.22,
    metalness: 0.86,
  });
  const darkTrim = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.45,
    metalness: 0.45,
  });
  const canopyGlass = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    roughness: 0.06,
    metalness: 0.14,
    transparent: true,
    opacity: 0.5,
    clearcoat: 1.0,
  });
  const plasmaMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.92,
  });

  // Tapered needle nose & sleek orbital hull (-Z forward)
  const pts = [
    new THREE.Vector2(0.01, 1.85),
    new THREE.Vector2(0.24, 1.3),
    new THREE.Vector2(0.48, 0.35),
    new THREE.Vector2(0.46, -0.75),
    new THREE.Vector2(0.32, -1.32),
    new THREE.Vector2(0.01, -1.32),
  ];
  const fuselageGeo = new THREE.LatheGeometry(pts, 16);
  fuselageGeo.rotateX(-Math.PI / 2);
  const fuselage = new THREE.Mesh(fuselageGeo, titaniumMat);
  fuselage.position.y = 0.62;
  fuselage.castShadow = true;
  hullGroup.add(fuselage);

  const noseRing = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.048, 8, 18), copperMat);
  noseRing.position.set(0, 0.62, -1.05);
  hullGroup.add(noseRing);

  // Forward Canard Stabilizers
  const canardShape = new THREE.Shape();
  canardShape.moveTo(0.24, 0.15);
  canardShape.lineTo(0.75, -0.15);
  canardShape.lineTo(0.72, -0.35);
  canardShape.lineTo(0.22, -0.25);
  canardShape.closePath();
  const canardGeo = new THREE.ExtrudeGeometry(canardShape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015 });
  canardGeo.rotateX(-Math.PI / 2);
  const canardR = new THREE.Mesh(canardGeo, copperMat);
  canardR.position.set(0, 0.58, -0.95);
  const canardL = canardR.clone();
  canardL.scale.x = -1;
  hullGroup.add(canardR, canardL);

  // Gull-Swept Main Wings with Dorsal Fin
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0.42, 0.25);
  wingShape.lineTo(1.75, -0.45);
  wingShape.lineTo(1.55, -0.98);
  wingShape.lineTo(0.36, -0.82);
  wingShape.closePath();
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
  });
  wingGeo.rotateX(-Math.PI / 2);

  const rightWing = new THREE.Mesh(wingGeo, cobaltMat);
  rightWing.position.set(0, 0.56, 0.1);
  rightWing.rotation.z = 0.08;
  rightWing.castShadow = true;
  const leftWing = rightWing.clone();
  leftWing.scale.x = -1;
  leftWing.rotation.z = -0.08;
  hullGroup.add(rightWing, leftWing);

  // Dorsal Tail Fin
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.58, 0.72), cobaltMat);
  tailFin.position.set(0, 1.05, 0.85);
  tailFin.rotation.x = 0.35;
  hullGroup.add(tailFin);

  // Wingtip Plasma Rails
  const railGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.75, 8);
  railGeo.rotateX(Math.PI / 2);
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 2.0,
  });
  const railL = new THREE.Mesh(railGeo, railMat);
  railL.position.set(-1.66, 0.7, 0.75);
  const railR = new THREE.Mesh(railGeo, railMat);
  railR.position.set(1.66, 0.7, 0.75);
  hullGroup.add(railL, railR);

  // Cockpit Windshield Canopy
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), canopyGlass);
  canopy.scale.set(0.85, 0.82, 1.55);
  canopy.position.set(0, 0.94, -0.18);
  hullGroup.add(canopy);

  // Twin Rear Thruster Pods & Flames
  const podGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.62, 12);
  podGeo.rotateX(Math.PI / 2);
  const podL = new THREE.Mesh(podGeo, darkTrim);
  podL.position.set(-0.36, 0.6, 1.24);
  const podR = new THREE.Mesh(podGeo, darkTrim);
  podR.position.set(0.36, 0.6, 1.24);
  hullGroup.add(podL, podR);

  const flameGeo = new THREE.ConeGeometry(0.19, 1.15, 12);
  flameGeo.rotateX(Math.PI / 2);
  const flameL = new THREE.Mesh(flameGeo, plasmaMat);
  flameL.position.set(-0.36, 0.6, 2.02);
  const flameR = new THREE.Mesh(flameGeo, plasmaMat);
  flameR.position.set(0.36, 0.6, 2.02);
  hullGroup.add(flameL, flameR);

  return {
    root,
    hullGroup,
    flameL,
    flameR,
    seatAnchor: new THREE.Vector3(0, 0.68, -0.05),
  };
}

export function createMiniBotMesh(): {
  group: THREE.Group;
  beacon: THREE.Mesh;
  visorGlow: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();

  const shellMat = new THREE.MeshPhysicalMaterial({
    color: 0xf1f5f9,
    roughness: 0.22,
    metalness: 0.2,
    clearcoat: 0.85,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.25,
    metalness: 0.72,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x091326,
    roughness: 0.1,
  });
  const visorGlow = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.1,
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.34, 8), accentMat);
  body.position.y = 0.32;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1), shellMat);
  head.position.y = 0.68;
  head.castShadow = true;
  group.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.13, 0.14), visorMat);
  visor.position.set(0, 0.68, 0.17);
  group.add(visor);

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.06, 0.04), visorGlow);
  eyeL.position.set(-0.07, 0.68, 0.24);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.07;
  group.add(eyeL, eyeR);

  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 5), accentMat);
  earL.position.set(-0.22, 0.82, 0);
  earL.rotation.z = 0.55;
  const earR = earL.clone();
  earR.position.x = 0.22;
  earR.rotation.z = -0.55;
  group.add(earL, earR);

  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.15, 0),
    new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.9,
      roughness: 0.2,
    })
  );
  beacon.position.y = 1.25;
  group.add(beacon);

  return { group, beacon, visorGlow };
}

export interface EnemyRig {
  group: THREE.Group;
  body: THREE.Mesh;
  eyeMat: THREE.MeshStandardMaterial;
  jawUpper?: THREE.Mesh;
  windupKey?: THREE.Group;
  springGroup?: THREE.Group;
  wingL?: THREE.Mesh;
  wingR?: THREE.Mesh;
  turretHead?: THREE.Group;
  shieldMesh?: THREE.Mesh;
}

export function createEnemyMesh(kind: EnemyKind): EnemyRig {
  const group = new THREE.Group();

  const shellColor =
    kind === 'spiky'
      ? 0x991b1b
      : kind === 'hopper'
        ? 0x6b21a8
        : kind === 'brute'
          ? 0x7c2d12
          : kind === 'flyer'
            ? 0x0e7490
            : kind === 'shooter'
              ? 0x334155
              : kind === 'chaser'
                ? 0x9f1239
                : kind === 'guardian'
                  ? 0x1e3a8a
                  : kind === 'armored_guard'
                    ? 0x3f4c5e
                    : kind === 'giant_mech'
                      ? 0x1e293b
                      : 0x1e293b;

  const trimColor =
    kind === 'spiky'
      ? 0xfacc15
      : kind === 'hopper'
        ? 0xd8b4fe
        : kind === 'brute'
          ? 0xf97316
          : kind === 'flyer'
            ? 0x38bdf8
            : kind === 'shooter'
              ? 0xfb7185
              : kind === 'chaser'
                ? 0xfbbf24
                : kind === 'guardian'
                  ? 0x67e8f9
                  : kind === 'armored_guard'
                    ? 0x84cc16
                    : kind === 'giant_mech'
                      ? 0xa3e635
                      : 0xf43f5e;

  const shellMat = new THREE.MeshPhysicalMaterial({
    color: shellColor,
    roughness: 0.28,
    metalness: 0.62,
    clearcoat: 0.7,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: trimColor,
    roughness: 0.22,
    metalness: 0.78,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.6,
    metalness: 0.3,
  });

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xff2a55,
    emissive: 0xff1e42,
    emissiveIntensity: 2.4,
  });

  if (kind === 'flyer') {
    // Aerial Wasp-Drone with flapping translucent wings & glowing plasma stinger
    const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 1), shellMat);
    body.scale.set(0.88, 0.82, 1.35);
    body.position.y = 0.65;
    body.castShadow = true;
    group.add(body);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), eyeMat);
    eye.position.set(0, 0.66, 0.44);
    group.add(eye);

    const wingMat = new THREE.MeshPhysicalMaterial({
      color: 0xbae6fd,
      emissive: 0x0284c7,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.68,
      side: THREE.DoubleSide,
    });
    const wingGeo = new THREE.PlaneGeometry(0.85, 0.34);
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-0.58, 0.85, -0.04);
    wingL.rotation.set(0.25, 0, 0.2);
    const wingR = new THREE.Mesh(wingGeo, wingMat);
    wingR.position.set(0.58, 0.85, -0.04);
    wingR.rotation.set(0.25, 0, -0.2);
    group.add(wingL, wingR);

    const stinger = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.36, 8), trimMat);
    stinger.rotation.x = -Math.PI * 0.65;
    stinger.position.set(0, 0.46, -0.52);
    group.add(stinger);

    return { group, body, eyeMat, wingL, wingR };
  }

  if (kind === 'shooter') {
    // 4-legged Armored Plasma Turret Sentinel
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.54, 0.38, 8), darkMat);
    body.position.y = 0.38;
    body.castShadow = true;
    group.add(body);

    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.34), shellMat);
      leg.position.set(Math.cos(ang) * 0.46, 0.18, Math.sin(ang) * 0.46);
      leg.rotation.y = -ang;
      group.add(leg);
    }

    const turretHead = new THREE.Group();
    turretHead.position.y = 0.72;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 12), shellMat);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.55, 10), trimMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, 0.42);
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), eyeMat);
    muzzle.position.set(0, 0.04, 0.7);
    turretHead.add(dome, barrel, muzzle);
    group.add(turretHead);

    return { group, body, eyeMat, turretHead };
  }

  if (kind === 'chaser') {
    // Predatory Cyber-Hound with red optical scanner bar & forward blade fangs
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.62, 6, 12), shellMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = 0.48;
    body.castShadow = true;
    group.add(body);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.18), darkMat);
    visor.position.set(0, 0.56, 0.48);
    const scanner = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.06), eyeMat);
    scanner.position.set(0, 0.56, 0.56);
    group.add(visor, scanner);

    for (const sx of [-1, 1]) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.34, 5), trimMat);
      blade.rotation.x = Math.PI / 2;
      blade.position.set(sx * 0.22, 0.36, 0.56);
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.24, 5), trimMat);
      ear.position.set(sx * 0.2, 0.82, 0.24);
      ear.rotation.x = -0.35;
      group.add(blade, ear);

      for (const sz of [-0.32, 0.28]) {
        const paw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.26, 0.22), darkMat);
        paw.position.set(sx * 0.28, 0.13, sz);
        group.add(paw);
      }
    }

    return { group, body, eyeMat };
  }

  if (kind === 'guardian') {
    // Heavy Shield Bastion Sentinel carrying a forward energy barrier
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.48, 0.92, 8), shellMat);
    body.position.y = 0.66;
    body.castShadow = true;
    group.add(body);

    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.32, 6), trimMat);
    crest.position.y = 1.26;
    group.add(crest);

    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.1), eyeMat);
    eye.position.set(0, 0.84, 0.44);
    group.add(eye);

    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.15,
      transparent: true,
      opacity: 0.62,
      roughness: 0.1,
      side: THREE.DoubleSide,
    });
    const shieldMesh = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.08, 0.12), shieldMat);
    shieldMesh.position.set(0, 0.66, 0.62);
    group.add(shieldMesh);

    return { group, body, eyeMat, shieldMesh };
  }

  if (kind === 'armored_guard') {
    // Heavy Gamma-City Armored Riot Trooper with steel breastplate, shoulder pauldrons & riot shield
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.05, 0.64), shellMat);
    body.position.y = 0.78;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.44, 0.52), darkMat);
    head.position.set(0, 1.48, 0.02);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.08), eyeMat);
    visor.position.set(0, 1.48, 0.27);
    group.add(head, visor);

    for (const sx of [-1, 1]) {
      const pauldron = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.34, 0.48), trimMat);
      pauldron.position.set(sx * 0.56, 1.15, 0);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.38, 0.36), darkMat);
      leg.position.set(sx * 0.24, 0.19, 0);
      group.add(pauldron, leg);
    }

    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.75,
      roughness: 0.32,
    });
    const shieldMesh = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.32, 0.16), shieldMat);
    shieldMesh.position.set(0, 0.85, 0.56);
    const shieldTrim = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.2), trimMat);
    shieldTrim.position.set(0, 0.88, 0.56);
    group.add(shieldMesh, shieldTrim);

    return { group, body, eyeMat, shieldMesh };
  }

  if (kind === 'giant_mech') {
    // Towering Industrial Gamma-Mech Sentinel with twin shoulder cannons & glowing gamma reactor chest
    const reactorMat = new THREE.MeshStandardMaterial({
      color: 0xa3e635,
      emissive: 0x65a30d,
      emissiveIntensity: 2.0,
      roughness: 0.18,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.45, 1.15), shellMat);
    body.position.y = 1.65;
    body.castShadow = true;
    group.add(body);

    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 12), reactorMat);
    core.rotation.x = Math.PI / 2;
    core.position.set(0, 1.72, 0.56);
    group.add(core);

    const turretHead = new THREE.Group();
    turretHead.position.set(0, 2.55, 0.08);
    const helm = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.45, 0.68), darkMat);
    const optic = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.14, 0.1), eyeMat);
    optic.position.set(0, 0, 0.34);
    turretHead.add(helm, optic);
    group.add(turretHead);

    for (const sx of [-1, 1]) {
      const pod = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.52, 0.82), trimMat);
      pod.position.set(sx * 0.96, 2.38, 0.08);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.18, 0.46), darkMat);
      arm.position.set(sx * 1.05, 1.38, 0.12);
      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.85, 0.48), darkMat);
      thigh.position.set(sx * 0.48, 0.62, 0);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.28, 0.78), trimMat);
      foot.position.set(sx * 0.48, 0.14, 0.1);
      group.add(pod, arm, thigh, foot);
    }

    return { group, body, eyeMat, turretHead };
  }

  if (kind === 'brute') {
    // Heavy Armored Horned Mech-Bull Sentinel
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.92, 0.85), shellMat);
    body.position.y = 0.68;
    body.castShadow = true;
    group.add(body);

    const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), trimMat);
    shoulderL.position.set(-0.56, 0.92, 0);
    const shoulderR = shoulderL.clone();
    shoulderR.position.x = 0.56;
    group.add(shoulderL, shoulderR);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.2, 0.16), darkMat);
    visor.position.set(0, 0.78, 0.41);
    group.add(visor);

    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.06), eyeMat);
    eye.position.set(0, 0.78, 0.48);
    group.add(eye);

    const hornGeo = new THREE.ConeGeometry(0.11, 0.48, 8);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.8, roughness: 0.22 });
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-0.34, 1.24, 0.2);
    hornL.rotation.set(0.45, 0, 0.42);
    const hornR = new THREE.Mesh(hornGeo, hornMat);
    hornR.position.set(0.34, 1.24, 0.2);
    hornR.rotation.set(0.45, 0, -0.42);
    group.add(hornL, hornR);

    const footGeo = new THREE.BoxGeometry(0.32, 0.26, 0.42);
    const footL = new THREE.Mesh(footGeo, darkMat);
    footL.position.set(-0.26, 0.13, 0.05);
    const footR = new THREE.Mesh(footGeo, darkMat);
    footR.position.set(0.26, 0.13, 0.05);
    group.add(footL, footR);

    return { group, body, eyeMat };
  }

  if (kind === 'chomper') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 14, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), shellMat);
    body.position.y = 0.44;
    body.castShadow = true;
    group.add(body);

    const jawUpper = new THREE.Mesh(new THREE.SphereGeometry(0.43, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.48), trimMat);
    jawUpper.position.y = 0.48;
    jawUpper.castShadow = true;
    group.add(jawUpper);

    for (let t = -2; t <= 2; t++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 6), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 }));
      tooth.rotation.x = Math.PI;
      tooth.position.set(t * 0.11, 0.45, 0.38 - Math.abs(t) * 0.04);
      jawUpper.add(tooth);
    }

    const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), eyeMat);
    eyeL.position.set(-0.14, 0.65, 0.34);
    const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 10), eyeMat);
    eyeR.position.set(0.14, 0.65, 0.34);
    jawUpper.add(eyeL, eyeR);

    const windupKey = new THREE.Group();
    windupKey.position.set(0, 0.92, -0.05);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.24, 10), trimMat);
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 8, 16), trimMat);
    loop.position.y = 0.14;
    windupKey.add(stem, loop);
    group.add(windupKey);

    const treadGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.14, 14);
    treadGeo.rotateZ(Math.PI / 2);
    const tL = new THREE.Mesh(treadGeo, darkMat);
    tL.position.set(-0.38, 0.16, 0);
    const tR = new THREE.Mesh(treadGeo, darkMat);
    tR.position.set(0.38, 0.16, 0);
    group.add(tL, tR);

    return { group, body, eyeMat, jawUpper, windupKey };
  }

  if (kind === 'hopper') {
    const springGroup = new THREE.Group();
    group.add(springGroup);
    for (let r = 0; r < 3; r++) {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.045, 8, 16), trimMat);
      coil.rotation.x = Math.PI / 2;
      coil.position.y = 0.1 + r * 0.12;
      springGroup.add(coil);
    }

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.28, 0.52, 16), shellMat);
    body.position.y = 0.62;
    body.castShadow = true;
    springGroup.add(body);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.16), darkMat);
    visor.position.set(0, 0.66, 0.28);
    springGroup.add(visor);

    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.06), eyeMat);
    eye.position.set(0, 0.66, 0.35);
    springGroup.add(eye);

    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 14), trimMat);
    crown.position.y = 0.99;
    springGroup.add(crown);

    return { group, body, eyeMat, springGroup };
  }

  // Spiky Shield Sentinel
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.44, 18, 14), shellMat);
  body.position.y = 0.45;
  body.castShadow = true;
  group.add(body);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.065, 8, 22), trimMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.45;
  group.add(ring);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.18), darkMat);
  visor.position.set(0, 0.46, 0.34);
  group.add(visor);

  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.065, 0.06), eyeMat);
  eye.position.set(0, 0.46, 0.42);
  group.add(eye);

  const spikeMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.88, roughness: 0.18 });
  const centerSpike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.38, 8), spikeMat);
  centerSpike.position.set(0, 1.0, 0);
  group.add(centerSpike);

  for (let i = 0; i < 6; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.3, 8), spikeMat);
    const a = (i / 6) * Math.PI * 2;
    spike.position.set(Math.cos(a) * 0.26, 0.85, Math.sin(a) * 0.26);
    spike.rotation.z = -Math.cos(a) * 0.35;
    spike.rotation.x = Math.sin(a) * 0.35;
    group.add(spike);
  }

  return { group, body, eyeMat };
}

export function createCoinMesh(): THREE.Group {
  const g = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.5,
    metalness: 0.88,
    roughness: 0.16,
  });
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
    metalness: 0.6,
    roughness: 0.22,
  });

  const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 20), goldMat);
  outer.rotation.x = Math.PI / 2;
  outer.castShadow = true;
  g.add(outer);

  const starCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), innerMat);
  starCore.scale.set(1, 1, 0.45);
  g.add(starCore);

  return g;
}

export function createJumpPadMesh(): THREE.Group {
  const g = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.45, metalness: 0.65 });
  const glowMat = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x06b6d4,
    emissiveIntensity: 1.7,
    roughness: 0.18,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 1.06, 0.24, 20), baseMat);
  base.position.y = 0.12;
  base.receiveShadow = true;
  g.add(base);

  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.78, 0.12, 20), glowMat);
  pad.position.y = 0.28;
  g.add(pad);

  const chevron = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 8, 20), glowMat);
  chevron.rotation.x = Math.PI / 2;
  chevron.position.y = 0.36;
  g.add(chevron);

  return g;
}

export function createCrateMesh(): THREE.Group {
  const g = new THREE.Group();
  const woodTech = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.5,
    metalness: 0.22,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.38,
    metalness: 0.48,
  });
  const boltMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 1.2,
  });

  const box = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.96, 0.96), woodTech);
  box.position.y = 0.48;
  box.castShadow = true;
  box.receiveShadow = true;
  g.add(box);

  const band1 = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.14, 1.02), frameMat);
  band1.position.y = 0.86;
  const band2 = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.14, 1.02), frameMat);
  band2.position.y = 0.1;
  g.add(band1, band2);

  const core = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 1.02), boltMat);
  core.position.y = 0.48;
  g.add(core);

  return g;
}

export function createCheckpointMesh(): { group: THREE.Group; flagMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
  const flagMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 0.95,
    roughness: 0.32,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.16, 16), poleMat);
  base.position.y = 0.08;
  group.add(base);

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.9, 12), poleMat);
  pole.position.y = 1.0;
  pole.castShadow = true;
  group.add(pole);

  const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), flagMat);
  orb.position.y = 2.08;
  group.add(orb);

  return { group, flagMat };
}

export function createGoalPortalMesh(): {
  group: THREE.Group;
  ringInner: THREE.Mesh;
  vortex: THREE.Mesh;
  portalMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.24,
    metalness: 0.52,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.2,
    metalness: 0.88,
  });
  const portalMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.9,
    transparent: true,
    opacity: 0.68,
    side: THREE.DoubleSide,
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 2.05, 0.36, 24), plinthMat);
  plinth.position.y = 0.18;
  plinth.receiveShadow = true;
  group.add(plinth);

  const outerArch = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.19, 14, 36), goldMat);
  outerArch.position.y = 2.15;
  outerArch.castShadow = true;
  group.add(outerArch);

  const ringInner = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.08, 10, 32), portalMat);
  ringInner.position.y = 2.15;
  group.add(ringInner);

  const vortex = new THREE.Mesh(new THREE.CircleGeometry(1.28, 28), portalMat);
  vortex.position.y = 2.15;
  group.add(vortex);

  return { group, ringInner, vortex, portalMat };
}

export function createRocketPadMesh(): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.1, 2.35, 0.26, 24),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.35 })
  );
  base.position.y = 0.13;
  base.receiveShadow = true;
  g.add(base);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.9, 0.09, 10, 28),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.27;
  g.add(ring);
  return g;
}

export function createBoostRingMesh(): THREE.Group {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(
    new THREE.TorusGeometry(2.95, 0.2, 12, 34),
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.4,
      metalness: 0.7,
      roughness: 0.2,
    })
  );
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(2.5, 0.09, 8, 30),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.82 })
  );
  g.add(outer, inner);
  return g;
}

export function createMineMesh(): THREE.Group {
  const g = new THREE.Group();
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.68, 14, 12),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.35 })
  );
  const glow = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.08, 8, 18),
    new THREE.MeshStandardMaterial({
      color: 0xff2a55,
      emissive: 0xff1e42,
      emissiveIntensity: 2.0,
    })
  );
  g.add(core, glow);
  return g;
}

export function createBowMesh(): THREE.Group {
  const g = new THREE.Group();
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.22,
    metalness: 0.3,
  });
  const limbMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    roughness: 0.25,
    metalness: 0.8,
  });
  const energyMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 2.2,
  });

  // Curved bow stave via Torus arc
  const stave = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 8, 20, Math.PI * 1.15), limbMat);
  stave.rotation.y = Math.PI / 2;
  stave.rotation.z = -Math.PI * 0.575;
  g.add(stave);

  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.22, 10), gripMat);
  grip.position.set(0, 0, 0.42);
  g.add(grip);

  // Glowing energy bowstring
  const stringMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.82, 6), energyMat);
  stringMesh.position.set(0, 0, 0.02);
  g.add(stringMesh);

  return g;
}

export function createBowPickupMesh(): { group: THREE.Group; bow: THREE.Group } {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.3 });
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.8,
  });

  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 0.24, 18), baseMat);
  ped.position.y = 0.12;
  group.add(ped);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.06, 8, 22), ringMat);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.26;
  group.add(halo);

  const bow = createBowMesh();
  bow.position.y = 1.05;
  bow.scale.setScalar(1.25);
  group.add(bow);

  return { group, bow };
}

export function createArrowMesh(): THREE.Group {
  const g = new THREE.Group();
  const shaftMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.0,
  });

  // Oriented along +Z forward
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 8), shaftMat);
  shaft.rotation.x = Math.PI / 2;
  g.add(shaft);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.24, 8), tipMat);
  tip.rotation.x = Math.PI / 2;
  tip.position.z = 0.52;
  g.add(tip);

  return g;
}

export function createArcheryTargetMesh(): { group: THREE.Group; ringMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 1.5,
    roughness: 0.25,
  });

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.5, 10), frameMat);
  post.position.y = 0.75;
  group.add(post);

  const board = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.18, 22), whiteMat);
  board.rotation.x = Math.PI / 2;
  board.position.y = 1.65;
  board.castShadow = true;
  group.add(board);

  const bullOuter = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.09, 8, 24), ringMat);
  bullOuter.position.set(0, 1.65, 0.08);
  group.add(bullOuter);

  const bullOuterBack = bullOuter.clone();
  bullOuterBack.position.z = -0.08;
  group.add(bullOuterBack);

  const bullCenter = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), ringMat);
  bullCenter.scale.set(1, 1, 0.55);
  bullCenter.position.set(0, 1.65, 0);
  group.add(bullCenter);

  return { group, ringMat };
}

export function createMonkeySuitPickupMesh(): { group: THREE.Group; suit: THREE.Group } {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.65, roughness: 0.3 });
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 1.9,
  });
  const furMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.68 });
  const tanMat = new THREE.MeshStandardMaterial({ color: 0xfde68a, roughness: 0.5 });

  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 0.24, 18), baseMat);
  ped.position.y = 0.12;
  group.add(ped);

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.06, 8, 22), ringMat);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.26;
  group.add(halo);

  const suit = new THREE.Group();
  suit.position.y = 1.1;

  const maskHead = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 14), furMat);
  suit.add(maskHead);

  const earGeo = new THREE.SphereGeometry(0.14, 12, 10);
  const earL = new THREE.Mesh(earGeo, tanMat);
  earL.scale.set(0.45, 1, 1);
  earL.position.set(-0.39, 0.06, 0);
  const earR = earL.clone();
  earR.position.x = 0.39;
  suit.add(earL, earR);

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), tanMat);
  face.scale.set(1.05, 0.78, 0.55);
  face.position.set(0, -0.06, 0.26);
  suit.add(face);

  const emeraldBand = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.05, 8, 20), ringMat);
  emeraldBand.rotation.x = Math.PI / 2 - 0.15;
  emeraldBand.position.y = 0.18;
  suit.add(emeraldBand);

  group.add(suit);
  return { group, suit };
}

export function createClimbWallMesh(
  size: [number, number, number],
  face: 'pz' | 'nz' | 'px' | 'nx',
  stoneTex: THREE.Texture,
  stoneBump?: THREE.Texture
): THREE.Group {
  const group = new THREE.Group();
  const [w, h, d] = size;

  const wallMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    bumpMap: stoneBump,
    bumpScale: 0.16,
    roughness: 0.84,
    metalness: 0.06,
  });
  const mossCapMat = new THREE.MeshStandardMaterial({
    color: 0x3b7a1c,
    roughness: 0.85,
  });
  const gripMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0x10b981,
    emissiveIntensity: 0.7,
    roughness: 0.28,
    metalness: 0.35,
  });

  const block = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  block.castShadow = true;
  block.receiveShadow = true;
  group.add(block);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.22, 0.3, d + 0.22), mossCapMat);
  cap.position.y = h / 2 - 0.1;
  cap.receiveShadow = true;
  group.add(cap);

  // Carved Mesoamerican stone side pilasters framing the climbing wall
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    emissive: 0x78350f,
    emissiveIntensity: 0.32,
    metalness: 0.52,
    roughness: 0.42,
  });
  const isZ = face === 'pz' || face === 'nz';
  const sign = face === 'pz' || face === 'px' ? 1 : -1;
  const faceSpan = isZ ? w : d;
  for (const side of [-1, 1]) {
    const pilaster = new THREE.Mesh(
      isZ ? new THREE.BoxGeometry(0.42, h + 0.12, 0.36) : new THREE.BoxGeometry(0.36, h + 0.12, 0.42),
      wallMat
    );
    if (isZ) pilaster.position.set(side * (w / 2 - 0.12), 0, sign * (d / 2 + 0.04));
    else pilaster.position.set(sign * (w / 2 + 0.04), 0, side * (d / 2 - 0.12));
    group.add(pilaster);

    const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), trimMat);
    if (isZ) finial.position.set(side * (w / 2 - 0.12), h / 2 + 0.18, sign * (d / 2 + 0.04));
    else finial.position.set(sign * (w / 2 + 0.04), h / 2 + 0.18, side * (d / 2 - 0.12));
    group.add(finial);
  }

  // Staggered climbing handholds on active face
  const rows = Math.max(3, Math.floor(h / 1.15));
  const cols = Math.max(2, Math.floor(faceSpan / 1.25));
  const gripGeo = isZ ? new THREE.BoxGeometry(0.55, 0.16, 0.18) : new THREE.BoxGeometry(0.18, 0.16, 0.55);

  for (let r = 0; r < rows; r++) {
    const gy = -h / 2 + 0.85 + r * ((h - 1.3) / Math.max(1, rows - 1));
    for (let c = 0; c < cols; c++) {
      const offset = (c - (cols - 1) / 2) * 1.15 + ((r % 2) * 0.35 - 0.18);
      const grip = new THREE.Mesh(gripGeo, gripMat);
      if (isZ) {
        grip.position.set(THREE.MathUtils.clamp(offset, -w / 2 + 0.55, w / 2 - 0.55), gy, sign * (d / 2 + 0.08));
      } else {
        grip.position.set(sign * (w / 2 + 0.08), gy, THREE.MathUtils.clamp(offset, -d / 2 + 0.55, d / 2 - 0.55));
      }
      group.add(grip);
    }
  }

  return group;
}

export interface BossRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  dorsalRing: THREE.Mesh;
  coreMesh: THREE.Mesh;
  coreMat: THREE.MeshStandardMaterial;
  armorMat: THREE.MeshPhysicalMaterial;
  shockwaveRing: THREE.Mesh;
  shockwaveMat: THREE.MeshBasicMaterial;
}

export function createBossMesh(style: BossStyle = 'nebula'): BossRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const palette: Record<BossStyle, { armor: number; trim: number; trimEmissive: number; core: number; eye: number }> = {
    jungle: { armor: 0x1b4332, trim: 0x84cc16, trimEmissive: 0x3f6212, core: 0xfacc15, eye: 0xf97316 },
    ice: { armor: 0x0f2942, trim: 0x38bdf8, trimEmissive: 0x0369a1, core: 0xe0f2fe, eye: 0x22d3ee },
    temple: { armor: 0x78350f, trim: 0xfbbf24, trimEmissive: 0x92400e, core: 0x34d399, eye: 0xf43f5e },
    volcanic: { armor: 0x270d0d, trim: 0xf97316, trimEmissive: 0xc2410c, core: 0xfef08a, eye: 0xff2a55 },
    nebula: { armor: 0x311042, trim: 0xf43f5e, trimEmissive: 0x881337, core: 0xfbbf24, eye: 0xff1e42 },
    gammacity: { armor: 0x1f2937, trim: 0x84cc16, trimEmissive: 0x3f6212, core: 0xa3e635, eye: 0x22c55e },
  };
  const pal = palette[style];

  const armorMat = new THREE.MeshPhysicalMaterial({
    color: pal.armor,
    roughness: 0.25,
    metalness: 0.72,
    clearcoat: 0.85,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: pal.trim,
    emissive: pal.trimEmissive,
    emissiveIntensity: 0.65,
    metalness: 0.75,
    roughness: 0.22,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.5,
    metalness: 0.45,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: pal.core,
    emissive: pal.core,
    emissiveIntensity: 2.2,
    roughness: 0.15,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: pal.eye,
    emissive: pal.eye,
    emissiveIntensity: 2.6,
  });

  // Heavy Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.85, 1.65), armorMat);
  torso.position.y = 2.05;
  torso.castShadow = true;
  bodyGroup.add(torso);

  const chestBezel = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.11, 10, 24), trimMat);
  chestBezel.position.set(0, 2.05, 0.84);
  bodyGroup.add(chestBezel);

  const coreMesh = new THREE.Mesh(new THREE.SphereGeometry(0.46, 18, 16), coreMat);
  coreMesh.scale.set(1, 1, 0.55);
  coreMesh.position.set(0, 2.05, 0.84);
  bodyGroup.add(coreMesh);

  // Dorsal Reactor Halo
  const dorsalRing = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.14, 10, 32), trimMat);
  dorsalRing.position.set(0, 2.4, -0.95);
  bodyGroup.add(dorsalRing);

  // Articulated Horned Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 3.35, 0.1);
  bodyGroup.add(headGroup);

  const headSkull = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.92, 1.15), armorMat);
  headSkull.castShadow = true;
  headGroup.add(headSkull);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.28, 0.2), darkMat);
  visor.position.set(0, 0.05, 0.52);
  headGroup.add(visor);

  const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.12, 0.08), eyeMat);
  eyes.position.set(0, 0.05, 0.6);
  headGroup.add(eyes);

  const hornGeo = new THREE.ConeGeometry(0.18, 0.95, 10);
  const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.85, roughness: 0.2 });
  const hornL = new THREE.Mesh(hornGeo, hornMat);
  hornL.position.set(-0.6, 0.68, 0.1);
  hornL.rotation.set(0.35, 0, 0.48);
  const hornR = new THREE.Mesh(hornGeo, hornMat);
  hornR.position.set(0.6, 0.68, 0.1);
  hornR.rotation.set(0.35, 0, -0.48);
  headGroup.add(hornL, hornR);

  // Ancient Aztec/Maya Feathered Sun-Crown & Jade Crest for Ídolo Solar Kukul
  if (style === 'temple') {
    const featherMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.7,
      roughness: 0.3,
    });
    const crestRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.09, 8, 24, Math.PI * 1.15), trimMat);
    crestRing.rotation.z = -Math.PI * 0.075;
    crestRing.position.set(0, 0.42, -0.18);
    headGroup.add(crestRing);

    for (let f = -3; f <= 3; f++) {
      const ang = f * 0.28;
      const ray = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.9, 6), f % 2 === 0 ? hornMat : featherMat);
      ray.position.set(Math.sin(ang) * 1.25, 0.45 + Math.cos(ang) * 1.15, -0.2);
      ray.rotation.z = -ang;
      headGroup.add(ray);
    }
  } else if (style === 'gammacity') {
    // Coloso Gamma MK-X: Reactor Shoulder Exhaust Stacks & Gamma Battery Core Glow
    coreMat.color.setHex(0xa3e635);
    coreMat.emissive.setHex(0x65a30d);
    armorMat.color.setHex(0x1f2937);
    const gammaTankMat = new THREE.MeshStandardMaterial({
      color: 0xa3e635,
      emissive: 0x65a30d,
      emissiveIntensity: 1.75,
      roughness: 0.2,
    });
    for (const sx of [-1, 1]) {
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 1.35, 10), darkMat);
      stack.position.set(sx * 1.05, 3.65, -0.45);
      const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.42, 10), gammaTankMat);
      cell.position.set(sx * 1.05, 4.15, -0.45);
      bodyGroup.add(stack, cell);
    }
  }

  // Twin Heavy Claw Arms
  const makeBossArm = (side: number) => {
    const arm = new THREE.Group();
    arm.position.set(side * 1.48, 2.55, 0);
    const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.54, 14, 12), trimMat);
    arm.add(pauldron);
    const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.25, 0.55), armorMat);
    forearm.position.y = -0.82;
    forearm.castShadow = true;
    arm.add(forearm);
    const fist = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.58, 0.72), darkMat);
    fist.position.set(0, -1.55, 0.1);
    fist.castShadow = true;
    arm.add(fist);
    return arm;
  };
  const leftArm = makeBossArm(-1);
  const rightArm = makeBossArm(1);
  bodyGroup.add(leftArm, rightArm);

  // Heavy Stomping Legs
  const makeBossLeg = (side: number) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.65, 1.15, 0);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 0.85, 12), darkMat);
    thigh.position.y = -0.45;
    leg.add(thigh);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.42, 0.92), armorMat);
    boot.position.set(0, -0.94, 0.12);
    boot.castShadow = true;
    leg.add(boot);
    return leg;
  };
  const leftLeg = makeBossLeg(-1);
  const rightLeg = makeBossLeg(1);
  bodyGroup.add(leftLeg, rightLeg);

  // Expanding Ground Shockwave Ring (hidden unless pulsing)
  const shockwaveMat = new THREE.MeshBasicMaterial({
    color: 0xff2a55,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const shockwaveRing = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.14, 8, 36), shockwaveMat);
  shockwaveRing.rotation.x = Math.PI / 2;
  shockwaveRing.position.y = 0.22;
  shockwaveRing.visible = false;
  root.add(shockwaveRing);

  return {
    root,
    bodyGroup,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    dorsalRing,
    coreMesh,
    coreMat,
    armorMat,
    shockwaveRing,
    shockwaveMat,
  };
}

export interface HangGliderRig {
  root: THREE.Group;
  wingGroup: THREE.Group;
  trailL: THREE.Mesh;
  trailR: THREE.Mesh;
}

export function createHangGliderRig(): HangGliderRig {
  const root = new THREE.Group();
  const wingGroup = new THREE.Group();
  root.add(wingGroup);

  const sailMainMat = new THREE.MeshPhysicalMaterial({
    color: 0x0284c7,
    roughness: 0.28,
    metalness: 0.1,
    clearcoat: 0.65,
    side: THREE.DoubleSide,
  });
  const sailAccentMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.35,
    roughness: 0.3,
    side: THREE.DoubleSide,
  });
  const aluMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.85,
    roughness: 0.22,
  });
  const trailMat = new THREE.MeshBasicMaterial({
    color: 0xbae6fd,
    transparent: true,
    opacity: 0.55,
  });

  // Swept delta sailcloth wing (nose at -Z, wingspan along X)
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 1.55); // nose along +Y in 2D shape -> becomes -Z after rotateX(-PI/2)
  wingShape.lineTo(2.75, -0.95);
  wingShape.lineTo(1.5, -0.78);
  wingShape.lineTo(0, -1.05);
  wingShape.lineTo(-1.5, -0.78);
  wingShape.lineTo(-2.75, -0.95);
  wingShape.closePath();

  const wingGeo = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 2,
  });
  wingGeo.rotateX(-Math.PI / 2);
  const wingMesh = new THREE.Mesh(wingGeo, sailMainMat);
  wingMesh.position.y = 1.68;
  wingMesh.castShadow = true;
  wingGroup.add(wingMesh);

  // Golden aerodynamic leading-edge stripe
  const stripeShape = new THREE.Shape();
  stripeShape.moveTo(0, 1.55);
  stripeShape.lineTo(2.75, -0.95);
  stripeShape.lineTo(2.42, -0.92);
  stripeShape.lineTo(0, 1.2);
  stripeShape.lineTo(-2.42, -0.92);
  stripeShape.lineTo(-2.75, -0.95);
  stripeShape.closePath();

  const stripeGeo = new THREE.ExtrudeGeometry(stripeShape, { depth: 0.06 });
  stripeGeo.rotateX(-Math.PI / 2);
  const stripeMesh = new THREE.Mesh(stripeGeo, sailAccentMat);
  stripeMesh.position.y = 1.69;
  wingGroup.add(stripeMesh);

  // Center aluminum keel & A-frame control trapeze
  const keel = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.5, 8), aluMat);
  keel.rotation.x = Math.PI / 2;
  keel.position.set(0, 1.64, -0.25);
  wingGroup.add(keel);

  const strutL = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.35, 8), aluMat);
  strutL.position.set(-0.42, 1.05, -0.35);
  strutL.rotation.z = -0.36;
  const strutR = strutL.clone();
  strutR.position.x = 0.42;
  strutR.rotation.z = 0.36;
  const controlBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.25, 8), aluMat);
  controlBar.rotation.z = Math.PI / 2;
  controlBar.position.set(0, 0.48, -0.35);
  wingGroup.add(strutL, strutR, controlBar);

  // Wingtip slipstream trails
  const trailGeo = new THREE.ConeGeometry(0.08, 1.4, 8);
  trailGeo.rotateX(-Math.PI / 2);
  const trailL = new THREE.Mesh(trailGeo, trailMat);
  trailL.position.set(-2.65, 1.68, 1.55);
  const trailR = trailL.clone();
  trailR.position.x = 2.65;
  wingGroup.add(trailL, trailR);

  return { root, wingGroup, trailL, trailR };
}

export interface RiverBoatRig {
  root: THREE.Group;
  hullGroup: THREE.Group;
  propeller: THREE.Group;
  wakeL: THREE.Mesh;
  wakeR: THREE.Mesh;
  bowSpray: THREE.Mesh;
}

export function createRiverBoatRig(woodTex?: THREE.Texture): RiverBoatRig {
  const root = new THREE.Group();
  const hullGroup = new THREE.Group();
  root.add(hullGroup);

  const hullOrangeMat = new THREE.MeshPhysicalMaterial({
    color: 0xf97316,
    roughness: 0.24,
    metalness: 0.14,
    clearcoat: 0.78,
  });
  const deckMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: woodTex ? 0xffffff : 0x92400e,
    roughness: 0.72,
    metalness: 0.05,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.45,
    metalness: 0.65,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xca8a04,
    emissiveIntensity: 0.42,
    metalness: 0.72,
    roughness: 0.25,
  });
  const lanternMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.9,
    roughness: 0.18,
  });

  // Main wooden boat deck oriented with bow at -Z
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.26, 2.75), deckMat);
  deck.position.y = 0.28;
  deck.castShadow = true;
  deck.receiveShadow = true;
  hullGroup.add(deck);

  // Pointed expedition bow
  const bowGeo = new THREE.ConeGeometry(0.92, 1.22, 4);
  bowGeo.rotateY(Math.PI / 4);
  bowGeo.rotateX(-Math.PI / 2);
  const bow = new THREE.Mesh(bowGeo, hullOrangeMat);
  bow.scale.set(1.06, 0.44, 1.0);
  bow.position.set(0, 0.32, -1.8);
  bow.castShadow = true;
  hullGroup.add(bow);

  // Twin inflatable expedition pontoons + side paddles
  const pontoonGeo = new THREE.CapsuleGeometry(0.28, 2.55, 6, 12);
  pontoonGeo.rotateX(Math.PI / 2);
  const ponL = new THREE.Mesh(pontoonGeo, hullOrangeMat);
  ponL.position.set(-0.92, 0.3, 0);
  ponL.castShadow = true;
  const ponR = ponL.clone();
  ponR.position.x = 0.92;
  hullGroup.add(ponL, ponR);

  for (const sx of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 2.1), trimMat);
    strap.position.set(sx * 0.94, 0.42, 0);
    const oarShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.65, 6), deckMat);
    oarShaft.rotation.x = Math.PI / 2;
    oarShaft.position.set(sx * 1.15, 0.42, 0.15);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.54), goldMat);
    blade.position.set(sx * 1.15, 0.42, 0.92);
    hullGroup.add(strap, oarShaft, blade);
  }

  // Protective bow bumper, lantern & windshield arch
  const rail = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.055, 8, 16, Math.PI), goldMat);
  rail.rotation.x = Math.PI / 2;
  rail.rotation.z = Math.PI;
  rail.position.set(0, 0.56, -1.08);
  hullGroup.add(rail);

  const bowLamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), lanternMat);
  bowLamp.position.set(0, 0.62, -1.62);
  hullGroup.add(bowLamp);

  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.48, 0.34), trimMat);
  helm.position.set(0, 0.58, -0.58);
  hullGroup.add(helm);

  // Rear outboard motor + spinning brass propeller
  const motorHead = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.46), trimMat);
  motorHead.position.set(0, 0.56, 1.5);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.52, 8), trimMat);
  shaft.position.set(0, 0.25, 1.58);
  hullGroup.add(motorHead, shaft);

  const propeller = new THREE.Group();
  propeller.position.set(0, 0.04, 1.66);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), goldMat);
  const bladeA = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.04), goldMat);
  const bladeB = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.04), goldMat);
  propeller.add(hub, bladeA, bladeB);
  hullGroup.add(propeller);

  // Stern whitewater wake spray ribbons + dynamic bow V-spray wave
  const wakeMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const wakeGeo = new THREE.PlaneGeometry(0.54, 2.25);
  wakeGeo.rotateX(-Math.PI / 2);
  const wakeL = new THREE.Mesh(wakeGeo, wakeMat);
  wakeL.position.set(-0.68, 0.06, 2.35);
  wakeL.rotation.y = 0.24;
  const wakeR = new THREE.Mesh(wakeGeo, wakeMat);
  wakeR.position.set(0.68, 0.06, 2.35);
  wakeR.rotation.y = -0.24;

  const bowSprayGeo = new THREE.RingGeometry(0.75, 1.38, 16, 1, Math.PI * 0.15, Math.PI * 0.7);
  bowSprayGeo.rotateX(-Math.PI / 2);
  const bowSpray = new THREE.Mesh(bowSprayGeo, wakeMat);
  bowSpray.position.set(0, 0.09, -1.65);
  bowSpray.rotation.y = Math.PI;
  hullGroup.add(wakeL, wakeR, bowSpray);

  return { root, hullGroup, propeller, wakeL, wakeR, bowSpray };
}

export interface CrocodileRig {
  group: THREE.Group;
  jawUpper: THREE.Group;
  tailGroup: THREE.Group;
}

export function createCrocodileMesh(): CrocodileRig {
  const group = new THREE.Group();

  const scaleMat = new THREE.MeshStandardMaterial({
    color: 0x2f5d24,
    roughness: 0.52,
    metalness: 0.14,
  });
  const darkScuteMat = new THREE.MeshStandardMaterial({
    color: 0x1b3b15,
    roughness: 0.62,
  });
  const bellyMat = new THREE.MeshStandardMaterial({
    color: 0xa3be69,
    roughness: 0.58,
  });
  const mouthInnerMat = new THREE.MeshStandardMaterial({
    color: 0x881337,
    roughness: 0.45,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xeab308,
    emissiveIntensity: 1.35,
  });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x090d07 });
  const toothMat = new THREE.MeshStandardMaterial({ color: 0xfefce8, roughness: 0.18 });

  // Sculpted tapered reptile torso (snout faces +Z)
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.46, 1.55, 8, 14), scaleMat);
  torso.rotation.x = Math.PI / 2;
  torso.scale.set(1.22, 1.0, 0.62);
  torso.position.y = 0.22;
  torso.castShadow = true;
  group.add(torso);

  const belly = new THREE.Mesh(new THREE.CapsuleGeometry(0.41, 1.45, 6, 12), bellyMat);
  belly.rotation.x = Math.PI / 2;
  belly.scale.set(1.16, 1.0, 0.45);
  belly.position.set(0, 0.11, 0);
  group.add(belly);

  // Double dorsal osteoderm scale rows along armored spine
  for (let i = 0; i < 6; i++) {
    const scuteL = new THREE.Mesh(new THREE.ConeGeometry(0.095, 0.22, 5), darkScuteMat);
    scuteL.position.set(-0.18, 0.48, -0.78 + i * 0.32);
    const scuteR = scuteL.clone();
    scuteR.position.x = 0.18;
    group.add(scuteL, scuteR);
  }

  // Four sturdy paddling webbed limbs
  const legGeo = new THREE.CapsuleGeometry(0.12, 0.28, 5, 8);
  const footGeo = new THREE.BoxGeometry(0.28, 0.07, 0.34);
  for (const sx of [-1, 1]) {
    for (const sz of [-0.55, 0.58]) {
      const leg = new THREE.Mesh(legGeo, scaleMat);
      leg.position.set(sx * 0.58, 0.14, sz);
      leg.rotation.z = sx * 0.65;
      const foot = new THREE.Mesh(footGeo, darkScuteMat);
      foot.position.set(sx * 0.72, 0.04, sz + 0.08);
      group.add(leg, foot);
    }
  }

  // Lower jaw + fleshy palate + lower fangs
  const jawLower = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.13, 1.25), bellyMat);
  jawLower.position.set(0, 0.14, 1.48);
  const jawLowerTip = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), scaleMat);
  jawLowerTip.scale.set(1.12, 0.42, 1.2);
  jawLowerTip.position.set(0, 0.14, 2.08);
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 1.05), mouthInnerMat);
  tongue.position.set(0, 0.2, 1.48);
  group.add(jawLower, jawLowerTip, tongue);

  for (let t = 0; t < 4; t++) {
    const lfL = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.11, 5), toothMat);
    lfL.position.set(-0.24, 0.23, 1.15 + t * 0.26);
    const lfR = lfL.clone();
    lfR.position.x = 0.24;
    group.add(lfL, lfR);
  }

  // Hinged Upper Jaw with brow ridges, slit eyes, nostrils, palate & fangs
  const jawUpper = new THREE.Group();
  jawUpper.position.set(0, 0.27, 0.92);

  const cranium = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.55), scaleMat);
  cranium.position.set(0, 0.07, 0.12);
  const snoutBridge = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.16, 0.92), scaleMat);
  snoutBridge.position.set(0, 0.04, 0.68);
  const snoutTip = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), scaleMat);
  snoutTip.scale.set(1.06, 0.45, 1.2);
  snoutTip.position.set(0, 0.03, 1.15);
  const palate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.05, 0.96), mouthInnerMat);
  palate.position.set(0, -0.04, 0.66);
  jawUpper.add(cranium, snoutBridge, snoutTip, palate);

  // Nostril bumps near tip
  for (const sx of [-0.11, 0.11]) {
    const nost = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), darkScuteMat);
    nost.position.set(sx, 0.11, 1.12);
    jawUpper.add(nost);
  }

  // Raised armored brow ridges + amber predator eyes + vertical pupils
  for (const sx of [-1, 1]) {
    const brow = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), darkScuteMat);
    brow.scale.set(0.9, 0.7, 1.3);
    brow.position.set(sx * 0.25, 0.2, 0.18);
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 10), eyeMat);
    eye.position.set(sx * 0.24, 0.18, 0.2);
    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.11, 0.04), pupilMat);
    pupil.position.set(sx * 0.24, 0.18, 0.27);
    jawUpper.add(brow, eye, pupil);
  }

  for (let t = 0; t < 5; t++) {
    const fL = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.13, 5), toothMat);
    fL.rotation.x = Math.PI;
    fL.position.set(-0.24, -0.08, 0.34 + t * 0.21);
    const fR = fL.clone();
    fR.position.x = 0.24;
    jawUpper.add(fL, fR);
  }
  group.add(jawUpper);

  // Articulated 3-segment sinuous armored tail
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.2, -0.95);
  const tailSeg1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.72, 6, 10), scaleMat);
  tailSeg1.rotation.x = Math.PI / 2;
  tailSeg1.scale.set(1.1, 1.0, 0.7);
  tailSeg1.position.z = -0.45;
  const tailSeg2 = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.2, 7), darkScuteMat);
  tailSeg2.rotation.x = -Math.PI / 2;
  tailSeg2.position.z = -1.35;
  const crest1 = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), darkScuteMat);
  crest1.position.set(0, 0.26, -0.5);
  const crest2 = crest1.clone();
  crest2.position.set(0, 0.22, -0.9);
  tailGroup.add(tailSeg1, tailSeg2, crest1, crest2);
  group.add(tailGroup);

  // Water ripple & splash halo around crocodile
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.18, 1.62, 24),
    new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.48, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.04;
  group.add(ring);

  return { group, jawUpper, tailGroup };
}

export function createEiffelTowerMesh(stoneTex?: THREE.Texture): THREE.Group {
  const g = new THREE.Group();

  const ironMat = new THREE.MeshStandardMaterial({
    color: 0xd96b4b,
    roughness: 0.42,
    metalness: 0.35,
  });
  const warmIronMat = new THREE.MeshStandardMaterial({
    color: 0xf2996d,
    roughness: 0.38,
    metalness: 0.28,
  });
  const burgundyMat = new THREE.MeshStandardMaterial({
    color: 0x993338,
    roughness: 0.4,
    metalness: 0.3,
  });
  const goldLightMat = new THREE.MeshStandardMaterial({
    color: 0xfee09b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.85,
    roughness: 0.25,
  });
  const pierMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    color: 0xebb18d,
    roughness: 0.82,
  });

  // Base footprint at y = 0, summit platform support at y = 37.3 (fits start platform at world y=32 when placed at y=-6)
  const legCorners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];

  for (const [sx, sz] of legCorners) {
    // Sunlit terracotta masonry pier
    const pier = new THREE.Mesh(new THREE.BoxGeometry(3.9, 2.2, 3.9), pierMat);
    pier.position.set(sx * 9.5, 1.1, sz * 9.5);
    g.add(pier);

    // Sweeping parabolic warm coral-terracotta leg struts
    const legCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx * 9.5, 1.5, sz * 9.5),
      new THREE.Vector3(sx * 7.2, 10.5, sz * 7.2),
      new THREE.Vector3(sx * 4.6, 20.5, sz * 4.6),
      new THREE.Vector3(sx * 2.2, 30.5, sz * 2.2),
      new THREE.Vector3(sx * 1.35, 37.5, sz * 1.35),
    ]);
    const legMesh = new THREE.Mesh(new THREE.TubeGeometry(legCurve, 18, 0.72, 6, false), warmIronMat);
    legMesh.castShadow = true;
    g.add(legMesh);

    const innerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sx * 7.8, 1.5, sz * 7.8),
      new THREE.Vector3(sx * 5.6, 10.5, sz * 5.6),
      new THREE.Vector3(sx * 3.4, 20.5, sz * 3.4),
      new THREE.Vector3(sx * 1.5, 30.5, sz * 1.5),
    ]);
    const innerMesh = new THREE.Mesh(new THREE.TubeGeometry(innerCurve, 14, 0.34, 5, false), ironMat);
    g.add(innerMesh);
  }

  // Decorative lower perimeter arches between the 4 legs (matching the sweeping rose-coral base arch)
  const archSpan = 15.2;
  const archPositions: [number, number, number][] = [
    [0, 2.2, 7.9],
    [0, 2.2, -7.9],
    [7.9, 2.2, 0],
    [-7.9, 2.2, 0],
  ];
  archPositions.forEach(([ax, ay, az], idx) => {
    const arch = new THREE.Mesh(new THREE.TorusGeometry(archSpan * 0.44, 0.48, 8, 26, Math.PI), warmIronMat);
    arch.position.set(ax, ay, az);
    if (idx >= 2) arch.rotation.y = Math.PI / 2;
    g.add(arch);
  });

  // 1st & 2nd Observation Decks with warm wrought-iron filigree, sunlit glass pavilions & golden corner lanterns
  const deck1 = new THREE.Mesh(new THREE.BoxGeometry(15.6, 1.5, 15.6), warmIronMat);
  deck1.position.y = 11.2;
  const deck1Trim = new THREE.Mesh(new THREE.BoxGeometry(16.2, 0.42, 16.2), burgundyMat);
  deck1Trim.position.y = 12.1;
  const deck1Glass = new THREE.Mesh(
    new THREE.BoxGeometry(11.4, 1.35, 11.4),
    new THREE.MeshPhysicalMaterial({
      color: 0xffedd5,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.72,
      roughness: 0.12,
      clearcoat: 1.0,
    })
  );
  deck1Glass.position.y = 12.8;

  const deck2 = new THREE.Mesh(new THREE.BoxGeometry(10.6, 1.35, 10.6), warmIronMat);
  deck2.position.y = 21.5;
  const deck2Trim = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.38, 11.2), burgundyMat);
  deck2Trim.position.y = 22.3;
  const deck2Glass = new THREE.Mesh(
    new THREE.BoxGeometry(7.8, 1.15, 7.8),
    new THREE.MeshPhysicalMaterial({
      color: 0xffedd5,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.78,
      roughness: 0.12,
      clearcoat: 1.0,
    })
  );
  deck2Glass.position.y = 22.95;

  for (const [lx, lz] of legCorners) {
    const lantern1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), goldLightMat);
    lantern1.position.set(lx * 7.6, 12.7, lz * 7.6);
    const lantern2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), goldLightMat);
    lantern2.position.set(lx * 5.1, 22.8, lz * 5.1);
    g.add(lantern1, lantern2);
  }

  // Open Eiffel Summit Balcony (local y = 37.8 -> world y = 32.0 when placed at y = -6)
  const summitFloor = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.42, 5.4), warmIronMat);
  summitFloor.position.set(0, 37.78, 0);
  summitFloor.receiveShadow = true;

  // Open Perimeter Iron Balustrade Railings around summit so player sees full Eiffel top
  const railH = 0.65;
  for (const sx of [-2.45, 2.45]) {
    const sideRail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 5.4), burgundyMat);
    sideRail.position.set(sx, 38.0 + railH, 0);
    g.add(sideRail);
    for (const pz of [-2.4, -0.8, 0.8, 2.4]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, railH, 0.14), ironMat);
      post.position.set(sx, 38.0 + railH * 0.5, pz);
      g.add(post);
    }
  }
  const backRail = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.16, 0.16), burgundyMat);
  backRail.position.set(0, 38.0 + railH, 2.55);
  g.add(backRail);

  // Sleek Front Open-Iron Glider Launch Catwalk projecting toward -Z
  for (const sx of [-1.2, 1.2]) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 5.4), ironMat);
    beam.position.set(sx, 37.82, -4.4);
    g.add(beam);
  }
  for (let z = -2.6; z >= -6.8; z -= 0.7) {
    const rung = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.18, 0.24), warmIronMat);
    rung.position.set(0, 37.9, z);
    g.add(rung);
  }

  // Iconic Tapered Eiffel Pinnacle Crown + Golden Sunset Beacon Spire rising cleanly behind spawn (+Z)
  const spireBase = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 1.35, 3.6, 4), warmIronMat);
  spireBase.rotation.y = Math.PI / 4;
  spireBase.position.set(0, 39.8, 2.35);
  const spireCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.72, 12), goldLightMat);
  spireCrown.position.set(0, 41.8, 2.35);
  const spireHalo = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.08, 8, 24), goldLightMat);
  spireHalo.rotation.x = Math.PI / 2;
  spireHalo.position.set(0, 41.8, 2.35);
  const spireNeedle = new THREE.Mesh(new THREE.ConeGeometry(0.26, 3.8, 8), burgundyMat);
  spireNeedle.position.set(0, 43.9, 2.35);
  g.add(deck1, deck1Trim, deck1Glass, deck2, deck2Trim, deck2Glass, summitFloor, spireBase, spireCrown, spireHalo, spireNeedle);

  // Cross-bracing lattice horizontal & diagonal rings along shaft
  for (let h = 14.5; h <= 35.5; h += 3.5) {
    const w = THREE.MathUtils.lerp(12.2, 4.4, (h - 12) / 24);
    const brace = new THREE.Mesh(new THREE.BoxGeometry(w, 0.34, w), ironMat);
    brace.position.y = h;
    g.add(brace);
  }

  return g;
}

export function createArcDeTriompheMesh(stoneTex?: THREE.Texture): THREE.Group {
  const g = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    color: 0xeddcc4,
    roughness: 0.72,
    metalness: 0.06,
  });
  const corniceMat = new THREE.MeshStandardMaterial({
    color: 0xd6bfa0,
    roughness: 0.68,
  });
  const reliefMat = new THREE.MeshStandardMaterial({
    color: 0xc2a582,
    roughness: 0.64,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xd97706,
    emissiveIntensity: 0.55,
    metalness: 0.85,
    roughness: 0.2,
  });
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf97316,
    emissiveIntensity: 2.4,
  });

  // Twin monumental stone piers with stepped plinths framing the Goal Portal
  for (const sx of [-1, 1]) {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.9, 5.8), corniceMat);
    plinth.position.set(sx * 4.6, 0.45, 0);
    const pier = new THREE.Mesh(new THREE.BoxGeometry(3.8, 9.6, 5.2), stoneMat);
    pier.position.set(sx * 4.6, 5.0, 0);
    pier.castShadow = true;
    pier.receiveShadow = true;
    g.add(plinth, pier);

    // Fluted classical corner pilasters & carved relief medallions on front & back
    for (const px of [-1.45, 1.45]) {
      const pilaster = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 8.8, 10), corniceMat);
      pilaster.position.set(sx * 4.6 + px, 4.9, 2.58);
      g.add(pilaster);
    }
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(2.1, 3.8, 0.28), reliefMat);
    plaque.position.set(sx * 4.6, 3.6, 2.66);
    const medallion = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.12, 8, 20), goldMat);
    medallion.position.set(sx * 4.6, 7.2, 2.68);
    g.add(plaque, medallion);
  }

  // Central coffered rounded arch vault
  const archSpan = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.9, 10, 24, Math.PI), corniceMat);
  archSpan.position.set(0, 6.2, 0);
  archSpan.scale.set(1, 1, 2.8);
  const keystone = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.2, 5.5), goldMat);
  keystone.position.set(0, 8.85, 0);
  g.add(archSpan, keystone);

  // Upper entablature, sculpted attic shields & rooftop balustrade
  const frieze = new THREE.Mesh(new THREE.BoxGeometry(13.6, 3.4, 5.5), stoneMat);
  frieze.position.set(0, 10.9, 0);
  frieze.castShadow = true;
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.72, 6.1), corniceMat);
  cornice.position.set(0, 9.3, 0);
  const topCap = new THREE.Mesh(new THREE.BoxGeometry(14.3, 0.65, 5.9), corniceMat);
  topCap.position.set(0, 12.8, 0);
  g.add(frieze, cornice, topCap);

  for (let m = -2; m <= 2; m++) {
    const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.2, 12), goldMat);
    shield.rotation.x = Math.PI / 2;
    shield.position.set(m * 2.5, 11.1, 2.8);
    g.add(shield);
  }

  // Golden Eternal Flame torches flanking the arch
  for (const sx of [-4.6, 4.6]) {
    const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.34, 0.55, 12), goldMat);
    brazier.position.set(sx, 0.3, 3.3);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.78, 8), flameMat);
    flame.position.set(sx, 0.85, 3.3);
    g.add(brazier, flame);
  }

  return g;
}

export function createNycVehicleMesh(colorHex: number, isTaxi = false): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: isTaxi ? 0xfacc15 : colorHex,
    roughness: 0.28,
    metalness: 0.55,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.12,
    metalness: 0.45,
  });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.85 });
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xfef9c3,
    emissive: 0xfef08a,
    emissiveIntensity: 2.0,
  });
  const tailMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 1.8,
  });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.62, 3.8), bodyMat);
  chassis.position.y = 0.55;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.54, 1.95), glassMat);
  cabin.position.set(0, 1.08, -0.1);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.08, 1.85), bodyMat);
  roof.position.set(0, 1.36, -0.1);
  g.add(chassis, cabin, roof);

  if (isTaxi) {
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.2, 0.24),
      new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xf59e0b, emissiveIntensity: 1.4 })
    );
    sign.position.set(0, 1.48, 0.12);
    g.add(sign);
  }

  for (const sx of [-0.62, 0.62]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.15, 0.08), headMat);
    hl.position.set(sx, 0.58, 1.91);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.15, 0.08), tailMat);
    tl.position.set(sx, 0.58, -1.91);
    g.add(hl, tl);

    for (const sz of [-1.15, 1.15]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 10), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(sx * 1.42, 0.32, sz);
      g.add(wheel);
    }
  }
  return g;
}

export function createNycHelicopterMesh(): THREE.Group {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x1e3a8a,
    roughness: 0.3,
    metalness: 0.65,
  });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xd97706,
    emissiveIntensity: 0.35,
    roughness: 0.3,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0369a1,
    emissiveIntensity: 0.35,
    roughness: 0.08,
    metalness: 0.25,
  });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85, roughness: 0.25 });

  const hull = new THREE.Mesh(new THREE.SphereGeometry(1.15, 14, 12), hullMat);
  hull.scale.set(0.95, 0.82, 1.65);
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.92, 12, 10), glassMat);
  cockpit.position.set(0, 0.08, 0.92);
  cockpit.scale.set(0.9, 0.78, 0.95);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.18, 2.2), stripeMat);
  stripe.position.set(0, -0.08, 0.05);
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 3.6, 8), hullMat);
  boom.rotation.x = Math.PI / 2;
  boom.position.set(0, 0.12, -2.55);
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 0.62), stripeMat);
  tailFin.position.set(0, 0.45, -4.15);
  g.add(hull, cockpit, stripe, boom, tailFin);

  for (const sx of [-0.75, 0.75]) {
    const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8), metalMat);
    skid.rotation.x = Math.PI / 2;
    skid.position.set(sx, -1.05, 0.25);
    g.add(skid);
  }

  const mainRotor = new THREE.Group();
  mainRotor.position.set(0, 1.12, 0);
  const bladeA = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.06, 0.28), metalMat);
  const bladeB = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 6.8), metalMat);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.35, 10), stripeMat);
  mainRotor.add(bladeA, bladeB, hub);
  g.add(mainRotor);

  const tailRotor = new THREE.Group();
  tailRotor.position.set(0.22, 0.58, -4.2);
  const tBladeA = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.1, 0.14), stripeMat);
  const tBladeB = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 1.1), stripeMat);
  tailRotor.add(tBladeA, tBladeB);
  g.add(tailRotor);

  g.userData.mainRotor = mainRotor;
  g.userData.tailRotor = tailRotor;
  return g;
}

export function createNycWaterTowerMesh(): THREE.Group {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7c4a2d, roughness: 0.85 });
  const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.75, roughness: 0.35 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.55, roughness: 0.45 });

  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 2.3, 6), ironMat);
    leg.position.set(Math.cos(ang) * 0.92, 1.15, Math.sin(ang) * 0.92);
    g.add(leg);
  }
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.1, 1.95, 14), woodMat);
  tank.position.y = 3.15;
  tank.castShadow = true;
  const hoopA = new THREE.Mesh(new THREE.TorusGeometry(1.11, 0.04, 6, 18), ironMat);
  hoopA.rotation.x = Math.PI / 2;
  hoopA.position.y = 2.65;
  const hoopB = hoopA.clone();
  hoopB.position.y = 3.65;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.22, 0.95, 14), roofMat);
  cone.position.y = 4.58;
  g.add(tank, hoopA, hoopB, cone);
  return g;
}

export function createWebCocoonMesh(): THREE.Group {
  const g = new THREE.Group();
  const webMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0xe2e8f0,
    emissiveIntensity: 0.35,
    roughness: 0.45,
    transparent: true,
    opacity: 0.9,
  });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.82, 12, 10), webMat);
  core.scale.set(1.05, 0.95, 1.05);
  g.add(core);
  for (let i = 0; i < 5; i++) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.065, 6, 18), webMat);
    band.rotation.set(i * 0.62, i * 0.95, i * 0.41);
    g.add(band);
  }
  return g;
}

export function createWebAnchorBeaconMesh(): THREE.Group {
  const g = new THREE.Group();
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.5,
    roughness: 0.18,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 1.6,
    roughness: 0.2,
  });
  const outer = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.09, 8, 22), ringMat);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), coreMat);
  g.add(outer, core);
  return g;
}

export function createChallengeGateMesh(activeColorHex = 0x22d3ee): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: activeColorHex,
    emissive: activeColorHex,
    emissiveIntensity: 1.65,
    roughness: 0.2,
    transparent: true,
    opacity: 0.9,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.14, 10, 28), mat);
  g.add(ring);
  return g;
}

export function createHulkDestructibleMesh(
  kind: DestructibleKind,
  size: [number, number, number],
  textures: ProceduralTextures
): {
  group: THREE.Group;
  intactGroup: THREE.Group;
  rubbleGroup: THREE.Group;
  crackOverlay: THREE.Mesh;
} {
  const [w, h, d] = size;
  const group = new THREE.Group();
  const intactGroup = new THREE.Group();
  const rubbleGroup = new THREE.Group();
  rubbleGroup.visible = false;
  group.add(intactGroup, rubbleGroup);

  const concreteMat = new THREE.MeshStandardMaterial({
    map: textures.gammaConcrete,
    roughness: 0.85,
    metalness: 0.08,
  });
  const brickMat = new THREE.MeshStandardMaterial({
    map: textures.gammaBrickFactory,
    roughness: 0.82,
    metalness: 0.06,
  });
  const steelMat = new THREE.MeshStandardMaterial({
    map: textures.gammaIndustrialSteel,
    roughness: 0.38,
    metalness: 0.72,
  });
  const hazardMat = new THREE.MeshStandardMaterial({
    map: textures.gammaHazardStripe,
    roughness: 0.45,
    metalness: 0.28,
  });
  const gammaGlowMat = new THREE.MeshStandardMaterial({
    color: 0xa3e635,
    emissive: 0x65a30d,
    emissiveIntensity: 1.55,
    roughness: 0.2,
  });

  if (kind === 'factory_tank') {
    const legH = h * 0.22;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, legH, 8), steelMat);
        leg.position.set(sx * w * 0.34, legH * 0.5, sz * d * 0.34);
        intactGroup.add(leg);
      }
    }
    const tankR = Math.min(w, d) * 0.44;
    const tankH = h * 0.78;
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(tankR, tankR, tankH, 16), steelMat);
    tank.position.y = legH + tankH * 0.5;
    tank.castShadow = true;
    tank.receiveShadow = true;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(tankR * 1.03, tankR * 1.03, tankH * 0.22, 16), hazardMat);
    band.position.y = legH + tankH * 0.55;
    const vatWindow = new THREE.Mesh(new THREE.BoxGeometry(tankR * 0.65, tankH * 0.35, tankR * 2.04), gammaGlowMat);
    vatWindow.position.y = legH + tankH * 0.55;
    const cap = new THREE.Mesh(new THREE.SphereGeometry(tankR * 0.92, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), steelMat);
    cap.position.y = legH + tankH;
    intactGroup.add(tank, band, vatWindow, cap);
  } else if (kind === 'pillar') {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(w * 1.08, h * 0.16, d * 1.08), hazardMat);
    plinth.position.y = h * 0.08;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(w, d) * 0.42, Math.min(w, d) * 0.48, h * 0.84, 12), concreteMat);
    col.position.y = h * 0.54;
    col.castShadow = true;
    col.receiveShadow = true;
    intactGroup.add(plinth, col);
  } else if (kind === 'barrier') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.68, d), concreteMat);
    base.position.y = h * 0.34;
    base.castShadow = true;
    base.receiveShadow = true;
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, h * 0.32, d * 0.82), hazardMat);
    topBar.position.y = h * 0.84;
    intactGroup.add(base, topBar);
  } else if (kind === 'bridge_span') {
    const deck = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), concreteMat);
    deck.position.y = h * 0.5;
    deck.castShadow = true;
    deck.receiveShadow = true;
    const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.32, h * 1.4, d), hazardMat);
    sideL.position.set(-w * 0.46, h * 0.7, 0);
    const sideR = sideL.clone();
    sideR.position.x = w * 0.46;
    intactGroup.add(deck, sideL, sideR);
  } else if (kind === 'crate_stack') {
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x9a5b25, roughness: 0.75 });
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.52, h * 0.52, d * 0.52), crateMat);
    c1.position.set(-w * 0.22, h * 0.26, 0.08);
    const c2 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.48, h * 0.52, d * 0.48), steelMat);
    c2.position.set(w * 0.23, h * 0.26, -0.06);
    const c3 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.54, h * 0.48, d * 0.54), hazardMat);
    c3.position.set(0, h * 0.74, 0);
    c1.castShadow = true;
    c2.castShadow = true;
    c3.castShadow = true;
    intactGroup.add(c1, c2, c3);
  } else {
    // 'wall' or 'tower_facade'
    const wallMat = kind === 'tower_facade' ? brickMat : concreteMat;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    body.position.y = h * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    const sill = new THREE.Mesh(new THREE.BoxGeometry(w * 1.03, Math.min(0.45, h * 0.14), d * 1.06), hazardMat);
    sill.position.y = Math.min(0.3, h * 0.12);
    const topCap = new THREE.Mesh(new THREE.BoxGeometry(w * 1.04, Math.min(0.35, h * 0.12), d * 1.06), steelMat);
    topCap.position.y = h - Math.min(0.18, h * 0.06);
    intactGroup.add(body, sill, topCap);
  }

  // Damage fracture overlay shown once damaged
  const crackOverlay = new THREE.Mesh(
    new THREE.PlaneGeometry(Math.max(w, d) * 0.9, Math.max(h, d) * 0.9),
    new THREE.MeshBasicMaterial({
      map: textures.gammaGroundCrack,
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    })
  );
  crackOverlay.position.set(0, h * 0.52, d * 0.5 + 0.04);
  crackOverlay.visible = false;
  intactGroup.add(crackOverlay);

  // Scattered low-profile rubble stones left behind when shattered
  for (let i = 0; i < 6; i++) {
    const rx = ((i % 3) - 1) * (w * 0.32);
    const rz = (Math.floor(i / 3) - 0.5) * (d * 0.5);
    const chunk = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28 + (i % 3) * 0.12, 0), concreteMat);
    chunk.scale.set(1.3, 0.45, 1.1);
    chunk.position.set(rx, 0.14, rz);
    chunk.rotation.set(i * 0.7, i * 1.1, i * 0.4);
    rubbleGroup.add(chunk);
  }

  return { group, intactGroup, rubbleGroup, crackOverlay };
}

export function createHulkThrowableMesh(kind: ThrowableKind, colorHex = 0xfacc15): THREE.Group {
  const g = new THREE.Group();
  if (kind === 'car') {
    const car = createNycVehicleMesh(colorHex, colorHex === 0xfacc15);
    car.scale.setScalar(0.76);
    g.add(car);
    return g;
  }
  if (kind === 'container') {
    const boxMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.42, metalness: 0.55 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.65 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.45, 3.2), boxMat);
    box.position.y = 0.725;
    box.castShadow = true;
    g.add(box);
    for (let s = -1; s <= 1; s++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(2.18, 1.48, 0.16), trimMat);
      rib.position.set(0, 0.74, s * 1.05);
      g.add(rib);
    }
    return g;
  }
  if (kind === 'beam') {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.36, metalness: 0.75 });
    const web = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.56, 3.6), steelMat);
    web.position.y = 0.34;
    const topFlange = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.12, 3.6), steelMat);
    topFlange.position.y = 0.62;
    const botFlange = topFlange.clone();
    botFlange.position.y = 0.06;
    web.castShadow = true;
    g.add(web, topFlange, botFlange);
    return g;
  }
  if (kind === 'concrete') {
    const concMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.88, metalness: 0.08 });
    const rebarMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.4 });
    const block = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.05, 1.45), concMat);
    block.position.y = 0.525;
    block.castShadow = true;
    g.add(block);
    for (const sx of [-0.45, 0.45]) {
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.25, 6), rebarMat);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, 0.55, sx);
      g.add(bar);
    }
    return g;
  }
  // 'rock'
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.92, metalness: 0.06 });
  const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 1), rockMat);
  boulder.scale.set(1.15, 0.86, 1.05);
  boulder.position.y = 0.78;
  boulder.castShadow = true;
  g.add(boulder);
  return g;
}

export function createShockwaveRingMesh(colorHex = 0x84cc16): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(0.62, 1.0, 32), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  return mesh;
}

export function createGroundCrackDecalMesh(crackTex: THREE.Texture): THREE.Mesh {
  const mat = new THREE.MeshBasicMaterial({
    map: crackTex,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  return mesh;
}


