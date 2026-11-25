import * as THREE from 'three';
import { BiomeKind } from './types';

export interface ShaderUniformRef {
  value: number;
}

/**
 * Injects natural GPU vertex wind sway into any MeshStandardMaterial / MeshPhysicalMaterial.
 * Works seamlessly with both regular Mesh and InstancedMesh.
 */
export function applyWindSwayShader(
  material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial,
  timeUniform: ShaderUniformRef,
  strength = 0.24,
  freq = 1.85
): void {
  const key = `wind-sway-${strength.toFixed(2)}-${freq.toFixed(2)}`;
  material.customProgramCacheKey = () => key;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = timeUniform;
    shader.uniforms.uWindStrength = { value: strength };
    shader.uniforms.uWindFreq = { value: freq };

    shader.vertexShader =
      `uniform float uWindTime;\nuniform float uWindStrength;\nuniform float uWindFreq;\n` +
      shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vec4 windWorldOrigin = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      #ifdef USE_INSTANCING
        windWorldOrigin = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
      #endif
      float windPhase = windWorldOrigin.x * 0.17 + windWorldOrigin.z * 0.23 + position.y * 0.45;
      float heightFactor = clamp(position.y * 0.45 + 0.35, 0.0, 1.8);
      float swayX = sin(uWindTime * uWindFreq + windPhase) * uWindStrength * heightFactor;
      float swayZ = cos(uWindTime * (uWindFreq * 0.82) + windPhase * 1.13) * uWindStrength * 0.72 * heightFactor;
      transformed.x += swayX;
      transformed.z += swayZ;
      `
    );
  };
  material.needsUpdate = true;
}

/**
 * Upgrades a MeshStandardMaterial sea/river/lake/ice surface with animated wave displacement,
 * Fresnel sky reflection shimmer, and dynamic specular highlights on GPU.
 */
export function applyWaterSurfaceShader(
  material: THREE.MeshStandardMaterial,
  timeUniform: ShaderUniformRef,
  options: {
    waveAmp: number;
    waveFreq: number;
    speed: number;
    fresnelColor: number;
    fresnelStrength: number;
    foamStrength?: number;
  }
): void {
  const fresnelCol = new THREE.Color(options.fresnelColor);
  const foamStrength = options.foamStrength ?? 0.25;
  const key = `water-surface-${options.waveAmp.toFixed(2)}-${options.fresnelStrength.toFixed(2)}`;
  material.customProgramCacheKey = () => key;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWaterTime = timeUniform;
    shader.uniforms.uWaveAmp = { value: options.waveAmp };
    shader.uniforms.uWaveFreq = { value: options.waveFreq };
    shader.uniforms.uWaveSpeed = { value: options.speed };
    shader.uniforms.uFresnelColor = { value: fresnelCol };
    shader.uniforms.uFresnelStrength = { value: options.fresnelStrength };
    shader.uniforms.uFoamStrength = { value: foamStrength };

    shader.vertexShader =
      `uniform float uWaterTime;\nuniform float uWaveAmp;\nuniform float uWaveFreq;\nuniform float uWaveSpeed;\nvarying float vWaveCrest;\nvarying vec3 vWaterWorldPos;\n` +
      shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      float w1 = sin(position.x * uWaveFreq + uWaterTime * uWaveSpeed);
      float w2 = cos(position.y * (uWaveFreq * 1.27) - uWaterTime * (uWaveSpeed * 0.85));
      float w3 = sin((position.x + position.y) * (uWaveFreq * 0.63) + uWaterTime * (uWaveSpeed * 1.35));
      float crest = (w1 + w2 * 0.7 + w3 * 0.5) / 2.2;
      transformed.z += crest * uWaveAmp;
      vWaveCrest = crest;
      vWaterWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `
    );

    shader.fragmentShader =
      `uniform vec3 uFresnelColor;\nuniform float uFresnelStrength;\nuniform float uFoamStrength;\nuniform float uWaterTime;\nvarying float vWaveCrest;\nvarying vec3 vWaterWorldPos;\n` +
      shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      vec3 wViewDir = normalize(cameraPosition - vWaterWorldPos);
      float wFresnel = pow(1.0 - max(dot(wViewDir, vec3(0.0, 1.0, 0.0)), 0.0), 3.0);
      float crestSparkle = smoothstep(0.48, 0.92, vWaveCrest) * uFoamStrength;
      gl_FragColor.rgb = mix(gl_FragColor.rgb, uFresnelColor, clamp(wFresnel * uFresnelStrength, 0.0, 0.72));
      gl_FragColor.rgb += uFresnelColor * crestSparkle;
      #include <dithering_fragment>
      `
    );
  };
  material.needsUpdate = true;
}

/**
 * Upgrades a desert sand sea MeshStandardMaterial with slow drifting barchan dune undulation,
 * wind-blown sand streaks across crests, and warm golden sunset specular sheen.
 */
export function applyShiftingSandShader(
  material: THREE.MeshStandardMaterial,
  timeUniform: ShaderUniformRef,
  options?: { duneAmp?: number; duneFreq?: number; speed?: number; glintColor?: number }
): void {
  const duneAmp = options?.duneAmp ?? 0.72;
  const duneFreq = options?.duneFreq ?? 0.055;
  const speed = options?.speed ?? 0.55;
  const glintCol = new THREE.Color(options?.glintColor ?? 0xfde68a);
  const key = `shifting-sand-${duneAmp.toFixed(2)}-${duneFreq.toFixed(3)}`;
  material.customProgramCacheKey = () => key;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSandTime = timeUniform;
    shader.uniforms.uDuneAmp = { value: duneAmp };
    shader.uniforms.uDuneFreq = { value: duneFreq };
    shader.uniforms.uSandSpeed = { value: speed };
    shader.uniforms.uGlintColor = { value: glintCol };

    shader.vertexShader =
      `uniform float uSandTime;\nuniform float uDuneAmp;\nuniform float uDuneFreq;\nuniform float uSandSpeed;\nvarying float vDuneCrest;\nvarying vec3 vSandWorldPos;\n` +
      shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vec3 sw = (modelMatrix * vec4(transformed, 1.0)).xyz;
      float d1 = sin(sw.x * uDuneFreq + sw.z * (uDuneFreq * 0.45) - uSandTime * uSandSpeed);
      float d2 = cos(sw.z * (uDuneFreq * 0.8) - sw.x * (uDuneFreq * 0.35) + uSandTime * (uSandSpeed * 0.7));
      float ripple = sin(sw.x * 0.42 + sw.z * 0.18 - uSandTime * 1.9) * 0.09;
      float crest = (d1 * 0.65 + d2 * 0.35);
      transformed.z += (crest * uDuneAmp) + ripple;
      vDuneCrest = crest;
      vSandWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `
    );

    shader.fragmentShader =
      `uniform float uSandTime;\nuniform vec3 uGlintColor;\nvarying float vDuneCrest;\nvarying vec3 vSandWorldPos;\n` +
      shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      float windBand = smoothstep(0.25, 0.9, vDuneCrest) *
        (0.5 + 0.5 * sin(vSandWorldPos.x * 0.24 - uSandTime * 2.2 + vSandWorldPos.z * 0.08));
      vec3 sViewDir = normalize(cameraPosition - vSandWorldPos);
      float sFresnel = pow(1.0 - max(dot(sViewDir, vec3(0.0, 1.0, 0.0)), 0.0), 3.4);
      gl_FragColor.rgb = mix(gl_FragColor.rgb, uGlintColor, clamp(windBand * 0.24 + sFresnel * 0.28, 0.0, 0.48));
      #include <dithering_fragment>
      `
    );
  };
  material.needsUpdate = true;
}

/**
 * Creates a volumetric animated Aurora Borealis curtain ShaderMaterial with organic
 * undulating sky waves, vertical ray shimmer, and emerald-turquoise-violet color shifting.
 */
export function createAuroraCurtainMaterial(
  texture: THREE.Texture,
  timeUniform: ShaderUniformRef,
  colorA = 0x34d399,
  colorB = 0x22d3ee,
  colorC = 0xa78bfa,
  phase = 0,
  opacity = 0.72
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: timeUniform,
      uTex: { value: texture },
      uColorA: { value: new THREE.Color(colorA) },
      uColorB: { value: new THREE.Color(colorB) },
      uColorC: { value: new THREE.Color(colorC) },
      uPhase: { value: phase },
      uOpacity: { value: opacity },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPhase;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        vUv = uv;
        vec3 p = position;
        float w = sin(uv.x * 9.0 + uTime * 0.42 + uPhase) * 3.6 +
                  cos(uv.x * 16.0 - uTime * 0.28 + uPhase * 1.4) * 1.8;
        p.z += w * (0.35 + uv.y * 0.65);
        p.y += sin(uv.x * 6.0 + uTime * 0.31 + uPhase) * 1.4 * uv.y;
        vWave = sin(uv.x * 13.0 - uTime * 0.65 + uPhase);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform sampler2D uTex;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorC;
      uniform float uPhase;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vWave;
      void main() {
        vec2 scrollUv = vec2(vUv.x * 1.6 + uTime * 0.018 + uPhase * 0.1, vUv.y);
        vec4 tex = texture2D(uTex, scrollUv);
        float edgeFade = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x);
        float vertFade = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.22, vUv.y);
        float pulse = 0.68 + 0.32 * sin(vUv.x * 11.0 + uTime * 0.9 + uPhase);
        vec3 baseCol = mix(uColorA, uColorB, clamp(vUv.y * 1.25 + vWave * 0.2, 0.0, 1.0));
        vec3 finalCol = mix(baseCol, uColorC, smoothstep(0.55, 0.96, vUv.y));
        float alpha = tex.a * edgeFade * vertFade * pulse * uOpacity;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(finalCol * (0.95 + tex.g * 0.65), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

/**
 * Adds animated Aurora Borealis teal/emerald Fresnel reflections and frost sparkle
 * glints onto glacial ice or frozen polar lake MeshStandardMaterial / MeshPhysicalMaterial.
 */
export function applyGlacialIceSheenShader(
  material: THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial,
  timeUniform: ShaderUniformRef,
  auroraStrength = 0.44
): void {
  const key = `glacial-aurora-sheen-${auroraStrength.toFixed(2)}`;
  material.customProgramCacheKey = () => key;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uIceTime = timeUniform;
    shader.uniforms.uAuroraStrength = { value: auroraStrength };

    shader.vertexShader =
      `varying vec3 vIceWorldPos;\nvarying vec3 vIceWorldNormal;\n` + shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vec4 iceWp = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        iceWp = instanceMatrix * iceWp;
      #endif
      vIceWorldPos = (modelMatrix * iceWp).xyz;
      mat3 iceNormMat = mat3(modelMatrix);
      #ifdef USE_INSTANCING
        iceNormMat = mat3(modelMatrix * instanceMatrix);
      #endif
      vIceWorldNormal = normalize(iceNormMat * objectNormal);
      `
    );

    shader.fragmentShader =
      `uniform float uIceTime;\nuniform float uAuroraStrength;\nvarying vec3 vIceWorldPos;\nvarying vec3 vIceWorldNormal;\n` +
      shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      vec3 iceView = normalize(cameraPosition - vIceWorldPos);
      float iceFresnel = pow(1.0 - max(dot(iceView, normalize(vIceWorldNormal)), 0.0), 2.5);
      float aurWave = 0.5 + 0.5 * sin(vIceWorldPos.x * 0.09 + vIceWorldPos.z * 0.07 + uIceTime * 0.85);
      vec3 aurCol = mix(vec3(0.16, 0.88, 0.68), vec3(0.22, 0.78, 0.98), aurWave);
      float glint = smoothstep(0.86, 0.99, sin(vIceWorldPos.x * 1.9 + uIceTime * 1.4) * cos(vIceWorldPos.z * 2.1 - uIceTime * 1.1));
      gl_FragColor.rgb += aurCol * (iceFresnel * uAuroraStrength * (0.55 + 0.45 * aurWave));
      gl_FragColor.rgb += vec3(0.75, 0.96, 1.0) * glint * 0.16;
      #include <dithering_fragment>
      `
    );
  };
  material.needsUpdate = true;
}

/**
 * Upgrades a volcanic lava river MeshStandardMaterial with slow churning magma convection swells,
 * incandescent white-gold thermal surges, and warm molten orange Fresnel rim illumination.
 */
export function applyMoltenLavaShader(
  material: THREE.MeshStandardMaterial,
  timeUniform: ShaderUniformRef,
  options?: { swellAmp?: number; swellFreq?: number; speed?: number }
): void {
  const swellAmp = options?.swellAmp ?? 0.34;
  const swellFreq = options?.swellFreq ?? 0.11;
  const speed = options?.speed ?? 1.45;
  const key = `molten-lava-${swellAmp.toFixed(2)}-${swellFreq.toFixed(3)}`;
  material.customProgramCacheKey = () => key;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uLavaTime = timeUniform;
    shader.uniforms.uSwellAmp = { value: swellAmp };
    shader.uniforms.uSwellFreq = { value: swellFreq };
    shader.uniforms.uLavaSpeed = { value: speed };

    shader.vertexShader =
      `uniform float uLavaTime;\nuniform float uSwellAmp;\nuniform float uSwellFreq;\nuniform float uLavaSpeed;\nvarying float vMagmaSurge;\nvarying vec3 vLavaWorldPos;\n` +
      shader.vertexShader;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vec3 lw = (modelMatrix * vec4(transformed, 1.0)).xyz;
      float s1 = sin(lw.x * uSwellFreq + lw.z * 0.05 + uLavaTime * uLavaSpeed);
      float s2 = cos(lw.z * (uSwellFreq * 1.15) - lw.x * 0.07 - uLavaTime * (uLavaSpeed * 0.78));
      float s3 = sin((lw.x - lw.z) * (uSwellFreq * 1.75) + uLavaTime * (uLavaSpeed * 1.3));
      float surge = (s1 * 0.5 + s2 * 0.35 + s3 * 0.25);
      transformed.z += surge * uSwellAmp;
      vMagmaSurge = surge;
      vLavaWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `
    );

    shader.fragmentShader =
      `uniform float uLavaTime;\nvarying float vMagmaSurge;\nvarying vec3 vLavaWorldPos;\n` +
      shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      vec3 lView = normalize(cameraPosition - vLavaWorldPos);
      float lFresnel = pow(1.0 - max(dot(lView, vec3(0.0, 1.0, 0.0)), 0.0), 2.6);
      float hotVein = smoothstep(0.22, 0.85, vMagmaSurge) * (0.65 + 0.35 * sin(vLavaWorldPos.x * 0.22 + uLavaTime * 2.1));
      gl_FragColor.rgb += vec3(1.0, 0.62, 0.12) * hotVein * 0.38;
      gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.42, 0.08), clamp(lFresnel * 0.42, 0.0, 0.48));
      #include <dithering_fragment>
      `
    );
  };
  material.needsUpdate = true;
}

/**
 * Animates translucent heat-wave shimmer ribbons rising over glowing volcanic fissures & vents.
 */
export function createHeatWaveShaderMaterial(
  timeUniform: ShaderUniformRef,
  color = 0xfb923c,
  opacity = 0.28,
  phase = 0
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: timeUniform,
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uPhase: { value: phase },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPhase;
      varying vec2 vUv;
      varying float vRipple;
      void main() {
        vUv = uv;
        vec3 p = position;
        float w = sin(uv.y * 8.0 - uTime * 3.8 + uPhase) * 0.28 * uv.y;
        p.x += w;
        p.z += cos(uv.y * 6.5 - uTime * 3.1 + uPhase * 1.4) * 0.2 * uv.y;
        vRipple = 0.5 + 0.5 * sin(uv.y * 12.0 - uTime * 5.2 + uv.x * 4.0 + uPhase);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      varying float vRipple;
      void main() {
        float hFade = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
        float vFade = smoothstep(0.0, 0.16, vUv.y) * smoothstep(1.0, 0.12, vUv.y);
        float band = 0.45 + 0.55 * vRipple;
        float alpha = hFade * vFade * band * uOpacity;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uColor * (0.9 + 0.4 * vRipple), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

export interface AmbientMoteSystem {
  points: THREE.Points;
  update: (time: number, focusPos: THREE.Vector3) => void;
  dispose: () => void;
}

/**
 * Lightweight GPU ambient particle field (fireflies/spores, desert dust, snow flurries,
 * volcanic embers, nebula stardust, Paris blossom breeze) following the player camera region.
 */
export function createBiomeAmbientParticles(biome: BiomeKind, count = 160): AmbientMoteSystem {
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const spanX = 56;
  const spanY = 22;
  const spanZ = 56;

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * spanX;
    positions[i * 3 + 1] = Math.random() * spanY - 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spanZ;
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const palette: Record<BiomeKind, { color: number; size: number; speedY: number; drift: number; opacity: number }> = {
    jungle: { color: 0xbef264, size: 0.28, speedY: 0.35, drift: 0.9, opacity: 0.72 },
    temple: { color: 0xfef08a, size: 0.26, speedY: 0.28, drift: 0.8, opacity: 0.7 },
    desert: { color: 0xfde68a, size: 0.24, speedY: 0.12, drift: 2.4, opacity: 0.52 },
    ice: { color: 0xf0f9ff, size: 0.3, speedY: -1.4, drift: 1.2, opacity: 0.8 },
    volcanic: { color: 0xfb923c, size: 0.32, speedY: 1.85, drift: 1.1, opacity: 0.88 },
    nebula: { color: 0x67e8f9, size: 0.3, speedY: 0.42, drift: 0.65, opacity: 0.84 },
    paris: { color: 0xfbcfe8, size: 0.26, speedY: -0.55, drift: 1.75, opacity: 0.72 },
    rapids: { color: 0xe0f2fe, size: 0.26, speedY: 0.5, drift: 1.4, opacity: 0.65 },
  };

  const cfg = palette[biome];
  const timeUniform = { value: 0 };
  const centerUniform = { value: new THREE.Vector3() };

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: timeUniform,
      uCenter: centerUniform,
      uColor: { value: new THREE.Color(cfg.color) },
      uSize: { value: cfg.size * 85 },
      uSpeedY: { value: cfg.speedY },
      uDrift: { value: cfg.drift },
      uOpacity: { value: cfg.opacity },
    },
    vertexShader: `
      attribute float aPhase;
      uniform float uTime;
      uniform vec3 uCenter;
      uniform float uSize;
      uniform float uSpeedY;
      uniform float uDrift;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        p.x = mod(p.x + uTime * uDrift * 0.5 + 28.0, 56.0) - 28.0 + sin(uTime * 0.9 + aPhase) * 1.1;
        p.y = mod(p.y + uTime * uSpeedY + 4.0, 22.0) - 4.0;
        p.z = mod(p.z + cos(uTime * 0.7 + aPhase * 1.3) * 1.1 + 28.0, 56.0) - 28.0;
        vec3 worldPos = vec3(uCenter.x + p.x, max(-9.0, uCenter.y + p.y), uCenter.z + p.z);
        vec4 mvPosition = modelViewMatrix * vec4(worldPos, 1.0);
        gl_PointSize = clamp(uSize / max(1.0, -mvPosition.z), 2.0, 14.0);
        vAlpha = 0.45 + 0.55 * sin(uTime * 2.2 + aPhase);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float soft = smoothstep(0.5, 0.08, d);
        gl_FragColor = vec4(uColor, soft * uOpacity * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;

  return {
    points,
    update: (time: number, focusPos: THREE.Vector3) => {
      timeUniform.value = time;
      centerUniform.value.copy(focusPos);
    },
    dispose: () => {
      geo.dispose();
      mat.dispose();
    },
  };
}

/**
 * Animates the deep cosmic void / nebula ocean beneath Ciudadela Nebulosa with drifting
 * multi-color aurora starlight waves and turquoise/violet Fresnel luminosity.
 */
export function applyNebulaVoidShader(
  material: THREE.MeshStandardMaterial,
  timeUniform: ShaderUniformRef
): void {
  material.customProgramCacheKey = () => 'nebula-void-v1';
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uNebTime = timeUniform;
    shader.vertexShader = `varying vec3 vNebWorldPos;\n` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vNebWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `
    );

    shader.fragmentShader =
      `uniform float uNebTime;\nvarying vec3 vNebWorldPos;\n` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
      float swirl = 0.5 + 0.5 * sin(vNebWorldPos.x * 0.045 + uNebTime * 0.32 + cos(vNebWorldPos.z * 0.04 - uNebTime * 0.25));
      float band = smoothstep(0.38, 0.94, swirl);
      vec3 aurCol = mix(vec3(0.32, 0.16, 0.72), vec3(0.12, 0.82, 0.96), 0.5 + 0.5 * sin(vNebWorldPos.z * 0.03 + uNebTime * 0.22));
      float twinkle = smoothstep(0.92, 0.998, sin(vNebWorldPos.x * 1.45 + uNebTime * 1.1) * cos(vNebWorldPos.z * 1.35 - uNebTime * 0.9));
      gl_FragColor.rgb += aurCol * band * 0.28;
      gl_FragColor.rgb += vec3(0.62, 0.96, 1.0) * twinkle * 0.32;
      #include <dithering_fragment>
      `
    );
  };
  material.needsUpdate = true;
}

/**
 * Holographic translucent scanline + Fresnel energy shader for futuristic sky-citadel rings,
 * energy conduits, and astral monolith halos in Ciudadela Nebulosa.
 */
export function createHologramShaderMaterial(
  timeUniform: ShaderUniformRef,
  color = 0x38bdf8,
  opacity = 0.54,
  phase = 0
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: timeUniform,
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
      uPhase: { value: phase },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vUv = uv;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPosition.xyz;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uPhase;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec3 n = normalize(vNormal);
        vec3 v = normalize(vViewPos);
        float rim = pow(1.0 - abs(dot(n, v)), 1.6);
        float scan = 0.65 + 0.35 * sin(vUv.y * 44.0 - uTime * 4.5 + uPhase);
        float pulse = 0.78 + 0.22 * sin(uTime * 2.2 + uPhase);
        float alpha = clamp((0.32 + rim * 0.75) * scan * pulse * uOpacity, 0.0, 0.95);
        gl_FragColor = vec4(uColor * (0.9 + rim * 0.7), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

