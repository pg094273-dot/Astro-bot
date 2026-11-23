import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { soundEngine } from './audio';
import { LEVELS } from './levels';
import {
  AstroBotRig,
  BossRig,
  createArcheryTargetMesh,
  createArrowMesh,
  createAstroBot,
  createBoostRingMesh,
  createBossMesh,
  createBowPickupMesh,
  createCheckpointMesh,
  createClimbWallMesh,
  createCoinMesh,
  createCrateMesh,
  createEnemyMesh,
  createGoalPortalMesh,
  createJumpPadMesh,
  createMineMesh,
  createMiniBotMesh,
  createMonkeySuitPickupMesh,
  createRocketPadMesh,
  createRocketVehicle,
  RocketVehicleRig,
} from './models';
import {
  createProceduralTextures,
  disposeProceduralTextures,
  ProceduralTextures,
} from './textures';
import {
  CameraZone2DDef,
  ClimbWallDef,
  EnemyKind,
  GamePhase,
  HudSnapshot,
  LevelDef,
  PlatformDef,
} from './types';

// Pre-allocated math helpers for zero-GC per-frame updates
const _vec3A = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _vec3C = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _color = new THREE.Color();

interface PlatformRuntime {
  def: PlatformDef;
  mesh: THREE.Mesh;
  basePos: THREE.Vector3;
  pos: THREE.Vector3;
  prevPos: THREE.Vector3;
  halfSize: THREE.Vector3;
  crumbleState: 'idle' | 'shaking' | 'fallen';
  crumbleTimer: number;
  visible: boolean;
}

interface CoinRuntime {
  mesh: THREE.Group;
  baseY: number;
  pos: THREE.Vector3;
  collected: boolean;
  phase: number;
}

interface CrateRuntime {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  coins: number;
  broken: boolean;
}

interface MiniBotRuntime {
  id: string;
  name: string;
  group: THREE.Group;
  beacon: THREE.Mesh;
  visorGlow: THREE.MeshStandardMaterial;
  homePos: THREE.Vector3;
  pos: THREE.Vector3;
  rescued: boolean;
  orbitIndex: number;
}

interface EnemyRuntime {
  kind: EnemyKind;
  group: THREE.Group;
  body: THREE.Mesh;
  eyeMat: THREE.MeshStandardMaterial;
  jawUpper?: THREE.Mesh;
  windupKey?: THREE.Group;
  springGroup?: THREE.Group;
  basePos: THREE.Vector3;
  pos: THREE.Vector3;
  patrolOffset: THREE.Vector3;
  speed: number;
  phase: number;
  hp: number;
  hitFlash: number;
  alive: boolean;
  hopPhase: number;
}

interface ClimbWallRuntime {
  def: ClimbWallDef;
  group: THREE.Group;
  pos: THREE.Vector3;
  halfSize: THREE.Vector3;
}

interface BossRuntime {
  rig: BossRig;
  name: string;
  pos: THREE.Vector3;
  arenaCenter: THREE.Vector3;
  arenaRadius: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  active: boolean;
  invulnTimer: number;
  state: 'idle' | 'chase' | 'windup' | 'shockwave' | 'charge' | 'recover';
  stateTimer: number;
  shockwaveRadius: number;
  chargeDir: THREE.Vector3;
}

interface LaserRuntime {
  group: THREE.Group;
  beamMesh: THREE.Mesh;
  beamMat: THREE.MeshBasicMaterial;
  telegraphMat: THREE.MeshBasicMaterial;
  pos: THREE.Vector3;
  length: number;
  axis: 'x' | 'z';
  period: number;
  phase: number;
  active: boolean;
}

interface CheckpointRuntime {
  group: THREE.Group;
  flagMat: THREE.MeshStandardMaterial;
  pos: THREE.Vector3;
  activated: boolean;
}

interface ArcheryTargetRuntime {
  id: string;
  group: THREE.Group;
  ringMat: THREE.MeshStandardMaterial;
  pos: THREE.Vector3;
  coins: number;
  hit: boolean;
}

interface ArrowRuntime {
  mesh: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
}

interface BoostRingRuntime {
  group: THREE.Group;
  pos: THREE.Vector3;
  passed: boolean;
}

interface MineRuntime {
  group: THREE.Group;
  pos: THREE.Vector3;
  baseY: number;
  phase: number;
  exploded: boolean;
}

interface Particle {
  active: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  color: THREE.Color;
}

export class GameEngine {
  private container: HTMLElement;
  private onHudUpdate: (hud: HudSnapshot) => void;
  private onLevelComplete: (stats: {
    levelIndex: number;
    coins: number;
    totalCoins: number;
    bots: number;
    totalBots: number;
    time: number;
  }) => void;
  private onContextLostChange?: (lost: boolean) => void;

  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private textures: ProceduralTextures;
  private envRT: THREE.WebGLRenderTarget;
  private isSoftwareGl: boolean;

  private keyLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rimLight: THREE.DirectionalLight;
  private skyMesh: THREE.Mesh;
  private hazardSeaMesh: THREE.Mesh | null = null;
  private hazardSeaTex: THREE.CanvasTexture | null = null;

  private levelGroup = new THREE.Group();
  private playerRig: AstroBotRig;
  private contactShadowMesh: THREE.Mesh;

  // Pooled particle system
  private readonly MAX_PARTICLES = 180;
  private particles: Particle[] = [];
  private particleMesh: THREE.InstancedMesh;

  // Level runtime entities
  private currentLevel: LevelDef = LEVELS[0];
  private platforms: PlatformRuntime[] = [];
  private climbWalls: ClimbWallRuntime[] = [];
  private jumpPads: { pos: THREE.Vector3; boost: number; group: THREE.Group; bounceAnim: number }[] = [];
  private crates: CrateRuntime[] = [];
  private coins: CoinRuntime[] = [];
  private miniBots: MiniBotRuntime[] = [];
  private enemies: EnemyRuntime[] = [];
  private lasers: LaserRuntime[] = [];
  private checkpoints: CheckpointRuntime[] = [];
  private targets: ArcheryTargetRuntime[] = [];
  private arrows: ArrowRuntime[] = [];
  private bowPickup: { group: THREE.Group; bow: THREE.Group; pos: THREE.Vector3; collected: boolean } | null = null;
  private monkeyPickup: { group: THREE.Group; suit: THREE.Group; pos: THREE.Vector3; collected: boolean } | null = null;
  private bossRuntime: BossRuntime | null = null;
  private goalPortal: {
    group: THREE.Group;
    ringInner: THREE.Mesh;
    vortex: THREE.Mesh;
    portalMat: THREE.MeshStandardMaterial;
    pos: THREE.Vector3;
    locked: boolean;
  } | null = null;

  // Rocket section entities
  private rocketRig: RocketVehicleRig | null = null;
  private rocketState: 'parked' | 'flying' | 'landed' = 'parked';
  private rocketPos = new THREE.Vector3();
  private rocketVelX = 0;
  private rocketVelY = 0;
  private rocketBoostTimer = 0;
  private boostRings: BoostRingRuntime[] = [];
  private mines: MineRuntime[] = [];
  private rocketLaunchpadPos = new THREE.Vector3();
  private rocketLandingPos = new THREE.Vector3();
  private rocketCruiseSpeed = 9.2;

  // 2D/3D Camera Zone state
  private active2DZone: CameraZone2DDef | null = null;
  private perspectiveMode: '3D' | '2D' | 'COHETE' = '3D';

  // Player state
  private playerPos = new THREE.Vector3(0, 1.5, 0);
  private playerVel = new THREE.Vector3(0, 0, 0);
  private playerYaw = Math.PI;
  private playerSquash = new THREE.Vector3(1, 1, 1);
  private grounded = false;
  private standingPlatform: PlatformRuntime | null = null;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private hoverFuel = 1;
  private isHovering = false;
  private spinTimer = 0;
  private spinCooldown = 0;
  private hasBow = false;
  private bowCooldown = 0;
  private hasMonkeySuit = false;
  private isClimbing = false;
  private climbingWall: ClimbWallRuntime | null = null;
  private invulnTimer = 0;
  private health = 3;
  private readonly maxHealth = 3;
  private spawnPos = new THREE.Vector3(0, 1.5, 0);
  private checkpointActive = false;

  // Game flow & HUD stats
  private phase: GamePhase = 'title';
  private levelTime = 0;
  private totalTime = 0;
  private coinsCollected = 0;
  private totalLevelCoins = 0;
  private botsRescued = 0;
  private hitstopTimer = 0;
  private shakeIntensity = 0;
  private bannerText: string | null = null;
  private bannerTimer = 0;
  private lastHudPush = 0;

  // Camera & pointer state
  private camYaw = 0;
  private camPitch = 0.42;
  private camCurrentPos = new THREE.Vector3(0, 6, 10);
  private camLookTarget = new THREE.Vector3(0, 2, 0);
  private draggingCam = false;
  private pointerDownX = 0;
  private pointerDownY = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;

  // Input state
  private keysHeld = new Set<string>();
  private touchMoveX = 0;
  private touchMoveZ = 0;
  private touchJumpHeld = false;

  // Loop state
  private frameId = 0;
  private lastTimestamp = 0;
  private disposed = false;

  constructor(
    container: HTMLElement,
    callbacks: {
      onHudUpdate: (hud: HudSnapshot) => void;
      onLevelComplete: (stats: {
        levelIndex: number;
        coins: number;
        totalCoins: number;
        bots: number;
        totalBots: number;
        time: number;
      }) => void;
      onContextLostChange?: (lost: boolean) => void;
    }
  ) {
    this.container = container;
    this.onHudUpdate = callbacks.onHudUpdate;
    this.onLevelComplete = callbacks.onLevelComplete;
    this.onContextLostChange = callbacks.onContextLostChange;

    this.isSoftwareGl = (() => {
      const probe = document.createElement('canvas').getContext('webgl2');
      if (!probe) return true;
      const ext = probe.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
      const gpu = String(probe.getParameter(param));
      probe.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);

    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const aspect = (container.clientWidth || window.innerWidth) / Math.max(1, container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(56, aspect, 0.1, 600);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    pmrem.dispose();

    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createProceduralTextures(maxAniso);

    this.hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e293b, 1.0);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff7ed, 2.2);
    this.keyLight.position.set(16, 28, 18);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 95;
    const d = 24;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.02;
    this.scene.add(this.keyLight);
    this.scene.add(this.keyLight.target);

    this.rimLight = new THREE.DirectionalLight(0x60a5fa, 0.8);
    this.rimLight.position.set(-14, 10, -24);
    this.scene.add(this.rimLight);

    this.skyMesh = new THREE.Mesh(
      new THREE.SphereGeometry(380, 28, 18),
      new THREE.MeshBasicMaterial({ map: this.textures.skyJungle, side: THREE.BackSide, depthWrite: false, fog: false })
    );
    this.scene.add(this.skyMesh);

    this.scene.add(this.levelGroup);
    this.playerRig = createAstroBot();
    this.scene.add(this.playerRig.root);

    this.contactShadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.18, 1.18),
      new THREE.MeshBasicMaterial({
        map: this.textures.contactShadow,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    this.contactShadowMesh.rotation.x = -Math.PI / 2;
    this.scene.add(this.contactShadowMesh);

    const pGeo = new THREE.SphereGeometry(0.18, 6, 6);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.particleMesh = new THREE.InstancedMesh(pGeo, pMat, this.MAX_PARTICLES);
    this.particleMesh.frustumCulled = false;
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      this.particles.push({
        active: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.5,
        size: 1,
        color: new THREE.Color(0xffffff),
      });
      _mat4.makeScale(0, 0, 0);
      this.particleMesh.setMatrixAt(i, _mat4);
      this.particleMesh.setColorAt(i, _color.setHex(0xffffff));
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
    if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true;
    this.scene.add(this.particleMesh);

    this.loadLevel(0, 'title');

    this.bindEvents();
    this.lastTimestamp = performance.now();
    this.scheduleNextTick();
  }

  private bindEvents() {
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    dom.addEventListener('contextmenu', this.preventContext);
    dom.addEventListener('webglcontextlost', this.handleContextLost);
    dom.addEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private unbindEvents() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);

    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    dom.removeEventListener('contextmenu', this.preventContext);
    dom.removeEventListener('webglcontextlost', this.handleContextLost);
    dom.removeEventListener('webglcontextrestored', this.handleContextRestored);
  }

  private preventContext = (e: Event) => e.preventDefault();
  private handleContextLost = (e: Event) => {
    e.preventDefault();
    this.onContextLostChange?.(true);
  };
  private handleContextRestored = () => {
    this.onContextLostChange?.(false);
  };

  private handleResize = () => {
    if (this.disposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = Math.max(1, this.container.clientHeight || window.innerHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  };

  private handleBlur = () => {
    this.keysHeld.clear();
    this.touchMoveX = 0;
    this.touchMoveZ = 0;
    this.touchJumpHeld = false;
    soundEngine.stopHover();
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    soundEngine.unlock();
    const code = e.code;
    if (
      code === 'Space' ||
      code === 'ArrowUp' ||
      code === 'ArrowDown' ||
      code === 'ArrowLeft' ||
      code === 'ArrowRight'
    ) {
      e.preventDefault();
    }

    if (this.phase === 'playing') {
      if (!this.keysHeld.has(code)) {
        if (code === 'Space') {
          if (this.rocketState === 'flying') {
            this.rocketBoostTimer = 0.55;
            soundEngine.playRocketBoost();
          } else {
            this.jumpBufferTimer = 0.14;
          }
        }
        if (code === 'KeyF' || code === 'ShiftLeft' || code === 'ShiftRight' || code === 'KeyJ') {
          this.triggerSpin();
        }
        if (code === 'KeyG' || code === 'KeyR' || code === 'KeyC') {
          this.shootArrow();
        }
      }
      if (code === 'Escape' || code === 'KeyP') {
        this.setPhase('paused');
      }
    } else if (this.phase === 'paused' && (code === 'Escape' || code === 'KeyP')) {
      this.setPhase('playing');
    }

    this.keysHeld.add(code);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.code);
  };

  private handlePointerDown = (e: PointerEvent) => {
    soundEngine.unlock();
    if (this.phase !== 'playing') return;
    if (e.button === 0) {
      this.draggingCam = true;
      this.pointerDownX = e.clientX;
      this.pointerDownY = e.clientY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
    } else if (e.button === 2) {
      this.triggerSpin();
    }
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.draggingCam || this.phase !== 'playing' || this.perspectiveMode !== '3D') return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.camYaw -= dx * 0.0055;
    this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * 0.0038, 0.16, 0.95);
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (this.draggingCam && this.phase === 'playing' && e.button === 0) {
      const moved = Math.hypot(e.clientX - this.pointerDownX, e.clientY - this.pointerDownY);
      if (moved < 6 && this.hasBow && this.rocketState !== 'flying') {
        this.shootArrow();
      }
    }
    this.draggingCam = false;
  };

  public unlockAudio() {
    soundEngine.unlock();
  }

  public startLevel(levelIndex: number) {
    soundEngine.unlock();
    this.loadLevel(levelIndex, 'playing');
  }

  public setPhase(phase: GamePhase) {
    this.phase = phase;
    if (phase !== 'playing') {
      soundEngine.stopHover();
      this.keysHeld.clear();
    }
    const isBossActive = Boolean(this.bossRuntime?.alive && this.bossRuntime.active);
    soundEngine.setMusicContext(
      this.currentLevel.theme.biome,
      this.perspectiveMode === 'COHETE',
      this.phase,
      isBossActive
    );
    this.pushHud(true);
  }

  public restartLevel() {
    this.loadLevel(this.currentLevel.index, 'playing');
  }

  public returnToTitle() {
    this.loadLevel(this.currentLevel.index, 'title');
  }

  public setTouchMove(x: number, z: number) {
    this.touchMoveX = x;
    this.touchMoveZ = z;
  }

  public setTouchJump(held: boolean, justPressed: boolean) {
    this.touchJumpHeld = held;
    if (justPressed) {
      if (this.rocketState === 'flying') {
        this.rocketBoostTimer = 0.55;
        soundEngine.playRocketBoost();
      } else {
        this.jumpBufferTimer = 0.14;
      }
    }
  }

  public triggerSpin() {
    if (this.phase !== 'playing' || this.rocketState === 'flying') return;
    if (this.spinCooldown <= 0 && this.spinTimer <= 0) {
      this.spinTimer = 0.34;
      this.spinCooldown = 0.45;
      soundEngine.playSpin();
      this.spawnBurst(this.playerPos.x, this.playerPos.y + 0.65, this.playerPos.z, 0x38bdf8, 14, 4.5);
    }
  }

  public shootArrow() {
    if (this.phase !== 'playing' || !this.hasBow || this.rocketState === 'flying' || this.bowCooldown > 0) return;
    this.bowCooldown = 0.28;
    soundEngine.playBowShoot();

    const origin = new THREE.Vector3(this.playerPos.x, this.playerPos.y + 0.9, this.playerPos.z);
    // Default forward direction from playerYaw
    const fwdX = Math.sin(this.playerYaw);
    const fwdZ = Math.cos(this.playerYaw);
    const dir = new THREE.Vector3(fwdX, 0, fwdZ).normalize();

    // Gentle auto-aim assist toward nearby targets, enemies, or crates within a forward cone
    let bestScore = -1;
    let bestTargetPos: THREE.Vector3 | null = null;
    const consider = (pos: THREE.Vector3, yOff: number) => {
      _vec3C.set(pos.x - origin.x, pos.y + yOff - origin.y, pos.z - origin.z);
      const dist = _vec3C.length();
      if (dist < 0.8 || dist > 26) return;
      _vec3C.divideScalar(dist);
      const dot = _vec3C.x * dir.x + _vec3C.z * dir.z;
      if (dot > 0.62) {
        const score = dot * 10 - dist * 0.15;
        if (score > bestScore) {
          bestScore = score;
          bestTargetPos = new THREE.Vector3(pos.x, pos.y + yOff, pos.z);
        }
      }
    };

    for (const tg of this.targets) {
      if (!tg.hit) consider(tg.pos, 1.5);
    }
    for (const en of this.enemies) {
      if (en.alive) consider(en.pos, 0.5);
    }
    for (const cr of this.crates) {
      if (!cr.broken) consider(cr.pos, 0.5);
    }
    if (this.bossRuntime && this.bossRuntime.alive) {
      consider(this.bossRuntime.pos, 2.0);
    }

    if (bestTargetPos) {
      dir.copy(bestTargetPos).sub(origin).normalize();
      this.playerYaw = Math.atan2(dir.x, dir.z);
    }

    const mesh = createArrowMesh();
    mesh.position.copy(origin);
    mesh.lookAt(origin.x + dir.x, origin.y + dir.y, origin.z + dir.z);
    this.levelGroup.add(mesh);

    this.arrows.push({
      mesh,
      pos: origin,
      vel: dir.multiplyScalar(28),
      life: 1.4,
    });
    this.spawnBurst(origin.x + dir.x * 0.5, origin.y, origin.z + dir.z * 0.5, 0x38bdf8, 6, 2.5);
  }

  public setMuted(muted: boolean) {
    soundEngine.setMuted(muted);
    this.pushHud(true);
  }

  public setMusicMuted(musicMuted: boolean) {
    soundEngine.setMusicMuted(musicMuted);
    this.pushHud(true);
  }

  private clearLevelGroup() {
    soundEngine.stopHover();
    const disposeObject = (obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      const mat = (obj as THREE.Mesh).material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    };
    this.levelGroup.traverse(disposeObject);
    while (this.levelGroup.children.length > 0) {
      this.levelGroup.remove(this.levelGroup.children[0]);
    }
    this.platforms = [];
    this.climbWalls = [];
    this.jumpPads = [];
    this.crates = [];
    this.coins = [];
    this.miniBots = [];
    this.enemies = [];
    this.lasers = [];
    this.checkpoints = [];
    this.targets = [];
    this.arrows = [];
    this.bowPickup = null;
    this.monkeyPickup = null;
    this.bossRuntime = null;
    this.boostRings = [];
    this.mines = [];
    this.goalPortal = null;
    this.hazardSeaMesh = null;
    this.hazardSeaTex = null;
    this.rocketRig = null;
  }

  private addHorizonMountainRing(
    centerX: number,
    centerZ: number,
    baseY: number,
    innerRadius: number,
    outerRadius: number,
    peakHeight: number,
    lowColorHex: number,
    highColorHex: number,
    seed: number,
    roughness = 0.88
  ) {
    const radialSegs = 4;
    const angularSegs = 64;
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    const lowCol = new THREE.Color(lowColorHex);
    const highCol = new THREE.Color(highColorHex);
    const tmpCol = new THREE.Color();

    for (let r = 0; r <= radialSegs; r++) {
      const t = r / radialSegs;
      const radius = THREE.MathUtils.lerp(innerRadius, outerRadius, t);
      const ridgeEnvelope = Math.sin(t * Math.PI);
      for (let a = 0; a <= angularSegs; a++) {
        const ang = (a / angularSegs) * Math.PI * 2;
        const n1 = Math.sin(ang * 5 + seed) * 0.45 + 0.55;
        const n2 = Math.cos(ang * 11 - seed * 1.7) * 0.35 + 0.4;
        const n3 = Math.sin(ang * 19 + r * 1.3 + seed) * 0.2;
        const hFactor = Math.max(0, (n1 * 0.55 + n2 * 0.3 + n3 * 0.15) * ridgeEnvelope);
        const y = baseY + hFactor * peakHeight;

        positions.push(centerX + Math.cos(ang) * radius, y, centerZ + Math.sin(ang) * radius);
        tmpCol.copy(lowCol).lerp(highCol, Math.min(1, hFactor * 1.35));
        colors.push(tmpCol.r, tmpCol.g, tmpCol.b);
      }
    }

    const rowStride = angularSegs + 1;
    for (let r = 0; r < radialSegs; r++) {
      for (let a = 0; a < angularSegs; a++) {
        const i0 = r * rowStride + a;
        const i1 = i0 + 1;
        const i2 = (r + 1) * rowStride + a;
        const i3 = i2 + 1;
        indices.push(i0, i2, i1, i1, i2, i3);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness,
      metalness: 0.08,
      flatShading: true,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.levelGroup.add(mesh);
  }

  private buildBiomeScenery(level: LevelDef) {
    const biome = level.theme.biome;
    const dummy = new THREE.Object3D();

    if (biome === 'jungle') {
      // Distant lush rainforest mountain ring
      this.addHorizonMountainRing(16, -50, level.theme.hazardFloorY - 1, 95, 175, 42, 0x064e3b, 0x16a34a, 1.4, 0.9);

      // Multi-tiered realistic rainforest trees with textured bark trunks + 3 canopy tiers + ruined stone pillars
      const treeCount = 68;
      const trunkGeo = new THREE.CylinderGeometry(0.42, 0.85, 11, 10);
      const trunkMat = new THREE.MeshStandardMaterial({ map: this.textures.barkTexture, roughness: 0.9 });
      const crownLowGeo = new THREE.DodecahedronGeometry(3.5, 1);
      const crownMidGeo = new THREE.DodecahedronGeometry(2.8, 1);
      const crownTopGeo = new THREE.DodecahedronGeometry(1.9, 1);
      const crownMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.78 });

      const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
      const cLow = new THREE.InstancedMesh(crownLowGeo, crownMat, treeCount);
      const cMid = new THREE.InstancedMesh(crownMidGeo, crownMat, treeCount);
      const cTop = new THREE.InstancedMesh(crownTopGeo, crownMat, treeCount);

      for (let i = 0; i < treeCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 22 + ((i * 19) % 62);
        const z = 14 - ((i * 21) % 135);
        const x = (i % 3 === 0 ? 48 : 0) + side * dist;
        const y = -9 + (i % 5) * 1.4;
        const scale = 0.85 + (i % 4) * 0.25;

        dummy.position.set(x, y + 5.2 * scale, z);
        dummy.rotation.set(0, i * 0.8, (i % 3 - 1) * 0.04);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        trunks.setMatrixAt(i, dummy.matrix);

        dummy.position.set(x, y + 9.6 * scale, z);
        dummy.scale.set(scale * 1.2, scale * 0.75, scale * 1.2);
        dummy.updateMatrix();
        cLow.setMatrixAt(i, dummy.matrix);
        _color.setHSL(0.35 + (i % 3) * 0.025, 0.65, 0.32 + (i % 3) * 0.04);
        cLow.setColorAt(i, _color);

        dummy.position.set(x + 0.4, y + 11.4 * scale, z - 0.3);
        dummy.scale.set(scale * 1.05, scale * 0.72, scale * 1.05);
        dummy.updateMatrix();
        cMid.setMatrixAt(i, dummy.matrix);
        _color.setHSL(0.36 + (i % 3) * 0.025, 0.7, 0.4 + (i % 3) * 0.05);
        cMid.setColorAt(i, _color);

        dummy.position.set(x - 0.2, y + 13.0 * scale, z + 0.2);
        dummy.scale.set(scale * 0.9, scale * 0.68, scale * 0.9);
        dummy.updateMatrix();
        cTop.setMatrixAt(i, dummy.matrix);
        _color.setHSL(0.34, 0.74, 0.48);
        cTop.setColorAt(i, _color);
      }
      for (const im of [trunks, cLow, cMid, cTop]) {
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.computeBoundingSphere();
      }
      this.levelGroup.add(trunks, cLow, cMid, cTop);

      // Ancient Stone Temple Arches framing the jungle valley
      const archMat = new THREE.MeshStandardMaterial({ map: this.textures.climbStone, roughness: 0.85 });
      for (let a = 0; a < 5; a++) {
        const arch = new THREE.Group();
        arch.position.set(a % 2 === 0 ? -24 : 26, -6, -18 - a * 22);
        arch.rotation.y = (a % 2 === 0 ? 1 : -1) * 0.35;
        const pGeo = new THREE.BoxGeometry(2.2, 13, 2.2);
        const pL = new THREE.Mesh(pGeo, archMat);
        pL.position.set(-4.2, 6.5, 0);
        const pR = new THREE.Mesh(pGeo, archMat);
        pR.position.set(4.2, 6.5, 0);
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(11.6, 2.0, 2.6), archMat);
        lintel.position.set(0, 13.2, 0);
        arch.add(pL, pR, lintel);
        this.levelGroup.add(arch);
      }
    } else if (biome === 'desert') {
      // Rolling sandstone dune ridge horizon
      this.addHorizonMountainRing(0, -135, level.theme.hazardFloorY - 1, 105, 195, 36, 0x9a3412, 0xf59e0b, 3.1, 0.88);

      // Stratified mesas + stepped desert pyramids
      const mesaCount = 54;
      const mesaGeo = new THREE.CylinderGeometry(3.0, 6.2, 18, 5);
      const mesaMat = new THREE.MeshStandardMaterial({ map: this.textures.desertSandstone, roughness: 0.86, metalness: 0.05 });
      const mesas = new THREE.InstancedMesh(mesaGeo, mesaMat, mesaCount);

      for (let i = 0; i < mesaCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 26 + ((i * 21) % 68);
        const z = 15 - i * 5.2;
        const scale = 0.9 + (i % 4) * 0.45;
        dummy.position.set(side * dist, -4 + (i % 3) * 1.5, z);
        dummy.rotation.set(0, Math.PI / 4 + (i % 3) * 0.25, 0);
        dummy.scale.set(scale, scale * (0.9 + (i % 3) * 0.28), scale);
        dummy.updateMatrix();
        mesas.setMatrixAt(i, dummy.matrix);
        _color.setHSL(0.06 + (i % 3) * 0.015, 0.72, 0.48 + (i % 3) * 0.06);
        mesas.setColorAt(i, _color);
      }
      mesas.instanceMatrix.needsUpdate = true;
      if (mesas.instanceColor) mesas.instanceColor.needsUpdate = true;
      mesas.computeBoundingSphere();
      this.levelGroup.add(mesas);

      // Tiered Step Pyramids with golden capstones
      const pyrMat = new THREE.MeshStandardMaterial({ map: this.textures.desertSandstone, roughness: 0.78 });
      const goldCapMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.2 });
      const pyrSpots: [number, number, number][] = [
        [-42, -9, -45],
        [44, -9, -110],
        [-46, -9, -185],
        [42, -9, -245],
      ];
      for (const [px, py, pz] of pyrSpots) {
        const pyr = new THREE.Group();
        pyr.position.set(px, py, pz);
        for (let tier = 0; tier < 4; tier++) {
          const w = 18 - tier * 3.8;
          const b = new THREE.Mesh(new THREE.BoxGeometry(w, 3.5, w), pyrMat);
          b.position.y = tier * 3.5 + 1.75;
          pyr.add(b);
        }
        const apex = new THREE.Mesh(new THREE.ConeGeometry(2.6, 3.6, 4), goldCapMat);
        apex.rotation.y = Math.PI / 4;
        apex.position.y = 4 * 3.5 + 1.8;
        pyr.add(apex);
        this.levelGroup.add(pyr);
      }
    } else if (biome === 'ice') {
      // Jagged Arctic mountain ridge ring
      this.addHorizonMountainRing(-24, -55, level.theme.hazardFloorY - 1, 95, 175, 48, 0x0c4a6e, 0xe0f2fe, 5.2, 0.45);

      const spireCount = 62;
      const spireGeo = new THREE.ConeGeometry(2.6, 17, 6);
      const spireMat = new THREE.MeshPhysicalMaterial({
        color: 0xbae6fd,
        roughness: 0.16,
        metalness: 0.15,
        clearcoat: 0.92,
      });
      const capGeo = new THREE.ConeGeometry(1.4, 5.5, 6);
      const capMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.38 });

      const spires = new THREE.InstancedMesh(spireGeo, spireMat, spireCount);
      const caps = new THREE.InstancedMesh(capGeo, capMat, spireCount);
      for (let i = 0; i < spireCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 24 + ((i * 19) % 64);
        const z = 12 - ((i * 22) % 135);
        const x = (i % 2 === 0 ? -48 : 0) + side * dist;
        const scale = 0.8 + (i % 5) * 0.32;
        dummy.position.set(x, -5 + (i % 3) * 1.2, z);
        dummy.rotation.set((i % 3) * 0.05, i * 0.7, (i % 2) * 0.04);
        dummy.scale.set(scale, scale * 1.2, scale);
        dummy.updateMatrix();
        spires.setMatrixAt(i, dummy.matrix);
        _color.setHSL(0.55 + (i % 3) * 0.02, 0.75, 0.76);
        spires.setColorAt(i, _color);

        dummy.position.set(x, -5 + (i % 3) * 1.2 + 7.2 * scale, z);
        dummy.scale.set(scale * 1.02, scale * 1.05, scale * 1.02);
        dummy.updateMatrix();
        caps.setMatrixAt(i, dummy.matrix);
      }
      spires.instanceMatrix.needsUpdate = true;
      caps.instanceMatrix.needsUpdate = true;
      if (spires.instanceColor) spires.instanceColor.needsUpdate = true;
      spires.computeBoundingSphere();
      caps.computeBoundingSphere();
      this.levelGroup.add(spires, caps);

      // Multi-ribbon Aurora Borealis
      const auroraColors = [0x2dd4bf, 0x38bdf8, 0xa855f7];
      for (let a = 0; a < auroraColors.length; a++) {
        const auroraMat = new THREE.MeshBasicMaterial({
          color: auroraColors[a],
          transparent: true,
          opacity: 0.24,
          side: THREE.DoubleSide,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const auroraRibbon = new THREE.Mesh(
          new THREE.TorusGeometry(82 + a * 8, 3.2, 8, 48, Math.PI * 0.95),
          auroraMat
        );
        auroraRibbon.position.set(-22 + a * 6, 38 + a * 4, -60 - a * 8);
        auroraRibbon.rotation.set(0.35 + a * 0.06, 0.25, 0.38 - a * 0.08);
        this.levelGroup.add(auroraRibbon);
      }
    } else if (biome === 'volcanic') {
      // Jagged basalt caldera mountain ring
      this.addHorizonMountainRing(0, -115, level.theme.hazardFloorY - 1, 100, 190, 52, 0x1c1917, 0x7c2d12, 7.7, 0.92);

      // Basalt crystal columns & glowing magma caldera cones
      const colCount = 56;
      const colGeo = new THREE.CylinderGeometry(1.8, 2.7, 22, 6);
      const colMat = new THREE.MeshStandardMaterial({ map: this.textures.volcanicBasalt, roughness: 0.85, metalness: 0.15 });
      const cols = new THREE.InstancedMesh(colGeo, colMat, colCount);

      for (let i = 0; i < colCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 24 + ((i * 23) % 66);
        const z = 10 - i * 4.5;
        const scale = 0.85 + (i % 4) * 0.38;
        dummy.position.set(side * dist, -5 + (i % 3) * 1.4, z);
        dummy.rotation.set((i % 3 - 1) * 0.06, i * 0.5, (i % 2) * 0.05);
        dummy.scale.set(scale, scale * 1.15, scale);
        dummy.updateMatrix();
        cols.setMatrixAt(i, dummy.matrix);
      }
      cols.instanceMatrix.needsUpdate = true;
      cols.computeBoundingSphere();
      this.levelGroup.add(cols);

      // Volcano cones with glowing magma crater rims
      const volcMat = new THREE.MeshStandardMaterial({ map: this.textures.volcanicBasalt, roughness: 0.88 });
      const magmaRimMat = new THREE.MeshStandardMaterial({
        color: 0xf97316,
        emissive: 0xea580c,
        emissiveIntensity: 2.2,
      });
      const volcSpots: [number, number, number][] = [
        [-45, -10, -55],
        [46, -10, -125],
        [-42, -10, -195],
      ];
      for (const [vx, vy, vz] of volcSpots) {
        const vg = new THREE.Group();
        vg.position.set(vx, vy, vz);
        const cone = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 16, 26, 12, 1, true), volcMat);
        cone.position.y = 13;
        const glowRim = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.8, 12), magmaRimMat);
        glowRim.position.y = 25.5;
        vg.add(cone, glowRim);
        this.levelGroup.add(vg);
      }
    } else {
      // NEBULA CITADEL: Cosmic horizon ridge + ringed gas giant + floating monolith spires + orbital rings
      this.addHorizonMountainRing(16, -75, level.theme.hazardFloorY - 1, 105, 195, 44, 0x0f172a, 0x6366f1, 9.9, 0.65);

      const spireCount = 52;
      const monoGeo = new THREE.OctahedronGeometry(2.6, 0);
      const monoMat = new THREE.MeshPhysicalMaterial({
        color: 0x312e81,
        roughness: 0.2,
        metalness: 0.72,
        clearcoat: 0.85,
      });
      const monos = new THREE.InstancedMesh(monoGeo, monoMat, spireCount);
      for (let i = 0; i < spireCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 28 + ((i * 19) % 70);
        const z = 10 - i * 3.4;
        const scale = 0.8 + (i % 5) * 0.35;
        dummy.position.set(14 + side * dist, -2 + (i % 6) * 3.2, z);
        dummy.rotation.set(0, i * 0.6, 0);
        dummy.scale.set(scale * 0.75, scale * 2.4, scale * 0.75);
        dummy.updateMatrix();
        monos.setMatrixAt(i, dummy.matrix);
        _color.setHSL(0.68 + (i % 3) * 0.04, 0.7, 0.45);
        monos.setColorAt(i, _color);
      }
      monos.instanceMatrix.needsUpdate = true;
      if (monos.instanceColor) monos.instanceColor.needsUpdate = true;
      monos.computeBoundingSphere();
      this.levelGroup.add(monos);

      // Ringed Cosmic Planet over the Citadel
      const planetGroup = new THREE.Group();
      planetGroup.position.set(-48, 46, -175);
      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(18, 28, 22),
        new THREE.MeshStandardMaterial({
          color: 0x6366f1,
          emissive: 0x312e81,
          emissiveIntensity: 0.65,
          roughness: 0.55,
        })
      );
      const pRing = new THREE.Mesh(
        new THREE.TorusGeometry(28, 2.2, 8, 48),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 })
      );
      pRing.rotation.set(1.18, 0.25, 0.2);
      planetGroup.add(planet, pRing);
      this.levelGroup.add(planetGroup);
    }
  }

  public loadLevel(index: number, targetPhase: GamePhase) {
    this.clearLevelGroup();
    const level = LEVELS[THREE.MathUtils.clamp(index, 0, LEVELS.length - 1)];
    this.currentLevel = level;
    const theme = level.theme;

    this.scene.fog = new THREE.Fog(theme.fogColor, theme.fogNear, theme.fogFar);
    this.scene.background = new THREE.Color(theme.skyHorizon);
    this.keyLight.color.setHex(theme.keyLightColor);
    this.keyLight.intensity = theme.keyLightIntensity;
    this.hemiLight.color.setHex(theme.hemiSkyColor);
    this.hemiLight.groundColor.setHex(theme.hemiGroundColor);
    this.hemiLight.intensity = theme.hemiIntensity;

    const skyMat = this.skyMesh.material as THREE.MeshBasicMaterial;
    skyMat.map =
      theme.biome === 'jungle'
        ? this.textures.skyJungle
        : theme.biome === 'desert'
          ? this.textures.skyDesert
          : theme.biome === 'ice'
            ? this.textures.skyIce
            : theme.biome === 'volcanic'
              ? this.textures.skyVolcanic
              : this.textures.skyNebula;
    skyMat.needsUpdate = true;

    const seaGeo = new THREE.PlaneGeometry(520, 520);
    const seaTex =
      theme.biome === 'jungle'
        ? this.textures.lagoonSurface
        : theme.biome === 'desert'
          ? this.textures.sandOceanSurface
          : theme.biome === 'ice'
            ? this.textures.iceSeaSurface
            : theme.biome === 'volcanic'
              ? this.textures.lavaSurface
              : this.textures.nebulaSeaSurface;
    this.hazardSeaTex = seaTex;
    const seaMat = new THREE.MeshStandardMaterial({
      map: seaTex,
      roughness: theme.biome === 'desert' ? 0.85 : 0.25,
      metalness: theme.biome === 'ice' ? 0.35 : 0.15,
      emissive: theme.biome === 'volcanic' ? 0x7c2d12 : theme.biome === 'nebula' ? 0x1e1b4b : 0x000000,
      emissiveIntensity: theme.biome === 'volcanic' ? 0.45 : 0.25,
    });
    this.hazardSeaMesh = new THREE.Mesh(seaGeo, seaMat);
    this.hazardSeaMesh.rotation.x = -Math.PI / 2;
    this.hazardSeaMesh.position.set(0, theme.hazardFloorY, -95);
    this.levelGroup.add(this.hazardSeaMesh);

    this.buildBiomeScenery(level);

    // Platforms (including target-linked holographic bridges)
    for (const pDef of level.platforms) {
      const mat = this.createPlatformMaterial(pDef);
      const startsInactive = Boolean(pDef.linkedTargetId);
      if (startsInactive) {
        mat.transparent = true;
        mat.opacity = 0.16;
      }
      const geo = new THREE.BoxGeometry(pDef.size[0], pDef.size[1], pDef.size[2]);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pDef.pos[0], pDef.pos[1], pDef.pos[2]);
      mesh.castShadow = !this.isSoftwareGl && !startsInactive;
      mesh.receiveShadow = true;

      if (pDef.kind === 'crumble' || pDef.kind === 'conveyor' || pDef.kind === 'moving' || pDef.kind === 'ice') {
        const trimColor =
          pDef.kind === 'crumble'
            ? 0xf97316
            : pDef.kind === 'conveyor'
              ? 0x22d3ee
              : pDef.kind === 'ice'
                ? 0xe0f2fe
                : 0x38bdf8;
        const trim = new THREE.Mesh(
          new THREE.BoxGeometry(pDef.size[0] + 0.08, 0.14, pDef.size[2] + 0.08),
          new THREE.MeshStandardMaterial({
            color: trimColor,
            emissive: trimColor,
            emissiveIntensity: pDef.kind === 'ice' ? 0.25 : 0.7,
            roughness: 0.25,
          })
        );
        trim.position.y = pDef.size[1] / 2 - 0.12;
        mesh.add(trim);
      }

      this.levelGroup.add(mesh);
      this.platforms.push({
        def: pDef,
        mesh,
        basePos: new THREE.Vector3(...pDef.pos),
        pos: new THREE.Vector3(...pDef.pos),
        prevPos: new THREE.Vector3(...pDef.pos),
        halfSize: new THREE.Vector3(pDef.size[0] / 2, pDef.size[1] / 2, pDef.size[2] / 2),
        crumbleState: 'idle',
        crumbleTimer: 0,
        visible: !startsInactive,
      });
    }

    // 2D Zone Visual Guides
    for (const z2d of level.zones2D) {
      const guideMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });
      const span = z2d.moveAxis === 'x' ? z2d.max[0] - z2d.min[0] : z2d.max[2] - z2d.min[2];
      const railGeo =
        z2d.moveAxis === 'x' ? new THREE.BoxGeometry(span, 0.08, 0.08) : new THREE.BoxGeometry(0.08, 0.08, span);
      const rail = new THREE.Mesh(railGeo, guideMat);
      rail.position.set(
        (z2d.min[0] + z2d.max[0]) / 2,
        6.5,
        z2d.moveAxis === 'x' ? z2d.lockCoord - 1.85 : (z2d.min[2] + z2d.max[2]) / 2
      );
      if (z2d.moveAxis === 'z') rail.position.x = z2d.lockCoord - 1.85;
      this.levelGroup.add(rail);
    }

    // Climbable Walls (Level 4 Monkey Temple)
    if (level.climbWalls) {
      for (const cw of level.climbWalls) {
        const group = createClimbWallMesh(cw.size, cw.face, this.textures.climbStone);
        group.position.set(...cw.pos);
        this.levelGroup.add(group);
        this.climbWalls.push({
          def: cw,
          group,
          pos: new THREE.Vector3(...cw.pos),
          halfSize: new THREE.Vector3(cw.size[0] / 2, cw.size[1] / 2, cw.size[2] / 2),
        });
      }
    }

    // Monkey Suit Pickup
    this.hasMonkeySuit = false;
    this.isClimbing = false;
    this.climbingWall = null;
    for (const part of this.playerRig.monkeyParts) {
      part.visible = false;
    }
    if (level.monkeySuitPos) {
      const mp = createMonkeySuitPickupMesh();
      mp.group.position.set(...level.monkeySuitPos);
      this.levelGroup.add(mp.group);
      this.monkeyPickup = {
        group: mp.group,
        suit: mp.suit,
        pos: new THREE.Vector3(...level.monkeySuitPos),
        collected: false,
      };
    }

    // Bow Pickup & Archery Targets
    this.hasBow = false;
    this.bowCooldown = 0;
    this.playerRig.bowMesh.visible = false;
    if (level.bowPickupPos) {
      const bp = createBowPickupMesh();
      bp.group.position.set(...level.bowPickupPos);
      this.levelGroup.add(bp.group);
      this.bowPickup = {
        group: bp.group,
        bow: bp.bow,
        pos: new THREE.Vector3(...level.bowPickupPos),
        collected: false,
      };
    }

    if (level.targets) {
      for (const tg of level.targets) {
        const tm = createArcheryTargetMesh();
        tm.group.position.set(...tg.pos);
        this.levelGroup.add(tm.group);
        this.targets.push({
          id: tg.id,
          group: tm.group,
          ringMat: tm.ringMat,
          pos: new THREE.Vector3(...tg.pos),
          coins: tg.coins ?? 5,
          hit: false,
        });
      }
    }

    // Rocket Vehicle Section
    this.rocketState = 'parked';
    this.rocketBoostTimer = 0;
    if (level.rocketSection) {
      const rs = level.rocketSection;
      this.rocketLaunchpadPos.set(...rs.launchpadPos);
      this.rocketLandingPos.set(...rs.landingPos);
      this.rocketCruiseSpeed = rs.cruiseSpeed;

      const pad = createRocketPadMesh();
      pad.position.copy(this.rocketLaunchpadPos);
      this.levelGroup.add(pad);

      this.rocketRig = createRocketVehicle();
      this.rocketPos.copy(this.rocketLaunchpadPos);
      this.rocketPos.y += 0.28;
      this.rocketRig.root.position.copy(this.rocketPos);
      this.rocketRig.flameL.visible = false;
      this.rocketRig.flameR.visible = false;
      this.levelGroup.add(this.rocketRig.root);

      for (const rPos of rs.rings) {
        const rg = createBoostRingMesh();
        rg.position.set(...rPos);
        this.levelGroup.add(rg);
        this.boostRings.push({ group: rg, pos: new THREE.Vector3(...rPos), passed: false });
      }
      for (let i = 0; i < rs.mines.length; i++) {
        const mPos = rs.mines[i];
        const mg = createMineMesh();
        mg.position.set(...mPos);
        this.levelGroup.add(mg);
        this.mines.push({
          group: mg,
          pos: new THREE.Vector3(...mPos),
          baseY: mPos[1],
          phase: i * 1.3,
          exploded: false,
        });
      }
    }

    // Jump Pads
    for (const jp of level.jumpPads) {
      const group = createJumpPadMesh();
      group.position.set(...jp.pos);
      this.levelGroup.add(group);
      this.jumpPads.push({ pos: new THREE.Vector3(...jp.pos), boost: jp.boost ?? 16, group, bounceAnim: 0 });
    }

    // Crates
    let crateCoinTotal = 0;
    for (const cr of level.crates) {
      const mesh = createCrateMesh();
      mesh.position.set(...cr.pos);
      this.levelGroup.add(mesh);
      const count = cr.coins ?? 3;
      crateCoinTotal += count;
      this.crates.push({ mesh, pos: new THREE.Vector3(...cr.pos), coins: count, broken: false });
    }

    // Coins
    for (let i = 0; i < level.coins.length; i++) {
      const c = level.coins[i];
      const mesh = createCoinMesh();
      mesh.position.set(...c.pos);
      this.levelGroup.add(mesh);
      this.coins.push({
        mesh,
        baseY: c.pos[1],
        pos: new THREE.Vector3(...c.pos),
        collected: false,
        phase: i * 0.65,
      });
    }
    this.totalLevelCoins = level.coins.length + crateCoinTotal;

    // Mini-Bots
    level.miniBots.forEach((mb, idx) => {
      const { group, beacon, visorGlow } = createMiniBotMesh();
      group.position.set(...mb.pos);
      this.levelGroup.add(group);
      this.miniBots.push({
        id: mb.id,
        name: mb.name,
        group,
        beacon,
        visorGlow,
        homePos: new THREE.Vector3(...mb.pos),
        pos: new THREE.Vector3(...mb.pos),
        rescued: false,
        orbitIndex: idx,
      });
    });

    // Enemies
    level.enemies.forEach((en, idx) => {
      const rig = createEnemyMesh(en.kind);
      rig.group.position.set(...en.pos);
      this.levelGroup.add(rig.group);
      this.enemies.push({
        kind: en.kind,
        group: rig.group,
        body: rig.body,
        eyeMat: rig.eyeMat,
        jawUpper: rig.jawUpper,
        windupKey: rig.windupKey,
        springGroup: rig.springGroup,
        basePos: new THREE.Vector3(...en.pos),
        pos: new THREE.Vector3(...en.pos),
        patrolOffset: new THREE.Vector3(...en.patrolOffset),
        speed: en.speed,
        phase: idx * 1.1,
        hp: en.kind === 'brute' ? 2 : 1,
        hitFlash: 0,
        alive: true,
        hopPhase: 0,
      });
    });

    // Final Boss ("Titán Kraxus")
    if (level.boss) {
      const bRig = createBossMesh();
      bRig.root.position.set(...level.boss.pos);
      this.levelGroup.add(bRig.root);
      this.bossRuntime = {
        rig: bRig,
        name: level.boss.name,
        pos: new THREE.Vector3(...level.boss.pos),
        arenaCenter: new THREE.Vector3(...level.boss.arenaCenter),
        arenaRadius: level.boss.arenaRadius,
        hp: level.boss.maxHp,
        maxHp: level.boss.maxHp,
        alive: true,
        active: false,
        invulnTimer: 0,
        state: 'chase',
        stateTimer: 1.5,
        shockwaveRadius: 0,
        chargeDir: new THREE.Vector3(0, 0, 1),
      };
    }

    // Lasers
    for (const lz of level.lasers) {
      const group = new THREE.Group();
      group.position.set(...lz.pos);
      const postGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.9, 10);
      const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.3 });
      const p1 = new THREE.Mesh(postGeo, postMat);
      const p2 = new THREE.Mesh(postGeo, postMat);
      if (lz.axis === 'x') {
        p1.position.x = -lz.length / 2;
        p2.position.x = lz.length / 2;
      } else {
        p1.position.z = -lz.length / 2;
        p2.position.z = lz.length / 2;
      }
      group.add(p1, p2);

      const beamGeo = new THREE.CylinderGeometry(0.11, 0.11, lz.length, 10);
      if (lz.axis === 'x') beamGeo.rotateZ(Math.PI / 2);
      else beamGeo.rotateX(Math.PI / 2);
      const beamMat = new THREE.MeshBasicMaterial({ color: 0xff2a55, transparent: true, opacity: 0.9 });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      group.add(beamMesh);

      const telegraphGeo = new THREE.CylinderGeometry(0.035, 0.035, lz.length, 8);
      if (lz.axis === 'x') telegraphGeo.rotateZ(Math.PI / 2);
      else telegraphGeo.rotateX(Math.PI / 2);
      const telegraphMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.4 });
      group.add(new THREE.Mesh(telegraphGeo, telegraphMat));

      this.levelGroup.add(group);
      this.lasers.push({
        group,
        beamMesh,
        beamMat,
        telegraphMat,
        pos: new THREE.Vector3(...lz.pos),
        length: lz.length,
        axis: lz.axis,
        period: lz.period,
        phase: lz.phase ?? 0,
        active: false,
      });
    }

    // Checkpoints
    for (const cp of level.checkpoints) {
      const { group, flagMat } = createCheckpointMesh();
      group.position.set(...cp.pos);
      this.levelGroup.add(group);
      this.checkpoints.push({ group, flagMat, pos: new THREE.Vector3(...cp.pos), activated: false });
    }

    // Goal Portal (locked until Boss defeated if level has a Boss)
    const goal = createGoalPortalMesh();
    goal.group.position.set(...level.goalPos);
    const goalLocked = Boolean(level.boss);
    if (goalLocked) {
      goal.vortex.visible = false;
      goal.portalMat.color.setHex(0xf43f5e);
      goal.portalMat.emissive.setHex(0xe11d48);
    }
    this.levelGroup.add(goal.group);
    this.goalPortal = {
      ...goal,
      pos: new THREE.Vector3(...level.goalPos),
      locked: goalLocked,
    };

    this.spawnPos.set(...level.spawn);
    this.playerPos.copy(this.spawnPos);
    this.playerVel.set(0, 0, 0);
    this.playerYaw = Math.PI;
    this.playerSquash.set(1, 1, 1);
    this.grounded = false;
    this.standingPlatform = null;
    this.hoverFuel = 1;
    this.isHovering = false;
    this.spinTimer = 0;
    this.invulnTimer = 0;
    this.health = this.maxHealth;
    this.coinsCollected = 0;
    this.botsRescued = 0;
    this.levelTime = 0;
    this.checkpointActive = false;
    this.active2DZone = null;
    this.perspectiveMode = '3D';
    this.camYaw = 0;
    this.camPitch = 0.42;
    this.camCurrentPos.set(this.playerPos.x, this.playerPos.y + 5.2, this.playerPos.z + 9.5);
    this.camLookTarget.copy(this.playerPos).add(_vec3A.set(0, 1.0, 0));

    this.phase = targetPhase;
    this.bannerText = targetPhase === 'playing' ? level.name : null;
    this.bannerTimer = targetPhase === 'playing' ? 2.4 : 0;

    soundEngine.setMusicContext(level.theme.biome, false, targetPhase, false);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }
    this.pushHud(true);
  }

  private createPlatformMaterial(pDef: PlatformDef): THREE.MeshStandardMaterial {
    if (pDef.kind === 'glass') {
      return new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: 0.72,
        clearcoat: 1.0,
      });
    }
    const style = pDef.style ?? 'tech';
    if (style === 'jungle') return new THREE.MeshStandardMaterial({ map: this.textures.jungleGrass, roughness: 0.76, metalness: 0.04 });
    if (style === 'desert') return new THREE.MeshStandardMaterial({ map: this.textures.desertSandstone, roughness: 0.74, metalness: 0.08 });
    if (style === 'volcanic') return new THREE.MeshStandardMaterial({ map: this.textures.volcanicBasalt, roughness: 0.78, metalness: 0.18 });
    if (style === 'nebula') return new THREE.MeshStandardMaterial({ map: this.textures.nebulaDeck, roughness: 0.3, metalness: 0.48 });
    if (style === 'ice') {
      return new THREE.MeshPhysicalMaterial({
        map: this.textures.iceCrystal,
        roughness: 0.14,
        metalness: 0.1,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
      });
    }
    if (style === 'crystal') return new THREE.MeshStandardMaterial({ map: this.textures.crystalCircuit, roughness: 0.28, metalness: 0.52 });
    if (style === 'gold') return new THREE.MeshStandardMaterial({ map: this.textures.goldTrim, roughness: 0.22, metalness: 0.85 });
    return new THREE.MeshStandardMaterial({ map: this.textures.techGrid, roughness: 0.34, metalness: 0.25 });
  }

  private spawnBurst(x: number, y: number, z: number, hexColor: number, count: number, speed: number) {
    let spawned = 0;
    for (let i = 0; i < this.MAX_PARTICLES && spawned < count; i++) {
      const p = this.particles[i];
      if (!p.active) {
        p.active = true;
        p.pos.set(x, y, z);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.75;
        const spd = speed * (0.45 + Math.random() * 0.65);
        p.vel.set(Math.sin(phi) * Math.cos(theta) * spd, Math.cos(phi) * spd + 1.5, Math.sin(phi) * Math.sin(theta) * spd);
        p.maxLife = 0.32 + Math.random() * 0.34;
        p.life = p.maxLife;
        p.size = 0.65 + Math.random() * 0.7;
        p.color.setHex(hexColor);
        spawned++;
      }
    }
  }

  private showBanner(text: string, duration = 2.4) {
    this.bannerText = text;
    this.bannerTimer = duration;
    this.pushHud(true);
  }

  private scheduleNextTick() {
    if (this.disposed) return;
    if (this.isSoftwareGl) this.afterDraw(this.tick);
    else this.frameId = requestAnimationFrame(this.tick);
  }

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) {
        if (sync) gl.deleteSync(sync);
        return;
      }
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (this.disposed) return;
    const now = performance.now();
    const rawDt = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    this.totalTime += dt;
    if (this.shakeIntensity > 0) this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 1.8);

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
    } else {
      this.stepSimulation(dt);
    }

    this.updateParticles(dt);
    this.updateCamera(dt);

    // Keep sky dome & infinite sea centered beneath camera/player
    this.skyMesh.position.copy(this.camera.position);
    if (this.hazardSeaMesh) {
      this.hazardSeaMesh.position.x = this.playerPos.x;
      this.hazardSeaMesh.position.z = this.playerPos.z;
    }
    if (this.hazardSeaTex) {
      this.hazardSeaTex.offset.x = (this.totalTime * 0.018) % 1;
      this.hazardSeaTex.offset.y = (this.totalTime * 0.012) % 1;
    }

    this.renderer.render(this.scene, this.camera);

    if (now - this.lastHudPush > 85) this.pushHud(false);
    this.scheduleNextTick();
  };

  private stepSimulation(dt: number) {
    for (const p of this.platforms) {
      p.prevPos.copy(p.pos);
      if (p.def.kind === 'moving' && p.def.moveOffset) {
        const speed = p.def.moveSpeed ?? 1.5;
        const phase = p.def.movePhase ?? 0;
        const s = Math.sin(this.totalTime * speed + phase);
        p.pos.set(
          p.basePos.x + p.def.moveOffset[0] * s,
          p.basePos.y + p.def.moveOffset[1] * s,
          p.basePos.z + p.def.moveOffset[2] * s
        );
        p.mesh.position.copy(p.pos);
      } else if (p.def.kind === 'crumble') {
        if (p.crumbleState === 'shaking') {
          p.crumbleTimer -= dt;
          p.mesh.position.set(
            p.basePos.x + (Math.random() - 0.5) * 0.14,
            p.basePos.y - 0.04,
            p.basePos.z + (Math.random() - 0.5) * 0.14
          );
          if (p.crumbleTimer <= 0) {
            p.crumbleState = 'fallen';
            p.crumbleTimer = 2.6;
            p.visible = false;
            p.mesh.visible = false;
            this.spawnBurst(p.pos.x, p.pos.y, p.pos.z, 0xf97316, 12, 3.5);
          }
        } else if (p.crumbleState === 'fallen') {
          p.crumbleTimer -= dt;
          if (p.crumbleTimer <= 0) {
            p.crumbleState = 'idle';
            p.visible = true;
            p.mesh.visible = true;
            p.mesh.position.copy(p.basePos);
          }
        }
      }
    }

    if (this.bowPickup && !this.bowPickup.collected) {
      this.bowPickup.bow.rotation.y += dt * 2.2;
      this.bowPickup.bow.position.y = 1.05 + Math.sin(this.totalTime * 3.0) * 0.14;
    }
    if (this.monkeyPickup && !this.monkeyPickup.collected) {
      this.monkeyPickup.suit.rotation.y += dt * 2.2;
      this.monkeyPickup.suit.position.y = 1.1 + Math.sin(this.totalTime * 3.0) * 0.14;
    }
    if (this.currentLevel.theme.biome === 'volcanic' && Math.random() < 0.35) {
      this.spawnBurst(
        this.playerPos.x + (Math.random() - 0.5) * 18,
        this.playerPos.y - 2,
        this.playerPos.z + (Math.random() - 0.5) * 18,
        0xf97316,
        1,
        1.2
      );
    }

    for (const c of this.coins) {
      if (c.collected) continue;
      c.mesh.rotation.y += dt * 2.6;
      c.mesh.position.y = c.baseY + Math.sin(this.totalTime * 3.0 + c.phase) * 0.14;
    }
    for (const jp of this.jumpPads) {
      if (jp.bounceAnim > 0) {
        jp.bounceAnim = Math.max(0, jp.bounceAnim - dt * 4);
        jp.group.scale.set(1, 1 + Math.sin(jp.bounceAnim * Math.PI) * 0.35, 1);
      }
    }
    for (const rg of this.boostRings) {
      rg.group.rotation.z += dt * 1.4;
    }
    for (const m of this.mines) {
      if (!m.exploded) {
        m.pos.y = m.baseY + Math.sin(this.totalTime * 2.2 + m.phase) * 0.45;
        m.group.position.copy(m.pos);
        m.group.rotation.y += dt * 1.6;
      }
    }
    if (this.goalPortal) this.goalPortal.ringInner.rotation.z += dt * 1.8;

    if (this.currentLevel.theme.biome === 'ice' && Math.random() < 0.35) {
      this.spawnBurst(
        this.playerPos.x + (Math.random() - 0.5) * 18,
        this.playerPos.y + 8,
        this.playerPos.z + (Math.random() - 0.5) * 18,
        0xe0f2fe,
        1,
        0.5
      );
    }

    for (const lz of this.lasers) {
      const cycle = ((this.totalTime + lz.phase) % lz.period) / lz.period;
      const active = cycle >= 0.45 && cycle <= 0.9;
      const telegraph = cycle >= 0.24 && cycle < 0.45;
      lz.active = active;
      lz.beamMesh.visible = active;
      lz.telegraphMat.opacity = telegraph ? 0.55 + Math.sin(this.totalTime * 28) * 0.3 : 0.15;
    }

    for (const mb of this.miniBots) {
      if (!mb.rescued) {
        mb.group.position.y = mb.homePos.y + Math.abs(Math.sin(this.totalTime * 3.2 + mb.orbitIndex)) * 0.28;
        mb.beacon.rotation.y += dt * 3.0;
        mb.beacon.position.y = 1.25 + Math.sin(this.totalTime * 4) * 0.08;
      } else {
        const angle = this.totalTime * 2.2 + mb.orbitIndex * ((Math.PI * 2) / 3);
        const targetX = this.playerPos.x + Math.cos(angle) * 1.45;
        const targetZ = this.playerPos.z + Math.sin(angle) * 1.45;
        const targetY = this.playerPos.y + 0.85 + Math.sin(this.totalTime * 5 + mb.orbitIndex) * 0.16;
        mb.pos.x = THREE.MathUtils.damp(mb.pos.x, targetX, 6.5, dt);
        mb.pos.y = THREE.MathUtils.damp(mb.pos.y, targetY, 6.5, dt);
        mb.pos.z = THREE.MathUtils.damp(mb.pos.z, targetZ, 6.5, dt);
        mb.group.position.copy(mb.pos);
        mb.group.rotation.y = Math.atan2(this.playerPos.x - mb.pos.x, this.playerPos.z - mb.pos.z);
      }
    }

    if (this.phase !== 'playing') {
      this.animatePlayerVisuals(dt, 0);
      return;
    }

    this.levelTime += dt;
    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) {
        this.bannerText = null;
        this.pushHud(true);
      }
    }

    this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    this.bowCooldown = Math.max(0, this.bowCooldown - dt);

    // Step Active Arrows
    this.stepArrows(dt);

    // ROCKET FLIGHT MODE
    if (this.rocketState === 'flying' && this.rocketRig) {
      this.stepRocketFlight(dt);
      return;
    }

    // Check if player boards parked Rocket
    if (this.rocketRig && this.rocketState === 'parked') {
      const dx = this.playerPos.x - this.rocketPos.x;
      const dy = this.playerPos.y - this.rocketPos.y;
      const dz = this.playerPos.z - this.rocketPos.z;
      if (dx * dx + dz * dz < 3.6 && Math.abs(dy) < 2.2) {
        this.rocketState = 'flying';
        this.perspectiveMode = 'COHETE';
        this.rocketVelX = 0;
        this.rocketVelY = 0;
        this.rocketBoostTimer = 0.4;
        this.active2DZone = null;
        soundEngine.stopHover();
        soundEngine.playRocketBoost();
        soundEngine.setMusicContext(this.currentLevel.theme.biome, true, this.phase);
        this.showBanner('¡Cohete Astro! WASD Maniobrar · Espacio Turbo', 3.2);
        this.pushHud(true);
        return;
      }
    }

    // Check Monkey Suit Pickup
    if (this.monkeyPickup && !this.monkeyPickup.collected) {
      const dx = this.playerPos.x - this.monkeyPickup.pos.x;
      const dy = this.playerPos.y - this.monkeyPickup.pos.y;
      const dz = this.playerPos.z - this.monkeyPickup.pos.z;
      if (dx * dx + dz * dz < 2.1 && Math.abs(dy) < 1.8) {
        this.monkeyPickup.collected = true;
        this.monkeyPickup.group.visible = false;
        this.hasMonkeySuit = true;
        for (const part of this.playerRig.monkeyParts) {
          part.visible = true;
        }
        soundEngine.playMonkeyPickup();
        this.spawnBurst(this.monkeyPickup.pos.x, this.monkeyPickup.pos.y + 0.8, this.monkeyPickup.pos.z, 0x10b981, 24, 5.8);
        this.showBanner('¡Traje de Mono equipado! Trepa por los muros con agarres verdes', 3.6);
        this.pushHud(true);
      }
    }

    // Check Bow Pickup
    if (this.bowPickup && !this.bowPickup.collected) {
      const dx = this.playerPos.x - this.bowPickup.pos.x;
      const dy = this.playerPos.y - this.bowPickup.pos.y;
      const dz = this.playerPos.z - this.bowPickup.pos.z;
      if (dx * dx + dz * dz < 2.0 && Math.abs(dy) < 1.8) {
        this.bowPickup.collected = true;
        this.bowPickup.group.visible = false;
        this.hasBow = true;
        this.playerRig.bowMesh.visible = true;
        soundEngine.playBowPickup();
        this.spawnBurst(this.bowPickup.pos.x, this.bowPickup.pos.y + 0.8, this.bowPickup.pos.z, 0x38bdf8, 22, 5.5);
        this.showBanner('¡Arco Estelar equipado! Pulsa G, R o Clic para disparar', 3.4);
        this.pushHud(true);
      }
    }

    // 2D / 3D ZONE DETECTION
    let foundZone: CameraZone2DDef | null = null;
    for (const z2d of this.currentLevel.zones2D) {
      if (
        this.playerPos.x >= z2d.min[0] &&
        this.playerPos.x <= z2d.max[0] &&
        this.playerPos.y >= z2d.min[1] &&
        this.playerPos.y <= z2d.max[1] &&
        this.playerPos.z >= z2d.min[2] &&
        this.playerPos.z <= z2d.max[2]
      ) {
        foundZone = z2d;
        break;
      }
    }

    if (foundZone !== this.active2DZone) {
      this.active2DZone = foundZone;
      this.perspectiveMode = foundZone ? '2D' : '3D';
      soundEngine.playModeSwitch();
      if (foundZone) {
        this.showBanner('Modo 2D Activado · Usa A / D y Espacio', 2.4);
      } else {
        this.showBanner('Modo 3D Libre', 1.8);
      }
      this.pushHud(true);
    }

    if (this.perspectiveMode === '3D') {
      if (this.keysHeld.has('KeyQ')) this.camYaw += dt * 2.1;
      if (this.keysHeld.has('KeyE')) this.camYaw -= dt * 2.1;
    } else if (this.active2DZone) {
      const targetYaw = this.active2DZone.moveAxis === 'x' ? 0 : Math.PI / 2;
      let diff = targetYaw - this.camYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.camYaw += diff * Math.min(1, dt * 8);
      this.camPitch = THREE.MathUtils.damp(this.camPitch, 0.14, 8, dt);
    }

    let inX = this.touchMoveX;
    let inZ = this.touchMoveZ;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) inX -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) inX += 1;
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) inZ -= 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) inZ += 1;

    if (this.active2DZone) {
      if (this.active2DZone.moveAxis === 'z' && Math.abs(inX) < 0.1 && Math.abs(inZ) > 0.1) {
        inX = -inZ;
      }
      inZ = 0;
    }

    const inLen = Math.hypot(inX, inZ);
    if (inLen > 1) {
      inX /= inLen;
      inZ /= inLen;
    }

    const activeYaw = this.active2DZone
      ? this.active2DZone.moveAxis === 'x'
        ? 0
        : Math.PI / 2
      : this.camYaw;
    const cosY = Math.cos(activeYaw);
    const sinY = Math.sin(activeYaw);
    const worldDirX = inX * cosY + inZ * sinY;
    const worldDirZ = -inX * sinY + inZ * cosY;

    const moveSpeed = 9.2;
    const targetVx = worldDirX * moveSpeed;
    const targetVz = worldDirZ * moveSpeed;

    let onIce = this.grounded && this.standingPlatform?.def.kind === 'ice';
    const accel = onIce ? 2.6 : this.grounded ? 16 : 9;
    this.playerVel.x = THREE.MathUtils.damp(this.playerVel.x, targetVx, accel, dt);
    this.playerVel.z = THREE.MathUtils.damp(this.playerVel.z, targetVz, accel, dt);

    if (inLen > 0.12) {
      const desiredYaw = Math.atan2(worldDirX, worldDirZ);
      let diff = desiredYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerYaw += diff * Math.min(1, dt * 13);
    }

    if (this.grounded && this.standingPlatform) {
      this.playerPos.x += this.standingPlatform.pos.x - this.standingPlatform.prevPos.x;
      this.playerPos.y += this.standingPlatform.pos.y - this.standingPlatform.prevPos.y;
      this.playerPos.z += this.standingPlatform.pos.z - this.standingPlatform.prevPos.z;

      if (this.standingPlatform.def.kind === 'conveyor' && this.standingPlatform.def.conveyorDir) {
        this.playerPos.x += this.standingPlatform.def.conveyorDir[0] * dt;
        this.playerPos.z += this.standingPlatform.def.conveyorDir[1] * dt;
      }
    }

    if (this.grounded) {
      this.coyoteTimer = 0.12;
      this.hoverFuel = Math.min(1, this.hoverFuel + dt * 2.8);
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    this.spinTimer = Math.max(0, this.spinTimer - dt);
    this.spinCooldown = Math.max(0, this.spinCooldown - dt);

    let landedPlatform: PlatformRuntime | null = null;
    let landedOnClimbWall = false;
    let bestGroundShadowY = -999;

    // CLIMBING STATE (Monkey Suit)
    if (this.isClimbing && this.climbingWall) {
      const cw = this.climbingWall;
      const face = cw.def.face;
      const topY = cw.pos.y + cw.halfSize.y;
      const botY = cw.pos.y - cw.halfSize.y;

      soundEngine.stopHover();
      this.isHovering = false;
      this.grounded = false;
      this.standingPlatform = null;
      this.hoverFuel = 1;
      this.playerVel.set(0, 0, 0);

      // Climb vertical (W/Up = -inZ, S/Down = +inZ) and lateral shimmy (A/D = inX)
      const climbInput = -inZ;
      const climbSpeed = 6.2;
      const shimmySpeed = 4.6;
      this.playerPos.y += climbInput * climbSpeed * dt;

      if (face === 'pz') {
        this.playerYaw = Math.PI;
        this.playerPos.z = cw.pos.z + cw.halfSize.z + 0.42;
        this.playerPos.x = THREE.MathUtils.clamp(
          this.playerPos.x + inX * shimmySpeed * dt,
          cw.pos.x - cw.halfSize.x + 0.42,
          cw.pos.x + cw.halfSize.x - 0.42
        );
      } else if (face === 'nz') {
        this.playerYaw = 0;
        this.playerPos.z = cw.pos.z - cw.halfSize.z - 0.42;
        this.playerPos.x = THREE.MathUtils.clamp(
          this.playerPos.x - inX * shimmySpeed * dt,
          cw.pos.x - cw.halfSize.x + 0.42,
          cw.pos.x + cw.halfSize.x - 0.42
        );
      } else if (face === 'px') {
        this.playerYaw = -Math.PI / 2;
        this.playerPos.x = cw.pos.x + cw.halfSize.x + 0.42;
        this.playerPos.z = THREE.MathUtils.clamp(
          this.playerPos.z - inX * shimmySpeed * dt,
          cw.pos.z - cw.halfSize.z + 0.42,
          cw.pos.z + cw.halfSize.z - 0.42
        );
      } else {
        this.playerYaw = Math.PI / 2;
        this.playerPos.x = cw.pos.x - cw.halfSize.x - 0.42;
        this.playerPos.z = THREE.MathUtils.clamp(
          this.playerPos.z + inX * shimmySpeed * dt,
          cw.pos.z - cw.halfSize.z + 0.42,
          cw.pos.z + cw.halfSize.z - 0.42
        );
      }

      if (Math.abs(climbInput) > 0.15 || Math.abs(inX) > 0.15) {
        soundEngine.playClimbStep();
      }

      // Mantle onto top when reaching top edge
      if (this.playerPos.y >= topY - 0.08) {
        this.isClimbing = false;
        this.climbingWall = null;
        this.playerPos.y = topY + 0.06;
        if (face === 'pz') this.playerPos.z -= 0.85;
        else if (face === 'nz') this.playerPos.z += 0.85;
        else if (face === 'px') this.playerPos.x -= 0.85;
        else this.playerPos.x += 0.85;
        this.playerVel.set(0, 3.2, 0);
        this.grounded = true;
        soundEngine.playJump();
        this.spawnBurst(this.playerPos.x, this.playerPos.y, this.playerPos.z, 0x10b981, 10, 3.0);
        this.pushHud(true);
      } else if (this.jumpBufferTimer > 0) {
        // Wall-jump off climbable wall
        this.jumpBufferTimer = 0;
        this.isClimbing = false;
        this.climbingWall = null;
        const kick = 7.2;
        this.playerVel.y = 12.0;
        if (face === 'pz') this.playerVel.z = kick;
        else if (face === 'nz') this.playerVel.z = -kick;
        else if (face === 'px') this.playerVel.x = kick;
        else this.playerVel.x = -kick;
        soundEngine.playJump();
        this.pushHud(true);
      } else if (this.playerPos.y < botY + 0.15 && climbInput < -0.1) {
        this.isClimbing = false;
        this.climbingWall = null;
        if (face === 'pz') this.playerPos.z += 0.3;
        else if (face === 'nz') this.playerPos.z -= 0.3;
        else if (face === 'px') this.playerPos.x += 0.3;
        else this.playerPos.x -= 0.3;
        this.pushHud(true);
      }

      this.contactShadowMesh.visible = false;
    } else {
      if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
        this.playerVel.y = 12.6;
        this.grounded = false;
        this.standingPlatform = null;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.playerSquash.set(0.78, 1.32, 0.78);
        soundEngine.playJump();
        this.spawnBurst(this.playerPos.x, this.playerPos.y + 0.1, this.playerPos.z, 0xe0f2fe, 8, 2.6);
      }

      const jumpHeld = this.keysHeld.has('Space') || this.touchJumpHeld;
      if (!this.grounded && jumpHeld && this.playerVel.y < 1.8 && this.hoverFuel > 0) {
        this.isHovering = true;
        this.hoverFuel = Math.max(0, this.hoverFuel - dt * 1.08);
        this.playerVel.y = THREE.MathUtils.damp(this.playerVel.y, -0.65, 14, dt);
        soundEngine.startHover();
      } else {
        if (this.isHovering) soundEngine.stopHover();
        this.isHovering = false;
        this.playerVel.y -= 31.0 * dt;
      }

      const prevY = this.playerPos.y;
      this.playerPos.x += this.playerVel.x * dt;
      this.playerPos.z += this.playerVel.z * dt;
      this.playerPos.y += this.playerVel.y * dt;

      if (this.active2DZone) {
        if (this.active2DZone.moveAxis === 'x') {
          this.playerPos.z = THREE.MathUtils.damp(this.playerPos.z, this.active2DZone.lockCoord, 12, dt);
        } else {
          this.playerPos.x = THREE.MathUtils.damp(this.playerPos.x, this.active2DZone.lockCoord, 12, dt);
        }
      }

      const playerRadius = 0.38;
      const playerHeight = 1.45;

      for (const p of this.platforms) {
        if (!p.visible) continue;
        const minX = p.pos.x - p.halfSize.x - playerRadius;
        const maxX = p.pos.x + p.halfSize.x + playerRadius;
        const minZ = p.pos.z - p.halfSize.z - playerRadius;
        const maxZ = p.pos.z + p.halfSize.z + playerRadius;
        const topY = p.pos.y + p.halfSize.y;
        const botY = p.pos.y - p.halfSize.y;

        if (
          this.playerPos.x >= p.pos.x - p.halfSize.x &&
          this.playerPos.x <= p.pos.x + p.halfSize.x &&
          this.playerPos.z >= p.pos.z - p.halfSize.z &&
          this.playerPos.z <= p.pos.z + p.halfSize.z &&
          topY <= this.playerPos.y + 0.15
        ) {
          if (topY > bestGroundShadowY) bestGroundShadowY = topY;
        }

        const insideXZ =
          this.playerPos.x >= minX &&
          this.playerPos.x <= maxX &&
          this.playerPos.z >= minZ &&
          this.playerPos.z <= maxZ;
        if (!insideXZ) continue;

        if (this.playerVel.y <= 0 && prevY >= topY - 0.35 && this.playerPos.y <= topY + 0.08) {
          this.playerPos.y = topY;
          if (!this.grounded && this.playerVel.y < -4.2) {
            this.playerSquash.set(1.26, 0.74, 1.26);
            soundEngine.playLand(Math.abs(this.playerVel.y));
          }
          this.playerVel.y = 0;
          landedPlatform = p;
        } else if (this.playerVel.y > 0 && prevY + playerHeight <= botY + 0.2 && this.playerPos.y + playerHeight >= botY) {
          this.playerPos.y = botY - playerHeight;
          this.playerVel.y = -1;
        } else if (this.playerPos.y < topY - 0.15 && this.playerPos.y + playerHeight > botY + 0.15) {
          const dxMin = Math.abs(this.playerPos.x - minX);
          const dxMax = Math.abs(maxX - this.playerPos.x);
          const dzMin = Math.abs(this.playerPos.z - minZ);
          const dzMax = Math.abs(maxZ - this.playerPos.z);
          const m = Math.min(dxMin, dxMax, dzMin, dzMax);
          if (m === dxMin) {
            this.playerPos.x = minX;
            this.playerVel.x = Math.min(0, this.playerVel.x);
          } else if (m === dxMax) {
            this.playerPos.x = maxX;
            this.playerVel.x = Math.max(0, this.playerVel.x);
          } else if (m === dzMin) {
            this.playerPos.z = minZ;
            this.playerVel.z = Math.min(0, this.playerVel.z);
          } else {
            this.playerPos.z = maxZ;
            this.playerVel.z = Math.max(0, this.playerVel.z);
          }
        }
      }

      // ClimbWall Solid Collision + Monkey Suit Latching
      for (const cw of this.climbWalls) {
        const minX = cw.pos.x - cw.halfSize.x - playerRadius;
        const maxX = cw.pos.x + cw.halfSize.x + playerRadius;
        const minZ = cw.pos.z - cw.halfSize.z - playerRadius;
        const maxZ = cw.pos.z + cw.halfSize.z + playerRadius;
        const topY = cw.pos.y + cw.halfSize.y;
        const botY = cw.pos.y - cw.halfSize.y;

        if (
          this.playerPos.x >= cw.pos.x - cw.halfSize.x &&
          this.playerPos.x <= cw.pos.x + cw.halfSize.x &&
          this.playerPos.z >= cw.pos.z - cw.halfSize.z &&
          this.playerPos.z <= cw.pos.z + cw.halfSize.z &&
          topY <= this.playerPos.y + 0.15
        ) {
          if (topY > bestGroundShadowY) bestGroundShadowY = topY;
        }

        const insideXZ =
          this.playerPos.x >= minX &&
          this.playerPos.x <= maxX &&
          this.playerPos.z >= minZ &&
          this.playerPos.z <= maxZ;

        if (insideXZ) {
          if (this.playerVel.y <= 0 && prevY >= topY - 0.35 && this.playerPos.y <= topY + 0.08) {
            this.playerPos.y = topY;
            if (!this.grounded && this.playerVel.y < -4.2) {
              this.playerSquash.set(1.26, 0.74, 1.26);
              soundEngine.playLand(Math.abs(this.playerVel.y));
            }
            this.playerVel.y = 0;
            this.grounded = true;
            landedOnClimbWall = true;
          } else if (this.playerPos.y < topY - 0.15 && this.playerPos.y + playerHeight > botY + 0.15) {
            const dxMin = Math.abs(this.playerPos.x - minX);
            const dxMax = Math.abs(maxX - this.playerPos.x);
            const dzMin = Math.abs(this.playerPos.z - minZ);
            const dzMax = Math.abs(maxZ - this.playerPos.z);
            const m = Math.min(dxMin, dxMax, dzMin, dzMax);
            if (m === dxMin) this.playerPos.x = minX;
            else if (m === dxMax) this.playerPos.x = maxX;
            else if (m === dzMin) this.playerPos.z = minZ;
            else this.playerPos.z = maxZ;
          }
        }

        // Check latch onto climbable face if wearing Monkey Suit
        if (this.hasMonkeySuit && !this.isClimbing && this.playerPos.y >= botY - 0.25 && this.playerPos.y <= topY - 0.35) {
          const face = cw.def.face;
          const pushingIntoWall =
            (face === 'pz' && worldDirZ < -0.2) ||
            (face === 'nz' && worldDirZ > 0.2) ||
            (face === 'px' && worldDirX < -0.2) ||
            (face === 'nx' && worldDirX > 0.2) ||
            !this.grounded;

          if (pushingIntoWall) {
            const nearPz =
              face === 'pz' &&
              Math.abs(this.playerPos.z - (cw.pos.z + cw.halfSize.z + 0.4)) < 0.38 &&
              Math.abs(this.playerPos.x - cw.pos.x) <= cw.halfSize.x - 0.2;
            const nearNz =
              face === 'nz' &&
              Math.abs(this.playerPos.z - (cw.pos.z - cw.halfSize.z - 0.4)) < 0.38 &&
              Math.abs(this.playerPos.x - cw.pos.x) <= cw.halfSize.x - 0.2;
            const nearPx =
              face === 'px' &&
              Math.abs(this.playerPos.x - (cw.pos.x + cw.halfSize.x + 0.4)) < 0.38 &&
              Math.abs(this.playerPos.z - cw.pos.z) <= cw.halfSize.z - 0.2;
            const nearNx =
              face === 'nx' &&
              Math.abs(this.playerPos.x - (cw.pos.x - cw.halfSize.x - 0.4)) < 0.38 &&
              Math.abs(this.playerPos.z - cw.pos.z) <= cw.halfSize.z - 0.2;

            if (nearPz || nearNz || nearPx || nearNx) {
              this.isClimbing = true;
              this.climbingWall = cw;
              this.grounded = false;
              this.playerVel.set(0, 0, 0);
              soundEngine.playClimbStep();
              this.pushHud(true);
              break;
            }
          }
        }
      }

      if (!this.isClimbing) {
        this.grounded = landedPlatform !== null || landedOnClimbWall || bestGroundShadowY >= this.playerPos.y - 0.05;
        this.standingPlatform = landedPlatform;
        onIce = this.grounded && this.standingPlatform?.def.kind === 'ice';

        if (landedPlatform && landedPlatform.def.kind === 'crumble' && landedPlatform.crumbleState === 'idle') {
          landedPlatform.crumbleState = 'shaking';
          landedPlatform.crumbleTimer = 0.75;
        }

        if (bestGroundShadowY > -900) {
          this.contactShadowMesh.visible = true;
          this.contactShadowMesh.position.set(this.playerPos.x, bestGroundShadowY + 0.025, this.playerPos.z);
          const heightAbove = Math.max(0, this.playerPos.y - bestGroundShadowY);
          const scale = THREE.MathUtils.clamp(1.0 - heightAbove * 0.08, 0.35, 1.0);
          this.contactShadowMesh.scale.setScalar(scale);
          (this.contactShadowMesh.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.clamp(
            0.72 - heightAbove * 0.07,
            0.18,
            0.72
          );
        } else {
          this.contactShadowMesh.visible = false;
        }
      }
    }

    for (const jp of this.jumpPads) {
      const distSq = (this.playerPos.x - jp.pos.x) ** 2 + (this.playerPos.z - jp.pos.z) ** 2;
      if (distSq < 1.05 && Math.abs(this.playerPos.y - jp.pos.y) < 0.75) {
        this.playerVel.y = jp.boost;
        this.grounded = false;
        this.standingPlatform = null;
        this.hoverFuel = 1;
        jp.bounceAnim = 1;
        this.playerSquash.set(0.7, 1.4, 0.7);
        soundEngine.playBounce();
        this.spawnBurst(jp.pos.x, jp.pos.y + 0.3, jp.pos.z, 0x22d3ee, 14, 5.0);
      }
    }

    for (const cr of this.crates) {
      if (cr.broken) continue;
      const dx = this.playerPos.x - cr.pos.x;
      const dz = this.playerPos.z - cr.pos.z;
      const horizSq = dx * dx + dz * dz;
      const dy = this.playerPos.y - cr.pos.y;
      const hitBySpin = this.spinTimer > 0 && horizSq < 2.2 && dy > -0.6 && dy < 1.5;
      const hitByStomp = this.playerVel.y < -1 && horizSq < 0.85 && dy > 0.5 && dy < 1.3;
      if (hitBySpin || hitByStomp) {
        this.breakCrate(cr);
        if (hitByStomp) this.playerVel.y = 9.5;
      }
    }

    this.collectNearbyCoins(this.playerPos.x, this.playerPos.y + 0.7, this.playerPos.z, 1.15);

    for (const mb of this.miniBots) {
      if (mb.rescued) continue;
      const dx = this.playerPos.x - mb.homePos.x;
      const dy = this.playerPos.y + 0.5 - mb.homePos.y;
      const dz = this.playerPos.z - mb.homePos.z;
      if (dx * dx + dy * dy + dz * dz < 1.95) {
        mb.rescued = true;
        mb.pos.copy(mb.homePos);
        mb.beacon.visible = false;
        mb.visorGlow.color.setHex(0x38bdf8);
        mb.visorGlow.emissive.setHex(0x0ea5e9);
        this.botsRescued++;
        soundEngine.playBotRescue();
        this.spawnBurst(mb.homePos.x, mb.homePos.y + 0.7, mb.homePos.z, 0x38bdf8, 22, 6.0);
        this.showBanner(`¡${mb.name} rescatado!`);
        this.pushHud(true);
      }
    }

    for (const cp of this.checkpoints) {
      if (cp.activated) continue;
      const dx = this.playerPos.x - cp.pos.x;
      const dz = this.playerPos.z - cp.pos.z;
      if (dx * dx + dz * dz < 2.2 && Math.abs(this.playerPos.y - cp.pos.y) < 1.8) {
        cp.activated = true;
        cp.flagMat.color.setHex(0x22c55e);
        cp.flagMat.emissive.setHex(0x16a34a);
        this.spawnPos.set(cp.pos.x, cp.pos.y + 1.0, cp.pos.z);
        this.checkpointActive = true;
        soundEngine.playCheckpoint();
        this.spawnBurst(cp.pos.x, cp.pos.y + 1.4, cp.pos.z, 0x4ade80, 14, 4.5);
        this.showBanner('Punto de control activado');
      }
    }

    for (const en of this.enemies) {
      if (!en.alive) continue;
      const t = this.totalTime * en.speed + en.phase;
      const s = Math.sin(t);
      en.pos.set(
        en.basePos.x + en.patrolOffset.x * s,
        en.basePos.y + en.patrolOffset.y * s,
        en.basePos.z + en.patrolOffset.z * s
      );

      if (en.kind === 'hopper') {
        en.hopPhase += dt * 4.2;
        const cycle = (en.hopPhase % Math.PI) / Math.PI;
        if (cycle < 0.25 && en.springGroup) {
          en.springGroup.scale.set(1.18, 0.72, 1.18);
          en.pos.y = en.basePos.y;
        } else {
          if (en.springGroup) en.springGroup.scale.set(0.95, 1.08, 0.95);
          en.pos.y = en.basePos.y + Math.sin(((cycle - 0.25) / 0.75) * Math.PI) * 1.25;
        }
      } else if (en.kind === 'chomper') {
        if (en.jawUpper) {
          en.jawUpper.rotation.x = -0.15 - Math.abs(Math.sin(this.totalTime * 7.5)) * 0.28;
        }
        if (en.windupKey) {
          en.windupKey.rotation.y += dt * 5.0;
        }
      }

      en.group.position.copy(en.pos);
      if (Math.abs(en.patrolOffset.z) > Math.abs(en.patrolOffset.x)) {
        en.group.rotation.y = Math.cos(t) >= 0 ? 0 : Math.PI;
      } else {
        en.group.rotation.y = Math.cos(t) >= 0 ? Math.PI / 2 : -Math.PI / 2;
      }

      const dx = this.playerPos.x - en.pos.x;
      const dz = this.playerPos.z - en.pos.z;
      const horizDistSq = dx * dx + dz * dz;
      const dy = this.playerPos.y - en.pos.y;
      const hitRadiusSq = en.kind === 'brute' ? 1.35 : 0.85;

      if (en.hitFlash > 0) {
        en.hitFlash -= dt;
        en.group.visible = Math.floor(en.hitFlash * 24) % 2 === 0;
      } else {
        en.group.visible = true;
      }

      if (this.isHovering && horizDistSq < hitRadiusSq && dy > 0.4 && dy < 3.1) {
        this.damageEnemy(en);
        continue;
      }
      if (this.spinTimer > 0 && en.kind !== 'spiky' && horizDistSq < (en.kind === 'brute' ? 2.6 : 2.1) && Math.abs(dy) < 1.3) {
        this.damageEnemy(en);
        continue;
      }
      if (this.playerVel.y < -0.5 && horizDistSq < (en.kind === 'brute' ? 1.35 : 0.9) && dy > 0.35 && dy < (en.kind === 'brute' ? 1.55 : 1.15)) {
        if (en.kind === 'spiky') {
          this.damagePlayer(dx, dz);
        } else {
          this.damageEnemy(en);
          this.playerVel.y = 10.8;
        }
        continue;
      }
      if (horizDistSq < (en.kind === 'brute' ? 1.05 : 0.72) && Math.abs(dy) < (en.kind === 'brute' ? 1.3 : 0.95)) {
        this.damagePlayer(dx, dz);
      }
    }

    // FINAL BOSS ("Titán Kraxus") AI & Combat
    if (this.bossRuntime && this.bossRuntime.alive) {
      this.stepBoss(dt);
    }

    for (const lz of this.lasers) {
      if (!lz.active) continue;
      const dy = Math.abs(this.playerPos.y + 0.65 - lz.pos.y);
      if (dy < 0.65) {
        if (lz.axis === 'x') {
          if (Math.abs(this.playerPos.z - lz.pos.z) < 0.48 && Math.abs(this.playerPos.x - lz.pos.x) < lz.length / 2) {
            this.damagePlayer(0, 1);
          }
        } else {
          if (Math.abs(this.playerPos.x - lz.pos.x) < 0.48 && Math.abs(this.playerPos.z - lz.pos.z) < lz.length / 2) {
            this.damagePlayer(1, 0);
          }
        }
      }
    }

    if (this.playerPos.y < this.currentLevel.theme.hazardFloorY + 0.4) {
      this.handleFallDamage();
    }

    if (this.goalPortal && !this.goalPortal.locked) {
      const dx = this.playerPos.x - this.goalPortal.pos.x;
      const dy = this.playerPos.y - this.goalPortal.pos.y;
      const dz = this.playerPos.z - this.goalPortal.pos.z;
      if (dx * dx + dz * dz < 2.9 && Math.abs(dy) < 2.2) {
        soundEngine.stopHover();
        soundEngine.playVictory();
        this.spawnBurst(this.goalPortal.pos.x, this.goalPortal.pos.y + 1.5, this.goalPortal.pos.z, 0xfacc15, 36, 7.5);
        this.phase = 'victory';
        soundEngine.setMusicContext(this.currentLevel.theme.biome, false, 'victory', false);
        this.pushHud(true);
        this.onLevelComplete({
          levelIndex: this.currentLevel.index,
          coins: this.coinsCollected,
          totalCoins: this.totalLevelCoins,
          bots: this.botsRescued,
          totalBots: this.currentLevel.miniBots.length,
          time: this.levelTime,
        });
        return;
      }
    }

    const groundSpeed = Math.hypot(this.playerVel.x, this.playerVel.z);
    if (this.grounded && groundSpeed > 2.4 && !this.isClimbing) {
      soundEngine.playFootstep(onIce);
    }
    this.animatePlayerVisuals(dt, groundSpeed);
  }

  private stepArrows(dt: number) {
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const ar = this.arrows[i];
      ar.life -= dt;
      ar.pos.addScaledVector(ar.vel, dt);
      ar.mesh.position.copy(ar.pos);

      let remove = ar.life <= 0;

      // Hit Archery Targets
      if (!remove) {
        for (const tg of this.targets) {
          if (tg.hit) continue;
          const dx = ar.pos.x - tg.pos.x;
          const dy = ar.pos.y - (tg.pos.y + 1.65);
          const dz = ar.pos.z - tg.pos.z;
          if (dx * dx + dy * dy + dz * dz < 1.65) {
            tg.hit = true;
            tg.ringMat.color.setHex(0x22c55e);
            tg.ringMat.emissive.setHex(0x16a34a);
            this.coinsCollected += tg.coins;
            soundEngine.playTargetHit();
            this.spawnBurst(tg.pos.x, tg.pos.y + 1.65, tg.pos.z, 0x4ade80, 22, 6.0);

            // Activate linked platforms
            for (const p of this.platforms) {
              if (p.def.linkedTargetId === tg.id) {
                p.visible = true;
                (p.mesh.material as THREE.MeshStandardMaterial).opacity = 0.82;
                p.mesh.castShadow = !this.isSoftwareGl;
                this.spawnBurst(p.pos.x, p.pos.y + 0.5, p.pos.z, 0x38bdf8, 18, 5.0);
              }
            }
            this.showBanner('¡Diana acertada! Puente activado');
            this.pushHud(true);
            remove = true;
            break;
          }
        }
      }

      // Hit Enemies (even Spiky!)
      if (!remove) {
        for (const en of this.enemies) {
          if (!en.alive) continue;
          const dx = ar.pos.x - en.pos.x;
          const dy = ar.pos.y - (en.pos.y + 0.65);
          const dz = ar.pos.z - en.pos.z;
          if (dx * dx + dy * dy + dz * dz < (en.kind === 'brute' ? 1.55 : 1.05)) {
            this.damageEnemy(en);
            remove = true;
            break;
          }
        }
      }

      // Hit Boss Core
      if (!remove && this.bossRuntime && this.bossRuntime.alive && this.bossRuntime.active) {
        const b = this.bossRuntime;
        const dx = ar.pos.x - b.pos.x;
        const dy = ar.pos.y - (b.pos.y + 2.1);
        const dz = ar.pos.z - b.pos.z;
        if (dx * dx + dy * dy + dz * dz < 3.4) {
          this.damageBoss();
          remove = true;
        }
      }

      // Hit Crates
      if (!remove) {
        for (const cr of this.crates) {
          if (cr.broken) continue;
          const dx = ar.pos.x - cr.pos.x;
          const dy = ar.pos.y - (cr.pos.y + 0.5);
          const dz = ar.pos.z - cr.pos.z;
          if (dx * dx + dy * dy + dz * dz < 1.1) {
            this.breakCrate(cr);
            remove = true;
            break;
          }
        }
      }

      if (remove) {
        this.levelGroup.remove(ar.mesh);
        ar.mesh.traverse((o) => {
          if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose();
          const m = (o as THREE.Mesh).material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else if (m) m.dispose();
        });
        this.arrows.splice(i, 1);
      }
    }
  }

  private breakCrate(cr: CrateRuntime) {
    cr.broken = true;
    cr.mesh.visible = false;
    this.coinsCollected += cr.coins;
    this.hitstopTimer = 0.04;
    this.shakeIntensity = 0.22;
    soundEngine.playCrateBreak();
    soundEngine.playCoin();
    this.spawnBurst(cr.pos.x, cr.pos.y + 0.5, cr.pos.z, 0xf59e0b, 16, 5.5);
    this.pushHud(true);
  }

  private stepRocketFlight(dt: number) {
    if (!this.rocketRig) return;

    let steerX = this.touchMoveX;
    let steerY = -this.touchMoveZ;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) steerX -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) steerX += 1;
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) steerY += 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) steerY -= 1;

    this.rocketVelX = THREE.MathUtils.damp(this.rocketVelX, steerX * 10.5, 9, dt);
    this.rocketVelY = THREE.MathUtils.damp(this.rocketVelY, steerY * 8.5, 9, dt);

    const boosting = this.rocketBoostTimer > 0;
    if (boosting) this.rocketBoostTimer -= dt;

    const forwardSpeed = this.rocketCruiseSpeed * (boosting ? 1.38 : 1.0);
    this.rocketPos.x = THREE.MathUtils.clamp(this.rocketPos.x + this.rocketVelX * dt, -8.5, 8.5);
    this.rocketPos.y = THREE.MathUtils.clamp(this.rocketPos.y + this.rocketVelY * dt, 3.0, 14.5);
    this.rocketPos.z -= forwardSpeed * dt;

    this.rocketRig.root.position.copy(this.rocketPos);
    this.rocketRig.hullGroup.rotation.z = THREE.MathUtils.damp(
      this.rocketRig.hullGroup.rotation.z,
      -this.rocketVelX * 0.045,
      10,
      dt
    );
    this.rocketRig.hullGroup.rotation.x = THREE.MathUtils.damp(
      this.rocketRig.hullGroup.rotation.x,
      this.rocketVelY * 0.035,
      10,
      dt
    );

    this.rocketRig.flameL.visible = true;
    this.rocketRig.flameR.visible = true;
    const fScale = (boosting ? 1.65 : 1.0) + Math.sin(this.totalTime * 40) * 0.2;
    this.rocketRig.flameL.scale.set(1, 1, fScale);
    this.rocketRig.flameR.scale.set(1, 1, fScale);
    if (Math.random() < 0.55) {
      this.spawnBurst(this.rocketPos.x, this.rocketPos.y + 0.55, this.rocketPos.z + 2.0, 0x38bdf8, 1, 1.4);
    }

    this.playerPos.set(this.rocketPos.x, this.rocketPos.y + 0.45, this.rocketPos.z - 0.05);
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.bodyGroup.rotation.y = Math.PI;
    this.playerRig.bodyGroup.scale.setScalar(0.85);
    this.playerRig.hoverBeam.visible = false;
    this.contactShadowMesh.visible = false;

    this.collectNearbyCoins(this.rocketPos.x, this.rocketPos.y + 0.6, this.rocketPos.z, 6.2);

    for (const rg of this.boostRings) {
      if (rg.passed) continue;
      if (this.rocketPos.distanceToSquared(rg.pos) < 9.5) {
        rg.passed = true;
        this.rocketBoostTimer = 0.6;
        this.coinsCollected += 2;
        soundEngine.playRocketBoost();
        this.spawnBurst(rg.pos.x, rg.pos.y, rg.pos.z, 0xfacc15, 18, 6.0);
        this.pushHud(true);
      }
    }

    for (const m of this.mines) {
      if (m.exploded) continue;
      if (this.rocketPos.distanceToSquared(m.pos) < 3.2) {
        m.exploded = true;
        m.group.visible = false;
        this.damagePlayer(0, 1);
      }
    }

    if (this.rocketPos.z <= this.rocketLandingPos.z + 1.5) {
      this.rocketState = 'landed';
      this.perspectiveMode = '3D';
      this.rocketRig.flameL.visible = false;
      this.rocketRig.flameR.visible = false;
      this.rocketRig.root.position.set(this.rocketLandingPos.x, this.rocketLandingPos.y + 0.2, this.rocketLandingPos.z + 2.5);
      this.rocketRig.hullGroup.rotation.set(0, 0, 0);

      this.playerRig.bodyGroup.scale.setScalar(1);
      this.playerPos.set(this.rocketLandingPos.x, this.rocketLandingPos.y + 1.0, this.rocketLandingPos.z);
      this.playerVel.set(0, 4.5, -2.5);
      this.spawnPos.copy(this.playerPos);
      this.checkpointActive = true;
      soundEngine.playCheckpoint();
      soundEngine.setMusicContext(this.currentLevel.theme.biome, false, this.phase);
      this.showBanner('¡Aterrizaje perfecto!');
      this.pushHud(true);
    }
  }

  private collectNearbyCoins(px: number, py: number, pz: number, radiusSq: number) {
    for (const c of this.coins) {
      if (c.collected) continue;
      const dx = px - c.pos.x;
      const dy = py - c.pos.y;
      const dz = pz - c.pos.z;
      if (dx * dx + dy * dy + dz * dz < radiusSq) {
        c.collected = true;
        c.mesh.visible = false;
        this.coinsCollected++;
        soundEngine.playCoin();
        this.spawnBurst(c.pos.x, c.pos.y, c.pos.z, 0xfacc15, 10, 4.0);
        this.pushHud(true);
      }
    }
  }

  private damageEnemy(en: EnemyRuntime) {
    if (en.hitFlash > 0) return;
    en.hp -= 1;
    if (en.hp <= 0) {
      this.defeatEnemy(en);
      return;
    }
    en.hitFlash = 0.45;
    this.hitstopTimer = 0.035;
    this.shakeIntensity = 0.2;
    soundEngine.playEnemyHit();
    this.spawnBurst(en.pos.x, en.pos.y + 0.7, en.pos.z, 0xf97316, 12, 4.5);
  }

  private defeatEnemy(en: EnemyRuntime) {
    en.alive = false;
    en.group.visible = false;
    this.hitstopTimer = 0.045;
    this.shakeIntensity = 0.25;
    soundEngine.playEnemyHit();
    this.spawnBurst(en.pos.x, en.pos.y + 0.5, en.pos.z, 0xf43f5e, 18, 5.5);
  }

  private stepBoss(dt: number) {
    const b = this.bossRuntime;
    if (!b || !b.alive) return;

    const dxToPlayer = this.playerPos.x - b.arenaCenter.x;
    const dzToPlayer = this.playerPos.z - b.arenaCenter.z;
    const playerInArena =
      Math.hypot(dxToPlayer, dzToPlayer) < b.arenaRadius + 1.5 &&
      this.playerPos.y >= b.arenaCenter.y - 1.5;

    if (!b.active) {
      b.rig.dorsalRing.rotation.z += dt * 1.4;
      b.rig.root.position.copy(b.pos);
      if (playerInArena) {
        b.active = true;
        b.state = 'chase';
        b.stateTimer = 2.2;
        soundEngine.setMusicContext(this.currentLevel.theme.biome, false, this.phase, true);
        this.showBanner(`¡JEFE FINAL: ${b.name}! Golpea su núcleo o salta sobre su cabeza`, 3.6);
        this.pushHud(true);
      }
      return;
    }

    b.invulnTimer = Math.max(0, b.invulnTimer - dt);
    b.rig.dorsalRing.rotation.z += dt * (b.state === 'charge' ? 5.5 : 2.2);
    if (b.invulnTimer > 0) {
      b.rig.armorMat.emissive.setHex(Math.floor(b.invulnTimer * 24) % 2 === 0 ? 0xffffff : 0x000000);
      b.rig.armorMat.emissiveIntensity = 0.65;
    } else {
      b.rig.armorMat.emissive.setHex(0x000000);
      b.rig.armorMat.emissiveIntensity = 0;
    }

    const toPlayerX = this.playerPos.x - b.pos.x;
    const toPlayerZ = this.playerPos.z - b.pos.z;
    const dist = Math.hypot(toPlayerX, toPlayerZ) || 1;
    const desiredYaw = Math.atan2(toPlayerX, toPlayerZ);

    b.stateTimer -= dt;
    b.rig.shockwaveRing.visible = false;

    if (b.state === 'chase') {
      b.rig.root.rotation.y = desiredYaw;
      const spd = 3.8 + (b.maxHp - b.hp) * 0.45;
      b.pos.x += (toPlayerX / dist) * spd * dt;
      b.pos.z += (toPlayerZ / dist) * spd * dt;
      const swing = Math.sin(this.totalTime * 7);
      b.rig.leftLeg.rotation.x = swing * 0.45;
      b.rig.rightLeg.rotation.x = -swing * 0.45;
      b.rig.leftArm.rotation.x = -swing * 0.5;
      b.rig.rightArm.rotation.x = swing * 0.5;
      b.rig.bodyGroup.position.y = Math.abs(swing) * 0.12;
      b.rig.coreMat.color.setHex(0xfbbf24);

      if (b.stateTimer <= 0) {
        b.state = 'windup';
        b.stateTimer = 0.85;
      }
    } else if (b.state === 'windup') {
      b.rig.root.rotation.y = desiredYaw;
      b.rig.bodyGroup.position.y = -0.25 + Math.sin(this.totalTime * 30) * 0.06;
      b.rig.leftArm.rotation.x = -2.2;
      b.rig.rightArm.rotation.x = -2.2;
      b.rig.coreMat.color.setHex(0xff2a55);
      if (b.stateTimer <= 0) {
        b.state = 'shockwave';
        b.stateTimer = 1.4;
        b.shockwaveRadius = 1.4;
        this.shakeIntensity = 0.45;
        soundEngine.playShockwave();
        this.spawnBurst(b.pos.x, b.pos.y + 0.4, b.pos.z, 0xff2a55, 22, 6.5);
      }
    } else if (b.state === 'shockwave') {
      b.rig.bodyGroup.position.y = 0;
      b.rig.leftArm.rotation.x = -0.4;
      b.rig.rightArm.rotation.x = -0.4;
      b.shockwaveRadius += 9.8 * dt;
      b.rig.shockwaveRing.visible = true;
      b.rig.shockwaveRing.scale.setScalar(b.shockwaveRadius);
      b.rig.shockwaveMat.opacity = Math.max(0, 1 - b.shockwaveRadius / 14);

      // Jump-over shockwave damage check
      if (Math.abs(dist - b.shockwaveRadius) < 0.85 && this.playerPos.y < b.arenaCenter.y + 1.15) {
        this.damagePlayer(toPlayerX, toPlayerZ);
      }
      if (b.stateTimer <= 0) {
        b.state = 'charge';
        b.stateTimer = 1.05;
        b.chargeDir.set(toPlayerX / dist, 0, toPlayerZ / dist);
        b.rig.root.rotation.y = Math.atan2(b.chargeDir.x, b.chargeDir.z);
      }
    } else if (b.state === 'charge') {
      const chargeSpeed = 10.6;
      b.pos.x += b.chargeDir.x * chargeSpeed * dt;
      b.pos.z += b.chargeDir.z * chargeSpeed * dt;
      b.rig.leftArm.rotation.x = -1.4;
      b.rig.rightArm.rotation.x = -1.4;
      b.rig.bodyGroup.position.y = Math.abs(Math.sin(this.totalTime * 16)) * 0.16;
      if (b.stateTimer <= 0) {
        b.state = 'recover';
        b.stateTimer = 1.6;
      }
    } else if (b.state === 'recover') {
      b.rig.bodyGroup.position.y = -0.35;
      b.rig.leftArm.rotation.x = 0.2;
      b.rig.rightArm.rotation.x = 0.2;
      b.rig.coreMat.color.setHex(0x38bdf8);
      if (b.stateTimer <= 0) {
        b.state = 'chase';
        b.stateTimer = 2.2;
      }
    }

    // Clamp boss inside arena bounds
    const offX = b.pos.x - b.arenaCenter.x;
    const offZ = b.pos.z - b.arenaCenter.z;
    const offLen = Math.hypot(offX, offZ);
    const maxOffset = b.arenaRadius - 2.0;
    if (offLen > maxOffset) {
      b.pos.x = b.arenaCenter.x + (offX / offLen) * maxOffset;
      b.pos.z = b.arenaCenter.z + (offZ / offLen) * maxOffset;
    }
    b.rig.root.position.copy(b.pos);

    // Player vs Boss collision & weak-point hits
    const horizDistSq = toPlayerX * toPlayerX + toPlayerZ * toPlayerZ;
    const dy = this.playerPos.y - b.pos.y;

    // 1. Stomp on Boss Head
    if (this.playerVel.y < -0.5 && horizDistSq < 3.0 && dy > 2.4 && dy < 4.6) {
      this.damageBoss();
      this.playerVel.y = 12.8;
      this.hoverFuel = 1;
      return;
    }

    // 2. Spin Attack against Boss Core/Torso
    if (this.spinTimer > 0 && horizDistSq < 5.0 && dy >= -0.4 && dy < 2.8) {
      this.damageBoss();
      this.playerVel.set((toPlayerX / dist) * 7.5, 6.5, (toPlayerZ / dist) * 7.5);
      return;
    }

    // 3. Body Contact Damage
    if (horizDistSq < 2.6 && dy >= -0.5 && dy < 2.7) {
      this.damagePlayer(toPlayerX, toPlayerZ);
    }
  }

  private damageBoss() {
    const b = this.bossRuntime;
    if (!b || !b.alive || b.invulnTimer > 0) return;

    b.hp -= 1;
    b.invulnTimer = 0.85;
    this.hitstopTimer = 0.06;
    this.shakeIntensity = 0.45;
    this.spawnBurst(b.pos.x, b.pos.y + 2.2, b.pos.z, 0xfbbf24, 28, 7.0);

    if (b.hp <= 0) {
      b.alive = false;
      b.rig.root.visible = false;
      soundEngine.playBossDefeat();
      this.spawnBurst(b.pos.x, b.pos.y + 2.4, b.pos.z, 0xf43f5e, 45, 9.5);
      this.spawnBurst(b.pos.x, b.pos.y + 2.4, b.pos.z, 0x38bdf8, 45, 9.0);
      this.coinsCollected += 15;
      if (this.goalPortal) {
        this.goalPortal.locked = false;
        this.goalPortal.vortex.visible = true;
        this.goalPortal.portalMat.color.setHex(0x38bdf8);
        this.goalPortal.portalMat.emissive.setHex(0x0ea5e9);
      }
      soundEngine.setMusicContext(this.currentLevel.theme.biome, false, this.phase, false);
      this.showBanner(`¡${b.name} derrotado! Portal Estelar desbloqueado`, 4.2);
    } else {
      soundEngine.playBossHit();
      this.showBanner(`¡Impacto a ${b.name}! (${b.hp}/${b.maxHp})`, 1.8);
    }
    this.pushHud(true);
  }

  private damagePlayer(knockX: number, knockZ: number) {
    if (this.invulnTimer > 0) return;
    this.health = Math.max(0, this.health - 1);
    this.invulnTimer = 1.45;
    this.hitstopTimer = 0.05;
    this.shakeIntensity = 0.38;
    soundEngine.playHurt();
    this.spawnBurst(this.playerPos.x, this.playerPos.y + 0.7, this.playerPos.z, 0xff2a55, 16, 5.0);

    if (this.rocketState !== 'flying') {
      const len = Math.hypot(knockX, knockZ) || 1;
      this.playerVel.set((knockX / len) * 6.5, 7.5, (knockZ / len) * 6.5);
      this.grounded = false;
      this.standingPlatform = null;
    }

    if (this.health <= 0) {
      soundEngine.playGameOver();
      this.setPhase('gameover');
    } else {
      this.pushHud(true);
    }
  }

  private handleFallDamage() {
    soundEngine.playHurt();
    this.health = Math.max(0, this.health - 1);
    if (this.health <= 0) {
      soundEngine.playGameOver();
      this.setPhase('gameover');
      return;
    }
    this.playerPos.copy(this.spawnPos);
    this.playerVel.set(0, 0, 0);
    this.hoverFuel = 1;
    this.invulnTimer = 1.2;
    this.shakeIntensity = 0.3;
    this.spawnBurst(this.playerPos.x, this.playerPos.y + 0.8, this.playerPos.z, 0x38bdf8, 16, 4.5);
    this.pushHud(true);
  }

  private animatePlayerVisuals(dt: number, groundSpeed: number) {
    const rig = this.playerRig;
    rig.root.position.copy(this.playerPos);

    this.playerSquash.x = THREE.MathUtils.damp(this.playerSquash.x, 1, 14, dt);
    this.playerSquash.y = THREE.MathUtils.damp(this.playerSquash.y, 1, 14, dt);
    this.playerSquash.z = THREE.MathUtils.damp(this.playerSquash.z, 1, 14, dt);
    rig.bodyGroup.scale.copy(this.playerSquash);

    if (this.spinTimer > 0) {
      rig.bodyGroup.rotation.y += dt * 28;
      rig.spinRing.visible = true;
      rig.spinRing.rotation.z += dt * 15;
    } else {
      rig.bodyGroup.rotation.y = this.playerYaw;
      rig.spinRing.visible = false;
    }

    if (this.invulnTimer > 0) {
      rig.bodyGroup.visible = Math.floor(this.invulnTimer * 18) % 2 === 0;
    } else {
      rig.bodyGroup.visible = true;
    }

    if (this.phase === 'title') {
      rig.bodyGroup.rotation.y = Math.sin(this.totalTime * 0.7) * 0.35;
      rig.leftArm.rotation.x = -0.15;
      rig.rightArm.rotation.z = 2.4 + Math.sin(this.totalTime * 5.0) * 0.32;
      rig.leftLeg.rotation.x = 0;
      rig.rightLeg.rotation.x = 0;
      rig.headGroup.position.y = 1.18 + Math.sin(this.totalTime * 3.0) * 0.025;
      rig.hoverBeam.visible = false;
      rig.thrusterLeft.visible = false;
      rig.thrusterRight.visible = false;
    } else {
      rig.rightArm.rotation.z = 0;
      if (this.isClimbing) {
        const climbMotion = Math.sin(this.playerPos.y * 5.5);
        rig.leftArm.rotation.x = -2.35 + climbMotion * 0.45;
        rig.rightArm.rotation.x = -2.35 - climbMotion * 0.45;
        rig.leftLeg.rotation.x = -climbMotion * 0.45;
        rig.rightLeg.rotation.x = climbMotion * 0.45;
        rig.bodyGroup.position.y = 0;
      } else {
        const runFactor = Math.min(1, groundSpeed / 8.5);
        const stride = Math.sin(this.totalTime * 15) * runFactor;
        if (this.grounded) {
          rig.leftLeg.rotation.x = stride * 0.85;
          rig.rightLeg.rotation.x = -stride * 0.85;
          rig.leftArm.rotation.x = this.hasBow ? -0.55 : -stride * 0.75;
          rig.rightArm.rotation.x = stride * 0.75;
          rig.bodyGroup.position.y = Math.abs(stride) * 0.05;
        } else {
          rig.leftLeg.rotation.x = 0.35;
          rig.rightLeg.rotation.x = -0.25;
          rig.leftArm.rotation.x = -0.65;
          rig.rightArm.rotation.x = -0.65;
          rig.bodyGroup.position.y = 0;
        }
        rig.capeGroup.rotation.x = 0.25 + runFactor * 0.55 + (this.isHovering ? 0.5 : 0);
      }

      if (this.hasMonkeySuit) {
        rig.monkeyTail.rotation.y = Math.sin(this.totalTime * (this.isClimbing ? 10 : 6)) * 0.42;
        rig.monkeyTail.rotation.x = Math.cos(this.totalTime * 4) * 0.14;
      }

      rig.hoverBeam.visible = this.isHovering;
      rig.thrusterLeft.visible = this.isHovering;
      rig.thrusterRight.visible = this.isHovering;
      if (this.isHovering) {
        const pulse = 0.9 + Math.sin(this.totalTime * 35) * 0.12;
        rig.hoverBeam.scale.set(pulse, 1, pulse);
        rig.thrusterLeft.scale.setScalar(pulse);
        rig.thrusterRight.scale.setScalar(pulse);
      }
    }

    const blink = (this.totalTime % 3.8) > 3.68 ? 0.15 : 1.0;
    rig.leftEye.scale.y = blink;
    rig.rightEye.scale.y = blink;

    this.keyLight.position.set(this.playerPos.x + 14, this.playerPos.y + 24, this.playerPos.z + 14);
    this.keyLight.target.position.copy(this.playerPos);
    this.keyLight.target.updateMatrixWorld();
  }

  private updateParticles(dt: number) {
    let anyChanged = false;
    for (let i = 0; i < this.MAX_PARTICLES; i++) {
      const p = this.particles[i];
      if (!p.active) continue;
      anyChanged = true;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        _mat4.makeScale(0, 0, 0);
        this.particleMesh.setMatrixAt(i, _mat4);
        continue;
      }
      p.vel.y -= 10 * dt;
      p.pos.addScaledVector(p.vel, dt);
      const scale = (p.life / p.maxLife) * p.size;
      _vec3A.set(scale, scale, scale);
      _mat4.compose(p.pos, _quat.identity(), _vec3A);
      this.particleMesh.setMatrixAt(i, _mat4);
      this.particleMesh.setColorAt(i, p.color);
    }
    if (anyChanged) {
      this.particleMesh.instanceMatrix.needsUpdate = true;
      if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true;
    }
  }

  private updateCamera(dt: number) {
    if (this.phase === 'title') {
      const angle = this.totalTime * 0.28;
      const dist = 6.2;
      _vec3A.set(
        this.playerPos.x + Math.sin(angle) * dist,
        this.playerPos.y + 2.6 + Math.sin(this.totalTime * 0.5) * 0.35,
        this.playerPos.z + Math.cos(angle) * dist
      );
      this.camera.position.lerp(_vec3A, 1 - Math.exp(-4 * dt));
      _vec3B.set(this.playerPos.x, this.playerPos.y + 1.0, this.playerPos.z);
      this.camera.lookAt(_vec3B);
      return;
    }

    if (this.rocketState === 'flying') {
      _vec3A.set(this.rocketPos.x * 0.65, this.rocketPos.y + 3.4, this.rocketPos.z + 10.4);
      this.camCurrentPos.lerp(_vec3A, 1 - Math.exp(-9 * dt));
      _vec3B.set(this.rocketPos.x * 0.85, this.rocketPos.y + 0.8, this.rocketPos.z - 14);
      this.camLookTarget.lerp(_vec3B, 1 - Math.exp(-10 * dt));
      this.camera.position.copy(this.camCurrentPos);
      if (this.shakeIntensity > 0.005) {
        this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      }
      this.camera.lookAt(this.camLookTarget);
      return;
    }

    const dist = this.active2DZone ? 13.5 : 9.6;
    const horizDist = dist * Math.cos(this.camPitch);
    const heightOffset = dist * Math.sin(this.camPitch) + (this.active2DZone ? 1.8 : 1.2);

    _vec3A.set(
      this.playerPos.x + Math.sin(this.camYaw) * horizDist,
      this.playerPos.y + heightOffset,
      this.playerPos.z + Math.cos(this.camYaw) * horizDist
    );

    const smoothFactor = 1 - Math.exp(-8.5 * dt);
    this.camCurrentPos.lerp(_vec3A, smoothFactor);

    _vec3B.set(this.playerPos.x, this.playerPos.y + 1.15, this.playerPos.z);
    this.camLookTarget.lerp(_vec3B, 1 - Math.exp(-11 * dt));

    this.camera.position.copy(this.camCurrentPos);
    if (this.shakeIntensity > 0.005) {
      this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
      this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
    }
    this.camera.lookAt(this.camLookTarget);
  }

  private pushHud(force: boolean) {
    const now = performance.now();
    if (!force && now - this.lastHudPush < 80) return;
    this.lastHudPush = now;
    const bossHud =
      this.bossRuntime && this.bossRuntime.alive && this.bossRuntime.active
        ? { name: this.bossRuntime.name, hp: this.bossRuntime.hp, maxHp: this.bossRuntime.maxHp }
        : null;
    this.onHudUpdate({
      phase: this.phase,
      levelIndex: this.currentLevel.index,
      levelName: this.currentLevel.name,
      biome: this.currentLevel.theme.biome,
      perspectiveMode: this.perspectiveMode,
      hasBow: this.hasBow,
      hasMonkeySuit: this.hasMonkeySuit,
      isClimbing: this.isClimbing,
      boss: bossHud,
      health: this.health,
      maxHealth: this.maxHealth,
      coins: this.coinsCollected,
      totalCoins: this.totalLevelCoins,
      botsRescued: this.botsRescued,
      totalBots: this.currentLevel.miniBots.length,
      hoverFuel: this.hoverFuel,
      elapsedTime: this.levelTime,
      checkpointActive: this.checkpointActive,
      bannerText: this.bannerText,
      muted: soundEngine.isMuted(),
      musicMuted: soundEngine.isMusicMuted(),
    });
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    soundEngine.stopHover();
    soundEngine.stopMusic();
    this.unbindEvents();
    this.clearLevelGroup();

    this.playerRig.root.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
      const m = (obj as THREE.Mesh).material;
      if (Array.isArray(m)) m.forEach((x) => x.dispose());
      else if (m) m.dispose();
    });

    this.contactShadowMesh.geometry.dispose();
    (this.contactShadowMesh.material as THREE.Material).dispose();
    this.particleMesh.geometry.dispose();
    (this.particleMesh.material as THREE.Material).dispose();
    this.skyMesh.geometry.dispose();
    (this.skyMesh.material as THREE.Material).dispose();

    disposeProceduralTextures(this.textures);
    this.envRT.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
