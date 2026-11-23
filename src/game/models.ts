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
  monkeyParts: THREE.Object3D[];
  monkeyTail: THREE.Group;
  botRocketRig: THREE.Group;
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

  // Monkey Hood & Ears on Head
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

  // Explorer Bandana Trim on Forehead
  const bandana = new THREE.Mesh(new THREE.TorusGeometry(0.375, 0.045, 8, 22), monkeyEmeraldMat);
  bandana.rotation.x = Math.PI / 2 - 0.14;
  bandana.position.set(0, 0.2, 0.02);
  bandana.visible = false;
  headGroup.add(bandana);
  monkeyParts.push(bandana);

  // Climbing Belt & Chest Harness
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

  // Grip Climbing Gloves on Arms
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

  // Articulated Curly Monkey Tail
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

  // Emergency Mini-Bot Rocket Rescue Booster beneath boots (visible when saving player from fall)
  const botRocketRig = new THREE.Group();
  botRocketRig.position.set(0, -0.32, 0);
  botRocketRig.visible = false;

  const rescueHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), ceramicWhite);
  rescueHead.position.y = 0.22;
  const rescueVisor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.14), visorGlass);
  rescueVisor.position.set(0, 0.22, 0.19);
  const rescueEyeGeo = new THREE.SphereGeometry(0.036, 8, 8);
  const rescueEyeL = new THREE.Mesh(rescueEyeGeo, cyanGlow);
  rescueEyeL.position.set(-0.07, 0.23, 0.26);
  const rescueEyeR = new THREE.Mesh(rescueEyeGeo, cyanGlow);
  rescueEyeR.position.set(0.07, 0.23, 0.26);

  const rescueCore = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.34, 14), psBlueMetal);
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
    color:
      kind === 'spiky'
        ? 0x991b1b
        : kind === 'hopper'
          ? 0x6b21a8
          : kind === 'brute'
            ? 0x7c2d12
            : 0x1e293b,
    roughness: 0.28,
    metalness: 0.62,
    clearcoat: 0.7,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color:
      kind === 'spiky'
        ? 0xfacc15
        : kind === 'hopper'
          ? 0xd8b4fe
          : kind === 'brute'
            ? 0xf97316
            : 0xf43f5e,
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

    // Twin Curved Horns
    const hornGeo = new THREE.ConeGeometry(0.11, 0.48, 8);
    const hornMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.8, roughness: 0.22 });
    const hornL = new THREE.Mesh(hornGeo, hornMat);
    hornL.position.set(-0.34, 1.24, 0.2);
    hornL.rotation.set(0.45, 0, 0.42);
    const hornR = new THREE.Mesh(hornGeo, hornMat);
    hornR.position.set(0.34, 1.24, 0.2);
    hornR.rotation.set(0.45, 0, -0.42);
    group.add(hornL, hornR);

    // Heavy Feet
    const footGeo = new THREE.BoxGeometry(0.32, 0.26, 0.42);
    const footL = new THREE.Mesh(footGeo, darkMat);
    footL.position.set(-0.26, 0.13, 0.05);
    const footR = new THREE.Mesh(footGeo, darkMat);
    footR.position.set(0.26, 0.13, 0.05);
    group.add(footL, footR);

    return { group, body, eyeMat };
  }

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

  const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, 0.26, d + 0.14), mossCapMat);
  cap.position.y = h / 2 - 0.1;
  cap.receiveShadow = true;
  group.add(cap);

  // Staggered climbing handholds on active face
  const isZ = face === 'pz' || face === 'nz';
  const sign = face === 'pz' || face === 'px' ? 1 : -1;
  const faceSpan = isZ ? w : d;
  const rows = Math.max(3, Math.floor(h / 1.15));
  const cols = Math.max(2, Math.floor(faceSpan / 1.25));
  const gripGeo = isZ ? new THREE.BoxGeometry(0.55, 0.16, 0.18) : new THREE.BoxGeometry(0.18, 0.16, 0.55);

  for (let r = 0; r < rows; r++) {
    const gy = -h / 2 + 0.85 + r * ((h - 1.3) / Math.max(1, rows - 1));
    for (let c = 0; c < cols; c++) {
      const offset = (c - (cols - 1) / 2) * 1.15 + ((r % 2) * 0.35 - 0.18);
      const grip = new THREE.Mesh(gripGeo, gripMat);
      if (isZ) {
        grip.position.set(THREE.MathUtils.clamp(offset, -w / 2 + 0.45, w / 2 - 0.45), gy, sign * (d / 2 + 0.08));
      } else {
        grip.position.set(sign * (w / 2 + 0.08), gy, THREE.MathUtils.clamp(offset, -d / 2 + 0.45, d / 2 - 0.45));
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

export function createBossMesh(): BossRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const armorMat = new THREE.MeshPhysicalMaterial({
    color: 0x311042,
    roughness: 0.25,
    metalness: 0.72,
    clearcoat: 0.85,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0x881337,
    emissiveIntensity: 0.55,
    metalness: 0.75,
    roughness: 0.22,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x090d16,
    roughness: 0.5,
    metalness: 0.45,
  });
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xf59e0b,
    emissiveIntensity: 2.2,
    roughness: 0.15,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xff1e42,
    emissive: 0xff1e42,
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
}

export function createRiverBoatRig(woodTex?: THREE.Texture): RiverBoatRig {
  const root = new THREE.Group();
  const hullGroup = new THREE.Group();
  root.add(hullGroup);

  const hullOrangeMat = new THREE.MeshPhysicalMaterial({
    color: 0xf97316,
    roughness: 0.25,
    metalness: 0.12,
    clearcoat: 0.7,
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
    emissiveIntensity: 0.35,
    metalness: 0.7,
    roughness: 0.25,
  });

  // Main wooden boat deck oriented with bow at -Z
  const deck = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.26, 2.7), deckMat);
  deck.position.y = 0.28;
  deck.castShadow = true;
  deck.receiveShadow = true;
  hullGroup.add(deck);

  // Pointed expedition bow
  const bowGeo = new THREE.ConeGeometry(0.88, 1.15, 4);
  bowGeo.rotateY(Math.PI / 4);
  bowGeo.rotateX(-Math.PI / 2);
  const bow = new THREE.Mesh(bowGeo, hullOrangeMat);
  bow.scale.set(1.05, 0.42, 1.0);
  bow.position.set(0, 0.32, -1.75);
  bow.castShadow = true;
  hullGroup.add(bow);

  // Twin inflatable expedition pontoons
  const pontoonGeo = new THREE.CapsuleGeometry(0.28, 2.5, 6, 12);
  pontoonGeo.rotateX(Math.PI / 2);
  const ponL = new THREE.Mesh(pontoonGeo, hullOrangeMat);
  ponL.position.set(-0.92, 0.3, 0);
  ponL.castShadow = true;
  const ponR = ponL.clone();
  ponR.position.x = 0.92;
  hullGroup.add(ponL, ponR);

  // Protective bow bumper & windshield bar
  const rail = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.05, 8, 16, Math.PI), goldMat);
  rail.rotation.x = Math.PI / 2;
  rail.rotation.z = Math.PI;
  rail.position.set(0, 0.56, -1.05);
  hullGroup.add(rail);

  const helm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.32), trimMat);
  helm.position.set(0, 0.58, -0.58);
  hullGroup.add(helm);

  // Rear outboard motor + spinning brass propeller
  const motorHead = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.45), trimMat);
  motorHead.position.set(0, 0.56, 1.48);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.52, 8), trimMat);
  shaft.position.set(0, 0.25, 1.56);
  hullGroup.add(motorHead, shaft);

  const propeller = new THREE.Group();
  propeller.position.set(0, 0.04, 1.64);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), goldMat);
  const bladeA = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.08, 0.04), goldMat);
  const bladeB = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.04), goldMat);
  propeller.add(hub, bladeA, bladeB);
  hullGroup.add(propeller);

  // Stern whitewater wake spray ribbons
  const wakeMat = new THREE.MeshBasicMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
  });
  const wakeGeo = new THREE.PlaneGeometry(0.45, 1.9);
  wakeGeo.rotateX(-Math.PI / 2);
  const wakeL = new THREE.Mesh(wakeGeo, wakeMat);
  wakeL.position.set(-0.62, 0.06, 2.25);
  wakeL.rotation.y = 0.22;
  const wakeR = new THREE.Mesh(wakeGeo, wakeMat);
  wakeR.position.set(0.62, 0.06, 2.25);
  wakeR.rotation.y = -0.22;
  hullGroup.add(wakeL, wakeR);

  return { root, hullGroup, propeller, wakeL, wakeR };
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

  // 1st & 2nd Observation Decks with warm coral & burgundy trim
  const deck1 = new THREE.Mesh(new THREE.BoxGeometry(15.6, 1.5, 15.6), warmIronMat);
  deck1.position.y = 11.2;
  const deck1Trim = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.42, 16.0), burgundyMat);
  deck1Trim.position.y = 12.1;

  const deck2 = new THREE.Mesh(new THREE.BoxGeometry(10.6, 1.35, 10.6), warmIronMat);
  deck2.position.y = 21.5;
  const deck2Trim = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.38, 11.0), burgundyMat);
  deck2Trim.position.y = 22.3;

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

  // Iconic Tapered Eiffel Pinnacle Crown + Burgundy Spire rising cleanly behind spawn (+Z)
  const spireBase = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 1.35, 3.6, 4), warmIronMat);
  spireBase.rotation.y = Math.PI / 4;
  spireBase.position.set(0, 39.8, 2.35);
  const spireCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 0.65, 8), goldLightMat);
  spireCrown.position.set(0, 41.8, 2.35);
  const spireNeedle = new THREE.Mesh(new THREE.ConeGeometry(0.26, 3.8, 8), burgundyMat);
  spireNeedle.position.set(0, 43.9, 2.35);
  g.add(deck1, deck1Trim, deck2, deck2Trim, summitFloor, spireBase, spireCrown, spireNeedle);

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
    color: 0xe8dfd1,
    roughness: 0.78,
    metalness: 0.04,
  });
  const corniceMat = new THREE.MeshStandardMaterial({
    color: 0xd4c6b0,
    roughness: 0.72,
  });
  const reliefMat = new THREE.MeshStandardMaterial({
    color: 0xc2b29a,
    roughness: 0.68,
  });
  const flameMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xf97316,
    emissiveIntensity: 2.2,
  });

  // Twin monumental stone piers framing the Goal Portal
  const pierGeo = new THREE.BoxGeometry(3.8, 9.6, 5.2);
  const pierL = new THREE.Mesh(pierGeo, stoneMat);
  pierL.position.set(-4.6, 4.8, 0);
  pierL.castShadow = true;
  pierL.receiveShadow = true;
  const pierR = pierL.clone();
  pierR.position.x = 4.6;
  g.add(pierL, pierR);

  // Decorative relief plaques on front piers
  const plaqueGeo = new THREE.BoxGeometry(2.2, 3.8, 0.25);
  const plaqueL = new THREE.Mesh(plaqueGeo, reliefMat);
  plaqueL.position.set(-4.6, 3.4, 2.65);
  const plaqueR = plaqueL.clone();
  plaqueR.position.x = 4.6;
  g.add(plaqueL, plaqueR);

  // Central rounded arch vault
  const archSpan = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.9, 10, 24, Math.PI), corniceMat);
  archSpan.position.set(0, 6.2, 0);
  archSpan.scale.set(1, 1, 2.8);
  g.add(archSpan);

  // Upper entablature & attic frieze crowning the arch
  const frieze = new THREE.Mesh(new THREE.BoxGeometry(13.6, 3.4, 5.5), stoneMat);
  frieze.position.set(0, 10.9, 0);
  frieze.castShadow = true;
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.7, 6.1), corniceMat);
  cornice.position.set(0, 9.3, 0);
  const topCap = new THREE.Mesh(new THREE.BoxGeometry(14.2, 0.65, 5.9), corniceMat);
  topCap.position.set(0, 12.8, 0);
  g.add(frieze, cornice, topCap);

  // Golden Eternal Flame torches flanking the arch
  for (const sx of [-4.6, 4.6]) {
    const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.32, 0.45, 12), corniceMat);
    brazier.position.set(sx, 0.25, 3.2);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 8), flameMat);
    flame.position.set(sx, 0.72, 3.2);
    g.add(brazier, flame);
  }

  return g;
}

