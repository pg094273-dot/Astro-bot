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
