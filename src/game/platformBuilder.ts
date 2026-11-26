import * as THREE from 'three';
import { ProceduralTextures } from './textures';
import { PlatformDef } from './types';

function createRoundedSlabGeometry(w: number, h: number, d: number, bevel = 0.14): THREE.BufferGeometry {
  const r = Math.min(bevel, Math.min(w, d) * 0.22);
  const hw = Math.max(0.1, w * 0.5 - r);
  const hd = Math.max(0.1, d * 0.5 - r);

  const shape = new THREE.Shape();
  shape.moveTo(-hw, -hd - r);
  shape.lineTo(hw, -hd - r);
  shape.quadraticCurveTo(hw + r, -hd - r, hw + r, -hd);
  shape.lineTo(hw + r, hd);
  shape.quadraticCurveTo(hw + r, hd + r, hw, hd + r);
  shape.lineTo(-hw, hd + r);
  shape.quadraticCurveTo(-hw - r, hd + r, -hw - r, hd);
  shape.lineTo(-hw - r, -hd);
  shape.quadraticCurveTo(-hw - r, -hd - r, -hw, -hd - r);

  const depth = Math.max(0.08, h - r * 0.7);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: r * 0.35,
    bevelSize: r * 0.35,
    bevelSegments: 2,
    curveSegments: 4,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();

  // Compute clean planar world-scaled top/side UVs so procedural textures tile nicely without stretching
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);
    const ny = Math.abs(nrm.getY(i));
    if (ny > 0.65) {
      uv[i * 2] = (px / Math.max(1, w) + 0.5);
      uv[i * 2 + 1] = (pz / Math.max(1, d) + 0.5);
    } else {
      const horiz = Math.abs(nrm.getX(i)) > Math.abs(nrm.getZ(i)) ? pz : px;
      uv[i * 2] = (horiz / Math.max(1, Math.max(w, d)) + 0.5);
      uv[i * 2 + 1] = (py / Math.max(1, h) + 0.5);
    }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

function hashSeed(id: string): number {
  let h = 17;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 997;
  }
  return h * 0.13;
}

function applyPlanarTopSideUVs(geo: THREE.BufferGeometry, w: number, h: number, d: number) {
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);
    const ny = Math.abs(nrm.getY(i));
    if (ny > 0.65) {
      uv[i * 2] = px / Math.max(1, w) + 0.5;
      uv[i * 2 + 1] = pz / Math.max(1, d) + 0.5;
    } else {
      const horiz = Math.abs(nrm.getX(i)) > Math.abs(nrm.getZ(i)) ? pz : px;
      uv[i * 2] = horiz / Math.max(1, Math.max(w, d)) + 0.5;
      uv[i * 2 + 1] = py / Math.max(1, h) + 0.5;
    }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

function createOrganicIslandGeometry(w: number, h: number, d: number, seed: number): THREE.BufferGeometry {
  const hw = w * 0.5;
  const hd = d * 0.5;
  const segs = 28;
  const shape = new THREE.Shape();

  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    const cx = Math.cos(t);
    const cz = Math.sin(t);
    // Superellipse exponent ~3.4 keeps rectangular walk coverage while curving corners naturally
    const sx = Math.sign(cx) * Math.pow(Math.abs(cx), 0.58);
    const sz = Math.sign(cz) * Math.pow(Math.abs(cz), 0.58);
    const lobe =
      1.0 +
      0.045 * Math.sin(t * 3 + seed) +
      0.032 * Math.cos(t * 5 - seed * 1.4) +
      0.02 * Math.sin(t * 7 + seed * 0.7);
    const px = sx * hw * lobe;
    const pz = sz * hd * lobe;
    if (i === 0) shape.moveTo(px, pz);
    else shape.lineTo(px, pz);
  }

  const bevel = Math.min(0.24, Math.min(w, d) * 0.08);
  const depth = Math.max(0.12, h - bevel * 0.7);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel * 0.42,
    bevelSize: bevel * 0.48,
    bevelSegments: 2,
    curveSegments: 3,
  });
  geo.rotateX(-Math.PI / 2);
  geo.center();
  applyPlanarTopSideUVs(geo, w, h, d);
  return geo;
}

function createCraggyUnderbellyGeo(w: number, d: number, depth: number, seed: number): THREE.BufferGeometry {
  const minR = Math.min(w, d) * 0.46;
  const geo = new THREE.CylinderGeometry(minR, minR * 0.22, depth, 14, 4, false);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const yNorm = (vy + depth * 0.5) / depth; // 0 at tip, 1 at top
    const strata =
      1.0 +
      0.16 * Math.sin(vy * 2.1 + seed) +
      0.14 * Math.cos(Math.atan2(vz, vx) * 4 + seed * 1.3) * (1.1 - yNorm * 0.5);
    pos.setXYZ(i, vx * strata * (w / Math.min(w, d)), vy, vz * strata * (d / Math.min(w, d)));
  }
  geo.computeVertexNormals();
  return geo;
}

export function buildStyledPlatformMesh(
  def: PlatformDef,
  textures: ProceduralTextures,
  createBaseMaterial: (def: PlatformDef) => THREE.Material | THREE.Material[],
  isSoftwareGl: boolean,
  options?: {
    emeraldJungleV2?: boolean;
    desertDunesV2?: boolean;
    auroraGlacierV2?: boolean;
    monkeyTempleV2?: boolean;
    volcanicCanyonV2?: boolean;
    nebulaCitadelV2?: boolean;
    parisSkyV2?: boolean;
    rapidsRiverV2?: boolean;
  }
): THREE.Mesh {
  const [w, h, d] = def.size;
  const baseMat = createBaseMaterial(def);
  const style = def.style ?? 'tech';
  const jungleV2 = Boolean(options?.emeraldJungleV2);
  const desertV2 = Boolean(options?.desertDunesV2);
  const iceV2 = Boolean(options?.auroraGlacierV2);
  const templeV2 = Boolean(options?.monkeyTempleV2);
  const volcanicV2 = Boolean(options?.volcanicCanyonV2);
  const nebulaV2 = Boolean(options?.nebulaCitadelV2);
  const parisV2 = Boolean(options?.parisSkyV2);
  const rapidsV2 = Boolean(options?.rapidsRiverV2);
  const seed = hashSeed(def.id);

  // Use a sculpted composite Mesh as the primary entity (Engine still reads mesh.position & mesh.material cleanly)
  const useDisc = def.kind === 'rotating' || def.shape === 'disc' || def.shape === 'pillar';
  const mainGeo = useDisc
    ? new THREE.CylinderGeometry(
        Math.max(w, d) * 0.5,
        Math.max(w, d) * (def.shape === 'pillar' ? 0.48 : 0.45),
        h,
        def.shape === 'pillar' ? 14 : volcanicV2 ? 12 : nebulaV2 ? 16 : 24
      )
    : (jungleV2 && (def.shape === 'organic' || style === 'jungle') && def.kind !== 'glass' && def.kind !== 'disappearing') ||
        (desertV2 && def.shape === 'organic' && def.kind !== 'glass' && def.kind !== 'disappearing') ||
        (iceV2 && def.shape === 'organic' && def.kind !== 'glass' && def.kind !== 'disappearing') ||
        (templeV2 && def.shape === 'organic' && def.kind !== 'glass' && def.kind !== 'disappearing') ||
        (volcanicV2 && def.shape === 'organic' && def.kind !== 'glass' && def.kind !== 'disappearing') ||
        (rapidsV2 && def.shape === 'organic' && def.kind !== 'glass' && def.kind !== 'disappearing')
      ? createOrganicIslandGeometry(w, h, d, seed)
      : createRoundedSlabGeometry(
          w,
          h,
          d,
          nebulaV2 ? Math.min(0.62, Math.min(w, d) * 0.16) : Math.min(0.26, Math.min(w, d) * 0.09)
        );

  // If baseMat is a 6-face BoxGeometry material array, adapt gracefully to Extrude/Cylinder (single or dual material)
  const useJungleRuinTex = jungleV2 && (def.shape === 'ruin' || style === 'temple');
  const useDesertRuinTex = desertV2 && (def.shape === 'ruin' || def.shape === 'bridge' || def.kind === 'crumble');
  const useIceGlassMat = iceV2 && (def.kind === 'glass' || def.kind === 'disappearing');
  const useIceRuinTex = iceV2 && def.shape === 'ruin';
  const useTempleJadeMat = templeV2 && def.kind === 'disappearing' && style === 'crystal';
  const useTempleCarvedTex =
    templeV2 && !useTempleJadeMat && (def.shape === 'ruin' || def.shape === 'pillar' || def.id === 'm-summit');
  const useVolcanicCrystalMat = volcanicV2 && def.kind === 'glass' && style === 'crystal';
  const useNebulaCrystalMat = nebulaV2 && (def.kind === 'glass' || def.kind === 'disappearing');
  const resolvedMat = useIceGlassMat
    ? new THREE.MeshPhysicalMaterial({
        map: textures.iceCrystal,
        bumpMap: textures.iceBump,
        bumpScale: 0.06,
        color: 0xbef0ff,
        emissive: 0x075985,
        emissiveIntensity: 0.24,
        roughness: 0.07,
        metalness: 0.06,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        transmission: isSoftwareGl ? 0 : 0.72,
        ior: 1.31,
        thickness: 1.45,
        attenuationColor: new THREE.Color(0x0ea5e9),
        attenuationDistance: 2.8,
        transparent: true,
        opacity: isSoftwareGl ? 0.72 : 0.94,
        envMapIntensity: 1.55,
      })
    : useTempleJadeMat
      ? new THREE.MeshPhysicalMaterial({
          map: textures.crystalCircuit,
          bumpMap: textures.templeCarvedBump,
          bumpScale: 0.08,
          color: 0x6ee7b7,
          emissive: 0x047857,
          emissiveIntensity: 0.42,
          roughness: 0.12,
          metalness: 0.14,
          clearcoat: 1.0,
          transparent: true,
          opacity: 0.9,
        })
      : useVolcanicCrystalMat
        ? new THREE.MeshPhysicalMaterial({
            map: textures.crystalCircuit,
            bumpMap: textures.basaltBump,
            bumpScale: 0.08,
            color: 0xfdba74,
            emissive: 0xea580c,
            emissiveIntensity: 0.72,
            roughness: 0.12,
            metalness: 0.18,
            clearcoat: 1.0,
            transparent: true,
            opacity: 0.88,
          })
        : useNebulaCrystalMat
          ? new THREE.MeshPhysicalMaterial({
              map: textures.crystalCircuit,
              bumpMap: textures.nebulaBump,
              bumpScale: 0.06,
              color: 0x7dd3fc,
              emissive: 0x0ea5e9,
              emissiveIntensity: 0.85,
              roughness: 0.08,
              metalness: 0.24,
              clearcoat: 1.0,
              transparent: true,
              opacity: def.kind === 'glass' ? 0.86 : 0.9,
            })
      : Array.isArray(baseMat)
      ? new THREE.MeshStandardMaterial({
          map: useJungleRuinTex
            ? textures.jungleRuinStone
            : useDesertRuinTex
              ? textures.desertRuinStone
              : useIceRuinTex
                ? textures.glacialRock
                : useTempleCarvedTex
                  ? textures.templeCarvedStone
                  : ((baseMat[2] as THREE.MeshStandardMaterial)?.map ?? null),
          bumpMap: useJungleRuinTex
            ? textures.jungleRuinBump
            : useDesertRuinTex
              ? textures.desertRuinBump
              : useIceRuinTex
                ? textures.glacialRockBump
                : useTempleCarvedTex
                  ? textures.templeCarvedBump
                  : ((baseMat[2] as THREE.MeshStandardMaterial)?.bumpMap ?? null),
          bumpScale: useJungleRuinTex
            ? 0.16
            : useDesertRuinTex
              ? 0.18
              : useIceRuinTex
                ? 0.18
                : useTempleCarvedTex
                  ? 0.22
                  : ((baseMat[2] as THREE.MeshStandardMaterial)?.bumpScale ?? 0.08),
          roughnessMap: (baseMat[2] as THREE.MeshStandardMaterial)?.roughnessMap ?? textures.stoneRoughness,
          roughness: (baseMat[2] as THREE.MeshStandardMaterial)?.roughness ?? 0.72,
          metalness: (baseMat[2] as THREE.MeshStandardMaterial)?.metalness ?? 0.14,
          emissive: (baseMat[2] as THREE.MeshStandardMaterial)?.emissive ?? new THREE.Color(0x000000),
          emissiveMap: (baseMat[2] as THREE.MeshStandardMaterial)?.emissiveMap ?? null,
          emissiveIntensity: (baseMat[2] as THREE.MeshStandardMaterial)?.emissiveIntensity ?? 0,
        })
      : baseMat;

  const mesh = new THREE.Mesh(mainGeo, resolvedMat);
  mesh.position.set(def.pos[0], def.pos[1], def.pos[2]);
  mesh.castShadow = !isSoftwareGl && !def.invisible && def.kind !== 'glass';
  mesh.receiveShadow = !isSoftwareGl && !def.invisible;

  if (def.invisible) {
    mesh.visible = false;
    return mesh;
  }

  // Translucent fractured glacial ice bridge inclusions, fracture veins & hanging icicles (Level 3)
  if (useIceGlassMat) {
    const crackMat = new THREE.MeshStandardMaterial({
      color: 0xe0f7ff,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.05,
      roughness: 0.15,
      transparent: true,
      opacity: 0.88,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const innerCrystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x67e8f9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.75,
      roughness: 0.08,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.8,
    });
    const crackSeams: THREE.Mesh[] = [];
    for (let c = 0; c < 3; c++) {
      const seam = new THREE.Mesh(
        new THREE.BoxGeometry(w * (0.68 - c * 0.12), 0.045, 0.085),
        crackMat.clone()
      );
      seam.position.set((c - 1) * (w * 0.14), h * 0.5 + 0.015, (c % 2 === 0 ? 1 : -1) * (d * 0.16));
      seam.rotation.y = (c === 0 ? 0.42 : c === 1 ? -0.58 : 0.18) + seed * 0.2;
      mesh.add(seam);
      crackSeams.push(seam);
    }
    mesh.userData.iceCrackSeams = crackSeams;

    // Suspended faceted frost crystals inside the ice deck + hanging translucent icicles underneath
    for (let k = 0; k < 4; k++) {
      const ang = (k / 4) * Math.PI * 2 + seed;
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.24 + (k % 2) * 0.09, 0), innerCrystalMat);
      shard.scale.set(0.65, 1.45, 0.65);
      shard.position.set(Math.cos(ang) * (w * 0.28), 0, Math.sin(ang) * (d * 0.28));
      shard.rotation.set(0.25, ang, 0.3);
      mesh.add(shard);

      const icicleH = 0.85 + (k % 3) * 0.42;
      const icicle = new THREE.Mesh(new THREE.ConeGeometry(0.18, icicleH, 6), innerCrystalMat);
      icicle.rotation.x = Math.PI;
      icicle.position.set(Math.cos(ang + 0.5) * (w * 0.34), -h * 0.48 - icicleH * 0.48, Math.sin(ang + 0.5) * (d * 0.34));
      mesh.add(icicle);
    }
  }

  if (useVolcanicCrystalMat && def.shape === 'bridge') {
    const alongZ = d >= w;
    const span = alongZ ? d : w;
    const width = alongZ ? w : d;
    const magmaCrystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xfb923c,
      emissive: 0xea580c,
      emissiveIntensity: 1.35,
      roughness: 0.12,
      metalness: 0.2,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.88,
    });
    const basaltTrimMat = new THREE.MeshStandardMaterial({
      map: textures.volcanicSide,
      emissiveMap: textures.volcanicSideEmissive,
      emissive: 0xff5a00,
      emissiveIntensity: 1.25,
      bumpMap: textures.basaltBump,
      bumpScale: 0.18,
      roughness: 0.84,
    });
    for (const side of [-1, 1]) {
      const edge = side * (width * 0.46);
      const rail = new THREE.Mesh(
        alongZ ? new THREE.BoxGeometry(0.16, 0.16, span * 0.94) : new THREE.BoxGeometry(span * 0.94, 0.16, 0.16),
        magmaCrystalMat
      );
      rail.position.set(alongZ ? edge : 0, h * 0.5 + 0.65, alongZ ? 0 : edge);
      mesh.add(rail);
      for (let p = -1; p <= 1; p++) {
        const tp = p * span * 0.36;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.86, 6), basaltTrimMat);
        post.position.set(alongZ ? edge : tp, h * 0.5 + 0.4, alongZ ? tp : edge);
        const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), magmaCrystalMat);
        shard.scale.set(0.7, 1.35, 0.7);
        shard.position.set(alongZ ? edge : tp, h * 0.5 + 0.98, alongZ ? tp : edge);
        mesh.add(post, shard);
      }
    }
  }

  if (useNebulaCrystalMat && def.shape === 'bridge') {
    // Luminous Astral Energy Bridges with holographic side rails, floating crystal emitters & glowing under-arch
    const alongZ = d >= w;
    const span = alongZ ? d : w;
    const width = alongZ ? w : d;
    const holoMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.45,
      roughness: 0.08,
      metalness: 0.25,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.85,
    });
    const alloyTrimMat = new THREE.MeshStandardMaterial({
      map: textures.nebulaSide,
      color: 0x818cf8,
      emissive: 0x312e81,
      emissiveIntensity: 0.55,
      metalness: 0.84,
      roughness: 0.2,
    });
    for (const side of [-1, 1]) {
      const edge = side * (width * 0.46);
      const rail = new THREE.Mesh(
        alongZ ? new THREE.BoxGeometry(0.12, 0.12, span * 0.94) : new THREE.BoxGeometry(span * 0.94, 0.12, 0.12),
        holoMat
      );
      rail.position.set(alongZ ? edge : 0, h * 0.5 + 0.62, alongZ ? 0 : edge);
      mesh.add(rail);

      for (let p = -1; p <= 1; p++) {
        const tp = p * span * 0.36;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.82, 8), alloyTrimMat);
        post.position.set(alongZ ? edge : tp, h * 0.5 + 0.38, alongZ ? tp : edge);
        const prism = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), holoMat);
        prism.scale.set(0.68, 1.4, 0.68);
        prism.position.set(alongZ ? edge : tp, h * 0.5 + 0.95, alongZ ? tp : edge);
        mesh.add(post, prism);
      }
    }
    const archPts = [
      new THREE.Vector3(alongZ ? 0 : -span * 0.46, -h * 0.5 - 1.15, alongZ ? -span * 0.46 : 0),
      new THREE.Vector3(0, -h * 0.5 - 0.16, 0),
      new THREE.Vector3(alongZ ? 0 : span * 0.46, -h * 0.5 - 1.15, alongZ ? span * 0.46 : 0),
    ];
    mesh.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPts), 14, 0.22, 8, false), holoMat));
  }

  // Tapered organic rocky/architectural under-skirt & carved silhouettes
  if ((w >= 2.6 && d >= 2.6) && def.kind !== 'glass' && def.kind !== 'disappearing') {
    const skirtMat = jungleV2
      ? new THREE.MeshStandardMaterial({
          map: def.shape === 'ruin' || style === 'temple' ? textures.jungleRuinStone : textures.jungleSide,
          bumpMap: def.shape === 'ruin' || style === 'temple' ? textures.jungleRuinBump : textures.jungleSideBump,
          bumpScale: 0.18,
          roughnessMap: textures.stoneRoughness,
          roughness: 0.9,
          metalness: 0.03,
        })
      : desertV2
        ? new THREE.MeshStandardMaterial({
            map: def.shape === 'ruin' || def.shape === 'bridge' ? textures.desertRuinStone : textures.desertSide,
            bumpMap: def.shape === 'ruin' || def.shape === 'bridge' ? textures.desertRuinBump : textures.stoneBump,
            bumpScale: 0.2,
            roughnessMap: textures.stoneRoughness,
            roughness: 0.9,
            metalness: 0.04,
          })
        : iceV2
          ? new THREE.MeshPhysicalMaterial({
              map: def.shape === 'ruin' ? textures.glacialRock : textures.iceSide,
              bumpMap: def.shape === 'ruin' ? textures.glacialRockBump : textures.iceBump,
              bumpScale: 0.18,
              roughnessMap: textures.iceRoughness,
              roughness: def.shape === 'ruin' ? 0.65 : 0.22,
              metalness: 0.08,
              clearcoat: def.shape === 'ruin' ? 0.35 : 0.88,
            })
          : templeV2
            ? new THREE.MeshStandardMaterial({
                map: def.shape === 'organic' ? textures.jungleSide : textures.templeCarvedStone,
                bumpMap: def.shape === 'organic' ? textures.jungleSideBump : textures.templeCarvedBump,
                bumpScale: 0.2,
                roughnessMap: textures.stoneRoughness,
                roughness: 0.88,
                metalness: 0.04,
              })
            : volcanicV2
              ? new THREE.MeshStandardMaterial({
                  map: textures.volcanicSide,
                  emissiveMap: textures.volcanicSideEmissive,
                  emissive: 0xff5a00,
                  emissiveIntensity: 1.45,
                  bumpMap: textures.basaltBump,
                  bumpScale: 0.22,
                  roughnessMap: textures.stoneRoughness,
                  roughness: 0.86,
                  metalness: 0.16,
                })
            : parisV2
              ? new THREE.MeshStandardMaterial({
                  map: textures.parisStone,
                  bumpMap: textures.stoneBump,
                  bumpScale: 0.14,
                  roughnessMap: textures.stoneRoughness,
                  roughness: 0.82,
                  metalness: 0.06,
                })
          : Array.isArray(baseMat)
          ? (baseMat[0] as THREE.MeshStandardMaterial).clone()
          : new THREE.MeshStandardMaterial({
              map:
                style === 'jungle'
                  ? textures.jungleSide
                  : style === 'desert'
                    ? textures.desertSide
                    : style === 'ice'
                      ? textures.iceSide
                      : style === 'volcanic'
                        ? textures.volcanicSide
                        : style === 'temple'
                          ? textures.templeSide
                          : style === 'nebula'
                            ? textures.nebulaSide
                            : style === 'paris'
                              ? textures.parisStone
                              : textures.climbStone,
              roughness: 0.88,
              metalness: style === 'nebula' || style === 'tech' ? 0.35 : 0.08,
            });

    if (useDisc) {
      const r = Math.max(w, d) * 0.44;
      if (def.shape === 'pillar') {
        const colH = def.kind === 'crumble' ? (templeV2 ? 4.2 : 3.4) : (templeV2 ? 14.0 : 11.5);
        const shaft = new THREE.Mesh(
          new THREE.CylinderGeometry(r * 0.84, r * (def.kind === 'crumble' ? 0.44 : 0.96), colH, templeV2 ? 12 : 12),
          skirtMat
        );
        shaft.position.y = -h * 0.45 - colH * 0.5;
        mesh.add(shaft);

        if (templeV2) {
          // Carved Mesoamerican stepped column capital & mossy plinth rings
          const capRing = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.08, r * 0.92, 0.36, 8), skirtMat);
          capRing.position.y = -h * 0.32;
          mesh.add(capRing);

          if (def.kind === 'crumble') {
            const fractureMat = new THREE.MeshStandardMaterial({
              color: 0xfbbf24,
              emissive: 0xd97706,
              emissiveIntensity: 1.0,
              roughness: 0.3,
              polygonOffset: true,
              polygonOffsetFactor: -1,
              polygonOffsetUnits: -1,
            });
            const crackA = new THREE.Mesh(new THREE.BoxGeometry(r * 1.72, 0.05, 0.14), fractureMat);
            crackA.position.set(0, h * 0.5 + 0.015, 0.12);
            crackA.rotation.y = 0.45;
            const crackB = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, r * 1.55), fractureMat);
            crackB.position.set(-0.15, h * 0.5 + 0.015, 0);
            crackB.rotation.y = -0.3;
            mesh.add(crackA, crackB);
          } else {
            const mossMat = new THREE.MeshStandardMaterial({ map: textures.jungleGrass, roughness: 0.88 });
            const mossCollar = new THREE.Mesh(new THREE.TorusGeometry(r * 0.98, 0.14, 6, 16), mossMat);
            mossCollar.rotation.x = Math.PI / 2;
            mossCollar.position.y = -h * 0.15;
            mesh.add(mossCollar);
          }
        }

        const collarMat = new THREE.MeshStandardMaterial({
          color: def.kind === 'crumble' ? 0xf59e0b : 0x3b7a1c,
          emissive: def.kind === 'crumble' ? 0x78350f : 0x000000,
          emissiveIntensity: def.kind === 'crumble' ? 0.45 : 0,
          roughness: 0.55,
          metalness: def.kind === 'crumble' ? 0.4 : 0.08,
        });
        const collar = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, 0.1, 7, 18), collarMat);
        collar.rotation.x = Math.PI / 2;
        collar.position.y = h * 0.34;
        mesh.add(collar);
      } else {
        if (nebulaV2) {
          // Futuristic Astral Disc: multi-tiered chrome/indigo hull base + counter-rotating glowing energy rings + crystal core
          const hullMat = new THREE.MeshStandardMaterial({
            map: textures.nebulaSide,
            metalness: 0.82,
            roughness: 0.22,
          });
          const cyanEnergyMat = new THREE.MeshStandardMaterial({
            color: 0x67e8f9,
            emissive: 0x06b6d4,
            emissiveIntensity: 1.85,
            roughness: 0.15,
          });
          const hullBase = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.96, r * 0.34, h * 1.9, 12), hullMat);
          hullBase.position.y = -h * 1.15;
          mesh.add(hullBase);

          const haloRing = new THREE.Mesh(new THREE.TorusGeometry(r * 1.04, 0.09, 8, 32), cyanEnergyMat);
          haloRing.rotation.x = Math.PI / 2;
          haloRing.position.y = -h * 0.45;
          mesh.add(haloRing);

          const thrusterCore = new THREE.Mesh(new THREE.OctahedronGeometry(r * 0.24, 0), cyanEnergyMat);
          thrusterCore.position.y = -h * 2.25;
          mesh.add(thrusterCore);

          if (def.id === 'n-secret-plat') {
            // Monumental Reliquary Dais with 4 floating crystal spires on rim
            for (let k = 0; k < 4; k++) {
              const a = (k / 4) * Math.PI * 2 + Math.PI * 0.25;
              const spire = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), cyanEnergyMat);
              spire.scale.set(0.65, 2.2, 0.65);
              spire.position.set(Math.cos(a) * (r * 0.88), h * 0.5 + 0.65, Math.sin(a) * (r * 0.88));
              mesh.add(spire);
            }
          }
        } else if (templeV2 && def.id === 'm-summit') {
          // Monumental Kukul Solar Sanctuary Arena Base + Outer Battlements + 4 Jade Fire Braziers
          const sanctuaryBase = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.06, r * 1.24, 10.5, 16), skirtMat);
          sanctuaryBase.position.y = -h * 0.45 - 5.2;
          mesh.add(sanctuaryBase);

          const goldTrimMat = new THREE.MeshStandardMaterial({
            map: textures.goldTrim,
            color: 0xfbbf24,
            emissive: 0x92400e,
            emissiveIntensity: 0.5,
            metalness: 0.84,
            roughness: 0.24,
          });
          const jadeFireMat = new THREE.MeshStandardMaterial({
            color: 0x34d399,
            emissive: 0x10b981,
            emissiveIntensity: 2.2,
            roughness: 0.2,
          });
          const outerSunRing = new THREE.Mesh(new THREE.TorusGeometry(r * 0.94, 0.14, 8, 36), goldTrimMat);
          outerSunRing.rotation.x = Math.PI / 2;
          outerSunRing.position.y = h * 0.5 + 0.04;
          mesh.add(outerSunRing);

          // Stepped temple battlements & weathered merlons strictly on outer rim (r = 10.65 > boss radius 9.8)
          for (let b = 0; b < 12; b++) {
            if (b === 3 || b === 9) continue; // Keep entry from cw-3 (+Z) and goal portal (-Z) crystal clear!
            const ang = (b / 12) * Math.PI * 2;
            const bx = Math.cos(ang) * (r * 1.06);
            const bz = Math.sin(ang) * (r * 1.06);
            const merlonH = b % 3 === 0 ? 1.55 : 0.95;
            const merlon = new THREE.Mesh(new THREE.BoxGeometry(1.4, merlonH, 0.72), skirtMat);
            merlon.position.set(bx, h * 0.5 + merlonH * 0.42, bz);
            merlon.rotation.y = -ang + Math.PI / 2;
            mesh.add(merlon);
          }
          for (let f = 0; f < 4; f++) {
            const ang = (f / 4) * Math.PI * 2 + Math.PI * 0.25;
            const fx = Math.cos(ang) * (r * 1.04);
            const fz = Math.sin(ang) * (r * 1.04);
            const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.4, 0.65, 10), goldTrimMat);
            bowl.position.set(fx, h * 0.5 + 0.95, fz);
            const flame = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.05, 7), jadeFireMat);
            flame.position.set(fx, h * 0.5 + 1.65, fz);
            mesh.add(bowl, flame);
          }
        } else if (parisV2) {
          // Ornate Gilded Parisian Sky-Balcony Pavilion with wrought-iron balusters & entry gap toward updraft (+X)
          const fadeMats: THREE.Material[] = [];
          const ironMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            metalness: 0.82,
            roughness: 0.28,
            transparent: true,
          });
          const giltMat = new THREE.MeshStandardMaterial({
            map: textures.goldTrim,
            color: 0xfbbf24,
            emissive: 0x92400e,
            emissiveIntensity: 0.35,
            metalness: 0.88,
            roughness: 0.22,
            transparent: true,
          });
          const stoneBaseMat = new THREE.MeshStandardMaterial({
            map: textures.parisStone,
            bumpMap: textures.stoneBump,
            bumpScale: 0.12,
            roughness: 0.78,
            transparent: true,
          });
          fadeMats.push(ironMat, giltMat, stoneBaseMat);

          const cupBase = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.96, r * 0.35, h * 2.1, 16), stoneBaseMat);
          cupBase.position.y = -h * 1.25;
          mesh.add(cupBase);

          const rimRing = new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, 0.1, 8, 28), giltMat);
          rimRing.rotation.x = Math.PI / 2;
          rimRing.position.y = h * 0.48;
          mesh.add(rimRing);

          // Wrought-iron perimeter balusters leaving entry opening around angle 0 (+X facing Champs-Élysées updraft)
          for (let k = 0; k < 12; k++) {
            const ang = (k / 12) * Math.PI * 2;
            if (ang < 0.45 || ang > Math.PI * 2 - 0.45) continue;
            const bx = Math.cos(ang) * (r * 0.92);
            const bz = Math.sin(ang) * (r * 0.92);
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.72, 6), ironMat);
            post.position.set(bx, h * 0.5 + 0.36, bz);
            mesh.add(post);
            if (k % 2 === 0) {
              const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), giltMat);
              finial.position.set(bx, h * 0.5 + 0.78, bz);
              mesh.add(finial);
            }
          }
          const railArc = new THREE.Mesh(
            new THREE.TorusGeometry(r * 0.92, 0.055, 6, 28, Math.PI * 1.65),
            giltMat
          );
          railArc.rotation.x = Math.PI / 2;
          railArc.rotation.z = 0.55;
          railArc.position.y = h * 0.5 + 0.68;
          mesh.add(railArc);

          mesh.userData.fadeMats = fadeMats;
        } else {
          const underCone = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.94, r * 0.42, h * 1.4, 16), skirtMat);
          underCone.position.y = -h * 0.9;
          mesh.add(underCone);
        }
      }

      // Rotating gear teeth & directional ring on rotating discs
      if (def.kind === 'rotating') {
        const ringMat = new THREE.MeshStandardMaterial({
          color: nebulaV2 ? 0x22d3ee : 0xf59e0b,
          emissive: nebulaV2 ? 0x0ea5e9 : 0xd97706,
          emissiveIntensity: nebulaV2 ? 1.4 : 0.75,
          metalness: 0.8,
          roughness: 0.25,
        });
        const outerRing = new THREE.Mesh(new THREE.TorusGeometry(r * 0.98, 0.11, 8, 28), ringMat);
        outerRing.rotation.x = Math.PI / 2;
        outerRing.position.y = h * 0.48;
        mesh.add(outerRing);

        const innerGlyph = new THREE.Mesh(new THREE.TorusGeometry(r * 0.52, 0.06, 6, 20), ringMat);
        innerGlyph.rotation.x = Math.PI / 2;
        innerGlyph.position.y = h * 0.5;
        mesh.add(innerGlyph);

        for (let t = 0; t < 8; t++) {
          const ang = (t / 8) * Math.PI * 2;
          const cog = new THREE.Mesh(new THREE.BoxGeometry(0.42, h * 0.55, 0.35), ringMat);
          cog.position.set(Math.cos(ang) * (r + 0.1), 0, Math.sin(ang) * (r + 0.1));
          cog.rotation.y = -ang;
          mesh.add(cog);
        }
      }
    } else if (def.shape === 'bridge') {
      const alongZ = d >= w;
      const span = alongZ ? d : w;
      const width = alongZ ? w : d;
      if (desertV2) {
        // Ancient Suspended Sandstone & Rope Bridge with catenary cables, sandstone bollards & warm sunset lanterns
        const postStoneMat = new THREE.MeshStandardMaterial({
          map: textures.desertRuinStone,
          bumpMap: textures.desertRuinBump,
          bumpScale: 0.16,
          roughness: 0.86,
        });
        const ropeMat = new THREE.MeshStandardMaterial({ color: 0xc29356, roughness: 0.78 });
        const timberMat = new THREE.MeshStandardMaterial({
          map: textures.barkTexture,
          color: 0x8a582e,
          roughness: 0.82,
        });
        const lanternMat = new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.8,
          roughness: 0.25,
        });

        for (const side of [-1, 1]) {
          const edge = side * (width * 0.45);
          // End stone anchor pillars
          for (const end of [-1, 1]) {
            const zEnd = end * (span * 0.43);
            const px = alongZ ? edge : zEnd;
            const pz = alongZ ? zEnd : edge;
            const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 1.35, 8), postStoneMat);
            pillar.position.set(px, h * 0.5 + 0.65, pz);
            pillar.castShadow = !isSoftwareGl;
            mesh.add(pillar);

            const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), lanternMat);
            lantern.position.set(px, h * 0.5 + 1.44, pz);
            mesh.add(lantern);
          }

          // Sagging catenary suspension cable
          const sagPts: THREE.Vector3[] = [];
          for (let s = 0; s <= 8; s++) {
            const u = -1 + (s / 8) * 2;
            const pAlong = u * span * 0.43;
            const sagY = h * 0.5 + 1.15 - (1 - u * u) * 0.52;
            sagPts.push(new THREE.Vector3(alongZ ? edge : pAlong, sagY, alongZ ? pAlong : edge));
          }
          const cableGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sagPts), 14, 0.06, 6, false);
          mesh.add(new THREE.Mesh(cableGeo, ropeMat));

          // Vertical suspender ropes
          for (let s = 1; s < 8; s++) {
            const u = -1 + (s / 8) * 2;
            const pAlong = u * span * 0.43;
            const topY = h * 0.5 + 1.15 - (1 - u * u) * 0.52;
            const dropH = Math.max(0.15, topY - h * 0.5);
            const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, dropH, 5), ropeMat);
            drop.position.set(alongZ ? edge : pAlong, h * 0.5 + dropH * 0.5, alongZ ? pAlong : edge);
            mesh.add(drop);
          }
        }

        // Cross-beam timber sleepers & curved sandstone arch rib beneath bridge
        const ribCount = Math.max(4, Math.floor(span / 1.4));
        for (let r = 0; r < ribCount; r++) {
          const tPos = -span * 0.42 + (r / Math.max(1, ribCount - 1)) * span * 0.84;
          const slat = new THREE.Mesh(
            alongZ ? new THREE.BoxGeometry(width * 0.96, 0.14, 0.38) : new THREE.BoxGeometry(0.38, 0.14, width * 0.96),
            timberMat
          );
          slat.position.set(alongZ ? 0 : tPos, -h * 0.42, alongZ ? tPos : 0);
          mesh.add(slat);
        }
        const archPts = [
          new THREE.Vector3(alongZ ? 0 : -span * 0.46, -h * 0.55 - 1.2, alongZ ? -span * 0.46 : 0),
          new THREE.Vector3(0, -h * 0.55 - 0.15, 0),
          new THREE.Vector3(alongZ ? 0 : span * 0.46, -h * 0.55 - 1.2, alongZ ? span * 0.46 : 0),
        ];
        const archRib = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPts), 14, 0.34, 6, false), postStoneMat);
        mesh.add(archRib);
      } else if (iceV2) {
        // Frozen Glacial Ice-Arch Bridge with translucent crystal balustrades, frost lanterns & icicle fringe
        const iceArchMat = new THREE.MeshPhysicalMaterial({
          map: textures.iceSide,
          bumpMap: textures.iceBump,
          bumpScale: 0.14,
          color: 0xbae6fd,
          roughness: 0.12,
          metalness: 0.08,
          clearcoat: 1.0,
          transparent: true,
          opacity: 0.88,
        });
        const frostGlowMat = new THREE.MeshStandardMaterial({
          color: 0xa5f3fc,
          emissive: 0x06b6d4,
          emissiveIntensity: 1.85,
          roughness: 0.16,
        });
        const postCount = Math.max(3, Math.floor(span / 2.8));
        for (const side of [-1, 1]) {
          const edge = side * (width * 0.45);
          const railBeam = new THREE.Mesh(
            alongZ ? new THREE.BoxGeometry(0.14, 0.14, span * 0.92) : new THREE.BoxGeometry(span * 0.92, 0.14, 0.14),
            iceArchMat
          );
          railBeam.position.set(alongZ ? edge : 0, h * 0.5 + 0.72, alongZ ? 0 : edge);
          mesh.add(railBeam);

          for (let p = 0; p < postCount; p++) {
            const tPos = -span * 0.42 + (p / Math.max(1, postCount - 1)) * span * 0.84;
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.05, 6), iceArchMat);
            post.position.set(alongZ ? edge : tPos, h * 0.5 + 0.5, alongZ ? tPos : edge);
            post.castShadow = !isSoftwareGl;
            mesh.add(post);

            const lantern = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), frostGlowMat);
            lantern.scale.set(0.75, 1.4, 0.75);
            lantern.position.set(alongZ ? edge : tPos, h * 0.5 + 1.15, alongZ ? tPos : edge);
            mesh.add(lantern);

            // Hanging icicle underneath each bridge post
            const icicleH = 1.0 + (p % 2) * 0.55;
            const icicle = new THREE.Mesh(new THREE.ConeGeometry(0.2, icicleH, 6), iceArchMat);
            icicle.rotation.x = Math.PI;
            icicle.position.set(alongZ ? edge * 0.92 : tPos, -h * 0.5 - icicleH * 0.48, alongZ ? tPos : edge * 0.92);
            mesh.add(icicle);
          }
        }
        // Sculpted curved glacial ice arch rib underneath bridge
        const archPts = [
          new THREE.Vector3(alongZ ? 0 : -span * 0.48, -h * 0.5 - 1.5, alongZ ? -span * 0.48 : 0),
          new THREE.Vector3(0, -h * 0.5 - 0.18, 0),
          new THREE.Vector3(alongZ ? 0 : span * 0.48, -h * 0.5 - 1.5, alongZ ? span * 0.48 : 0),
        ];
        const archRib = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPts), 14, 0.44, 6, false), iceArchMat);
        mesh.add(archRib);
      } else if (templeV2) {
        if (def.id === 'm-sec-exit-1') {
          // Living Giant Gnarled Root Walkway Bridge connecting Secret Jade Treasury back toward the temple
          const rootBarkMat = new THREE.MeshStandardMaterial({
            map: textures.barkTexture,
            bumpMap: textures.barkBump,
            bumpScale: 0.2,
            color: 0x6b4226,
            roughness: 0.9,
          });
          const mossMat = new THREE.MeshStandardMaterial({
            map: textures.jungleGrass,
            bumpMap: textures.grassBump,
            bumpScale: 0.1,
            roughness: 0.85,
          });
          const jadePodMat = new THREE.MeshStandardMaterial({
            color: 0x34d399,
            emissive: 0x059669,
            emissiveIntensity: 1.5,
            roughness: 0.25,
          });
          for (const side of [-1, 1]) {
            const pts: THREE.Vector3[] = [];
            for (let k = 0; k <= 6; k++) {
              const t = -1 + (k / 6) * 2;
              const along = t * (span * 0.52);
              const cross = side * (width * 0.44 + Math.sin(k * 1.4) * 0.25);
              const yy = h * 0.15 + Math.cos(k * 1.2) * 0.35;
              pts.push(new THREE.Vector3(alongZ ? cross : along, yy, alongZ ? along : cross));
            }
            const vineRoot = new THREE.Mesh(
              new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.34, 7, false),
              rootBarkMat
            );
            mesh.add(vineRoot);
          }
          for (let b = 0; b < 3; b++) {
            const u = -0.35 + b * 0.35;
            const pAlong = u * span;
            const mossPad = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), mossMat);
            mossPad.scale.set(1.2, 0.35, 1.0);
            mossPad.position.set(alongZ ? width * 0.42 : pAlong, h * 0.5, alongZ ? pAlong : width * 0.42);
            const pod = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), jadePodMat);
            pod.position.set(alongZ ? -width * 0.44 : pAlong, h * 0.5 + 0.38, alongZ ? pAlong : -width * 0.44);
            mesh.add(mossPad, pod);
          }
        } else if (style === 'crystal') {
          // Celestial Jade-Crystal & Gold Suspended Sky-Bridges (Ruta Elevada)
          const goldStoneMat = new THREE.MeshStandardMaterial({
            map: textures.goldTrim,
            color: 0xfbbf24,
            emissive: 0x92400e,
            emissiveIntensity: 0.5,
            metalness: 0.82,
            roughness: 0.24,
          });
          const jadeCrystalMat = new THREE.MeshPhysicalMaterial({
            color: 0x34d399,
            emissive: 0x059669,
            emissiveIntensity: 0.8,
            roughness: 0.1,
            clearcoat: 1.0,
            transparent: true,
            opacity: 0.88,
          });
          const postCount = Math.max(3, Math.floor(span / 3.4));
          for (const side of [-1, 1]) {
            const edge = side * (width * 0.46);
            const beamRail = new THREE.Mesh(
              alongZ ? new THREE.BoxGeometry(0.14, 0.14, span * 0.94) : new THREE.BoxGeometry(span * 0.94, 0.14, 0.14),
              jadeCrystalMat
            );
            beamRail.position.set(alongZ ? edge : 0, h * 0.5 + 0.72, alongZ ? 0 : edge);
            mesh.add(beamRail);

            for (let p = 0; p < postCount; p++) {
              const tPos = -span * 0.44 + (p / Math.max(1, postCount - 1)) * span * 0.88;
              const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.95, 6), goldStoneMat);
              post.position.set(alongZ ? edge : tPos, h * 0.5 + 0.46, alongZ ? tPos : edge);
              mesh.add(post);

              const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), jadeCrystalMat);
              gem.scale.set(0.7, 1.4, 0.7);
              gem.position.set(alongZ ? edge : tPos, h * 0.5 + 1.08, alongZ ? tPos : edge);
              mesh.add(gem);
            }
          }
          const archPts = [
            new THREE.Vector3(alongZ ? 0 : -span * 0.46, -h * 0.5 - 1.35, alongZ ? -span * 0.46 : 0),
            new THREE.Vector3(0, -h * 0.5 - 0.15, 0),
            new THREE.Vector3(alongZ ? 0 : span * 0.46, -h * 0.5 - 1.35, alongZ ? span * 0.46 : 0),
          ];
          mesh.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPts), 14, 0.32, 6, false), goldStoneMat));
        } else {
          // Aged Crooked Timber Plank & Catenary Rope Suspension Bridges (m-bridge-1, m-bridge-2)
          const stonePierMat = new THREE.MeshStandardMaterial({
            map: textures.templeCarvedStone,
            bumpMap: textures.templeCarvedBump,
            bumpScale: 0.18,
            roughness: 0.88,
          });
          const woodMat = new THREE.MeshStandardMaterial({
            map: textures.riverTimber,
            bumpMap: textures.barkBump,
            bumpScale: 0.12,
            color: 0x9c6b3f,
            roughness: 0.86,
          });
          const vineRopeMat = new THREE.MeshStandardMaterial({ color: 0xa17c46, roughness: 0.82 });
          const jadeLanternMat = new THREE.MeshStandardMaterial({
            color: 0x6ee7b7,
            emissive: 0x10b981,
            emissiveIntensity: 1.85,
            roughness: 0.2,
          });

          const plankCount = Math.max(6, Math.floor(span / 0.82));
          for (let p = 0; p < plankCount; p++) {
            const tPos = -span * 0.45 + (p / Math.max(1, plankCount - 1)) * span * 0.9;
            const plank = new THREE.Mesh(
              alongZ ? new THREE.BoxGeometry(width * 0.96, 0.1, 0.58) : new THREE.BoxGeometry(0.58, 0.1, width * 0.96),
              woodMat
            );
            plank.position.set(
              alongZ ? Math.sin(p * 1.7 + seed) * 0.08 : tPos,
              h * 0.5 + 0.02,
              alongZ ? tPos : Math.sin(p * 1.7 + seed) * 0.08
            );
            plank.rotation.y = Math.sin(p * 2.3 + seed) * 0.04;
            mesh.add(plank);
          }

          for (const side of [-1, 1]) {
            const edge = side * (width * 0.46);
            for (const end of [-1, 1]) {
              const zEnd = end * (span * 0.44);
              const px = alongZ ? edge : zEnd;
              const pz = alongZ ? zEnd : edge;
              const post = new THREE.Mesh(new THREE.BoxGeometry(0.46, 1.45, 0.46), stonePierMat);
              post.position.set(px, h * 0.5 + 0.68, pz);
              post.castShadow = !isSoftwareGl;
              const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), jadeLanternMat);
              orb.position.set(px, h * 0.5 + 1.54, pz);
              mesh.add(post, orb);
            }
            const sagPts: THREE.Vector3[] = [];
            for (let s = 0; s <= 8; s++) {
              const u = -1 + (s / 8) * 2;
              const pAlong = u * span * 0.44;
              const sagY = h * 0.5 + 1.2 - (1 - u * u) * 0.54;
              sagPts.push(new THREE.Vector3(alongZ ? edge : pAlong, sagY, alongZ ? pAlong : edge));
            }
            mesh.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sagPts), 14, 0.065, 6, false), vineRopeMat));
            for (let s = 1; s < 8; s++) {
              const u = -1 + (s / 8) * 2;
              const pAlong = u * span * 0.44;
              const topY = h * 0.5 + 1.2 - (1 - u * u) * 0.54;
              const dropH = Math.max(0.18, topY - h * 0.5);
              const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, dropH, 5), vineRopeMat);
              drop.position.set(alongZ ? edge : pAlong, h * 0.5 + dropH * 0.5, alongZ ? pAlong : edge);
              mesh.add(drop);
            }
          }
          const archPts = [
            new THREE.Vector3(alongZ ? 0 : -span * 0.46, -h * 0.5 - 1.1, alongZ ? -span * 0.46 : 0),
            new THREE.Vector3(0, -h * 0.5 - 0.12, 0),
            new THREE.Vector3(alongZ ? 0 : span * 0.46, -h * 0.5 - 1.1, alongZ ? span * 0.46 : 0),
          ];
          mesh.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPts), 14, 0.28, 6, false), stonePierMat));
        }
      } else {
        const railMat = new THREE.MeshStandardMaterial({
          map: textures.barkTexture,
          color: style === 'crystal' ? 0x38bdf8 : 0x85532c,
          emissive: style === 'crystal' ? 0x0284c7 : 0x000000,
          emissiveIntensity: style === 'crystal' ? 0.65 : 0,
          roughness: 0.76,
        });
        const ropeMat = new THREE.MeshStandardMaterial({
          color: style === 'crystal' ? 0x67e8f9 : 0xd6b174,
          roughness: 0.72,
        });
        const postCount = Math.max(3, Math.floor(span / 2.6));
        for (const side of [-1, 1]) {
          const edge = side * (width * 0.46);
          const railGeo = alongZ
            ? new THREE.BoxGeometry(0.14, 0.14, span * 0.94)
            : new THREE.BoxGeometry(span * 0.94, 0.14, 0.14);
          const topRail = new THREE.Mesh(railGeo, ropeMat);
          topRail.position.set(alongZ ? edge : 0, h * 0.5 + 0.78, alongZ ? 0 : edge);
          mesh.add(topRail);

          const midRail = new THREE.Mesh(railGeo, ropeMat);
          midRail.position.set(alongZ ? edge : 0, h * 0.5 + 0.42, alongZ ? 0 : edge);
          mesh.add(midRail);

          for (let p = 0; p < postCount; p++) {
            const tPos = -span * 0.44 + (p / Math.max(1, postCount - 1)) * span * 0.88;
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.96, 8), railMat);
            post.position.set(alongZ ? edge : tPos, h * 0.5 + 0.45, alongZ ? tPos : edge);
            post.castShadow = !isSoftwareGl;
            mesh.add(post);
          }
        }
        // Support beam ribs beneath bridge deck
        const beam = new THREE.Mesh(
          alongZ ? new THREE.BoxGeometry(width * 0.82, 0.45, span * 0.92) : new THREE.BoxGeometry(span * 0.92, 0.45, width * 0.82),
          skirtMat
        );
        beam.position.y = -h * 0.45 - 0.18;
        mesh.add(beam);
      }
    } else if (def.shape === 'ruin') {
      // Stepped Mesoamerican plinth + carved stone corner bollards
      const plinth = new THREE.Mesh(
        createRoundedSlabGeometry(w + 0.45, h * 0.55, d + 0.45, 0.18),
        skirtMat
      );
      plinth.position.y = -h * 0.35;
      mesh.add(plinth);

      if (jungleV2) {
        const rockMat = new THREE.MeshStandardMaterial({
          map: textures.jungleRuinStone,
          bumpMap: textures.jungleRuinBump,
          bumpScale: 0.2,
          roughness: 0.9,
        });
        const cragDepth = def.id === 'j-high-alcove' ? 18.5 : def.kind === 'moving' ? 1.8 : 4.2;
        if (def.id === 'j-high-alcove') {
          const towerCol = new THREE.Mesh(
            new THREE.CylinderGeometry(2.15, 2.85, cragDepth, 12),
            rockMat
          );
          towerCol.position.y = -h * 0.5 - cragDepth * 0.5;
          mesh.add(towerCol);
        } else {
          const crag = new THREE.Mesh(createCraggyUnderbellyGeo(w * 0.95, d * 0.95, cragDepth, seed), rockMat);
          crag.position.y = -h * 0.46 - cragDepth * 0.48;
          mesh.add(crag);
        }

        // Fractured carved columns & creeping roots on non-moving outer ruin corners
        if (def.kind !== 'moving' && w >= 6 && d >= 5.5) {
          const mossMat = new THREE.MeshStandardMaterial({
            map: textures.jungleGrass,
            bumpMap: textures.grassBump,
            bumpScale: 0.08,
            roughness: 0.88,
          });
          const corners: [number, number, number][] = [
            [-1, -1, 1.45],
            [1, -1, 1.05],
          ];
          for (const [sx, sz, colH] of corners) {
            const col = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, colH, 10), rockMat);
            col.position.set(sx * (w * 0.44), h * 0.5 + colH * 0.45, sz * (d * 0.44));
            col.castShadow = !isSoftwareGl;
            mesh.add(col);

            const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.4, 0.22, 10), mossMat);
            cap.position.set(sx * (w * 0.44), h * 0.5 + colH * 0.9, sz * (d * 0.44));
            mesh.add(cap);
          }
        }
      } else if (desertV2) {
        const sandstoneMat = new THREE.MeshStandardMaterial({
          map: textures.desertRuinStone,
          bumpMap: textures.desertRuinBump,
          bumpScale: 0.2,
          roughness: 0.88,
        });
        const brassMat = new THREE.MeshStandardMaterial({
          map: textures.goldTrim,
          color: 0xf59e0b,
          emissive: 0x92400e,
          emissiveIntensity: 0.42,
          metalness: 0.82,
          roughness: 0.24,
        });
        const isStaticCorridorPier = def.kind === 'solid' && def.id.startsWith('d-2d-');
        if (isStaticCorridorPier) {
          // Monumental ancient sandstone viaduct pier grounding into the canyon floor
          const pierH = 14.0;
          const pier = new THREE.Mesh(createCraggyUnderbellyGeo(w * 0.9, d * 0.9, pierH, seed), sandstoneMat);
          pier.position.y = -h * 0.45 - pierH * 0.48;
          mesh.add(pier);

          // Recessed arch rib collar along top edge
          const cornice = new THREE.Mesh(createRoundedSlabGeometry(w + 0.65, 0.34, d + 0.65, 0.14), sandstoneMat);
          cornice.position.y = h * 0.15;
          mesh.add(cornice);
        } else if (def.kind === 'moving' || def.kind === 'elevator') {
          // Deploying ancient brass & sandstone astrolabe wing mechanism
          const baseGear = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, d) * 0.38, 0.12, 8, 22), brassMat);
          baseGear.rotation.x = Math.PI / 2;
          baseGear.position.y = -h * 0.48;
          mesh.add(baseGear);
          mesh.userData.mechanismSpin = baseGear;

          const wings: THREE.Object3D[] = [];
          for (const sx of [-1, 1]) {
            const wingPivot = new THREE.Group();
            wingPivot.position.set(sx * (w * 0.46), 0, 0);
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.18, d * 0.52), brassMat);
            fin.position.set(sx * 0.36, 0, 0);
            wingPivot.add(fin);
            mesh.add(wingPivot);
            wings.push(wingPivot);
          }
          mesh.userData.deployWings = wings;
        } else {
          const cragDepth = w >= 9 ? 16.5 : 5.4;
          const crag = new THREE.Mesh(createCraggyUnderbellyGeo(w * 0.92, d * 0.92, cragDepth, seed), sandstoneMat);
          crag.position.y = -h * 0.48 - cragDepth * 0.48;
          mesh.add(crag);
        }

        // Carved obelisk corner bollards & glowing sun braziers on main temple plazas
        if (w >= 8 && d >= 8) {
          const flameMat = new THREE.MeshStandardMaterial({
            color: 0xfef08a,
            emissive: 0xf97316,
            emissiveIntensity: 2.0,
            roughness: 0.2,
          });
          for (const sx of [-1, 1]) {
            for (const sz of [-1, 1]) {
              const obelisk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.46, 1.55, 4), sandstoneMat);
              obelisk.position.set(sx * (w * 0.44), h * 0.5 + 0.72, sz * (d * 0.44));
              obelisk.rotation.y = Math.PI / 4;
              obelisk.castShadow = !isSoftwareGl;
              mesh.add(obelisk);

              const cap = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.42, 4), brassMat);
              cap.position.set(sx * (w * 0.44), h * 0.5 + 1.68, sz * (d * 0.44));
              cap.rotation.y = Math.PI / 4;
              mesh.add(cap);

              if (sz < 0) {
                const ember = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), flameMat);
                ember.position.set(sx * (w * 0.44), h * 0.5 + 2.04, sz * (d * 0.44));
                mesh.add(ember);
              }
            }
          }
        }
      } else if (iceV2) {
        // Boreal Arctic Slate & Translucent Glacier Sanctuary Plinths
        const slateMat = new THREE.MeshStandardMaterial({
          map: textures.glacialRock,
          bumpMap: textures.glacialRockBump,
          bumpScale: 0.2,
          roughness: 0.78,
        });
        const translucentIceMat = new THREE.MeshPhysicalMaterial({
          color: 0x7dd3fc,
          emissive: 0x075985,
          emissiveIntensity: 0.32,
          roughness: 0.1,
          clearcoat: 1.0,
          transparent: true,
          opacity: 0.84,
        });
        const auroraShardMat = new THREE.MeshStandardMaterial({
          color: 0x67e8f9,
          emissive: 0x10b981,
          emissiveIntensity: 1.65,
          roughness: 0.15,
        });

        const isStatic2DPier = def.kind === 'solid' && def.id.startsWith('i-2d-');
        if (isStatic2DPier) {
          const pierH = 14.5;
          const pier = new THREE.Mesh(createCraggyUnderbellyGeo(w * 0.92, d * 0.92, pierH, seed), slateMat);
          pier.position.y = -h * 0.44 - pierH * 0.48;
          mesh.add(pier);

          // Snow-capped glacier cornice collar
          const cornice = new THREE.Mesh(createRoundedSlabGeometry(w + 0.55, 0.34, d + 0.55, 0.14), translucentIceMat);
          cornice.position.y = h * 0.14;
          mesh.add(cornice);
        } else if (def.kind === 'moving') {
          // Floating crystal-powered glacial lift core
          const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, d) * 0.42, 0.1, 8, 22), auroraShardMat);
          ring.rotation.x = Math.PI / 2;
          ring.position.y = -h * 0.5;
          mesh.add(ring);
          mesh.userData.mechanismSpin = ring;
        } else {
          const cragDepth = 6.2;
          const crag = new THREE.Mesh(createCraggyUnderbellyGeo(w * 0.92, d * 0.92, cragDepth, seed), slateMat);
          crag.position.y = -h * 0.46 - cragDepth * 0.48;
          mesh.add(crag);
        }

        // Translucent ice crystals & icicles on boreal sanctuary corners
        for (const sx of [-1, 1]) {
          for (const sz of [-1, 1]) {
            if (w >= 5.2 && sz < 0) {
              const spire = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), auroraShardMat);
              spire.scale.set(0.7, 1.85, 0.7);
              spire.position.set(sx * (w * 0.43), h * 0.5 + 0.55, sz * (d * 0.42));
              spire.rotation.y = sx * 0.4;
              mesh.add(spire);
            }
            const icicle = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.45, 6), translucentIceMat);
            icicle.rotation.x = Math.PI;
            icicle.position.set(sx * (w * 0.4), -h * 0.5 - 0.65, sz * (d * 0.4));
            mesh.add(icicle);
          }
        }
      } else if (templeV2) {
        // Monumental Temple Ruin Terraces, Carved Columns, Fractured Masonry & Ancient Counterweight Mechanisms
        const carvedMat = new THREE.MeshStandardMaterial({
          map: textures.templeCarvedStone,
          bumpMap: textures.templeCarvedBump,
          bumpScale: 0.22,
          roughness: 0.88,
        });
        const goldAccentMat = new THREE.MeshStandardMaterial({
          map: textures.goldTrim,
          color: 0xfbbf24,
          emissive: 0x92400e,
          emissiveIntensity: 0.48,
          metalness: 0.82,
          roughness: 0.24,
        });
        const mossPatchMat = new THREE.MeshStandardMaterial({
          map: textures.jungleGrass,
          bumpMap: textures.grassBump,
          bumpScale: 0.1,
          roughness: 0.86,
        });

        if (def.kind === 'moving' || def.kind === 'elevator') {
          const gearRing = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, d) * 0.4, 0.12, 8, 22), goldAccentMat);
          gearRing.rotation.x = Math.PI / 2;
          gearRing.position.y = -h * 0.48;
          mesh.add(gearRing);
          mesh.userData.mechanismSpin = gearRing;
        } else {
          const cragDepth = w >= 8 ? 14.5 : 5.8;
          const crag = new THREE.Mesh(createCraggyUnderbellyGeo(w * 0.94, d * 0.94, cragDepth, seed), carvedMat);
          crag.position.y = -h * 0.46 - cragDepth * 0.48;
          mesh.add(crag);
        }

        // Fractured temple columns & mossy carved stone corner totems (avoiding 2D corridor sides & moving slabs)
        if (def.kind !== 'moving' && def.kind !== 'elevator' && w >= 6 && d >= 5.5) {
          const jadeGlowMat = new THREE.MeshStandardMaterial({
            color: 0x34d399,
            emissive: 0x10b981,
            emissiveIntensity: 1.85,
            roughness: 0.2,
          });
          const corners: [number, number, number][] = [
            [-1, -1, 1.8],
            [1, -1, 1.3],
            [-1, 1, 0.9],
            [1, 1, 0.9],
          ];
          for (const [sx, sz, colH] of corners) {
            const cx = sx * (w * 0.45);
            const cz = sz * (d * 0.45);
            const col = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.46, colH, 10), carvedMat);
            col.position.set(cx, h * 0.5 + colH * 0.44, cz);
            col.castShadow = !isSoftwareGl;
            mesh.add(col);

            if (sz < 0) {
              const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.36, 0.26, 8), goldAccentMat);
              cap.position.set(cx, h * 0.5 + colH * 0.9 + 0.1, cz);
              mesh.add(cap);
              const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), jadeGlowMat);
              gem.position.set(cx, h * 0.5 + colH * 0.9 + 0.4, cz);
              mesh.add(gem);
            } else {
              const mossCap = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4, 0), mossPatchMat);
              mossCap.scale.set(1.15, 0.52, 1.15);
              mossCap.position.set(cx, h * 0.5 + colH * 0.88, cz);
              mesh.add(mossCap);
            }
          }
        }
      } else if (volcanicV2) {
        // Volcanic Canyon Basalt Piers, Crumbling Bridges & Progressive Surface-Heating Fissure Slabs
        const heatMats: THREE.MeshStandardMaterial[] = [];
        const makeHeatMat = (baseIntensity = 0.65) => {
          const hm = new THREE.MeshStandardMaterial({
            color: 0xfb923c,
            emissive: 0xea580c,
            emissiveIntensity: baseIntensity,
            roughness: 0.25,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
          });
          heatMats.push(hm);
          return hm;
        };

        if (def.kind === 'moving') {
          // Carved obsidian slab gliding on a spinning molten-rune core
          const runeCoreMat = makeHeatMat(1.2);
          const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, d) * 0.42, 0.12, 8, 22), runeCoreMat);
          ring.rotation.x = Math.PI / 2;
          ring.position.y = -h * 0.48;
          mesh.add(ring);
          mesh.userData.mechanismSpin = ring;
        } else if (def.kind === 'crumble') {
          // Fractured crumbling volcanic stone bridge with sagging tooth underside & progressive heating seams
          const seamMat = makeHeatMat(0.85);
          for (let c = 0; c < 3; c++) {
            const seam = new THREE.Mesh(
              new THREE.BoxGeometry(w * (0.86 - c * 0.12), 0.05, 0.15),
              seamMat
            );
            seam.position.set((c - 1) * 0.35, h * 0.5 + 0.015, (c - 1) * (d * 0.24));
            seam.rotation.y = c === 1 ? -0.35 : 0.28;
            mesh.add(seam);
          }
          const coreGlow = new THREE.Mesh(
            new THREE.CylinderGeometry(w * 0.36, w * 0.16, 1.35, 6),
            makeHeatMat(0.7)
          );
          coreGlow.position.y = -h * 0.48 - 0.65;
          mesh.add(coreGlow);
        } else {
          // Deep hexagonal basalt pier & craggy rock mass plunging toward the lava river
          const cragDepth = def.id === 'v-gauntlet' ? 16.0 : 14.5;
          const pier = new THREE.Mesh(createCraggyUnderbellyGeo(w * 0.94, d * 0.94, cragDepth, seed), skirtMat);
          pier.position.y = -h * 0.46 - cragDepth * 0.48;
          mesh.add(pier);

          // Hexagonal basalt side columns clutching the platform perimeter
          const hexColOffsets = [
            [-w * 0.46, -d * 0.36, 9.2],
            [w * 0.46, d * 0.36, 10.4],
          ];
          for (let c = 0; c < hexColOffsets.length; c++) {
            const [cx, cz, ch] = hexColOffsets[c];
            const hexCol = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.72, ch, 6), skirtMat);
            hexCol.position.set(cx, -h * 0.22 - ch * 0.5, cz);
            mesh.add(hexCol);
          }

          // Top surface progressive heating magma veins
          const topHeat = new THREE.Mesh(
            new THREE.BoxGeometry(w * 0.76, 0.04, 0.12),
            makeHeatMat(0.45)
          );
          topHeat.position.set(0, h * 0.5 + 0.012, 0.18);
          topHeat.rotation.y = 0.32 + seed * 0.2;
          mesh.add(topHeat);
        }

        if (heatMats.length > 0) {
          mesh.userData.volcanicHeatMats = heatMats;
          mesh.userData.heatLevel = 0.22;
        }
      } else if (parisV2) {
        // Monumental Champs-Élysées Haussmann Stone Esplanade Quay + Balustrades + Réverbère Streetlamps + Topiary Urns
        const limestoneMat = new THREE.MeshStandardMaterial({
          map: textures.parisStone,
          bumpMap: textures.stoneBump,
          bumpScale: 0.14,
          roughness: 0.78,
        });
        const ironMat = new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          metalness: 0.8,
          roughness: 0.3,
        });
        const giltMat = new THREE.MeshStandardMaterial({
          map: textures.goldTrim,
          color: 0xfbbf24,
          emissive: 0x92400e,
          emissiveIntensity: 0.3,
          metalness: 0.85,
          roughness: 0.24,
        });
        const lampGlowMat = new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: 2.3,
          roughness: 0.15,
        });
        const turfMat = new THREE.MeshStandardMaterial({
          map: textures.jungleGrass,
          color: 0x4d7c0f,
          roughness: 0.84,
        });

        // Deep stone esplanade quay wall grounding down to the Seine (-6.0)
        const quayWall = new THREE.Mesh(new THREE.BoxGeometry(w + 0.9, 10.2, d + 0.9), limestoneMat);
        quayWall.position.y = -h * 0.45 - 5.1;
        quayWall.receiveShadow = true;
        mesh.add(quayWall);

        // Classical stone cornice band wrapping the top esplanade edge
        const cornice = new THREE.Mesh(createRoundedSlabGeometry(w + 1.15, 0.36, d + 1.15, 0.16), limestoneMat);
        cornice.position.y = h * 0.28;
        mesh.add(cornice);

        // Stepped masonry buttress piers along lateral quay walls
        for (const sx of [-1, 1]) {
          for (const pz of [-12, -4, 4, 12]) {
            const pier = new THREE.Mesh(new THREE.BoxGeometry(0.9, 10.6, 1.5), limestoneMat);
            pier.position.set(sx * (w * 0.5 + 0.42), -h * 0.45 - 4.9, pz);
            mesh.add(pier);
          }
        }

        // Ornamental Haussmann streetlamps (réverbères) & stone balustrades along outer wings (keeping wz-p1 at [-6.5, -1] clear)
        const lampSpots: [number, number][] = [
          [-8.3, 12.2],
          [-8.3, 5.2],
          [-8.3, -6.8],
          [-8.3, -13.6],
          [8.3, 12.2],
          [8.3, 5.2],
          [8.3, -1.0],
          [8.3, -6.8],
          [8.3, -13.6],
        ];
        for (const [lx, lz] of lampSpots) {
          const basePed = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.55, 8), limestoneMat);
          basePed.position.set(lx, h * 0.5 + 0.27, lz);
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.11, 2.35, 8), ironMat);
          pole.position.set(lx, h * 0.5 + 1.65, lz);
          const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.1, 0.18, 8), giltMat);
          collar.position.set(lx, h * 0.5 + 2.85, lz);
          const globe = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), lampGlowMat);
          globe.position.set(lx, h * 0.5 + 3.08, lz);
          const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.2, 8), ironMat);
          cap.position.set(lx, h * 0.5 + 3.32, lz);
          mesh.add(basePed, pole, collar, globe, cap);
        }

        // Formal Tuileries boxwood topiary planters at the 4 corners
        const urnCorners: [number, number][] = [
          [-7.6, 13.8],
          [7.6, 13.8],
          [-7.6, -14.2],
          [7.6, -14.2],
        ];
        for (const [ux, uz] of urnCorners) {
          const planter = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.48, 0.62, 10), limestoneMat);
          planter.position.set(ux, h * 0.5 + 0.31, uz);
          const foliageA = new THREE.Mesh(new THREE.SphereGeometry(0.56, 10, 8), turfMat);
          foliageA.position.set(ux, h * 0.5 + 0.92, uz);
          const foliageB = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), turfMat);
          foliageB.position.set(ux, h * 0.5 + 1.56, uz);
          mesh.add(planter, foliageA, foliageB);
        }

        // Stone rail bars on the outer right (+X) and outer rear-left (-X, leaving wz-p1 opening)
        const railR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.62, d * 0.88), limestoneMat);
        railR.position.set(w * 0.485, h * 0.5 + 0.31, 0);
        const railLF = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.62, 9.5), limestoneMat);
        railLF.position.set(-w * 0.485, h * 0.5 + 0.31, 10.2);
        const railLB = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.62, 9.5), limestoneMat);
        railLB.position.set(-w * 0.485, h * 0.5 + 0.31, -10.4);
        mesh.add(railR, railLF, railLB);
      } else {
        const underSkirt = new THREE.Mesh(
          new THREE.CylinderGeometry(Math.min(w, d) * 0.44, Math.min(w, d) * 0.24, 2.4, 8),
          skirtMat
        );
        underSkirt.scale.set(w / Math.min(w, d), 1, d / Math.min(w, d));
        underSkirt.position.y = -h * 0.5 - 1.1;
        underSkirt.rotation.y = Math.PI / 8;
        mesh.add(underSkirt);

        if (w >= 6 && d >= 6) {
          const capMat = new THREE.MeshStandardMaterial({
            color: 0xd97706,
            emissive: 0x78350f,
            emissiveIntensity: 0.35,
            metalness: 0.6,
            roughness: 0.35,
          });
          for (const sx of [-1, 1]) {
            for (const sz of [-1, 1]) {
              const bollard = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.85, 0.68), skirtMat);
              bollard.position.set(sx * (w * 0.44), h * 0.5 + 0.4, sz * (d * 0.44));
              bollard.castShadow = !isSoftwareGl;
              mesh.add(bollard);

              const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), capMat);
              cap.position.set(sx * (w * 0.44), h * 0.5 + 0.98, sz * (d * 0.44));
              mesh.add(cap);
            }
          }
        }
      }
    } else if (
      def.shape === 'organic' ||
      style === 'jungle' ||
      style === 'desert' ||
      style === 'ice' ||
      style === 'volcanic' ||
      style === 'temple'
    ) {
      if (jungleV2) {
        const isLargeIsland = w >= 8 && d >= 8;
        const skirtH = isLargeIsland ? 6.2 : 3.4;
        const cragGeo = createCraggyUnderbellyGeo(w, d, skirtH, seed);
        const cragRockMat = new THREE.MeshStandardMaterial({
          map: textures.jungleRuinStone,
          bumpMap: textures.jungleRuinBump,
          bumpScale: 0.2,
          color: 0x8f8a74,
          roughness: 0.92,
        });
        const skirt = new THREE.Mesh(cragGeo, skirtMat);
        skirt.position.y = -h * 0.4 - skirtH * 0.46;
        mesh.add(skirt);

        // Deep stratified cliff spur anchoring big jungle clearings
        const lowerSpur = new THREE.Mesh(
          createCraggyUnderbellyGeo(w * 0.68, d * 0.68, skirtH * 0.95, seed + 2.3),
          cragRockMat
        );
        lowerSpur.position.y = -h * 0.45 - skirtH * 0.9;
        mesh.add(lowerSpur);

        // Gnarled roots wrapping visibly around the platform perimeter & dangling tendrils beneath
        const rootMat = new THREE.MeshStandardMaterial({
          map: textures.barkTexture,
          bumpMap: textures.barkBump,
          bumpScale: 0.16,
          roughness: 0.88,
        });
        const rootCount = isLargeIsland ? 6 : 4;
        for (let r = 0; r < rootCount; r++) {
          const ang = (r / rootCount) * Math.PI * 2 + seed * 0.5;
          const rx = Math.cos(ang) * (w * 0.48);
          const rz = Math.sin(ang) * (d * 0.48);
          const rootCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(rx * 0.86, h * 0.44, rz * 0.86),
            new THREE.Vector3(rx * 1.05, h * 0.1, rz * 1.05),
            new THREE.Vector3(rx * 0.96, -h * 0.8, rz * 0.96),
            new THREE.Vector3(rx * 0.72, -skirtH * 0.65, rz * 0.72),
          ]);
          const rootMesh = new THREE.Mesh(
            new THREE.TubeGeometry(rootCurve, 8, isLargeIsland ? 0.28 : 0.19, 6, false),
            rootMat
          );
          mesh.add(rootMesh);
        }

        // Flush weathered stone flagstones & mossy rim patches on main jungle clearings
        if (isLargeIsland) {
          const slabMat = new THREE.MeshStandardMaterial({
            map: textures.jungleRuinStone,
            bumpMap: textures.jungleRuinBump,
            bumpScale: 0.14,
            roughness: 0.88,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
          });
          for (let s = 0; s < 5; s++) {
            const sa = (s / 5) * Math.PI * 2 + seed;
            const sr = Math.min(w, d) * 0.24;
            const flagstone = new THREE.Mesh(
              new THREE.CylinderGeometry(0.95 + (s % 2) * 0.35, 1.05 + (s % 2) * 0.35, 0.07, 6),
              slabMat
            );
            flagstone.position.set(Math.cos(sa) * sr, h * 0.5 + 0.02, Math.sin(sa) * sr);
            flagstone.rotation.y = sa;
            flagstone.receiveShadow = true;
            mesh.add(flagstone);
          }
        }
      } else if (desertV2) {
        const isBigPlateau = w >= 9 && d >= 9;
        const skirtH = def.kind === 'crumble' ? 1.35 : isBigPlateau ? 14.5 : 5.2;
        const cliffMat = new THREE.MeshStandardMaterial({
          map: textures.desertSide,
          bumpMap: textures.stoneBump,
          bumpScale: 0.22,
          roughness: 0.92,
        });
        const crag = new THREE.Mesh(createCraggyUnderbellyGeo(w * 0.96, d * 0.96, skirtH, seed), cliffMat);
        crag.position.y = -h * 0.44 - skirtH * 0.48;
        mesh.add(crag);

        if (def.kind === 'crumble') {
          // Cracked unstable sandstone rim & glowing amber fissure seams signaling sinking sand platform
          const crackMat = new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            emissive: 0xd97706,
            emissiveIntensity: 0.85,
            roughness: 0.4,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
          });
          const seamA = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 0.05, 0.14), crackMat);
          seamA.position.set(0, h * 0.5 + 0.015, 0.25);
          seamA.rotation.y = 0.35;
          const seamB = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, d * 0.82), crackMat);
          seamB.position.set(-0.2, h * 0.5 + 0.015, 0);
          seamB.rotation.y = -0.22;
          mesh.add(seamA, seamB);
        } else if (def.id === 'd-secret-oasis') {
          // Secret Oasis Platform crystal-clear turquoise spring ring & sandstone stone coping
          const rimMat = new THREE.MeshStandardMaterial({
            map: textures.desertRuinStone,
            bumpMap: textures.desertRuinBump,
            bumpScale: 0.14,
            roughness: 0.85,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
          });
          const oasisRing = new THREE.Mesh(new THREE.RingGeometry(1.75, 2.75, 28), new THREE.MeshPhysicalMaterial({
            color: 0x06b6d4,
            emissive: 0x0e7490,
            emissiveIntensity: 0.45,
            roughness: 0.08,
            metalness: 0.18,
            clearcoat: 1.0,
            polygonOffset: true,
            polygonOffsetFactor: -2,
            polygonOffsetUnits: -2,
          }));
          oasisRing.rotation.x = -Math.PI / 2;
          oasisRing.position.y = h * 0.5 + 0.025;
          mesh.add(oasisRing);

          for (let k = 0; k < 10; k++) {
            const ang = (k / 10) * Math.PI * 2;
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.32 + (k % 2) * 0.12, 0), rimMat);
            rock.scale.set(1.2, 0.55, 1.0);
            rock.position.set(Math.cos(ang) * 2.78, h * 0.5 + 0.08, Math.sin(ang) * 2.78);
            rock.rotation.y = ang;
            mesh.add(rock);
          }
        } else if (isBigPlateau) {
          const slabMat = new THREE.MeshStandardMaterial({
            map: textures.desertRuinStone,
            bumpMap: textures.desertRuinBump,
            bumpScale: 0.14,
            roughness: 0.88,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
          });
          for (let s = 0; s < 5; s++) {
            const sa = (s / 5) * Math.PI * 2 + seed;
            const sr = Math.min(w, d) * 0.25;
            const slab = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.12, 0.07, 6), slabMat);
            slab.position.set(Math.cos(sa) * sr, h * 0.5 + 0.02, Math.sin(sa) * sr);
            slab.rotation.y = sa;
            slab.receiveShadow = true;
            mesh.add(slab);
          }
        }
      } else if (iceV2) {
        // Multi-tiered Glacier Flank Underbelly + Slate Cliff Core + Translucent Icicles + Glowing Boreal Crystals
        const isBigGlacier = w >= 8.5 && d >= 8.5;
        const skirtH = isBigGlacier ? 14.5 : 5.4;
        const slateCoreMat = new THREE.MeshStandardMaterial({
          map: textures.glacialRock,
          bumpMap: textures.glacialRockBump,
          bumpScale: 0.2,
          roughness: 0.86,
        });
        const glacierIceMat = new THREE.MeshPhysicalMaterial({
          color: 0x7dd3fc,
          emissive: 0x075985,
          emissiveIntensity: 0.25,
          roughness: 0.1,
          clearcoat: 1.0,
          transparent: true,
          opacity: 0.85,
        });
        const crystalEmissiveMat = new THREE.MeshStandardMaterial({
          color: 0xa5f3fc,
          emissive: 0x06b6d4,
          emissiveIntensity: 1.75,
          roughness: 0.15,
        });

        const upperIce = new THREE.Mesh(createCraggyUnderbellyGeo(w * 0.96, d * 0.96, skirtH * 0.55, seed), skirtMat);
        upperIce.position.y = -h * 0.42 - skirtH * 0.26;
        mesh.add(upperIce);

        const deepSlate = new THREE.Mesh(
          createCraggyUnderbellyGeo(w * 0.72, d * 0.72, skirtH * 0.78, seed + 1.9),
          slateCoreMat
        );
        deepSlate.position.y = -h * 0.45 - skirtH * 0.64;
        mesh.add(deepSlate);

        // Ring of translucent hanging icicles beneath glacial island rim
        const icicleCount = isBigGlacier ? 10 : 6;
        for (let k = 0; k < icicleCount; k++) {
          const ang = (k / icicleCount) * Math.PI * 2 + seed;
          const icH = 1.15 + (k % 3) * 0.65;
          const ic = new THREE.Mesh(new THREE.ConeGeometry(0.24 + (k % 2) * 0.08, icH, 6), glacierIceMat);
          ic.rotation.x = Math.PI;
          ic.position.set(Math.cos(ang) * (w * 0.42), -h * 0.46 - icH * 0.45, Math.sin(ang) * (d * 0.42));
          mesh.add(ic);
        }

        // Emissive cyan-aurora crystal formations & snow-dusted slate boulders along large arena outer rims
        if (isBigGlacier) {
          for (let c = 0; c < 4; c++) {
            const ang = (c / 4) * Math.PI * 2 + Math.PI * 0.25;
            const cx = Math.cos(ang) * (w * 0.45);
            const cz = Math.sin(ang) * (d * 0.45);
            const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), crystalEmissiveMat);
            crystal.scale.set(0.62, 2.0, 0.62);
            crystal.position.set(cx, h * 0.48 + 0.55, cz);
            crystal.rotation.set(0.15 * Math.cos(ang), ang, -0.15 * Math.sin(ang));
            mesh.add(crystal);
          }
        }
      } else if (templeV2) {
        // Irregular Moss-Cloaked Stone River Islands & Temple Root Clearings
        const isStartOrBig = w >= 8 && d >= 8;
        const skirtH = isStartOrBig ? 7.5 : 4.2;
        const cragGeo = createCraggyUnderbellyGeo(w * 0.98, d * 0.98, skirtH, seed);
        const mossRockMat = new THREE.MeshStandardMaterial({
          map: textures.templeCarvedStone,
          bumpMap: textures.templeCarvedBump,
          bumpScale: 0.2,
          roughness: 0.9,
        });
        const skirt = new THREE.Mesh(cragGeo, skirtMat);
        skirt.position.y = -h * 0.42 - skirtH * 0.46;
        mesh.add(skirt);

        const deepCrag = new THREE.Mesh(
          createCraggyUnderbellyGeo(w * 0.72, d * 0.72, skirtH * 0.85, seed + 2.1),
          mossRockMat
        );
        deepCrag.position.y = -h * 0.46 - skirtH * 0.85;
        mesh.add(deepCrag);

        const rootMat = new THREE.MeshStandardMaterial({
          map: textures.barkTexture,
          bumpMap: textures.barkBump,
          bumpScale: 0.16,
          color: 0x6b4226,
          roughness: 0.88,
        });
        const rootCount = isStartOrBig ? 6 : 4;
        for (let r = 0; r < rootCount; r++) {
          const ang = (r / rootCount) * Math.PI * 2 + seed * 0.6;
          const rx = Math.cos(ang) * (w * 0.48);
          const rz = Math.sin(ang) * (d * 0.48);
          const rootCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(rx * 0.86, h * 0.44, rz * 0.86),
            new THREE.Vector3(rx * 1.06, h * 0.08, rz * 1.06),
            new THREE.Vector3(rx * 0.94, -h * 0.75, rz * 0.94),
            new THREE.Vector3(rx * 0.72, -skirtH * 0.62, rz * 0.72),
          ]);
          mesh.add(
            new THREE.Mesh(new THREE.TubeGeometry(rootCurve, 8, isStartOrBig ? 0.28 : 0.19, 6, false), rootMat)
          );
        }

        if (isStartOrBig) {
          const slabMat = new THREE.MeshStandardMaterial({
            map: textures.templeCarvedStone,
            bumpMap: textures.templeCarvedBump,
            bumpScale: 0.15,
            roughness: 0.86,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
          });
          for (let s = 0; s < 5; s++) {
            const sa = (s / 5) * Math.PI * 2 + seed;
            const sr = Math.min(w, d) * 0.25;
            const stone = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.07, 6), slabMat);
            stone.position.set(Math.cos(sa) * sr, h * 0.5 + 0.02, Math.sin(sa) * sr);
            stone.rotation.y = sa;
            stone.receiveShadow = true;
            mesh.add(stone);
          }
        }
      } else if (volcanicV2) {
        // Jagged Volcanic Basalt Islands & Bastion Platforms rising directly out of the lava river
        const isBossOrBig = w >= 10 && d >= 10;
        const skirtH = isBossOrBig ? 17.5 : 13.5;
        const basaltRockMat = new THREE.MeshStandardMaterial({
          map: textures.volcanicSide,
          emissiveMap: textures.volcanicSideEmissive,
          emissive: 0xff5a00,
          emissiveIntensity: 1.5,
          bumpMap: textures.basaltBump,
          bumpScale: 0.22,
          roughness: 0.86,
        });
        const crag = new THREE.Mesh(createCraggyUnderbellyGeo(w * 0.96, d * 0.96, skirtH, seed), basaltRockMat);
        crag.position.y = -h * 0.44 - skirtH * 0.48;
        mesh.add(crag);

        // Ring of hexagonal basalt columns emerging from lava around platform perimeter
        const hexCount = isBossOrBig ? 8 : 5;
        for (let k = 0; k < hexCount; k++) {
          const ang = (k / hexCount) * Math.PI * 2 + seed * 0.4;
          const rad = 0.47 + (k % 2) * 0.05;
          const colH = (isBossOrBig ? 15.0 : 12.0) + (k % 3) * 1.6;
          const hexCol = new THREE.Mesh(
            new THREE.CylinderGeometry(0.62 + (k % 2) * 0.16, 0.82 + (k % 2) * 0.18, colH, 6),
            basaltRockMat
          );
          hexCol.position.set(
            Math.cos(ang) * (w * rad),
            -h * 0.22 - colH * 0.5 + 0.35,
            Math.sin(ang) * (d * rad)
          );
          mesh.add(hexCol);
        }

        // Progressive heat-up fissure veins across top surface + molten rim collar on arenas & gold bastions
        const heatMats: THREE.MeshStandardMaterial[] = [];
        const veinMat = new THREE.MeshStandardMaterial({
          color: 0xfb923c,
          emissive: 0xea580c,
          emissiveIntensity: 0.55,
          roughness: 0.28,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        });
        heatMats.push(veinMat);
        for (let v = 0; v < 2; v++) {
          const vein = new THREE.Mesh(
            new THREE.BoxGeometry(w * 0.52, 0.045, 0.12),
            veinMat
          );
          vein.position.set((v === 0 ? -1 : 1) * w * 0.12, h * 0.5 + 0.015, (v === 0 ? 1 : -1) * d * 0.14);
          vein.rotation.y = (v === 0 ? 0.45 : -0.52) + seed * 0.15;
          mesh.add(vein);
        }
        mesh.userData.volcanicHeatMats = heatMats;
        mesh.userData.heatLevel = 0.22;

        // Forged obsidian & amber magma braziers on outer corners of main arenas & gold launch/landing pads
        if (w >= 9 && d >= 9 && def.id !== 'v-goal') {
          const emberMat = new THREE.MeshStandardMaterial({
            color: 0xfef08a,
            emissive: 0xf97316,
            emissiveIntensity: 2.2,
            roughness: 0.2,
          });
          for (const sx of [-1, 1]) {
            for (const sz of [-1, 1]) {
              const post = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.46, 1.05, 6), basaltRockMat);
              post.position.set(sx * (w * 0.44), h * 0.5 + 0.48, sz * (d * 0.44));
              post.castShadow = !isSoftwareGl;
              const ember = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), emberMat);
              ember.position.set(sx * (w * 0.44), h * 0.5 + 1.18, sz * (d * 0.44));
              mesh.add(post, ember);
            }
          }
        }
      } else if (nebulaV2) {
        // Futuristic Astral Citadel Foundations, Holographic Gyroscopes & Elevated Sky-Gardens
        const isLargePlaza = w >= 7.2 && d >= 7.2;
        const isBossArena = def.id === 'n-boss-arena';
        const hullMat = new THREE.MeshStandardMaterial({
          map: textures.nebulaSide,
          bumpMap: textures.nebulaBump,
          bumpScale: 0.12,
          metalness: 0.76,
          roughness: 0.24,
        });
        const chromeTrimMat = new THREE.MeshStandardMaterial({
          color: 0xcbd5e1,
          metalness: 0.9,
          roughness: 0.16,
        });
        const cyanEnergyMat = new THREE.MeshStandardMaterial({
          color: 0x67e8f9,
          emissive: 0x06b6d4,
          emissiveIntensity: 1.85,
          roughness: 0.15,
        });
        const violetHoloMat = new THREE.MeshPhysicalMaterial({
          color: 0xc084fc,
          emissive: 0x9333ea,
          emissiveIntensity: 1.1,
          roughness: 0.1,
          clearcoat: 1.0,
          transparent: true,
          opacity: 0.82,
        });

        if (def.kind === 'moving') {
          // Sleek anti-gravity repulsor carriage with spinning holographic gyroscope ring & glowing side thrusters
          const chassis = new THREE.Mesh(
            new THREE.CylinderGeometry(Math.min(w, d) * 0.44, Math.min(w, d) * 0.2, h * 1.15, 8),
            hullMat
          );
          chassis.position.y = -h * 0.72;
          mesh.add(chassis);

          const gyro = new THREE.Mesh(
            new THREE.TorusGeometry(Math.min(w, d) * 0.48, 0.085, 8, 24),
            cyanEnergyMat
          );
          gyro.rotation.x = Math.PI / 2;
          gyro.position.y = -h * 0.48;
          mesh.add(gyro);
          mesh.userData.mechanismSpin = gyro;

          const underCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), cyanEnergyMat);
          underCore.position.y = -h * 1.42;
          mesh.add(underCore);
        } else if (def.kind === 'crumble') {
          // Fractured holographic energy-lattice bridge segment signaling unstable collapse
          const crackMat = new THREE.MeshStandardMaterial({
            color: 0xfde047,
            emissive: 0xf59e0b,
            emissiveIntensity: 1.65,
            roughness: 0.2,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
          });
          for (let c = 0; c < 3; c++) {
            const seam = new THREE.Mesh(new THREE.BoxGeometry(w * 0.78, 0.04, 0.11), crackMat);
            seam.position.set((c - 1) * 0.35, h * 0.5 + 0.015, (c - 1) * 0.65);
            seam.rotation.y = c === 1 ? -0.38 : 0.32;
            mesh.add(seam);
          }
          const cage = new THREE.Mesh(
            new THREE.CylinderGeometry(w * 0.42, w * 0.16, 1.4, 6),
            violetHoloMat
          );
          cage.position.y = -h * 0.46 - 0.68;
          mesh.add(cage);
        } else {
          // Multi-tiered floating astral citadel chassis tapering into an energy spire beneath
          const tier1H = isBossArena ? 4.8 : isLargePlaza ? 3.4 : 2.3;
          const tier1 = new THREE.Mesh(
            new THREE.CylinderGeometry(Math.min(w, d) * 0.54, Math.min(w, d) * 0.34, tier1H, 8),
            hullMat
          );
          tier1.scale.set(w / Math.min(w, d), 1, d / Math.min(w, d));
          tier1.position.y = -h * 0.46 - tier1H * 0.46;
          tier1.rotation.y = Math.PI / 8;
          mesh.add(tier1);

          const tier2H = isBossArena ? 8.2 : isLargePlaza ? 4.8 : 2.8;
          const tier2 = new THREE.Mesh(
            new THREE.ConeGeometry(Math.min(w, d) * 0.28, tier2H, 8),
            chromeTrimMat
          );
          tier2.rotation.x = Math.PI;
          tier2.scale.set(w / Math.min(w, d), 1, d / Math.min(w, d));
          tier2.position.y = -h * 0.46 - tier1H - tier2H * 0.42;
          mesh.add(tier2);

          // Spinning holographic stabilization gyro-ring beneath major plazas & piers
          const gyroR = Math.min(w, d) * 0.5;
          const gyroRing = new THREE.Mesh(
            new THREE.TorusGeometry(gyroR, isBossArena ? 0.18 : 0.09, 8, 28),
            cyanEnergyMat
          );
          gyroRing.rotation.x = Math.PI / 2;
          gyroRing.position.y = -h * 0.48 - tier1H * 0.65;
          mesh.add(gyroRing);
          mesh.userData.mechanismSpin = gyroRing;

          const crystalTip = new THREE.Mesh(
            new THREE.OctahedronGeometry(isBossArena ? 1.45 : 0.48, 0),
            violetHoloMat
          );
          crystalTip.scale.set(0.7, 1.85, 0.7);
          crystalTip.position.y = -h * 0.46 - tier1H - tier2H - 0.5;
          mesh.add(crystalTip);

          // Glowing holographic rim light strips along large plaza upper bevels (safe, non-intrusive)
          if (isLargePlaza || def.kind === 'ice') {
            const haloMat = def.kind === 'ice' ? cyanEnergyMat : violetHoloMat;
            const cornerPosts: [number, number][] = isBossArena
              ? [
                  [-13.0, -13.0],
                  [13.0, -13.0],
                  [-13.0, 13.0],
                  [13.0, 13.0],
                ]
              : [
                  [-w * 0.46, -d * 0.46],
                  [w * 0.46, -d * 0.46],
                ];
            for (const [cx, cz] of cornerPosts) {
              const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 1.25, 8), chromeTrimMat);
              beacon.position.set(cx, h * 0.5 + 0.6, cz);
              const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), haloMat);
              gem.scale.set(0.7, 1.4, 0.7);
              gem.position.set(cx, h * 0.5 + 1.48, cz);
              mesh.add(beacon, gem);
            }
          }

          // Elevated Sky-Gardens (bioluminescent turquoise moss planters & sculpted celestial trees on outer plaza rims)
          if (def.id === 'n-start' || def.id === 'n-arena1' || def.id === 'n-app-3' || isBossArena) {
            const turfMat = new THREE.MeshStandardMaterial({
              color: 0x0d9488,
              emissive: 0x0f766e,
              emissiveIntensity: 0.28,
              roughness: 0.72,
            });
            const silverBarkMat = new THREE.MeshStandardMaterial({
              color: 0x94a3b8,
              metalness: 0.45,
              roughness: 0.48,
            });
            const astralCanopyMat = new THREE.MeshStandardMaterial({
              color: 0x2dd4bf,
              emissive: 0x0891b2,
              emissiveIntensity: 0.55,
              roughness: 0.45,
            });
            const violetBlossomMat = new THREE.MeshStandardMaterial({
              color: 0xe879f9,
              emissive: 0xc026d3,
              emissiveIntensity: 1.2,
              roughness: 0.25,
            });

            const gardenSpots: [number, number, number][] = isBossArena
              ? [
                  [-12.8, 0, 1.15],
                  [12.8, 0, 1.15],
                  [-9.5, -12.8, 1.05],
                  [9.5, -12.8, 1.05],
                  [-9.5, 12.8, 1.0],
                  [9.5, 12.8, 1.0],
                ]
              : def.id === 'n-start'
                ? [
                    [-4.2, 3.8, 0.88],
                    [4.2, 3.8, 0.84],
                  ]
                : def.id === 'n-arena1'
                  ? [
                      [-4.1, -3.9, 0.84],
                      [-4.1, 3.9, 0.78],
                    ]
                  : [
                      [3.5, -3.4, 0.8],
                      [3.5, 3.4, 0.76],
                    ];

            for (const [gx, gz, gs] of gardenSpots) {
              const planter = new THREE.Mesh(new THREE.CylinderGeometry(1.12 * gs, 0.9 * gs, 0.34, 8), chromeTrimMat);
              planter.position.set(gx, h * 0.5 + 0.14, gz);
              const turf = new THREE.Mesh(new THREE.CylinderGeometry(0.98 * gs, 0.98 * gs, 0.12, 8), turfMat);
              turf.position.set(gx, h * 0.5 + 0.3, gz);
              mesh.add(planter, turf);

              // Sculpted futuristic spiral silver trunk + multi-layered turquoise/violet bioluminescent canopy
              const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.11 * gs, 0.22 * gs, 1.65 * gs, 7),
                silverBarkMat
              );
              trunk.position.set(gx, h * 0.5 + 1.05 * gs, gz);
              trunk.rotation.z = gx > 0 ? -0.14 : 0.14;
              mesh.add(trunk);

              const puffA = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75 * gs, 1), astralCanopyMat);
              puffA.scale.set(1.25, 0.75, 1.25);
              puffA.position.set(gx, h * 0.5 + 1.95 * gs, gz);
              const puffB = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 * gs, 1), astralCanopyMat);
              puffB.scale.set(1.15, 0.7, 1.15);
              puffB.position.set(gx + 0.32 * gs, h * 0.5 + 2.35 * gs, gz - 0.18 * gs);
              const blossom = new THREE.Mesh(new THREE.OctahedronGeometry(0.22 * gs, 0), violetBlossomMat);
              blossom.position.set(gx - 0.25 * gs, h * 0.5 + 2.25 * gs, gz + 0.24 * gs);
              mesh.add(puffA, puffB, blossom);
            }
          }
        }
      } else if (rapidsV2) {
        const timberMat = new THREE.MeshStandardMaterial({
          map: textures.barkTexture,
          bumpMap: textures.barkBump,
          bumpScale: 0.14,
          roughness: 0.88,
        });
        const stoneMat = new THREE.MeshStandardMaterial({
          map: textures.jungleRuinStone,
          bumpMap: textures.jungleRuinBump,
          bumpScale: 0.14,
          roughness: 0.86,
        });
        const ropeMat = new THREE.MeshStandardMaterial({ color: 0xb48a52, roughness: 0.85 });
        const lanternMat = new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf59e0b,
          emissiveIntensity: 1.9,
          roughness: 0.2,
        });

        if (style === 'river') {
          // River timber pier pilings descending deep into riverbed + mooring bollards & warm lanterns
          const pileRows = Math.max(2, Math.round(d / 6));
          for (let rz = 0; rz < pileRows; rz++) {
            const pz = -d * 0.44 + (rz / Math.max(1, pileRows - 1)) * d * 0.88;
            for (const sx of [-1, 1]) {
              const px = sx * (w * 0.45);
              const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 4.8, 8), timberMat);
              pile.position.set(px, -h * 0.5 - 1.6, pz);
              pile.castShadow = !isSoftwareGl;
              mesh.add(pile);

              // Above-deck mooring bollards at ends and middle
              if (rz === 0 || rz === pileRows - 1 || rz === Math.floor(pileRows / 2)) {
                const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.86, 8), timberMat);
                bollard.position.set(px, h * 0.5 + 0.42, pz);
                mesh.add(bollard);
                if (rz === 0 || rz === pileRows - 1) {
                  const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), lanternMat);
                  lamp.position.set(px, h * 0.5 + 0.98, pz);
                  mesh.add(lamp);
                }
              }
            }
          }
          // Rope handrail cables along pier flanks
          for (const sx of [-1, 1]) {
            const px = sx * (w * 0.45);
            const rope = new THREE.Mesh(
              new THREE.CylinderGeometry(0.045, 0.045, d * 0.88, 6),
              ropeMat
            );
            rope.rotation.x = Math.PI / 2;
            rope.position.set(px, h * 0.5 + 0.72, 0);
            mesh.add(rope);
          }
        } else if (def.shape === 'disc') {
          // Rotating emerald stone lotus dais
          const trimRing = new THREE.Mesh(
            new THREE.TorusGeometry(Math.max(w, d) * 0.48, 0.14, 8, 24),
            stoneMat
          );
          trimRing.rotation.x = Math.PI / 2;
          trimRing.position.y = h * 0.44;
          const underPedestal = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.38, w * 0.22, 2.4, 10), stoneMat);
          underPedestal.position.y = -h * 0.5 - 1.1;
          mesh.add(trimRing, underPedestal);
        } else {
          // Tranquil sanctuary island rocky stone mound grounding into the lakebed
          const mound = new THREE.Mesh(
            new THREE.CylinderGeometry(Math.min(w, d) * 0.48, Math.min(w, d) * 0.62, 3.2, 12),
            stoneMat
          );
          mound.scale.set(w / Math.min(w, d), 1, d / Math.min(w, d));
          mound.position.y = -h * 0.45 - 1.4;
          mesh.add(mound);
        }
      } else {
        const skirtH = Math.min(3.2, Math.max(1.2, h * 1.45));
        const skirtGeo = new THREE.CylinderGeometry(
          Math.min(w, d) * 0.46,
          Math.min(w, d) * 0.2,
          skirtH,
          8
        );
        const skirt = new THREE.Mesh(skirtGeo, skirtMat);
        skirt.scale.set(w / Math.min(w, d), 1, d / Math.min(w, d));
        skirt.position.y = -h * 0.42 - skirtH * 0.48;
        skirt.rotation.y = Math.PI / 8;
        mesh.add(skirt);

        // Subtle glowing orbital stabilizer core under floating landmasses
        if (style === 'nebula' || style === 'tech' || style === 'gold') {
          const core = new THREE.Mesh(
            new THREE.OctahedronGeometry(Math.min(w, d) * 0.14, 0),
            new THREE.MeshStandardMaterial({
              color: 0x38bdf8,
              emissive: 0x0ea5e9,
              emissiveIntensity: 1.8,
            })
          );
          core.position.y = -h * 0.5 - skirtH * 0.92;
          mesh.add(core);
        }
      }
    }
  }

  // Tech / Gold / Nebula / Conveyor / Disappearing / Elevator architectural rim trims
  if (def.kind === 'conveyor') {
    const dir = def.conveyorDir ?? [0, 3];
    const angle = Math.atan2(dir[0], dir[1]);
    const chevronMat = new THREE.MeshStandardMaterial({
      color: iceV2 ? 0x67e8f9 : 0xfacc15,
      emissive: iceV2 ? 0x06b6d4 : 0xf59e0b,
      emissiveIntensity: 1.65,
      roughness: 0.2,
    });
    const span = Math.max(w, d);
    const count = Math.max(2, Math.floor(span / 2.2));
    for (let i = 0; i < count; i++) {
      const offset = -span * 0.35 + (i / Math.max(1, count - 1)) * span * 0.7;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(Math.min(w, d) * 0.62, 0.06, 0.28), chevronMat);
      bar.position.set(Math.sin(angle) * offset, h * 0.51, Math.cos(angle) * offset);
      bar.rotation.y = angle;
      mesh.add(bar);
    }
    if (iceV2) {
      // Translucent glacial wind-channel side curbs
      const curbMat = new THREE.MeshPhysicalMaterial({
        color: 0xbae6fd,
        roughness: 0.1,
        clearcoat: 1.0,
        transparent: true,
        opacity: 0.82,
      });
      for (const sz of [-1, 1]) {
        const curb = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 0.16, 0.14), curbMat);
        curb.position.set(0, h * 0.54, sz * (d * 0.46));
        mesh.add(curb);
      }
    }
    if (volcanicV2) {
      // Scorched obsidian conveyor curbing with molten flow rail accents
      const curbMat = new THREE.MeshStandardMaterial({
        map: textures.volcanicSide,
        emissiveMap: textures.volcanicSideEmissive,
        emissive: 0xff5a00,
        emissiveIntensity: 1.3,
        bumpMap: textures.basaltBump,
        bumpScale: 0.16,
        roughness: 0.85,
      });
      for (const sx of [-1, 1]) {
        const curb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, d * 0.94), curbMat);
        curb.position.set(sx * (w * 0.47), h * 0.52, 0);
        mesh.add(curb);
      }
    }
    if (nebulaV2) {
      // Sleek photon-accelerator side rails with glowing turquoise conduits
      const railMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.5,
        metalness: 0.78,
        roughness: 0.18,
      });
      for (const sx of [-1, 1]) {
        const curb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, d * 0.94), railMat);
        curb.position.set(sx * (w * 0.47), h * 0.52, 0);
        mesh.add(curb);
      }
    }
  } else if (def.kind === 'disappearing') {
    const frameMat = new THREE.MeshStandardMaterial({
      color: volcanicV2 ? 0xfb923c : iceV2 ? 0xa5f3fc : nebulaV2 ? 0x67e8f9 : 0x67e8f9,
      emissive: volcanicV2 ? 0xea580c : iceV2 ? 0x10b981 : nebulaV2 ? 0xa855f7 : 0x06b6d4,
      emissiveIntensity: volcanicV2 ? 1.75 : 1.9,
      roughness: 0.18,
    });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, 0.12, d + 0.14), frameMat);
    frame.position.y = h * 0.44;
    mesh.add(frame);
    if (nebulaV2) {
      // Floating corner holographic phase emitters & lower spinning ring
      const phaseRing = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, d) * 0.44, 0.08, 8, 22), frameMat);
      phaseRing.rotation.x = Math.PI / 2;
      phaseRing.position.y = -h * 0.52;
      mesh.add(phaseRing);
      mesh.userData.mechanismSpin = phaseRing;
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const pylon = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), frameMat);
          pylon.scale.set(0.65, 1.6, 0.65);
          pylon.position.set(sx * (w * 0.46), h * 0.5 + 0.45, sz * (d * 0.46));
          mesh.add(pylon);
        }
      }
    }
    if (volcanicV2) {
      const existingHeat = (mesh.userData.volcanicHeatMats as THREE.MeshStandardMaterial[] | undefined) ?? [];
      existingHeat.push(frameMat);
      mesh.userData.volcanicHeatMats = existingHeat;
      mesh.userData.heatLevel = 0.35;
    }
  } else if (def.kind === 'elevator') {
    if (iceV2) {
      const crystalPylonMat = new THREE.MeshStandardMaterial({
        color: 0x67e8f9,
        emissive: 0x10b981,
        emissiveIntensity: 1.65,
        roughness: 0.16,
      });
      for (const sx of [-1, 1]) {
        const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, h * 1.6, 6), crystalPylonMat);
        pylon.position.set(sx * (w * 0.46), 0.3, 0);
        mesh.add(pylon);
      }
      const coreSpinner = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, d) * 0.36, 0.1, 8, 20), crystalPylonMat);
      coreSpinner.rotation.x = Math.PI / 2;
      coreSpinner.position.y = -h * 0.48;
      mesh.add(coreSpinner);
      mesh.userData.mechanismSpin = coreSpinner;
    } else {
      const railMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 1.4,
        metalness: 0.75,
        roughness: 0.25,
      });
      for (const sx of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, h * 1.4, 8), railMat);
        post.position.set(sx * (w * 0.46), 0.2, 0);
        mesh.add(post);
      }
    }
  } else if (style === 'gold' || style === 'nebula' || style === 'tech') {
    const trimColor = style === 'gold' ? 0xfbbf24 : style === 'nebula' ? 0x22d3ee : 0x38bdf8;
    const trimMat = new THREE.MeshStandardMaterial({
      color: trimColor,
      emissive: trimColor,
      emissiveIntensity: nebulaV2 ? 0.9 : 0.55,
      metalness: 0.8,
      roughness: 0.22,
    });
    const rim = new THREE.Mesh(
      createRoundedSlabGeometry(w + 0.1, 0.09, d + 0.1, nebulaV2 ? Math.min(0.64, Math.min(w, d) * 0.16) : 0.14),
      trimMat
    );
    rim.position.y = h * 0.41;
    mesh.add(rim);
  }

  // Linked hidden bridges start subtle holographic outline until switch/target activates them
  if (def.linkedTargetId || def.linkedSwitchId) {
    if (jungleV2) {
      const runeRibMat = new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x0ea5e9,
        emissiveIntensity: 1.5,
        roughness: 0.2,
      });
      const alongZ = d >= w;
      const span = alongZ ? d : w;
      for (let i = -1; i <= 1; i++) {
        const rib = new THREE.Mesh(
          alongZ ? new THREE.BoxGeometry(w * 0.88, 0.14, 0.28) : new THREE.BoxGeometry(0.28, 0.14, d * 0.88),
          runeRibMat
        );
        rib.position.set(alongZ ? 0 : i * (span * 0.3), -h * 0.44, alongZ ? i * (span * 0.3) : 0);
        mesh.add(rib);
      }
    } else if (desertV2) {
      const sunRuneMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.6,
        roughness: 0.22,
      });
      const halo = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, d) * 0.48, 0.1, 8, 24), sunRuneMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.y = -h * 0.45;
      mesh.add(halo);
    } else if (templeV2) {
      const jadeRuneMat = new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 1.55,
        roughness: 0.22,
      });
      const alongZ = d >= w;
      const span = alongZ ? d : w;
      for (let i = -1; i <= 1; i++) {
        const rib = new THREE.Mesh(
          alongZ ? new THREE.BoxGeometry(w * 0.88, 0.14, 0.28) : new THREE.BoxGeometry(0.28, 0.14, d * 0.88),
          jadeRuneMat
        );
        rib.position.set(alongZ ? 0 : i * (span * 0.3), -h * 0.44, alongZ ? i * (span * 0.3) : 0);
        mesh.add(rib);
      }
    } else if (volcanicV2) {
      const magmaRuneMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf97316,
        emissiveIntensity: 1.75,
        roughness: 0.2,
      });
      const halo = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, d) * 0.48, 0.11, 8, 24), magmaRuneMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.y = -h * 0.45;
      mesh.add(halo);
    } else if (nebulaV2) {
      const holoFrameMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        wireframe: true,
        transparent: true,
        opacity: 0.42,
      });
      const wire = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, h * 0.92, d * 0.98), holoFrameMat);
      mesh.add(wire);
    } else {
      const wire = new THREE.Mesh(
        new THREE.BoxGeometry(w * 0.98, h * 0.96, d * 0.98),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.35 })
      );
      mesh.add(wire);
    }
  }

  return mesh;
}

export function createSwitchMesh(): {
  group: THREE.Group;
  buttonMesh: THREE.Mesh;
  buttonMat: THREE.MeshStandardMaterial;
  ringMat: THREE.MeshStandardMaterial;
} {
  const group = new THREE.Group();

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.38,
    metalness: 0.75,
  });
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 1.4,
    roughness: 0.25,
  });
  const buttonMat = new THREE.MeshStandardMaterial({
    color: 0xfb7185,
    emissive: 0xf43f5e,
    emissiveIntensity: 1.8,
    roughness: 0.22,
    metalness: 0.2,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.18, 0.22, 16), baseMat);
  base.position.y = 0.11;
  base.receiveShadow = true;

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.08, 8, 24), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.22;

  const buttonMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.24, 16), buttonMat);
  buttonMesh.position.y = 0.28;
  buttonMesh.castShadow = true;

  group.add(base, ring, buttonMesh);
  return { group, buttonMesh, buttonMat, ringMat };
}

export function createRelicMesh(): {
  group: THREE.Group;
  core: THREE.Mesh;
  halo: THREE.Mesh;
} {
  const group = new THREE.Group();

  const crystalMat = new THREE.MeshPhysicalMaterial({
    color: 0xe879f9,
    emissive: 0xc026d3,
    emissiveIntensity: 1.45,
    roughness: 0.08,
    metalness: 0.18,
    clearcoat: 1.0,
    transmission: 0.2,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.1,
    metalness: 0.88,
    roughness: 0.18,
  });

  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.46, 0), crystalMat);
  core.scale.set(0.86, 1.35, 0.86);
  core.castShadow = true;

  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.055, 8, 28), goldMat);
  halo.rotation.x = Math.PI * 0.32;

  const halo2 = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.04, 8, 24), goldMat);
  halo2.rotation.y = Math.PI * 0.4;
  halo.add(halo2);

  group.add(core, halo);
  return { group, core, halo };
}

export function createWindZoneMesh(radius: number, height: number): {
  group: THREE.Group;
  swirls: THREE.Mesh[];
} {
  const group = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.4,
    metalness: 0.7,
  });
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.48,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const vent = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.72, radius * 0.84, 0.22, 18), baseMat);
  vent.position.y = 0.11;
  group.add(vent);

  const glows = new THREE.Mesh(
    new THREE.RingGeometry(radius * 0.35, radius * 0.68, 20),
    new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
  );
  glows.rotation.x = -Math.PI / 2;
  glows.position.y = 0.24;
  group.add(glows);

  const swirls: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const r = radius * (0.65 + (i % 2) * 0.18);
    const swirl = new THREE.Mesh(new THREE.TorusGeometry(r, 0.045, 6, 22), ringMat);
    swirl.rotation.x = Math.PI / 2;
    swirl.position.y = 0.6 + (i / 4) * (height - 0.8);
    group.add(swirl);
    swirls.push(swirl);
  }

  return { group, swirls };
}

export function createDesertThermalUpdraftMesh(
  radius: number,
  height: number,
  textures: ProceduralTextures
): {
  group: THREE.Group;
  swirls: THREE.Mesh[];
  ribbons: THREE.Object3D[];
} {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.desertRuinStone,
    bumpMap: textures.desertRuinBump,
    bumpScale: 0.16,
    roughness: 0.85,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    map: textures.goldTrim,
    color: 0xf59e0b,
    emissive: 0x92400e,
    emissiveIntensity: 0.5,
    metalness: 0.82,
    roughness: 0.24,
  });
  const heatRingMat = new THREE.MeshBasicMaterial({
    color: 0xfde047,
    transparent: true,
    opacity: 0.56,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ribbonMat = new THREE.MeshBasicMaterial({
    color: 0xfb923c,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  // Ancient carved sandstone wind-fumarole grate base
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.84, radius * 1.05, 0.28, 12), stoneMat);
  plinth.position.y = 0.14;
  group.add(plinth);

  const grateRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.72, 0.1, 8, 22), brassMat);
  grateRing.rotation.x = Math.PI / 2;
  grateRing.position.y = 0.28;
  group.add(grateRing);

  const coreGlow = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.66, 20),
    new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
  );
  coreGlow.rotation.x = -Math.PI / 2;
  coreGlow.position.y = 0.29;
  group.add(coreGlow);

  // Rising golden thermal vortex rings
  const swirls: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const r = radius * (0.62 + (i % 2) * 0.22);
    const swirl = new THREE.Mesh(new THREE.TorusGeometry(r, 0.055, 6, 22), heatRingMat);
    swirl.rotation.x = Math.PI / 2;
    swirl.position.y = 0.5 + (i / 5) * (height - 0.5);
    group.add(swirl);
    swirls.push(swirl);
  }

  // 3 spiraling translucent thermal updraft air ribbons
  const ribbons: THREE.Object3D[] = [];
  const ribbonSpinner = new THREE.Group();
  for (let s = 0; s < 3; s++) {
    const startAng = (s / 3) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 14; k++) {
      const t = k / 14;
      const a = startAng + t * Math.PI * 2.8;
      const rad = radius * (0.48 + t * 0.42);
      pts.push(new THREE.Vector3(Math.cos(a) * rad, 0.3 + t * height, Math.sin(a) * rad));
    }
    const ribbonMesh = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 22, 0.085, 6, false),
      ribbonMat
    );
    ribbonSpinner.add(ribbonMesh);
  }
  group.add(ribbonSpinner);
  ribbons.push(ribbonSpinner);

  return { group, swirls, ribbons };
}

export function createPolarWindUpdraftMesh(
  radius: number,
  height: number,
  textures: ProceduralTextures
): {
  group: THREE.Group;
  swirls: THREE.Mesh[];
  ribbons: THREE.Object3D[];
} {
  const group = new THREE.Group();
  const slateMat = new THREE.MeshStandardMaterial({
    map: textures.glacialRock,
    bumpMap: textures.glacialRockBump,
    bumpScale: 0.16,
    roughness: 0.75,
  });
  const crystalRingMat = new THREE.MeshStandardMaterial({
    color: 0x67e8f9,
    emissive: 0x10b981,
    emissiveIntensity: 1.45,
    roughness: 0.15,
  });
  const vortexRingMat = new THREE.MeshBasicMaterial({
    color: 0xa5f3fc,
    transparent: true,
    opacity: 0.58,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ribbonMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.86, radius * 1.08, 0.3, 12), slateMat);
  plinth.position.y = 0.15;
  group.add(plinth);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.76, 0.1, 8, 22), crystalRingMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.3;
  group.add(rim);

  for (let c = 0; c < 6; c++) {
    const a = (c / 6) * Math.PI * 2;
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), crystalRingMat);
    shard.scale.set(0.65, 1.8, 0.65);
    shard.position.set(Math.cos(a) * radius * 0.85, 0.42, Math.sin(a) * radius * 0.85);
    shard.rotation.z = -Math.cos(a) * 0.28;
    group.add(shard);
  }

  const coreGlow = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.68, 22),
    new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
  );
  coreGlow.rotation.x = -Math.PI / 2;
  coreGlow.position.y = 0.31;
  group.add(coreGlow);

  const swirls: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const r = radius * (0.6 + (i % 2) * 0.22);
    const swirl = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 6, 22), vortexRingMat);
    swirl.rotation.x = Math.PI / 2;
    swirl.position.y = 0.55 + (i / 5) * (height - 0.55);
    group.add(swirl);
    swirls.push(swirl);
  }

  const ribbons: THREE.Object3D[] = [];
  const ribbonSpinner = new THREE.Group();
  for (let s = 0; s < 3; s++) {
    const startAng = (s / 3) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 14; k++) {
      const t = k / 14;
      const a = startAng + t * Math.PI * 2.8;
      const rad = radius * (0.5 + t * 0.44);
      pts.push(new THREE.Vector3(Math.cos(a) * rad, 0.35 + t * height, Math.sin(a) * rad));
    }
    const ribbonMesh = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 22, 0.09, 6, false),
      ribbonMat
    );
    ribbonSpinner.add(ribbonMesh);
  }
  group.add(ribbonSpinner);
  ribbons.push(ribbonSpinner);

  return { group, swirls, ribbons };
}

export function createTempleWindUpdraftMesh(
  radius: number,
  height: number,
  textures: ProceduralTextures
): {
  group: THREE.Group;
  swirls: THREE.Mesh[];
  ribbons: THREE.Object3D[];
} {
  const group = new THREE.Group();
  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.templeCarvedStone,
    bumpMap: textures.templeCarvedBump,
    bumpScale: 0.18,
    roughness: 0.86,
  });
  const jadeMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });
  const swirlRingMat = new THREE.MeshBasicMaterial({
    color: 0xa7f3d0,
    transparent: true,
    opacity: 0.56,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ribbonMat = new THREE.MeshBasicMaterial({
    color: 0x4ade80,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.84, radius * 1.06, 0.3, 12), stoneMat);
  plinth.position.y = 0.15;
  group.add(plinth);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.75, 0.095, 8, 22), jadeMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.3;
  group.add(rim);

  for (let t = 0; t < 4; t++) {
    const a = (t / 4) * Math.PI * 2 + Math.PI * 0.25;
    const totem = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.58, 0.26), stoneMat);
    totem.position.set(Math.cos(a) * radius * 0.86, 0.38, Math.sin(a) * radius * 0.86);
    totem.rotation.y = -a;
    group.add(totem);
  }

  const coreGlow = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.68, 20),
    new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
  );
  coreGlow.rotation.x = -Math.PI / 2;
  coreGlow.position.y = 0.31;
  group.add(coreGlow);

  const swirls: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const r = radius * (0.62 + (i % 2) * 0.22);
    const swirl = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 6, 22), swirlRingMat);
    swirl.rotation.x = Math.PI / 2;
    swirl.position.y = 0.55 + (i / 5) * (height - 0.55);
    group.add(swirl);
    swirls.push(swirl);
  }

  const ribbons: THREE.Object3D[] = [];
  const ribbonSpinner = new THREE.Group();
  for (let s = 0; s < 3; s++) {
    const startAng = (s / 3) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 14; k++) {
      const t = k / 14;
      const a = startAng + t * Math.PI * 2.8;
      const rad = radius * (0.5 + t * 0.42);
      pts.push(new THREE.Vector3(Math.cos(a) * rad, 0.35 + t * height, Math.sin(a) * rad));
    }
    const ribbonMesh = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 22, 0.085, 6, false),
      ribbonMat
    );
    ribbonSpinner.add(ribbonMesh);
  }
  group.add(ribbonSpinner);
  ribbons.push(ribbonSpinner);

  return { group, swirls, ribbons };
}

export function createVolcanicThermalUpdraftMesh(
  radius: number,
  height: number,
  textures: ProceduralTextures
): {
  group: THREE.Group;
  swirls: THREE.Mesh[];
  ribbons: THREE.Object3D[];
} {
  const group = new THREE.Group();
  const basaltMat = new THREE.MeshStandardMaterial({
    map: textures.volcanicSide,
    emissiveMap: textures.volcanicSideEmissive,
    emissive: 0xff5a00,
    emissiveIntensity: 1.35,
    bumpMap: textures.basaltBump,
    bumpScale: 0.2,
    roughness: 0.85,
  });
  const magmaGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xf97316,
    emissiveIntensity: 2.1,
    roughness: 0.18,
  });
  const swirlRingMat = new THREE.MeshBasicMaterial({
    color: 0xfdba74,
    transparent: true,
    opacity: 0.62,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ribbonMat = new THREE.MeshBasicMaterial({
    color: 0xf97316,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const craterRim = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.86, radius * 1.12, 0.34, 8), basaltMat);
  craterRim.position.y = 0.17;
  group.add(craterRim);

  const glowingRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.76, 0.11, 8, 22), magmaGlowMat);
  glowingRing.rotation.x = Math.PI / 2;
  glowingRing.position.y = 0.33;
  group.add(glowingRing);

  for (let t = 0; t < 6; t++) {
    const a = (t / 6) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.68, 5), basaltMat);
    spike.position.set(Math.cos(a) * radius * 0.9, 0.42, Math.sin(a) * radius * 0.9);
    spike.rotation.z = -Math.cos(a) * 0.22;
    spike.rotation.x = Math.sin(a) * 0.22;
    group.add(spike);
  }

  const coreMagma = new THREE.Mesh(
    new THREE.CircleGeometry(radius * 0.7, 20),
    new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.82, side: THREE.DoubleSide })
  );
  coreMagma.rotation.x = -Math.PI / 2;
  coreMagma.position.y = 0.34;
  group.add(coreMagma);

  const swirls: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const r = radius * (0.58 + (i % 2) * 0.24);
    const swirl = new THREE.Mesh(new THREE.TorusGeometry(r, 0.055, 6, 22), swirlRingMat);
    swirl.rotation.x = Math.PI / 2;
    swirl.position.y = 0.55 + (i / 5) * (height - 0.55);
    group.add(swirl);
    swirls.push(swirl);
  }

  const ribbons: THREE.Object3D[] = [];
  const ribbonSpinner = new THREE.Group();
  for (let s = 0; s < 3; s++) {
    const startAng = (s / 3) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 14; k++) {
      const t = k / 14;
      const a = startAng + t * Math.PI * 2.8;
      const rad = radius * (0.48 + t * 0.46);
      pts.push(new THREE.Vector3(Math.cos(a) * rad, 0.35 + t * height, Math.sin(a) * rad));
    }
    const ribbonMesh = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 22, 0.09, 6, false),
      ribbonMat
    );
    ribbonSpinner.add(ribbonMesh);
  }
  group.add(ribbonSpinner);
  ribbons.push(ribbonSpinner);

  return { group, swirls, ribbons };
}

export function createNebulaGravityUpdraftMesh(
  radius: number,
  height: number,
  textures: ProceduralTextures
): {
  group: THREE.Group;
  swirls: THREE.Mesh[];
  ribbons: THREE.Object3D[];
} {
  const group = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({
    map: textures.nebulaSide,
    metalness: 0.86,
    roughness: 0.2,
  });
  const cyanGlowMat = new THREE.MeshStandardMaterial({
    color: 0x67e8f9,
    emissive: 0x06b6d4,
    emissiveIntensity: 2.0,
    roughness: 0.15,
  });
  const swirlMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.68,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ribbonMat = new THREE.MeshBasicMaterial({
    color: 0xc084fc,
    transparent: true,
    opacity: 0.48,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.9, radius * 1.15, 0.28, 12), hullMat);
  plinth.position.y = 0.14;
  group.add(plinth);

  const emitterRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.78, 0.09, 8, 28), cyanGlowMat);
  emitterRing.rotation.x = Math.PI / 2;
  emitterRing.position.y = 0.28;
  group.add(emitterRing);

  for (let p = 0; p < 6; p++) {
    const a = (p / 6) * Math.PI * 2;
    const pylon = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.65, 6), hullMat);
    pylon.position.set(Math.cos(a) * radius * 0.88, 0.44, Math.sin(a) * radius * 0.88);
    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.14, 0), cyanGlowMat);
    tip.position.set(Math.cos(a) * radius * 0.88, 0.86, Math.sin(a) * radius * 0.88);
    group.add(pylon, tip);
  }

  const coreBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.48, radius * 0.62, height, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  coreBeam.position.y = height * 0.5 + 0.2;
  group.add(coreBeam);

  const swirls: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const r = radius * (0.52 + (i % 2) * 0.26);
    const swirl = new THREE.Mesh(new THREE.TorusGeometry(r, 0.055, 6, 24), swirlMat);
    swirl.rotation.x = Math.PI / 2;
    swirl.position.y = 0.48 + (i / 6) * (height - 0.5);
    group.add(swirl);
    swirls.push(swirl);
  }

  const ribbons: THREE.Object3D[] = [];
  const spinner = new THREE.Group();
  for (let s = 0; s < 3; s++) {
    const startAng = (s / 3) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 14; k++) {
      const t = k / 14;
      const a = startAng + t * Math.PI * 3.0;
      const rad = radius * (0.45 + Math.sin(t * Math.PI) * 0.32);
      pts.push(new THREE.Vector3(Math.cos(a) * rad, 0.32 + t * height, Math.sin(a) * rad));
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 22, 0.075, 6, false), ribbonMat);
    spinner.add(tube);
  }
  group.add(spinner);
  ribbons.push(spinner);

  return { group, swirls, ribbons };
}

export function createParisWindUpdraftMesh(
  radius: number,
  height: number,
  textures: ProceduralTextures
): {
  group: THREE.Group;
  swirls: THREE.Mesh[];
  ribbons: THREE.Object3D[];
} {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshStandardMaterial({
    map: textures.parisStone,
    bumpMap: textures.stoneBump,
    bumpScale: 0.12,
    roughness: 0.8,
  });
  const giltMat = new THREE.MeshStandardMaterial({
    map: textures.goldTrim,
    color: 0xfbbf24,
    emissive: 0x92400e,
    emissiveIntensity: 0.45,
    metalness: 0.86,
    roughness: 0.22,
  });
  const ironMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.82,
    roughness: 0.28,
  });
  const swirlMat = new THREE.MeshBasicMaterial({
    color: 0xfde68a,
    transparent: true,
    opacity: 0.65,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ribbonMat = new THREE.MeshBasicMaterial({
    color: 0xfdba74,
    transparent: true,
    opacity: 0.46,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.88, radius * 1.12, 0.26, 12), stoneMat);
  plinth.position.y = 0.13;
  group.add(plinth);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.82, 0.08, 8, 28), giltMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.26;
  group.add(rim);

  for (let p = 0; p < 6; p++) {
    const a = (p / 6) * Math.PI * 2;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.08, 0.56, 6), ironMat);
    post.position.set(Math.cos(a) * radius * 0.88, 0.4, Math.sin(a) * radius * 0.88);
    const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), giltMat);
    finial.position.set(Math.cos(a) * radius * 0.88, 0.74, Math.sin(a) * radius * 0.88);
    group.add(post, finial);
  }

  const coreBeam = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.48, radius * 0.62, height, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfbbf24,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  coreBeam.position.y = height * 0.5 + 0.18;
  group.add(coreBeam);

  const swirls: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const r = radius * (0.52 + (i % 2) * 0.24);
    const swirl = new THREE.Mesh(new THREE.TorusGeometry(r, 0.052, 6, 24), swirlMat);
    swirl.rotation.x = Math.PI / 2;
    swirl.position.y = 0.48 + (i / 6) * (height - 0.5);
    group.add(swirl);
    swirls.push(swirl);
  }

  const ribbons: THREE.Object3D[] = [];
  const spinner = new THREE.Group();
  for (let s = 0; s < 3; s++) {
    const startAng = (s / 3) * Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let k = 0; k <= 14; k++) {
      const t = k / 14;
      const a = startAng + t * Math.PI * 3.0;
      const rad = radius * (0.45 + Math.sin(t * Math.PI) * 0.32);
      pts.push(new THREE.Vector3(Math.cos(a) * rad, 0.32 + t * height, Math.sin(a) * rad));
    }
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 22, 0.072, 6, false), ribbonMat);
    spinner.add(tube);
  }
  group.add(spinner);
  ribbons.push(spinner);

  return { group, swirls, ribbons };
}

export function createEnemyProjectileMesh(color = 0xf43f5e): THREE.Mesh {
  const geo = new THREE.SphereGeometry(0.28, 12, 10);
  const mat = new THREE.MeshBasicMaterial({
    color,
  });
  const mesh = new THREE.Mesh(geo, mat);
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.45 })
  );
  mesh.add(halo);
  return mesh;
}
