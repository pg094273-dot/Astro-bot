import * as THREE from 'three';
import { EnemyKind } from './types';

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
}

export function createAstroBot(): AstroBotRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const ceramicWhite = new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    roughness: 0.16,
    metalness: 0.06,
    clearcoat: 0.95,
    clearcoatRoughness: 0.1,
  });

  const psBlueMetal = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.22,
    metalness: 0.8,
  });

  const silverMetal = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.25,
    metalness: 0.85,
  });

  const darkJoint = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.62,
    metalness: 0.28,
  });

  const visorGlass = new THREE.MeshPhysicalMaterial({
    color: 0x050a14,
    roughness: 0.05,
    metalness: 0.12,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
  });

  const cyanGlow = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 2.3,
    roughness: 0.18,
  });

  const capeMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    roughness: 0.5,
    metalness: 0.18,
    side: THREE.DoubleSide,
  });

  // Torso & Collar
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.24, 0.25, 10, 18), ceramicWhite);
  torso.position.y = 0.69;
  torso.castShadow = true;
  bodyGroup.add(torso);

  const neckCollar = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.04, 8, 18), psBlueMetal);
  neckCollar.rotation.x = Math.PI / 2;
  neckCollar.position.y = 0.9;
  bodyGroup.add(neckCollar);

  // Sculpted Chest Armor & Core
  const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.28), psBlueMetal);
  chestPlate.position.set(0, 0.72, 0.09);
  chestPlate.castShadow = true;
  bodyGroup.add(chestPlate);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.245, 0.23, 0.07, 16), darkJoint);
  belt.position.y = 0.54;
  bodyGroup.add(belt);

  const coreLight = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.05, 16), cyanGlow);
  coreLight.rotation.x = Math.PI / 2;
  coreLight.position.set(0, 0.73, 0.23);
  bodyGroup.add(coreLight);

  // Jetpack with Winglet Fins & Metallic Nozzles
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.2), darkJoint);
  pack.position.set(0, 0.73, -0.22);
  pack.castShadow = true;
  bodyGroup.add(pack);

  const finGeo = new THREE.BoxGeometry(0.04, 0.2, 0.18);
  const finL = new THREE.Mesh(finGeo, psBlueMetal);
  finL.position.set(-0.2, 0.82, -0.26);
  finL.rotation.z = 0.35;
  const finR = new THREE.Mesh(finGeo, psBlueMetal);
  finR.position.set(0.2, 0.82, -0.26);
  finR.rotation.z = -0.35;
  bodyGroup.add(finL, finR);

  const nozzleGeo = new THREE.CylinderGeometry(0.055, 0.075, 0.12, 12);
  const nozzleL = new THREE.Mesh(nozzleGeo, silverMetal);
  nozzleL.position.set(-0.1, 0.55, -0.24);
  const nozzleR = new THREE.Mesh(nozzleGeo, silverMetal);
  nozzleR.position.set(0.1, 0.55, -0.24);
  bodyGroup.add(nozzleL, nozzleR);

  const thrusterLeft = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 12), cyanGlow);
  thrusterLeft.rotation.x = Math.PI;
  thrusterLeft.position.set(-0.1, 0.41, -0.24);
  thrusterLeft.visible = false;
  bodyGroup.add(thrusterLeft);

  const thrusterRight = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.28, 12), cyanGlow);
  thrusterRight.rotation.x = Math.PI;
  thrusterRight.position.set(0.1, 0.41, -0.24);
  thrusterRight.visible = false;
  bodyGroup.add(thrusterRight);

  // Cape with gold clasp
  const capeGroup = new THREE.Group();
  capeGroup.position.set(0, 0.86, -0.26);
  const capeShape = new THREE.Shape();
  capeShape.moveTo(-0.19, 0);
  capeShape.lineTo(0.19, 0);
  capeShape.lineTo(0.3, -0.54);
  capeShape.lineTo(0, -0.65);
  capeShape.lineTo(-0.3, -0.54);
  capeShape.closePath();
  const capeMesh = new THREE.Mesh(new THREE.ShapeGeometry(capeShape), capeMat);
  capeMesh.rotation.x = 0.24;
  capeGroup.add(capeMesh);
  bodyGroup.add(capeGroup);

  // Sculpted Helmet Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.18, 0);
  bodyGroup.add(headGroup);

  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.37, 26, 20), ceramicWhite);
  helmet.scale.set(1.08, 0.96, 1.02);
  helmet.castShadow = true;
  headGroup.add(helmet);

  // Helmet blue crown crest
  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.46), psBlueMetal);
  crest.position.set(0, 0.34, -0.04);
  headGroup.add(crest);

  // Ear Pods with Glowing Cyan Rings
  const earGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.11, 16);
  const earRingGeo = new THREE.TorusGeometry(0.11, 0.022, 8, 18);

  const leftEar = new THREE.Mesh(earGeo, psBlueMetal);
  leftEar.rotation.z = Math.PI / 2;
  leftEar.position.set(-0.38, 0, 0);
  const leftEarRing = new THREE.Mesh(earRingGeo, cyanGlow);
  leftEarRing.rotation.y = Math.PI / 2;
  leftEarRing.position.set(-0.44, 0, 0);

  const rightEar = new THREE.Mesh(earGeo, psBlueMetal);
  rightEar.rotation.z = Math.PI / 2;
  rightEar.position.set(0.38, 0, 0);
  const rightEarRing = new THREE.Mesh(earRingGeo, cyanGlow);
  rightEarRing.rotation.y = Math.PI / 2;
  rightEarRing.position.set(0.44, 0, 0);
  headGroup.add(leftEar, leftEarRing, rightEar, rightEarRing);

  // Visor + Bezel
  const visorBezel = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 18), silverMetal);
  visorBezel.scale.set(0.98, 0.72, 0.44);
  visorBezel.position.set(0, 0.01, 0.21);
  headGroup.add(visorBezel);

  const visorFront = new THREE.Mesh(new THREE.SphereGeometry(0.33, 24, 18), visorGlass);
  visorFront.scale.set(0.94, 0.66, 0.46);
  visorFront.position.set(0, 0.01, 0.23);
  headGroup.add(visorFront);

  // Glowing LED Eyes
  const eyeGeo = new THREE.CapsuleGeometry(0.038, 0.058, 6, 12);
  const leftEye = new THREE.Mesh(eyeGeo, cyanGlow);
  leftEye.position.set(-0.11, 0.02, 0.37);
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, cyanGlow);
  rightEye.position.set(0.11, 0.02, 0.37);
  headGroup.add(rightEye);

  // Antenna
  const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.028, 0.2, 10), silverMetal);
  antennaStem.position.set(0, 0.4, -0.02);
  headGroup.add(antennaStem);

  const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), cyanGlow);
  antennaTip.position.set(0, 0.52, -0.02);
  headGroup.add(antennaTip);

  // Articulated Arms with Pauldrons & Cuffs
  const makeArm = (side: number) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.32, 0.84, 0);
    const pauldron = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), ceramicWhite);
    pauldron.scale.set(1.1, 0.8, 1.1);
    arm.add(pauldron);

    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.17, 6, 10), darkJoint);
    upper.position.y = -0.15;
    upper.castShadow = true;
    arm.add(upper);

    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.06, 12), psBlueMetal);
    cuff.position.y = -0.24;
    arm.add(cuff);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), ceramicWhite);
    glove.position.y = -0.31;
    glove.castShadow = true;
    arm.add(glove);
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

  // Articulated Legs & Rocket Boots
  const makeLeg = (side: number) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.13, 0.46, 0);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.25, 12), darkJoint);
    shin.position.y = -0.15;
    shin.castShadow = true;
    leg.add(shin);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.15, 0.25), ceramicWhite);
    boot.position.set(0, -0.35, 0.04);
    boot.castShadow = true;
    leg.add(boot);

    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.045, 0.26), psBlueMetal);
    sole.position.set(0, -0.435, 0.04);
    leg.add(sole);

    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.18), cyanGlow);
    vent.position.set(0, -0.455, 0.04);
    leg.add(vent);

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

  const ceramicWhite = new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    roughness: 0.14,
    metalness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });
  const psBlue = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    roughness: 0.22,
    metalness: 0.82,
  });
  const darkTrim = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.5,
    metalness: 0.4,
  });
  const canopyGlass = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    roughness: 0.08,
    metalness: 0.1,
    transparent: true,
    opacity: 0.45,
    clearcoat: 1.0,
  });
  const plasmaMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.9,
  });

  // Sleek Lathe Fuselage oriented along -Z (forward)
  const pts = [
    new THREE.Vector2(0.01, 1.55),
    new THREE.Vector2(0.32, 1.1),
    new THREE.Vector2(0.55, 0.3),
    new THREE.Vector2(0.52, -0.7),
    new THREE.Vector2(0.38, -1.25),
    new THREE.Vector2(0.01, -1.25),
  ];
  const fuselageGeo = new THREE.LatheGeometry(pts, 20);
  fuselageGeo.rotateX(-Math.PI / 2); // +Y becomes -Z (nose points forward to -Z)
  const fuselage = new THREE.Mesh(fuselageGeo, ceramicWhite);
  fuselage.position.y = 0.62;
  fuselage.castShadow = true;
  hullGroup.add(fuselage);

  // Blue nose band & cockpit rim
  const noseBand = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.06, 10, 22), psBlue);
  noseBand.position.set(0, 0.62, -0.65);
  hullGroup.add(noseBand);

  // DualSense-inspired Swept Delta Wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0.45, 0.3);
  wingShape.lineTo(1.55, -0.75);
  wingShape.lineTo(1.55, -1.15);
  wingShape.lineTo(0.35, -0.95);
  wingShape.closePath();

  const extrudeWing = new THREE.ExtrudeGeometry(wingShape, {
    depth: 0.09,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
  extrudeWing.rotateX(-Math.PI / 2);

  const rightWing = new THREE.Mesh(extrudeWing, psBlue);
  rightWing.position.set(0, 0.56, 0);
  rightWing.castShadow = true;
  hullGroup.add(rightWing);

  const leftWing = rightWing.clone();
  leftWing.scale.x = -1;
  hullGroup.add(leftWing);

  // Wingtip glowing rails
  const railGeo = new THREE.BoxGeometry(0.08, 0.12, 0.55);
  const railMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 2.0,
  });
  const railL = new THREE.Mesh(railGeo, railMat);
  railL.position.set(-1.55, 0.6, 0.92);
  const railR = new THREE.Mesh(railGeo, railMat);
  railR.position.set(1.55, 0.6, 0.92);
  hullGroup.add(railL, railR);

  // Cockpit Windshield Canopy
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), canopyGlass);
  canopy.scale.set(0.9, 0.85, 1.45);
  canopy.position.set(0, 0.95, -0.15);
  hullGroup.add(canopy);

  // Twin Rear Thruster Pods & Flames
  const podGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.55, 16);
  podGeo.rotateX(Math.PI / 2);
  const podL = new THREE.Mesh(podGeo, darkTrim);
  podL.position.set(-0.34, 0.6, 1.2);
  const podR = new THREE.Mesh(podGeo, darkTrim);
  podR.position.set(0.34, 0.6, 1.2);
  hullGroup.add(podL, podR);

  const flameGeo = new THREE.ConeGeometry(0.2, 1.1, 14);
  flameGeo.rotateX(Math.PI / 2);
  const flameL = new THREE.Mesh(flameGeo, plasmaMat);
  flameL.position.set(-0.34, 0.6, 1.95);
  const flameR = new THREE.Mesh(flameGeo, plasmaMat);
  flameR.position.set(0.34, 0.6, 1.95);
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

  const whiteMat = new THREE.MeshPhysicalMaterial({
    color: 0xf1f5f9,
    roughness: 0.2,
    clearcoat: 0.85,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    roughness: 0.28,
    metalness: 0.7,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.1,
  });
  const visorGlow = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.0,
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.16, 6, 12), whiteMat);
  body.position.y = 0.34;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 14), whiteMat);
  head.position.y = 0.68;
  head.castShadow = true;
  group.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.14), visorMat);
  visor.position.set(0, 0.68, 0.16);
  group.add(visor);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), visorGlow);
  eyeL.position.set(-0.075, 0.68, 0.23);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), visorGlow);
  eyeR.position.set(0.075, 0.68, 0.23);
  group.add(eyeL, eyeR);

  const band = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.03, 8, 20), accentMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.68;
  group.add(band);

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
}

export function createEnemyMesh(kind: EnemyKind): EnemyRig {
  const group = new THREE.Group();

  const shellMat = new THREE.MeshPhysicalMaterial({
    color: kind === 'spiky' ? 0x991b1b : kind === 'hopper' ? 0x6b21a8 : 0x1e293b,
    roughness: 0.28,
    metalness: 0.62,
    clearcoat: 0.7,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: kind === 'spiky' ? 0xfacc15 : kind === 'hopper' ? 0xd8b4fe : 0xf43f5e,
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

  if (kind === 'chomper') {
    // Armored beetle/chomp-bot with articulated jaw & windup key
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 14, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55), shellMat);
    body.position.y = 0.44;
    body.castShadow = true;
    group.add(body);

    const jawUpper = new THREE.Mesh(new THREE.SphereGeometry(0.43, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.48), trimMat);
    jawUpper.position.y = 0.48;
    jawUpper.castShadow = true;
    group.add(jawUpper);

    // Glowing teeth studs
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

    // Dorsal Wind-up Key
    const windupKey = new THREE.Group();
    windupKey.position.set(0, 0.92, -0.05);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.24, 10), trimMat);
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 8, 16), trimMat);
    loop.position.y = 0.14;
    windupKey.add(stem, loop);
    group.add(windupKey);

    // Side armored treads
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
    // Spring-coil Pogo Robot with radar dish
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

  // Spiky Shield Sentinel (7 gleaming spikes + hazard halo)
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

  // Top + ring spikes
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

export function createGoalPortalMesh(): { group: THREE.Group; ringInner: THREE.Mesh } {
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

  return { group, ringInner };
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
    new THREE.TorusGeometry(2.6, 0.18, 12, 32),
    new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.4,
      metalness: 0.7,
      roughness: 0.2,
    })
  );
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.08, 8, 28),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 })
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

