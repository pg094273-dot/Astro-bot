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
  createCrocodileMesh,
  createEiffelTowerMesh,
  createArcDeTriompheMesh,
  createEnemyMesh,
  createGoalPortalMesh,
  createHangGliderRig,
  createJumpPadMesh,
  createMineMesh,
  createMiniBotMesh,
  createMonkeySuitPickupMesh,
  createRiverBoatRig,
  createRocketPadMesh,
  createRocketVehicle,
  CrocodileRig,
  HangGliderRig,
  RiverBoatRig,
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
  getRiverCenterX,
  getRiverSlopeAngle,
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

interface RiverRockRuntime {
  pos: THREE.Vector3;
  radius: number;
}

interface CrocodileRuntime {
  rig: CrocodileRig;
  baseX: number;
  pos: THREE.Vector3;
  patrolX: number;
  speed: number;
  phase: number;
  behavior: 'patrol' | 'ambush';
  emergeProgress: number;
  emergedSplash: boolean;
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

  // Hang Glider (Level 7 - Paris) entities
  private gliderRig: HangGliderRig | null = null;
  private gliderState: 'parked' | 'flying' | 'landed' = 'parked';
  private gliderPos = new THREE.Vector3();
  private gliderVelX = 0;
  private gliderVelY = 0;
  private gliderAltOffset = 0;
  private gliderBoostTimer = 0;
  private gliderLaunchpadPos = new THREE.Vector3();
  private gliderLandingPos = new THREE.Vector3();
  private gliderCruiseSpeed = 6.5;

  // River Boat Rapids (Level 8 - Río Bravo) entities
  private boatRig: RiverBoatRig | null = null;
  private boatState: 'parked' | 'sailing' | 'docked' = 'parked';
  private boatPos = new THREE.Vector3();
  private boatVelX = 0;
  private boatVelZ = 0;
  private boatJumpY = 0;
  private boatVelY = 0;
  private boatJumpCooldown = 0;
  private boatDockPos = new THREE.Vector3();
  private boatLakePos = new THREE.Vector3();
  private boatCalmLakeZ = -274;
  private boatCruiseSpeed = 9.8;
  private boatHalfWidth = 7.8;
  private boatCalmEntered = false;
  private riverRocks: RiverRockRuntime[] = [];
  private crocodiles: CrocodileRuntime[] = [];

  // 2D/3D Camera Zone state
  private active2DZone: CameraZone2DDef | null = null;
  private perspectiveMode: '3D' | '2D' | 'COHETE' | 'ALA DELTA' | 'BARCO' = '3D';

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
  private botRocketCharges = 0;
  private botRocketTimer = 0;
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
  private lastTvSelectTime = 0;
  private touchMoveX = 0;
  private touchMoveZ = 0;
  private touchJumpHeld = false;
  private gamepadMoveX = 0;
  private gamepadMoveZ = 0;
  private gamepadCamX = 0;
  private gamepadJumpHeld = false;
  private prevGamepadButtons = {
    jump: false,
    spin: false,
    bow: false,
    pause: false,
  };

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

  private normalizeKeyCode(e: KeyboardEvent): string {
    const kc = e.keyCode;
    if (kc === 19 || e.code === 'ArrowUp') return 'ArrowUp';
    if (kc === 20 || e.code === 'ArrowDown') return 'ArrowDown';
    if (kc === 21 || e.code === 'ArrowLeft') return 'ArrowLeft';
    if (kc === 22 || e.code === 'ArrowRight') return 'ArrowRight';
    if (kc === 23 || kc === 66 || e.key === 'Select' || e.code === 'Enter' || e.code === 'NumpadEnter') {
      return 'TvSelect';
    }
    if (kc === 4 || e.code === 'Escape' || e.key === 'GoBack' || e.key === 'BrowserBack') {
      return 'Escape';
    }
    return e.code || e.key || `kc_${kc}`;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    soundEngine.unlock();
    const code = this.normalizeKeyCode(e);
    const kc = e.keyCode;
    const isFocusedButton = (e.target as HTMLElement | null)?.tagName === 'BUTTON';
    const isTvSelect = !isFocusedButton && code === 'TvSelect';
    const isTvBack = code === 'Escape' || code === 'KeyP';
    const isTvSpinKey =
      code === 'KeyF' ||
      code === 'ShiftLeft' ||
      code === 'ShiftRight' ||
      code === 'KeyJ' ||
      code === 'Digit1' ||
      code === 'Numpad1' ||
      e.key === 'MediaPlayPause' ||
      e.key === 'MediaFastForward' ||
      e.key === 'ColorF0Red' ||
      kc === 85 ||
      kc === 90 ||
      kc === 183;
    const isTvBowKey =
      code === 'KeyG' ||
      code === 'KeyR' ||
      code === 'KeyC' ||
      code === 'Digit2' ||
      code === 'Numpad2' ||
      e.key === 'MediaRewind' ||
      e.key === 'ColorF1Green' ||
      kc === 89 ||
      kc === 184;
    const isCamLeft = code === 'KeyQ' || code === 'Digit3' || e.key === 'ChannelDown' || kc === 167 || kc === 185;
    const isCamRight = code === 'KeyE' || code === 'Digit4' || e.key === 'ChannelUp' || kc === 166 || kc === 186;

    if (
      code === 'Space' ||
      code === 'ArrowUp' ||
      code === 'ArrowDown' ||
      code === 'ArrowLeft' ||
      code === 'ArrowRight' ||
      isTvSelect
    ) {
      e.preventDefault();
    }

    if (this.phase === 'playing') {
      const jumpKey = code === 'Space' || isTvSelect;
      if (!this.keysHeld.has(code) && !e.repeat) {
        if (jumpKey) {
          if (this.rocketState === 'flying') {
            this.rocketBoostTimer = 0.55;
            soundEngine.playRocketBoost();
          } else if (this.gliderState === 'flying') {
            if (this.gliderBoostTimer <= 0.1) {
              this.gliderBoostTimer = 0.7;
              this.gliderVelY = Math.max(this.gliderVelY + 4.2, 5.2);
              soundEngine.playWindWhoosh();
              this.spawnBurst(this.gliderPos.x, this.gliderPos.y, this.gliderPos.z, 0xbae6fd, 14, 4.5);
            }
          } else if (this.boatState === 'sailing') {
            if (this.boatJumpY <= 0.05 && this.boatJumpCooldown <= 0) {
              this.boatVelY = 10.6;
              this.boatJumpCooldown = 0.72;
              soundEngine.playSplash();
              this.spawnBurst(this.boatPos.x, 0.2, this.boatPos.z, 0xe0f2fe, 14, 4.8);
            }
          } else {
            const now = performance.now();
            const isDoubleTapOk = isTvSelect && now - this.lastTvSelectTime < 340;
            const isMidAirOk = isTvSelect && !this.grounded && this.coyoteTimer <= 0 && !this.isClimbing;
            if (isTvSelect) this.lastTvSelectTime = now;

            if (
              !this.grounded &&
              !this.isClimbing &&
              this.coyoteTimer <= 0 &&
              this.botRocketCharges > 0 &&
              this.botRocketTimer <= 0 &&
              this.playerVel.y < -2.2 &&
              this.hoverFuel <= 0.12
            ) {
              this.activateBotRocketRescue();
            } else {
              this.jumpBufferTimer = 0.14;
              if (isDoubleTapOk || isMidAirOk) {
                this.triggerSpin();
                if (this.hasBow) this.shootArrow();
              }
            }
          }
        }
        if (isTvSpinKey) {
          this.triggerSpin();
        }
        if (isTvBowKey) {
          this.shootArrow();
        }
      }
      if (isTvBack) {
        e.preventDefault();
        this.setPhase('paused');
      }
    } else if (this.phase === 'paused' && isTvBack && !e.repeat) {
      e.preventDefault();
      this.setPhase('playing');
    }

    this.keysHeld.add(code);
    if (isTvSelect) this.keysHeld.add('__TV_JUMP__');
    if (isCamLeft) this.keysHeld.add('__CAM_L__');
    if (isCamRight) this.keysHeld.add('__CAM_R__');
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const code = this.normalizeKeyCode(e);
    const kc = e.keyCode;
    this.keysHeld.delete(code);
    if (code === 'TvSelect') {
      this.keysHeld.delete('__TV_JUMP__');
    }
    if (code === 'KeyQ' || code === 'Digit3' || e.key === 'ChannelDown' || kc === 167 || kc === 185) {
      this.keysHeld.delete('__CAM_L__');
    }
    if (code === 'KeyE' || code === 'Digit4' || e.key === 'ChannelUp' || kc === 166 || kc === 186) {
      this.keysHeld.delete('__CAM_R__');
    }
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
      } else if (this.gliderState === 'flying') {
        if (this.gliderBoostTimer <= 0.1) {
          this.gliderBoostTimer = 0.7;
          this.gliderVelY = Math.max(this.gliderVelY + 4.2, 5.2);
          soundEngine.playWindWhoosh();
          this.spawnBurst(this.gliderPos.x, this.gliderPos.y, this.gliderPos.z, 0xbae6fd, 14, 4.5);
        }
      } else if (this.boatState === 'sailing') {
        if (this.boatJumpY <= 0.05 && this.boatJumpCooldown <= 0) {
          this.boatVelY = 10.6;
          this.boatJumpCooldown = 0.72;
          soundEngine.playSplash();
          this.spawnBurst(this.boatPos.x, 0.2, this.boatPos.z, 0xe0f2fe, 14, 4.8);
        }
      } else {
        if (
          !this.grounded &&
          !this.isClimbing &&
          this.coyoteTimer <= 0 &&
          this.botRocketCharges > 0 &&
          this.botRocketTimer <= 0 &&
          this.playerVel.y < -2.2 &&
          this.hoverFuel <= 0.12
        ) {
          this.activateBotRocketRescue();
        } else {
          this.jumpBufferTimer = 0.14;
        }
      }
    }
  }

  private activateBotRocketRescue() {
    if (this.botRocketCharges <= 0 || this.botRocketTimer > 0) return;
    this.botRocketCharges -= 1;
    this.botRocketTimer = 2.4;
    this.isHovering = false;
    soundEngine.stopHover();
    this.hoverFuel = 1;
    this.playerVel.y = Math.max(this.playerVel.y, 12.2);
    this.playerSquash.set(0.8, 1.28, 0.8);
    soundEngine.playRocketBoost();
    this.spawnBurst(this.playerPos.x, this.playerPos.y, this.playerPos.z, 0xf97316, 20, 5.5);
    this.spawnBurst(this.playerPos.x, this.playerPos.y, this.playerPos.z, 0x38bdf8, 12, 4.5);
    this.showBanner('¡Bot Propulsor al rescate! Dirige a Nova Bot a salvo', 2.6);
    this.pushHud(true);
  }

  public triggerSpin() {
    if (
      this.phase !== 'playing' ||
      this.rocketState === 'flying' ||
      this.gliderState === 'flying' ||
      this.boatState === 'sailing'
    ) {
      return;
    }
    if (this.spinCooldown <= 0 && this.spinTimer <= 0) {
      this.spinTimer = 0.34;
      this.spinCooldown = 0.45;
      soundEngine.playSpin();
      this.spawnBurst(this.playerPos.x, this.playerPos.y + 0.65, this.playerPos.z, 0x38bdf8, 14, 4.5);
    }
  }

  public shootArrow() {
    if (
      this.phase !== 'playing' ||
      !this.hasBow ||
      this.rocketState === 'flying' ||
      this.gliderState === 'flying' ||
      this.boatState === 'sailing' ||
      this.bowCooldown > 0
    ) {
      return;
    }
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
    this.riverRocks = [];
    this.crocodiles = [];
    this.goalPortal = null;
    this.hazardSeaMesh = null;
    this.hazardSeaTex = null;
    this.rocketRig = null;
    this.gliderRig = null;
    this.boatRig = null;
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

  private createDisplacedRockGeometry(radius: number, seed: number): THREE.BufferGeometry {
    const geo = new THREE.IcosahedronGeometry(radius, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const n =
        1 +
        0.18 * Math.sin(vx * 3.1 + seed) * Math.cos(vz * 2.7 - seed) +
        0.1 * Math.cos(vy * 4.3 + seed * 1.6);
      pos.setXYZ(i, vx * n, vy * (vy < 0 ? 0.68 * n : 0.9 * n), vz * n);
    }
    geo.computeVertexNormals();
    return geo;
  }

  private buildBiomeScenery(level: LevelDef) {
    const biome = level.theme.biome;
    const dummy = new THREE.Object3D();

    if (biome === 'jungle') {
      // Far mist-shrouded alpine ridges & mid-ground forested valley slopes
      this.addHorizonMountainRing(24, -55, level.theme.hazardFloorY - 2, 132, 220, 62, 0x355f7d, 0x9cc0d9, 2.2, 0.88);
      this.addHorizonMountainRing(22, -52, level.theme.hazardFloorY - 1, 86, 138, 30, 0x1b4332, 0x3f7a38, 1.4, 0.9);

      // Background Rainforest Grove (Weathered hardwood trunks + buttress roots + organic multi-lobe foliage)
      const treeCount = 56;
      const trunkGeo = new THREE.CylinderGeometry(0.4, 1.05, 11.5, 10);
      const trunkMat = new THREE.MeshStandardMaterial({
        map: this.textures.barkTexture,
        bumpMap: this.textures.barkBump,
        bumpScale: 0.16,
        roughness: 0.9,
      });
      const rootGeo = new THREE.ConeGeometry(1.45, 3.2, 7);
      const canopyLowGeo = this.createDisplacedRockGeometry(3.2, 1.1);
      const canopyTopGeo = this.createDisplacedRockGeometry(2.5, 2.7);
      const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0.02 });

      const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
      const roots = new THREE.InstancedMesh(rootGeo, trunkMat, treeCount);
      const canopiesLow = new THREE.InstancedMesh(canopyLowGeo, canopyMat, treeCount);
      const canopiesTop = new THREE.InstancedMesh(canopyTopGeo, canopyMat, treeCount);

      for (let i = 0; i < treeCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 24 + ((i * 19) % 58);
        const z = 14 - ((i * 21) % 132);
        const x = (i % 3 === 0 ? 48 : 0) + side * dist;
        const y = -9.5 + (i % 5) * 1.4;
        const scale = 0.9 + (i % 4) * 0.24;

        dummy.position.set(x, y + 5.5 * scale, z);
        dummy.rotation.set((i % 3 - 1) * 0.04, i * 0.9, (i % 3 - 1) * 0.06);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        trunks.setMatrixAt(i, dummy.matrix);

        dummy.position.set(x, y + 1.4 * scale, z);
        dummy.rotation.set(0, i * 0.7, 0);
        dummy.scale.set(scale * 1.15, scale, scale * 1.15);
        dummy.updateMatrix();
        roots.setMatrixAt(i, dummy.matrix);

        dummy.position.set(x, y + 10.6 * scale, z);
        dummy.rotation.set(0, i * 0.5, 0);
        dummy.scale.set(scale * 1.28, scale * 0.78, scale * 1.28);
        dummy.updateMatrix();
        canopiesLow.setMatrixAt(i, dummy.matrix);
        _color.setHex(i % 3 === 0 ? 0x26581c : i % 3 === 1 ? 0x316b22 : 0x1e4a16);
        canopiesLow.setColorAt(i, _color);

        dummy.position.set(x + (i % 2 === 0 ? 0.5 : -0.5), y + 12.8 * scale, z - 0.3);
        dummy.rotation.set(0, i * 0.8, 0);
        dummy.scale.set(scale * 1.15, scale * 0.74, scale * 1.15);
        dummy.updateMatrix();
        canopiesTop.setMatrixAt(i, dummy.matrix);
        _color.setHex(i % 3 === 0 ? 0x458a2a : i % 3 === 1 ? 0x559e34 : 0x367522);
        canopiesTop.setColorAt(i, _color);
      }
      for (const im of [trunks, roots, canopiesLow, canopiesTop]) {
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.computeBoundingSphere();
      }
      this.levelGroup.add(trunks, roots, canopiesLow, canopiesTop);

      // Hero Rainforest Trees (Twisted weathered hardwood trunks, buttress roots, organic multi-cluster foliage & vines)
      const heroBarkMat = new THREE.MeshStandardMaterial({
        map: this.textures.barkTexture,
        bumpMap: this.textures.barkBump,
        bumpScale: 0.18,
        roughness: 0.88,
      });
      const moundTopMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleGrass,
        bumpMap: this.textures.grassBump,
        bumpScale: 0.09,
        roughness: 0.86,
      });
      const moundSideMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleSide,
        bumpMap: this.textures.jungleSideBump,
        bumpScale: 0.14,
        roughness: 0.9,
      });
      const leafSunMat = new THREE.MeshStandardMaterial({ color: 0x4f962b, roughness: 0.78 });
      const leafMidMat = new THREE.MeshStandardMaterial({ color: 0x357020, roughness: 0.82 });
      const leafDeepMat = new THREE.MeshStandardMaterial({ color: 0x224d16, roughness: 0.85 });
      const lianaMat = new THREE.MeshStandardMaterial({ color: 0x437523, roughness: 0.76 });

      const foliageClusterGeo = this.createDisplacedRockGeometry(2.35, 3.7);
      const heroTreeSpots: [number, number, number, number][] = [
        [-15, -4, -14, 1.15],
        [15, -4, -15, 1.08],
        [-16, -3, -32, 1.1],
        [14, -3, -46, 1.2],
        [36, -2, -46, 1.15],
        [34, 0, -68, 1.18],
        [66, 0, -72, 1.15],
        [35, 3, -96, 1.1],
      ];

      const heroCrownCoords: THREE.Vector3[] = [];
      for (let idx = 0; idx < heroTreeSpots.length; idx++) {
        const [hx, hy, hz, sc] = heroTreeSpots[idx];
        const tg = new THREE.Group();
        tg.position.set(hx, hy, hz);
        tg.rotation.y = idx * 0.95;

        const island = new THREE.Mesh(
          new THREE.CylinderGeometry(3.8 * sc, 4.5 * sc, 4.0, 12),
          [moundSideMat, moundTopMat, moundSideMat]
        );
        island.position.y = -1.8;
        tg.add(island);

        const trunkCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0.45 * sc, 3.2 * sc, -0.25 * sc),
          new THREE.Vector3(-0.35 * sc, 6.8 * sc, 0.3 * sc),
          new THREE.Vector3(0.2 * sc, 10.2 * sc, 0),
        ]);
        const curvedTrunk = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 14, 0.92 * sc, 9, false), heroBarkMat);
        tg.add(curvedTrunk);

        for (let r = 0; r < 4; r++) {
          const ang = (r / 4) * Math.PI * 2 + 0.35;
          const rootCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(Math.cos(ang) * 0.5 * sc, 2.2 * sc, Math.sin(ang) * 0.5 * sc),
            new THREE.Vector3(Math.cos(ang) * 1.6 * sc, 0.7 * sc, Math.sin(ang) * 1.6 * sc),
            new THREE.Vector3(Math.cos(ang) * 2.8 * sc, 0.1 * sc, Math.sin(ang) * 2.8 * sc),
          ]);
          const rootMesh = new THREE.Mesh(new THREE.TubeGeometry(rootCurve, 8, 0.34 * sc, 7, false), heroBarkMat);
          tg.add(rootMesh);
        }

        for (let b = 0; b < 3; b++) {
          const bAng = (b / 3) * Math.PI * 2 + idx * 0.4;
          const bx = Math.cos(bAng) * 3.1 * sc;
          const bz = Math.sin(bAng) * 3.1 * sc;
          const branchCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 8.8 * sc, 0),
            new THREE.Vector3(bx * 0.55, 10.2 * sc, bz * 0.55),
            new THREE.Vector3(bx, 11.4 * sc, bz),
          ]);
          const branchMesh = new THREE.Mesh(new THREE.TubeGeometry(branchCurve, 6, 0.38 * sc, 6, false), heroBarkMat);
          tg.add(branchMesh);

          // Multi-lobe organic foliage clusters instead of primitive cones
          for (let c = 0; c < 3; c++) {
            const cAng = bAng + (c - 1) * 0.65;
            const lobe = new THREE.Mesh(
              foliageClusterGeo,
              c === 0 ? leafSunMat : c === 1 ? leafMidMat : leafDeepMat
            );
            lobe.scale.set(sc * (1.05 - c * 0.12), sc * 0.72, sc * (1.05 - c * 0.12));
            lobe.position.set(
              bx + Math.cos(cAng) * 1.15 * sc,
              (12.2 - c * 0.75) * sc,
              bz + Math.sin(cAng) * 1.15 * sc
            );
            lobe.rotation.y = cAng;
            tg.add(lobe);
          }

          // Hanging aerial moss vine strand
          const tendrilCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(bx * 1.1, 11.0 * sc, bz * 1.1),
            new THREE.Vector3(bx * 1.12, 8.6 * sc, bz * 1.12),
            new THREE.Vector3(bx * 1.08, 6.2 * sc, bz * 1.08),
          ]);
          tg.add(new THREE.Mesh(new THREE.TubeGeometry(tendrilCurve, 6, 0.06 * sc, 4, false), lianaMat));
        }

        const topCrown = new THREE.Mesh(foliageClusterGeo, leafSunMat);
        topCrown.scale.set(1.42 * sc, 0.78 * sc, 1.42 * sc);
        topCrown.position.set(0, 13.6 * sc, 0);
        tg.add(topCrown);

        this.levelGroup.add(tg);
        heroCrownCoords.push(new THREE.Vector3(hx, hy + 11.0 * sc, hz));
      }

      // Draped Natural Liana Vines arcing between adjacent trees
      const vinePairs: [number, number][] = [
        [0, 1],
        [0, 2],
        [3, 4],
        [5, 6],
      ];
      for (const [a, b] of vinePairs) {
        const pA = heroCrownCoords[a];
        const pB = heroCrownCoords[b];
        if (!pA || !pB) continue;
        const mid = pA.clone().lerp(pB, 0.5);
        mid.y -= 3.8;
        const vineCurve = new THREE.CatmullRomCurve3([pA, mid, pB]);
        this.levelGroup.add(new THREE.Mesh(new THREE.TubeGeometry(vineCurve, 14, 0.1, 5, false), lianaMat));
      }

      // Scenic Cascading Cliff Waterfalls (with animated UV waterfall ribbon + plunge foam)
      const wfSpots: [number, number, number, number][] =
        level.index === 0
          ? [
              [-28, 3, -64, 0.45],
              [78, 4, -82, -0.55],
            ]
          : [
              [-32, 4, -46, 0.45],
              [28, 4, -68, -0.45],
            ];
      const cliffMat = new THREE.MeshStandardMaterial({
        map: this.textures.climbStone,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.2,
        roughness: 0.9,
      });
      const wfMat = new THREE.MeshPhysicalMaterial({
        map: this.textures.waterfallSurface,
        transparent: true,
        opacity: 0.88,
        roughness: 0.12,
        clearcoat: 0.8,
        side: THREE.DoubleSide,
      });
      const foamMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.58 });
      const cliffRockGeo = this.createDisplacedRockGeometry(7.2, 5.1);

      for (const [wx, wy, wz, rotY] of wfSpots) {
        const wg = new THREE.Group();
        wg.position.set(wx, wy, wz);
        wg.rotation.y = rotY;

        const cliffL = new THREE.Mesh(cliffRockGeo, cliffMat);
        cliffL.scale.set(0.95, 2.2, 0.85);
        cliffL.position.set(-5.2, -1.5, -1.5);
        const cliffR = new THREE.Mesh(cliffRockGeo, cliffMat);
        cliffR.scale.set(0.95, 2.2, 0.85);
        cliffR.position.set(5.2, -1.5, -1.5);
        const cliffBack = new THREE.Mesh(cliffRockGeo, cliffMat);
        cliffBack.scale.set(1.4, 2.3, 0.7);
        cliffBack.position.set(0, -1.0, -3.5);

        const stream = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 17.5, 4, 8), wfMat);
        stream.position.set(0, -6.4, 0.4);
        stream.rotation.x = -0.06;

        const foam = new THREE.Mesh(new THREE.RingGeometry(1.6, 5.4, 20), foamMat);
        foam.rotation.x = -Math.PI / 2;
        foam.position.set(0, level.theme.hazardFloorY - wy + 0.18, 0.8);

        wg.add(cliffL, cliffR, cliffBack, stream, foam);
        this.levelGroup.add(wg);
      }

      // Natural Displaced Mossy Boulders + Broad-Leaf Tropical Ferns around tree bases & safe platform rims
      const rockSpots: [number, number, number, number][] = [
        [-13.2, -3.7, -12.5, 1.1],
        [13.4, -3.7, -13.8, 1.0],
        [-3.8, 1.05, 3.6, 0.65],
        [3.9, 1.05, 3.4, 0.58],
        [-14.2, -2.7, -30.5, 0.95],
      ];
      if (level.index === 0) {
        rockSpots.push(
          [-3.2, 2.25, -18.8, 0.62],
          [3.1, 2.25, -24.8, 0.6],
          [15.4, -2.7, -44.2, 1.05],
          [34.2, -1.7, -44.6, 1.0],
          [46.5, 6.25, -46.8, 0.65],
          [53.4, 7.45, -76.2, 0.68],
          [46.6, 12.35, -107.2, 0.72]
        );
      } else {
        rockSpots.push(
          [-2.8, 1.35, -14.2, 0.58],
          [2.8, 1.35, -8.8, 0.55],
          [-2.9, 8.95, -40.2, 0.6],
          [-20.2, 23.35, -87.8, 0.7]
        );
      }

      const rockGeo = this.createDisplacedRockGeometry(0.95, 7.3);
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.14,
        roughness: 0.88,
      });
      const mossCapGeo = this.createDisplacedRockGeometry(0.75, 4.9);
      const mossMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleGrass,
        bumpMap: this.textures.grassBump,
        bumpScale: 0.08,
        roughness: 0.85,
      });
      const rocksInst = new THREE.InstancedMesh(rockGeo, rockMat, rockSpots.length);
      const mossInst = new THREE.InstancedMesh(mossCapGeo, mossMat, rockSpots.length);

      for (let i = 0; i < rockSpots.length; i++) {
        const [rx, ry, rz, rs] = rockSpots[i];
        dummy.position.set(rx, ry + 0.3 * rs, rz);
        dummy.rotation.set((i % 3) * 0.25, i * 1.1, (i % 2) * 0.2);
        dummy.scale.set(rs * 1.25, rs * 0.82, rs);
        dummy.updateMatrix();
        rocksInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(rx, ry + 0.72 * rs, rz);
        dummy.rotation.set(0, i * 1.1, 0);
        dummy.scale.set(rs * 1.05, rs * 0.34, rs * 0.88);
        dummy.updateMatrix();
        mossInst.setMatrixAt(i, dummy.matrix);
      }
      for (const im of [rocksInst, mossInst]) {
        im.instanceMatrix.needsUpdate = true;
        im.computeBoundingSphere();
      }
      this.levelGroup.add(rocksInst, mossInst);

      // Realistic Multi-Blade Rainforest Ferns
      const leafBladeGeo = new THREE.ConeGeometry(0.32, 1.55, 5);
      const totalLeaves = rockSpots.length * 6;
      const leavesInst = new THREE.InstancedMesh(leafBladeGeo, leafSunMat, totalLeaves);
      let lIdx = 0;
      for (let i = 0; i < rockSpots.length; i++) {
        const [rx, ry, rz, rs] = rockSpots[i];
        const px = rx + (i % 2 === 0 ? 0.95 : -0.95) * rs;
        const pz = rz + 0.45 * rs;
        for (let f = 0; f < 6; f++) {
          const ang = (f / 6) * Math.PI * 2 + i * 0.5;
          dummy.position.set(px + Math.cos(ang) * 0.42 * rs, ry + 0.58 * rs, pz + Math.sin(ang) * 0.42 * rs);
          dummy.rotation.set(0, -ang, -0.78);
          dummy.scale.set(rs, rs * (0.85 + (f % 2) * 0.24), rs * 0.22);
          dummy.updateMatrix();
          leavesInst.setMatrixAt(lIdx, dummy.matrix);
          _color.setHex(f % 2 === 0 ? 0x52992c : 0x346e1d);
          leavesInst.setColorAt(lIdx, _color);
          lIdx++;
        }
      }
      leavesInst.instanceMatrix.needsUpdate = true;
      if (leavesInst.instanceColor) leavesInst.instanceColor.needsUpdate = true;
      leavesInst.computeBoundingSphere();
      this.levelGroup.add(leavesInst);

      // Level 1 vista: weathered wooden & rope suspension bridge across distant ravine
      if (level.index === 0) {
        const bridgeGroup = new THREE.Group();
        bridgeGroup.position.set(22, 10, -118);
        const span = 26;
        const ropeCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-span / 2, 2.2, 0),
          new THREE.Vector3(0, -1.6, 0),
          new THREE.Vector3(span / 2, 2.2, 0),
        ]);
        const ropeMat = new THREE.MeshStandardMaterial({ map: this.textures.barkTexture, roughness: 0.9 });
        const ropeTop = new THREE.Mesh(new THREE.TubeGeometry(ropeCurve, 16, 0.14, 5, false), ropeMat);
        const ropeLow = ropeTop.clone();
        ropeLow.position.y = -1.6;
        bridgeGroup.add(ropeTop, ropeLow);
        for (let s = -4; s <= 4; s++) {
          const slat = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.6, 0.25), ropeMat);
          const x = s * 2.4;
          const sag = (1 - (x / (span / 2)) ** 2) * -1.9;
          slat.position.set(x, -0.7 + sag * 0.5, 0);
          bridgeGroup.add(slat);
        }
        this.levelGroup.add(bridgeGroup);
      }

      // Level 4 (Templo del Mono): ancient stone temple arches
      if (level.index === 3) {
        const archMat = new THREE.MeshStandardMaterial({
          map: this.textures.climbStone,
          bumpMap: this.textures.stoneBump,
          bumpScale: 0.16,
          roughness: 0.88,
        });
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
      }
    } else if (biome === 'desert') {
      // Rolling wind-carved sand dune horizon ridges
      this.addHorizonMountainRing(0, -140, level.theme.hazardFloorY - 1, 120, 220, 38, 0xb87533, 0xe8b66b, 3.1, 0.88);
      this.addHorizonMountainRing(0, -140, level.theme.hazardFloorY - 1, 68, 120, 14, 0xc7833c, 0xf2c982, 1.9, 0.9);

      // Continuous sculpted undulating desert sand dune ridges flanking the canyon & flight corridor
      const duneRidgeGeo = new THREE.PlaneGeometry(76, 330, 16, 44);
      duneRidgeGeo.rotateX(-Math.PI / 2);
      const dPos = duneRidgeGeo.attributes.position;
      for (let i = 0; i < dPos.count; i++) {
        const vx = dPos.getX(i);
        const vz = dPos.getZ(i);
        const ridge =
          Math.max(0, Math.sin(vz * 0.045 + vx * 0.08) * 3.8 + Math.cos(vx * 0.11 - vz * 0.025) * 2.4 + 2.2);
        dPos.setY(i, ridge);
      }
      duneRidgeGeo.computeVertexNormals();
      const duneSurfaceMat = new THREE.MeshStandardMaterial({
        map: this.textures.desertSandstone,
        bumpMap: this.textures.sandBump,
        bumpScale: 0.18,
        roughness: 0.88,
        metalness: 0.02,
      });
      const duneLeft = new THREE.Mesh(duneRidgeGeo, duneSurfaceMat);
      duneLeft.position.set(-56, level.theme.hazardFloorY - 0.8, -145);
      duneLeft.receiveShadow = true;
      const duneRight = new THREE.Mesh(duneRidgeGeo, duneSurfaceMat);
      duneRight.position.set(56, level.theme.hazardFloorY - 0.8, -145);
      duneRight.rotation.y = Math.PI;
      duneRight.receiveShadow = true;
      this.levelGroup.add(duneLeft, duneRight);

      // Weathered Ashlar Limestone Pyramids with sandstone texture & surface bump relief
      const pyrGeo = new THREE.ConeGeometry(16, 22, 4);
      const pyrMat = new THREE.MeshStandardMaterial({
        map: this.textures.desertSandstone,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.22,
        roughness: 0.86,
        metalness: 0.04,
      });
      const pyrSpots: [number, number, number, number][] = [
        [-44, -11, -35, 1.25],
        [48, -11, -65, 1.1],
        [-54, -11, -115, 1.55],
        [50, -11, -165, 1.35],
        [-48, -11, -220, 1.4],
        [46, -11, -270, 1.6],
        [-24, -11, -325, 1.9],
        [30, -11, -335, 1.5],
      ];
      const pyrsInst = new THREE.InstancedMesh(pyrGeo, pyrMat, pyrSpots.length);
      for (let i = 0; i < pyrSpots.length; i++) {
        const [px, py, pz, sc] = pyrSpots[i];
        dummy.position.set(px, py + 10.5 * sc, pz);
        dummy.rotation.set(0, Math.PI / 4 + (i % 2) * 0.16, 0);
        dummy.scale.set(sc, sc, sc);
        dummy.updateMatrix();
        pyrsInst.setMatrixAt(i, dummy.matrix);
        _color.setHex(i % 2 === 0 ? 0xd9a164 : 0xe8b878);
        pyrsInst.setColorAt(i, _color);
      }
      pyrsInst.instanceMatrix.needsUpdate = true;
      if (pyrsInst.instanceColor) pyrsInst.instanceColor.needsUpdate = true;
      pyrsInst.computeBoundingSphere();
      this.levelGroup.add(pyrsInst);

      // Stratified Eroded Desert Sandstone Mesas / Buttes along flanking canyon
      const mesaCount = 28;
      const mesaGeo = new THREE.CylinderGeometry(3.8, 7.6, 17, 7);
      const mesaMat = new THREE.MeshStandardMaterial({
        map: this.textures.desertSide,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.24,
        roughness: 0.9,
      });
      const mesas = new THREE.InstancedMesh(mesaGeo, mesaMat, mesaCount);
      for (let i = 0; i < mesaCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 28 + ((i * 23) % 52);
        const z = 4 - i * 10.5;
        const sc = 0.85 + (i % 4) * 0.35;
        dummy.position.set(side * dist, -4.5 + (i % 3) * 1.4, z);
        dummy.rotation.set(0, i * 0.7, 0);
        dummy.scale.set(sc * 1.1, sc, sc * 1.1);
        dummy.updateMatrix();
        mesas.setMatrixAt(i, dummy.matrix);
      }
      mesas.instanceMatrix.needsUpdate = true;
      mesas.computeBoundingSphere();
      this.levelGroup.add(mesas);

      // Realistic Curved Desert Date Palms (textured bark + stone clusters + two-tier arched feather fronds)
      const sandTopMat = new THREE.MeshStandardMaterial({
        map: this.textures.desertSandstone,
        bumpMap: this.textures.sandBump,
        bumpScale: 0.08,
        roughness: 0.88,
      });
      const sandSideMat = new THREE.MeshStandardMaterial({
        map: this.textures.desertSide,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.14,
        roughness: 0.9,
      });
      const palmTrunkMat = new THREE.MeshStandardMaterial({
        map: this.textures.barkTexture,
        bumpMap: this.textures.barkBump,
        bumpScale: 0.18,
        color: 0x9c6e4b,
        roughness: 0.9,
      });
      const palmFrondUpper = new THREE.MeshStandardMaterial({ color: 0x5c7d22, roughness: 0.76 });
      const palmFrondLower = new THREE.MeshStandardMaterial({ color: 0x878c28, roughness: 0.82 });
      const desertStoneGeo = this.createDisplacedRockGeometry(0.7, 9.1);
      const warmStoneMat = new THREE.MeshStandardMaterial({
        map: this.textures.desertSandstone,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.16,
        color: 0xc28956,
        roughness: 0.88,
      });

      const palmSpots: [number, number, number, number][] = [
        [-13, -3.5, -14, 1.15],
        [13, -3.5, -24, 1.1],
        [-14, -2.5, -46, 1.2],
        [15, -2.0, -58, 1.15],
        [-17, -2.0, -105, 1.25],
        [17, -2.0, -140, 1.2],
        [-17, -2.0, -185, 1.25],
        [17, -2.0, -225, 1.18],
        [-14, 3.2, -264, 1.1],
        [14, 4.0, -278, 1.15],
      ];

      for (let idx = 0; idx < palmSpots.length; idx++) {
        const [px, py, pz, sc] = palmSpots[idx];
        const pg = new THREE.Group();
        pg.position.set(px, py, pz);
        pg.rotation.y = idx * 1.1;

        const islet = new THREE.Mesh(
          new THREE.CylinderGeometry(3.2 * sc, 3.9 * sc, 3.6, 12),
          [sandSideMat, sandTopMat, sandSideMat]
        );
        islet.position.y = -1.7;
        pg.add(islet);

        const lean = (idx % 2 === 0 ? 1 : -1) * 1.1 * sc;
        const trunkCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(lean * 0.35, 3.2 * sc, 0.25 * sc),
          new THREE.Vector3(lean * 0.75, 6.2 * sc, 0.1 * sc),
          new THREE.Vector3(lean, 8.8 * sc, -0.15 * sc),
        ]);
        const trunkMesh = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 12, 0.36 * sc, 8, false), palmTrunkMat);
        pg.add(trunkMesh);

        for (let r = 0; r < 3; r++) {
          const rAng = (r / 3) * Math.PI * 2 + idx;
          const st = new THREE.Mesh(desertStoneGeo, warmStoneMat);
          st.position.set(Math.cos(rAng) * 0.78 * sc, 0.28 * sc, Math.sin(rAng) * 0.78 * sc);
          st.scale.set(sc * 1.15, sc * 0.7, sc);
          pg.add(st);
        }

        const crownPos = new THREE.Vector3(lean, 8.8 * sc, -0.15 * sc);
        for (let tier = 0; tier < 2; tier++) {
          const count = tier === 0 ? 6 : 5;
          for (let f = 0; f < count; f++) {
            const fAng = (f / count) * Math.PI * 2 + tier * 0.55;
            const bladeGroup = new THREE.Group();
            bladeGroup.position.copy(crownPos);
            bladeGroup.rotation.y = fAng;

            const frond = new THREE.Mesh(
              new THREE.ConeGeometry(0.62 * sc, (tier === 0 ? 4.3 : 3.6) * sc, 5),
              tier === 0 ? palmFrondUpper : palmFrondLower
            );
            frond.scale.set(1.0, 1.0, 0.18);
            frond.rotation.z = tier === 0 ? -1.16 : -1.48;
            frond.position.set(1.95 * sc, tier === 0 ? 0.15 * sc : -0.45 * sc, 0);
            bladeGroup.add(frond);
            pg.add(bladeGroup);
          }
        }

        this.levelGroup.add(pg);
      }

      // Natural Ribbed Saguaro Cacti with rounded dome tips
      const cactusCount = 34;
      const cacTrunkGeo = new THREE.CylinderGeometry(0.4, 0.36, 4.4, 10);
      const cacTipGeo = new THREE.SphereGeometry(0.4, 8, 6);
      const cacArmGeo = new THREE.CylinderGeometry(0.27, 0.26, 1.85, 8);
      const cacMat = new THREE.MeshStandardMaterial({ color: 0x5d7324, roughness: 0.8 });
      const cacTrunks = new THREE.InstancedMesh(cacTrunkGeo, cacMat, cactusCount);
      const cacTips = new THREE.InstancedMesh(cacTipGeo, cacMat, cactusCount);
      const cacArmL = new THREE.InstancedMesh(cacArmGeo, cacMat, cactusCount);
      const cacArmR = new THREE.InstancedMesh(cacArmGeo, cacMat, cactusCount);

      for (let i = 0; i < cactusCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 18 + ((i * 17) % 44);
        const z = 8 - i * 8.6;
        const sc = 0.8 + (i % 4) * 0.25;
        const baseY = level.theme.hazardFloorY + 0.5;
        const cx = side * dist;

        dummy.position.set(cx, baseY + 2.2 * sc, z);
        dummy.rotation.set(0, i * 0.9, 0);
        dummy.scale.set(sc, sc, sc);
        dummy.updateMatrix();
        cacTrunks.setMatrixAt(i, dummy.matrix);
        _color.setHex(i % 2 === 0 ? 0x627826 : 0x4d611d);
        cacTrunks.setColorAt(i, _color);

        dummy.position.set(cx, baseY + 4.4 * sc, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(sc, sc, sc);
        dummy.updateMatrix();
        cacTips.setMatrixAt(i, dummy.matrix);

        const yaw = i * 0.9;
        const ox = Math.cos(yaw) * 0.82 * sc;
        const oz = -Math.sin(yaw) * 0.82 * sc;
        dummy.position.set(cx + ox, baseY + 2.8 * sc, z + oz);
        dummy.rotation.set(0, yaw, -0.32);
        dummy.scale.set(sc, sc, sc);
        dummy.updateMatrix();
        cacArmL.setMatrixAt(i, dummy.matrix);

        dummy.position.set(cx - ox, baseY + 2.2 * sc, z - oz);
        dummy.rotation.set(0, yaw, 0.32);
        dummy.scale.set(sc, sc * 0.85, sc);
        dummy.updateMatrix();
        cacArmR.setMatrixAt(i, dummy.matrix);
      }
      for (const im of [cacTrunks, cacTips, cacArmL, cacArmR]) {
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.computeBoundingSphere();
      }
      this.levelGroup.add(cacTrunks, cacTips, cacArmL, cacArmR);

      // Displaced Sandstone Rock Outcrops + Desert Agave / Palm Shrubs
      const desertDecorSpots: [number, number, number, number][] = [
        [-3.8, 1.0, 3.6, 0.65],
        [3.8, 1.0, 3.6, 0.62],
        [-3.9, 1.0, -3.5, 0.58],
        [-4.5, 8.2, -253.2, 0.72],
        [4.5, 8.2, -262.8, 0.68],
        [-4.1, 9.9, -287.6, 0.68],
        [4.1, 9.9, -287.6, 0.64],
        [-12.5, -3.5, -13.5, 0.9],
        [12.5, -3.5, -23.5, 0.85],
        [-13.5, -2.5, -45.5, 0.95],
      ];
      const dRockInst = new THREE.InstancedMesh(desertStoneGeo, warmStoneMat, desertDecorSpots.length);
      const shrubGeo = new THREE.ConeGeometry(0.28, 1.45, 5);
      const shrubInst = new THREE.InstancedMesh(shrubGeo, palmFrondUpper, desertDecorSpots.length * 6);

      let shIdx = 0;
      for (let i = 0; i < desertDecorSpots.length; i++) {
        const [rx, ry, rz, rs] = desertDecorSpots[i];
        dummy.position.set(rx, ry + 0.22 * rs, rz);
        dummy.rotation.set(0.15, i * 1.2, 0);
        dummy.scale.set(rs * 1.25, rs * 0.72, rs);
        dummy.updateMatrix();
        dRockInst.setMatrixAt(i, dummy.matrix);

        const sx = rx + (i % 2 === 0 ? 0.7 : -0.7) * rs;
        const sz = rz + 0.35 * rs;
        for (let f = 0; f < 6; f++) {
          const ang = (f / 6) * Math.PI * 2 + i * 0.4;
          dummy.position.set(sx + Math.cos(ang) * 0.42 * rs, ry + 0.46 * rs, sz + Math.sin(ang) * 0.42 * rs);
          dummy.rotation.set(0, -ang, -0.88);
          dummy.scale.set(rs, rs, rs * 0.22);
          dummy.updateMatrix();
          shrubInst.setMatrixAt(shIdx, dummy.matrix);
          _color.setHex(f % 2 === 0 ? 0x627c24 : 0x4b631a);
          shrubInst.setColorAt(shIdx, _color);
          shIdx++;
        }
      }
      dRockInst.instanceMatrix.needsUpdate = true;
      dRockInst.computeBoundingSphere();
      shrubInst.instanceMatrix.needsUpdate = true;
      if (shrubInst.instanceColor) shrubInst.instanceColor.needsUpdate = true;
      shrubInst.computeBoundingSphere();
      this.levelGroup.add(dRockInst, shrubInst);
    } else if (biome === 'temple') {
      // Sunlit rainforest canopy horizon rings
      this.addHorizonMountainRing(-8, -45, level.theme.hazardFloorY - 2, 115, 195, 44, 0x3b7a36, 0x8bc45a, 2.5, 0.9);
      this.addHorizonMountainRing(-8, -45, level.theme.hazardFloorY - 1, 78, 125, 22, 0x1a4f26, 0x478a35, 1.4, 0.92);

      // Monumental Stepped Aztec / Maya Stone Pyramid Temples (multi-part 3D groups)
      const tTopMat = new THREE.MeshStandardMaterial({
        map: this.textures.templeTop,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.14,
        roughness: 0.86,
      });
      const tSideMat = new THREE.MeshStandardMaterial({
        map: this.textures.templeSide,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.18,
        roughness: 0.88,
      });
      const tDoorMat = new THREE.MeshStandardMaterial({ color: 0x1c140c, roughness: 0.95 });
      const tMossMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleGrass,
        bumpMap: this.textures.grassBump,
        bumpScale: 0.08,
        roughness: 0.85,
      });

      const templeSpots: [number, number, number, number, number][] = [
        [-31, -11, -30, 1.05, 0.52],
        [29, -11, -58, 1.12, -0.48],
        [8, -11, -118, 1.38, 0.08],
      ];
      for (const [tx, ty, tz, sc, rotY] of templeSpots) {
        const tg = new THREE.Group();
        tg.position.set(tx, ty, tz);
        tg.rotation.y = rotY;

        for (let tier = 0; tier < 5; tier++) {
          const w = (22 - tier * 3.5) * sc;
          const h = 3.2 * sc;
          const tierMesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, w),
            [tSideMat, tSideMat, tTopMat, tSideMat, tSideMat, tSideMat]
          );
          tierMesh.position.y = (tier + 0.5) * h;
          tg.add(tierMesh);
        }

        // Summit sanctuary & dark doorway
        const sanctum = new THREE.Mesh(new THREE.BoxGeometry(6.8 * sc, 4.2 * sc, 6.4 * sc), tSideMat);
        sanctum.position.y = 18.0 * sc;
        const doorway = new THREE.Mesh(new THREE.BoxGeometry(2.4 * sc, 2.8 * sc, 0.4 * sc), tDoorMat);
        doorway.position.set(0, 17.4 * sc, 3.1 * sc);
        tg.add(sanctum, doorway);

        // Grand central stone staircase + twin balustrades
        for (let st = 0; st < 11; st++) {
          const step = new THREE.Mesh(new THREE.BoxGeometry(4.2 * sc, 1.45 * sc, 2.2 * sc), tTopMat);
          step.position.set(0, (st + 0.5) * 1.45 * sc, (11.5 - st * 0.82) * sc);
          tg.add(step);
        }
        const balL = new THREE.Mesh(new THREE.BoxGeometry(0.9 * sc, 1.5 * sc, 12.2 * sc), tSideMat);
        balL.position.set(-2.45 * sc, 8.2 * sc, 7.3 * sc);
        balL.rotation.x = -0.78;
        const balR = balL.clone();
        balR.position.x = 2.45 * sc;
        tg.add(balL, balR);

        // Overgrown jungle moss bushes on temple terrace corners
        for (let m = 0; m < 4; m++) {
          const bush = new THREE.Mesh(this.createDisplacedRockGeometry(1.5 * sc, m + 1.2), tMossMat);
          bush.position.set((m % 2 === 0 ? -1 : 1) * 7.2 * sc, 6.6 * sc, (m < 2 ? 1 : -1) * 6.8 * sc);
          bush.scale.set(1.2, 0.65, 1.1);
          tg.add(bush);
        }

        this.levelGroup.add(tg);
      }

      // Slender Tropical Palms & Twisted Reddish-Brown Hardwood Trees
      const palmBarkMat = new THREE.MeshStandardMaterial({
        map: this.textures.barkTexture,
        bumpMap: this.textures.barkBump,
        bumpScale: 0.16,
        color: 0x8c5534,
        roughness: 0.9,
      });
      const redBarkMat = new THREE.MeshStandardMaterial({
        map: this.textures.barkTexture,
        bumpMap: this.textures.barkBump,
        bumpScale: 0.16,
        color: 0x7c3825,
        roughness: 0.88,
      });
      const leafEmerald = new THREE.MeshStandardMaterial({ color: 0x3b8526, roughness: 0.78 });
      const leafLime = new THREE.MeshStandardMaterial({ color: 0x62a832, roughness: 0.76 });
      const templeClusterGeo = this.createDisplacedRockGeometry(2.1, 4.3);

      const tPalmSpots: [number, number, number, number][] = [
        [-13, -4, -10, 1.1],
        [13, -4, -18, 1.15],
        [-15, -2, -40, 1.15],
        [15, -2, -52, 1.12],
        [-28, 3, -72, 1.18],
        [0, 3, -78, 1.1],
      ];
      for (let i = 0; i < tPalmSpots.length; i++) {
        const [px, py, pz, sc] = tPalmSpots[i];
        const pg = new THREE.Group();
        pg.position.set(px, py, pz);
        const lean = (i % 2 === 0 ? 1 : -1) * 0.9 * sc;
        const pCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(lean * 0.4, 5.5 * sc, 0.2 * sc),
          new THREE.Vector3(lean, 11.2 * sc, -0.1 * sc),
        ]);
        pg.add(new THREE.Mesh(new THREE.TubeGeometry(pCurve, 10, 0.34 * sc, 7, false), palmBarkMat));

        const crown = new THREE.Vector3(lean, 11.2 * sc, -0.1 * sc);
        for (let f = 0; f < 7; f++) {
          const fAng = (f / 7) * Math.PI * 2 + i * 0.4;
          const fg = new THREE.Group();
          fg.position.copy(crown);
          fg.rotation.y = fAng;
          const frond = new THREE.Mesh(new THREE.ConeGeometry(0.65 * sc, 4.2 * sc, 5), f % 2 === 0 ? leafEmerald : leafLime);
          frond.scale.set(1.0, 1.0, 0.18);
          frond.rotation.z = -1.2;
          frond.position.set(1.9 * sc, 0, 0);
          fg.add(frond);
          pg.add(fg);
        }
        this.levelGroup.add(pg);
      }

      const tHardwoodSpots: [number, number, number, number][] = [
        [-14, -4, -22, 1.1],
        [14, -4, -28, 1.08],
        [-26, 4, -56, 1.15],
        [-6, 4, -64, 1.05],
      ];
      for (let i = 0; i < tHardwoodSpots.length; i++) {
        const [hx, hy, hz, sc] = tHardwoodSpots[i];
        const hg = new THREE.Group();
        hg.position.set(hx, hy, hz);
        const tCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0.4 * sc, 4.2 * sc, -0.2 * sc),
          new THREE.Vector3(-0.3 * sc, 8.6 * sc, 0.2 * sc),
        ]);
        hg.add(new THREE.Mesh(new THREE.TubeGeometry(tCurve, 10, 0.65 * sc, 8, false), redBarkMat));
        for (let c = 0; c < 3; c++) {
          const cAng = (c / 3) * Math.PI * 2 + i;
          const lobe = new THREE.Mesh(templeClusterGeo, c === 0 ? leafLime : leafEmerald);
          lobe.position.set(Math.cos(cAng) * 1.9 * sc, (9.8 - c * 0.4) * sc, Math.sin(cAng) * 1.9 * sc);
          lobe.scale.set(1.25 * sc, 0.75 * sc, 1.25 * sc);
          hg.add(lobe);
        }
        this.levelGroup.add(hg);
      }

      // Exotic Broad-Leaf Banana/Monstera Plants & Weathered Temple Ruin Stones on safe corners
      const templeDecorSpots: [number, number, number, number][] = [
        [-3.9, 1.0, 3.8, 0.68],
        [3.9, 1.0, 3.8, 0.65],
        [-2.9, 1.3, -14.2, 0.6],
        [2.9, 1.3, -8.8, 0.58],
        [-2.8, 8.9, -40.2, 0.62],
        [-20.2, 23.3, -87.8, 0.72],
        [-11.8, 23.3, -87.8, 0.68],
      ];
      const ruinRockGeo = this.createDisplacedRockGeometry(0.85, 6.2);
      const ruinInst = new THREE.InstancedMesh(ruinRockGeo, tTopMat, templeDecorSpots.length);
      const broadLeafGeo = new THREE.ConeGeometry(0.45, 2.0, 5);
      const broadLeafInst = new THREE.InstancedMesh(broadLeafGeo, leafEmerald, templeDecorSpots.length * 6);
      let blIdx = 0;
      for (let i = 0; i < templeDecorSpots.length; i++) {
        const [rx, ry, rz, rs] = templeDecorSpots[i];
        dummy.position.set(rx, ry + 0.25 * rs, rz);
        dummy.rotation.set(0.1, i * 0.9, 0);
        dummy.scale.set(rs * 1.25, rs * 0.75, rs);
        dummy.updateMatrix();
        ruinInst.setMatrixAt(i, dummy.matrix);

        const lx = rx + (i % 2 === 0 ? 0.8 : -0.8) * rs;
        const lz = rz + 0.35 * rs;
        for (let f = 0; f < 6; f++) {
          const ang = (f / 6) * Math.PI * 2 + i * 0.5;
          dummy.position.set(lx + Math.cos(ang) * 0.45 * rs, ry + 0.68 * rs, lz + Math.sin(ang) * 0.45 * rs);
          dummy.rotation.set(0, -ang, -0.75);
          dummy.scale.set(rs * 1.15, rs, rs * 0.16);
          dummy.updateMatrix();
          broadLeafInst.setMatrixAt(blIdx, dummy.matrix);
          _color.setHex(f % 2 === 0 ? 0x5ca832 : 0x2f7520);
          broadLeafInst.setColorAt(blIdx, _color);
          blIdx++;
        }
      }
      ruinInst.instanceMatrix.needsUpdate = true;
      ruinInst.computeBoundingSphere();
      broadLeafInst.instanceMatrix.needsUpdate = true;
      if (broadLeafInst.instanceColor) broadLeafInst.instanceColor.needsUpdate = true;
      broadLeafInst.computeBoundingSphere();
      this.levelGroup.add(ruinInst, broadLeafInst);
    } else if (biome === 'ice') {
      // Asymmetric Alaskan Arctic Fjord Mountain Horizons (snow-covered peaks + dark slate coastal cliffs)
      this.addHorizonMountainRing(-24, -55, level.theme.hazardFloorY - 2, 110, 200, 62, 0x6eaee0, 0xf8fcff, 5.2, 0.72);
      this.addHorizonMountainRing(-24, -55, level.theme.hazardFloorY - 1, 76, 122, 28, 0x164266, 0x9bd2f2, 3.4, 0.85);

      // Sculpted 3D Floating Glacial Icebergs (Translucent Turquoise Base + Sunlit Snow Cap)
      const bergCount = 52;
      const bergBaseGeo = this.createDisplacedRockGeometry(3.4, 2.3);
      const bergBaseMat = new THREE.MeshPhysicalMaterial({
        map: this.textures.iceSide,
        bumpMap: this.textures.iceBump,
        bumpScale: 0.14,
        color: 0xffffff,
        roughness: 0.16,
        metalness: 0.08,
        clearcoat: 0.92,
      });
      const bergSnowGeo = this.createDisplacedRockGeometry(2.9, 4.1);
      const bergSnowMat = new THREE.MeshStandardMaterial({
        map: this.textures.iceCrystal,
        bumpMap: this.textures.iceBump,
        bumpScale: 0.08,
        color: 0xf4fbff,
        roughness: 0.45,
      });

      const bergBases = new THREE.InstancedMesh(bergBaseGeo, bergBaseMat, bergCount);
      const bergSnows = new THREE.InstancedMesh(bergSnowGeo, bergSnowMat, bergCount);
      for (let i = 0; i < bergCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 22 + ((i * 19) % 62);
        const z = 12 - ((i * 21) % 134);
        const x = (i % 2 === 0 ? -48 : 0) + side * dist;
        const sc = 0.85 + (i % 5) * 0.34;
        const isTallPeak = i % 3 === 0;
        const hScale = isTallPeak ? sc * 1.95 : sc * 0.72;
        const baseY = level.theme.hazardFloorY + (isTallPeak ? 1.8 * sc : 0.4 * sc);

        dummy.position.set(x, baseY, z);
        dummy.rotation.set((i % 3) * 0.12, i * 0.8, (i % 2) * 0.08);
        dummy.scale.set(sc * 1.25, hScale, sc * 1.15);
        dummy.updateMatrix();
        bergBases.setMatrixAt(i, dummy.matrix);
        _color.setHex(i % 2 === 0 ? 0xa3defc : 0x7ac7f2);
        bergBases.setColorAt(i, _color);

        dummy.position.set(x, baseY + hScale * 2.1, z);
        dummy.rotation.set(0, i * 0.8, 0);
        dummy.scale.set(sc * 1.12, hScale * 0.48, sc * 1.05);
        dummy.updateMatrix();
        bergSnows.setMatrixAt(i, dummy.matrix);
      }
      for (const im of [bergBases, bergSnows]) {
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.computeBoundingSphere();
      }
      this.levelGroup.add(bergBases, bergSnows);

      // Flat Sea-Ice Floes drifting on the calm fjord water
      const floeCount = 36;
      const floeGeo = new THREE.CylinderGeometry(3.2, 3.6, 0.45, 7);
      const floes = new THREE.InstancedMesh(floeGeo, bergSnowMat, floeCount);
      for (let i = 0; i < floeCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 16 + ((i * 23) % 58);
        const z = 14 - ((i * 25) % 136);
        const x = (i % 2 === 0 ? -46 : 0) + side * dist;
        const sc = 0.7 + (i % 4) * 0.35;
        dummy.position.set(x, level.theme.hazardFloorY + 0.16, z);
        dummy.rotation.set(0, i * 0.65, 0);
        dummy.scale.set(sc * 1.3, 1, sc);
        dummy.updateMatrix();
        floes.setMatrixAt(i, dummy.matrix);
      }
      floes.instanceMatrix.needsUpdate = true;
      floes.computeBoundingSphere();
      this.levelGroup.add(floes);

      // Snow-Dusted Dark Arctic Slate Rocks on safe platform corners
      const iceRockSpots: [number, number, number, number][] = [
        [-4.0, 1.0, 3.8, 0.68],
        [4.0, 1.0, 3.8, 0.62],
        [-3.4, 2.6, -17.2, 0.6],
        [-51.8, 6.7, -51.2, 0.72],
        [-44.2, 6.7, -58.8, 0.65],
        [-52.2, 12.9, -114.2, 0.75],
        [-43.8, 12.9, -114.2, 0.7],
      ];
      const slateGeo = this.createDisplacedRockGeometry(0.9, 6.7);
      const slateMat = new THREE.MeshStandardMaterial({
        color: 0x264869,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.16,
        roughness: 0.85,
      });
      const slateInst = new THREE.InstancedMesh(slateGeo, slateMat, iceRockSpots.length);
      const snowCapInst = new THREE.InstancedMesh(this.createDisplacedRockGeometry(0.72, 2.9), bergSnowMat, iceRockSpots.length);
      for (let i = 0; i < iceRockSpots.length; i++) {
        const [rx, ry, rz, rs] = iceRockSpots[i];
        dummy.position.set(rx, ry + 0.25 * rs, rz);
        dummy.rotation.set(0.1, i * 1.1, 0);
        dummy.scale.set(rs * 1.2, rs * 0.78, rs);
        dummy.updateMatrix();
        slateInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(rx, ry + 0.62 * rs, rz);
        dummy.scale.set(rs * 1.0, rs * 0.3, rs * 0.85);
        dummy.updateMatrix();
        snowCapInst.setMatrixAt(i, dummy.matrix);
      }
      slateInst.instanceMatrix.needsUpdate = true;
      slateInst.computeBoundingSphere();
      snowCapInst.instanceMatrix.needsUpdate = true;
      snowCapInst.computeBoundingSphere();
      this.levelGroup.add(slateInst, snowCapInst);
    } else if (biome === 'volcanic') {
      // Jagged Dark Obsidian Caldera Horizon Ring
      this.addHorizonMountainRing(0, -115, level.theme.hazardFloorY - 2, 105, 195, 58, 0x160c0e, 0x7c1d12, 7.7, 0.92);

      // Fractured Obsidian Rock Cliffs with Glowing Magma Fissures
      const colCount = 56;
      const colGeo = new THREE.CylinderGeometry(2.1, 3.6, 22, 6);
      const colMat = new THREE.MeshStandardMaterial({
        map: this.textures.volcanicSide,
        emissiveMap: this.textures.volcanicSideEmissive,
        emissive: 0xff6a00,
        emissiveIntensity: 1.5,
        bumpMap: this.textures.basaltBump,
        bumpScale: 0.22,
        roughness: 0.86,
        metalness: 0.16,
      });
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

      // Hero Erupting Volcanoes (faceted obsidian cones + glowing magma craters + lava fountain bursts + lava streams)
      const volcMat = new THREE.MeshStandardMaterial({
        map: this.textures.volcanicSide,
        emissiveMap: this.textures.volcanicSideEmissive,
        emissive: 0xff5a00,
        emissiveIntensity: 1.65,
        bumpMap: this.textures.basaltBump,
        bumpScale: 0.24,
        roughness: 0.88,
      });
      const magmaPoolMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf97316,
        emissiveIntensity: 2.8,
        roughness: 0.2,
      });
      const lavaJetMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });

      const volcSpots: [number, number, number, number][] = [
        [-40, -12, -52, 1.1],
        [42, -12, -112, 1.2],
        [-42, -12, -172, 1.15],
        [40, -12, -228, 1.25],
      ];
      for (let idx = 0; idx < volcSpots.length; idx++) {
        const [vx, vy, vz, sc] = volcSpots[idx];
        const vg = new THREE.Group();
        vg.position.set(vx, vy, vz);

        const cone = new THREE.Mesh(new THREE.CylinderGeometry(4.8 * sc, 16.5 * sc, 26 * sc, 8, 1, true), volcMat);
        cone.position.y = 13 * sc;
        const craterGlow = new THREE.Mesh(new THREE.CylinderGeometry(4.5 * sc, 4.2 * sc, 1.0 * sc, 10), magmaPoolMat);
        craterGlow.position.y = 25.4 * sc;
        vg.add(cone, craterGlow);

        // Glowing molten lava overflow stream pouring down the slope
        const streamCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 25.4 * sc, 4.2 * sc),
          new THREE.Vector3(0.6 * sc, 14 * sc, 9.8 * sc),
          new THREE.Vector3(-0.4 * sc, 1.0 * sc, 15.6 * sc),
        ]);
        const lavaFlow = new THREE.Mesh(new THREE.TubeGeometry(streamCurve, 10, 0.85 * sc, 6, false), magmaPoolMat);
        lavaFlow.rotation.y = (vx < 0 ? 1 : -1) * 1.15;
        vg.add(lavaFlow);

        // Sculpted Lava Eruption Fountain Plume (arcs & molten droplets bursting from crater)
        for (let j = 0; j < 7; j++) {
          const jAng = (j / 7) * Math.PI * 2 + idx;
          const jCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 25.5 * sc, 0),
            new THREE.Vector3(Math.cos(jAng) * 2.4 * sc, (32 + (j % 3) * 2.5) * sc, Math.sin(jAng) * 2.4 * sc),
            new THREE.Vector3(Math.cos(jAng) * 5.2 * sc, 24.5 * sc, Math.sin(jAng) * 5.2 * sc),
          ]);
          vg.add(new THREE.Mesh(new THREE.TubeGeometry(jCurve, 8, (0.28 + (j % 2) * 0.14) * sc, 5, false), lavaJetMat));

          const drop = new THREE.Mesh(this.createDisplacedRockGeometry(0.55 * sc, j + 1.5), magmaPoolMat);
          drop.position.set(Math.cos(jAng) * 3.8 * sc, (33 + (j % 3) * 2.2) * sc, Math.sin(jAng) * 3.8 * sc);
          vg.add(drop);
        }

        this.levelGroup.add(vg);
      }

      // Volcanic Obsidian Boulders along safe platform rims & emerging from molten lava river
      const vRockSpots: [number, number, number, number][] = [
        [-4.2, 1.0, 3.8, 0.72],
        [4.2, 1.0, 3.8, 0.68],
        [-3.9, 2.2, -19.8, 0.65],
        [3.9, 2.2, -27.2, 0.62],
        [-4.8, 9.2, -207.2, 0.78],
        [4.8, 9.2, -216.8, 0.74],
        [-4.6, 11.4, -244.4, 0.8],
        [4.6, 11.4, -244.4, 0.75],
        [-16, -11.5, -35, 1.9],
        [17, -11.5, -75, 2.1],
        [-18, -11.5, -135, 2.2],
        [18, -11.5, -180, 2.0],
      ];
      const vRockGeo = this.createDisplacedRockGeometry(1.0, 8.1);
      const vRockMat = new THREE.MeshStandardMaterial({
        map: this.textures.volcanicBasalt,
        emissiveMap: this.textures.volcanicEmissive,
        emissive: 0xff5a00,
        emissiveIntensity: 1.4,
        bumpMap: this.textures.basaltBump,
        bumpScale: 0.18,
        roughness: 0.85,
      });
      const vRocksInst = new THREE.InstancedMesh(vRockGeo, vRockMat, vRockSpots.length);
      for (let i = 0; i < vRockSpots.length; i++) {
        const [rx, ry, rz, rs] = vRockSpots[i];
        dummy.position.set(rx, ry + 0.25 * rs, rz);
        dummy.rotation.set(0.1, i * 1.2, 0);
        dummy.scale.set(rs * 1.25, rs * 0.75, rs);
        dummy.updateMatrix();
        vRocksInst.setMatrixAt(i, dummy.matrix);
      }
      vRocksInst.instanceMatrix.needsUpdate = true;
      vRocksInst.computeBoundingSphere();
      this.levelGroup.add(vRocksInst);
    } else if (biome === 'nebula') {
      // NEBULA CITADEL: Sharp Indigo-Violet Crystal Mountains + Luminous Ringed Cyan Planet + Violet Rocks & Golden Pools
      this.addHorizonMountainRing(16, -75, level.theme.hazardFloorY - 2, 112, 205, 54, 0x261a66, 0x6759e8, 9.9, 0.68);

      // Faceted Indigo-Cyan Citadel Monoliths & Alien Purple Slate Outcrops
      const spireCount = 52;
      const monoGeo = new THREE.OctahedronGeometry(2.6, 0);
      const monoMat = new THREE.MeshPhysicalMaterial({
        color: 0x3b288f,
        roughness: 0.24,
        metalness: 0.62,
        clearcoat: 0.85,
      });
      const monos = new THREE.InstancedMesh(monoGeo, monoMat, spireCount);
      for (let i = 0; i < spireCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 30 + ((i * 19) % 68);
        const z = 10 - i * 3.4;
        const scale = 0.8 + (i % 5) * 0.35;
        dummy.position.set(16 + side * dist, -3 + (i % 5) * 2.6, z);
        dummy.rotation.set(0, i * 0.6, 0);
        dummy.scale.set(scale * 0.75, scale * 2.4, scale * 0.75);
        dummy.updateMatrix();
        monos.setMatrixAt(i, dummy.matrix);
        _color.setHex(i % 2 === 0 ? 0x4532a8 : 0x2b1d6e);
        monos.setColorAt(i, _color);
      }
      monos.instanceMatrix.needsUpdate = true;
      if (monos.instanceColor) monos.instanceColor.needsUpdate = true;
      monos.computeBoundingSphere();
      this.levelGroup.add(monos);

      // Alien Faceted Violet-Slate Rock Clusters + Glowing Golden-Amber Energy Pools on the violet plain
      const alienRockSpots: [number, number, number, number][] = [
        [-4.2, 1.0, 3.8, 0.68],
        [4.2, 1.0, 3.8, 0.65],
        [-12.6, 12.0, -125.6, 0.88],
        [12.6, 12.0, -125.6, 0.85],
        [-12.6, 12.0, -150.4, 0.9],
        [12.6, 12.0, -150.4, 0.86],
        [-18, -12.6, -24, 1.9],
        [19, -12.6, -48, 2.1],
        [-22, -12.6, -98, 2.2],
        [52, -12.6, -78, 2.1],
        [-26, -12.6, -138, 2.4],
        [26, -12.6, -138, 2.3],
      ];
      const alienRockGeo = this.createDisplacedRockGeometry(1.0, 4.7);
      const alienRockMat = new THREE.MeshStandardMaterial({
        color: 0x452b8c,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.16,
        roughness: 0.82,
        metalness: 0.18,
      });
      const alienRocksInst = new THREE.InstancedMesh(alienRockGeo, alienRockMat, alienRockSpots.length);
      for (let i = 0; i < alienRockSpots.length; i++) {
        const [rx, ry, rz, rs] = alienRockSpots[i];
        dummy.position.set(rx, ry + 0.28 * rs, rz);
        dummy.rotation.set(0.12, i * 1.1, 0);
        dummy.scale.set(rs * 1.3, rs * 0.78, rs);
        dummy.updateMatrix();
        alienRocksInst.setMatrixAt(i, dummy.matrix);
      }
      alienRocksInst.instanceMatrix.needsUpdate = true;
      alienRocksInst.computeBoundingSphere();
      this.levelGroup.add(alienRocksInst);

      // Glowing Golden-Amber Alien Pools scattered across the violet floor below
      const poolCount = 24;
      const poolGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.14, 14);
      const poolMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 2.2,
        roughness: 0.2,
      });
      const poolsInst = new THREE.InstancedMesh(poolGeo, poolMat, poolCount);
      for (let i = 0; i < poolCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 18 + ((i * 19) % 52);
        const z = 8 - i * 7.2;
        const sc = 0.75 + (i % 4) * 0.35;
        dummy.position.set(12 + side * dist, level.theme.hazardFloorY + 0.08, z);
        dummy.rotation.set(0, i * 0.7, 0);
        dummy.scale.set(sc * 1.35, 1, sc * 0.8);
        dummy.updateMatrix();
        poolsInst.setMatrixAt(i, dummy.matrix);
      }
      poolsInst.instanceMatrix.needsUpdate = true;
      poolsInst.computeBoundingSphere();
      this.levelGroup.add(poolsInst);

      // Luminous 3D Ringed Cyan-White Gas Giant + Secondary Striped Moon in Sky
      const planetGroup = new THREE.Group();
      planetGroup.position.set(16, 46, -210);
      const planet = new THREE.Mesh(
        new THREE.SphereGeometry(22, 28, 22),
        new THREE.MeshStandardMaterial({
          color: 0xa5f3fc,
          emissive: 0x22a6c4,
          emissiveIntensity: 0.75,
          roughness: 0.45,
        })
      );
      const pRing = new THREE.Mesh(
        new THREE.TorusGeometry(35, 3.0, 8, 48),
        new THREE.MeshBasicMaterial({ color: 0xcffafe, transparent: true, opacity: 0.65 })
      );
      pRing.rotation.set(1.22, 0.24, -0.26);
      planetGroup.add(planet, pRing);

      const moon = new THREE.Mesh(
        new THREE.SphereGeometry(7.5, 20, 16),
        new THREE.MeshStandardMaterial({
          color: 0xbae6fd,
          emissive: 0x0ea5e9,
          emissiveIntensity: 0.45,
          roughness: 0.55,
        })
      );
      moon.position.set(-72, 12, 32);
      planetGroup.add(moon);
      this.levelGroup.add(planetGroup);
    } else if (biome === 'paris') {
      // Iconic Coral-Terracotta Eiffel Tower standing beneath the summit launch deck
      const eiffel = createEiffelTowerMesh(this.textures.parisStone);
      eiffel.position.set(0, level.theme.hazardFloorY, 0);
      this.levelGroup.add(eiffel);

      // Grand Arc de Triomphe framing the goal portal at Champs-Élysées Plaza
      const arc = createArcDeTriompheMesh(this.textures.parisStone);
      arc.position.set(0, 4.5, -367);
      this.levelGroup.add(arc);

      // Champ de Mars Central Olive-Emerald Lawn Avenue (stretching from Eiffel Tower to Arc plaza)
      const lawnDarkMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleGrass,
        color: 0x62962e,
        roughness: 0.88,
      });
      const lawnCenterMat = new THREE.MeshStandardMaterial({
        color: 0x72ab38,
        roughness: 0.85,
      });
      const centralLawn = new THREE.Mesh(new THREE.BoxGeometry(19.5, 0.45, 405), lawnDarkMat);
      centralLawn.position.set(0, level.theme.hazardFloorY + 0.24, -182);
      centralLawn.receiveShadow = true;
      const centralStripe = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 400), lawnCenterMat);
      centralStripe.rotation.x = -Math.PI / 2;
      centralStripe.position.set(0, level.theme.hazardFloorY + 0.48, -182);
      this.levelGroup.add(centralLawn, centralStripe);

      // Flanking Warm Ochre-Tan Gravel Promenades + Curb Borders
      const ochrePathMat = new THREE.MeshStandardMaterial({
        color: 0xc98b53,
        roughness: 0.9,
      });
      const curbMat = new THREE.MeshStandardMaterial({
        color: 0xa46d3d,
        roughness: 0.88,
      });
      for (const sx of [-1, 1]) {
        const path = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.38, 405), ochrePathMat);
        path.position.set(sx * 13.1, level.theme.hazardFloorY + 0.2, -182);
        path.receiveShadow = true;

        const outerCurb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.46, 405), curbMat);
        outerCurb.position.set(sx * 16.8, level.theme.hazardFloorY + 0.24, -182);
        this.levelGroup.add(path, outerCurb);
      }

      // Twin Rows of Tall Sculpted Olive-Green Cypress & Park Trees along the Promenade
      const treeCount = 60;
      const trunkGeo = new THREE.CylinderGeometry(0.32, 0.44, 2.2, 7);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x854d2b, roughness: 0.9 });
      const foliageGeo = this.createDisplacedRockGeometry(2.1, 3.7);
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x5c8c26, roughness: 0.85 });

      const tTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
      const tFoliage = new THREE.InstancedMesh(foliageGeo, foliageMat, treeCount);
      for (let i = 0; i < treeCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const row = Math.floor(i / 2);
        const tz = 12 - row * 13.0;
        const innerRow = row % 2 === 0;
        const tx = side * (innerRow ? 10.6 : 15.4);
        const hScale = 1.85 + (row % 3) * 0.35;

        dummy.position.set(tx, level.theme.hazardFloorY + 1.3, tz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        tTrunks.setMatrixAt(i, dummy.matrix);

        dummy.position.set(tx, level.theme.hazardFloorY + 4.8 + hScale * 0.9, tz);
        dummy.rotation.set(0, i * 0.9, 0);
        dummy.scale.set(0.92, hScale, 0.92);
        dummy.updateMatrix();
        tFoliage.setMatrixAt(i, dummy.matrix);

        _color.setHex(i % 3 === 0 ? 0x629629 : i % 3 === 1 ? 0x538221 : 0x71a634);
        tFoliage.setColorAt(i, _color);
      }
      tTrunks.instanceMatrix.needsUpdate = true;
      tFoliage.instanceMatrix.needsUpdate = true;
      if (tFoliage.instanceColor) tFoliage.instanceColor.needsUpdate = true;
      tTrunks.computeBoundingSphere();
      tFoliage.computeBoundingSphere();
      this.levelGroup.add(tTrunks, tFoliage);

      // Soft Pastel Lavender-Periwinkle Paris Skyline Silhouettes framing both horizons
      const skylineMat = new THREE.MeshStandardMaterial({
        color: 0x9aa4da,
        roughness: 0.92,
        metalness: 0.02,
      });
      const skyRoofMat = new THREE.MeshStandardMaterial({
        color: 0x8691ce,
        roughness: 0.9,
      });
      const bGeo = new THREE.BoxGeometry(10, 14, 13);
      const rGeo = new THREE.ConeGeometry(7.2, 3.6, 4);
      rGeo.rotateY(Math.PI / 4);
      const bCount = 50;
      const bInst = new THREE.InstancedMesh(bGeo, skylineMat, bCount);
      const rInst = new THREE.InstancedMesh(rGeo, skyRoofMat, bCount);
      for (let i = 0; i < bCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const row = Math.floor(i / 2);
        const bz = 16 - row * 16.5;
        const layerOffset = (row % 3) * 9.5;
        const bx = side * (32 + layerOffset);
        const scH = 0.95 + ((i * 7) % 6) * 0.28;

        dummy.position.set(bx, level.theme.hazardFloorY + 7 * scH - 0.5, bz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1 + (row % 2) * 0.25, scH, 1);
        dummy.updateMatrix();
        bInst.setMatrixAt(i, dummy.matrix);
        _color.setHex(row % 3 === 0 ? 0xa3ade2 : row % 3 === 1 ? 0x949fd7 : 0xb2bbe8);
        bInst.setColorAt(i, _color);

        dummy.position.set(bx, level.theme.hazardFloorY + 14 * scH + 1.0, bz);
        dummy.scale.set(1 + (row % 2) * 0.25, row % 2 === 0 ? 0.8 : 0.05, 1);
        dummy.updateMatrix();
        rInst.setMatrixAt(i, dummy.matrix);
      }
      bInst.instanceMatrix.needsUpdate = true;
      if (bInst.instanceColor) bInst.instanceColor.needsUpdate = true;
      bInst.computeBoundingSphere();
      rInst.instanceMatrix.needsUpdate = true;
      rInst.computeBoundingSphere();
      this.levelGroup.add(bInst, rInst);

      // Stylized Bright White Billowing Sky Clouds flanking the flight corridor
      const cloudGeo = new THREE.SphereGeometry(2.8, 14, 12);
      const cloudMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0xe6f4ff,
        emissiveIntensity: 0.28,
        roughness: 0.95,
      });
      const cloudCount = 36;
      const cloudInst = new THREE.InstancedMesh(cloudGeo, cloudMat, cloudCount);
      for (let i = 0; i < cloudCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        dummy.position.set(
          side * (16 + (i % 4) * 7.5),
          15 + (i % 5) * 4.2,
          -16 - i * 10.0
        );
        dummy.rotation.set(0, i * 0.6, 0);
        dummy.scale.set(2.2 + (i % 3) * 0.6, 0.58, 1.35);
        dummy.updateMatrix();
        cloudInst.setMatrixAt(i, dummy.matrix);
      }
      cloudInst.instanceMatrix.needsUpdate = true;
      cloudInst.computeBoundingSphere();
      this.levelGroup.add(cloudInst);
    } else if (biome === 'rapids') {
      // Mist-shrouded Blue Mountain Peak & Lush Rainforest Slopes (Selva Esmeralda aesthetic)
      this.addHorizonMountainRing(0, -145, level.theme.hazardFloorY - 2, 142, 230, 64, 0x355f7d, 0x9cc0d9, 3.1, 0.88);
      this.addHorizonMountainRing(0, -145, level.theme.hazardFloorY - 1, 96, 150, 32, 0x1b4332, 0x3f7a38, 1.9, 0.9);

      // Winding S-Curve Rapids Channel Ribbon (z = 14 down to z = -278)
      const curveSegments = 120;
      const waterHalfW = 9.6;
      const riverPositions: number[] = [];
      const riverUvs: number[] = [];
      const riverIndices: number[] = [];

      const bankPositionsL: number[] = [];
      const bankPositionsR: number[] = [];
      const bankUvs: number[] = [];

      for (let i = 0; i <= curveSegments; i++) {
        const frac = i / curveSegments;
        const z = 14 - frac * 292;
        const cx = getRiverCenterX(z);
        const vCoord = frac * 22;

        // Water ribbon vertices
        riverPositions.push(cx - waterHalfW, 0.0, z, cx + waterHalfW, 0.0, z);
        riverUvs.push(0, vCoord, 1, vCoord);

        // Left & Right mossy lush riverbanks sloping gently upward
        bankPositionsL.push(cx - 27.5, 2.5, z, cx - 9.2, -0.18, z);
        bankPositionsR.push(cx + 9.2, -0.18, z, cx + 27.5, 2.5, z);
        bankUvs.push(0, vCoord * 1.4, 1, vCoord * 1.4);

        if (i < curveSegments) {
          const r = i * 2;
          riverIndices.push(r, r + 2, r + 1, r + 1, r + 2, r + 3);
        }
      }

      const riverGeo = new THREE.BufferGeometry();
      riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(riverPositions, 3));
      riverGeo.setAttribute('uv', new THREE.Float32BufferAttribute(riverUvs, 2));
      riverGeo.setIndex(riverIndices);
      riverGeo.computeVertexNormals();

      const rapidsMat = new THREE.MeshStandardMaterial({
        map: this.textures.rapidsWaterSurface,
        bumpMap: this.textures.waterBump,
        bumpScale: 0.14,
        roughness: 0.14,
        metalness: 0.22,
      });
      const rapidsMesh = new THREE.Mesh(riverGeo, rapidsMat);
      this.levelGroup.add(rapidsMesh);

      const bankMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleGrass,
        bumpMap: this.textures.grassBump,
        bumpScale: 0.1,
        roughness: 0.86,
      });
      for (const posArr of [bankPositionsL, bankPositionsR]) {
        const bGeo = new THREE.BufferGeometry();
        bGeo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
        bGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bankUvs, 2));
        bGeo.setIndex(riverIndices);
        bGeo.computeVertexNormals();
        const bMesh = new THREE.Mesh(bGeo, bankMat);
        bMesh.receiveShadow = true;
        this.levelGroup.add(bMesh);
      }

      // Serene Turquoise Calm Lake at the end of the river (z = -270 to -390)
      const lakeMat = new THREE.MeshStandardMaterial({
        map: this.textures.calmLakeSurface,
        bumpMap: this.textures.waterBump,
        bumpScale: 0.06,
        roughness: 0.08,
        metalness: 0.28,
        envMapIntensity: 1.4,
      });
      const calmLakePlane = new THREE.Mesh(new THREE.PlaneGeometry(220, 120), lakeMat);
      calmLakePlane.rotation.x = -Math.PI / 2;
      calmLakePlane.position.set(0, -0.02, -330);
      this.levelGroup.add(calmLakePlane);

      // Dense Selva Esmeralda Background Forest flanking the winding riverbanks
      const bgTreeCount = 68;
      const trunkGeo = new THREE.CylinderGeometry(0.38, 0.98, 10.5, 9);
      const trunkMat = new THREE.MeshStandardMaterial({
        map: this.textures.barkTexture,
        bumpMap: this.textures.barkBump,
        bumpScale: 0.16,
        roughness: 0.9,
      });
      const rootGeo = new THREE.ConeGeometry(1.38, 3.0, 7);
      const canopyLowGeo = this.createDisplacedRockGeometry(3.1, 1.1);
      const canopyTopGeo = this.createDisplacedRockGeometry(2.4, 2.7);
      const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0.02 });

      const bgTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, bgTreeCount);
      const bgRoots = new THREE.InstancedMesh(rootGeo, trunkMat, bgTreeCount);
      const bgCanopiesLow = new THREE.InstancedMesh(canopyLowGeo, canopyMat, bgTreeCount);
      const bgCanopiesTop = new THREE.InstancedMesh(canopyTopGeo, canopyMat, bgTreeCount);

      for (let i = 0; i < bgTreeCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const row = Math.floor(i / 2);
        const tz = 10 - row * 10.2;
        const isLake = tz < -274;
        const riverCx = getRiverCenterX(tz);
        const tx = isLake
          ? side * (17 + (row % 5) * 5.8)
          : riverCx + side * (17.5 + (row % 4) * 3.4);
        const ty = isLake ? -0.3 : 1.1 + (row % 3) * 0.45;
        const scale = 0.85 + (i % 4) * 0.22;

        dummy.position.set(tx, ty + 5.0 * scale, tz);
        dummy.rotation.set((i % 3 - 1) * 0.04, i * 0.9, (i % 3 - 1) * 0.05);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        bgTrunks.setMatrixAt(i, dummy.matrix);

        dummy.position.set(tx, ty + 1.2 * scale, tz);
        dummy.rotation.set(0, i * 0.7, 0);
        dummy.scale.set(scale * 1.12, scale, scale * 1.12);
        dummy.updateMatrix();
        bgRoots.setMatrixAt(i, dummy.matrix);

        dummy.position.set(tx, ty + 9.8 * scale, tz);
        dummy.rotation.set(0, i * 0.5, 0);
        dummy.scale.set(scale * 1.26, scale * 0.78, scale * 1.26);
        dummy.updateMatrix();
        bgCanopiesLow.setMatrixAt(i, dummy.matrix);
        _color.setHex(i % 3 === 0 ? 0x26581c : i % 3 === 1 ? 0x316b22 : 0x1e4a16);
        bgCanopiesLow.setColorAt(i, _color);

        dummy.position.set(tx + (i % 2 === 0 ? 0.4 : -0.4), ty + 11.9 * scale, tz - 0.3);
        dummy.rotation.set(0, i * 0.8, 0);
        dummy.scale.set(scale * 1.14, scale * 0.74, scale * 1.14);
        dummy.updateMatrix();
        bgCanopiesTop.setMatrixAt(i, dummy.matrix);
        _color.setHex(i % 3 === 0 ? 0x52992c : i % 3 === 1 ? 0x6ab53a : 0x3f8224);
        bgCanopiesTop.setColorAt(i, _color);
      }
      for (const im of [bgTrunks, bgRoots, bgCanopiesLow, bgCanopiesTop]) {
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.computeBoundingSphere();
      }
      this.levelGroup.add(bgTrunks, bgRoots, bgCanopiesLow, bgCanopiesTop);

      // Hero Twisted Mahogany Jungle Trees (matching Selva Esmeralda image: red-brown bark, buttress roots, broad lime foliage & hanging lianas)
      const heroBarkMat = new THREE.MeshStandardMaterial({
        map: this.textures.barkTexture,
        bumpMap: this.textures.barkBump,
        bumpScale: 0.18,
        roughness: 0.88,
      });
      const leafSunMat = new THREE.MeshStandardMaterial({ color: 0x57a62e, roughness: 0.78 });
      const leafMidMat = new THREE.MeshStandardMaterial({ color: 0x387822, roughness: 0.82 });
      const leafDeepMat = new THREE.MeshStandardMaterial({ color: 0x224d16, roughness: 0.85 });
      const lianaMat = new THREE.MeshStandardMaterial({ color: 0x4b8728, roughness: 0.76 });
      const foliageClusterGeo = this.createDisplacedRockGeometry(2.25, 3.7);

      const heroBankZ = [-18, -38, -58, -78, -98, -118, -138, -158, -178, -198, -218, -238, -258, -288, -312];
      const bankRockSpots: [number, number, number, number][] = [];
      const heroCrownCoords: THREE.Vector3[] = [];

      for (let idx = 0; idx < heroBankZ.length; idx++) {
        const hz = heroBankZ[idx];
        const side = idx % 2 === 0 ? -1 : 1;
        const isLake = hz < -274;
        const cx = getRiverCenterX(hz);
        const hx = isLake ? side * 14.5 : cx + side * 12.6;
        const hy = isLake ? 0.1 : 0.45;
        const sc = 0.95 + (idx % 3) * 0.14;

        const tg = new THREE.Group();
        tg.position.set(hx, hy, hz);
        tg.rotation.y = idx * 0.85;

        const trunkCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -0.4, 0),
          new THREE.Vector3(0.4 * sc, 2.8 * sc, -0.2 * sc),
          new THREE.Vector3(-0.3 * sc, 6.0 * sc, 0.25 * sc),
          new THREE.Vector3(0.15 * sc, 9.0 * sc, 0),
        ]);
        tg.add(new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 12, 0.85 * sc, 8, false), heroBarkMat));

        for (let r = 0; r < 4; r++) {
          const ang = (r / 4) * Math.PI * 2 + 0.35;
          const rootCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(Math.cos(ang) * 0.45 * sc, 2.0 * sc, Math.sin(ang) * 0.45 * sc),
            new THREE.Vector3(Math.cos(ang) * 1.5 * sc, 0.65 * sc, Math.sin(ang) * 1.5 * sc),
            new THREE.Vector3(Math.cos(ang) * 2.5 * sc, 0.0, Math.sin(ang) * 2.5 * sc),
          ]);
          tg.add(new THREE.Mesh(new THREE.TubeGeometry(rootCurve, 7, 0.3 * sc, 6, false), heroBarkMat));
        }

        for (let b = 0; b < 3; b++) {
          const bAng = (b / 3) * Math.PI * 2 + idx * 0.5;
          const bx = Math.cos(bAng) * 2.9 * sc;
          const bz = Math.sin(bAng) * 2.9 * sc;
          const branchCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 7.8 * sc, 0),
            new THREE.Vector3(bx * 0.55, 9.0 * sc, bz * 0.55),
            new THREE.Vector3(bx, 10.2 * sc, bz),
          ]);
          tg.add(new THREE.Mesh(new THREE.TubeGeometry(branchCurve, 6, 0.34 * sc, 6, false), heroBarkMat));

          for (let c = 0; c < 3; c++) {
            const cAng = bAng + (c - 1) * 0.65;
            const lobe = new THREE.Mesh(
              foliageClusterGeo,
              c === 0 ? leafSunMat : c === 1 ? leafMidMat : leafDeepMat
            );
            lobe.scale.set(sc * (0.98 - c * 0.1), sc * 0.68, sc * (0.98 - c * 0.1));
            lobe.position.set(bx + Math.cos(cAng) * 1.05 * sc, (10.8 - c * 0.65) * sc, bz + Math.sin(cAng) * 1.05 * sc);
            lobe.rotation.y = cAng;
            tg.add(lobe);
          }

          const tendrilCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(bx * 1.05, 9.8 * sc, bz * 1.05),
            new THREE.Vector3(bx * 1.08, 7.4 * sc, bz * 1.08),
            new THREE.Vector3(bx * 1.04, 5.2 * sc, bz * 1.04),
          ]);
          tg.add(new THREE.Mesh(new THREE.TubeGeometry(tendrilCurve, 5, 0.055 * sc, 4, false), lianaMat));
        }

        const topCrown = new THREE.Mesh(foliageClusterGeo, leafSunMat);
        topCrown.scale.set(1.34 * sc, 0.74 * sc, 1.34 * sc);
        topCrown.position.set(0, 12.2 * sc, 0);
        tg.add(topCrown);

        this.levelGroup.add(tg);
        heroCrownCoords.push(new THREE.Vector3(hx, hy + 10.2 * sc, hz));
        if (!isLake) {
          bankRockSpots.push([cx + side * 10.4, 0.05, hz + 2.4, 0.85]);
          bankRockSpots.push([cx - side * 10.6, 0.05, hz - 3.2, 0.72]);
        }
      }

      // Overhead Draped Jungle Lianas arcing gracefully across river bends
      for (let i = 0; i < heroCrownCoords.length - 2; i += 2) {
        const pA = heroCrownCoords[i];
        const pB = heroCrownCoords[i + 1];
        const mid = pA.clone().lerp(pB, 0.5);
        mid.y -= 3.2;
        const vineCurve = new THREE.CatmullRomCurve3([pA, mid, pB]);
        this.levelGroup.add(new THREE.Mesh(new THREE.TubeGeometry(vineCurve, 14, 0.1, 5, false), lianaMat));
      }

      // Mossy Pale Boulders & Multi-Blade Tropical Ferns along riverbanks
      const rockGeo = this.createDisplacedRockGeometry(0.95, 7.3);
      const bankRockMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.14,
        roughness: 0.88,
      });
      const mossCapGeo = this.createDisplacedRockGeometry(0.75, 4.9);
      const mossCapMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleGrass,
        bumpMap: this.textures.grassBump,
        bumpScale: 0.08,
        roughness: 0.85,
      });
      const rocksInst = new THREE.InstancedMesh(rockGeo, bankRockMat, bankRockSpots.length);
      const mossInst = new THREE.InstancedMesh(mossCapGeo, mossCapMat, bankRockSpots.length);
      for (let i = 0; i < bankRockSpots.length; i++) {
        const [rx, ry, rz, rs] = bankRockSpots[i];
        dummy.position.set(rx, ry + 0.3 * rs, rz);
        dummy.rotation.set((i % 3) * 0.25, i * 1.1, (i % 2) * 0.2);
        dummy.scale.set(rs * 1.25, rs * 0.82, rs);
        dummy.updateMatrix();
        rocksInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(rx, ry + 0.72 * rs, rz);
        dummy.rotation.set(0, i * 1.1, 0);
        dummy.scale.set(rs * 1.05, rs * 0.34, rs * 0.88);
        dummy.updateMatrix();
        mossInst.setMatrixAt(i, dummy.matrix);
      }
      rocksInst.instanceMatrix.needsUpdate = true;
      mossInst.instanceMatrix.needsUpdate = true;
      rocksInst.computeBoundingSphere();
      mossInst.computeBoundingSphere();
      this.levelGroup.add(rocksInst, mossInst);

      const leafBladeGeo = new THREE.ConeGeometry(0.32, 1.55, 5);
      const totalLeaves = bankRockSpots.length * 6;
      const leavesInst = new THREE.InstancedMesh(leafBladeGeo, leafSunMat, totalLeaves);
      let lIdx = 0;
      for (let i = 0; i < bankRockSpots.length; i++) {
        const [rx, ry, rz, rs] = bankRockSpots[i];
        const px = rx + (i % 2 === 0 ? 0.9 : -0.9) * rs;
        const pz = rz + 0.4 * rs;
        for (let f = 0; f < 6; f++) {
          const ang = (f / 6) * Math.PI * 2 + i * 0.5;
          dummy.position.set(px + Math.cos(ang) * 0.42 * rs, ry + 0.55 * rs, pz + Math.sin(ang) * 0.42 * rs);
          dummy.rotation.set(0, -ang, -0.78);
          dummy.scale.set(rs, rs * (0.85 + (f % 2) * 0.24), rs * 0.22);
          dummy.updateMatrix();
          leavesInst.setMatrixAt(lIdx, dummy.matrix);
          _color.setHex(f % 2 === 0 ? 0x57a62e : 0x357020);
          leavesInst.setColorAt(lIdx, _color);
          lIdx++;
        }
      }
      leavesInst.instanceMatrix.needsUpdate = true;
      if (leavesInst.instanceColor) leavesInst.instanceColor.needsUpdate = true;
      leavesInst.computeBoundingSphere();
      this.levelGroup.add(leavesInst);

      // Tranquil Lake Floating Lily Pads & Lotus Flowers (z = -278 to -340)
      const padGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.08, 12);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.72 });
      const flowerGeo = new THREE.ConeGeometry(0.32, 0.38, 6);
      const flowerMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xdb2777, emissiveIntensity: 0.35 });
      const padCount = 26;
      const padInst = new THREE.InstancedMesh(padGeo, padMat, padCount);
      const flwInst = new THREE.InstancedMesh(flowerGeo, flowerMat, padCount);
      for (let i = 0; i < padCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const px = side * (9.5 + ((i * 7) % 24));
        const pz = -278 - ((i * 11) % 62);
        const sc = 0.75 + (i % 3) * 0.3;
        dummy.position.set(px, 0.05, pz);
        dummy.rotation.set(0, i * 0.9, 0);
        dummy.scale.set(sc, 1, sc);
        dummy.updateMatrix();
        padInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(px, 0.22, pz);
        dummy.rotation.set(Math.PI, i, 0);
        dummy.scale.set(sc, sc, sc);
        dummy.updateMatrix();
        flwInst.setMatrixAt(i, dummy.matrix);
      }
      padInst.instanceMatrix.needsUpdate = true;
      flwInst.instanceMatrix.needsUpdate = true;
      padInst.computeBoundingSphere();
      flwInst.computeBoundingSphere();
      this.levelGroup.add(padInst, flwInst);
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
        : theme.biome === 'temple'
          ? this.textures.skyTemple
          : theme.biome === 'desert'
            ? this.textures.skyDesert
            : theme.biome === 'ice'
              ? this.textures.skyIce
              : theme.biome === 'volcanic'
                ? this.textures.skyVolcanic
                : theme.biome === 'paris'
                  ? this.textures.skyParis
                  : theme.biome === 'rapids'
                    ? this.textures.skyRapids
                    : this.textures.skyNebula;
    skyMat.needsUpdate = true;

    const seaGeo = new THREE.PlaneGeometry(520, 520);
    const seaTex =
      theme.biome === 'jungle'
        ? this.textures.lagoonSurface
        : theme.biome === 'temple'
          ? this.textures.templeFloorSurface
          : theme.biome === 'desert'
            ? this.textures.sandOceanSurface
            : theme.biome === 'ice'
              ? this.textures.iceSeaSurface
              : theme.biome === 'volcanic'
                ? this.textures.lavaSurface
                : theme.biome === 'paris'
                  ? this.textures.seineWaterSurface
                  : theme.biome === 'rapids'
                    ? this.textures.calmLakeSurface
                    : this.textures.nebulaSeaSurface;
    this.hazardSeaTex = seaTex;
    const seaMat = new THREE.MeshStandardMaterial({
      map: seaTex,
      bumpMap:
        theme.biome === 'jungle' || theme.biome === 'ice'
          ? this.textures.waterBump
          : theme.biome === 'desert'
            ? this.textures.sandBump
            : theme.biome === 'temple'
              ? this.textures.grassBump
              : theme.biome === 'nebula'
                ? this.textures.stoneBump
                : undefined,
      bumpScale:
        theme.biome === 'jungle' || theme.biome === 'nebula'
          ? 0.14
          : theme.biome === 'desert'
            ? 0.18
            : theme.biome === 'ice' || theme.biome === 'temple'
              ? 0.08
              : 0,
      roughness:
        theme.biome === 'desert' || theme.biome === 'temple'
          ? 0.88
          : theme.biome === 'ice'
            ? 0.08
            : theme.biome === 'jungle'
              ? 0.12
              : theme.biome === 'nebula'
                ? 0.78
                : 0.35,
      metalness: theme.biome === 'ice' ? 0.35 : theme.biome === 'jungle' ? 0.26 : theme.biome === 'nebula' ? 0.12 : 0.06,
      envMapIntensity: theme.biome === 'ice' ? 1.5 : theme.biome === 'jungle' ? 1.35 : 0.9,
      emissiveMap:
        theme.biome === 'volcanic'
          ? this.textures.lavaEmissive
          : theme.biome === 'nebula'
            ? this.textures.nebulaSeaEmissive
            : undefined,
      emissive: theme.biome === 'volcanic' ? 0xff6a00 : theme.biome === 'nebula' ? 0xffb703 : 0x000000,
      emissiveIntensity: theme.biome === 'volcanic' ? 1.55 : theme.biome === 'nebula' ? 1.2 : 0,
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
        const list = Array.isArray(mat) ? mat : [mat];
        for (const m of list) {
          m.transparent = true;
          m.opacity = 0.16;
        }
      }
      const geo = new THREE.BoxGeometry(pDef.size[0], pDef.size[1], pDef.size[2]);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pDef.pos[0], pDef.pos[1], pDef.pos[2]);
      if (pDef.invisible) {
        mesh.visible = false;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      } else {
        mesh.castShadow = !this.isSoftwareGl && !startsInactive;
        mesh.receiveShadow = true;
      }

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
        const group = createClimbWallMesh(cw.size, cw.face, this.textures.climbStone, this.textures.stoneBump);
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

    // Hang Glider (Level 7 - Paris Sky)
    this.gliderState = 'parked';
    this.gliderBoostTimer = 0;
    if (level.gliderSection) {
      const gs = level.gliderSection;
      this.gliderLaunchpadPos.set(...gs.launchpadPos);
      this.gliderLandingPos.set(...gs.landingPos);
      this.gliderCruiseSpeed = gs.cruiseSpeed;

      const pad = createRocketPadMesh();
      pad.position.copy(this.gliderLaunchpadPos);
      this.levelGroup.add(pad);

      this.gliderRig = createHangGliderRig();
      this.gliderPos.copy(this.gliderLaunchpadPos);
      this.gliderPos.y += 0.25;
      this.gliderRig.root.position.copy(this.gliderPos);
      this.gliderRig.trailL.visible = false;
      this.gliderRig.trailR.visible = false;
      this.levelGroup.add(this.gliderRig.root);

      for (const rPos of gs.rings) {
        const rg = createBoostRingMesh();
        rg.position.set(...rPos);
        this.levelGroup.add(rg);
        this.boostRings.push({ group: rg, pos: new THREE.Vector3(...rPos), passed: false });
      }
    }

    // River Boat Rapids (Level 8 - Río Bravo)
    this.boatState = 'parked';
    this.boatJumpY = 0;
    this.boatVelY = 0;
    this.boatJumpCooldown = 0;
    this.boatCalmEntered = false;
    if (level.boatSection) {
      const bs = level.boatSection;
      this.boatDockPos.set(...bs.dockPos);
      this.boatLakePos.set(...bs.lakePos);
      this.boatCalmLakeZ = bs.calmLakeZ;
      this.boatCruiseSpeed = bs.cruiseSpeed;
      this.boatHalfWidth = bs.riverHalfWidth;

      this.boatRig = createRiverBoatRig(this.textures.riverTimber);
      this.boatPos.copy(this.boatDockPos);
      this.boatRig.root.position.copy(this.boatPos);
      this.boatRig.wakeL.visible = false;
      this.boatRig.wakeR.visible = false;
      this.levelGroup.add(this.boatRig.root);

      const rockMat = new THREE.MeshStandardMaterial({
        map: this.textures.desertSide,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.2,
        color: 0x78716c,
        roughness: 0.85,
      });
      const foamMat = new THREE.MeshBasicMaterial({
        color: 0xf0f9ff,
        transparent: true,
        opacity: 0.68,
        side: THREE.DoubleSide,
      });

      bs.rocks.forEach((rk, idx) => {
        const rad = rk.radius ?? 1.5;
        const rGeo = this.createDisplacedRockGeometry(rad, idx + 1.4);
        const rMesh = new THREE.Mesh(rGeo, rockMat);
        rMesh.position.set(rk.pos[0], rk.pos[1] + 0.35, rk.pos[2]);
        rMesh.scale.set(1.05, 0.85, 1.05);
        rMesh.castShadow = true;
        this.levelGroup.add(rMesh);

        const foam = new THREE.Mesh(new THREE.RingGeometry(rad * 0.85, rad * 1.32, 18), foamMat);
        foam.rotation.x = -Math.PI / 2;
        foam.position.set(rk.pos[0], 0.05, rk.pos[2]);
        this.levelGroup.add(foam);

        this.riverRocks.push({ pos: new THREE.Vector3(...rk.pos), radius: rad });
      });

      for (const cr of bs.crocodiles) {
        const rig = createCrocodileMesh();
        const behavior = cr.behavior ?? 'patrol';
        rig.group.position.set(cr.pos[0], behavior === 'ambush' ? -1.25 : cr.pos[1], cr.pos[2]);
        this.levelGroup.add(rig.group);
        this.crocodiles.push({
          rig,
          baseX: cr.pos[0],
          pos: new THREE.Vector3(...cr.pos),
          patrolX: cr.patrolX,
          speed: cr.speed,
          phase: cr.phase ?? 0,
          behavior,
          emergeProgress: behavior === 'ambush' ? 0 : 1,
          emergedSplash: false,
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
    this.botRocketCharges = 0;
    this.botRocketTimer = 0;
    this.gliderAltOffset = 0;
    this.playerRig.botRocketRig.visible = false;
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

  private createPlatformMaterial(pDef: PlatformDef): THREE.Material | THREE.Material[] {
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
    if (style === 'jungle') {
      const topMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleGrass,
        bumpMap: this.textures.grassBump,
        bumpScale: 0.09,
        roughness: 0.86,
        metalness: 0.02,
      });
      const sideMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleSide,
        bumpMap: this.textures.jungleSideBump,
        bumpScale: 0.15,
        roughness: 0.9,
        metalness: 0.02,
      });
      const botMat = new THREE.MeshStandardMaterial({ map: this.textures.jungleDirt, roughness: 0.94, metalness: 0.02 });
      return [sideMat, sideMat, topMat, botMat, sideMat, sideMat];
    }
    if (style === 'desert') {
      const topMat = new THREE.MeshStandardMaterial({
        map: this.textures.desertSandstone,
        bumpMap: this.textures.sandBump,
        bumpScale: 0.09,
        roughness: 0.88,
        metalness: 0.03,
      });
      const sideMat = new THREE.MeshStandardMaterial({
        map: this.textures.desertSide,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.16,
        roughness: 0.9,
        metalness: 0.04,
      });
      const botMat = new THREE.MeshStandardMaterial({ map: this.textures.desertDirt, roughness: 0.95, metalness: 0.02 });
      return [sideMat, sideMat, topMat, botMat, sideMat, sideMat];
    }
    if (style === 'temple') {
      const topMat = new THREE.MeshStandardMaterial({
        map: this.textures.templeTop,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.12,
        roughness: 0.86,
        metalness: 0.03,
      });
      const sideMat = new THREE.MeshStandardMaterial({
        map: this.textures.templeSide,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.16,
        roughness: 0.88,
        metalness: 0.03,
      });
      const botMat = new THREE.MeshStandardMaterial({ map: this.textures.jungleDirt, roughness: 0.94, metalness: 0.02 });
      return [sideMat, sideMat, topMat, botMat, sideMat, sideMat];
    }
    if (style === 'volcanic') {
      const topMat = new THREE.MeshStandardMaterial({
        map: this.textures.volcanicBasalt,
        emissiveMap: this.textures.volcanicEmissive,
        emissive: 0xff5a00,
        emissiveIntensity: 1.45,
        bumpMap: this.textures.basaltBump,
        bumpScale: 0.16,
        roughness: 0.84,
        metalness: 0.16,
      });
      const sideMat = new THREE.MeshStandardMaterial({
        map: this.textures.volcanicSide,
        emissiveMap: this.textures.volcanicSideEmissive,
        emissive: 0xff5a00,
        emissiveIntensity: 1.55,
        bumpMap: this.textures.basaltBump,
        bumpScale: 0.2,
        roughness: 0.86,
        metalness: 0.18,
      });
      return [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
    }
    if (style === 'nebula') {
      const topMat = new THREE.MeshStandardMaterial({
        map: this.textures.nebulaDeck,
        bumpMap: this.textures.nebulaBump,
        bumpScale: 0.1,
        roughness: 0.28,
        metalness: 0.52,
      });
      const sideMat = new THREE.MeshStandardMaterial({
        map: this.textures.nebulaSide,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.16,
        roughness: 0.82,
        metalness: 0.18,
      });
      return [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
    }
    if (style === 'ice') {
      const topMat = new THREE.MeshPhysicalMaterial({
        map: this.textures.iceCrystal,
        bumpMap: this.textures.iceBump,
        bumpScale: 0.08,
        roughness: 0.18,
        metalness: 0.08,
        clearcoat: 0.9,
        clearcoatRoughness: 0.1,
      });
      const sideMat = new THREE.MeshPhysicalMaterial({
        map: this.textures.iceSide,
        bumpMap: this.textures.iceBump,
        bumpScale: 0.14,
        roughness: 0.22,
        metalness: 0.1,
        clearcoat: 0.85,
      });
      return [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
    }
    if (style === 'paris') {
      return new THREE.MeshStandardMaterial({
        map: this.textures.parisStone,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.09,
        roughness: 0.78,
        metalness: 0.05,
      });
    }
    if (style === 'river') {
      return new THREE.MeshStandardMaterial({
        map: this.textures.riverTimber,
        bumpMap: this.textures.barkBump,
        bumpScale: 0.08,
        roughness: 0.8,
        metalness: 0.04,
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

  private pollGamepad() {
    this.gamepadMoveX = 0;
    this.gamepadMoveZ = 0;
    this.gamepadCamX = 0;
    this.gamepadJumpHeld = false;

    const pads = navigator.getGamepads?.();
    if (!pads) return;

    let gp: Gamepad | null = null;
    for (let i = 0; i < pads.length; i++) {
      if (pads[i]?.connected) {
        gp = pads[i];
        break;
      }
    }
    if (!gp) {
      this.prevGamepadButtons = { jump: false, spin: false, bow: false, pause: false };
      return;
    }

    const deadzone = 0.2;
    const ax0 = Math.abs(gp.axes[0] ?? 0) > deadzone ? gp.axes[0] : 0;
    const ax1 = Math.abs(gp.axes[1] ?? 0) > deadzone ? gp.axes[1] : 0;
    const ax2 = Math.abs(gp.axes[2] ?? 0) > deadzone ? gp.axes[2] : 0;

    let gx = ax0;
    let gz = ax1;
    if (gp.buttons[14]?.pressed) gx -= 1; // D-pad Left
    if (gp.buttons[15]?.pressed) gx += 1; // D-pad Right
    if (gp.buttons[12]?.pressed) gz -= 1; // D-pad Up
    if (gp.buttons[13]?.pressed) gz += 1; // D-pad Down

    this.gamepadMoveX = THREE.MathUtils.clamp(gx, -1, 1);
    this.gamepadMoveZ = THREE.MathUtils.clamp(gz, -1, 1);
    this.gamepadCamX = ax2;

    const jumpNow = Boolean(gp.buttons[0]?.pressed);
    const spinNow = Boolean(gp.buttons[2]?.pressed || gp.buttons[4]?.pressed);
    const bowNow = Boolean(gp.buttons[1]?.pressed || gp.buttons[5]?.pressed || gp.buttons[7]?.pressed);
    const pauseNow = Boolean(gp.buttons[9]?.pressed);

    if (jumpNow || spinNow || bowNow || pauseNow) {
      soundEngine.unlock();
    }

    if (pauseNow && !this.prevGamepadButtons.pause) {
      if (this.phase === 'playing') this.setPhase('paused');
      else if (this.phase === 'paused') this.setPhase('playing');
    }

    if (this.phase === 'playing') {
      this.gamepadJumpHeld = jumpNow;
      if (jumpNow && !this.prevGamepadButtons.jump) {
        if (this.rocketState === 'flying') {
          this.rocketBoostTimer = 0.55;
          soundEngine.playRocketBoost();
        } else if (this.gliderState === 'flying') {
          if (this.gliderBoostTimer <= 0.1) {
            this.gliderBoostTimer = 0.7;
            this.gliderVelY = Math.max(this.gliderVelY + 4.2, 5.2);
            soundEngine.playWindWhoosh();
            this.spawnBurst(this.gliderPos.x, this.gliderPos.y, this.gliderPos.z, 0xbae6fd, 14, 4.5);
          }
        } else if (this.boatState === 'sailing') {
          if (this.boatJumpY <= 0.05 && this.boatJumpCooldown <= 0) {
            this.boatVelY = 10.6;
            this.boatJumpCooldown = 0.72;
            soundEngine.playSplash();
            this.spawnBurst(this.boatPos.x, 0.2, this.boatPos.z, 0xe0f2fe, 14, 4.8);
          }
        } else {
          if (
            !this.grounded &&
            !this.isClimbing &&
            this.coyoteTimer <= 0 &&
            this.botRocketCharges > 0 &&
            this.botRocketTimer <= 0 &&
            this.playerVel.y < -2.2 &&
            this.hoverFuel <= 0.12
          ) {
            this.activateBotRocketRescue();
          } else {
            this.jumpBufferTimer = 0.14;
          }
        }
      }
      if (spinNow && !this.prevGamepadButtons.spin) {
        this.triggerSpin();
      }
      if (bowNow && !this.prevGamepadButtons.bow) {
        this.shootArrow();
      }
    }

    this.prevGamepadButtons = {
      jump: jumpNow,
      spin: spinNow,
      bow: bowNow,
      pause: pauseNow,
    };
  }

  private tick = () => {
    if (this.disposed) return;
    const now = performance.now();
    const rawDt = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

    this.pollGamepad();
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
      const biome = this.currentLevel.theme.biome;
      if (biome === 'jungle' || biome === 'ice' || biome === 'volcanic' || biome === 'paris' || biome === 'rapids') {
        const spd = biome === 'volcanic' ? 0.028 : 0.015;
        this.hazardSeaTex.offset.x = (this.totalTime * spd) % 1;
        this.hazardSeaTex.offset.y = (this.totalTime * spd * 0.7) % 1;
        if (biome === 'volcanic') {
          this.textures.lavaEmissive.offset.copy(this.hazardSeaTex.offset);
        }
      } else {
        this.hazardSeaTex.offset.set(0, 0);
      }
    }
    if (this.currentLevel.theme.biome === 'jungle') {
      this.textures.waterfallSurface.offset.y = (this.totalTime * 0.75) % 1;
    }
    if (this.currentLevel.theme.biome === 'rapids') {
      this.textures.rapidsWaterSurface.offset.y = (this.totalTime * 1.45) % 1;
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

    // Animate river crocodiles: ambush crocs erupt from underwater with wide-open jaws; patrol crocs swim across
    const boatZ = this.boatState === 'sailing' ? this.boatPos.z : this.playerPos.z;
    for (const croc of this.crocodiles) {
      const arg = this.totalTime * croc.speed + croc.phase;
      croc.pos.x = croc.baseX + Math.sin(arg) * croc.patrolX;
      if (croc.behavior === 'ambush') {
        const distAhead = boatZ - croc.pos.z;
        const triggered = this.boatState === 'sailing' && distAhead < 34 && distAhead > -14;
        if (triggered && croc.emergeProgress < 1) {
          croc.emergeProgress = Math.min(1, croc.emergeProgress + dt * 2.5);
          if (!croc.emergedSplash && croc.emergeProgress > 0.25) {
            croc.emergedSplash = true;
            soundEngine.playSplash();
            this.spawnBurst(croc.pos.x, 0.25, croc.pos.z, 0xe0f2fe, 14, 5.2);
          }
        } else if (!triggered) {
          croc.emergeProgress = Math.max(0, croc.emergeProgress - dt * 1.4);
          if (croc.emergeProgress <= 0.05) croc.emergedSplash = false;
        }
        const targetY = THREE.MathUtils.lerp(-1.25, 0.08, croc.emergeProgress);
        const bob = croc.emergeProgress * Math.sin(this.totalTime * 5.2 + croc.phase) * 0.04;
        croc.rig.group.position.set(croc.pos.x, targetY + bob, croc.pos.z);
        croc.rig.group.rotation.y = Math.sin(arg) * 0.28;
        croc.rig.jawUpper.rotation.x =
          -0.12 - croc.emergeProgress * (0.58 + Math.abs(Math.sin(this.totalTime * 6.0 + croc.phase)) * 0.22);
        croc.rig.tailGroup.rotation.y = Math.sin(this.totalTime * 7.5 + croc.phase) * 0.35;
      } else {
        croc.rig.group.position.set(croc.pos.x, 0.04 + Math.sin(this.totalTime * 4 + croc.phase) * 0.04, croc.pos.z);
        croc.rig.group.rotation.y = Math.cos(arg) >= 0 ? Math.PI / 2 : -Math.PI / 2;
        croc.rig.jawUpper.rotation.x = -0.14 - Math.abs(Math.sin(this.totalTime * 4.5 + croc.phase)) * 0.38;
        croc.rig.tailGroup.rotation.y = Math.sin(this.totalTime * 6.5 + croc.phase) * 0.32;
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

    // HANG GLIDER MODE (Level 7 - Cielos de París)
    if (this.gliderState === 'flying' && this.gliderRig) {
      this.stepGliderFlight(dt);
      return;
    }

    // RIVER BOAT RAPIDS MODE (Level 8 - Rápidos del Río Bravo)
    if (this.boatState === 'sailing' && this.boatRig) {
      this.stepBoatRapids(dt);
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

    // Check if player boards Hang Glider atop Eiffel Tower
    if (this.gliderRig && this.gliderState === 'parked') {
      const dx = this.playerPos.x - this.gliderPos.x;
      const dy = this.playerPos.y - this.gliderPos.y;
      const dz = this.playerPos.z - this.gliderPos.z;
      if (dx * dx + dz * dz < 4.2 && Math.abs(dy) < 2.5) {
        this.gliderState = 'flying';
        this.perspectiveMode = 'ALA DELTA';
        this.gliderVelX = 0;
        this.gliderVelY = 0.4;
        this.gliderAltOffset = 0;
        this.gliderBoostTimer = 0.25;
        this.active2DZone = null;
        soundEngine.stopHover();
        soundEngine.playWindWhoosh();
        this.showBanner('¡Ala Delta desplegada! Cruceta/WASD Planear · OK/Espacio Corriente térmica', 3.6);
        this.pushHud(true);
        return;
      }
    }

    // Check if player boards River Boat at upstream dock
    if (this.boatRig && this.boatState === 'parked') {
      const dx = this.playerPos.x - this.boatPos.x;
      const dy = this.playerPos.y - this.boatPos.y;
      const dz = this.playerPos.z - this.boatPos.z;
      if (dx * dx + dz * dz < 5.6 && Math.abs(dy) < 2.6) {
        this.boatState = 'sailing';
        this.perspectiveMode = 'BARCO';
        this.boatVelX = 0;
        this.boatVelZ = this.boatCruiseSpeed;
        this.boatJumpY = 0;
        this.boatVelY = 0;
        this.boatJumpCooldown = 0;
        this.active2DZone = null;
        soundEngine.stopHover();
        soundEngine.playSplash();
        this.showBanner('¡Al agua! Esquiva rocas y cocodrilos · OK/Espacio Saltar ola', 3.6);
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
      if (this.keysHeld.has('KeyQ') || this.keysHeld.has('__CAM_L__')) this.camYaw += dt * 2.1;
      if (this.keysHeld.has('KeyE') || this.keysHeld.has('__CAM_R__')) this.camYaw -= dt * 2.1;
      if (Math.abs(this.gamepadCamX) > 0.05) this.camYaw -= this.gamepadCamX * dt * 2.4;
    } else if (this.active2DZone) {
      const targetYaw = this.active2DZone.moveAxis === 'x' ? 0 : Math.PI / 2;
      let diff = targetYaw - this.camYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.camYaw += diff * Math.min(1, dt * 8);
      this.camPitch = THREE.MathUtils.damp(this.camPitch, 0.14, 8, dt);
    }

    let inX = this.touchMoveX + this.gamepadMoveX;
    let inZ = this.touchMoveZ + this.gamepadMoveZ;
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

    const moveSpeed = this.botRocketTimer > 0 ? 12.4 : 9.2;
    const targetVx = worldDirX * moveSpeed;
    const targetVz = worldDirZ * moveSpeed;

    let onIce = this.grounded && this.standingPlatform?.def.kind === 'ice';
    const accel = onIce ? 2.6 : this.botRocketTimer > 0 ? 13 : this.grounded ? 16 : 9;
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

      const jumpHeld =
        this.keysHeld.has('Space') ||
        this.keysHeld.has('__TV_JUMP__') ||
        this.touchJumpHeld ||
        this.gamepadJumpHeld;
      if (this.botRocketTimer > 0) {
        this.botRocketTimer = Math.max(0, this.botRocketTimer - dt);
        if (this.isHovering) soundEngine.stopHover();
        this.isHovering = false;
        this.hoverFuel = THREE.MathUtils.clamp(this.botRocketTimer / 2.4, 0, 1);
        const targetVy = this.botRocketTimer > 1.35 ? 10.6 : jumpHeld ? 2.8 : -1.5;
        this.playerVel.y = THREE.MathUtils.damp(this.playerVel.y, targetVy, 7.5, dt);
        if (Math.random() < 0.75) {
          this.spawnBurst(
            this.playerPos.x,
            this.playerPos.y - 0.35,
            this.playerPos.z,
            Math.random() < 0.6 ? 0xf97316 : 0x38bdf8,
            1,
            1.8
          );
        }
        if (this.botRocketTimer <= 0) {
          this.pushHud(true);
        }
      } else {
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

        // Auto-deploy a rescued Mini-Bot as an emergency rocket booster when falling near the hazard floor
        if (
          !this.grounded &&
          this.botRocketCharges > 0 &&
          this.playerVel.y < -1.0 &&
          this.playerPos.y <= this.currentLevel.theme.hazardFloorY + 4.8
        ) {
          this.activateBotRocketRescue();
        }
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
        if (this.grounded && this.botRocketTimer > 0) {
          this.botRocketTimer = 0;
          this.hoverFuel = 1;
          this.pushHud(true);
        }
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
        this.botRocketCharges++;
        soundEngine.playBotRescue();
        this.spawnBurst(mb.homePos.x, mb.homePos.y + 0.7, mb.homePos.z, 0x38bdf8, 22, 6.0);
        this.showBanner(`¡${mb.name} rescatado! (+1 Cohete Bot al caer)`);
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

    let steerX = this.touchMoveX + this.gamepadMoveX;
    let steerY = -this.touchMoveZ - this.gamepadMoveZ;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) steerX -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) steerX += 1;
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) steerY += 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) steerY -= 1;
    steerX = THREE.MathUtils.clamp(steerX, -1, 1);
    steerY = THREE.MathUtils.clamp(steerY, -1, 1);

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

  private stepGliderFlight(dt: number) {
    if (!this.gliderRig) return;

    let steerX = this.touchMoveX + this.gamepadMoveX;
    let pitchIn = -this.touchMoveZ - this.gamepadMoveZ;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) steerX -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) steerX += 1;
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) pitchIn += 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) pitchIn -= 1;
    steerX = THREE.MathUtils.clamp(steerX, -1, 1);
    pitchIn = THREE.MathUtils.clamp(pitchIn, -1, 1);

    this.gliderVelX = THREE.MathUtils.damp(this.gliderVelX, steerX * 9.8, 9.5, dt);

    // Ideal gentle glide slope between Eiffel Tower (y=32) and Champs-Élysées Plaza (y=6.8), with persistent altitude control
    const spanZ = Math.max(1, this.gliderLaunchpadPos.z - this.gliderLandingPos.z);
    const progress = THREE.MathUtils.clamp((this.gliderLaunchpadPos.z - this.gliderPos.z) / spanZ, 0, 1);
    this.gliderAltOffset = THREE.MathUtils.clamp(this.gliderAltOffset + pitchIn * 5.6 * dt, -4.5, 6.0);
    const glideTargetY = THREE.MathUtils.lerp(31.8, 6.8, progress) + this.gliderAltOffset;

    const boosting = this.gliderBoostTimer > 0;
    if (boosting) this.gliderBoostTimer = Math.max(0, this.gliderBoostTimer - dt);
    this.hoverFuel = boosting ? 1 : THREE.MathUtils.clamp(1 - this.gliderBoostTimer, 0, 1);

    const targetVy = (glideTargetY - this.gliderPos.y) * 2.4;
    this.gliderVelY = THREE.MathUtils.damp(this.gliderVelY, boosting ? Math.max(targetVy, 3.8) : targetVy, 6.2, dt);

    const forwardSpeed = this.gliderCruiseSpeed * (boosting ? 1.18 : 1.0);
    this.gliderPos.x = THREE.MathUtils.clamp(this.gliderPos.x + this.gliderVelX * dt, -16.5, 16.5);
    this.gliderPos.y = THREE.MathUtils.clamp(this.gliderPos.y + this.gliderVelY * dt, 2.2, 36.5);
    this.gliderPos.z -= forwardSpeed * dt;

    this.gliderRig.root.position.copy(this.gliderPos);
    this.gliderRig.wingGroup.rotation.z = THREE.MathUtils.damp(
      this.gliderRig.wingGroup.rotation.z,
      -this.gliderVelX * 0.042,
      8,
      dt
    );
    this.gliderRig.wingGroup.rotation.x = THREE.MathUtils.damp(
      this.gliderRig.wingGroup.rotation.x,
      this.gliderVelY * 0.032 - 0.04,
      8,
      dt
    );
    this.gliderRig.trailL.visible = true;
    this.gliderRig.trailR.visible = true;

    // Nova Bot hangs horizontally in harness beneath the glider trapeze
    this.playerPos.set(this.gliderPos.x, this.gliderPos.y + 0.15, this.gliderPos.z);
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.bodyGroup.rotation.y = Math.PI;
    this.playerRig.bodyGroup.scale.setScalar(0.92);
    this.playerRig.hoverBeam.visible = false;
    this.contactShadowMesh.visible = false;

    this.collectNearbyCoins(this.gliderPos.x, this.gliderPos.y + 0.6, this.gliderPos.z, 12.5);

    for (const rg of this.boostRings) {
      if (rg.passed) continue;
      if (this.gliderPos.distanceToSquared(rg.pos) < 16.5) {
        rg.passed = true;
        this.gliderBoostTimer = 0.55;
        this.gliderVelY = Math.max(this.gliderVelY, 2.8);
        this.coinsCollected += 2;
        soundEngine.playWindWhoosh();
        soundEngine.playCoin();
        this.spawnBurst(rg.pos.x, rg.pos.y, rg.pos.z, 0xfacc15, 22, 6.5);
        this.pushHud(true);
      }
    }

    if (this.gliderPos.z <= this.gliderLandingPos.z + 2.0) {
      this.gliderState = 'landed';
      this.perspectiveMode = '3D';
      this.gliderRig.trailL.visible = false;
      this.gliderRig.trailR.visible = false;
      this.gliderRig.root.position.set(this.gliderLandingPos.x - 4.0, this.gliderLandingPos.y + 0.25, this.gliderLandingPos.z + 2.0);
      this.gliderRig.wingGroup.rotation.set(0, 0.3, 0);

      this.playerRig.bodyGroup.scale.setScalar(1);
      this.playerPos.set(this.gliderLandingPos.x, this.gliderLandingPos.y + 1.0, this.gliderLandingPos.z);
      this.playerVel.set(0, 4.2, -3.0);
      this.spawnPos.copy(this.playerPos);
      this.checkpointActive = true;
      soundEngine.playCheckpoint();
      this.showBanner('¡Aterrizaje junto al Arco del Triunfo!', 3.2);
      this.pushHud(true);
    }
  }

  private stepBoatRapids(dt: number) {
    if (!this.boatRig) return;

    let steerX = this.touchMoveX + this.gamepadMoveX;
    let throttle = -this.touchMoveZ - this.gamepadMoveZ;
    if (this.keysHeld.has('KeyA') || this.keysHeld.has('ArrowLeft')) steerX -= 1;
    if (this.keysHeld.has('KeyD') || this.keysHeld.has('ArrowRight')) steerX += 1;
    if (this.keysHeld.has('KeyW') || this.keysHeld.has('ArrowUp')) throttle += 1;
    if (this.keysHeld.has('KeyS') || this.keysHeld.has('ArrowDown')) throttle -= 1;
    steerX = THREE.MathUtils.clamp(steerX, -1, 1);
    throttle = THREE.MathUtils.clamp(throttle, -1, 1);

    this.boatJumpCooldown = Math.max(0, this.boatJumpCooldown - dt);
    this.hoverFuel = this.boatJumpCooldown > 0 ? THREE.MathUtils.clamp(1 - this.boatJumpCooldown / 0.72, 0, 1) : 1;

    const inCalmLake = this.boatPos.z <= this.boatCalmLakeZ;
    if (inCalmLake && !this.boatCalmEntered) {
      this.boatCalmEntered = true;
      this.showBanner('¡Aguas tranquilas! Has llegado al lago del final', 3.4);
      soundEngine.playModeSwitch();
    }

    const baseFwd = inCalmLake ? 7.6 : this.boatCruiseSpeed + throttle * 3.4;
    this.boatVelZ = THREE.MathUtils.damp(this.boatVelZ, baseFwd, 5.5, dt);
    this.boatVelX = THREE.MathUtils.damp(this.boatVelX, steerX * 9.8, 8.5, dt);

    // Wave hop physics
    if (this.boatJumpY > 0 || this.boatVelY > 0) {
      this.boatVelY -= 26.0 * dt;
      this.boatJumpY += this.boatVelY * dt;
      if (this.boatJumpY <= 0) {
        this.boatJumpY = 0;
        this.boatVelY = 0;
        soundEngine.playSplash();
        this.spawnBurst(this.boatPos.x, 0.15, this.boatPos.z, 0xe0f2fe, 10, 3.6);
      }
    }

    const riverCx = getRiverCenterX(this.boatPos.z);
    const riverAngle = getRiverSlopeAngle(this.boatPos.z);
    const xAhead = getRiverCenterX(this.boatPos.z - 1.5);
    const xBehind = getRiverCenterX(this.boatPos.z + 1.5);
    const currentDriftVx = ((xAhead - xBehind) / 3.0) * this.boatVelZ * 0.48;

    this.boatPos.x = THREE.MathUtils.clamp(
      this.boatPos.x + (this.boatVelX + currentDriftVx) * dt,
      riverCx - this.boatHalfWidth,
      riverCx + this.boatHalfWidth
    );
    this.boatPos.z -= this.boatVelZ * dt;
    const waveBob = inCalmLake ? Math.sin(this.totalTime * 2.2) * 0.03 : Math.sin(this.totalTime * 11) * 0.12;
    this.boatPos.y = 0.05 + this.boatJumpY + waveBob;

    this.boatRig.root.position.copy(this.boatPos);
    this.boatRig.hullGroup.rotation.z = THREE.MathUtils.damp(this.boatRig.hullGroup.rotation.z, -this.boatVelX * 0.032, 9, dt);
    this.boatRig.hullGroup.rotation.y = THREE.MathUtils.damp(
      this.boatRig.hullGroup.rotation.y,
      -riverAngle * 0.85 - this.boatVelX * 0.025,
      9,
      dt
    );
    this.boatRig.hullGroup.rotation.x = this.boatJumpY > 0.05 ? this.boatVelY * 0.025 : (inCalmLake ? 0 : Math.sin(this.totalTime * 9) * 0.04);
    this.boatRig.propeller.rotation.z += dt * (inCalmLake ? 8 : 24);
    this.boatRig.wakeL.visible = this.boatJumpY <= 0.1;
    this.boatRig.wakeR.visible = this.boatJumpY <= 0.1;

    if (!inCalmLake && this.boatJumpY <= 0.1 && Math.random() < 0.45) {
      this.spawnBurst(this.boatPos.x, 0.12, this.boatPos.z + 1.8, 0xe0f2fe, 1, 1.8);
    }

    // Rider sits cleanly at the boat helm
    this.playerPos.set(this.boatPos.x, this.boatPos.y + 0.45, this.boatPos.z + 0.1);
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.bodyGroup.rotation.y = Math.PI - riverAngle * 0.85;
    this.playerRig.bodyGroup.scale.setScalar(0.92);
    this.playerRig.hoverBeam.visible = false;
    this.contactShadowMesh.visible = false;

    this.collectNearbyCoins(this.boatPos.x, this.boatPos.y + 0.8, this.boatPos.z, 7.2);

    // Hazard checks: jagged river rocks & patrolling/ambush crocodiles (can jump over hazards!)
    if (this.boatJumpY < 0.85) {
      for (const rk of this.riverRocks) {
        const dx = this.boatPos.x - rk.pos.x;
        const dz = this.boatPos.z - rk.pos.z;
        const hitDist = rk.radius + 0.72;
        if (dx * dx + dz * dz < hitDist * hitDist) {
          soundEngine.playSplash();
          this.spawnBurst(this.boatPos.x, 0.35, this.boatPos.z, 0xf0f9ff, 20, 6.2);
          this.boatVelX = dx >= 0 ? 5.5 : -5.5;
          this.boatPos.z += 1.2;
          this.damagePlayer(dx, 1);
          break;
        }
      }

      if (this.phase === 'playing') {
        for (const croc of this.crocodiles) {
          if (croc.behavior === 'ambush' && croc.emergeProgress < 0.35) continue;
          const dx = this.boatPos.x - croc.pos.x;
          const dz = this.boatPos.z - croc.pos.z;
          if (Math.abs(dx) < 1.85 && Math.abs(dz) < 1.25) {
            soundEngine.playSplash();
            this.spawnBurst(this.boatPos.x, 0.35, this.boatPos.z, 0x84cc16, 18, 6.0);
            this.boatVelX = dx >= 0 ? 6.0 : -6.0;
            this.boatPos.z += 1.4;
            this.damagePlayer(dx, 1);
            break;
          }
        }
      }
    }

    // Arrival at calm lake pier
    if (this.boatPos.z <= this.boatLakePos.z + 1.5) {
      this.boatState = 'docked';
      this.perspectiveMode = '3D';
      this.boatRig.wakeL.visible = false;
      this.boatRig.wakeR.visible = false;
      this.boatRig.root.position.set(this.boatLakePos.x - 4.2, 0.05, this.boatLakePos.z + 2.0);
      this.boatRig.hullGroup.rotation.set(0, 0.25, 0);

      this.playerRig.bodyGroup.scale.setScalar(1);
      this.playerPos.set(this.boatLakePos.x, 1.3, this.boatLakePos.z - 5.0);
      this.playerVel.set(0, 3.8, -2.2);
      this.spawnPos.copy(this.playerPos);
      this.checkpointActive = true;
      soundEngine.playCheckpoint();
      this.showBanner('¡Desembarco en el lago tranquilo! Camina hacia el portal', 3.4);
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

    if (this.rocketState !== 'flying' && this.gliderState !== 'flying' && this.boatState !== 'sailing') {
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
      rig.botRocketRig.visible = false;
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
        rig.capeGroup.rotation.x = 0.25 + runFactor * 0.55 + (this.isHovering || this.botRocketTimer > 0 ? 0.5 : 0);
      }

      if (this.hasMonkeySuit) {
        rig.monkeyTail.rotation.y = Math.sin(this.totalTime * (this.isClimbing ? 10 : 6)) * 0.42;
        rig.monkeyTail.rotation.x = Math.cos(this.totalTime * 4) * 0.14;
      }

      const rocketActive = this.botRocketTimer > 0;
      rig.botRocketRig.visible = rocketActive;
      if (rocketActive) {
        const rPulse = 0.92 + Math.sin(this.totalTime * 42) * 0.14;
        rig.botRocketRig.scale.set(rPulse, 1, rPulse);
      }

      rig.hoverBeam.visible = this.isHovering && !rocketActive;
      rig.thrusterLeft.visible = this.isHovering || rocketActive;
      rig.thrusterRight.visible = this.isHovering || rocketActive;
      if (this.isHovering || rocketActive) {
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

    if (this.gliderState === 'flying') {
      _vec3A.set(this.gliderPos.x * 0.72, this.gliderPos.y + 3.8, this.gliderPos.z + 10.6);
      this.camCurrentPos.lerp(_vec3A, 1 - Math.exp(-8 * dt));
      _vec3B.set(this.gliderPos.x * 0.88, this.gliderPos.y - 1.2, this.gliderPos.z - 18);
      this.camLookTarget.lerp(_vec3B, 1 - Math.exp(-9 * dt));
      this.camera.position.copy(this.camCurrentPos);
      if (this.shakeIntensity > 0.005) {
        this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      }
      this.camera.lookAt(this.camLookTarget);
      return;
    }

    if (this.boatState === 'sailing') {
      const riverCx = getRiverCenterX(this.boatPos.z);
      const riverAngle = getRiverSlopeAngle(this.boatPos.z);
      const camX = THREE.MathUtils.lerp(riverCx, this.boatPos.x, 0.72) - Math.sin(riverAngle) * 7.5;
      const camZ = this.boatPos.z + Math.cos(riverAngle) * 11.4;
      _vec3A.set(camX, 5.4 + this.boatJumpY * 0.45, camZ);
      this.camCurrentPos.lerp(_vec3A, 1 - Math.exp(-8.5 * dt));
      const lookAheadZ = this.boatPos.z - 14;
      const lookCx = THREE.MathUtils.lerp(getRiverCenterX(lookAheadZ), this.boatPos.x, 0.45);
      _vec3B.set(lookCx, 0.9, lookAheadZ);
      this.camLookTarget.lerp(_vec3B, 1 - Math.exp(-9.5 * dt));
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
      botRocketCharges: this.botRocketCharges,
      botRocketActive: this.botRocketTimer > 0,
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
