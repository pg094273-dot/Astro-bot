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

export function buildStyledPlatformMesh(
  def: PlatformDef,
  textures: ProceduralTextures,
  createBaseMaterial: (def: PlatformDef) => THREE.Material | THREE.Material[],
  isSoftwareGl: boolean
): THREE.Mesh {
  const [w, h, d] = def.size;
  const baseMat = createBaseMaterial(def);
  const style = def.style ?? 'tech';

  // Use a sculpted composite Mesh as the primary entity (Engine still reads mesh.position & mesh.material cleanly)
  const useDisc = def.kind === 'rotating' || def.shape === 'disc' || def.shape === 'pillar';
  const mainGeo = useDisc
    ? new THREE.CylinderGeometry(
        Math.max(w, d) * 0.5,
        Math.max(w, d) * (def.shape === 'pillar' ? 0.48 : 0.45),
        h,
        def.shape === 'pillar' ? 14 : 24
      )
    : createRoundedSlabGeometry(w, h, d, Math.min(0.26, Math.min(w, d) * 0.09));

  // If baseMat is a 6-face BoxGeometry material array, adapt gracefully to Extrude/Cylinder (single or dual material)
  const resolvedMat = Array.isArray(baseMat)
    ? new THREE.MeshStandardMaterial({
        map: (baseMat[2] as THREE.MeshStandardMaterial)?.map ?? null,
        bumpMap: (baseMat[2] as THREE.MeshStandardMaterial)?.bumpMap ?? null,
        bumpScale: (baseMat[2] as THREE.MeshStandardMaterial)?.bumpScale ?? 0.08,
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

  // Tapered organic rocky/architectural under-skirt & carved silhouettes
  if ((w >= 2.6 && d >= 2.6) && def.kind !== 'glass' && def.kind !== 'disappearing') {
    const skirtMat = Array.isArray(baseMat)
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
                        : textures.climbStone,
          roughness: 0.88,
          metalness: style === 'nebula' || style === 'tech' ? 0.35 : 0.08,
        });

    if (useDisc) {
      const r = Math.max(w, d) * 0.44;
      if (def.shape === 'pillar') {
        const colH = def.kind === 'crumble' ? 3.4 : 11.5;
        const shaft = new THREE.Mesh(
          new THREE.CylinderGeometry(r * 0.82, r * (def.kind === 'crumble' ? 0.46 : 0.94), colH, 12),
          skirtMat
        );
        shaft.position.y = -h * 0.45 - colH * 0.5;
        mesh.add(shaft);

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
        const underCone = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.94, r * 0.42, h * 1.4, 16), skirtMat);
        underCone.position.y = -h * 0.9;
        mesh.add(underCone);
      }

      // Rotating Maya gear teeth & directional ring on rotating discs
      if (def.kind === 'rotating') {
        const ringMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 0.75,
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
    } else if (def.shape === 'ruin') {
      // Stepped Mesoamerican plinth + carved stone corner bollards
      const plinth = new THREE.Mesh(
        createRoundedSlabGeometry(w + 0.45, h * 0.55, d + 0.45, 0.18),
        skirtMat
      );
      plinth.position.y = -h * 0.35;
      mesh.add(plinth);

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
    } else if (
      def.shape === 'organic' ||
      style === 'jungle' ||
      style === 'desert' ||
      style === 'ice' ||
      style === 'volcanic' ||
      style === 'temple'
    ) {
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

  // Tech / Gold / Nebula / Conveyor / Disappearing / Elevator architectural rim trims
  if (def.kind === 'conveyor') {
    const dir = def.conveyorDir ?? [0, 3];
    const angle = Math.atan2(dir[0], dir[1]);
    const chevronMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.6,
      roughness: 0.25,
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
  } else if (def.kind === 'disappearing') {
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x67e8f9,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.9,
      roughness: 0.2,
    });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, 0.12, d + 0.14), frameMat);
    frame.position.y = h * 0.44;
    mesh.add(frame);
  } else if (def.kind === 'elevator') {
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
  } else if (style === 'gold' || style === 'nebula' || style === 'tech') {
    const trimColor = style === 'gold' ? 0xfbbf24 : style === 'nebula' ? 0x22d3ee : 0x38bdf8;
    const trimMat = new THREE.MeshStandardMaterial({
      color: trimColor,
      emissive: trimColor,
      emissiveIntensity: 0.55,
      metalness: 0.8,
      roughness: 0.25,
    });
    const rim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.09, d + 0.06), trimMat);
    rim.position.y = h * 0.41;
    mesh.add(rim);
  }

  // Linked hidden bridges start subtle holographic outline until switch/target activates them
  if (def.linkedTargetId || def.linkedSwitchId) {
    const wire = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.98, h * 0.96, d * 0.98),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true, transparent: true, opacity: 0.35 })
    );
    mesh.add(wire);
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
