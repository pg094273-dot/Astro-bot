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
  createChallengeGateMesh,
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
  createNycHelicopterMesh,
  createNycVehicleMesh,
  createNycWaterTowerMesh,
  createRiverBoatRig,
  createRocketPadMesh,
  createRocketVehicle,
  createWebAnchorBeaconMesh,
  createWebCocoonMesh,
  CrocodileRig,
  HangGliderRig,
  RiverBoatRig,
  RocketVehicleRig,
} from './models';
import {
  buildStyledPlatformMesh,
  createDesertThermalUpdraftMesh,
  createEnemyProjectileMesh,
  createNebulaGravityUpdraftMesh,
  createParisWindUpdraftMesh,
  createPolarWindUpdraftMesh,
  createRelicMesh,
  createSwitchMesh,
  createTempleWindUpdraftMesh,
  createVolcanicThermalUpdraftMesh,
  createWindZoneMesh,
} from './platformBuilder';
import {
  AmbientMoteSystem,
  applyGlacialIceSheenShader,
  applyMoltenLavaShader,
  applyNebulaVoidShader,
  applyRiverRapidsShader,
  applyShiftingSandShader,
  applyWaterSurfaceShader,
  applyWindSwayShader,
  createAuroraCurtainMaterial,
  createBiomeAmbientParticles,
  createHeatWaveShaderMaterial,
  createHologramShaderMaterial,
} from './shaders';
import {
  createProceduralTextures,
  disposeProceduralTextures,
  ProceduralTextures,
} from './textures';
import {
  CameraDiscoveryZoneDef,
  CameraZone2DDef,
  ClimbWallDef,
  EnemyKind,
  GamePhase,
  getRiverCenterX,
  getRiverChannelBounds,
  getRiverDropSlope,
  getRiverSlopeAngle,
  getRiverWaterY,
  getRiverZoneSpeedFactor,
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
const _euler = new THREE.Euler();
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
  disappearState: 'solid' | 'warning' | 'hidden';
  rotAngle: number;
  prevRotAngle: number;
  activated: boolean;
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
  wingL?: THREE.Mesh;
  wingR?: THREE.Mesh;
  turretHead?: THREE.Group;
  shieldMesh?: THREE.Mesh;
  basePos: THREE.Vector3;
  pos: THREE.Vector3;
  patrolOffset: THREE.Vector3;
  speed: number;
  phase: number;
  hp: number;
  hitFlash: number;
  alive: boolean;
  hopPhase: number;
  shootTimer: number;
  webbedTimer?: number;
  webCocoon?: THREE.Group;
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
  phase: number;
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

interface SwitchRuntime {
  id: string;
  group: THREE.Group;
  buttonMesh: THREE.Mesh;
  buttonMat: THREE.MeshStandardMaterial;
  ringMat: THREE.MeshStandardMaterial;
  pos: THREE.Vector3;
  message?: string;
  coins: number;
  activated: boolean;
}

interface RelicRuntime {
  id: string;
  name: string;
  group: THREE.Group;
  core: THREE.Mesh;
  halo: THREE.Mesh;
  baseY: number;
  pos: THREE.Vector3;
  collected: boolean;
  phase: number;
}

interface WindZoneRuntime {
  group: THREE.Group;
  swirls: THREE.Mesh[];
  pos: THREE.Vector3;
  radius: number;
  height: number;
  liftSpeed: number;
}

interface EnemyProjectileRuntime {
  mesh: THREE.Mesh;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
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
    relics: number;
    totalRelics: number;
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
  private shaderTimeUniform = { value: 0 };
  private ambientMotes: AmbientMoteSystem | null = null;

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
  private switches: SwitchRuntime[] = [];
  private relics: RelicRuntime[] = [];
  private windZones: WindZoneRuntime[] = [];
  private enemyProjectiles: EnemyProjectileRuntime[] = [];
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

  // 2D/3D Camera Zone & Discovery state
  private active2DZone: CameraZone2DDef | null = null;
  private activeDiscoveryZone: CameraDiscoveryZoneDef | null = null;
  private triggeredDiscoveryBanners = new Set<string>();
  private perspectiveMode: '3D' | '2D' | 'COHETE' | 'ALA DELTA' | 'BARCO' = '3D';

  // Templo del Mono & Selva Esmeralda ambient jungle leaves, fireflies, waterfall mist pools, mist plumes & stellar arch rings
  private templeLeafMesh: THREE.InstancedMesh | null = null;
  private templeLeafStates: { x: number; y: number; z: number; fallSpeed: number; swayPhase: number; rotSpeed: number }[] = [];
  private templeFireflyTime: { value: number } | null = null;
  private templeWaterfallPools: THREE.Vector3[] = [];
  private templeMistPlumes: { mesh: THREE.Mesh; baseY: number; baseScale: number; phase: number }[] = [];
  private templeThermalRibbons: THREE.Object3D[] = [];
  private templeRuneGlows: { mat: THREE.MeshStandardMaterial; phase: number }[] = [];
  private jungleArchRings: THREE.Mesh[] = [];

  // Dunas del Desierto dynamic dust devils, hot-air geysers, sandstorm drift bands, solar astrolabes & thermal ribbons
  private desertDustDevils: { group: THREE.Group; baseX: number; baseZ: number; phase: number; radius: number; speed: number }[] = [];
  private desertGeysers: { group: THREE.Group; plume: THREE.Mesh; ring: THREE.Mesh; pos: THREE.Vector3; phase: number; period: number }[] = [];
  private desertMechanismSpinners: THREE.Object3D[] = [];
  private desertThermalRibbons: THREE.Object3D[] = [];
  private desertSandstormBands: { mesh: THREE.Mesh; baseX: number; baseZ: number; phase: number; speed: number }[] = [];
  private desertCollapsingMasonry: { mesh: THREE.Object3D; basePos: THREE.Vector3; phase: number; period: number }[] = [];

  // Glaciar Aurora animated aurora ribbons, blizzards, cold vapor plumes, crystal conduits & polar updrafts
  private iceThermalRibbons: THREE.Object3D[] = [];
  private iceBlizzardBands: { mesh: THREE.Mesh; baseX: number; baseZ: number; phase: number; speed: number }[] = [];
  private iceVaporPlumes: { mesh: THREE.Mesh; baseY: number; phase: number }[] = [];
  private iceCrystalClusters: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial; phase: number }[] = [];
  private iceMechanismBeam: { mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial } | null = null;

  // Cañón Volcánico animated lava bubbles, geysers, smoke columns, falling rocks, ash, fissures & thermal updrafts
  private volcanicThermalRibbons: THREE.Object3D[] = [];
  private volcanicBubbles: { mesh: THREE.Mesh; pos: THREE.Vector3; phase: number; period: number; popped: boolean; maxR: number }[] = [];
  private volcanicGeysers: { lavaJet: THREE.Mesh; steamPlume: THREE.Mesh; pos: THREE.Vector3; phase: number; period: number; kind: 'lava' | 'steam' }[] = [];
  private volcanicSmokePuffs: { mesh: THREE.Mesh; baseX: number; baseY: number; baseZ: number; riseH: number; speed: number; phase: number; baseScale: number }[] = [];
  private volcanicFallingRocks: { mesh: THREE.Mesh; startX: number; startY: number; startZ: number; phase: number; period: number; splashed: boolean; rotAxis: THREE.Vector3 }[] = [];
  private volcanicAshMesh: THREE.InstancedMesh | null = null;
  private volcanicAshStates: { x: number; y: number; z: number; fallSpeed: number; swayPhase: number; rotSpeed: number }[] = [];
  private volcanicFissureGlows: { mat: THREE.MeshStandardMaterial; phase: number }[] = [];

  // Ciudadela Nebulosa suspended skyscrapers, orbital astrolabes, volumetric clouds, void waterfalls & gravity updrafts
  private nebulaSpinners: { obj: THREE.Object3D; speed: number; axis: 'x' | 'y' | 'z' }[] = [];
  private nebulaFloatNodes: { obj: THREE.Object3D; baseY: number; amp: number; speed: number; phase: number }[] = [];
  private nebulaCloudBanks: { group: THREE.Group; baseX: number; baseY: number; baseZ: number; spanX: number; speed: number; phase: number }[] = [];
  private nebulaThermalRibbons: THREE.Object3D[] = [];
  private nebulaWaterfallTex: THREE.CanvasTexture | null = null;
  private nebulaWaterfallDrops: THREE.Vector3[] = [];

  // Cielos de París golden sunset city, Seine bridges, sky updrafts, hot-air balloons, birds, volumetric clouds & falling leaves
  private parisThermalRibbons: THREE.Object3D[] = [];
  private parisBalloons: { group: THREE.Group; baseX: number; baseY: number; baseZ: number; swayAmp: number; phase: number; isObstacle: boolean; radius: number }[] = [];
  private parisBirds: { group: THREE.Group; wingL: THREE.Mesh; wingR: THREE.Mesh; center: THREE.Vector3; radius: number; speed: number; phase: number }[] = [];
  private parisClouds: { group: THREE.Group; baseX: number; baseY: number; baseZ: number; spanX: number; speed: number; phase: number }[] = [];
  private parisClockHands: { hourHand: THREE.Object3D; minuteHand: THREE.Object3D }[] = [];
  private parisUpdraftZones: { pos: THREE.Vector3; radius: number; height: number; triggeredCooldown: number }[] = [];
  private parisLeafMesh: THREE.InstancedMesh | null = null;
  private parisLeafStates: { x: number; y: number; z: number; fallSpeed: number; swayPhase: number; rotSpeed: number }[] = [];

  // Rápidos del Río Bravo (Level 8) dynamic logs, moving rocks, whirlpools, side waterfalls, mist & wake ripples
  private rapidsWaterfallTex: THREE.CanvasTexture | null = null;
  private rapidsDriftingLogs: { group: THREE.Group; pos: THREE.Vector3; baseX: number; baseZ: number; swingAmp: number; speed: number; phase: number; halfWidth: number; halfLen: number }[] = [];
  private rapidsMovingRocks: { mesh: THREE.Mesh; foam: THREE.Mesh; baseX: number; pos: THREE.Vector3; radius: number; ampX: number; speed: number; phase: number }[] = [];
  private rapidsWhirlpools: { group: THREE.Group; pos: THREE.Vector3; radius: number; spinDir: number }[] = [];
  private rapidsMistZones: THREE.Vector3[] = [];
  private rapidsMistPlumes: { mesh: THREE.Mesh; baseY: number; baseScale: number; phase: number }[] = [];
  private rapidsRipples: { mesh: THREE.Mesh; life: number; maxLife: number }[] = [];
  private rapidsRippleCooldown = 0;

  // Level 09 Spider-Man & NYC state
  private hasSpiderSuit = false;
  private spiderTransformTimer = 0;
  private spiderTransformDone = false;
  private webActive = false;
  private webAnchor = new THREE.Vector3();
  private webLength = 10;
  private webCooldown = 0;
  private webShots: { mesh: THREE.Group; pos: THREE.Vector3; vel: THREE.Vector3; life: number }[] = [];
  private webLineMesh: THREE.Mesh | null = null;
  private webReticleMesh: THREE.Mesh | null = null;
  private highlightedWebAnchor: THREE.Vector3 | null = null;
  private webAnchorPoints: THREE.Vector3[] = [];
  private webAnchorBeacons: THREE.Group[] = [];
  private climbFace: 'pz' | 'nz' | 'px' | 'nx' | null = null;
  private climbBoxCenter = new THREE.Vector3();
  private climbBoxHalf = new THREE.Vector3();
  private nycVehicles: { group: THREE.Group; axis: 'x' | 'z'; dir: number; speed: number; minC: number; maxC: number }[] = [];
  private nycHelicopters: { group: THREE.Group; center: THREE.Vector3; radius: number; speed: number; phase: number }[] = [];
  private nycPedestrianMesh: THREE.InstancedMesh | null = null;
  private nycPedestrianStates: { x: number; y: number; z: number; axis: 'x' | 'z'; speed: number; phase: number; span: number }[] = [];
  private timedChallengesRuntime: {
    id: string;
    label: string;
    startPos: THREE.Vector3;
    checkpoints: THREE.Vector3[];
    timeLimit: number;
    rewardCoins: number;
    startPad: THREE.Group;
    gates: THREE.Group[];
    completed: boolean;
    active: boolean;
    currentIdx: number;
    timer: number;
    lastTickSec: number;
  }[] = [];

  // Player state
  private playerPos = new THREE.Vector3(0, 1.5, 0);
  private playerVel = new THREE.Vector3(0, 0, 0);
  private playerYaw = Math.PI;
  private playerSquash = new THREE.Vector3(1, 1, 1);
  private grounded = false;
  private standingPlatform: PlatformRuntime | null = null;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private hasDoubleJump = true;
  private doubleJumpFlipTimer = 0;
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
  private relicsCollected = 0;
  private hitstopTimer = 0;
  private shakeIntensity = 0;
  private bannerText: string | null = null;
  private bannerTimer = 0;
  private lastHudPush = 0;

  // Camera & pointer state
  private camYaw = 0;
  private camPitch = 0.42;
  private camDynamicFov = 56;
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
        relics: number;
        totalRelics: number;
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
              this.spawnBurst(this.boatPos.x, this.boatPos.y + 0.15, this.boatPos.z, 0xe0f2fe, 14, 4.8);
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
              !this.hasDoubleJump &&
              this.botRocketCharges > 0 &&
              this.botRocketTimer <= 0 &&
              this.playerVel.y < -2.2 &&
              this.hoverFuel <= 0.12
            ) {
              this.activateBotRocketRescue();
            } else {
              this.jumpBufferTimer = 0.14;
              if (isDoubleTapOk) {
                this.triggerSpin();
                if (this.hasSpiderSuit) this.triggerSpiderWebAction();
                else if (this.hasBow) this.shootArrow();
              } else if (isMidAirOk && !this.hasDoubleJump && !this.webActive) {
                this.triggerSpin();
              }
            }
          }
        }
        if (isTvSpinKey) {
          this.triggerSpin();
        }
        if (isTvBowKey) {
          if (this.hasSpiderSuit) this.triggerSpiderWebAction();
          else this.shootArrow();
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
      if (this.hasSpiderSuit && this.webActive) {
        this.releaseWeb(false);
      } else {
        this.triggerSpin();
      }
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
      if (moved < 6 && this.rocketState !== 'flying') {
        if (this.hasSpiderSuit) {
          this.triggerSpiderWebAction();
        } else if (this.hasBow) {
          this.shootArrow();
        }
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
          !this.hasDoubleJump &&
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
    if (this.ambientMotes) {
      this.scene.remove(this.ambientMotes.points);
      this.ambientMotes.dispose();
      this.ambientMotes = null;
    }
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
    this.switches = [];
    this.relics = [];
    this.windZones = [];
    this.enemyProjectiles = [];
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
    this.templeLeafMesh = null;
    this.templeLeafStates = [];
    this.templeFireflyTime = null;
    this.templeWaterfallPools = [];
    this.templeMistPlumes = [];
    this.templeThermalRibbons = [];
    this.templeRuneGlows = [];
    this.jungleArchRings = [];
    this.desertDustDevils = [];
    this.desertGeysers = [];
    this.desertMechanismSpinners = [];
    this.desertThermalRibbons = [];
    this.desertSandstormBands = [];
    this.desertCollapsingMasonry = [];
    this.iceThermalRibbons = [];
    this.iceBlizzardBands = [];
    this.iceVaporPlumes = [];
    this.iceCrystalClusters = [];
    this.iceMechanismBeam = null;
    this.volcanicThermalRibbons = [];
    this.volcanicBubbles = [];
    this.volcanicGeysers = [];
    this.volcanicSmokePuffs = [];
    this.volcanicFallingRocks = [];
    this.volcanicAshMesh = null;
    this.volcanicAshStates = [];
    this.volcanicFissureGlows = [];
    this.nebulaSpinners = [];
    this.nebulaFloatNodes = [];
    this.nebulaCloudBanks = [];
    this.nebulaThermalRibbons = [];
    if (this.nebulaWaterfallTex) {
      this.nebulaWaterfallTex.dispose();
      this.nebulaWaterfallTex = null;
    }
    this.nebulaWaterfallDrops = [];
    this.parisThermalRibbons = [];
    this.parisBalloons = [];
    this.parisBirds = [];
    this.parisClouds = [];
    this.parisClockHands = [];
    this.parisUpdraftZones = [];
    this.parisLeafMesh = null;
    this.parisLeafStates = [];
    if (this.rapidsWaterfallTex) {
      this.rapidsWaterfallTex.dispose();
      this.rapidsWaterfallTex = null;
    }
    this.rapidsDriftingLogs = [];
    this.rapidsMovingRocks = [];
    this.rapidsWhirlpools = [];
    this.rapidsMistZones = [];
    this.rapidsMistPlumes = [];
    this.rapidsRipples = [];
    this.rapidsRippleCooldown = 0;
    this.webActive = false;
    this.webCooldown = 0;
    this.webShots = [];
    this.webLineMesh = null;
    this.webReticleMesh = null;
    this.highlightedWebAnchor = null;
    this.webAnchorPoints = [];
    this.webAnchorBeacons = [];
    this.climbFace = null;
    this.nycVehicles = [];
    this.nycHelicopters = [];
    this.nycPedestrianMesh = null;
    this.nycPedestrianStates = [];
    this.timedChallengesRuntime = [];
    this.activeDiscoveryZone = null;
    this.triggeredDiscoveryBanners.clear();
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

  private createJaggedRockFormationGeometry(radius: number, height: number, seed: number): THREE.BufferGeometry {
    const geo = new THREE.CylinderGeometry(radius * 0.62, radius * 1.15, height, 11, 5, false);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const ang = Math.atan2(vz, vx);
      const yNorm = (vy + height * 0.5) / Math.max(0.1, height);
      const ledge = 1 + 0.24 * Math.sin(ang * 3 + seed) + 0.16 * Math.cos(vy * 0.9 + seed * 1.7) + 0.12 * Math.sin(ang * 5 - yNorm * 4);
      const capDip = yNorm > 0.88 ? Math.sin(ang * 2 + seed) * 0.45 : 0;
      pos.setXYZ(i, vx * ledge, vy + capDip, vz * ledge);
    }
    geo.computeVertexNormals();
    return geo;
  }

  private createCurvedLeafGeometry(length: number, width: number): THREE.BufferGeometry {
    const segsY = 6;
    const geo = new THREE.PlaneGeometry(width, length, 2, segsY);
    geo.translate(0, length * 0.5, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = Math.max(0, pos.getY(i));
      const t = THREE.MathUtils.clamp(y / Math.max(0.01, length), 0, 1);
      // Taper blade silhouette at base & tip + natural outward droop arch + subtle center V-fold
      const taper = Math.sin(Math.pow(t, 0.72) * Math.PI);
      const droopZ = t * t * length * 0.42;
      const vFold = Math.abs(x) * 0.22;
      pos.setXYZ(i, x * (0.28 + taper * 0.92), y - t * t * length * 0.12, droopZ + vFold);
    }
    geo.computeVertexNormals();
    return geo;
  }

  private createDuneFieldGeometry(width: number, depth: number, segX: number, segZ: number, seed: number): THREE.BufferGeometry {
    const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      // Asymmetric wind-carved barchan dune ridges with crisp crests & smooth swales
      const w1 = Math.sin(vz * 0.032 + vx * 0.055 + seed);
      const crest = (1.0 - Math.abs(w1)) * 7.5;
      const roll = Math.sin(vx * 0.07 - vz * 0.02 + seed * 1.4) * 3.8 + Math.cos(vz * 0.065 + vx * 0.03) * 2.4;
      const edgeFalloff = THREE.MathUtils.smoothstep(Math.abs(vx + width * 0.42), 2.0, width * 0.35);
      const outerLift = Math.max(0, (Math.abs(vx) - width * 0.08) * 0.14);
      const h = Math.max(-0.5, (crest + roll + outerLift) * edgeFalloff - 0.35);
      pos.setY(i, h);
    }
    geo.computeVertexNormals();
    return geo;
  }

  private createDesertRockArchGeometry(span: number, height: number, tubeRadius: number, seed: number): THREE.BufferGeometry {
    const pts: THREE.Vector3[] = [];
    const steps = 12;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const ang = t * Math.PI;
      const x = -Math.cos(ang) * (span * 0.5);
      const y = Math.sin(ang) * height + Math.sin(t * 7 + seed) * 0.45;
      const z = Math.sin(t * 4 + seed * 1.3) * 0.95;
      pts.push(new THREE.Vector3(x, y, z));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 24, tubeRadius, 8, false);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const strata = 1 + 0.16 * Math.sin(vy * 1.6 + seed) + 0.12 * Math.cos(vx * 0.9 + vz * 1.1);
      pos.setXYZ(i, vx * (1 + (strata - 1) * 0.25), vy * (1 + (strata - 1) * 0.12), vz * strata);
    }
    geo.computeVertexNormals();
    return geo;
  }

  private createGlacierPeakGeometry(radius: number, height: number, seed: number): THREE.BufferGeometry {
    const geo = new THREE.ConeGeometry(radius, height, 11, 5, false);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const yNorm = THREE.MathUtils.clamp((vy + height * 0.5) / Math.max(0.1, height), 0, 1);
      const ang = Math.atan2(vz, vx);
      const ridge = 1 + 0.34 * Math.sin(ang * 3 + seed) + 0.18 * Math.cos(ang * 5 - seed * 1.4);
      const shear = (1 - yNorm) * 0.25 + yNorm * 0.85;
      const leanX = Math.sin(seed) * yNorm * radius * 0.28;
      const leanZ = Math.cos(seed * 1.3) * yNorm * radius * 0.24;
      pos.setXYZ(i, vx * ridge + leanX * shear, vy, vz * ridge + leanZ * shear);
    }
    geo.computeVertexNormals();
    return geo;
  }

  private buildBiomeScenery(level: LevelDef) {
    const biome = level.theme.biome;
    const dummy = new THREE.Object3D();

    if (biome === 'jungle') {
      // =====================================================================
      // NIVEL 01: SELVA ESMERALDA — Monumental Tropical Jungle & Eroded Ruins
      // =====================================================================

      // 1. MULTI-PLANE ATMOSPHERIC HORIZON & DISTANT LOST TEMPLES
      this.addHorizonMountainRing(24, -58, level.theme.hazardFloorY - 2, 136, 232, 66, 0x2f5d74, 0xa8d4db, 2.2, 0.88);
      this.addHorizonMountainRing(22, -55, level.theme.hazardFloorY - 1, 88, 144, 34, 0x163d2c, 0x3b7a38, 1.4, 0.9);

      // Shared PBR Materials for Eroded Stone, Mossy Turf, Bark, Foliage & Lianas
      const ruinStoneMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleRuinStone,
        bumpMap: this.textures.jungleRuinBump,
        bumpScale: 0.22,
        roughnessMap: this.textures.stoneRoughness,
        roughness: 0.88,
        metalness: 0.04,
      });
      const cliffRockMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleRuinStone,
        bumpMap: this.textures.jungleRuinBump,
        bumpScale: 0.24,
        color: 0x808773,
        roughness: 0.92,
      });
      const moundTopMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleGrass,
        bumpMap: this.textures.grassBump,
        bumpScale: 0.11,
        roughness: 0.86,
      });
      const moundSideMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleSide,
        bumpMap: this.textures.jungleSideBump,
        bumpScale: 0.16,
        roughness: 0.9,
      });
      const heroBarkMat = new THREE.MeshStandardMaterial({
        map: this.textures.barkTexture,
        bumpMap: this.textures.barkBump,
        bumpScale: 0.2,
        roughness: 0.88,
      });
      const palmBarkMat = new THREE.MeshStandardMaterial({
        map: this.textures.barkTexture,
        bumpMap: this.textures.barkBump,
        bumpScale: 0.14,
        color: 0xa18873,
        roughness: 0.86,
      });
      const leafSunMat = new THREE.MeshStandardMaterial({
        color: 0x5ca832,
        roughness: 0.72,
      });
      const leafMidMat = new THREE.MeshStandardMaterial({
        color: 0x377822,
        roughness: 0.78,
      });
      const leafDeepMat = new THREE.MeshStandardMaterial({
        color: 0x1e4d16,
        roughness: 0.84,
      });
      const leafVeinedMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleLeafTex,
        color: 0xffffff,
        roughness: 0.68,
        side: THREE.DoubleSide,
      });
      const lianaMat = new THREE.MeshStandardMaterial({
        color: 0x457c25,
        roughness: 0.76,
      });
      const goldCarvingMat = new THREE.MeshStandardMaterial({
        map: this.textures.goldTrim,
        color: 0xf59e0b,
        emissive: 0x78350f,
        emissiveIntensity: 0.45,
        metalness: 0.78,
        roughness: 0.28,
      });
      const stellarGlowMat = new THREE.MeshStandardMaterial({
        color: 0x5eead4,
        emissive: 0x10b981,
        emissiveIntensity: 1.9,
        roughness: 0.18,
      });

      applyWindSwayShader(leafSunMat, this.shaderTimeUniform, 0.24, 1.9);
      applyWindSwayShader(leafMidMat, this.shaderTimeUniform, 0.2, 1.7);
      applyWindSwayShader(leafDeepMat, this.shaderTimeUniform, 0.15, 1.55);
      applyWindSwayShader(leafVeinedMat, this.shaderTimeUniform, 0.26, 2.05);
      applyWindSwayShader(lianaMat, this.shaderTimeUniform, 0.28, 1.4);

      // 2. SCULPTED ORGANIC VALLEY RIVERBANKS, MOSSY HILLS & IRREGULAR CANYON CLIFFS
      const bankGeo = new THREE.PlaneGeometry(58, 220, 18, 42);
      bankGeo.rotateX(-Math.PI / 2);
      const bPos = bankGeo.attributes.position;
      for (let i = 0; i < bPos.count; i++) {
        const vx = bPos.getX(i);
        const vz = bPos.getZ(i);
        const innerFade = THREE.MathUtils.clamp((vx + 29) / 22, 0, 1);
        const hill =
          innerFade *
          (6.5 +
            Math.sin(vz * 0.06 + vx * 0.12) * 3.8 +
            Math.cos(vx * 0.14 - vz * 0.04) * 2.6 +
            Math.sin(vz * 0.17) * 1.4);
        bPos.setY(i, hill - 0.8);
      }
      bankGeo.computeVertexNormals();
      const bankLeft = new THREE.Mesh(bankGeo, moundTopMat);
      bankLeft.position.set(-44, level.theme.hazardFloorY, -55);
      bankLeft.receiveShadow = true;
      const bankRight = new THREE.Mesh(bankGeo, moundTopMat);
      bankRight.position.set(92, level.theme.hazardFloorY, -55);
      bankRight.rotation.y = Math.PI;
      bankRight.receiveShadow = true;
      this.levelGroup.add(bankLeft, bankRight);

      // Irregular Towering Jungle Rock Formations & Canyon Buttresses framing the valley
      const cliffSpots: [number, number, number, number, number, number][] = [
        [-28, -12, -20, 6.2, 19, 1.1],
        [-34, -12, -46, 7.8, 24, 2.4],
        [-30, -12, -82, 8.5, 27, 3.7],
        [-18, -12, -108, 7.2, 23, 4.9],
        [26, -12, -14, 6.4, 18, 5.8],
        [32, -12, -32, 7.0, 21, 6.4],
        [78, -12, -42, 7.4, 24, 7.1],
        [76, -12, -68, 8.2, 26, 8.3],
        [82, -12, -96, 8.8, 29, 9.5],
        [24, -12, -112, 7.6, 25, 10.2],
        [76, -12, -122, 8.4, 28, 11.4],
        [-4, -12, -58, 5.4, 16, 12.1],
      ];
      for (const [cx, cy, cz, rad, ch, seed] of cliffSpots) {
        const rock = new THREE.Mesh(this.createJaggedRockFormationGeometry(rad, ch, seed), cliffRockMat);
        rock.position.set(cx, cy + ch * 0.42, cz);
        rock.receiveShadow = true;
        this.levelGroup.add(rock);

        // Mossy grass cap perched atop jagged cliff pillar
        const cap = new THREE.Mesh(this.createDisplacedRockGeometry(rad * 0.68, seed + 1.5), moundTopMat);
        cap.scale.set(1.05, 0.34, 1.05);
        cap.position.set(cx, cy + ch * 0.88, cz);
        this.levelGroup.add(cap);
      }

      // Emerging River Shoals & Natural Stepping Boulders in the Valley Water
      const shoalSpots: [number, number, number][] = [
        [-8, -15, 2.2],
        [9, -8, 2.0],
        [16, -24, 2.5],
        [26, -54, 2.8],
        [34, -74, 2.4],
        [18, -88, 2.6],
        [68, -32, 2.3],
      ];
      for (let i = 0; i < shoalSpots.length; i++) {
        const [sx, sz, sr] = shoalSpots[i];
        const shoal = new THREE.Mesh(this.createDisplacedRockGeometry(sr, 2.1 + i), cliffRockMat);
        shoal.scale.set(1.4, 0.55, 1.2);
        shoal.position.set(sx, level.theme.hazardFloorY + 0.35, sz);
        this.levelGroup.add(shoal);

        const mossCap = new THREE.Mesh(this.createDisplacedRockGeometry(sr * 0.9, 4.4 + i), moundTopMat);
        mossCap.scale.set(1.2, 0.24, 1.05);
        mossCap.position.set(sx, level.theme.hazardFloorY + 0.82, sz);
        this.levelGroup.add(mossCap);
      }

      // 3. ANCIENT ERODED TEMPLE ARCHITECTURE, STAIRS, FRACTURED COLUMNS & RUIN BRIDGE
      const buildOvergrownStepPyramid = (
        px: number,
        py: number,
        pz: number,
        baseW: number,
        tiers: number,
        rotY: number,
        withSanctuaryDoor = false
      ) => {
        const tg = new THREE.Group();
        tg.position.set(px, py, pz);
        tg.rotation.y = rotY;
        const tierH = 2.6;
        for (let t = 0; t < tiers; t++) {
          const w = baseW - t * (baseW * 0.15);
          const d = baseW * 0.9 - t * (baseW * 0.13);
          const block = new THREE.Mesh(new THREE.BoxGeometry(w, tierH, d), ruinStoneMat);
          block.position.y = t * tierH + tierH * 0.5;
          block.receiveShadow = true;
          block.castShadow = !this.isSoftwareGl;
          tg.add(block);

          // Overhanging mossy ledge invading the tier rim
          const mossTrim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.25, 0.26, d + 0.25), moundTopMat);
          mossTrim.position.y = t * tierH + tierH - 0.08;
          tg.add(mossTrim);
        }

        const totalH = tiers * tierH;
        // Grand Central Stone Staircase + Carved Balustrades
        const stepCount = tiers * 3;
        const stairW = baseW * 0.24;
        for (let s = 0; s < stepCount; s++) {
          const f = s / stepCount;
          const step = new THREE.Mesh(new THREE.BoxGeometry(stairW, 0.85, 1.1), ruinStoneMat);
          step.position.set(0, f * totalH + 0.35, (1 - f) * (baseW * 0.46) + 0.6);
          tg.add(step);
        }
        for (const side of [-1, 1]) {
          const bal = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.2, baseW * 0.54), ruinStoneMat);
          bal.position.set(side * (stairW * 0.56), totalH * 0.5, baseW * 0.25);
          bal.rotation.x = -0.62;
          tg.add(bal);
        }

        // Summit Temple Shrine & Luminous Sanctuary Doorway
        const topY = totalH;
        const shrineW = baseW * 0.34;
        const shrine = new THREE.Mesh(new THREE.BoxGeometry(shrineW, 3.8, shrineW * 0.85), ruinStoneMat);
        shrine.position.set(0, topY + 1.9, 0);
        tg.add(shrine);
        const roof = new THREE.Mesh(new THREE.BoxGeometry(shrineW + 0.9, 0.9, shrineW * 0.85 + 0.9), ruinStoneMat);
        roof.position.set(0, topY + 4.1, 0);
        tg.add(roof);
        const roofMoss = new THREE.Mesh(new THREE.BoxGeometry(shrineW + 1.0, 0.3, shrineW * 0.85 + 1.0), moundTopMat);
        roofMoss.position.set(0, topY + 4.65, 0);
        tg.add(roofMoss);

        if (withSanctuaryDoor) {
          const doorGlow = new THREE.Mesh(
            new THREE.BoxGeometry(shrineW * 0.44, 2.4, 0.4),
            stellarGlowMat
          );
          doorGlow.position.set(0, topY + 1.35, shrineW * 0.42);
          tg.add(doorGlow);

          // Twin Emerald-Gold Temple Braziers
          for (const side of [-1, 1]) {
            const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.72, 1.4, 10), ruinStoneMat);
            ped.position.set(side * (shrineW * 0.68), topY + 0.7, shrineW * 0.52);
            const flame = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), goldCarvingMat);
            flame.position.set(side * (shrineW * 0.68), topY + 1.75, shrineW * 0.52);
            tg.add(ped, flame);
          }
        }

        // Fractured flanking columns invaded by foliage
        for (const side of [-1, 1]) {
          const fCol = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 3.2, 10), ruinStoneMat);
          fCol.position.set(side * (baseW * 0.34), tierH + 1.6, baseW * 0.28);
          tg.add(fCol);
        }

        this.levelGroup.add(tg);
      };

      // Colossal Sanctuary Temple behind Guardián Musgo-Alfa's Arena
      buildOvergrownStepPyramid(50, 10.6, -133, 28, 5, 0, true);
      // Distant Lost Jungle Temples receding into valley mist
      buildOvergrownStepPyramid(-38, -12, -74, 22, 4, 0.42, true);
      buildOvergrownStepPyramid(86, -10, -104, 24, 4, -0.38, false);
      buildOvergrownStepPyramid(-24, -12, -122, 20, 4, 0.25, false);

      // 2D Wall Carved Ancient Cliff Temple Facade (strictly behind z = -40.8 so player at z = -38 is unobstructed)
      const wallBackdrop = new THREE.Group();
      wallBackdrop.position.set(24, -12, -41.4);
      const cliffWallMesh = new THREE.Mesh(new THREE.BoxGeometry(58, 22, 3.2), ruinStoneMat);
      cliffWallMesh.position.y = 11;
      cliffWallMesh.receiveShadow = true;
      wallBackdrop.add(cliffWallMesh);

      const cliffWallMoss = new THREE.Mesh(new THREE.BoxGeometry(59, 0.75, 3.6), moundTopMat);
      cliffWallMoss.position.y = 22.1;
      wallBackdrop.add(cliffWallMoss);

      for (let col = -24; col <= 24; col += 8) {
        const colH = 17 + ((Math.abs(col) * 3) % 5);
        const pilaster = new THREE.Mesh(new THREE.BoxGeometry(1.7, colH, 0.95), ruinStoneMat);
        pilaster.position.set(col, colH * 0.5, 1.75);
        wallBackdrop.add(pilaster);

        // Carved relief niche & glowing emerald rune medallion
        if (col % 16 === 0) {
          const niche = new THREE.Mesh(new THREE.BoxGeometry(3.2, 4.2, 0.5), goldCarvingMat);
          niche.position.set(col + 4, 15.8, 1.6);
          wallBackdrop.add(niche);
        }
      }
      this.levelGroup.add(wallBackdrop);

      // Ancient Weathered Stone Arch Bridge spanning the deep gorge (vista at [24, 9.2, -118])
      const stoneBridge = new THREE.Group();
      stoneBridge.position.set(24, 9.2, -118);
      stoneBridge.rotation.y = 0.08;
      const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(28, 1.3, 4.4), ruinStoneMat);
      stoneBridge.add(bridgeDeck);
      const bridgeMoss = new THREE.Mesh(new THREE.BoxGeometry(27.5, 0.25, 4.5), moundTopMat);
      bridgeMoss.position.y = 0.72;
      stoneBridge.add(bridgeMoss);
      for (const sx of [-11, -5.5, 0, 5.5, 11]) {
        const pier = new THREE.Mesh(new THREE.BoxGeometry(1.8, 21, 3.8), ruinStoneMat);
        pier.position.set(sx, -10.5, 0);
        stoneBridge.add(pier);
      }
      for (const side of [-1, 1]) {
        for (let b = -12; b <= 12; b += 4) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.15, 0.65), ruinStoneMat);
          post.position.set(b, 1.25, side * 1.9);
          stoneBridge.add(post);
        }
      }
      this.levelGroup.add(stoneBridge);

      // 4. GRAND LUMINOUS STELLAR ARCHES ("Grandes Arcos Estelares") Framing Key Landmarks
      const buildStellarArch = (ax: number, ay: number, az: number, rotY = 0, scale = 1) => {
        const ag = new THREE.Group();
        ag.position.set(ax, ay, az);
        ag.rotation.y = rotY;
        ag.scale.setScalar(scale);

        const colOffset = 3.1;
        for (const side of [-1, 1]) {
          const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.75, 1.65), ruinStoneMat);
          plinth.position.set(side * colOffset, 0.37, 0);
          plinth.castShadow = !this.isSoftwareGl;
          ag.add(plinth);

          const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.62, 5.1, 10), ruinStoneMat);
          pillar.position.set(side * colOffset, 3.1, 0);
          pillar.castShadow = !this.isSoftwareGl;
          ag.add(pillar);

          // Luminous Stellar Rune Band wrapping each stone pillar
          const runeBand = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.08, 8, 20), stellarGlowMat);
          runeBand.rotation.x = Math.PI / 2;
          runeBand.position.set(side * colOffset, 3.2, 0);
          ag.add(runeBand);

          const capital = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.65, 1.4), ruinStoneMat);
          capital.position.set(side * colOffset, 5.75, 0);
          ag.add(capital);
        }

        // Carved Stone Arch & Ornate Lintel Crown
        const archCrown = new THREE.Mesh(new THREE.TorusGeometry(colOffset, 0.48, 10, 22, Math.PI), ruinStoneMat);
        archCrown.position.set(0, 5.85, 0);
        archCrown.castShadow = !this.isSoftwareGl;
        ag.add(archCrown);

        const topLintel = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.85, 1.35), ruinStoneMat);
        topLintel.position.set(0, 9.15, 0);
        ag.add(topLintel);

        const mossCap = new THREE.Mesh(new THREE.BoxGeometry(7.9, 0.28, 1.45), moundTopMat);
        mossCap.position.set(0, 9.65, 0);
        ag.add(mossCap);

        // Radiant Floating Stellar Ring & Astral Crystal Keystone
        const stellarRing = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.09, 10, 36), stellarGlowMat);
        stellarRing.position.set(0, 5.8, 0);
        ag.add(stellarRing);
        this.jungleArchRings.push(stellarRing);

        const keystone = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), goldCarvingMat);
        keystone.position.set(0, 8.35, 0.35);
        ag.add(keystone);

        // Trailing liana vine from arch shoulder
        const vCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-colOffset - 0.3, 6.2, 0.4),
          new THREE.Vector3(-colOffset - 0.55, 4.3, 0.5),
          new THREE.Vector3(-colOffset - 0.25, 2.4, 0.45),
        ]);
        ag.add(new THREE.Mesh(new THREE.TubeGeometry(vCurve, 8, 0.07, 5, false), lianaMat));

        this.levelGroup.add(ag);
      };

      buildStellarArch(0, 0.8, -5.2, 0, 0.94);
      buildStellarArch(0, 2.5, -34.6, 0, 0.92);
      buildStellarArch(50, 6.1, -44.2, 0, 0.96);
      buildStellarArch(50, 12.2, -99.2, 0, 1.15);

      // 5. MULTI-HEIGHT WATERFALLS & ELEVATED NATURAL ROCK POOLS
      const wfMat = new THREE.MeshPhysicalMaterial({
        map: this.textures.waterfallSurface,
        transparent: true,
        opacity: 0.88,
        roughness: 0.1,
        clearcoat: 0.85,
        side: THREE.DoubleSide,
      });
      const poolWaterMat = new THREE.MeshStandardMaterial({
        map: this.textures.lagoonSurface,
        bumpMap: this.textures.waterBump,
        bumpScale: 0.12,
        roughness: 0.08,
        metalness: 0.32,
        envMapIntensity: 1.5,
      });
      applyWaterSurfaceShader(poolWaterMat, this.shaderTimeUniform, {
        waveAmp: 0.08,
        waveFreq: 0.25,
        speed: 2.2,
        fresnelColor: 0xa7f3d0,
        fresnelStrength: 0.62,
        foamStrength: 0.28,
      });
      const foamMat = new THREE.MeshBasicMaterial({
        color: 0xe0f2fe,
        transparent: true,
        opacity: 0.65,
        side: THREE.DoubleSide,
      });

      const buildNaturalCliffPoolAndWaterfall = (
        wx: number,
        topY: number,
        poolY: number,
        wz: number,
        rotY: number,
        streamWidth: number,
        poolRadius: number,
        ruinSpout = false
      ) => {
        const wg = new THREE.Group();
        wg.position.set(wx, 0, wz);
        wg.rotation.y = rotY;

        const fallH = Math.max(4, topY - poolY + 0.6);
        // Jagged wet cliff backing behind waterfall
        const cliffL = new THREE.Mesh(this.createJaggedRockFormationGeometry(4.4, fallH + 4, wx * 0.3 + 1), cliffRockMat);
        cliffL.position.set(-streamWidth * 0.72, poolY + fallH * 0.45, -2.2);
        const cliffR = new THREE.Mesh(this.createJaggedRockFormationGeometry(4.4, fallH + 4, wx * 0.3 + 4), cliffRockMat);
        cliffR.position.set(streamWidth * 0.72, poolY + fallH * 0.45, -2.2);
        const cliffBack = new THREE.Mesh(this.createJaggedRockFormationGeometry(5.6, fallH + 5, wx * 0.3 + 7), cliffRockMat);
        cliffBack.position.set(0, poolY + fallH * 0.5, -4.4);
        wg.add(cliffL, cliffR, cliffBack);

        if (ruinSpout) {
          const spout = new THREE.Mesh(new THREE.BoxGeometry(streamWidth + 1.6, 1.4, 3.6), ruinStoneMat);
          spout.position.set(0, topY - 0.2, -1.2);
          wg.add(spout);
        }

        // Flowing Waterfall Ribbon
        const stream = new THREE.Mesh(new THREE.PlaneGeometry(streamWidth, fallH, 4, 8), wfMat);
        stream.position.set(0, poolY + fallH * 0.5 - 0.2, 0.35);
        stream.rotation.x = -0.08;
        wg.add(stream);

        // Elevated Natural Stone Basin + Reflective Turquoise Water Pool + Plunge Foam
        if (poolY > level.theme.hazardFloorY + 0.5) {
          const basinRim = new THREE.Mesh(
            new THREE.CylinderGeometry(poolRadius + 1.4, poolRadius + 2.2, 2.2, 14),
            cliffRockMat
          );
          basinRim.position.set(0, poolY - 1.15, 1.4);
          wg.add(basinRim);

          const poolDisc = new THREE.Mesh(new THREE.CircleGeometry(poolRadius, 22), poolWaterMat);
          poolDisc.rotation.x = -Math.PI / 2;
          poolDisc.position.set(0, poolY + 0.04, 1.4);
          wg.add(poolDisc);

          // Spillover cascade down to the lower river
          const spillH = poolY - level.theme.hazardFloorY + 0.4;
          const spill = new THREE.Mesh(new THREE.PlaneGeometry(streamWidth * 0.72, spillH, 3, 6), wfMat);
          spill.position.set(0, level.theme.hazardFloorY + spillH * 0.5, poolRadius + 1.1);
          spill.rotation.x = -0.1;
          wg.add(spill);
        }

        const foam = new THREE.Mesh(new THREE.RingGeometry(streamWidth * 0.35, streamWidth * 0.95, 22), foamMat);
        foam.rotation.x = -Math.PI / 2;
        foam.position.set(0, poolY + 0.14, 1.0);
        wg.add(foam);

        this.levelGroup.add(wg);
        this.templeWaterfallPools.push(new THREE.Vector3(wx, poolY, wz + 1.0));
      };

      // 5 Multi-Height Waterfalls & Terraced Natural Pools
      buildNaturalCliffPoolAndWaterfall(-24, 3.8, -4.6, -34, 0.55, 4.4, 5.2, true);
      buildNaturalCliffPoolAndWaterfall(-28, 12.5, -4.2, -64, 0.45, 5.6, 6.2, false);
      buildNaturalCliffPoolAndWaterfall(70, 9.5, -2.5, -62, -0.52, 4.6, 5.4, true);
      buildNaturalCliffPoolAndWaterfall(78, 13.0, level.theme.hazardFloorY, -94, -0.58, 5.8, 6.0, false);
      buildNaturalCliffPoolAndWaterfall(34, 17.5, level.theme.hazardFloorY, -126, 0.18, 4.8, 5.2, false);
      buildNaturalCliffPoolAndWaterfall(66, 17.5, level.theme.hazardFloorY, -126, -0.18, 4.8, 5.2, false);

      // 6. MULTI-SPECIES TROPICAL RAINFOREST (DENSE INSTANCED CANOPY CARPET + GIANT CEIBAS + CURVED PALMS)
      const canopyClusterGeo = this.createDisplacedRockGeometry(2.35, 3.7);
      const treeCount = 96;
      const bgTrunkGeo = new THREE.CylinderGeometry(0.42, 1.1, 12.5, 9);
      const bgRootGeo = new THREE.ConeGeometry(1.55, 3.2, 7);
      const bgCanopyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
      applyWindSwayShader(bgCanopyMat, this.shaderTimeUniform, 0.14, 1.5);

      const bgTrunks = new THREE.InstancedMesh(bgTrunkGeo, heroBarkMat, treeCount);
      const bgRoots = new THREE.InstancedMesh(bgRootGeo, heroBarkMat, treeCount);
      const bgCrownA = new THREE.InstancedMesh(canopyClusterGeo, bgCanopyMat, treeCount);
      const bgCrownB = new THREE.InstancedMesh(canopyClusterGeo, bgCanopyMat, treeCount);
      const bgCrownC = new THREE.InstancedMesh(canopyClusterGeo, bgCanopyMat, treeCount);

      for (let i = 0; i < treeCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 22 + ((i * 19) % 64);
        const z = 18 - ((i * 17) % 162);
        const x = (i % 3 === 0 ? 48 : 0) + side * dist;
        const y = -11.0 + (i % 5) * 1.45;
        const sc = 0.92 + (i % 4) * 0.25;

        dummy.position.set(x, y + 6.0 * sc, z);
        dummy.rotation.set(((i % 3) - 1) * 0.05, i * 0.9, ((i % 3) - 1) * 0.06);
        dummy.scale.set(sc, sc, sc);
        dummy.updateMatrix();
        bgTrunks.setMatrixAt(i, dummy.matrix);

        dummy.position.set(x, y + 1.4 * sc, z);
        dummy.rotation.set(0, i * 0.7, 0);
        dummy.scale.set(sc * 1.15, sc, sc * 1.15);
        dummy.updateMatrix();
        bgRoots.setMatrixAt(i, dummy.matrix);

        // 3 Overlapping Multi-Layer Foliage Crowns per Background Tree
        dummy.position.set(x, y + 11.0 * sc, z);
        dummy.rotation.set(0, i * 0.5, 0);
        dummy.scale.set(sc * 1.45, sc * 0.74, sc * 1.45);
        dummy.updateMatrix();
        bgCrownA.setMatrixAt(i, dummy.matrix);
        _color.setHex(i % 3 === 0 ? 0x1e4a16 : i % 3 === 1 ? 0x26581c : 0x2d6621);
        bgCrownA.setColorAt(i, _color);

        dummy.position.set(x + (i % 2 === 0 ? 1.1 : -1.1) * sc, y + 12.6 * sc, z - 0.6 * sc);
        dummy.rotation.set(0.1, i * 0.8, 0.05);
        dummy.scale.set(sc * 1.25, sc * 0.72, sc * 1.25);
        dummy.updateMatrix();
        bgCrownB.setMatrixAt(i, dummy.matrix);
        _color.setHex(i % 3 === 0 ? 0x357522 : i % 3 === 1 ? 0x458a2a : 0x3d7d26);
        bgCrownB.setColorAt(i, _color);

        dummy.position.set(x - (i % 2 === 0 ? 0.8 : -0.8) * sc, y + 14.2 * sc, z + 0.4 * sc);
        dummy.rotation.set(-0.08, i * 1.1, 0);
        dummy.scale.set(sc * 1.05, sc * 0.68, sc * 1.05);
        dummy.updateMatrix();
        bgCrownC.setMatrixAt(i, dummy.matrix);
        _color.setHex(i % 3 === 0 ? 0x5ca832 : i % 3 === 1 ? 0x6cb83a : 0x4f992b);
        bgCrownC.setColorAt(i, _color);
      }
      for (const im of [bgTrunks, bgRoots, bgCrownA, bgCrownB, bgCrownC]) {
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.computeBoundingSphere();
      }
      this.levelGroup.add(bgTrunks, bgRoots, bgCrownA, bgCrownB, bgCrownC);

      // Giant Hero Buttress-Rooted Ceiba Trees (12 monumental trees with 12-lobe multi-layer crowns & lianas)
      const heroTreeSpots: [number, number, number, number][] = [
        [-15, -4, -14, 1.18],
        [15, -4, -15, 1.12],
        [-16, -3, -32, 1.14],
        [14, -3, -46, 1.24],
        [36, -2, -46, 1.18],
        [34, 0, -68, 1.22],
        [66, 0, -72, 1.18],
        [35, 3, -96, 1.15],
        [-17, -6, -64, 1.2],
        [68, 1, -92, 1.16],
        [24, 3, -110, 1.22],
        [74, 4, -114, 1.2],
      ];

      const heroCrownCoords: THREE.Vector3[] = [];
      for (let idx = 0; idx < heroTreeSpots.length; idx++) {
        const [hx, hy, hz, sc] = heroTreeSpots[idx];
        const tg = new THREE.Group();
        tg.position.set(hx, hy, hz);
        tg.rotation.y = idx * 0.95;

        const island = new THREE.Mesh(
          this.createJaggedRockFormationGeometry(4.2 * sc, 5.2, idx + 0.7),
          [moundSideMat, moundTopMat, cliffRockMat]
        );
        island.position.y = -2.2;
        tg.add(island);

        const trunkCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -0.4, 0),
          new THREE.Vector3(0.5 * sc, 3.4 * sc, -0.28 * sc),
          new THREE.Vector3(-0.38 * sc, 7.0 * sc, 0.34 * sc),
          new THREE.Vector3(0.22 * sc, 10.8 * sc, 0),
        ]);
        tg.add(new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 14, 0.96 * sc, 9, false), heroBarkMat));

        // 5 Gnarled Buttress Roots
        for (let r = 0; r < 5; r++) {
          const ang = (r / 5) * Math.PI * 2 + 0.35;
          const rootCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(Math.cos(ang) * 0.45 * sc, 2.5 * sc, Math.sin(ang) * 0.45 * sc),
            new THREE.Vector3(Math.cos(ang) * 1.7 * sc, 0.8 * sc, Math.sin(ang) * 1.7 * sc),
            new THREE.Vector3(Math.cos(ang) * 3.1 * sc, -0.2 * sc, Math.sin(ang) * 3.1 * sc),
          ]);
          tg.add(new THREE.Mesh(new THREE.TubeGeometry(rootCurve, 8, 0.34 * sc, 7, false), heroBarkMat));
        }

        // 4 Major Boughs + Multi-Tier Leaf Clusters (12 overlapping puffs per tree!) + Hanging Moss Vines
        for (let b = 0; b < 4; b++) {
          const bAng = (b / 4) * Math.PI * 2 + idx * 0.45;
          const bx = Math.cos(bAng) * 3.5 * sc;
          const bz = Math.sin(bAng) * 3.5 * sc;
          const branchCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 9.0 * sc, 0),
            new THREE.Vector3(bx * 0.55, 10.6 * sc, bz * 0.55),
            new THREE.Vector3(bx, 11.9 * sc, bz),
          ]);
          tg.add(new THREE.Mesh(new THREE.TubeGeometry(branchCurve, 6, 0.38 * sc, 6, false), heroBarkMat));

          for (let c = 0; c < 3; c++) {
            const cAng = bAng + (c - 1) * 0.72;
            const lobe = new THREE.Mesh(
              canopyClusterGeo,
              c === 0 ? leafSunMat : c === 1 ? leafMidMat : leafDeepMat
            );
            lobe.scale.set(sc * (1.1 - c * 0.12), sc * 0.68, sc * (1.1 - c * 0.12));
            lobe.position.set(
              bx + Math.cos(cAng) * 1.25 * sc,
              (12.8 - c * 0.85) * sc,
              bz + Math.sin(cAng) * 1.25 * sc
            );
            lobe.rotation.y = cAng;
            tg.add(lobe);
          }

          const tendrilCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(bx * 1.08, 11.4 * sc, bz * 1.08),
            new THREE.Vector3(bx * 1.14, 8.6 * sc, bz * 1.14),
            new THREE.Vector3(bx * 1.08, 5.6 * sc, bz * 1.08),
          ]);
          tg.add(new THREE.Mesh(new THREE.TubeGeometry(tendrilCurve, 6, 0.065 * sc, 4, false), lianaMat));
        }

        const topCrown = new THREE.Mesh(canopyClusterGeo, leafSunMat);
        topCrown.scale.set(1.52 * sc, 0.76 * sc, 1.52 * sc);
        topCrown.position.set(0, 14.3 * sc, 0);
        tg.add(topCrown);

        this.levelGroup.add(tg);
        heroCrownCoords.push(new THREE.Vector3(hx, hy + 11.8 * sc, hz));
      }

      // Draped Natural Liana Vines arcing between adjacent hero trees
      const vinePairs: [number, number][] = [
        [0, 1],
        [0, 2],
        [3, 4],
        [5, 6],
        [8, 2],
        [7, 9],
      ];
      for (const [a, b] of vinePairs) {
        const pA = heroCrownCoords[a];
        const pB = heroCrownCoords[b];
        if (!pA || !pB) continue;
        const mid = pA.clone().lerp(pB, 0.5);
        mid.y -= 3.9;
        const vineCurve = new THREE.CatmullRomCurve3([pA, mid, pB]);
        this.levelGroup.add(new THREE.Mesh(new THREE.TubeGeometry(vineCurve, 14, 0.11, 5, false), lianaMat));
      }

      // Graceful Curved Tropical Coconut Palms along Riverbanks & Cliff Terraces (14 palms)
      const palmFrondGeo = this.createCurvedLeafGeometry(4.2, 1.35);
      const palmSpots: [number, number, number, number, number][] = [
        [-11, -11.4, -4, 0.95, 0.4],
        [10, -11.4, -7, 1.05, -0.5],
        [-18, -11.4, -24, 1.12, 0.7],
        [17, -11.4, -26, 0.98, -0.8],
        [24, -11.4, -52, 1.08, 0.3],
        [33, -11.4, -72, 1.15, -0.4],
        [19, -11.4, -86, 1.02, 0.6],
        [-19, -4.6, -34, 0.92, 0.9],
        [65, -2.5, -60, 0.96, -0.9],
        [34, 11.2, -124, 1.05, 0.5],
        [66, 11.2, -124, 1.05, -0.5],
        [-16, -11.4, -48, 1.08, 1.1],
        [68, -11.4, -40, 1.1, -1.1],
        [44, 18.2, -132, 0.88, 0.3],
      ];
      const coconutMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.78 });
      for (let p = 0; p < palmSpots.length; p++) {
        const [px, py, pz, sc, lean] = palmSpots[p];
        const pg = new THREE.Group();
        pg.position.set(px, py, pz);
        pg.rotation.y = p * 0.95;

        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -0.4, 0),
          new THREE.Vector3(lean * 1.4 * sc, 4.2 * sc, 0.3 * sc),
          new THREE.Vector3(lean * 2.5 * sc, 8.6 * sc, -0.2 * sc),
          new THREE.Vector3(lean * 2.8 * sc, 11.4 * sc, 0),
        ]);
        pg.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 12, 0.36 * sc, 7, false), palmBarkMat));

        const crownPos = new THREE.Vector3(lean * 2.8 * sc, 11.4 * sc, 0);
        for (let c = 0; c < 3; c++) {
          const ca = (c / 3) * Math.PI * 2;
          const nut = new THREE.Mesh(new THREE.SphereGeometry(0.26 * sc, 8, 6), coconutMat);
          nut.position.set(crownPos.x + Math.cos(ca) * 0.35 * sc, crownPos.y - 0.32 * sc, crownPos.z + Math.sin(ca) * 0.35 * sc);
          pg.add(nut);
        }
        for (let f = 0; f < 9; f++) {
          const fAng = (f / 9) * Math.PI * 2 + p * 0.3;
          const fg = new THREE.Group();
          fg.position.copy(crownPos);
          fg.rotation.y = fAng;
          const frond = new THREE.Mesh(palmFrondGeo, leafVeinedMat);
          frond.scale.setScalar(sc);
          frond.rotation.x = 1.05 + (f % 2) * 0.22;
          fg.add(frond);
          pg.add(fg);
        }
        this.levelGroup.add(pg);
      }

      // 7. NATURAL MOSSY BOULDERS, CURVED ARCHED FERNS, BROAD-LEAF PLANTS & TROPICAL FLOWERS
      const rockSpots: [number, number, number, number][] = [
        [-13.2, -3.7, -12.5, 1.1],
        [13.4, -3.7, -13.8, 1.0],
        [-4.2, 1.0, 4.2, 0.62],
        [4.2, 1.0, 4.1, 0.58],
        [-14.2, -2.7, -30.5, 0.95],
        [-3.4, 2.2, -18.5, 0.58],
        [3.4, 2.2, -25.2, 0.56],
        [15.4, -2.7, -44.2, 1.05],
        [34.2, -1.7, -44.6, 1.0],
        [46.2, 6.2, -46.4, 0.62],
        [53.6, 7.4, -76.2, 0.65],
        [41.2, 12.4, -101.2, 0.72],
        [58.8, 12.4, -101.2, 0.72],
        [41.2, 12.4, -116.5, 0.72],
        [58.8, 12.4, -116.5, 0.72],
        [-21, -4.5, -31, 0.85],
        [67, -2.4, -59, 0.85],
      ];

      const rockGeo = this.createDisplacedRockGeometry(0.95, 7.3);
      const rockMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleRuinStone,
        bumpMap: this.textures.jungleRuinBump,
        bumpScale: 0.16,
        roughness: 0.9,
      });
      const mossCapGeo = this.createDisplacedRockGeometry(0.75, 4.9);
      const rocksInst = new THREE.InstancedMesh(rockGeo, rockMat, rockSpots.length);
      const mossInst = new THREE.InstancedMesh(mossCapGeo, moundTopMat, rockSpots.length);

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

      // Curved Arched Multi-Blade Ferns & Tropical Hibiscus/Orchid Clusters
      const fernBladeGeo = this.createCurvedLeafGeometry(1.75, 0.62);
      const totalLeaves = rockSpots.length * 7;
      const leavesInst = new THREE.InstancedMesh(fernBladeGeo, leafVeinedMat, totalLeaves);
      const flowerPetalGeo = new THREE.ConeGeometry(0.24, 0.32, 6);
      const flowerMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x3f1020,
        emissiveIntensity: 0.35,
        roughness: 0.42,
      });
      const flowerInst = new THREE.InstancedMesh(flowerPetalGeo, flowerMat, rockSpots.length * 2);
      const flowerColors = [0xf43f5e, 0xfacc15, 0xe879f9, 0xfb923c];

      let lIdx = 0;
      let flwIdx = 0;
      for (let i = 0; i < rockSpots.length; i++) {
        const [rx, ry, rz, rs] = rockSpots[i];
        const px = rx + (i % 2 === 0 ? 0.92 : -0.92) * rs;
        const pz = rz + 0.42 * rs;
        for (let f = 0; f < 7; f++) {
          const ang = (f / 7) * Math.PI * 2 + i * 0.5;
          dummy.position.set(px + Math.cos(ang) * 0.25 * rs, ry + 0.25 * rs, pz + Math.sin(ang) * 0.25 * rs);
          dummy.rotation.set(0.68, ang, 0);
          dummy.scale.set(rs, rs * (0.85 + (f % 3) * 0.16), rs);
          dummy.updateMatrix();
          leavesInst.setMatrixAt(lIdx, dummy.matrix);
          _color.setHex(f % 3 === 0 ? 0x84cc16 : f % 3 === 1 ? 0x4ade80 : 0x22c55e);
          leavesInst.setColorAt(lIdx, _color);
          lIdx++;
        }

        for (let fl = 0; fl < 2; fl++) {
          dummy.position.set(px + (fl === 0 ? 0.28 : -0.3) * rs, ry + 0.85 * rs, pz + (fl === 0 ? 0.25 : -0.22) * rs);
          dummy.rotation.set(Math.PI, i + fl, 0.2);
          dummy.scale.setScalar(rs * 1.15);
          dummy.updateMatrix();
          flowerInst.setMatrixAt(flwIdx, dummy.matrix);
          _color.setHex(flowerColors[(i + fl) % flowerColors.length]);
          flowerInst.setColorAt(flwIdx, _color);
          flwIdx++;
        }
      }
      for (const im of [leavesInst, flowerInst]) {
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.computeBoundingSphere();
      }
      this.levelGroup.add(leavesInst, flowerInst);

      // Floating Water Lily Pads & Pink Lotus Blooms across the Emerald River
      const padGeo = new THREE.CylinderGeometry(1.15, 1.15, 0.08, 12);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.7 });
      const lotusGeo = new THREE.ConeGeometry(0.32, 0.36, 6);
      const lotusMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xdb2777, emissiveIntensity: 0.42 });
      const padSpots: [number, number][] = [
        [-6, -6], [7, -14], [-10, -24], [12, -32], [20, -48],
        [34, -56], [30, -76], [24, -92], [64, -36], [70, -82],
      ];
      const padInst = new THREE.InstancedMesh(padGeo, padMat, padSpots.length);
      const lotusInst = new THREE.InstancedMesh(lotusGeo, lotusMat, padSpots.length);
      for (let i = 0; i < padSpots.length; i++) {
        const [lx, lz] = padSpots[i];
        const sc = 0.82 + (i % 3) * 0.24;
        dummy.position.set(lx, level.theme.hazardFloorY + 0.06, lz);
        dummy.rotation.set(0, i * 0.85, 0);
        dummy.scale.set(sc, 1, sc);
        dummy.updateMatrix();
        padInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(lx + 0.15, level.theme.hazardFloorY + 0.24, lz);
        dummy.rotation.set(Math.PI, i, 0);
        dummy.scale.setScalar(sc);
        dummy.updateMatrix();
        lotusInst.setMatrixAt(i, dummy.matrix);
      }
      padInst.instanceMatrix.needsUpdate = true;
      lotusInst.instanceMatrix.needsUpdate = true;
      padInst.computeBoundingSphere();
      lotusInst.computeBoundingSphere();
      this.levelGroup.add(padInst, lotusInst);

      // 8. VOLUMETRIC GOLDEN SUNBEAMS, LOW VALLEY MIST, FALLING CURVED LEAVES & FIREFLIES
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: this.isSoftwareGl ? 0.048 : 0.072,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const beamGeo = new THREE.ConeGeometry(5.2, 38, 12, 1, true);
      const beamCoords: [number, number, number][] = [
        [0, 14, -4],
        [-6, 15, -20],
        [24, 16, -38],
        [50, 19, -52],
        [50, 22, -88],
        [50, 26, -112],
      ];
      for (const [bx, by, bz] of beamCoords) {
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(bx, by, bz);
        beam.rotation.set(0.18, 0, -0.32);
        this.levelGroup.add(beam);
      }

      // Soft Valley Atmospheric Mist Veils in Deep Ravine Zones
      const mistPlaneMat = new THREE.MeshBasicMaterial({
        color: 0xd1fae5,
        transparent: true,
        opacity: this.isSoftwareGl ? 0.08 : 0.12,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      for (const [mx, my, mz] of [
        [-14, -8.5, -52],
        [26, -8.0, -76],
        [52, -7.5, -108],
      ] as [number, number, number][]) {
        const mist = new THREE.Mesh(new THREE.PlaneGeometry(58, 42), mistPlaneMat);
        mist.rotation.x = -Math.PI / 2;
        mist.position.set(mx, my, mz);
        this.levelGroup.add(mist);
      }

      // Falling Curved Fluttering Rainforest Leaves (animated in tick via templeLeafMesh)
      const leafCount = this.isSoftwareGl ? 28 : 68;
      const fallLeafGeo = this.createCurvedLeafGeometry(0.56, 0.28);
      const fallLeafMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleLeafTex,
        color: 0xffffff,
        roughness: 0.62,
        side: THREE.DoubleSide,
      });
      const fallLeaves = new THREE.InstancedMesh(fallLeafGeo, fallLeafMat, leafCount);
      fallLeaves.frustumCulled = false;
      fallLeaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.templeLeafStates = [];
      for (let i = 0; i < leafCount; i++) {
        this.templeLeafStates.push({
          x: -18 + Math.random() * 88,
          y: Math.random() * 24 + 2,
          z: 8 - Math.random() * 135,
          fallSpeed: 0.9 + Math.random() * 0.95,
          swayPhase: Math.random() * Math.PI * 2,
          rotSpeed: 1.4 + Math.random() * 2.1,
        });
        _color.setHex(i % 3 === 0 ? 0x84cc16 : i % 3 === 1 ? 0x4ade80 : 0xfacc15);
        fallLeaves.setColorAt(i, _color);
      }
      if (fallLeaves.instanceColor) fallLeaves.instanceColor.needsUpdate = true;
      fallLeaves.computeBoundingSphere();
      this.templeLeafMesh = fallLeaves;
      this.levelGroup.add(fallLeaves);

      // Luminous Jungle Fireflies (animated in tick via templeFireflyTime)
      const ffCount = this.isSoftwareGl ? 36 : 86;
      const ffPos = new Float32Array(ffCount * 3);
      const ffPhase = new Float32Array(ffCount);
      for (let i = 0; i < ffCount; i++) {
        ffPos[i * 3] = -20 + Math.random() * 92;
        ffPos[i * 3 + 1] = level.theme.hazardFloorY + 4 + Math.random() * 22;
        ffPos[i * 3 + 2] = 6 - Math.random() * 130;
        ffPhase[i] = Math.random() * Math.PI * 2;
      }
      const ffGeo = new THREE.BufferGeometry();
      ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
      ffGeo.setAttribute('aPhase', new THREE.BufferAttribute(ffPhase, 1));
      const ffTime = { value: 0 };
      this.templeFireflyTime = ffTime;
      const ffMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: ffTime,
        },
        vertexShader: `
          attribute float aPhase;
          uniform float uTime;
          varying float vGlow;
          void main() {
            vec3 p = position;
            p.x += sin(uTime * 0.95 + aPhase) * 1.45;
            p.y += sin(uTime * 1.55 + aPhase * 1.7) * 0.9;
            p.z += cos(uTime * 0.85 + aPhase * 1.2) * 1.45;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = clamp(128.0 / max(1.0, -mv.z), 3.0, 13.0);
            vGlow = 0.4 + 0.6 * sin(uTime * 3.1 + aPhase * 2.0);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          varying float vGlow;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float a = smoothstep(0.5, 0.05, d) * vGlow;
            gl_FragColor = vec4(0.68, 1.0, 0.48, a * 0.92);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const fireflies = new THREE.Points(ffGeo, ffMat);
      fireflies.frustumCulled = false;
      this.levelGroup.add(fireflies);
    } else if (biome === 'desert') {
      // Distant sunset canyon mesas & colossal rolling sand dune horizon rings
      this.addHorizonMountainRing(0, -145, level.theme.hazardFloorY - 1.5, 138, 240, 44, 0x9c4c1b, 0xf2a556, 3.3, 0.9);
      this.addHorizonMountainRing(0, -145, level.theme.hazardFloorY - 1.0, 74, 136, 18, 0xb86228, 0xf7be72, 2.1, 0.92);

      // Shared Desert PBR Materials
      const duneSurfaceMat = new THREE.MeshStandardMaterial({
        map: this.textures.desertSandstone,
        bumpMap: this.textures.sandBump,
        bumpScale: 0.22,
        roughness: 0.88,
        metalness: 0.03,
      });
      const sandstoneCliffMat = new THREE.MeshStandardMaterial({
        map: this.textures.desertSide,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.24,
        roughness: 0.92,
      });
      const ruinStoneMat = new THREE.MeshStandardMaterial({
        map: this.textures.desertRuinStone,
        bumpMap: this.textures.desertRuinBump,
        bumpScale: 0.2,
        roughness: 0.86,
      });
      const darkRecessMat = new THREE.MeshStandardMaterial({
        color: 0x3b1f10,
        roughness: 0.95,
        metalness: 0.04,
      });
      const brassMat = new THREE.MeshStandardMaterial({
        map: this.textures.goldTrim,
        color: 0xf59e0b,
        emissive: 0x92400e,
        emissiveIntensity: 0.45,
        metalness: 0.85,
        roughness: 0.22,
      });
      const sunGlowMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 2.1,
        roughness: 0.2,
      });
      const oasisRimMat = new THREE.MeshStandardMaterial({
        map: this.textures.desertRuinStone,
        bumpMap: this.textures.desertRuinBump,
        bumpScale: 0.16,
        color: 0xdcb480,
        roughness: 0.84,
      });

      // 1. Sweeping Asymmetric Sculpted Barchan Sand Dune Terrain flanking the canyon & flight corridor
      const duneGeoL = this.createDuneFieldGeometry(98, 370, 26, 56, 1.4);
      const duneLeft = new THREE.Mesh(duneGeoL, duneSurfaceMat);
      duneLeft.position.set(-64, level.theme.hazardFloorY - 0.5, -145);
      duneLeft.receiveShadow = true;
      this.levelGroup.add(duneLeft);

      const duneGeoR = this.createDuneFieldGeometry(98, 370, 26, 56, 4.7);
      const duneRight = new THREE.Mesh(duneGeoR, duneSurfaceMat);
      duneRight.position.set(64, level.theme.hazardFloorY - 0.5, -145);
      duneRight.rotation.y = Math.PI;
      duneRight.receiveShadow = true;
      this.levelGroup.add(duneRight);

      // Far sunset desert canyon dune backdrop behind Goal Sanctuary (z = -310..-370)
      const farDuneGeo = this.createDuneFieldGeometry(180, 74, 24, 14, 7.2);
      const farDune = new THREE.Mesh(farDuneGeo, duneSurfaceMat);
      farDune.position.set(0, level.theme.hazardFloorY + 2.5, -338);
      farDune.receiveShadow = true;
      this.levelGroup.add(farDune);

      // 2. Monumental Muralla 2D Sandstone Fortress Wall (x = -5.8, spanning z = -7..-57 opposite the +X camera)
      const murallaGroup = new THREE.Group();
      const wallBase = new THREE.Mesh(new THREE.BoxGeometry(3.2, 22, 52), ruinStoneMat);
      wallBase.position.set(-6.4, 0.5, -32);
      wallBase.receiveShadow = true;
      murallaGroup.add(wallBase);

      // Stepped battered sandstone plinth & carved upper frieze along the 2D wall
      const lowerSlope = new THREE.Mesh(new THREE.BoxGeometry(2.6, 10, 52.4), sandstoneCliffMat);
      lowerSlope.position.set(-4.6, -6.2, -32);
      murallaGroup.add(lowerSlope);

      const corniceLedge = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.85, 52.8), ruinStoneMat);
      corniceLedge.position.set(-6.1, 11.2, -32);
      murallaGroup.add(corniceLedge);

      // Buttress pilasters, deeply shadowed arched interior alcoves, warm glowing braziers & crumbling battlements
      for (let k = 0; k < 6; k++) {
        const bz = -10.5 - k * 8.4;
        const pilaster = new THREE.Mesh(new THREE.BoxGeometry(1.5, 22.8, 1.9), ruinStoneMat);
        pilaster.position.set(-4.7, 0.6, bz);
        pilaster.castShadow = !this.isSoftwareGl;
        murallaGroup.add(pilaster);

        // Deeply recessed shadowy temple alcove (interior/exterior light contrast)
        if (k < 5) {
          const az = bz - 4.2;
          const alcove = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.4, 3.8), darkRecessMat);
          alcove.position.set(-4.95, 4.4, az);
          murallaGroup.add(alcove);

          const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 4.8), ruinStoneMat);
          lintel.position.set(-4.7, 7.45, az);
          murallaGroup.add(lintel);

          const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.18, 0.55, 8), brassMat);
          brazier.position.set(-4.35, 2.2, az);
          const ember = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), sunGlowMat);
          ember.position.set(-4.35, 2.75, az);
          murallaGroup.add(brazier, ember);

          // Collapsing / trembling crenellation stone block along upper parapet
          const merlon = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 2.2), ruinStoneMat);
          merlon.position.set(-5.3, 12.2, az);
          merlon.rotation.z = (k % 2 === 0 ? 1 : -1) * 0.06;
          murallaGroup.add(merlon);
          this.desertCollapsingMasonry.push({
            mesh: merlon,
            basePos: merlon.position.clone(),
            phase: k * 1.4,
            period: 5.5 + (k % 3) * 1.6,
          });
        }
      }
      this.levelGroup.add(murallaGroup);

      // 3. Stratified Canyon Cliffs, Hoodoos & Natural Sandstone Rock Arches along flight corridor
      const canyonButteSpecs: [number, number, number, number, number][] = [
        [-24, -10.5, -18, 5.5, 20],
        [-27, -10.5, -44, 6.2, 23],
        [24, -10.5, -26, 5.0, 15],
        [28, -10.5, -58, 6.4, 21],
        [-23, -10.5, -86, 6.8, 25],
        [24, -10.5, -98, 6.4, 24],
        [-25, -10.5, -124, 7.2, 26],
        [24, -10.5, -138, 6.5, 23],
        [-24, -10.5, -168, 7.4, 27],
        [25, -10.5, -182, 6.9, 25],
        [-23, -10.5, -210, 6.6, 24],
        [25, -10.5, -226, 7.0, 26],
        [-24, -10.5, -254, 6.8, 24],
        [34, -10.5, -266, 7.2, 25],
        [-22, -10.5, -288, 7.5, 28],
        [23, -10.5, -288, 7.5, 28],
      ];
      for (let i = 0; i < canyonButteSpecs.length; i++) {
        const [bx, by, bz, rad, bh] = canyonButteSpecs[i];
        const geo = this.createJaggedRockFormationGeometry(rad, bh, i * 1.9 + 0.7);
        const mesh = new THREE.Mesh(geo, sandstoneCliffMat);
        mesh.position.set(bx, by + bh * 0.44, bz);
        mesh.receiveShadow = true;
        mesh.castShadow = !this.isSoftwareGl;
        this.levelGroup.add(mesh);

        // Stratified flat wind-eroded sandstone caprock ledge
        const cap = new THREE.Mesh(this.createJaggedRockFormationGeometry(rad * 0.86, 2.1, i * 2.4), duneSurfaceMat);
        cap.position.set(bx, by + bh * 0.88, bz);
        this.levelGroup.add(cap);
      }

      // Towering Natural Sandstone Rock Arches spanning high across the flight canyon (y >= 17 clearance!)
      const archConfigs: [number, number, number, number, number][] = [
        [0, -10.5, -106, 36, 27],
        [0, -10.5, -174, 38, 29],
        [0, -10.5, -234, 34, 26],
      ];
      for (let a = 0; a < archConfigs.length; a++) {
        const [ax, ay, az, span, archH] = archConfigs[a];
        const archGeo = this.createDesertRockArchGeometry(span, archH, 2.6, a * 2.3 + 1.1);
        const archMesh = new THREE.Mesh(archGeo, sandstoneCliffMat);
        archMesh.position.set(ax, ay, az);
        archMesh.rotation.y = (a % 2 === 0 ? 1 : -1) * 0.14;
        archMesh.castShadow = !this.isSoftwareGl;
        archMesh.receiveShadow = true;
        this.levelGroup.add(archMesh);
      }

      // 4. Stepped Sun Temples & Half-Buried Ancient Desert City (replacing simple cones!)
      const buildSteppedSunTemple = (
        cx: number,
        cy: number,
        cz: number,
        scale: number,
        tiltZ: number,
        tiltX: number,
        seedVal: number
      ) => {
        const tg = new THREE.Group();
        tg.position.set(cx, cy, cz);
        tg.rotation.set(tiltX, seedVal * 0.5, tiltZ);

        // 4 stepped carved sandstone terraces
        for (let t = 0; t < 4; t++) {
          const tw = (18 - t * 3.8) * scale;
          const th = 3.2 * scale;
          const tier = new THREE.Mesh(new THREE.BoxGeometry(tw, th, tw * 0.92), ruinStoneMat);
          tier.position.y = t * th * 0.95 + th * 0.5;
          tier.castShadow = !this.isSoftwareGl;
          tier.receiveShadow = true;
          tg.add(tier);
        }

        // Shadowed interior sanctuary doorway + glowing sun shrine chamber
        const portalFrame = new THREE.Mesh(new THREE.BoxGeometry(5.6 * scale, 5.4 * scale, 2.4 * scale), ruinStoneMat);
        portalFrame.position.set(0, 2.7 * scale, 8.6 * scale);
        const doorwayVoid = new THREE.Mesh(new THREE.BoxGeometry(3.1 * scale, 4.0 * scale, 2.7 * scale), darkRecessMat);
        doorwayVoid.position.set(0, 2.0 * scale, 8.7 * scale);
        const innerBrazier = new THREE.Mesh(new THREE.OctahedronGeometry(0.65 * scale, 0), sunGlowMat);
        innerBrazier.position.set(0, 2.4 * scale, 8.2 * scale);
        tg.add(portalFrame, doorwayVoid, innerBrazier);

        // Summit gilded electrum sun-altar & flanking mini obelisks
        const altar = new THREE.Mesh(new THREE.CylinderGeometry(1.4 * scale, 2.2 * scale, 2.1 * scale, 4), brassMat);
        altar.position.y = 13.0 * scale;
        altar.rotation.y = Math.PI / 4;
        tg.add(altar);

        for (const sx of [-1, 1]) {
          const obShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * scale, 0.78 * scale, 6.2 * scale, 4), ruinStoneMat);
          obShaft.position.set(sx * 7.8 * scale, 3.1 * scale, 9.2 * scale);
          obShaft.rotation.y = Math.PI / 4;
          const obTip = new THREE.Mesh(new THREE.ConeGeometry(0.55 * scale, 1.2 * scale, 4), brassMat);
          obTip.position.set(sx * 7.8 * scale, 6.7 * scale, 9.2 * scale);
          obTip.rotation.y = Math.PI / 4;
          tg.add(obShaft, obTip);
        }

        this.levelGroup.add(tg);
      };

      const templeSpots: [number, number, number, number, number, number, number][] = [
        [-42, -10.5, -36, 1.15, 0.08, -0.04, 0.4],
        [44, -10.5, -62, 1.05, -0.1, 0.05, 1.2],
        [-48, -10.5, -120, 1.38, 0.14, 0.06, 2.1],
        [46, -10.5, -162, 1.25, -0.12, -0.05, 2.9],
        [-44, -10.5, -220, 1.3, 0.09, 0.04, 3.7],
        [-30, -10.5, -315, 1.65, 0.0, 0.0, 0.2],
        [34, -10.5, -318, 1.55, 0.0, 0.0, 5.9],
      ];
      for (const [tx, ty, tz, sc, rz, rx, sd] of templeSpots) {
        buildSteppedSunTemple(tx, ty, tz, sc, rz, rx, sd);
      }

      // Half-buried ancient sandstone city ruins (tilted colonnades, watchtowers & fractured columns)
      const buriedRuins: [number, number, number, number, number][] = [
        [-20, -9.2, -72, 1.0, 0.18],
        [19, -9.2, -112, 1.1, -0.16],
        [-21, -9.2, -155, 0.95, 0.14],
        [20, -9.2, -196, 1.05, -0.15],
        [-20, -9.2, -242, 1.15, 0.12],
      ];
      for (let i = 0; i < buriedRuins.length; i++) {
        const [rx, ry, rz, sc, tilt] = buriedRuins[i];
        const cg = new THREE.Group();
        cg.position.set(rx, ry, rz);
        cg.rotation.set(tilt * 0.5, i * 0.85, tilt);

        const courtyard = new THREE.Mesh(new THREE.BoxGeometry(9.5 * sc, 2.8 * sc, 9.5 * sc), ruinStoneMat);
        courtyard.position.y = 1.0 * sc;
        const tower = new THREE.Mesh(new THREE.BoxGeometry(3.8 * sc, 7.6 * sc, 3.8 * sc), ruinStoneMat);
        tower.position.set(-2.2 * sc, 3.8 * sc, -2.0 * sc);
        const towerVoid = new THREE.Mesh(new THREE.BoxGeometry(1.8 * sc, 3.4 * sc, 4.0 * sc), darkRecessMat);
        towerVoid.position.set(-2.2 * sc, 3.0 * sc, -2.0 * sc);
        cg.add(courtyard, tower, towerVoid);

        for (let c = 0; c < 3; c++) {
          const colH = (4.6 - (c % 2) * 1.4) * sc;
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.45 * sc, 0.54 * sc, colH, 10), ruinStoneMat);
          col.position.set(2.4 * sc, 2.0 * sc + colH * 0.5, (-2.6 + c * 2.6) * sc);
          cg.add(col);
        }
        // Fallen fractured column drum resting on drifted sand
        const fallenDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.46 * sc, 0.5 * sc, 3.2 * sc, 10), ruinStoneMat);
        fallenDrum.position.set(0.4 * sc, 2.7 * sc, 2.2 * sc);
        fallenDrum.rotation.set(0.18, 0.6, Math.PI / 2 - 0.15);
        cg.add(fallenDrum);

        this.levelGroup.add(cg);
      }

      // 5. Monumental Sun Gates & Astrolabe Mechanisms at Launchpad (z = -64) & Goal Sanctuary (z = -290)
      const buildMonumentalSunGate = (gx: number, gy: number, gz: number, span: number, height: number, hasSanctuary: boolean) => {
        const gg = new THREE.Group();
        gg.position.set(gx, gy, gz);
        const halfSpan = span * 0.5;

        for (const sx of [-1, 1]) {
          const pylon = new THREE.Mesh(new THREE.BoxGeometry(2.6, height, 3.2), ruinStoneMat);
          pylon.position.set(sx * halfSpan, height * 0.45, 0);
          pylon.castShadow = !this.isSoftwareGl;
          gg.add(pylon);

          const basePlinth = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.6, 4.0), sandstoneCliffMat);
          basePlinth.position.set(sx * halfSpan, 0.4, 0);
          gg.add(basePlinth);

          const obCap = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.6, 4), brassMat);
          obCap.position.set(sx * halfSpan, height * 0.95 + 1.3, 0);
          obCap.rotation.y = Math.PI / 4;
          gg.add(obCap);

          const brazierLight = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), sunGlowMat);
          brazierLight.position.set(sx * (halfSpan - 1.5), 2.5, 1.3);
          gg.add(brazierLight);
        }

        // Massive carved sandstone lintel beam + spinning golden astrolabe solar ring
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(span + 4.2, 2.1, 3.4), ruinStoneMat);
        lintel.position.set(0, height * 0.92, 0);
        lintel.castShadow = !this.isSoftwareGl;
        gg.add(lintel);

        const crownSun = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.24, 10, 28), brassMat);
        crownSun.position.set(0, height * 0.92 + 2.8, 0);
        const innerRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.14, 8, 22), sunGlowMat);
        crownSun.add(innerRing);
        gg.add(crownSun);
        this.desertMechanismSpinners.push(crownSun);

        if (hasSanctuary) {
          // Deep shaded temple sanctuary behind the Goal Portal
          const sanctuaryBack = new THREE.Mesh(new THREE.BoxGeometry(span + 1.2, height * 0.85, 4.5), ruinStoneMat);
          sanctuaryBack.position.set(0, height * 0.4, -4.6);
          const innerShadow = new THREE.Mesh(new THREE.BoxGeometry(span * 0.55, height * 0.6, 2.2), darkRecessMat);
          innerShadow.position.set(0, height * 0.3, -2.6);
          gg.add(sanctuaryBack, innerShadow);
        }

        this.levelGroup.add(gg);
      };

      buildMonumentalSunGate(0, 4.0, -70.4, 11.6, 14.5, false);
      buildMonumentalSunGate(0, 9.0, -290.5, 11.8, 12.2, true);

      // 6. Crystal-Clear Desert Oasis Lagoons (Secret Oasis Canyon Basin & Mid-Canyon Oasis)
      const oasisWaterMat = new THREE.MeshPhysicalMaterial({
        map: this.textures.lagoonSurface,
        bumpMap: this.textures.waterBump,
        bumpScale: 0.1,
        color: 0x14b8a6,
        roughness: 0.06,
        metalness: 0.26,
        clearcoat: 1.0,
        envMapIntensity: 1.75,
        transparent: true,
        opacity: 0.92,
      });
      applyWaterSurfaceShader(oasisWaterMat, this.shaderTimeUniform, {
        waveAmp: 0.08,
        waveFreq: 0.26,
        speed: 1.8,
        fresnelColor: 0x99f6e4,
        fresnelStrength: 0.62,
        foamStrength: 0.24,
      });

      const oasisSpots: [number, number, number, number][] = [
        [24, -10.35, -264, 11.5],
        [-27, -10.35, -148, 9.8],
      ];
      for (let o = 0; o < oasisSpots.length; o++) {
        const [ox, oy, oz, rad] = oasisSpots[o];
        const og = new THREE.Group();
        og.position.set(ox, oy, oz);

        // Submerged golden-sand pool floor
        const bed = new THREE.Mesh(new THREE.CircleGeometry(rad, 28), duneSurfaceMat);
        bed.rotation.x = -Math.PI / 2;
        bed.position.y = -0.35;
        og.add(bed);

        // Crystal-clear reflective turquoise water surface
        const pool = new THREE.Mesh(new THREE.CircleGeometry(rad * 0.96, 32), oasisWaterMat);
        pool.rotation.x = -Math.PI / 2;
        pool.position.y = 0.22;
        og.add(pool);

        // Natural sandstone boulder shoreline rim
        for (let b = 0; b < 16; b++) {
          const ang = (b / 16) * Math.PI * 2 + o * 0.4;
          const dist = rad * (0.94 + (b % 3) * 0.07);
          const boulder = new THREE.Mesh(this.createDisplacedRockGeometry(1.1 + (b % 3) * 0.35, b + o * 5), oasisRimMat);
          boulder.scale.set(1.3, 0.55, 1.0);
          boulder.position.set(Math.cos(ang) * dist, 0.15, Math.sin(ang) * dist);
          boulder.rotation.y = ang;
          og.add(boulder);
        }
        this.levelGroup.add(og);
      }

      // 7. Curved Wind-Swayed Desert Date Palms (NO cone fronds — arched 3D curved botanical fronds!)
      const palmTrunkMat = new THREE.MeshStandardMaterial({
        map: this.textures.barkTexture,
        bumpMap: this.textures.barkBump,
        bumpScale: 0.2,
        color: 0x8f613e,
        roughness: 0.9,
      });
      const palmFrondGeo = this.createCurvedLeafGeometry(4.2, 1.05);
      const palmFrondUpper = new THREE.MeshStandardMaterial({
        map: this.textures.jungleLeafTex,
        color: 0x6b9428,
        roughness: 0.72,
        side: THREE.DoubleSide,
      });
      const palmFrondLower = new THREE.MeshStandardMaterial({
        map: this.textures.jungleLeafTex,
        color: 0x8ea032,
        roughness: 0.78,
        side: THREE.DoubleSide,
      });
      applyWindSwayShader(palmFrondUpper, this.shaderTimeUniform, 0.28, 2.05);
      applyWindSwayShader(palmFrondLower, this.shaderTimeUniform, 0.26, 1.9);
      const desertStoneGeo = this.createDisplacedRockGeometry(0.75, 9.1);
      const warmStoneMat = new THREE.MeshStandardMaterial({
        map: this.textures.desertSandstone,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.16,
        color: 0xc28956,
        roughness: 0.88,
      });

      const palmSpots: [number, number, number, number][] = [
        [-14, -4.5, -14, 1.15],
        [15, -4.5, -24, 1.12],
        [-15, -4.0, -46, 1.2],
        [16, -3.5, -58, 1.15],
        [-17, -6.5, -142, 1.25],
        [-31, -8.5, -154, 1.3],
        [17, -4.5, -140, 1.2],
        [-17, -4.5, -185, 1.22],
        [17, -4.5, -225, 1.18],
        [14, -7.8, -258, 1.24],
        [31, -7.8, -268, 1.28],
        [23, -7.8, -274, 1.15],
        [-14, 3.2, -264, 1.1],
        [14, 4.0, -278, 1.15],
      ];

      for (let idx = 0; idx < palmSpots.length; idx++) {
        const [px, py, pz, sc] = palmSpots[idx];
        const pg = new THREE.Group();
        pg.position.set(px, py, pz);
        pg.rotation.y = idx * 1.15;

        const sandMound = new THREE.Mesh(
          this.createDisplacedRockGeometry(3.0 * sc, idx + 2.1),
          duneSurfaceMat
        );
        sandMound.scale.set(1.2, 0.55, 1.2);
        sandMound.position.y = -0.9;
        pg.add(sandMound);

        const lean = (idx % 2 === 0 ? 1 : -1) * 1.25 * sc;
        const trunkCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -0.5, 0),
          new THREE.Vector3(lean * 0.35, 3.2 * sc, 0.28 * sc),
          new THREE.Vector3(lean * 0.78, 6.4 * sc, 0.1 * sc),
          new THREE.Vector3(lean, 9.1 * sc, -0.15 * sc),
        ]);
        const trunkMesh = new THREE.Mesh(new THREE.TubeGeometry(trunkCurve, 12, 0.34 * sc, 8, false), palmTrunkMat);
        trunkMesh.castShadow = !this.isSoftwareGl;
        pg.add(trunkMesh);

        for (let r = 0; r < 3; r++) {
          const rAng = (r / 3) * Math.PI * 2 + idx;
          const st = new THREE.Mesh(desertStoneGeo, warmStoneMat);
          st.position.set(Math.cos(rAng) * 0.78 * sc, 0.25 * sc, Math.sin(rAng) * 0.78 * sc);
          st.scale.set(sc * 1.15, sc * 0.68, sc);
          pg.add(st);
        }

        const crownPos = new THREE.Vector3(lean, 9.1 * sc, -0.15 * sc);
        // Golden date clusters beneath crown
        for (let dc = 0; dc < 3; dc++) {
          const da = (dc / 3) * Math.PI * 2;
          const dateBunch = new THREE.Mesh(new THREE.SphereGeometry(0.32 * sc, 6, 5), brassMat);
          dateBunch.scale.set(0.8, 1.4, 0.8);
          dateBunch.position.set(crownPos.x + Math.cos(da) * 0.42 * sc, crownPos.y - 0.38 * sc, crownPos.z + Math.sin(da) * 0.42 * sc);
          pg.add(dateBunch);
        }

        // 11 arched curved 3D palm fronds in two layers
        for (let tier = 0; tier < 2; tier++) {
          const count = tier === 0 ? 6 : 5;
          for (let f = 0; f < count; f++) {
            const fAng = (f / count) * Math.PI * 2 + tier * 0.52;
            const bladePivot = new THREE.Group();
            bladePivot.position.copy(crownPos);
            bladePivot.rotation.y = fAng;

            const frond = new THREE.Mesh(palmFrondGeo, tier === 0 ? palmFrondUpper : palmFrondLower);
            frond.scale.setScalar(sc * (tier === 0 ? 1.0 : 0.86));
            frond.rotation.x = tier === 0 ? 0.92 : 1.24;
            bladePivot.add(frond);
            pg.add(bladePivot);
          }
        }
        this.levelGroup.add(pg);
      }

      // 8. Desert Agave Rosettes, Oasis Reeds, Scrub Bushes & Sandstone Outcrops
      const agaveLeafGeo = this.createCurvedLeafGeometry(1.35, 0.34);
      const agaveMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleLeafTex,
        color: 0x5c8542,
        roughness: 0.78,
        side: THREE.DoubleSide,
      });
      applyWindSwayShader(agaveMat, this.shaderTimeUniform, 0.14, 1.7);

      const desertDecorSpots: [number, number, number, number][] = [
        [-3.8, 1.0, 3.6, 0.7],
        [3.8, 1.0, 3.6, 0.68],
        [-3.9, 1.0, -3.5, 0.62],
        [-4.5, 8.2, -253.2, 0.74],
        [4.5, 8.2, -262.8, 0.72],
        [22.4, 10.3, -268.2, 0.62],
        [-4.1, 9.9, -287.6, 0.7],
        [4.1, 9.9, -287.6, 0.66],
        [-13.5, -4.5, -13.5, 0.9],
        [14.5, -4.5, -23.5, 0.88],
        [-14.5, -4.0, -45.5, 0.95],
        [21.0, -10.1, -255.0, 0.95],
        [29.0, -10.1, -269.0, 1.0],
        [-25.0, -10.1, -142.0, 0.92],
      ];
      const dRockInst = new THREE.InstancedMesh(desertStoneGeo, warmStoneMat, desertDecorSpots.length);
      const shrubInst = new THREE.InstancedMesh(agaveLeafGeo, agaveMat, desertDecorSpots.length * 7);

      let shIdx = 0;
      for (let i = 0; i < desertDecorSpots.length; i++) {
        const [rx, ry, rz, rs] = desertDecorSpots[i];
        dummy.position.set(rx, ry + 0.22 * rs, rz);
        dummy.rotation.set(0.15, i * 1.2, 0);
        dummy.scale.set(rs * 1.28, rs * 0.72, rs);
        dummy.updateMatrix();
        dRockInst.setMatrixAt(i, dummy.matrix);

        const sx = rx + (i % 2 === 0 ? 0.7 : -0.7) * rs;
        const sz = rz + 0.35 * rs;
        for (let f = 0; f < 7; f++) {
          const ang = (f / 7) * Math.PI * 2 + i * 0.4;
          dummy.position.set(sx, ry + 0.1 * rs, sz);
          dummy.rotation.set(0.65 + (f % 2) * 0.25, ang, 0);
          dummy.scale.setScalar(rs * 0.9);
          dummy.updateMatrix();
          shrubInst.setMatrixAt(shIdx, dummy.matrix);
          _color.setHex(f % 2 === 0 ? 0x6b9146 : 0x4c7032);
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

      // 9. Dynamic Swirling Dust Devils (remolinos de polvo) orbiting side ravines
      const devilRingMat = new THREE.MeshBasicMaterial({
        color: 0xf6c978,
        transparent: true,
        opacity: 0.34,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const devilConeMat = new THREE.MeshBasicMaterial({
        color: 0xe6a15c,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const devilSpots: [number, number, number][] = [
        [-15, -34, 4.2],
        [16, -98, 4.8],
        [-16, -172, 5.2],
        [15, -230, 4.4],
      ];
      for (let d = 0; d < devilSpots.length; d++) {
        const [dx, dz, drad] = devilSpots[d];
        const dg = new THREE.Group();
        dg.position.set(dx, level.theme.hazardFloorY + 0.2, dz);

        const funnel = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 0.7, 13.5, 16, 1, true), devilConeMat);
        funnel.position.y = 6.75;
        dg.add(funnel);

        for (let r = 0; r < 6; r++) {
          const t = r / 5;
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.85 + t * 2.75, 0.14 + t * 0.08, 6, 20),
            devilRingMat
          );
          ring.rotation.x = Math.PI / 2 + (r % 2 === 0 ? 0.08 : -0.08);
          ring.position.y = 0.8 + t * 11.2;
          dg.add(ring);
        }
        this.levelGroup.add(dg);
        this.desertDustDevils.push({
          group: dg,
          baseX: dx,
          baseZ: dz,
          phase: d * 1.7,
          radius: drad,
          speed: 0.45 + (d % 2) * 0.15,
        });
      }

      // 10. Hot-Air Desert Geysers (géiseres de aire caliente) pulsing from canyon fumaroles
      const geyserSpots: [number, number, number][] = [
        [-9, level.theme.hazardFloorY + 0.1, -22],
        [9, level.theme.hazardFloorY + 0.1, -44],
        [-11, level.theme.hazardFloorY + 0.1, -112],
        [11, level.theme.hazardFloorY + 0.1, -162],
        [10, level.theme.hazardFloorY + 0.1, -226],
      ];
      const plumeMat = new THREE.MeshBasicMaterial({
        color: 0xfde047,
        transparent: true,
        opacity: 0.36,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      for (let g = 0; g < geyserSpots.length; g++) {
        const [gx, gy, gz] = geyserSpots[g];
        const gg = new THREE.Group();
        gg.position.set(gx, gy, gz);

        const crater = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.5, 1.3, 10), sandstoneCliffMat);
        crater.position.y = 0.65;
        gg.add(crater);

        const core = new THREE.Mesh(
          new THREE.CircleGeometry(1.15, 16),
          new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.78 })
        );
        core.rotation.x = -Math.PI / 2;
        core.position.y = 1.32;
        gg.add(core);

        const plume = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 0.7, 11.0, 12, 1, true), plumeMat);
        plume.position.y = 6.5;
        gg.add(plume);

        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.1, 6, 18), plumeMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 2.0;
        gg.add(ring);

        this.levelGroup.add(gg);
        this.desertGeysers.push({
          group: gg,
          plume,
          ring,
          pos: new THREE.Vector3(gx, gy, gz),
          phase: g * 1.15,
          period: 4.2 + (g % 3) * 0.8,
        });
      }

      // 11. Dynamic Sweeping Sandstorm Drift Ribbons (tormentas de arena dinámicas en el horizonte del cañón)
      const stormBandMat = new THREE.MeshBasicMaterial({
        color: 0xf8c67c,
        transparent: true,
        opacity: 0.14,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const stormBandGeo = new THREE.PlaneGeometry(54, 14);
      for (let s = 0; s < 6; s++) {
        const band = new THREE.Mesh(stormBandGeo, stormBandMat);
        const bx = (s % 2 === 0 ? -1 : 1) * 18;
        const bz = -24 - s * 46;
        band.position.set(bx, level.theme.hazardFloorY + 6.5, bz);
        band.rotation.y = (s % 2 === 0 ? 0.18 : -0.18);
        this.levelGroup.add(band);
        this.desertSandstormBands.push({
          mesh: band,
          baseX: bx,
          baseZ: bz,
          phase: s * 1.1,
          speed: 2.2 + (s % 3) * 0.6,
        });
      }
    } else if (biome === 'temple') {
      // =====================================================================
      // NIVEL 04: TEMPLO DEL MONO — Monumental Stone Temple, Guardian Sentinels,
      // 3 Distinct Jungle Routes, Volumetric Waterfalls, Layered Foliage & Mist
      // =====================================================================

      // PLANE 3 (FAR BACKGROUND): Multi-depth misty jungle ridges & distant stepped ridge temples
      this.addHorizonMountainRing(0, -82, level.theme.hazardFloorY - 2.5, 138, 225, 62, 0x225a48, 0x8cc98c, 2.7, 0.9);
      this.addHorizonMountainRing(0, -82, level.theme.hazardFloorY - 1.2, 88, 142, 29, 0x133e24, 0x458b38, 1.45, 0.92);

      // Sculpted Mossy Riverbanks & Rocky Canyon Shores flanking the Emerald River (corridor x = -28..+26 stays free)
      const bankGeo = new THREE.PlaneGeometry(64, 235, 16, 36);
      bankGeo.rotateX(-Math.PI / 2);
      const bPos = bankGeo.attributes.position;
      for (let i = 0; i < bPos.count; i++) {
        const vx = bPos.getX(i);
        const vz = bPos.getZ(i);
        const innerDist = Math.max(0, 31 - Math.abs(vx));
        const h = Math.max(
          -0.45,
          innerDist * 0.27 + Math.sin(vz * 0.065 + vx * 0.12) * 1.85 + Math.cos(vx * 0.15 - vz * 0.04) * 1.15
        );
        bPos.setY(i, h);
      }
      bankGeo.computeVertexNormals();
      const bankMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleGrass,
        bumpMap: this.textures.grassBump,
        bumpScale: 0.14,
        roughness: 0.88,
      });
      const bankL = new THREE.Mesh(bankGeo, bankMat);
      bankL.position.set(-58, level.theme.hazardFloorY - 0.35, -86);
      bankL.receiveShadow = true;
      const bankR = new THREE.Mesh(bankGeo, bankMat);
      bankR.position.set(56, level.theme.hazardFloorY - 0.35, -86);
      bankR.rotation.y = Math.PI;
      bankR.receiveShadow = true;
      this.levelGroup.add(bankL, bankR);

      // Temple Architectural & Jungle Botanical Materials
      const tTopMat = new THREE.MeshStandardMaterial({
        map: this.textures.templeTop,
        bumpMap: this.textures.templeCarvedBump,
        bumpScale: 0.16,
        roughnessMap: this.textures.stoneRoughness,
        roughness: 0.84,
      });
      const tSideMat = new THREE.MeshStandardMaterial({
        map: this.textures.templeSide,
        bumpMap: this.textures.templeCarvedBump,
        bumpScale: 0.2,
        roughnessMap: this.textures.stoneRoughness,
        roughness: 0.86,
      });
      const tCarvedMat = new THREE.MeshStandardMaterial({
        map: this.textures.templeCarvedStone,
        bumpMap: this.textures.templeCarvedBump,
        bumpScale: 0.24,
        roughnessMap: this.textures.stoneRoughness,
        roughness: 0.84,
      });
      const tWetStoneMat = new THREE.MeshStandardMaterial({
        map: this.textures.templeCarvedStone,
        bumpMap: this.textures.templeCarvedBump,
        bumpScale: 0.22,
        color: 0x8ea18b,
        roughness: 0.36,
        metalness: 0.08,
      });
      const tDoorMat = new THREE.MeshStandardMaterial({ color: 0x0b120d, roughness: 0.96 });
      const tMossMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleGrass,
        bumpMap: this.textures.grassBump,
        bumpScale: 0.1,
        roughness: 0.85,
      });
      const tGoldMat = new THREE.MeshStandardMaterial({
        map: this.textures.goldTrim,
        color: 0xfbbf24,
        emissive: 0x92400e,
        emissiveIntensity: 0.45,
        metalness: 0.84,
        roughness: 0.24,
      });
      const jadeFlameMat = new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 2.1,
        roughness: 0.2,
      });
      const jadePulseMat = new THREE.MeshStandardMaterial({
        color: 0x6ee7b7,
        emissive: 0x059669,
        emissiveIntensity: 1.65,
        roughness: 0.18,
      });
      this.templeRuneGlows.push({ mat: jadePulseMat, phase: 0.5 });

      // ORIGINAL GUARDIAN STATUE BUILDER (Sculpted Ancient Temple Monkey Sentinels)
      const buildGuardianStatue = (gx: number, gy: number, gz: number, sc: number, rotY: number, jadeMode = false) => {
        const sg = new THREE.Group();
        sg.position.set(gx, gy, gz);
        sg.rotation.y = rotY;
        const bodyMat = jadeMode ? tWetStoneMat : tCarvedMat;

        const base = new THREE.Mesh(new THREE.BoxGeometry(2.8 * sc, 1.3 * sc, 2.8 * sc), tCarvedMat);
        base.position.y = 0.65 * sc;
        const step = new THREE.Mesh(new THREE.BoxGeometry(2.2 * sc, 0.75 * sc, 2.2 * sc), tTopMat);
        step.position.y = 1.65 * sc;

        const torso = new THREE.Mesh(new THREE.BoxGeometry(1.75 * sc, 2.3 * sc, 1.45 * sc), bodyMat);
        torso.position.y = 3.15 * sc;
        const chestPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.55 * sc, 0.55 * sc, 0.22 * sc, 12), tGoldMat);
        chestPlate.rotation.x = Math.PI / 2;
        chestPlate.position.set(0, 3.25 * sc, 0.74 * sc);

        // Sculpted crossed sentinel forearms & shield
        for (const sx of [-1, 1]) {
          const shoulder = new THREE.Mesh(new THREE.DodecahedronGeometry(0.58 * sc, 0), bodyMat);
          shoulder.position.set(sx * 1.08 * sc, 3.9 * sc, 0.12 * sc);
          const arm = new THREE.Mesh(new THREE.BoxGeometry(0.54 * sc, 1.5 * sc, 0.62 * sc), bodyMat);
          arm.position.set(sx * 0.92 * sc, 2.95 * sc, 0.45 * sc);
          arm.rotation.z = sx * 0.25;
          sg.add(shoulder, arm);
        }

        // Sculpted Guardian Monkey Head, Ears, Snout, Glowing Jade Eyes & Feathered Crown
        const head = new THREE.Mesh(new THREE.BoxGeometry(1.38 * sc, 1.3 * sc, 1.3 * sc), bodyMat);
        head.position.set(0, 4.92 * sc, 0.1 * sc);
        const brow = new THREE.Mesh(new THREE.BoxGeometry(1.52 * sc, 0.34 * sc, 0.45 * sc), tCarvedMat);
        brow.position.set(0, 5.26 * sc, 0.66 * sc);
        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.95 * sc, 0.58 * sc, 0.46 * sc), bodyMat);
        snout.position.set(0, 4.62 * sc, 0.72 * sc);

        for (const sx of [-1, 1]) {
          const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.38 * sc, 0.38 * sc, 0.26 * sc, 8), bodyMat);
          ear.rotation.z = Math.PI / 2;
          ear.position.set(sx * 0.8 * sc, 4.98 * sc, 0.05 * sc);
          const eye = new THREE.Mesh(new THREE.OctahedronGeometry(0.16 * sc, 0), jadePulseMat);
          eye.position.set(sx * 0.32 * sc, 5.0 * sc, 0.76 * sc);
          sg.add(ear, eye);
        }

        const crownBase = new THREE.Mesh(new THREE.BoxGeometry(1.68 * sc, 0.48 * sc, 1.42 * sc), tGoldMat);
        crownBase.position.set(0, 5.78 * sc, 0.08 * sc);
        const crownCrest = new THREE.Mesh(new THREE.ConeGeometry(0.52 * sc, 1.15 * sc, 5), jadeFlameMat);
        crownCrest.position.set(0, 6.45 * sc, 0.12 * sc);

        const mossShoulder = new THREE.Mesh(this.createDisplacedRockGeometry(0.65 * sc, gx + gz), tMossMat);
        mossShoulder.scale.set(1.2, 0.45, 0.9);
        mossShoulder.position.set(-0.75 * sc, 4.35 * sc, 0.05 * sc);

        sg.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            obj.castShadow = !this.isSoftwareGl;
            obj.receiveShadow = !this.isSoftwareGl;
          }
        });
        sg.add(base, step, torso, chestPlate, head, brow, snout, crownBase, crownCrest, mossShoulder);
        this.levelGroup.add(sg);
      };

      // 1. MONUMENTAL STEPPED GRAND TEMPLE CITADEL & FLANKING VALLEY SANCTUARIES (Plane 2/3)
      const buildMonumentalTemple = (tx: number, ty: number, tz: number, sc: number, rotY: number) => {
        const tg = new THREE.Group();
        tg.position.set(tx, ty, tz);
        tg.rotation.y = rotY;
        for (let tier = 0; tier < 7; tier++) {
          const w = (30 - tier * 3.5) * sc;
          const h = 3.2 * sc;
          const tierMesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, w),
            [tSideMat, tSideMat, tTopMat, tSideMat, tSideMat, tSideMat]
          );
          tierMesh.position.y = (tier + 0.5) * h;
          tg.add(tierMesh);

          // Corner stepped stone buttress ribs & partially collapsed parapet fragments
          if (tier < 5) {
            for (const sx of [-1, 1]) {
              const rib = new THREE.Mesh(new THREE.BoxGeometry(1.45 * sc, h * 1.04, 1.45 * sc), tCarvedMat);
              rib.position.set(sx * (w * 0.48), (tier + 0.5) * h, w * 0.48);
              tg.add(rib);
            }
          }
        }

        // Upper Recessed Dark Sanctuary Shrine & Relief Archway
        const sanctum = new THREE.Mesh(new THREE.BoxGeometry(8.6 * sc, 5.2 * sc, 7.6 * sc), tCarvedMat);
        sanctum.position.y = 24.8 * sc;
        const doorway = new THREE.Mesh(new THREE.BoxGeometry(3.2 * sc, 3.6 * sc, 0.65 * sc), tDoorMat);
        doorway.position.set(0, 24.1 * sc, 3.65 * sc);
        const lintelArch = new THREE.Mesh(new THREE.BoxGeometry(6.8 * sc, 1.15 * sc, 1.35 * sc), tTopMat);
        lintelArch.position.set(0, 26.4 * sc, 3.7 * sc);
        const sunDisc = new THREE.Mesh(new THREE.TorusGeometry(1.95 * sc, 0.26 * sc, 8, 24), tGoldMat);
        sunDisc.position.set(0, 28.4 * sc, 3.75 * sc);
        const sunCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.75 * sc, 0), jadePulseMat);
        sunCore.position.set(0, 28.4 * sc, 3.85 * sc);
        tg.add(sanctum, doorway, lintelArch, sunDisc, sunCore);

        // Monumental Eroded Central Staircase with Stepped Balustrades
        for (let st = 0; st < 14; st++) {
          const step = new THREE.Mesh(new THREE.BoxGeometry(5.6 * sc, 1.55 * sc, 2.4 * sc), tTopMat);
          step.position.set(0, (st + 0.5) * 1.55 * sc, (15.4 - st * 0.9) * sc);
          tg.add(step);
        }
        const balL = new THREE.Mesh(new THREE.BoxGeometry(1.1 * sc, 1.8 * sc, 16.5 * sc), tCarvedMat);
        balL.position.set(-3.2 * sc, 10.6 * sc, 9.6 * sc);
        balL.rotation.x = -0.78;
        const balR = balL.clone();
        balR.position.x = 3.2 * sc;
        tg.add(balL, balR);

        // Invading jungle moss & ruined broken pillar tops on terraces
        for (let m = 0; m < 8; m++) {
          const bush = new THREE.Mesh(this.createDisplacedRockGeometry(1.75 * sc, m + 1.4), tMossMat);
          bush.position.set(
            (m % 2 === 0 ? -1 : 1) * (10.2 - (m % 4) * 1.7) * sc,
            (6.4 + (m % 4) * 3.2) * sc,
            (m < 4 ? 1 : -1) * 7.8 * sc
          );
          bush.scale.set(1.3, 0.6, 1.15);
          tg.add(bush);
        }
        this.levelGroup.add(tg);
      };

      // Colossal Temple Citadel behind Kukul Summit + Flanking Valley Temples
      buildMonumentalTemple(0, level.theme.hazardFloorY - 0.5, -176, 1.92, 0);
      buildMonumentalTemple(-52, level.theme.hazardFloorY - 1, -74, 0.96, 0.44);
      buildMonumentalTemple(48, level.theme.hazardFloorY - 1, -92, 1.08, -0.4);

      // Sculpted Original Guardian Sentinel Statues at Key Monumental Landmarks
      buildGuardianStatue(-7.4, 0.8, -24.5, 0.82, 0.36);
      buildGuardianStatue(7.4, 0.8, -24.5, 0.82, -0.36);
      buildGuardianStatue(-28.6, 14.4, -78.2, 0.95, 1.15, true); // Secret Jade Treasury Guardian
      buildGuardianStatue(-7.6, 10.2, -93.0, 1.18, 0.25); // Colossal Temple Gate Guardians
      buildGuardianStatue(7.6, 10.2, -93.0, 1.18, -0.25);
      buildGuardianStatue(-13.2, 22.8, -138.0, 1.1, 0.55); // Summit Kukul Guardians
      buildGuardianStatue(13.2, 22.8, -138.0, 1.1, -0.55);

      // 2. PLAYABLE MONUMENTAL TEMPLE GATE, COLLAPSED ARCHES & INNER SANCTUARY COLONNADE (z = -92..-126)
      const gateArch = new THREE.Group();
      gateArch.position.set(0, 0, -93.0);
      for (const sx of [-1, 1]) {
        const tower = new THREE.Mesh(new THREE.BoxGeometry(3.8, 25.5, 4.6), tCarvedMat);
        tower.position.set(sx * 7.8, 8.8, 0);
        tower.castShadow = !this.isSoftwareGl;
        tower.receiveShadow = !this.isSoftwareGl;
        gateArch.add(tower);

        // Stepped decorative frieze bands & moss shelves
        const cap = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.5, 5.4), tTopMat);
        cap.position.set(sx * 7.8, 21.4, 0);
        const baseStep = new THREE.Mesh(new THREE.BoxGeometry(4.6, 2.0, 5.2), tTopMat);
        baseStep.position.set(sx * 7.8, 10.2, 0);
        gateArch.add(cap, baseStep);

        const brazier = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.45, 0.72, 10), tGoldMat);
        brazier.position.set(sx * 5.4, 11.7, -0.8);
        const flame = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.18, 7), jadeFlameMat);
        flame.position.set(sx * 5.4, 12.6, -0.8);
        gateArch.add(brazier, flame);
      }
      // Sculpted relief archway lintel with partially weathered uneven top blocks
      const gateLintel = new THREE.Mesh(new THREE.BoxGeometry(19.6, 3.0, 4.0), tCarvedMat);
      gateLintel.position.set(0, 21.8, 0);
      const brokenCrownL = new THREE.Mesh(new THREE.BoxGeometry(4.6, 1.8, 3.8), tTopMat);
      brokenCrownL.position.set(-4.8, 24.0, 0);
      brokenCrownL.rotation.z = 0.04;
      const gateCrest = new THREE.Mesh(new THREE.BoxGeometry(6.8, 2.5, 4.3), tGoldMat);
      gateCrest.position.set(0, 24.3, 0);
      const gateMedallion = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.25, 8, 24), jadePulseMat);
      gateMedallion.position.set(0, 21.8, 2.05);
      gateArch.add(gateLintel, brokenCrownL, gateCrest, gateMedallion);
      this.levelGroup.add(gateArch);

      // Flanking Carved Sanctuary Colonnade Pillars, Eroded Stair Terraces & Creeping Vines
      const vineTubeMat = new THREE.MeshStandardMaterial({ color: 0x3b6e22, roughness: 0.84 });
      applyWindSwayShader(vineTubeMat, this.shaderTimeUniform, 0.16, 1.4);
      for (const zPos of [-103.0, -113.0, -122.0]) {
        for (const sx of [-1, 1]) {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.38, 27, 12), tCarvedMat);
          col.position.set(sx * 8.6, 9.6, zPos);
          col.castShadow = !this.isSoftwareGl;
          const cap = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.2, 3.0), tTopMat);
          cap.position.set(sx * 8.6, 23.4, zPos);
          this.levelGroup.add(col, cap);

          // Partially collapsed stone wall segments between colonnade bays
          if (zPos !== -113.0) {
            const wallSeg = new THREE.Mesh(new THREE.BoxGeometry(1.4, 7.2, 6.2), tSideMat);
            wallSeg.position.set(sx * 9.5, 13.5, zPos - 4.2);
            wallSeg.rotation.z = sx * 0.03;
            this.levelGroup.add(wallSeg);
          }

          const torchBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.32, 0.48, 8), tGoldMat);
          torchBowl.position.set(sx * 7.1, zPos === -103 ? 13.4 : 18.2, zPos);
          const torchFire = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.9, 6), jadeFlameMat);
          torchFire.position.set(sx * 7.1, (zPos === -103 ? 13.4 : 18.2) + 0.62, zPos);
          this.levelGroup.add(torchBowl, torchFire);
        }
        const spanBeam = new THREE.Mesh(new THREE.BoxGeometry(20.4, 1.85, 2.3), tCarvedMat);
        spanBeam.position.set(0, 25.6, zPos);
        this.levelGroup.add(spanBeam);

        // Hanging creeping lianas draping down from temple arch beams
        const drapeCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-4.5, 25.0, zPos),
          new THREE.Vector3(-4.8, 22.8, zPos + 0.4),
          new THREE.Vector3(-4.2, 20.6, zPos - 0.2),
        ]);
        this.levelGroup.add(new THREE.Mesh(new THREE.TubeGeometry(drapeCurve, 8, 0.1, 5, false), vineTubeMat));
      }

      // Eroded Visual Stone Side-Stair Flights & Aqueduct Bridges framing Temple Hall -> Upper Terrace
      for (const sx of [-1, 1]) {
        for (let s = 0; s < 5; s++) {
          const stp = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 2.4), tTopMat);
          stp.position.set(sx * 6.4, 11.2 + s * 0.9, -99.0 - s * 2.1);
          this.levelGroup.add(stp);
        }
      }

      // 3. VISUAL LANDMARKS FOR THE 3 DISTINCT ROUTES (West Secret Grotto, Center Prueba Obelisks, East Sky Canopy)
      // West Secret Route: Natural Stone Cave Grotto Arch framing m-secret-cave (behind z = -39 so monkey-2d-ledge camera is unobstructed!)
      const caveGrotto = new THREE.Group();
      caveGrotto.position.set(-21.5, -0.5, -36.5);
      const caveCliffGeo = this.createDisplacedRockGeometry(4.2, 7.1);
      const grottoL = new THREE.Mesh(caveCliffGeo, tWetStoneMat);
      grottoL.scale.set(0.7, 2.2, 0.9);
      grottoL.position.set(-6.0, 4.2, -1.5);
      const grottoR = new THREE.Mesh(caveCliffGeo, tWetStoneMat);
      grottoR.scale.set(0.65, 1.9, 0.85);
      grottoR.position.set(5.4, 3.8, -1.2);
      const grottoRoof = new THREE.Mesh(caveCliffGeo, tWetStoneMat);
      grottoRoof.scale.set(1.85, 0.65, 1.1);
      grottoRoof.position.set(-0.3, 9.8, -1.4);
      caveGrotto.add(grottoL, grottoR, grottoRoof);
      for (let jc = 0; jc < 4; jc++) {
        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.48 + (jc % 2) * 0.18, 0), jadePulseMat);
        crystal.scale.set(0.65, 1.95, 0.65);
        crystal.position.set(-5.2 + jc * 3.4, 1.2 + (jc % 2) * 5.8, -2.5);
        crystal.rotation.set(0.2, jc * 0.8, -0.25);
        caveGrotto.add(crystal);
      }
      this.levelGroup.add(caveGrotto);

      // Center Route & River Sunken Ruin Archways & Eroded Obelisks (Prueba de los Antiguos landmarks)
      const ruinArchSpots: [number, number, number, number][] = [
        [-12.5, level.theme.hazardFloorY - 0.8, -6.0, 0.45],
        [12.5, level.theme.hazardFloorY - 0.8, -14.5, -0.4],
        [-8.5, level.theme.hazardFloorY - 0.8, -66.0, 0.28],
        [9.5, level.theme.hazardFloorY - 0.8, -81.0, -0.32],
        [16.0, level.theme.hazardFloorY - 0.8, -88.0, -0.35],
      ];
      for (const [ax, ay, az, rotY] of ruinArchSpots) {
        const arch = new THREE.Group();
        arch.position.set(ax, ay, az);
        arch.rotation.y = rotY;
        const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.08, 9.8, 10), tCarvedMat);
        pL.position.set(-3.4, 4.9, 0);
        const pR = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.08, 8.2, 10), tCarvedMat);
        pR.position.set(3.4, 4.1, 0);
        const lintel = new THREE.Mesh(new THREE.BoxGeometry(9.6, 1.55, 2.1), tTopMat);
        lintel.position.set(-0.3, 9.6, 0);
        lintel.rotation.z = -0.06;
        const mossCap = new THREE.Mesh(this.createDisplacedRockGeometry(1.4, ax + az), tMossMat);
        mossCap.position.set(-2.2, 10.6, 0);
        mossCap.scale.set(1.4, 0.55, 1.0);
        arch.add(pL, pR, lintel, mossCap);
        this.levelGroup.add(arch);
      }

      // East Elevated Route Sun-Jade Sky Totems framing the high canopy & golden bridges
      const skyTotemSpots: [number, number, number][] = [
        [18.8, 15.8, -36.8],
        [15.2, 17.0, -75.5],
        [12.8, 17.0, -99.5],
      ];
      for (const [tx, ty, tz] of skyTotemSpots) {
        const totem = new THREE.Group();
        totem.position.set(tx, ty, tz);
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.85, 18.0, 8), tCarvedMat);
        shaft.position.y = -7.5;
        const sunRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.14, 8, 20), tGoldMat);
        sunRing.position.y = 2.6;
        const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), jadePulseMat);
        orb.position.y = 2.6;
        totem.add(shaft, sunRing, orb);
        this.levelGroup.add(totem);
      }

      // 4. VOLUMETRIC MULTI-LAYER WATERFALLS, TEMPLE AQUEDUCT CASCADES & RISING MIST
      const wfSpots: [number, number, number, number, number, boolean][] = [
        [-29.0, 8.2, -37.5, 1.18, 1.05, false],
        [27.8, 9.4, -47.5, -1.12, 1.1, false],
        [-15.8, 16.5, -116.5, 0.32, 1.25, true], // Temple Aqueduct Cascade West
        [15.8, 16.5, -116.5, -0.32, 1.25, true], // Temple Aqueduct Cascade East
        [44.0, 21.0, -142.0, -0.45, 1.35, false], // Distant Valley Waterfall
      ];
      const cliffMat = new THREE.MeshStandardMaterial({
        map: this.textures.climbStone,
        bumpMap: this.textures.templeCarvedBump,
        bumpScale: 0.22,
        roughness: 0.88,
      });
      const wfOuterMat = new THREE.MeshPhysicalMaterial({
        map: this.textures.waterfallSurface,
        bumpMap: this.textures.waterBump,
        bumpScale: 0.08,
        transparent: true,
        opacity: 0.82,
        roughness: 0.09,
        clearcoat: 0.9,
        side: THREE.DoubleSide,
      });
      const wfCoreMat = new THREE.MeshBasicMaterial({
        color: 0xdff7fe,
        transparent: true,
        opacity: 0.46,
        side: THREE.DoubleSide,
      });
      const foamMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.62 });
      const mistMat = new THREE.MeshBasicMaterial({
        color: 0xeafcf4,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      });
      const cliffRockGeo = this.createDisplacedRockGeometry(6.8, 5.1);
      const mistGeo = this.createDisplacedRockGeometry(2.4, 2.9);

      for (const [wx, wy, wz, rotY, sc, aqueduct] of wfSpots) {
        const wg = new THREE.Group();
        wg.position.set(wx, wy, wz);
        wg.rotation.y = rotY;

        if (!aqueduct) {
          const cliffL = new THREE.Mesh(cliffRockGeo, cliffMat);
          cliffL.scale.set(0.92 * sc, 2.2 * sc, 0.85 * sc);
          cliffL.position.set(-4.8 * sc, -1.6, -1.5);
          const cliffR = new THREE.Mesh(cliffRockGeo, cliffMat);
          cliffR.scale.set(0.92 * sc, 2.2 * sc, 0.85 * sc);
          cliffR.position.set(4.8 * sc, -1.6, -1.5);
          const cliffBack = new THREE.Mesh(cliffRockGeo, cliffMat);
          cliffBack.scale.set(1.4 * sc, 2.3 * sc, 0.72 * sc);
          cliffBack.position.set(0, -1.1, -3.2);
          wg.add(cliffL, cliffR, cliffBack);
        } else {
          // Carved temple stone aqueduct water channel pouring directly off the sanctuary wall
          const channel = new THREE.Mesh(new THREE.BoxGeometry(6.2 * sc, 1.5, 6.0), tCarvedMat);
          channel.position.set(0, 2.0 * sc, -2.4);
          const rimL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 5.8), tTopMat);
          rimL.position.set(-2.9 * sc, 2.75 * sc, -2.4);
          const rimR = rimL.clone();
          rimR.position.x = 2.9 * sc;
          wg.add(channel, rimL, rimR);
        }

        const spout = new THREE.Mesh(new THREE.BoxGeometry(5.6 * sc, 1.2, 2.6), tTopMat);
        spout.position.set(0, 2.2 * sc, -0.5);

        const dropH = wy - level.theme.hazardFloorY + 3.2;
        const innerCore = new THREE.Mesh(new THREE.PlaneGeometry(4.4 * sc, dropH, 4, 8), wfCoreMat);
        innerCore.position.set(0, 2.2 * sc - dropH * 0.5, 0.32);
        innerCore.rotation.x = -0.05;

        const outerStream = new THREE.Mesh(new THREE.PlaneGeometry(5.35 * sc, dropH, 6, 10), wfOuterMat);
        outerStream.position.set(0, 2.2 * sc - dropH * 0.5, 0.62);
        outerStream.rotation.x = -0.05;

        const poolY = level.theme.hazardFloorY - wy + 0.14;
        const foam = new THREE.Mesh(new THREE.RingGeometry(1.5 * sc, 5.4 * sc, 22), foamMat);
        foam.rotation.x = -Math.PI / 2;
        foam.position.set(0, poolY, 1.1);

        // Volumetric waterfall mist billows rising from plunge pool
        for (let m = 0; m < 2; m++) {
          const mist = new THREE.Mesh(mistGeo, mistMat);
          mist.position.set((m === 0 ? -1.4 : 1.4) * sc, poolY + 1.2 + m * 0.8, 1.4);
          mist.scale.set(1.4 * sc, 0.52 * sc, 1.2 * sc);
          wg.add(mist);
          this.templeMistPlumes.push({
            mesh: mist,
            baseY: poolY + 1.2 + m * 0.8,
            baseScale: 1.35 * sc,
            phase: wx * 0.2 + m * 2.1,
          });
        }

        wg.add(spout, innerCore, outerStream, foam);
        this.levelGroup.add(wg);
        this.templeWaterfallPools.push(new THREE.Vector3(wx, level.theme.hazardFloorY + 0.3, wz));
      }

      // 5. DENSE MULTI-LAYERED TROPICAL RAINFOREST: GIANT IRREGULAR CEIBAS, LAYERED 3D LEAVES, PALMS & FOREGROUND FRAMING
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
        bumpScale: 0.2,
        color: 0x70341e,
        roughness: 0.88,
      });
      const leafSun = new THREE.MeshStandardMaterial({ color: 0x62ab33, roughness: 0.72, side: THREE.DoubleSide });
      const leafEmerald = new THREE.MeshStandardMaterial({ color: 0x357d24, roughness: 0.78, side: THREE.DoubleSide });
      const leafDeep = new THREE.MeshStandardMaterial({ color: 0x205218, roughness: 0.84, side: THREE.DoubleSide });
      const lianaMat = new THREE.MeshStandardMaterial({ color: 0x468026, roughness: 0.78 });
      applyWindSwayShader(leafSun, this.shaderTimeUniform, 0.24, 2.0);
      applyWindSwayShader(leafEmerald, this.shaderTimeUniform, 0.21, 1.85);
      applyWindSwayShader(leafDeep, this.shaderTimeUniform, 0.16, 1.65);
      applyWindSwayShader(lianaMat, this.shaderTimeUniform, 0.28, 1.45);

      // Curved 3D Botanical Palm Frond Geometry (replaces all cone fronds)
      const palmFrondGeo = this.createCurvedLeafGeometry(4.3, 1.35);
      const coconutGeo = new THREE.SphereGeometry(0.24, 8, 6);
      const coconutMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, roughness: 0.85 });

      const tPalmSpots: [number, number, number, number][] = [
        [-14, level.theme.hazardFloorY, -2, 1.15],
        [14, level.theme.hazardFloorY, -8, 1.18],
        [-25, level.theme.hazardFloorY, -24, 1.15],
        [23, level.theme.hazardFloorY, -34, 1.2],
        [-31, level.theme.hazardFloorY + 1.0, -54, 1.22],
        [25, level.theme.hazardFloorY + 0.5, -66, 1.15],
        [-30, level.theme.hazardFloorY + 1.5, -86, 1.2],
        [25, level.theme.hazardFloorY + 1.0, -108, 1.18],
      ];
      for (let i = 0; i < tPalmSpots.length; i++) {
        const [px, py, pz, sc] = tPalmSpots[i];
        const pg = new THREE.Group();
        pg.position.set(px, py, pz);
        const lean = (i % 2 === 0 ? 1 : -1) * 1.25 * sc;
        const pCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -0.5, 0),
          new THREE.Vector3(lean * 0.45, 5.5 * sc, 0.28 * sc),
          new THREE.Vector3(lean, 11.4 * sc, -0.1 * sc),
        ]);
        pg.add(new THREE.Mesh(new THREE.TubeGeometry(pCurve, 10, 0.36 * sc, 7, false), palmBarkMat));

        const crown = new THREE.Vector3(lean, 11.4 * sc, -0.1 * sc);
        for (let c = 0; c < 3; c++) {
          const ca = (c / 3) * Math.PI * 2;
          const nut = new THREE.Mesh(coconutGeo, coconutMat);
          nut.position.set(crown.x + Math.cos(ca) * 0.36 * sc, crown.y - 0.22 * sc, crown.z + Math.sin(ca) * 0.36 * sc);
          pg.add(nut);
        }
        for (let f = 0; f < 9; f++) {
          const fAng = (f / 9) * Math.PI * 2 + i * 0.45;
          const fg = new THREE.Group();
          fg.position.copy(crown);
          fg.rotation.y = fAng;
          fg.rotation.x = 0.72 + (f % 2) * 0.22;
          const frond = new THREE.Mesh(palmFrondGeo, f % 2 === 0 ? leafEmerald : leafSun);
          frond.scale.setScalar(sc);
          fg.add(frond);
          pg.add(fg);
        }
        this.levelGroup.add(pg);
      }

      // Giant Irregular Buttress-Rooted Ceiba Canopy Trees with Multi-Layered 3D Leaf Crowns
      const canopyFanGeo = this.createCurvedLeafGeometry(3.4, 2.25);
      const canopyCoreGeo = this.createDisplacedRockGeometry(2.15, 4.3);
      const tHardwoodSpots: [number, number, number, number][] = [
        [-22, level.theme.hazardFloorY, -10, 1.18],
        [22, level.theme.hazardFloorY, -16, 1.15],
        [-28, level.theme.hazardFloorY + 0.5, -48, 1.28],
        [24, level.theme.hazardFloorY + 0.5, -56, 1.24],
        [-32, level.theme.hazardFloorY + 1.0, -76, 1.28],
        [22, level.theme.hazardFloorY + 0.5, -88, 1.2],
        [-24, level.theme.hazardFloorY + 0.5, -104, 1.18],
        [24, level.theme.hazardFloorY + 0.5, -124, 1.22],
      ];
      const crownTips: THREE.Vector3[] = [];
      for (let i = 0; i < tHardwoodSpots.length; i++) {
        const [hx, hy, hz, sc] = tHardwoodSpots[i];
        const hg = new THREE.Group();
        hg.position.set(hx, hy, hz);
        const swayX = (i % 2 === 0 ? 1 : -1) * 0.6 * sc;
        const tCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -0.8, 0),
          new THREE.Vector3(swayX, 5.2 * sc, -0.3 * sc),
          new THREE.Vector3(-swayX * 0.6, 11.2 * sc, 0.35 * sc),
        ]);
        hg.add(new THREE.Mesh(new THREE.TubeGeometry(tCurve, 12, 0.82 * sc, 8, false), redBarkMat));

        // 5 Flaring Buttress Roots gripping ground/riverbank
        for (let r = 0; r < 5; r++) {
          const ang = (r / 5) * Math.PI * 2 + 0.4 + i * 0.3;
          const rCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(Math.cos(ang) * 0.5 * sc, 2.8 * sc, Math.sin(ang) * 0.5 * sc),
            new THREE.Vector3(Math.cos(ang) * 1.45 * sc, 1.0 * sc, Math.sin(ang) * 1.45 * sc),
            new THREE.Vector3(Math.cos(ang) * 2.55 * sc, -0.45, Math.sin(ang) * 2.55 * sc),
          ]);
          hg.add(new THREE.Mesh(new THREE.TubeGeometry(rCurve, 6, 0.3 * sc, 6, false), redBarkMat));
        }

        // Secondary Spreading Branches + Multi-Layered Leaf Fans + Dense Interior Canopy Cores
        const crownCenter = new THREE.Vector3(-swayX * 0.6, 11.8 * sc, 0.35 * sc);
        const coreMass = new THREE.Mesh(canopyCoreGeo, leafDeep);
        coreMass.position.copy(crownCenter);
        coreMass.scale.set(1.35 * sc, 0.65 * sc, 1.35 * sc);
        hg.add(coreMass);

        for (let b = 0; b < 5; b++) {
          const bAng = (b / 5) * Math.PI * 2 + i * 0.7;
          const bx = crownCenter.x + Math.cos(bAng) * 3.1 * sc;
          const bz = crownCenter.z + Math.sin(bAng) * 3.1 * sc;
          const by = crownCenter.y + 1.2 * sc + (b % 2) * 0.9 * sc;
          const bCurve = new THREE.CatmullRomCurve3([
            crownCenter.clone().add(new THREE.Vector3(0, -1.2 * sc, 0)),
            new THREE.Vector3(bx * 0.65, by - 0.6 * sc, bz * 0.65),
            new THREE.Vector3(bx, by, bz),
          ]);
          hg.add(new THREE.Mesh(new THREE.TubeGeometry(bCurve, 6, 0.24 * sc, 6, false), redBarkMat));

          const tierMat = b % 3 === 0 ? leafSun : b % 3 === 1 ? leafEmerald : leafDeep;
          const subMass = new THREE.Mesh(canopyCoreGeo, tierMat);
          subMass.position.set(bx, by, bz);
          subMass.scale.set(1.05 * sc, 0.56 * sc, 1.05 * sc);
          hg.add(subMass);

          // Radiating 3D curved leaf fans for natural layered silhouettes
          for (let lf = 0; lf < 4; lf++) {
            const lfAng = bAng + (lf - 1.5) * 0.55;
            const leafPivot = new THREE.Group();
            leafPivot.position.set(bx, by + 0.3 * sc, bz);
            leafPivot.rotation.y = lfAng;
            leafPivot.rotation.x = 0.88 + (lf % 2) * 0.24;
            const lfMesh = new THREE.Mesh(canopyFanGeo, lf % 2 === 0 ? leafSun : leafEmerald);
            lfMesh.scale.setScalar(sc * 0.95);
            leafPivot.add(lfMesh);
            hg.add(leafPivot);
          }
        }

        this.levelGroup.add(hg);
        crownTips.push(new THREE.Vector3(hx, hy + 14.5 * sc, hz));
      }

      // Overhead Draped Jungle Liana Arches across the valley
      const vineLinks: [number, number][] = [
        [0, 1],
        [2, 3],
        [4, 5],
        [6, 7],
      ];
      for (const [a, b] of vineLinks) {
        const pA = crownTips[a];
        const pB = crownTips[b];
        if (!pA || !pB) continue;
        const mid = pA.clone().lerp(pB, 0.5);
        mid.y += 4.6;
        const vineCurve = new THREE.CatmullRomCurve3([pA, mid, pB]);
        this.levelGroup.add(new THREE.Mesh(new THREE.TubeGeometry(vineCurve, 14, 0.12, 5, false), lianaMat));
      }

      // 6. PLANE 1 (FOREGROUND FRAMING) + NATURAL BOULDERS, 3D FERNS & TROPICAL FLOWERS
      const templeDecorSpots: [number, number, number, number][] = [
        [-5.2, 0.95, 4.4, 0.78], // Foreground left framing spawn
        [5.2, 0.95, 4.4, 0.76],  // Foreground right framing spawn
        [-4.5, 1.0, -3.6, 0.68],
        [4.5, 1.0, -3.6, 0.65],
        [-4.2, 1.6, -19.2, 0.62],
        [4.2, 1.6, -25.8, 0.6],
        [-3.6, 9.3, -37.2, 0.64],
        [3.6, 9.3, -57.0, 0.64],
        [-8.0, -3.5, -7.2, 0.92],
        [-13.5, -3.5, -26.5, 0.95],
        [-4.8, 11.3, -99.8, 0.7],
        [4.8, 11.3, -99.8, 0.7],
        [-9.2, 24.5, -133.5, 0.75],
        [9.2, 24.5, -133.5, 0.75],
      ];
      const ruinRockGeo = this.createDisplacedRockGeometry(0.85, 6.2);
      const ruinInst = new THREE.InstancedMesh(ruinRockGeo, tWetStoneMat, templeDecorSpots.length);
      const broadLeafGeo = this.createCurvedLeafGeometry(2.1, 0.68);
      const broadLeafInst = new THREE.InstancedMesh(broadLeafGeo, leafEmerald, templeDecorSpots.length * 6);
      const flowerPetalGeo = new THREE.ConeGeometry(0.24, 0.34, 6);
      const flowerMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x3f1020,
        emissiveIntensity: 0.35,
        roughness: 0.45,
      });
      const flowerInst = new THREE.InstancedMesh(flowerPetalGeo, flowerMat, templeDecorSpots.length * 2);
      const flowerColors = [0xf43f5e, 0xfacc15, 0xe879f9, 0xfb923c];

      let blIdx = 0;
      let flwIdx = 0;
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
          dummy.position.set(lx + Math.cos(ang) * 0.25 * rs, ry + 0.35 * rs, lz + Math.sin(ang) * 0.25 * rs);
          dummy.rotation.set(0.95, ang, 0);
          dummy.scale.setScalar(rs * 0.92);
          dummy.updateMatrix();
          broadLeafInst.setMatrixAt(blIdx, dummy.matrix);
          _color.setHex(f % 2 === 0 ? 0x5ca832 : 0x2f7520);
          broadLeafInst.setColorAt(blIdx, _color);
          blIdx++;
        }

        for (let fl = 0; fl < 2; fl++) {
          dummy.position.set(lx + (fl === 0 ? 0.3 : -0.35) * rs, ry + 0.95 * rs, lz + (fl === 0 ? 0.25 : -0.2) * rs);
          dummy.rotation.set(Math.PI, i + fl, 0.2);
          dummy.scale.set(rs * 1.1, rs * 1.1, rs * 1.1);
          dummy.updateMatrix();
          flowerInst.setMatrixAt(flwIdx, dummy.matrix);
          _color.setHex(flowerColors[(i + fl) % flowerColors.length]);
          flowerInst.setColorAt(flwIdx, _color);
          flwIdx++;
        }
      }
      for (const im of [ruinInst, broadLeafInst, flowerInst]) {
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
        im.computeBoundingSphere();
      }
      this.levelGroup.add(ruinInst, broadLeafInst, flowerInst);

      // 7. FLOATING WATER LILY PADS & LOTUS BLOOMS ON THE EMERALD RIVER
      const padGeo = new THREE.CylinderGeometry(1.1, 1.1, 0.08, 12);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.72 });
      const lotusGeo = new THREE.ConeGeometry(0.3, 0.34, 6);
      const lotusMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, emissive: 0xdb2777, emissiveIntensity: 0.42 });
      const padSpots: [number, number][] = [
        [-4.5, -5.5], [-10.5, -7.2], [5.8, -9.0], [9.2, -16.5], [-6.5, -18.5],
        [-19.5, -15.0], [-23.0, -24.5], [15.5, -31.0], [-14.0, -40.5], [10.0, -46.0],
        [-8.0, -58.0], [11.0, -68.0], [-14.0, -76.0], [12.0, -86.0], [-18.0, -94.0],
        [16.0, -98.0], [-10.0, -108.0], [14.0, -114.0],
      ];
      const padInst = new THREE.InstancedMesh(padGeo, padMat, padSpots.length);
      const lotusInst = new THREE.InstancedMesh(lotusGeo, lotusMat, padSpots.length);
      for (let i = 0; i < padSpots.length; i++) {
        const [lx, lz] = padSpots[i];
        const sc = 0.78 + (i % 3) * 0.25;
        dummy.position.set(lx, level.theme.hazardFloorY + 0.06, lz);
        dummy.rotation.set(0, i * 0.85, 0);
        dummy.scale.set(sc, 1, sc);
        dummy.updateMatrix();
        padInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(lx + 0.15, level.theme.hazardFloorY + 0.24, lz);
        dummy.rotation.set(Math.PI, i, 0);
        dummy.scale.set(sc, sc, sc);
        dummy.updateMatrix();
        lotusInst.setMatrixAt(i, dummy.matrix);
      }
      padInst.instanceMatrix.needsUpdate = true;
      lotusInst.instanceMatrix.needsUpdate = true;
      padInst.computeBoundingSphere();
      lotusInst.computeBoundingSphere();
      this.levelGroup.add(padInst, lotusInst);

      // 8. VOLUMETRIC GOLDEN CANOPY SUNBEAMS PIERCING THROUGH TREES & TEMPLE GATES
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xfef3c7,
        transparent: true,
        opacity: this.isSoftwareGl ? 0.05 : 0.075,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const beamGeo = new THREE.ConeGeometry(5.0, 38, 10, 1, true);
      const beamCoords: [number, number, number][] = [
        [-3.5, 13, -6],
        [-4, 14, -18],
        [-18, 13, -36],
        [10, 18, -50],
        [-2, 20, -82],
        [0, 26, -120],
        [0, 32, -140],
      ];
      for (const [bx, by, bz] of beamCoords) {
        const beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(bx, by, bz);
        beam.rotation.set(0.18, 0, -0.34);
        this.levelGroup.add(beam);
      }

      // 9. FALLING FLUTTERING CURVED JUNGLE LEAVES (InstancedMesh animated in tick)
      const leafCount = this.isSoftwareGl ? 32 : 76;
      const fallLeafGeo = this.createCurvedLeafGeometry(0.56, 0.26);
      const fallLeafMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.62,
        side: THREE.DoubleSide,
      });
      const fallLeaves = new THREE.InstancedMesh(fallLeafGeo, fallLeafMat, leafCount);
      fallLeaves.frustumCulled = false;
      fallLeaves.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.templeLeafStates = [];
      for (let i = 0; i < leafCount; i++) {
        const lx = (Math.random() - 0.5) * 48;
        const ly = Math.random() * 26 + 2;
        const lz = -Math.random() * 148;
        this.templeLeafStates.push({
          x: lx,
          y: ly,
          z: lz,
          fallSpeed: 0.85 + Math.random() * 0.9,
          swayPhase: Math.random() * Math.PI * 2,
          rotSpeed: 1.4 + Math.random() * 2.0,
        });
        _color.setHex(i % 3 === 0 ? 0x84cc16 : i % 3 === 1 ? 0x4ade80 : 0xfacc15);
        fallLeaves.setColorAt(i, _color);
      }
      if (fallLeaves.instanceColor) fallLeaves.instanceColor.needsUpdate = true;
      fallLeaves.computeBoundingSphere();
      this.templeLeafMesh = fallLeaves;
      this.levelGroup.add(fallLeaves);

      // 10. LUMINOUS JUNGLE FIREFLIES (Custom Additive Shader Points)
      const ffCount = this.isSoftwareGl ? 40 : 96;
      const ffPos = new Float32Array(ffCount * 3);
      const ffPhase = new Float32Array(ffCount);
      for (let i = 0; i < ffCount; i++) {
        ffPos[i * 3] = (Math.random() - 0.5) * 52;
        ffPos[i * 3 + 1] = level.theme.hazardFloorY + 1.2 + Math.random() * 24;
        ffPos[i * 3 + 2] = -Math.random() * 145;
        ffPhase[i] = Math.random() * Math.PI * 2;
      }
      const ffGeo = new THREE.BufferGeometry();
      ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
      ffGeo.setAttribute('aPhase', new THREE.BufferAttribute(ffPhase, 1));
      const ffTime = { value: 0 };
      this.templeFireflyTime = ffTime;
      const ffMat = new THREE.ShaderMaterial({
        uniforms: { uTime: ffTime },
        vertexShader: `
          attribute float aPhase;
          uniform float uTime;
          varying float vGlow;
          void main() {
            vec3 p = position;
            p.x += sin(uTime * 1.1 + aPhase) * 1.3;
            p.y += cos(uTime * 1.5 + aPhase * 1.4) * 0.7;
            p.z += sin(uTime * 0.9 + aPhase * 0.7) * 1.1;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = clamp(120.0 / max(1.0, -mv.z), 3.0, 14.0);
            vGlow = 0.4 + 0.6 * sin(uTime * 3.4 + aPhase * 2.1);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          varying float vGlow;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = smoothstep(0.5, 0.05, d) * vGlow;
            gl_FragColor = vec4(0.68, 1.0, 0.42, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const ffPoints = new THREE.Points(ffGeo, ffMat);
      ffPoints.frustumCulled = false;
      this.levelGroup.add(ffPoints);
    } else if (biome === 'ice') {
      // =====================================================================
      // NIVEL 03: GLACIAR AURORA — Monumental Polar Peaks, Translucent Glaciers,
      // Aurora Borealis Sky Curtains, Ice Caves, Frozen Waterfalls & Blizzards
      // =====================================================================

      // 1. MULTI-LAYERED POLAR FJORD MOUNTAIN RINGS & ANIMATED 3D AURORA BOREALIS CURTAINS
      this.addHorizonMountainRing(-24, -58, level.theme.hazardFloorY - 2, 122, 224, 68, 0x164168, 0xe8f7ff, 5.2, 0.78);
      this.addHorizonMountainRing(-24, -55, level.theme.hazardFloorY - 1, 82, 134, 34, 0x0e2a45, 0x86ccf0, 3.4, 0.86);

      const auroraConfigs: [number, number, number, number, number, number, number][] = [
        [-22, 52, -92, 230, 30, 0x34d399, 0x22d3ee],
        [-14, 58, -145, 250, 34, 0x22d3ee, 0xa78bfa],
        [-32, 47, -45, 200, 26, 0x10b981, 0x38bdf8],
      ];
      for (let a = 0; a < auroraConfigs.length; a++) {
        const [ax, ay, az, width, height, colA, colB] = auroraConfigs[a];
        const aurGeo = new THREE.PlaneGeometry(width, height, 48, 6);
        const aPos = aurGeo.attributes.position;
        for (let i = 0; i < aPos.count; i++) {
          const px = aPos.getX(i);
          const u = (px / width) + 0.5;
          // Sweep curtain into a deep celestial arc across the polar horizon
          aPos.setZ(i, Math.sin(u * Math.PI * 1.4 + a * 1.1) * 28 - Math.cos(u * Math.PI) * 16);
        }
        aurGeo.computeVertexNormals();
        const aurMat = createAuroraCurtainMaterial(
          this.textures.auroraCurtainTex,
          this.shaderTimeUniform,
          colA,
          colB,
          0xa78bfa,
          a * 2.1,
          0.66 - a * 0.08
        );
        const aurMesh = new THREE.Mesh(aurGeo, aurMat);
        aurMesh.position.set(ax, ay, az);
        aurMesh.rotation.y = (a - 1) * 0.26;
        aurMesh.renderOrder = 2;
        this.levelGroup.add(aurMesh);
      }

      // Shared PBR & Translucent Optical Ice / Snow-Crusted Slate Materials
      const polarSlateMat = new THREE.MeshStandardMaterial({
        map: this.textures.glacialRock,
        bumpMap: this.textures.glacialRockBump,
        bumpScale: 0.24,
        roughnessMap: this.textures.stoneRoughness,
        roughness: 0.82,
        metalness: 0.06,
      });
      const snowDriftMat = new THREE.MeshStandardMaterial({
        map: this.textures.iceCrystal,
        bumpMap: this.textures.iceBump,
        bumpScale: 0.1,
        color: 0xf4fbff,
        roughness: 0.52,
        metalness: 0.02,
      });
      const translucentGlacierMat = new THREE.MeshPhysicalMaterial({
        map: this.textures.iceSide,
        bumpMap: this.textures.iceBump,
        bumpScale: 0.16,
        color: 0x99e2ff,
        emissive: 0x064c73,
        emissiveIntensity: 0.24,
        roughness: 0.1,
        metalness: 0.08,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06,
        transmission: this.isSoftwareGl ? 0 : 0.45,
        ior: 1.31,
        thickness: 1.8,
        attenuationColor: new THREE.Color(0x0284c7),
        attenuationDistance: 4.5,
        transparent: true,
        opacity: this.isSoftwareGl ? 0.82 : 0.96,
        envMapIntensity: 1.65,
      });
      applyGlacialIceSheenShader(translucentGlacierMat, this.shaderTimeUniform, 0.48);

      const darkCavernVoidMat = new THREE.MeshStandardMaterial({
        color: 0x051526,
        roughness: 0.96,
        metalness: 0.02,
      });
      const crystalBeaconMat = new THREE.MeshStandardMaterial({
        color: 0xa5f3fc,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.85,
        roughness: 0.15,
      });
      const auroraEmeraldCrystalMat = new THREE.MeshStandardMaterial({
        color: 0x6ee7b7,
        emissive: 0x10b981,
        emissiveIntensity: 1.75,
        roughness: 0.15,
      });

      // 2. SCULPTED NATURAL SNOWY POLAR MOUNTAINS & GLACIER CLIFF MASSIFS (flanking both sides)
      const mountainSpecs: [number, number, number, number, number][] = [
        [-38, -13, -12, 16, 36],
        [34, -13, -18, 15, 34],
        [-36, -13, -64, 17, 40],
        [32, -13, -58, 18, 42],
        [-76, -13, -60, 18, 42],
        [-14, -13, -86, 16, 36],
        [-82, -13, -104, 19, 44],
        [-14, -13, -122, 17, 38],
        [-48, -13, -148, 22, 48],
      ];
      for (let i = 0; i < mountainSpecs.length; i++) {
        const [mx, my, mz, mRad, mH] = mountainSpecs[i];
        const peakGeo = this.createGlacierPeakGeometry(mRad, mH, i * 1.7 + 0.6);
        const peakMesh = new THREE.Mesh(peakGeo, polarSlateMat);
        peakMesh.position.set(mx, my + mH * 0.46, mz);
        peakMesh.receiveShadow = true;
        peakMesh.castShadow = !this.isSoftwareGl;
        this.levelGroup.add(peakMesh);

        // Translucent glacier ice buttress hugging mountain foot
        const iceButtress = new THREE.Mesh(
          this.createGlacierPeakGeometry(mRad * 0.72, mH * 0.56, i * 2.3 + 1.1),
          translucentGlacierMat
        );
        iceButtress.position.set(mx + (mx < -40 ? 4.5 : -4.5), my + mH * 0.24, mz + 3.2);
        this.levelGroup.add(iceButtress);
      }

      // 3. MONUMENTAL MURALLA 2D GLACIAL WALL & DARK CAVERN ALCOVES (behind z = -41, strictly at z <= -45.2!)
      const wallGroup = new THREE.Group();
      const murallaColumns: [number, number, number, number][] = [
        [3.5, 22, 6.2, -49.8],
        [-5.5, 24, 7.0, -49.2],
        [-14.5, 21, 6.4, -49.8],
        [-23.5, 26, 7.4, -49.0],
        [-32.5, 22, 6.6, -49.8],
        [-41.5, 25, 7.2, -49.2],
        [-50.5, 26, 6.8, -49.6],
      ];
      for (let i = 0; i < murallaColumns.length; i++) {
        const [wx, wh, ww, wz] = murallaColumns[i];
        const wallSeg = new THREE.Mesh(
          this.createJaggedRockFormationGeometry(ww * 0.68, wh, i * 1.5 + 0.8),
          i % 2 === 0 ? translucentGlacierMat : polarSlateMat
        );
        wallSeg.scale.set(1.25, 1.0, 0.8);
        wallSeg.position.set(wx, -13 + wh * 0.5, wz);
        wallSeg.receiveShadow = true;
        wallGroup.add(wallSeg);

        // Deep dark shadowed ice-cave alcoves between glacier bastions for dramatic light/dark contrast
        if (i < murallaColumns.length - 1) {
          const ax = wx - 4.5;
          const alcoveBack = new THREE.Mesh(new THREE.BoxGeometry(5.6, 12.0, 2.2), darkCavernVoidMat);
          alcoveBack.position.set(ax, 4.2, -48.6);
          wallGroup.add(alcoveBack);

          // Luminous emerald/cyan aurora crystal cluster inside each shadowed recess
          const cMat = (i % 2 === 0 ? crystalBeaconMat : auroraEmeraldCrystalMat).clone();
          const cMesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), cMat);
          cMesh.scale.set(0.6, 2.1, 0.6);
          cMesh.position.set(ax, 3.2 + (i % 2) * 1.4, -47.2);
          cMesh.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.22;
          wallGroup.add(cMesh);
          this.iceCrystalClusters.push({ mesh: cMesh, mat: cMat, phase: i * 1.1 });

          // Overhanging translucent icicle curtain high overhead (y = 11.4..14.8, well above player jumps!)
          for (let ic = 0; ic < 3; ic++) {
            const icH = 2.0 + ((i + ic) % 3) * 0.8;
            const icicle = new THREE.Mesh(new THREE.ConeGeometry(0.42, icH, 6), translucentGlacierMat);
            icicle.rotation.x = Math.PI;
            icicle.position.set(ax - 1.5 + ic * 1.5, 14.5 - icH * 0.45, -46.2);
            wallGroup.add(icicle);
          }
        }
      }
      this.levelGroup.add(wallGroup);

      // 4. ICE CAVES & GLACIAL ARCHWAYS (Pre-2D Entry Cave, Secret Crystal Sanctuary, Western Grotto, Boss Citadel)
      // 4A. Pre-2D Glacier Cavern Portal framing i-step-pre2d (z = -33.5, y >= 11 clearance)
      const pre2dArchGeo = this.createDesertRockArchGeometry(12.8, 12.2, 2.1, 3.4);
      const pre2dArch = new THREE.Mesh(pre2dArchGeo, translucentGlacierMat);
      pre2dArch.position.set(0, 1.2, -35.5);
      this.levelGroup.add(pre2dArch);

      // 4B. Secret Crystal Sanctuary Cave framing i-3d-side & i-elev-secret (east flank x = -27..-24, z = -52..-68)
      const secretCaveGroup = new THREE.Group();
      const caveWallBack = new THREE.Mesh(this.createJaggedRockFormationGeometry(5.8, 26, 4.2), polarSlateMat);
      caveWallBack.position.set(-24.5, 0, -59.5);
      const caveInnerShadow = new THREE.Mesh(new THREE.BoxGeometry(2.6, 11.5, 14.5), darkCavernVoidMat);
      caveInnerShadow.position.set(-26.8, 9.2, -59.5);
      const caveArch = new THREE.Mesh(this.createDesertRockArchGeometry(14.0, 11.5, 1.9, 5.1), translucentGlacierMat);
      caveArch.rotation.y = Math.PI / 2;
      caveArch.position.set(-28.5, 5.8, -59.5);
      secretCaveGroup.add(caveWallBack, caveInnerShadow, caveArch);

      // Crystal Mechanism Conduit linking Switch sw-i1 ([-33, 7.4, -52.8]) to Elevator i-elev-secret ([-33, 7.2, -64])
      const conduitMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.75,
        roughness: 0.2,
      });
      const conduitCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-33, 7.4, -52.8),
        new THREE.Vector3(-30.5, 6.9, -58.4),
        new THREE.Vector3(-33, 7.2, -64.0),
      ]);
      const conduitBeam = new THREE.Mesh(new THREE.TubeGeometry(conduitCurve, 16, 0.14, 6, false), conduitMat);
      this.iceMechanismBeam = { mesh: conduitBeam, mat: conduitMat };
      secretCaveGroup.add(conduitBeam);

      for (let c = 0; c < 5; c++) {
        const cm = auroraEmeraldCrystalMat.clone();
        const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.6 + (c % 2) * 0.25, 0), cm);
        cr.scale.set(0.65, 2.2, 0.65);
        cr.position.set(-27.2, 7.8 + (c % 3) * 1.4, -53.5 - c * 3.1);
        cr.rotation.z = 0.28;
        secretCaveGroup.add(cr);
        this.iceCrystalClusters.push({ mesh: cr, mat: cm, phase: c * 0.9 });
      }
      this.levelGroup.add(secretCaveGroup);

      // 4C. Western Secret Ice Grotto behind i-dis-side ([-66, 8.4, -83])
      const westGrotto = new THREE.Group();
      const grottoCliff = new THREE.Mesh(this.createJaggedRockFormationGeometry(6.4, 24, 7.3), polarSlateMat);
      grottoCliff.position.set(-74.5, -0.5, -83);
      const grottoShadow = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8.5, 9.2), darkCavernVoidMat);
      grottoShadow.position.set(-71.8, 9.8, -83);
      const grottoArch = new THREE.Mesh(this.createDesertRockArchGeometry(10.5, 9.6, 1.7, 6.4), translucentGlacierMat);
      grottoArch.rotation.y = Math.PI / 2;
      grottoArch.position.set(-71.2, 6.4, -83);
      westGrotto.add(grottoCliff, grottoShadow, grottoArch);
      for (let c = 0; c < 3; c++) {
        const cm = crystalBeaconMat.clone();
        const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.55, 0), cm);
        cr.scale.set(0.6, 2.1, 0.6);
        cr.position.set(-71.2, 9.2 + (c % 2) * 1.1, -85.4 + c * 2.4);
        cr.rotation.z = -0.3;
        westGrotto.add(cr);
        this.iceCrystalClusters.push({ mesh: cr, mat: cm, phase: c * 1.4 + 2.0 });
      }
      this.levelGroup.add(westGrotto);

      // 4D. Cryogenic Cathedral Amphitheater & Dark Ice Vault behind Boss Arena ([-48, 12.0, -113])
      const citadelGroup = new THREE.Group();
      for (let s = 0; s < 9; s++) {
        const ang = -Math.PI * 0.85 + (s / 8) * Math.PI * 0.7;
        const dist = 17.5 + (s % 2) * 2.8;
        const sx = -48 + Math.cos(ang) * dist;
        const sz = -113 + Math.sin(ang) * dist;
        const spireH = 18 + (s % 3) * 5.5;
        const spire = new THREE.Mesh(
          this.createGlacierPeakGeometry(3.8 + (s % 2) * 1.1, spireH, s * 1.6),
          s % 2 === 0 ? translucentGlacierMat : polarSlateMat
        );
        spire.position.set(sx, 2.0 + spireH * 0.45, sz);
        spire.castShadow = !this.isSoftwareGl;
        citadelGroup.add(spire);

        const cm = (s % 2 === 0 ? crystalBeaconMat : auroraEmeraldCrystalMat).clone();
        const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), cm);
        beacon.scale.set(0.65, 2.3, 0.65);
        beacon.position.set(sx * 0.96 - 48 * 0.04, 13.8 + (s % 2) * 1.8, sz * 0.96 - 113 * 0.04);
        citadelGroup.add(beacon);
        this.iceCrystalClusters.push({ mesh: beacon, mat: cm, phase: s * 0.75 });
      }
      // Deep shadowed glacial sanctuary archway framing the Goal Portal at z = -124.5
      const goalCavernArch = new THREE.Mesh(this.createDesertRockArchGeometry(15.5, 11.5, 2.2, 8.2), translucentGlacierMat);
      goalCavernArch.position.set(-48, 11.2, -124.5);
      const goalCavernRecess = new THREE.Mesh(new THREE.BoxGeometry(10.5, 9.5, 3.2), darkCavernVoidMat);
      goalCavernRecess.position.set(-48, 15.8, -127.8);
      citadelGroup.add(goalCavernArch, goalCavernRecess);
      this.levelGroup.add(citadelGroup);

      // 5. PARTIALLY FROZEN WATERFALLS & COLD VAPOR PLUNGE BASINS
      const frozenFallMat = new THREE.MeshPhysicalMaterial({
        map: this.textures.waterfallSurface,
        bumpMap: this.textures.iceBump,
        bumpScale: 0.14,
        color: 0xa5f3fc,
        emissive: 0x075985,
        emissiveIntensity: 0.35,
        roughness: 0.12,
        clearcoat: 1.0,
        transparent: true,
        opacity: 0.88,
      });
      const vaporMat = new THREE.MeshBasicMaterial({
        color: 0xe0f7ff,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      });

      const waterfallSpots: [number, number, number, number, number][] = [
        [-24, 14, -15, 1.0, 0.8],
        [24, 14, -26, -1.0, 0.8],
        [-68, 18, -68, 1.0, 0.9],
        [-26, 18, -96, -1.0, 0.85],
      ];
      for (let w = 0; w < waterfallSpots.length; w++) {
        const [wx, wy, wz, dirX, rotY] = waterfallSpots[w];
        const fg = new THREE.Group();
        fg.position.set(wx, -13, wz);
        fg.rotation.y = dirX > 0 ? rotY * 0.45 : -rotY * 0.45;

        const cliffBack = new THREE.Mesh(this.createJaggedRockFormationGeometry(4.8, wy + 15, w * 2.1 + 1.3), polarSlateMat);
        cliffBack.position.y = (wy + 15) * 0.5;
        fg.add(cliffBack);

        // Frozen stepped cascade ice sheet + ribbed icicle columns
        const fallH = wy + 13;
        const fallSheet = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.5, fallH, 10), frozenFallMat);
        fallSheet.scale.set(1.5, 1.0, 0.52);
        fallSheet.position.set(dirX * 2.4, fallH * 0.5, 0);
        fg.add(fallSheet);

        for (let r = -1; r <= 1; r++) {
          const icicleCol = new THREE.Mesh(new THREE.ConeGeometry(0.45, fallH * 0.72, 6), translucentGlacierMat);
          icicleCol.rotation.x = Math.PI;
          icicleCol.position.set(dirX * 3.1, fallH * 0.62, r * 1.15);
          fg.add(icicleCol);
        }

        // Cold frost vapor mist cloud drifting at waterfall base
        const mist = new THREE.Mesh(new THREE.SphereGeometry(3.4, 12, 8), vaporMat);
        mist.scale.set(1.5, 0.52, 1.4);
        mist.position.set(dirX * 3.4, 1.2, 0);
        fg.add(mist);
        this.iceVaporPlumes.push({ mesh: mist, baseY: 1.2, phase: w * 1.6 });

        this.levelGroup.add(fg);
      }

      // 6. SCULPTED TRANSLUCENT ICEBERGS, FROZEN LAKE ICE FLOES & SNOW-DUSTED SLATE ROCKS
      const bergCount = 46;
      const bergSlateGeo = this.createDisplacedRockGeometry(3.2, 2.3);
      const bergIceGeo = this.createGlacierPeakGeometry(2.8, 6.2, 3.1);
      const bergSnowGeo = this.createDisplacedRockGeometry(2.6, 4.1);

      const bergSlates = new THREE.InstancedMesh(bergSlateGeo, polarSlateMat, bergCount);
      const bergIces = new THREE.InstancedMesh(bergIceGeo, translucentGlacierMat, bergCount);
      const bergSnows = new THREE.InstancedMesh(bergSnowGeo, snowDriftMat, bergCount);
      for (let i = 0; i < bergCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 24 + ((i * 19) % 62);
        const z = 14 - ((i * 21) % 140);
        const x = (i % 2 === 0 ? -48 : 0) + side * dist;
        const sc = 0.85 + (i % 5) * 0.34;
        const isTallPeak = i % 3 === 0;
        const hScale = isTallPeak ? sc * 1.85 : sc * 0.75;
        const baseY = level.theme.hazardFloorY;

        dummy.position.set(x, baseY + 0.5 * sc, z);
        dummy.rotation.set(0.08, i * 0.8, 0.06);
        dummy.scale.set(sc * 1.35, sc * 0.85, sc * 1.25);
        dummy.updateMatrix();
        bergSlates.setMatrixAt(i, dummy.matrix);

        dummy.position.set(x, baseY + hScale * 2.2, z);
        dummy.rotation.set((i % 3) * 0.1, i * 0.8, (i % 2) * 0.08);
        dummy.scale.set(sc * 1.22, hScale, sc * 1.15);
        dummy.updateMatrix();
        bergIces.setMatrixAt(i, dummy.matrix);

        dummy.position.set(x, baseY + hScale * 3.6, z);
        dummy.rotation.set(0, i * 0.8, 0);
        dummy.scale.set(sc * 1.05, hScale * 0.38, sc * 1.0);
        dummy.updateMatrix();
        bergSnows.setMatrixAt(i, dummy.matrix);
      }
      for (const im of [bergSlates, bergIces, bergSnows]) {
        im.instanceMatrix.needsUpdate = true;
        im.computeBoundingSphere();
      }
      this.levelGroup.add(bergSlates, bergIces, bergSnows);

      // Frozen Lake Ice Floe Plates & Vapor Plumes across the Polar Fjord
      const floeCount = 34;
      const floeGeo = new THREE.CylinderGeometry(3.4, 3.8, 0.42, 8);
      const floes = new THREE.InstancedMesh(floeGeo, snowDriftMat, floeCount);
      for (let i = 0; i < floeCount; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 16 + ((i * 23) % 58);
        const z = 14 - ((i * 25) % 138);
        const x = (i % 2 === 0 ? -46 : 0) + side * dist;
        const sc = 0.72 + (i % 4) * 0.36;
        dummy.position.set(x, level.theme.hazardFloorY + 0.14, z);
        dummy.rotation.set(0, i * 0.65, 0);
        dummy.scale.set(sc * 1.32, 1, sc);
        dummy.updateMatrix();
        floes.setMatrixAt(i, dummy.matrix);
      }
      floes.instanceMatrix.needsUpdate = true;
      floes.computeBoundingSphere();
      this.levelGroup.add(floes);

      // Cold vapor mist banks hovering over the frozen lake & secret cavern entrances
      const lakeVaporSpots: [number, number, number][] = [
        [-14, -12.1, -14],
        [12, -12.1, -24],
        [-33, 6.9, -59],
        [-70, 8.6, -83],
      ];
      for (let v = 0; v < lakeVaporSpots.length; v++) {
        const [vx, vy, vz] = lakeVaporSpots[v];
        const vMesh = new THREE.Mesh(new THREE.SphereGeometry(3.2, 12, 8), vaporMat);
        vMesh.scale.set(1.6, 0.35, 1.3);
        vMesh.position.set(vx, vy, vz);
        this.levelGroup.add(vMesh);
        this.iceVaporPlumes.push({ mesh: vMesh, baseY: vy, phase: v * 1.9 + 0.5 });
      }

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
      const slateInst = new THREE.InstancedMesh(slateGeo, polarSlateMat, iceRockSpots.length);
      const snowCapInst = new THREE.InstancedMesh(this.createDisplacedRockGeometry(0.72, 2.9), snowDriftMat, iceRockSpots.length);
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

      // 7. DYNAMIC BLIZZARD SNOW-SQUALL VEIL BANDS
      const blizzardMat = new THREE.MeshBasicMaterial({
        color: 0xdbeafe,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      for (let b = 0; b < 6; b++) {
        const bMesh = new THREE.Mesh(new THREE.PlaneGeometry(34, 8), blizzardMat);
        bMesh.rotation.y = 0.22 * (b % 2 === 0 ? 1 : -1);
        bMesh.position.set(-22 + (b % 2 === 0 ? -10 : 10), 4 + (b % 3) * 4, -16 - b * 19);
        this.levelGroup.add(bMesh);
        this.iceBlizzardBands.push({
          mesh: bMesh,
          baseX: bMesh.position.x,
          baseZ: bMesh.position.z,
          phase: b * 1.25,
          speed: 3.4 + (b % 3) * 1.1,
        });
      }
    } else if (biome === 'volcanic') {
      // CAÑÓN VOLCÁNICO: Monumental Basalt Cliffs, Hexagonal Basalt Columns, Natural Stone Bridges,
      // Lit Volcanic Caves, Luminous Magma Fissures, Erupting Volcanoes, Geysers, Smoke, Ash, Falling Rocks & Heat Waves
      this.addHorizonMountainRing(0, -125, level.theme.hazardFloorY - 2, 118, 215, 62, 0x12090b, 0x8f1d14, 7.7, 0.94);

      const basaltCliffMat = new THREE.MeshStandardMaterial({
        map: this.textures.volcanicSide,
        emissiveMap: this.textures.volcanicSideEmissive,
        emissive: 0xff5a00,
        emissiveIntensity: 1.42,
        bumpMap: this.textures.basaltBump,
        bumpScale: 0.24,
        roughness: 0.87,
        metalness: 0.16,
      });
      const basaltTopRockMat = new THREE.MeshStandardMaterial({
        map: this.textures.volcanicBasalt,
        emissiveMap: this.textures.volcanicEmissive,
        emissive: 0xff5a00,
        emissiveIntensity: 1.35,
        bumpMap: this.textures.basaltBump,
        bumpScale: 0.2,
        roughness: 0.85,
        metalness: 0.14,
      });
      const magmaPoolMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf97316,
        emissiveIntensity: 2.9,
        roughness: 0.2,
      });
      const lavaJetMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });

      // 1. Sculpted Irregular Basalt Canyon Walls flanking both sides (keeping 2D camera view +X @ z=-38..-84 completely clear!)
      const canyonWallPlacements: [number, number, number, number, number, number][] = [];
      for (let z = 14; z >= -268; z -= 14) {
        const in2DCamClearZone = z <= -36 && z >= -86;
        // West canyon cliff (-X): visible right behind 2D ridge & framing full canyon
        const wx = -25 - Math.abs(Math.sin(z * 0.045)) * 11;
        canyonWallPlacements.push([wx, -2 + Math.cos(z * 0.07) * 2.5, z, 8.5, 22 + Math.abs(Math.sin(z * 0.11)) * 12, 10.5]);
        // Outer high basalt ridge behind West cliff
        canyonWallPlacements.push([wx - 13, 8, z - 6, 12, 30, 14]);

        // East canyon cliff (+X): skip close foreground during 2D ridge camera zone (z = -36..-86) so camera at +13.5 is unobstructed
        if (!in2DCamClearZone) {
          const ex = 26 + Math.abs(Math.cos(z * 0.05)) * 10;
          canyonWallPlacements.push([ex, -1 + Math.sin(z * 0.08) * 2.5, z, 8.5, 22 + Math.abs(Math.cos(z * 0.09)) * 12, 10.5]);
          canyonWallPlacements.push([ex + 13, 9, z - 5, 12, 30, 14]);
        } else {
          // Far behind the 2D camera (+X >= 42) still place rugged distant silhouette peaks
          canyonWallPlacements.push([46, 5, z, 11, 26, 13]);
        }
      }
      const wallGeo = this.createDisplacedRockGeometry(1.0, 6.4);
      const canyonWalls = new THREE.InstancedMesh(wallGeo, basaltCliffMat, canyonWallPlacements.length);
      for (let i = 0; i < canyonWallPlacements.length; i++) {
        const [wx, wy, wz, sx, sy, sz] = canyonWallPlacements[i];
        dummy.position.set(wx, wy, wz);
        dummy.rotation.set(0.06 * Math.sin(i), i * 0.9, 0.05 * Math.cos(i));
        dummy.scale.set(sx, sy * 0.52, sz);
        dummy.updateMatrix();
        canyonWalls.setMatrixAt(i, dummy.matrix);
      }
      canyonWalls.instanceMatrix.needsUpdate = true;
      canyonWalls.computeBoundingSphere();
      this.levelGroup.add(canyonWalls);

      // 2. Dense Hexagonal Columnar Basalt Formations emerging from lava along cliffs & island flanks
      const hexSpecs: [number, number, number, number][] = [];
      for (let i = 0; i < 96; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const z = 12 - i * 2.9;
        const in2DCamClear = z <= -36 && z >= -86 && side > 0;
        const dist = in2DCamClear ? 40 + ((i * 11) % 18) : 17.5 + ((i * 17) % 24);
        const hScale = 0.65 + (i % 5) * 0.34;
        const yOff = -7.5 + (i % 4) * 1.4;
        hexSpecs.push([side * dist, yOff, z, hScale]);
      }
      const hexGeo = new THREE.CylinderGeometry(1.5, 2.1, 18, 6);
      const hexCols = new THREE.InstancedMesh(hexGeo, basaltCliffMat, hexSpecs.length);
      for (let i = 0; i < hexSpecs.length; i++) {
        const [hx, hy, hz, sc] = hexSpecs[i];
        dummy.position.set(hx, hy, hz);
        dummy.rotation.set((i % 3 - 1) * 0.04, (i * 0.52) % Math.PI, (i % 2 === 0 ? 1 : -1) * 0.03);
        dummy.scale.set(0.75 + (i % 3) * 0.25, sc, 0.75 + (i % 3) * 0.25);
        dummy.updateMatrix();
        hexCols.setMatrixAt(i, dummy.matrix);
      }
      hexCols.instanceMatrix.needsUpdate = true;
      hexCols.computeBoundingSphere();
      this.levelGroup.add(hexCols);

      // 3. Monumental Natural Basalt Stone Bridges / Arches spanning high over Canyon & Rocket Flight Corridor
      const archSpecs: { z: number; halfSpan: number; apexY: number; baseY: number; thickness: number }[] = [
        { z: -11.5, halfSpan: 15.5, apexY: 14.5, baseY: -9.5, thickness: 1.55 },
        { z: -114, halfSpan: 19.5, apexY: 20.5, baseY: -9.5, thickness: 1.85 },
        { z: -148, halfSpan: 20.5, apexY: 22.0, baseY: -9.5, thickness: 1.95 },
        { z: -184, halfSpan: 19.5, apexY: 21.0, baseY: -9.5, thickness: 1.85 },
        { z: -226, halfSpan: 17.5, apexY: 22.5, baseY: -4.0, thickness: 1.7 },
      ];
      for (let a = 0; a < archSpecs.length; a++) {
        const spec = archSpecs[a];
        const archPts = [
          new THREE.Vector3(-spec.halfSpan, spec.baseY, spec.z),
          new THREE.Vector3(-spec.halfSpan * 0.62, (spec.baseY + spec.apexY) * 0.48, spec.z + (a % 2 === 0 ? 1.2 : -1.2)),
          new THREE.Vector3(0, spec.apexY, spec.z),
          new THREE.Vector3(spec.halfSpan * 0.62, (spec.baseY + spec.apexY) * 0.48, spec.z - (a % 2 === 0 ? 1.2 : -1.2)),
          new THREE.Vector3(spec.halfSpan, spec.baseY, spec.z),
        ];
        const archCurve = new THREE.CatmullRomCurve3(archPts);
        const archMesh = new THREE.Mesh(
          new THREE.TubeGeometry(archCurve, 22, spec.thickness, 7, false),
          basaltCliffMat
        );
        archMesh.scale.set(1, 0.85, 1.35);
        this.levelGroup.add(archMesh);

        // Glowing underside magma vein tracing the underside of each stone arch
        const veinPts = archPts.map((pt, idx) =>
          new THREE.Vector3(pt.x, pt.y - (idx === 2 ? spec.thickness * 0.72 : 0.4), pt.z)
        );
        const veinMat = new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf97316,
          emissiveIntensity: 1.9,
          roughness: 0.22,
        });
        const veinMesh = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(veinPts), 18, 0.22, 5, false),
          veinMat
        );
        this.levelGroup.add(veinMesh);
        this.volcanicFissureGlows.push({ mat: veinMat, phase: a * 1.1 });

        // Craggy rock buttresses anchoring both arch feet
        for (const sx of [-1, 1]) {
          const foot = new THREE.Mesh(this.createDisplacedRockGeometry(3.2, a * 2 + (sx > 0 ? 1 : 0)), basaltCliffMat);
          foot.position.set(sx * spec.halfSpan, -6.5, spec.z);
          foot.scale.set(1.2, 2.2, 1.3);
          this.levelGroup.add(foot);
        }
      }

      // 4. Lit Volcanic Caves / Magma Grottoes recessed into Canyon Cliffs (including Forja Secreta grotto behind v-secret-forge!)
      const caveSpecs: { pos: [number, number, number]; rotY: number; scale: number }[] = [
        { pos: [-22.5, -1.8, -22], rotY: Math.PI * 0.45, scale: 1.15 },
        { pos: [-22.5, 1.2, -60], rotY: Math.PI * 0.5, scale: 1.2 }, // Visible behind 2D ridge!
        { pos: [22.8, 8.6, -212], rotY: -Math.PI * 0.5, scale: 1.25 }, // Lit forge cave framing v-secret-forge!
        { pos: [-23.5, 7.6, -234], rotY: Math.PI * 0.42, scale: 1.3 },
      ];
      for (let c = 0; c < caveSpecs.length; c++) {
        const cs = caveSpecs[c];
        const cg = new THREE.Group();
        cg.position.set(...cs.pos);
        cg.rotation.y = cs.rotY;
        cg.scale.setScalar(cs.scale);

        // Dark outer basalt cave hood arch + flanking jagged pillars
        const hood = new THREE.Mesh(
          new THREE.TorusGeometry(4.4, 1.45, 7, 14, Math.PI),
          basaltCliffMat
        );
        hood.position.set(0, 2.2, 0);
        cg.add(hood);

        for (const sx of [-1, 1]) {
          const jam = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.45, 5.2, 6), basaltCliffMat);
          jam.position.set(sx * 4.2, 0.2, 0.3);
          cg.add(jam);
        }

        // Deep dark recessed cave chamber shell behind opening
        const darkWallMat = new THREE.MeshStandardMaterial({ color: 0x090406, roughness: 0.96 });
        const chamber = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.6, 5.8, 10, 1, true, 0, Math.PI), darkWallMat);
        chamber.rotation.y = -Math.PI / 2;
        chamber.position.set(0, 2.4, -2.1);
        cg.add(chamber);

        // Glowing interior molten magma pool & radiant ember crystal clusters inside the cave
        const cavePool = new THREE.Mesh(new THREE.CircleGeometry(3.3, 16), magmaPoolMat);
        cavePool.rotation.x = -Math.PI / 2;
        cavePool.position.set(0, -1.7, -1.6);
        cg.add(cavePool);

        for (let k = -1; k <= 1; k++) {
          const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.65, 0), magmaPoolMat);
          shard.scale.set(0.7, 2.1, 0.7);
          shard.position.set(k * 1.65, -0.4, -2.4);
          shard.rotation.z = k * 0.22;
          cg.add(shard);
        }

        // Warm interior orange PointLight illuminating cave mouth & nearby stone (desktop/hardware GL)
        if (!this.isSoftwareGl && c < 3) {
          const caveLight = new THREE.PointLight(0xff7a18, 28, 22, 1.5);
          caveLight.position.set(0, 1.4, -0.8);
          cg.add(caveLight);
        }
        this.levelGroup.add(cg);
      }

      // 5. Hero Erupting Volcanoes (faceted obsidian cones + glowing craters + lava streams + fountain plumes + rising smoke columns)
      const lavaFlowMat = new THREE.MeshStandardMaterial({
        map: this.textures.lavaSurface,
        emissiveMap: this.textures.lavaEmissive,
        emissive: 0xff6a00,
        emissiveIntensity: 2.3,
        roughness: 0.25,
      });
      const smokeMatTemplate = new THREE.MeshBasicMaterial({
        color: 0x261414,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      });

      const volcSpots: [number, number, number, number][] = [
        [-42, -12, -56, 1.15],
        [44, -12, -116, 1.25],
        [-44, -12, -172, 1.2],
        [42, -12, -238, 1.3],
      ];
      for (let idx = 0; idx < volcSpots.length; idx++) {
        const [vx, vy, vz, sc] = volcSpots[idx];
        const vg = new THREE.Group();
        vg.position.set(vx, vy, vz);

        const cone = new THREE.Mesh(new THREE.CylinderGeometry(5.0 * sc, 17.5 * sc, 27 * sc, 9, 1, true), basaltCliffMat);
        cone.position.y = 13.5 * sc;
        const craterGlow = new THREE.Mesh(new THREE.CylinderGeometry(4.7 * sc, 4.3 * sc, 1.0 * sc, 10), magmaPoolMat);
        craterGlow.position.y = 26.4 * sc;
        vg.add(cone, craterGlow);

        // Two glowing molten lava rivers pouring down opposing volcano ridges
        for (let r = 0; r < 2; r++) {
          const streamCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 26.2 * sc, 4.4 * sc),
            new THREE.Vector3((r === 0 ? 0.9 : -0.8) * sc, 14.5 * sc, 10.4 * sc),
            new THREE.Vector3((r === 0 ? -0.5 : 0.7) * sc, 0.6 * sc, 16.4 * sc),
          ]);
          const lavaFlow = new THREE.Mesh(new THREE.TubeGeometry(streamCurve, 12, 0.9 * sc, 6, false), lavaFlowMat);
          lavaFlow.rotation.y = (vx < 0 ? 1 : -1) * (1.05 + r * 0.85);
          vg.add(lavaFlow);
        }

        // Sculpted Lava Eruption Fountain Plume
        for (let j = 0; j < 7; j++) {
          const jAng = (j / 7) * Math.PI * 2 + idx;
          const jCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 26.4 * sc, 0),
            new THREE.Vector3(Math.cos(jAng) * 2.5 * sc, (33 + (j % 3) * 2.5) * sc, Math.sin(jAng) * 2.5 * sc),
            new THREE.Vector3(Math.cos(jAng) * 5.4 * sc, 25.4 * sc, Math.sin(jAng) * 5.4 * sc),
          ]);
          vg.add(new THREE.Mesh(new THREE.TubeGeometry(jCurve, 8, (0.3 + (j % 2) * 0.14) * sc, 5, false), lavaJetMat));

          const drop = new THREE.Mesh(this.createDisplacedRockGeometry(0.58 * sc, j + 1.5), magmaPoolMat);
          drop.position.set(Math.cos(jAng) * 3.9 * sc, (34 + (j % 3) * 2.2) * sc, Math.sin(jAng) * 3.9 * sc);
          vg.add(drop);
        }

        this.levelGroup.add(vg);

        // Towering billowing volcanic smoke column rising above crater
        for (let p = 0; p < 5; p++) {
          const sMat = smokeMatTemplate.clone();
          const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(3.4 * sc, 1), sMat);
          this.levelGroup.add(puff);
          this.volcanicSmokePuffs.push({
            mesh: puff,
            baseX: vx + (p % 2 === 0 ? 1 : -1) * 1.1,
            baseY: vy + 28 * sc,
            baseZ: vz + (p % 3 - 1) * 1.1,
            riseH: 22 * sc,
            speed: 0.24 + (p % 3) * 0.04,
            phase: idx * 0.7 + p * 0.2,
            baseScale: 0.9 + (p % 2) * 0.25,
          });
        }
      }

      // 6. Luminous Glowing Magma Cracks & Basalt Rocks emerging from the Lava River
      const vRockSpots: [number, number, number, number][] = [
        [-4.2, 1.0, 3.8, 0.72],
        [4.2, 1.0, 3.8, 0.68],
        [-3.9, 2.2, -19.8, 0.65],
        [3.9, 2.2, -27.2, 0.62],
        [-4.8, 9.2, -207.2, 0.78],
        [4.8, 9.2, -216.8, 0.74],
        [-4.6, 11.4, -244.4, 0.8],
        [4.6, 11.4, -244.4, 0.75],
        [-14, -11.4, -16, 2.2],
        [15, -11.4, -28, 2.3],
        [-14, -11.4, -52, 2.4],
        [-15, -11.4, -76, 2.1],
        [16, -11.4, -104, 2.5],
        [-16, -11.4, -138, 2.6],
        [17, -11.4, -170, 2.3],
        [-17, -11.4, -198, 2.5],
        [-19, -11.4, -230, 2.4],
        [20, -11.4, -236, 2.5],
      ];
      const vRockGeo = this.createDisplacedRockGeometry(1.0, 8.1);
      const vRocksInst = new THREE.InstancedMesh(vRockGeo, basaltTopRockMat, vRockSpots.length);
      for (let i = 0; i < vRockSpots.length; i++) {
        const [rx, ry, rz, rs] = vRockSpots[i];
        dummy.position.set(rx, ry + 0.25 * rs, rz);
        dummy.rotation.set(0.1, i * 1.2, 0);
        dummy.scale.set(rs * 1.28, rs * 0.78, rs);
        dummy.updateMatrix();
        vRocksInst.setMatrixAt(i, dummy.matrix);
      }
      vRocksInst.instanceMatrix.needsUpdate = true;
      vRocksInst.computeBoundingSphere();
      this.levelGroup.add(vRocksInst);

      // Glowing magma rings / fissures around emerged river rocks
      for (let i = 8; i < vRockSpots.length; i++) {
        const [rx, , rz, rs] = vRockSpots[i];
        const fMat = new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xf97316,
          emissiveIntensity: 1.9,
          roughness: 0.2,
        });
        const fRing = new THREE.Mesh(new THREE.TorusGeometry(rs * 1.15, 0.14, 6, 16), fMat);
        fRing.rotation.x = Math.PI / 2;
        fRing.position.set(rx, level.theme.hazardFloorY + 0.14, rz);
        this.levelGroup.add(fRing);
        this.volcanicFissureGlows.push({ mat: fMat, phase: i * 0.65 });
      }

      // 7. Animated Lava Bubbles & Popping Blisters along the magma chasm floor
      const bubbleSpots: [number, number, number][] = [
        [-8, -11.8, -8],
        [8, -11.8, -18],
        [-9, -11.8, -34],
        [-7, -11.8, -50],
        [6, -11.8, -62],
        [-8, -11.8, -74],
        [-10, -11.8, -106],
        [10, -11.8, -124],
        [-11, -11.8, -156],
        [10, -11.8, -182],
        [-11, -11.8, -216],
        [12, -11.8, -232],
      ];
      const bubbleMatBase = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf97316,
        emissiveIntensity: 2.4,
        roughness: 0.15,
      });
      for (let b = 0; b < bubbleSpots.length; b++) {
        const [bx, by, bz] = bubbleSpots[b];
        const bMesh = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), bubbleMatBase.clone());
        bMesh.position.set(bx, by, bz);
        this.levelGroup.add(bMesh);
        this.volcanicBubbles.push({
          mesh: bMesh,
          pos: new THREE.Vector3(bx, by, bz),
          phase: b * 0.85,
          period: 2.4 + (b % 3) * 0.55,
          popped: false,
          maxR: 1.05 + (b % 3) * 0.35,
        });
      }

      // 8. Lava & Steam Geysers erupting along canyon ledges & magma floor (well clear of 2D camera & flight path)
      const geyserSpecs: { pos: [number, number, number]; kind: 'lava' | 'steam'; period: number }[] = [
        { pos: [-11.5, -11.5, -14], kind: 'lava', period: 4.2 },
        { pos: [12.5, -11.5, -32], kind: 'steam', period: 3.8 },
        { pos: [-13.5, -11.5, -56], kind: 'lava', period: 4.4 },
        { pos: [-14.5, -11.5, -72], kind: 'steam', period: 3.6 },
        { pos: [14.5, -11.5, -122], kind: 'lava', period: 4.5 },
        { pos: [-15.0, -11.5, -146], kind: 'steam', period: 4.0 },
        { pos: [14.8, -11.5, -178], kind: 'lava', period: 4.3 },
        { pos: [-15.5, -11.5, -220], kind: 'steam', period: 3.9 },
      ];
      for (let g = 0; g < geyserSpecs.length; g++) {
        const gs = geyserSpecs[g];
        const gGroup = new THREE.Group();
        gGroup.position.set(...gs.pos);

        const ventRock = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 2.2, 1.4, 7), basaltCliffMat);
        ventRock.position.y = 0.7;
        gGroup.add(ventRock);

        const isLava = gs.kind === 'lava';
        const jetMat = new THREE.MeshBasicMaterial({
          color: isLava ? 0xfdba74 : 0xd6d3d1,
          transparent: true,
          opacity: isLava ? 0.85 : 0.45,
          depthWrite: false,
        });
        const lavaJet = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.05, 12, 8, 1, true), jetMat);
        lavaJet.position.y = 6;
        gGroup.add(lavaJet);

        const steamMat = new THREE.MeshBasicMaterial({
          color: isLava ? 0xf97316 : 0xe7e5e4,
          transparent: true,
          opacity: 0.36,
          depthWrite: false,
        });
        const steamPlume = new THREE.Mesh(new THREE.DodecahedronGeometry(1.75, 1), steamMat);
        steamPlume.position.y = 10;
        gGroup.add(steamPlume);

        this.levelGroup.add(gGroup);
        this.volcanicGeysers.push({
          lavaJet,
          steamPlume,
          pos: new THREE.Vector3(...gs.pos),
          phase: g * 1.15,
          period: gs.period,
          kind: gs.kind,
        });
      }

      // 9. Falling Canyon Rocks tumbling from outer cliffs into lava river with bright magma splashes
      const rockFallSpots: [number, number, number][] = [
        [-19, 18, -26],
        [-20, 21, -66],
        [18, 22, -118],
        [-19, 23, -152],
        [18, 22, -188],
        [-20, 24, -228],
      ];
      const fallingRockGeo = this.createDisplacedRockGeometry(0.95, 3.3);
      for (let r = 0; r < rockFallSpots.length; r++) {
        const [rx, ry, rz] = rockFallSpots[r];
        const fMesh = new THREE.Mesh(fallingRockGeo, basaltTopRockMat);
        fMesh.position.set(rx, ry, rz);
        fMesh.scale.setScalar(0.9 + (r % 2) * 0.3);
        this.levelGroup.add(fMesh);
        this.volcanicFallingRocks.push({
          mesh: fMesh,
          startX: rx,
          startY: ry,
          startZ: rz,
          phase: r * 1.1,
          period: 3.6 + (r % 3) * 0.7,
          splashed: false,
          rotAxis: new THREE.Vector3(0.7, 0.5, 0.4).normalize(),
        });
      }

      // 10. Visible Heat Waves hovering over lava fissures, vents & forge cliff
      const heatWaveSpots: [number, number, number, number, number][] = [
        [0, -9.0, -16, 12, 6.5],
        [-8, -8.5, -58, 10, 7.0],
        [0, -8.5, -130, 14, 8.0],
        [12.5, 9.6, -212, 6.5, 5.2],
        [0, -8.5, -224, 14, 7.5],
      ];
      for (let h = 0; h < heatWaveSpots.length; h++) {
        const [hx, hy, hz, hw, hh] = heatWaveSpots[h];
        const hMat = createHeatWaveShaderMaterial(this.shaderTimeUniform, 0xfb923c, 0.24, h * 1.4);
        const hMesh = new THREE.Mesh(new THREE.PlaneGeometry(hw, hh, 8, 8), hMat);
        hMesh.position.set(hx, hy + hh * 0.5, hz);
        hMesh.rotation.y = h === 3 ? Math.PI * 0.5 : (h % 2 === 0 ? 0.2 : -0.2);
        this.levelGroup.add(hMesh);
      }

      // 11. Floating Volcanic Ash Flakes (InstancedMesh tumbling around player view)
      const ashCount = this.isSoftwareGl ? 65 : 140;
      const ashGeo = new THREE.PlaneGeometry(0.18, 0.24);
      const ashMat = new THREE.MeshBasicMaterial({
        color: 0x3b2626,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this.volcanicAshMesh = new THREE.InstancedMesh(ashGeo, ashMat, ashCount);
      this.volcanicAshMesh.frustumCulled = false;
      this.volcanicAshStates = [];
      for (let i = 0; i < ashCount; i++) {
        const st = {
          x: (Math.random() - 0.5) * 44,
          y: Math.random() * 20 - 4,
          z: (Math.random() - 0.5) * 44,
          fallSpeed: 0.7 + Math.random() * 0.9,
          swayPhase: Math.random() * Math.PI * 2,
          rotSpeed: 1.4 + Math.random() * 2.2,
        };
        this.volcanicAshStates.push(st);
        dummy.position.set(st.x, st.y, st.z);
        dummy.updateMatrix();
        this.volcanicAshMesh.setMatrixAt(i, dummy.matrix);
      }
      this.volcanicAshMesh.instanceMatrix.needsUpdate = true;
      this.volcanicAshMesh.computeBoundingSphere();
      this.levelGroup.add(this.volcanicAshMesh);
    } else if (biome === 'nebula') {
      // CIUDADELA NEBULOSA: Monumental Suspended Futuristic Sky-Civilization, Floating Islands + Void Waterfalls,
      // Grand Orbital Stargates, Volumetric Clouds & Multi-Planet Cosmic Panorama
      // Keep the 2D wall (+Z) camera corridor [x:-4..44, z:-75..-52, y>2] crystal clear!

      const hullMat = new THREE.MeshStandardMaterial({
        map: this.textures.nebulaSide,
        bumpMap: this.textures.nebulaBump,
        bumpScale: 0.12,
        metalness: 0.78,
        roughness: 0.24,
      });
      const deckMat = new THREE.MeshStandardMaterial({
        map: this.textures.nebulaDeck,
        bumpMap: this.textures.nebulaBump,
        bumpScale: 0.1,
        metalness: 0.65,
        roughness: 0.26,
      });
      const chromeMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.9,
        roughness: 0.14,
      });
      const goldTechMat = new THREE.MeshStandardMaterial({
        map: this.textures.goldTrim,
        color: 0xfbbf24,
        emissive: 0xb45309,
        emissiveIntensity: 0.45,
        metalness: 0.86,
        roughness: 0.22,
      });
      const cyanGlowMat = new THREE.MeshStandardMaterial({
        color: 0x67e8f9,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.95,
        roughness: 0.15,
      });
      const violetGlowMat = new THREE.MeshStandardMaterial({
        color: 0xe879f9,
        emissive: 0xa855f7,
        emissiveIntensity: 1.85,
        roughness: 0.18,
      });
      const glassDomeMat = new THREE.MeshPhysicalMaterial({
        color: 0x7dd3fc,
        emissive: 0x0e7490,
        emissiveIntensity: 0.42,
        roughness: 0.08,
        metalness: 0.18,
        clearcoat: 1.0,
        transparent: true,
        opacity: 0.82,
      });
      const holoCyanMat = createHologramShaderMaterial(this.shaderTimeUniform, 0x22d3ee, 0.52, 0.4);
      const holoVioletMat = createHologramShaderMaterial(this.shaderTimeUniform, 0xc084fc, 0.46, 1.9);

      // Helper: Sculpted Futuristic Sky-Citadel Tower / Floating Building (3 distinct original silhouettes)
      const buildCitadelTower = (
        x: number,
        y: number,
        z: number,
        scale: number,
        variant: 'spire' | 'observatory' | 'twinwing',
        floatAmp = 0.42
      ) => {
        const g = new THREE.Group();
        g.position.set(x, y, z);

        // Anti-gravity thruster hull base tapering into a glowing energy needle below
        const thrusterHull = new THREE.Mesh(new THREE.CylinderGeometry(2.8 * scale, 0.9 * scale, 4.6 * scale, 8), hullMat);
        thrusterHull.position.y = -2.3 * scale;
        const lowerSpire = new THREE.Mesh(new THREE.ConeGeometry(1.1 * scale, 5.2 * scale, 8), chromeMat);
        lowerSpire.rotation.x = Math.PI;
        lowerSpire.position.y = -7.1 * scale;
        const coreCrystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.95 * scale, 0), cyanGlowMat);
        coreCrystal.scale.set(0.75, 1.8, 0.75);
        coreCrystal.position.y = -10.1 * scale;
        g.add(thrusterHull, lowerSpire, coreCrystal);

        if (variant === 'spire') {
          const midBody = new THREE.Mesh(new THREE.CylinderGeometry(1.9 * scale, 2.65 * scale, 9.5 * scale, 8), hullMat);
          midBody.position.y = 4.7 * scale;
          const upperShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.85 * scale, 1.65 * scale, 8.2 * scale, 8), chromeMat);
          upperShaft.position.y = 13.4 * scale;
          const antenna = new THREE.Mesh(new THREE.ConeGeometry(0.45 * scale, 4.4 * scale, 6), cyanGlowMat);
          antenna.position.y = 19.6 * scale;
          g.add(midBody, upperShaft, antenna);

          const halo = new THREE.Mesh(new THREE.TorusGeometry(3.2 * scale, 0.16 * scale, 8, 28), holoCyanMat);
          halo.rotation.x = Math.PI / 2 + 0.18;
          halo.position.y = 11.2 * scale;
          g.add(halo);
          this.nebulaSpinners.push({ obj: halo, speed: 0.65, axis: 'z' });
        } else if (variant === 'observatory') {
          const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.6 * scale, 2.9 * scale, 5.8 * scale, 10), hullMat);
          pedestal.position.y = 2.9 * scale;
          const ringCollar = new THREE.Mesh(new THREE.TorusGeometry(3.3 * scale, 0.24 * scale, 8, 28), goldTechMat);
          ringCollar.rotation.x = Math.PI / 2;
          ringCollar.position.y = 5.9 * scale;
          const dome = new THREE.Mesh(new THREE.SphereGeometry(2.45 * scale, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), glassDomeMat);
          dome.position.y = 5.8 * scale;
          const innerCore = new THREE.Mesh(new THREE.OctahedronGeometry(1.15 * scale, 0), violetGlowMat);
          innerCore.position.y = 7.1 * scale;
          g.add(pedestal, ringCollar, dome, innerCore);

          const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(4.1 * scale, 0.13 * scale, 8, 28), holoVioletMat);
          orbitRing.position.y = 7.1 * scale;
          orbitRing.rotation.set(0.42, 0.2, 0.15);
          g.add(orbitRing);
          this.nebulaSpinners.push({ obj: orbitRing, speed: 0.72, axis: 'y' });
        } else {
          // Cantilevered twin-wing floating skyscraper connected by glowing energy sky-ribs
          for (const sx of [-1, 1]) {
            const wing = new THREE.Mesh(new THREE.CylinderGeometry(1.15 * scale, 1.45 * scale, 12.2 * scale, 6), hullMat);
            wing.position.set(sx * 1.65 * scale, 6.0 * scale, 0);
            const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.62 * scale, 0), cyanGlowMat);
            cap.scale.set(0.7, 1.9, 0.7);
            cap.position.set(sx * 1.65 * scale, 12.9 * scale, 0);
            g.add(wing, cap);
          }
          for (const by of [3.4, 7.6, 10.6]) {
            const bridgeBar = new THREE.Mesh(new THREE.BoxGeometry(3.2 * scale, 0.35 * scale, 0.9 * scale), goldTechMat);
            bridgeBar.position.y = by * scale;
            g.add(bridgeBar);
          }
          const holoCrown = new THREE.Mesh(new THREE.TorusGeometry(2.9 * scale, 0.14 * scale, 8, 24), holoCyanMat);
          holoCrown.rotation.x = Math.PI / 2;
          holoCrown.position.y = 12.2 * scale;
          g.add(holoCrown);
          this.nebulaSpinners.push({ obj: holoCrown, speed: -0.55, axis: 'z' });
        }

        this.levelGroup.add(g);
        this.nebulaFloatNodes.push({ obj: g, baseY: y, amp: floatAmp, speed: 0.75 + (Math.abs(x + z) % 5) * 0.12, phase: (x * 0.3 + z * 0.2) });
        return g;
      };

      // Towering Futuristic Skyline flanking main skyways + hidden paths + behind 2D Nebula Wall (z < -85)
      const towerPlacements: [number, number, number, number, 'spire' | 'observatory' | 'twinwing'][] = [
        // Left & right horizon framing start & mid-citadel
        [-22, -1, 4, 1.15, 'spire'],
        [22, 0, 2, 1.1, 'observatory'],
        [-26, 2, -26, 1.35, 'twinwing'],
        [27, 3, -18, 1.2, 'spire'],
        // Hidden path #1 twin buildings framing secret Switch Bridge -> Reliquary Dais [14, 4.4, -36]
        [14, 2.5, -45.5, 0.72, 'observatory'],
        [14, 2.5, -26.5, 0.72, 'observatory'],
        // Mid skyway guardians
        [-24, 5, -52, 1.25, 'spire'],
        [-38, 1, -72, 1.45, 'twinwing'],
        // Monumental Skyline BEHIND 2D Nebula Wall (z = -90..-108) -> dramatic backdrop in 2D camera view!
        [4, 8, -94, 1.3, 'spire'],
        [20, 9, -92, 1.15, 'observatory'],
        [36, 10, -96, 1.4, 'twinwing'],
        [52, 7, -80, 1.35, 'spire'],
        // Hidden path #2 twin buildings framing n-app-side [-11, 11.4, -117]
        [-11, 9.5, -126.5, 0.74, 'spire'],
        [-11, 9.5, -107.5, 0.74, 'spire'],
        // Grand Boss Citadel Perimeter Spires
        [-28, 11, -138, 1.5, 'twinwing'],
        [28, 11, -138, 1.5, 'twinwing'],
        [-22, 12, -162, 1.4, 'spire'],
        [22, 12, -162, 1.4, 'spire'],
      ];
      for (const [tx, ty, tz, ts, tv] of towerPlacements) {
        buildCitadelTower(tx, ty, tz, ts, tv);
      }

      // Luminous High-Altitude Sky-Bridges spanning between distant towers & framing hidden corridors
      const skyBridges: [number, number, number, number, number, number][] = [
        // Overhead luminous archway framing Secret Switch route at [9.5, 9.2, -36]
        [14, 10.6, -36, 0.45, 0.45, 19.0],
        // Overhead luminous archway framing Hidden Disappearing Relic route at [-11, 16.8, -117]
        [-11, 17.5, -117, 0.45, 0.45, 19.0],
        // High skyline sky-bridge behind 2D wall
        [20, 18.5, -94, 34, 0.4, 0.75],
      ];
      for (const [bx, by, bz, bw, bh, bd] of skyBridges) {
        const beam = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), holoCyanMat);
        beam.position.set(bx, by, bz);
        this.levelGroup.add(beam);
      }

      // Grand Circular Orbital Stargates & Concentric Gyroscopes
      const buildGrandCircularGate = (x: number, y: number, z: number, radius: number, rotY = 0) => {
        const gate = new THREE.Group();
        gate.position.set(x, y, z);
        gate.rotation.y = rotY;

        const outerRing = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.048, 10, 48), hullMat);
        const midRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.84, radius * 0.028, 8, 42), goldTechMat);
        const holoRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.72, radius * 0.032, 8, 36), holoCyanMat);
        const innerRing = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.56, radius * 0.022, 8, 32), holoVioletMat);
        gate.add(outerRing, midRing, holoRing, innerRing);

        // 4 cardinal node beacons on outer stargate ring
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2;
          const node = new THREE.Mesh(new THREE.OctahedronGeometry(radius * 0.085, 0), cyanGlowMat);
          node.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
          gate.add(node);
        }

        this.levelGroup.add(gate);
        this.nebulaSpinners.push({ obj: midRing, speed: 0.45, axis: 'z' });
        this.nebulaSpinners.push({ obj: holoRing, speed: -0.78, axis: 'y' });
        this.nebulaSpinners.push({ obj: innerRing, speed: 0.95, axis: 'x' });
      };

      // Stargate framing entry skyway above n-conv1 -> n-2d-entry (high archway clearance!)
      buildGrandCircularGate(0, 12.6, -54, 8.8, 0);
      // Giant backdrop astrolabe stargates behind 2D Nebula Wall (visible behind Astro in 2D section!)
      buildGrandCircularGate(12, 16.5, -96, 10.5, 0.14);
      buildGrandCircularGate(30, 18.0, -98, 9.2, -0.18);
      // Colossal Citadel Halo behind Titán Kraxus Arena & Goal Portal
      buildGrandCircularGate(0, 21.5, -162, 19.5, 0);

      // Floating Sky-Islands with Elevated Sky-Gardens & Waterfalls Plunging into the Cosmic Void
      const islandRockGeo = this.createDisplacedRockGeometry(1.0, 5.3);
      const islandRockMat = new THREE.MeshStandardMaterial({
        color: 0x312369,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.18,
        roughness: 0.78,
        metalness: 0.24,
      });
      const gardenTurfMat = new THREE.MeshStandardMaterial({
        color: 0x14b8a6,
        emissive: 0x0f766e,
        emissiveIntensity: 0.35,
        roughness: 0.7,
      });
      const silverTreeBarkMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        metalness: 0.48,
        roughness: 0.45,
      });
      const islandCanopyMat = new THREE.MeshStandardMaterial({
        color: 0x2dd4bf,
        emissive: 0x0891b2,
        emissiveIntensity: 0.62,
        roughness: 0.42,
      });

      this.nebulaWaterfallTex = this.textures.waterfallSurface.clone();
      this.nebulaWaterfallTex.repeat.set(1, 3.2);
      this.nebulaWaterfallTex.needsUpdate = true;
      const voidWaterfallMat = new THREE.MeshPhysicalMaterial({
        map: this.nebulaWaterfallTex,
        color: 0xa5f3fc,
        emissive: 0x06b6d4,
        emissiveIntensity: 0.72,
        roughness: 0.08,
        clearcoat: 1.0,
        transparent: true,
        opacity: 0.84,
        side: THREE.DoubleSide,
      });

      const floatingIslands: [number, number, number, number, boolean][] = [
        [-16.5, 1.5, -14, 3.2, true],
        [17.5, 3.2, -20, 3.4, true],
        [-18.0, 5.5, -44, 3.6, true],
        [24.0, 6.2, -52, 3.8, false],
        [-16.5, 10.5, -90, 4.0, true],
        [46.0, 11.0, -92, 4.2, true],
        [-22.0, 12.5, -128, 4.2, false],
        [23.0, 12.8, -126, 4.4, true],
        [0.0, 12.0, -172, 5.8, true],
      ];

      for (let i = 0; i < floatingIslands.length; i++) {
        const [ix, iy, iz, ir, hasWaterfall] = floatingIslands[i];
        const island = new THREE.Group();
        island.position.set(ix, iy, iz);

        // Inverted sculpted crag + astral rim terrace
        const rockBody = new THREE.Mesh(islandRockGeo, islandRockMat);
        rockBody.scale.set(ir * 1.15, ir * 1.35, ir * 1.15);
        rockBody.rotation.set(Math.PI, i * 0.9, 0);
        rockBody.position.y = -ir * 0.85;
        island.add(rockBody);

        const cap = new THREE.Mesh(new THREE.CylinderGeometry(ir * 1.06, ir * 0.96, 0.55, 10), deckMat);
        cap.position.y = 0.25;
        const turf = new THREE.Mesh(new THREE.CylinderGeometry(ir * 0.92, ir * 0.96, 0.2, 10), gardenTurfMat);
        turf.position.y = 0.54;
        const energyCore = new THREE.Mesh(new THREE.OctahedronGeometry(ir * 0.28, 0), cyanGlowMat);
        energyCore.scale.set(0.7, 1.8, 0.7);
        energyCore.position.y = -ir * 2.15;
        island.add(cap, turf, energyCore);

        // Elevated Sky-Garden celestial trees & crystal shrines atop each floating island
        for (let t = 0; t < 2; t++) {
          const ang = i * 1.1 + t * 2.5;
          const tx = Math.cos(ang) * (ir * 0.42);
          const tz = Math.sin(ang) * (ir * 0.42);
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.26, 2.1, 7), silverTreeBarkMat);
          trunk.position.set(tx, 1.55, tz);
          trunk.rotation.z = t === 0 ? 0.12 : -0.14;
          const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 1), islandCanopyMat);
          c1.scale.set(1.25, 0.72, 1.25);
          c1.position.set(tx, 2.65, tz);
          const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), islandCanopyMat);
          c2.scale.set(1.15, 0.68, 1.15);
          c2.position.set(tx + 0.35, 3.1, tz - 0.2);
          const bloom = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), violetGlowMat);
          bloom.position.set(tx - 0.3, 2.95, tz + 0.25);
          island.add(trunk, c1, c2, bloom);
        }

        // Waterfall spilling off the floating island rim down into the cosmic void below!
        if (hasWaterfall) {
          const faceTowardCenter = Math.atan2(-ix, -iz);
          const wfW = ir * 0.56;
          const wfH = Math.max(13, iy + 13.8);
          const edgeR = ir * 0.96;
          const ex = Math.sin(faceTowardCenter) * edgeR;
          const ez = Math.cos(faceTowardCenter) * edgeR;

          const springPool = new THREE.Mesh(new THREE.CylinderGeometry(wfW * 0.8, wfW * 0.8, 0.14, 12), voidWaterfallMat);
          springPool.position.set(ex * 0.55, 0.62, ez * 0.55);
          island.add(springPool);

          const fallSheet = new THREE.Mesh(new THREE.PlaneGeometry(wfW, wfH, 1, 8), voidWaterfallMat);
          fallSheet.position.set(ex, 0.55 - wfH * 0.5, ez);
          fallSheet.rotation.y = faceTowardCenter;
          island.add(fallSheet);

          const lipMist = new THREE.Mesh(
            new THREE.TorusGeometry(wfW * 0.48, 0.22, 7, 16),
            new THREE.MeshBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.42, depthWrite: false })
          );
          lipMist.rotation.x = Math.PI / 2;
          lipMist.position.set(ex, 0.45, ez);
          island.add(lipMist);

          this.nebulaWaterfallDrops.push(new THREE.Vector3(ix + ex, iy + 0.4, iz + ez));
        }

        this.levelGroup.add(island);
        this.nebulaFloatNodes.push({ obj: island, baseY: iy, amp: 0.38, speed: 0.68 + (i % 3) * 0.14, phase: i * 1.3 });
      }

      // Volumetric Drifting Cosmic Clouds at multiple altitudes (low abyss mist + mid-sky + upper aurora clouds)
      const cloudDefs: [number, number, number, number, number, number][] = [
        [-28, -6.5, -10, 1.4, 0.55, 0xa5f3fc],
        [30, -5.8, -32, 1.5, -0.45, 0xc4b5fd],
        [-32, -4.5, -62, 1.65, 0.42, 0x93c5fd],
        [48, -4.8, -74, 1.55, -0.5, 0xe879f9],
        [-26, -3.5, -104, 1.75, 0.48, 0xa5f3fc],
        [34, -3.2, -122, 1.65, -0.4, 0xc4b5fd],
        [-36, 22.0, -40, 1.85, 0.65, 0xbae6fd],
        [38, 24.5, -68, 1.9, -0.55, 0xd8b4fe],
        [-34, 26.0, -118, 2.0, 0.52, 0x99f6e4],
        [36, 26.5, -148, 2.1, -0.6, 0xc4b5fd],
      ];
      for (let c = 0; c < cloudDefs.length; c++) {
        const [cx, cy, cz, cs, cSpeed, cHex] = cloudDefs[c];
        const cg = new THREE.Group();
        cg.position.set(cx, cy, cz);
        const cloudMat = new THREE.MeshBasicMaterial({
          color: cHex,
          transparent: true,
          opacity: 0.24,
          depthWrite: false,
        });
        for (let p = 0; p < 5; p++) {
          const puff = new THREE.Mesh(new THREE.DodecahedronGeometry((2.4 + (p % 3) * 0.8) * cs, 1), cloudMat);
          puff.scale.set(1.65, 0.55, 1.15);
          puff.position.set((p - 2) * 2.2 * cs, (p % 2 === 0 ? 0.45 : -0.25) * cs, Math.sin(p * 1.4) * 1.4 * cs);
          cg.add(puff);
        }
        this.levelGroup.add(cg);
        this.nebulaCloudBanks.push({ group: cg, baseX: cx, baseY: cy, baseZ: cz, spanX: 7.5, speed: cSpeed, phase: c * 1.1 });
      }

      // Multi-Distance 3D Planets & Moons across the Cosmic Vista
      // 1. Giant Luminous Ringed Cyan-Pearl Gas Giant
      const gasGiant = new THREE.Group();
      gasGiant.position.set(18, 46, -212);
      const giantSphere = new THREE.Mesh(
        new THREE.SphereGeometry(22, 32, 24),
        new THREE.MeshStandardMaterial({
          color: 0xa5f3fc,
          emissive: 0x0891b2,
          emissiveIntensity: 0.72,
          roughness: 0.38,
        })
      );
      const ringOuter = new THREE.Mesh(
        new THREE.TorusGeometry(36, 2.8, 8, 56),
        new THREE.MeshBasicMaterial({ color: 0xcffafe, transparent: true, opacity: 0.58 })
      );
      ringOuter.rotation.set(1.22, 0.24, -0.26);
      const ringInner = new THREE.Mesh(
        new THREE.TorusGeometry(28.5, 1.3, 8, 48),
        new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.45 })
      );
      ringInner.rotation.set(1.22, 0.24, -0.26);
      gasGiant.add(giantSphere, ringOuter, ringInner);
      this.levelGroup.add(gasGiant);
      this.nebulaSpinners.push({ obj: giantSphere, speed: 0.04, axis: 'y' });

      // 2. Amethyst-Indigo Ringed Moon (upper left horizon)
      const amethystMoon = new THREE.Group();
      amethystMoon.position.set(-78, 36, -160);
      const aSphere = new THREE.Mesh(
        new THREE.SphereGeometry(9.5, 24, 18),
        new THREE.MeshStandardMaterial({
          color: 0xd8b4fe,
          emissive: 0x6d28d9,
          emissiveIntensity: 0.52,
          roughness: 0.5,
        })
      );
      const aHalo = new THREE.Mesh(
        new THREE.TorusGeometry(14.5, 0.7, 6, 36),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 })
      );
      aHalo.rotation.set(1.1, -0.35, 0.2);
      amethystMoon.add(aSphere, aHalo);
      this.levelGroup.add(amethystMoon);

      // 3. Distant Turquoise-Coral Exoplanet (right vista)
      const coralPlanet = new THREE.Mesh(
        new THREE.SphereGeometry(6.8, 20, 16),
        new THREE.MeshStandardMaterial({
          color: 0xfbcfe8,
          emissive: 0xbe185d,
          emissiveIntensity: 0.42,
          roughness: 0.52,
        })
      );
      coralPlanet.position.set(84, 30, -142);
      this.levelGroup.add(coralPlanet);
    } else if (biome === 'paris') {
      const floorY = level.theme.hazardFloorY;

      // Iconic Eiffel Tower standing beneath the summit launch deck & monumental Arc de Triomphe at Champs-Élysées Plaza
      const eiffel = createEiffelTowerMesh(this.textures.parisStone);
      eiffel.position.set(0, floorY, 0);
      this.levelGroup.add(eiffel);

      const arc = createArcDeTriompheMesh(this.textures.parisStone);
      arc.position.set(0, 4.5, -367);
      this.levelGroup.add(arc);

      // Shared golden-sunset Parisian architectural materials
      const limestoneMat = new THREE.MeshStandardMaterial({
        map: this.textures.parisStone,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.14,
        roughness: 0.78,
        metalness: 0.05,
      });
      const facadeMat = new THREE.MeshStandardMaterial({
        map: this.textures.parisFacade,
        emissiveMap: this.textures.parisFacadeEmissive,
        emissive: 0xffb347,
        emissiveIntensity: 1.15,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.1,
        roughness: 0.76,
        metalness: 0.06,
      });
      const mansardRoofMat = new THREE.MeshStandardMaterial({
        map: this.textures.parisRoof,
        roughness: 0.48,
        metalness: 0.42,
      });
      const copperDomeMat = new THREE.MeshStandardMaterial({
        color: 0x3b8b7f,
        emissive: 0x0f3d37,
        emissiveIntensity: 0.16,
        roughness: 0.36,
        metalness: 0.56,
      });
      const giltMat = new THREE.MeshStandardMaterial({
        map: this.textures.goldTrim,
        color: 0xfbbf24,
        emissive: 0x92400e,
        emissiveIntensity: 0.38,
        metalness: 0.86,
        roughness: 0.22,
      });
      const ironMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.82,
        roughness: 0.3,
      });
      const warmWindowMat = new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        emissive: 0xf59e0b,
        emissiveIntensity: 2.0,
        roughness: 0.18,
      });
      const terracottaMat = new THREE.MeshStandardMaterial({
        color: 0xc26546,
        roughness: 0.85,
      });
      const lawnDarkMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleGrass,
        color: 0x5c8f2b,
        roughness: 0.86,
      });
      const lawnCenterMat = new THREE.MeshStandardMaterial({
        color: 0x73ab38,
        roughness: 0.84,
      });
      const ochrePathMat = new THREE.MeshStandardMaterial({
        color: 0xd19a63,
        roughness: 0.88,
      });
      const flowerMatA = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0x881337, emissiveIntensity: 0.2, roughness: 0.6 });
      const flowerMatB = new THREE.MeshStandardMaterial({ color: 0xfbbf24, emissive: 0x78350f, emissiveIntensity: 0.2, roughness: 0.6 });

      // Segmented Champ de Mars & Tuileries Avenue islands separated by 3 visible Seine River channels
      const avenueSegments: [number, number][] = [
        [-22, 92],   // z in [-68, +24]
        [-140, 56],  // z in [-168, -112]
        [-238, 48],  // z in [-262, -214]
        [-345, 78],  // z in [-384, -306]
      ];
      for (const [segZ, segLen] of avenueSegments) {
        const quayBase = new THREE.Mesh(new THREE.BoxGeometry(36.2, 0.9, segLen), limestoneMat);
        quayBase.position.set(0, floorY + 0.12, segZ);
        quayBase.receiveShadow = true;
        this.levelGroup.add(quayBase);

        const centralLawn = new THREE.Mesh(new THREE.BoxGeometry(18.5, 0.4, segLen - 1.2), lawnDarkMat);
        centralLawn.position.set(0, floorY + 0.62, segZ);
        centralLawn.receiveShadow = true;
        const centralStripe = new THREE.Mesh(new THREE.PlaneGeometry(7.6, segLen - 2.4), lawnCenterMat);
        centralStripe.rotation.x = -Math.PI / 2;
        centralStripe.position.set(0, floorY + 0.84, segZ);
        this.levelGroup.add(centralLawn, centralStripe);

        for (const sx of [-1, 1]) {
          const path = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.36, segLen - 0.6), ochrePathMat);
          path.position.set(sx * 12.8, floorY + 0.58, segZ);
          path.receiveShadow = true;
          const quayCoping = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.62, segLen), limestoneMat);
          quayCoping.position.set(sx * 17.5, floorY + 0.72, segZ);
          this.levelGroup.add(path, quayCoping);
        }

        // Formal Tuileries floral parterres & wrought-iron streetlamps along segment edges
        const lampStep = 18;
        const zStart = segZ + segLen * 0.42;
        const zEnd = segZ - segLen * 0.42;
        for (let lz = zStart; lz >= zEnd; lz -= lampStep) {
          for (const sx of [-1, 1]) {
            const bed = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 4.2), sx > 0 ? flowerMatA : flowerMatB);
            bed.position.set(sx * 7.8, floorY + 0.88, lz);
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 2.6, 6), ironMat);
            post.position.set(sx * 16.5, floorY + 2.0, lz);
            const globe = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), warmWindowMat);
            globe.position.set(sx * 16.5, floorY + 3.4, lz);
            this.levelGroup.add(bed, post, globe);
          }
        }
      }

      // Flanking Parisian riverside quays along outer boulevards (framing the 3 Seine river waterways)
      for (const sx of [-1, 1]) {
        for (const [segZ, segLen] of avenueSegments) {
          const outerQuay = new THREE.Mesh(new THREE.BoxGeometry(38, 1.4, segLen), limestoneMat);
          outerQuay.position.set(sx * 39, floorY + 0.3, segZ);
          outerQuay.receiveShadow = true;
          this.levelGroup.add(outerQuay);
        }
      }

      // 3 Monumental Arched Parisian Bridges spanning the Seine Channels (Pont Alexandre III & Pont Neuf style)
      const bridgeZs = [-90, -191, -284];
      for (const bz of bridgeZs) {
        const bridgeGroup = new THREE.Group();
        bridgeGroup.position.set(0, floorY, bz);

        // Bridge stone roadway deck spanning x in [-34, 34]
        const deck = new THREE.Mesh(new THREE.BoxGeometry(68, 1.15, 11.4), limestoneMat);
        deck.position.y = 2.65;
        deck.receiveShadow = true;
        bridgeGroup.add(deck);

        // Triple curved masonry arches underneath
        for (const archX of [-18, 0, 18]) {
          const archPts = [
            new THREE.Vector3(archX - 8.2, 0.1, 0),
            new THREE.Vector3(archX, 2.2, 0),
            new THREE.Vector3(archX + 8.2, 0.1, 0),
          ];
          const archRib = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPts), 14, 0.65, 8, false), limestoneMat);
          for (const fz of [-4.6, 4.6]) {
            const archCopy = archRib.clone();
            archCopy.position.z = fz;
            bridgeGroup.add(archCopy);
          }
          // Stone bridge piers between arches
          if (archX !== 18) {
            const pier = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.2, 12.2), limestoneMat);
            pier.position.set(archX + 9, 1.2, 0);
            bridgeGroup.add(pier);
          }
        }

        // Stone balustrades + gilded Pont Alexandre III winged monument pylons & warm lanterns
        for (const sz of [-5.2, 5.2]) {
          const rail = new THREE.Mesh(new THREE.BoxGeometry(66, 0.72, 0.38), limestoneMat);
          rail.position.set(0, 3.55, sz);
          bridgeGroup.add(rail);

          for (const px of [-14.2, 14.2]) {
            const pylon = new THREE.Mesh(new THREE.BoxGeometry(1.5, 4.2, 1.5), limestoneMat);
            pylon.position.set(px, 4.6, sz);
            const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 0), giltMat);
            cap.scale.set(0.9, 1.5, 0.9);
            cap.position.set(px, 7.2, sz);
            bridgeGroup.add(pylon, cap);
          }
          for (let lx = -24; lx <= 24; lx += 8) {
            const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.65, 6), ironMat);
            lampPost.position.set(lx, 4.35, sz);
            const lampHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 6), warmWindowMat);
            lampHead.position.set(lx, 5.28, sz);
            bridgeGroup.add(lampPost, lampHead);
          }
        }
        this.levelGroup.add(bridgeGroup);
      }

      // Avenue Chestnut & Plane Trees along the garden segments (layered canopies swaying gently in sunset breeze)
      const treePositions: [number, number, number][] = [];
      for (const [segZ, segLen] of avenueSegments) {
        const zA = segZ + segLen * 0.44;
        const zB = segZ - segLen * 0.44;
        for (let z = zA; z >= zB; z -= 10.5) {
          treePositions.push([-10.2, z, 0.92 + ((Math.abs(z) % 3) * 0.14)]);
          treePositions.push([10.2, z, 0.96 + ((Math.abs(z + 2) % 3) * 0.14)]);
          treePositions.push([-15.6, z - 4.2, 1.05]);
          treePositions.push([15.6, z - 4.2, 1.05]);
        }
      }
      const trunkGeo = new THREE.CylinderGeometry(0.28, 0.44, 2.5, 7);
      const trunkMat = new THREE.MeshStandardMaterial({ map: this.textures.barkTexture, color: 0x7c4a2b, roughness: 0.9 });
      const foliageGeo = this.createDisplacedRockGeometry(2.15, 3.7);
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x628b2c, roughness: 0.84 });
      applyWindSwayShader(foliageMat, this.shaderTimeUniform, 0.16, 1.55);

      const tTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, treePositions.length);
      const tFoliage = new THREE.InstancedMesh(foliageGeo, foliageMat, treePositions.length * 2);
      for (let i = 0; i < treePositions.length; i++) {
        const [tx, tz, sc] = treePositions[i];
        dummy.position.set(tx, floorY + 1.8, tz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(sc, sc, sc);
        dummy.updateMatrix();
        tTrunks.setMatrixAt(i, dummy.matrix);

        dummy.position.set(tx, floorY + 4.2 * sc, tz);
        dummy.rotation.set(0, i * 0.8, 0);
        dummy.scale.set(sc * 1.08, sc * 0.95, sc * 1.08);
        dummy.updateMatrix();
        tFoliage.setMatrixAt(i * 2, dummy.matrix);

        dummy.position.set(tx + 0.45 * sc, floorY + 5.1 * sc, tz - 0.3 * sc);
        dummy.rotation.set(0, i * 1.3, 0);
        dummy.scale.set(sc * 0.78, sc * 0.75, sc * 0.78);
        dummy.updateMatrix();
        tFoliage.setMatrixAt(i * 2 + 1, dummy.matrix);

        _color.setHex(i % 4 === 0 ? 0x8ca632 : i % 3 === 0 ? 0x5c8c29 : 0x729f33);
        tFoliage.setColorAt(i * 2, _color);
        _color.setHex(i % 5 === 0 ? 0xc28a36 : 0x6b9e2d);
        tFoliage.setColorAt(i * 2 + 1, _color);
      }
      tTrunks.instanceMatrix.needsUpdate = true;
      tFoliage.instanceMatrix.needsUpdate = true;
      if (tFoliage.instanceColor) tFoliage.instanceColor.needsUpdate = true;
      tTrunks.computeBoundingSphere();
      tFoliage.computeBoundingSphere();
      this.levelGroup.add(tTrunks, tFoliage);

      // Helper to construct architecturally authentic Haussmann Parisian buildings, domed basilicas & astronomical clocktowers
      const addHaussmannBuilding = (
        bx: number,
        bz: number,
        bw: number,
        bh: number,
        bd: number,
        variant: 'classic' | 'dome' | 'clock' | 'rotunda',
        seed: number
      ) => {
        const bGroup = new THREE.Group();
        bGroup.position.set(bx, floorY, bz);

        // Ground stone rusticated base podium
        const baseH = 3.2;
        const baseBlock = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.5, baseH, bd + 0.5), limestoneMat);
        baseBlock.position.y = baseH * 0.5;
        bGroup.add(baseBlock);

        // Main Haussmann limestone facade with glowing dusk windows
        const mainH = bh;
        const mainBlock = new THREE.Mesh(new THREE.BoxGeometry(bw, mainH, bd), facadeMat);
        mainBlock.position.y = baseH + mainH * 0.5;
        mainBlock.castShadow = !this.isSoftwareGl;
        mainBlock.receiveShadow = true;
        bGroup.add(mainBlock);

        // Horizontal stone stringcourses & wrought-iron Haussmann balconies (balcones)
        const balconyLevels = [baseH + mainH * 0.34, baseH + mainH * 0.72];
        for (const by of balconyLevels) {
          const ledge = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.9, 0.34, bd + 0.9), limestoneMat);
          ledge.position.y = by;
          const rail = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.85, 0.42, bd + 0.85), ironMat);
          rail.position.y = by + 0.34;
          bGroup.add(ledge, rail);
        }

        // Top classical entablature cornice
        const topCornice = new THREE.Mesh(new THREE.BoxGeometry(bw + 1.0, 0.6, bd + 1.0), limestoneMat);
        topCornice.position.y = baseH + mainH + 0.25;
        bGroup.add(topCornice);

        const roofBaseY = baseH + mainH + 0.55;
        const roofH = Math.min(4.6, Math.max(2.6, bw * 0.32));

        // Sloped Parisian zinc mansard roof (4-sided frustum)
        const mansard = new THREE.Mesh(
          new THREE.CylinderGeometry(bw * 0.42, bw * 0.68, roofH, 4),
          mansardRoofMat
        );
        mansard.rotation.y = Math.PI / 4;
        mansard.scale.set(1, 1, bd / bw);
        mansard.position.y = roofBaseY + roofH * 0.5;
        bGroup.add(mansard);

        // Dormer windows (buhardillas) + terracotta chimneys (chimeneas)
        const dormerDir = bx < 0 ? 1 : -1;
        for (const dz of [-bd * 0.24, bd * 0.24]) {
          const dormer = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.35, 1.25), limestoneMat);
          dormer.position.set(dormerDir * (bw * 0.36), roofBaseY + roofH * 0.44, dz);
          const dormerWin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.8, 0.72), warmWindowMat);
          dormerWin.position.set(dormerDir * (bw * 0.36 + 0.52), roofBaseY + roofH * 0.42, dz);
          const dormerCap = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.8, 4), mansardRoofMat);
          dormerCap.rotation.y = Math.PI / 4;
          dormerCap.position.set(dormerDir * (bw * 0.36), roofBaseY + roofH * 0.44 + 1.0, dz);
          bGroup.add(dormer, dormerWin, dormerCap);
        }
        for (const [cx, cz] of [[-bw * 0.22, -bd * 0.2], [bw * 0.22, bd * 0.2]]) {
          const chim = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.2, 0.85), terracottaMat);
          chim.position.set(cx, roofBaseY + roofH + 0.6, cz);
          const potA = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.55, 6), terracottaMat);
          potA.position.set(cx - 0.18, roofBaseY + roofH + 1.85, cz);
          const potB = potA.clone();
          potB.position.set(cx + 0.18, roofBaseY + roofH + 1.85, cz);
          bGroup.add(chim, potA, potB);
        }

        // Architectural specializations: Monumental Dome, Astronomical Clocktower, or Corner Rotunda Turret
        if (variant === 'dome') {
          const drumR = Math.min(bw, bd) * 0.34;
          const drum = new THREE.Mesh(new THREE.CylinderGeometry(drumR, drumR * 1.06, 3.2, 16), limestoneMat);
          drum.position.y = roofBaseY + roofH + 1.3;
          const cupola = new THREE.Mesh(
            new THREE.SphereGeometry(drumR * 1.02, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
            copperDomeMat
          );
          cupola.scale.set(1, 1.3, 1);
          cupola.position.y = roofBaseY + roofH + 2.8;
          const lantern = new THREE.Mesh(new THREE.CylinderGeometry(drumR * 0.24, drumR * 0.28, 1.8, 10), giltMat);
          lantern.position.y = roofBaseY + roofH + 2.8 + drumR * 1.32;
          const spire = new THREE.Mesh(new THREE.ConeGeometry(drumR * 0.22, 2.2, 10), giltMat);
          spire.position.y = roofBaseY + roofH + 2.8 + drumR * 1.32 + 1.8;
          bGroup.add(drum, cupola, lantern, spire);
        } else if (variant === 'clock') {
          const towerW = Math.min(bw, bd) * 0.44;
          const towerH = 6.2;
          const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerW), limestoneMat);
          tower.position.y = roofBaseY + roofH * 0.5 + towerH * 0.5;
          const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(towerW * 0.78, 3.6, 4), mansardRoofMat);
          towerRoof.rotation.y = Math.PI / 4;
          towerRoof.position.y = roofBaseY + roofH * 0.5 + towerH + 1.7;
          const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), giltMat);
          finial.position.y = roofBaseY + roofH * 0.5 + towerH + 3.6;
          bGroup.add(tower, towerRoof, finial);

          // Glowing Parisian Clock Face on the boulevard-facing side
          const faceX = dormerDir * (towerW * 0.5 + 0.08);
          const faceY = roofBaseY + roofH * 0.5 + towerH * 0.58;
          const clockBezel = new THREE.Mesh(new THREE.TorusGeometry(towerW * 0.38, 0.14, 8, 24), giltMat);
          clockBezel.rotation.y = Math.PI / 2;
          clockBezel.position.set(faceX, faceY, 0);
          const clockDial = new THREE.Mesh(new THREE.CircleGeometry(towerW * 0.36, 22), warmWindowMat);
          clockDial.rotation.y = dormerDir > 0 ? Math.PI / 2 : -Math.PI / 2;
          clockDial.position.set(faceX + dormerDir * 0.02, faceY, 0);
          bGroup.add(clockBezel, clockDial);

          const handHub = new THREE.Group();
          handHub.position.set(faceX + dormerDir * 0.08, faceY, 0);
          const minGroup = new THREE.Group();
          const minBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, towerW * 0.28, 0.1), ironMat);
          minBar.position.y = towerW * 0.13;
          minGroup.add(minBar);
          const hourGroup = new THREE.Group();
          const hourBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, towerW * 0.19, 0.12), ironMat);
          hourBar.position.y = towerW * 0.09;
          hourGroup.add(hourBar);
          minGroup.rotation.x = seed * 1.5;
          hourGroup.rotation.x = seed * 0.7;
          handHub.add(minGroup, hourGroup);
          bGroup.add(handHub);
          this.parisClockHands.push({ hourHand: hourGroup, minuteHand: minGroup });
        } else if (variant === 'rotunda') {
          const turR = Math.min(bw, bd) * 0.32;
          const turret = new THREE.Mesh(new THREE.CylinderGeometry(turR, turR * 1.04, mainH * 0.45 + 3.2, 14), facadeMat);
          turret.position.set(dormerDir * (bw * 0.38), baseH + mainH * 0.78, 0);
          const cone = new THREE.Mesh(new THREE.ConeGeometry(turR * 1.12, 4.4, 14), mansardRoofMat);
          cone.position.set(dormerDir * (bw * 0.38), baseH + mainH + 3.8, 0);
          const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 0), giltMat);
          tip.position.set(dormerDir * (bw * 0.38), baseH + mainH + 6.1, 0);
          bGroup.add(turret, cone, tip);
        }

        this.levelGroup.add(bGroup);
      };

      // Tier 1: Inner Boulevard Haussmann Buildings framing the aerial glide corridor (|x| >= 22 keeps x in [-16.5, 16.5] clear!)
      const innerVariants: ('classic' | 'dome' | 'clock' | 'rotunda')[] = [
        'classic', 'rotunda', 'clock', 'classic', 'dome', 'classic', 'rotunda', 'clock',
      ];
      for (let i = 0; i < 16; i++) {
        const bz = 4 - i * 24;
        const leftVar = innerVariants[i % innerVariants.length];
        const rightVar = innerVariants[(i + 3) % innerVariants.length];
        addHaussmannBuilding(-24.5 - (i % 2) * 2.5, bz, 11.5, 16 + (i % 4) * 3.5, 15.5, leftVar, i * 0.7);
        addHaussmannBuilding(24.5 + ((i + 1) % 2) * 2.5, bz - 8, 11.5, 15 + ((i + 2) % 4) * 3.8, 15.0, rightVar, i * 1.1 + 2);
      }

      // Tier 2: Mid-city Grand Landmarks (Basilica Domes, Opera Rotundas, Palais Clocktowers) & Distant Skyline
      const midBuildings: [number, number, number, number, number, 'classic' | 'dome' | 'clock' | 'rotunda'][] = [
        [-45, -24, 16, 24, 18, 'dome'],
        [44, -46, 15, 22, 17, 'rotunda'],
        [-46, -98, 18, 25, 20, 'dome'],
        [45, -124, 15, 26, 16, 'clock'],
        [-44, -172, 16, 22, 18, 'rotunda'],
        [46, -206, 19, 27, 20, 'dome'],
        [-45, -256, 15, 25, 16, 'clock'],
        [44, -296, 17, 23, 18, 'dome'],
        [-46, -346, 16, 22, 18, 'rotunda'],
        [46, -352, 16, 24, 18, 'classic'],
        [-28, -408, 16, 24, 16, 'dome'],
        [28, -408, 16, 22, 16, 'rotunda'],
        [0, -424, 22, 28, 18, 'dome'],
      ];
      midBuildings.forEach(([bx, bz, bw, bh, bd, v], idx) => {
        addHaussmannBuilding(bx, bz, bw, bh, bd, v, idx + 12);
      });

      // Tier 3: Far Paris Horizon Mansard Skyline Silhouettes
      const skySilMat = new THREE.MeshStandardMaterial({
        map: this.textures.parisFacade,
        emissiveMap: this.textures.parisFacadeEmissive,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.72,
        roughness: 0.88,
      });
      const skyRoofMat = new THREE.MeshStandardMaterial({ color: 0x3b4466, roughness: 0.85 });
      const sbGeo = new THREE.BoxGeometry(12, 18, 14);
      const srGeo = new THREE.ConeGeometry(8.6, 4.4, 4);
      srGeo.rotateY(Math.PI / 4);
      const sbCount = 38;
      const sbInst = new THREE.InstancedMesh(sbGeo, skySilMat, sbCount);
      const srInst = new THREE.InstancedMesh(srGeo, skyRoofMat, sbCount);
      for (let i = 0; i < sbCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const row = Math.floor(i / 2);
        const bz = 14 - row * 22.0;
        const bx = side * (66 + (row % 3) * 11.5);
        const scH = 0.9 + ((i * 5) % 5) * 0.3;
        dummy.position.set(bx, floorY + 9 * scH, bz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1.1, scH, 1.05);
        dummy.updateMatrix();
        sbInst.setMatrixAt(i, dummy.matrix);
        dummy.position.set(bx, floorY + 18 * scH + 1.8, bz);
        dummy.scale.set(1.1, 0.9, 1.05);
        dummy.updateMatrix();
        srInst.setMatrixAt(i, dummy.matrix);
      }
      sbInst.instanceMatrix.needsUpdate = true;
      srInst.instanceMatrix.needsUpdate = true;
      sbInst.computeBoundingSphere();
      srInst.computeBoundingSphere();
      this.levelGroup.add(sbInst, srInst);

      // 3 Interactive Aerial Thermal Updraft Currents along alternate glide lanes (rewarding side exploration!)
      const aerialUpdraftSpots: [number, number, number][] = [
        [-10.2, 18.0, -78],
        [10.4, 14.5, -155],
        [-9.8, 9.5, -242],
      ];
      for (const [ux, uy, uz] of aerialUpdraftSpots) {
        const wm = createParisWindUpdraftMesh(2.3, 12.5, this.textures);
        wm.group.position.set(ux, uy - 5.5, uz);
        this.levelGroup.add(wm.group);
        this.parisThermalRibbons.push(...wm.ribbons);
        this.parisUpdraftZones.push({
          pos: new THREE.Vector3(ux, uy, uz),
          radius: 3.1,
          height: 12.5,
          triggeredCooldown: 0,
        });
      }

      // Scenic & Alternate-Lane Montgolfier Hot-Air Balloons drifting in the golden sunset sky
      const balloonPalette = [
        [0xe11d48, 0xfef3c7],
        [0x2563eb, 0xfbbf24],
        [0xf97316, 0xfef08a],
        [0x7c3aed, 0xfde68a],
      ];
      const balloonDefs: { pos: [number, number, number]; scale: number; isObstacle: boolean }[] = [
        { pos: [-20, 26, -42], scale: 1.35, isObstacle: false },
        { pos: [21, 28, -96], scale: 1.45, isObstacle: false },
        { pos: [-22, 23, -178], scale: 1.35, isObstacle: false },
        { pos: [20, 20, -252], scale: 1.4, isObstacle: false },
        { pos: [-19, 17, -318], scale: 1.5, isObstacle: false },
        { pos: [21, 19, -338], scale: 1.3, isObstacle: false },
        // 3 Readable Sky-Obstacle Balloons along offset alternate lanes (never blocking main boost rings)
        { pos: [-12.2, 23.5, -108], scale: 0.92, isObstacle: true },
        { pos: [12.0, 18.5, -196], scale: 0.92, isObstacle: true },
        { pos: [-11.8, 12.0, -278], scale: 0.92, isObstacle: true },
      ];
      const basketMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
      balloonDefs.forEach((bd, idx) => {
        const [colA, colB] = balloonPalette[idx % balloonPalette.length];
        const bg = new THREE.Group();
        const envMatA = new THREE.MeshStandardMaterial({ color: colA, emissive: colA, emissiveIntensity: 0.16, roughness: 0.55 });
        const envMatB = new THREE.MeshStandardMaterial({ color: colB, emissive: colB, emissiveIntensity: 0.14, roughness: 0.55 });
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(2.1 * bd.scale, 16, 12), envMatA);
        bulb.scale.set(1, 1.24, 1);
        bulb.position.y = 2.6 * bd.scale;
        const band = new THREE.Mesh(new THREE.TorusGeometry(2.04 * bd.scale, 0.28 * bd.scale, 8, 22), envMatB);
        band.rotation.x = Math.PI / 2;
        band.position.y = 2.65 * bd.scale;
        const basket = new THREE.Mesh(new THREE.BoxGeometry(1.0 * bd.scale, 0.85 * bd.scale, 1.0 * bd.scale), basketMat);
        basket.position.y = -0.35 * bd.scale;
        const burnerGlow = new THREE.Mesh(new THREE.SphereGeometry(0.28 * bd.scale, 8, 6), warmWindowMat);
        burnerGlow.position.y = 0.45 * bd.scale;
        for (const sx of [-0.42, 0.42]) {
          for (const sz of [-0.42, 0.42]) {
            const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3 * bd.scale, 5), ironMat);
            rope.position.set(sx * bd.scale, 0.65 * bd.scale, sz * bd.scale);
            bg.add(rope);
          }
        }
        bg.add(bulb, band, basket, burnerGlow);
        bg.position.set(...bd.pos);
        this.levelGroup.add(bg);
        this.parisBalloons.push({
          group: bg,
          baseX: bd.pos[0],
          baseY: bd.pos[1],
          baseZ: bd.pos[2],
          swayAmp: bd.isObstacle ? 0.65 : 1.35,
          phase: idx * 1.15,
          isObstacle: bd.isObstacle,
          radius: 2.35 * bd.scale,
        });
      });

      // Animated Flocks of Birds soaring over the Seine & Eiffel Tower
      const birdMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
      const birdWingGeo = new THREE.BoxGeometry(0.58, 0.05, 0.22);
      birdWingGeo.translate(0.29, 0, 0);
      const birdCenters: [number, number, number, number][] = [
        [-8, 32, -36, 9],
        [10, 26, -92, 11],
        [-9, 22, -162, 10],
        [8, 18, -242, 10],
        [-6, 15, -315, 9],
        [6, 12, -356, 8],
      ];
      for (let i = 0; i < 14; i++) {
        const [cx, cy, cz, cr] = birdCenters[i % birdCenters.length];
        const bird = new THREE.Group();
        const body = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.46, 6), birdMat);
        body.rotation.x = Math.PI / 2;
        const wingL = new THREE.Mesh(birdWingGeo, birdMat);
        const wingR = new THREE.Mesh(birdWingGeo, birdMat);
        wingR.scale.x = -1;
        bird.add(body, wingL, wingR);
        this.levelGroup.add(bird);
        this.parisBirds.push({
          group: bird,
          wingL,
          wingR,
          center: new THREE.Vector3(cx, cy + (i % 3) * 1.4, cz),
          radius: cr + (i % 2) * 2.5,
          speed: 0.48 + (i % 4) * 0.12,
          phase: i * 1.3,
        });
      }

      // Volumetric Golden-Sunset Clouds drifting gently across the skyline
      const cloudPuffGeo = new THREE.DodecahedronGeometry(2.6, 1);
      const sunsetCloudMat = new THREE.MeshStandardMaterial({
        color: 0xffedd5,
        emissive: 0xfb923c,
        emissiveIntensity: 0.34,
        roughness: 0.94,
        transparent: true,
        opacity: 0.88,
      });
      for (let i = 0; i < 24; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const cg = new THREE.Group();
        const puffOffsets: [number, number, number, number][] = [
          [0, 0, 0, 1.35],
          [-2.3, -0.35, 0.4, 0.95],
          [2.4, -0.25, -0.3, 1.0],
          [0.4, 0.6, 0.2, 0.85],
        ];
        for (const [px, py, pz, ps] of puffOffsets) {
          const puff = new THREE.Mesh(cloudPuffGeo, sunsetCloudMat);
          puff.scale.set(ps * 1.4, ps * 0.55, ps * 1.05);
          puff.position.set(px, py, pz);
          cg.add(puff);
        }
        const cx = side * (22 + (i % 4) * 9.5);
        const cy = 22 + (i % 5) * 3.8;
        const cz = -14 - i * 15.5;
        cg.position.set(cx, cy, cz);
        this.levelGroup.add(cg);
        this.parisClouds.push({
          group: cg,
          baseX: cx,
          baseY: cy,
          baseZ: cz,
          spanX: 3.4 + (i % 3) * 1.2,
          speed: 0.16 + (i % 3) * 0.05,
          phase: i * 0.9,
        });
      }

      // Drifting Golden Autumn Plane-Tree Leaves & Sunset Dust in the air
      const leafCount = this.isSoftwareGl ? 32 : 88;
      const leafGeo = new THREE.PlaneGeometry(0.24, 0.16);
      const leafMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xd97706,
        emissiveIntensity: 0.35,
        roughness: 0.7,
        side: THREE.DoubleSide,
      });
      this.parisLeafMesh = new THREE.InstancedMesh(leafGeo, leafMat, leafCount);
      this.parisLeafMesh.frustumCulled = false;
      for (let i = 0; i < leafCount; i++) {
        this.parisLeafStates.push({
          x: (Math.random() - 0.5) * 32,
          y: (Math.random() - 0.2) * 16,
          z: (Math.random() - 0.5) * 32,
          fallSpeed: 0.85 + Math.random() * 0.9,
          swayPhase: Math.random() * Math.PI * 2,
          rotSpeed: 1.4 + Math.random() * 2.2,
        });
        _color.setHex(i % 3 === 0 ? 0xfbbf24 : i % 3 === 1 ? 0xf97316 : 0xfde047);
        this.parisLeafMesh.setColorAt(i, _color);
      }
      if (this.parisLeafMesh.instanceColor) this.parisLeafMesh.instanceColor.needsUpdate = true;
      this.levelGroup.add(this.parisLeafMesh);
    } else if (biome === 'rapids') {
      // Mist-shrouded Blue Mountain Peak & Lush Rainforest Slopes (Selva Esmeralda canyon horizon)
      this.addHorizonMountainRing(0, -145, level.theme.hazardFloorY - 2, 148, 238, 72, 0x355f7d, 0x9cc0d9, 3.1, 0.88);
      this.addHorizonMountainRing(0, -145, level.theme.hazardFloorY - 1, 102, 158, 38, 0x1b4332, 0x3f7a38, 1.9, 0.9);

      // Cloned scrolling waterfall texture for main cascades & side cliff waterfalls
      this.rapidsWaterfallTex = this.textures.waterfallSurface.clone();
      this.rapidsWaterfallTex.wrapS = THREE.RepeatWrapping;
      this.rapidsWaterfallTex.wrapT = THREE.RepeatWrapping;
      this.rapidsWaterfallTex.repeat.set(2, 1.6);
      this.rapidsWaterfallTex.needsUpdate = true;

      // 3D Winding S-Curve Sloped Rapids Channel (5-column wave grid + 3-column submerged riverbed + sloping canyon banks)
      const curveSegments = 160;
      const riverCols = 5;
      const riverPositions: number[] = [];
      const riverUvs: number[] = [];
      const riverIndices: number[] = [];

      const bedPositions: number[] = [];
      const bedUvs: number[] = [];
      const bedIndices: number[] = [];

      const bankPositionsL: number[] = [];
      const bankPositionsR: number[] = [];
      const bankUvs: number[] = [];
      const bankIndices: number[] = [];

      for (let i = 0; i <= curveSegments; i++) {
        const frac = i / curveSegments;
        const z = 14 - frac * 292;
        const cx = getRiverCenterX(z);
        const waterY = getRiverWaterY(z);
        const [minOff, maxOff] = getRiverChannelBounds(z, 9.2);
        const xL = cx + minOff - 1.6;
        const xR = cx + maxOff + 1.6;
        const vCoord = frac * 22;

        // 5 vertices across channel for smooth 3D wave displacement + shallow alpha edge fade
        for (let c = 0; c < riverCols; c++) {
          const u = c / (riverCols - 1);
          const x = THREE.MathUtils.lerp(xL, xR, u);
          riverPositions.push(x, waterY, z);
          riverUvs.push(u, vCoord);
        }

        // Submerged 3-column riverbed (shallow sunlit gravel banks -> deeper emerald center)
        bedPositions.push(
          xL + 0.35, waterY - 0.52, z,
          cx + (minOff + maxOff) * 0.5, waterY - 1.55, z,
          xR - 0.35, waterY - 0.52, z
        );
        bedUvs.push(0, vCoord, 0.5, vCoord, 1, vCoord);

        // Left & Right mossy lush riverbanks sloping upward from the shallow bed edge
        bankPositionsL.push(xL - 22.0, waterY + 3.8, z, xL + 0.45, waterY - 0.58, z);
        bankPositionsR.push(xR - 0.45, waterY - 0.58, z, xR + 22.0, waterY + 3.8, z);
        bankUvs.push(0, vCoord * 1.4, 1, vCoord * 1.4);

        if (i < curveSegments) {
          const r5 = i * riverCols;
          for (let c = 0; c < riverCols - 1; c++) {
            riverIndices.push(r5 + c, r5 + riverCols + c, r5 + c + 1, r5 + c + 1, r5 + riverCols + c, r5 + riverCols + c + 1);
          }
          const r3 = i * 3;
          for (let c = 0; c < 2; c++) {
            bedIndices.push(r3 + c, r3 + 3 + c, r3 + c + 1, r3 + c + 1, r3 + 3 + c, r3 + 4 + c);
          }
          const r2 = i * 2;
          bankIndices.push(r2, r2 + 2, r2 + 1, r2 + 1, r2 + 2, r2 + 3);
        }
      }

      const bedGeo = new THREE.BufferGeometry();
      bedGeo.setAttribute('position', new THREE.Float32BufferAttribute(bedPositions, 3));
      bedGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bedUvs, 2));
      bedGeo.setIndex(bedIndices);
      bedGeo.computeVertexNormals();
      const bedMat = new THREE.MeshStandardMaterial({
        map: this.textures.rapidsRiverbed,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.14,
        roughness: 0.92,
      });
      const bedMesh = new THREE.Mesh(bedGeo, bedMat);
      bedMesh.receiveShadow = true;
      this.levelGroup.add(bedMesh);

      const riverGeo = new THREE.BufferGeometry();
      riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(riverPositions, 3));
      riverGeo.setAttribute('uv', new THREE.Float32BufferAttribute(riverUvs, 2));
      riverGeo.setIndex(riverIndices);
      riverGeo.computeVertexNormals();

      const rapidsMat = new THREE.MeshStandardMaterial({
        map: this.textures.rapidsWaterSurface,
        bumpMap: this.textures.waterBump,
        bumpScale: 0.16,
        roughness: 0.12,
        metalness: 0.24,
        transparent: true,
        opacity: 0.88,
        envMapIntensity: 1.35,
      });
      applyRiverRapidsShader(rapidsMat, this.shaderTimeUniform, {
        waveAmp: 0.14,
        speed: 4.9,
        fresnelColor: 0xdbeafe,
        canopyColor: 0x2dd4bf,
        baseOpacity: 0.88,
      });
      const rapidsMesh = new THREE.Mesh(riverGeo, rapidsMat);
      this.levelGroup.add(rapidsMesh);

      const bankMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleGrass,
        bumpMap: this.textures.grassBump,
        bumpScale: 0.12,
        roughness: 0.86,
      });
      for (const posArr of [bankPositionsL, bankPositionsR]) {
        const bGeo = new THREE.BufferGeometry();
        bGeo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
        bGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bankUvs, 2));
        bGeo.setIndex(bankIndices);
        bGeo.computeVertexNormals();
        const bMesh = new THREE.Mesh(bGeo, bankMat);
        bMesh.receiveShadow = true;
        this.levelGroup.add(bMesh);
      }

      // Serene Turquoise Calm Lake & Shallow Sandbar Reef at the end of the river (z = -270 to -390)
      const lakeBedMat = new THREE.MeshStandardMaterial({
        map: this.textures.rapidsRiverbed,
        roughness: 0.9,
      });
      const lakeBedPlane = new THREE.Mesh(new THREE.PlaneGeometry(220, 120, 1, 1), lakeBedMat);
      lakeBedPlane.rotation.x = -Math.PI / 2;
      lakeBedPlane.position.set(0, -1.25, -330);
      lakeBedPlane.receiveShadow = true;
      this.levelGroup.add(lakeBedPlane);

      const lakeMat = new THREE.MeshStandardMaterial({
        map: this.textures.calmLakeSurface,
        bumpMap: this.textures.waterBump,
        bumpScale: 0.06,
        roughness: 0.08,
        metalness: 0.28,
        transparent: true,
        opacity: 0.86,
        envMapIntensity: 1.45,
      });
      applyWaterSurfaceShader(lakeMat, this.shaderTimeUniform, {
        waveAmp: 0.05,
        waveFreq: 0.26,
        speed: 1.8,
        fresnelColor: 0xe0f2fe,
        fresnelStrength: 0.62,
        foamStrength: 0.12,
      });
      const calmLakePlane = new THREE.Mesh(new THREE.PlaneGeometry(220, 120, 24, 24), lakeMat);
      calmLakePlane.rotation.x = -Math.PI / 2;
      calmLakePlane.position.set(0, -0.02, -330);
      this.levelGroup.add(calmLakePlane);

      // Shared Canyon Rock, Waterfall & Foliage Materials
      const cliffStoneMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleRuinStone,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.22,
        color: 0x64748b,
        roughness: 0.9,
      });
      const bankRockMat = new THREE.MeshStandardMaterial({
        color: 0x78827a,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.16,
        roughness: 0.88,
      });
      const mossCapMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleGrass,
        bumpMap: this.textures.grassBump,
        bumpScale: 0.09,
        roughness: 0.85,
      });
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
      applyWindSwayShader(leafSunMat, this.shaderTimeUniform, 0.24, 2.1);
      applyWindSwayShader(leafMidMat, this.shaderTimeUniform, 0.2, 1.9);
      applyWindSwayShader(lianaMat, this.shaderTimeUniform, 0.28, 1.5);

      const waterfallMat = new THREE.MeshStandardMaterial({
        map: this.rapidsWaterfallTex,
        color: 0xe0f2fe,
        emissive: 0x0284c7,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.82,
        roughness: 0.18,
        side: THREE.DoubleSide,
      });
      const foamPlumeMat = new THREE.MeshBasicMaterial({
        color: 0xf0f9ff,
        transparent: true,
        opacity: 0.44,
        depthWrite: false,
      });
      const foamRingMat = new THREE.MeshBasicMaterial({
        color: 0xf0f9ff,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      // Towering Stratified Canyon Cliff Walls along both sides of the gorge
      const cliffGeo = this.createDisplacedRockGeometry(4.4, 9.7);
      const cliffCount = 48;
      const cliffInst = new THREE.InstancedMesh(cliffGeo, cliffStoneMat, cliffCount);
      const cliffMossInst = new THREE.InstancedMesh(cliffGeo, mossCapMat, cliffCount);
      for (let i = 0; i < cliffCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const row = Math.floor(i / 2);
        const cz = 8 - row * 11.4;
        const cx = getRiverCenterX(cz);
        const cy = getRiverWaterY(cz);
        const [minOff, maxOff] = getRiverChannelBounds(cz, 9.2);
        const edgeX = side < 0 ? cx + minOff - 9.5 - (row % 3) * 1.8 : cx + maxOff + 9.5 + (row % 3) * 1.8;
        const hScale = 1.45 + (row % 4) * 0.42;
        const wScale = 1.3 + (row % 3) * 0.28;

        dummy.position.set(edgeX, cy + 3.4 * hScale, cz);
        dummy.rotation.set((row % 3 - 1) * 0.08, i * 1.35, (row % 2) * 0.12);
        dummy.scale.set(wScale, hScale * 1.55, wScale * 1.28);
        dummy.updateMatrix();
        cliffInst.setMatrixAt(i, dummy.matrix);

        dummy.position.set(edgeX, cy + 6.4 * hScale, cz);
        dummy.rotation.set(0, i * 1.35, 0);
        dummy.scale.set(wScale * 0.92, 0.34, wScale * 1.16);
        dummy.updateMatrix();
        cliffMossInst.setMatrixAt(i, dummy.matrix);
      }
      cliffInst.instanceMatrix.needsUpdate = true;
      cliffMossInst.instanceMatrix.needsUpdate = true;
      cliffInst.computeBoundingSphere();
      cliffMossInst.computeBoundingSphere();
      this.levelGroup.add(cliffInst, cliffMossInst);

      // 2 Major Navigable River Waterfall Drops (z ≈ -92 and z ≈ -193) with foam sheets, plunge mist & flanking crags
      for (const wfZ of [-92, -193]) {
        const wCx = getRiverCenterX(wfZ);
        const topY = getRiverWaterY(wfZ + 9);
        const botY = getRiverWaterY(wfZ - 9);
        const midY = (topY + botY) * 0.5;
        const sheetH = Math.hypot(topY - botY, 16) * 0.92;
        const sheet = new THREE.Mesh(new THREE.PlaneGeometry(21.5, sheetH, 8, 4), waterfallMat);
        sheet.position.set(wCx, midY + 0.18, wfZ);
        sheet.rotation.x = -Math.PI / 2 + Math.atan2(topY - botY, 15.5);
        this.levelGroup.add(sheet);

        // Plunge pool frothy foam apron & animated mist clouds
        const apron = new THREE.Mesh(new THREE.CircleGeometry(10.5, 22), foamRingMat);
        apron.rotation.x = -Math.PI / 2;
        apron.scale.set(1.15, 0.58, 1);
        apron.position.set(wCx, botY + 0.08, wfZ - 9.2);
        this.levelGroup.add(apron);
        this.rapidsMistZones.push(new THREE.Vector3(wCx, botY + 0.6, wfZ - 9.0));

        for (let m = 0; m < 4; m++) {
          const mist = new THREE.Mesh(new THREE.DodecahedronGeometry(1.75 + (m % 2) * 0.55, 1), foamPlumeMat);
          const mx = wCx + (m - 1.5) * 4.5;
          const my = botY + 1.1;
          mist.position.set(mx, my, wfZ - 8.5 + (m % 2) * 1.4);
          this.levelGroup.add(mist);
          this.rapidsMistPlumes.push({ mesh: mist, baseY: my, baseScale: 1.0, phase: m * 1.3 + wfZ });
        }

        // Flanking monumental waterfall gateway boulders
        for (const sx of [-1, 1]) {
          const mon = new THREE.Mesh(this.createDisplacedRockGeometry(3.2, 5.5 + sx), cliffStoneMat);
          mon.position.set(wCx + sx * 12.2, midY + 1.6, wfZ);
          mon.scale.set(1.1, 1.9, 1.3);
          this.levelGroup.add(mon);
        }
      }

      // 6 Dramatic Canyon Side-Cliff Waterfalls spilling down into misty riverside pools
      const sideWaterfallDefs: { z: number; side: -1 | 1; h: number; w: number }[] = [
        { z: -34, side: -1, h: 12.5, w: 4.2 },
        { z: -70, side: 1, h: 14.0, w: 4.8 },
        { z: -114, side: 1, h: 13.5, w: 4.4 },
        { z: -154, side: -1, h: 12.8, w: 4.5 },
        { z: -214, side: -1, h: 14.5, w: 5.0 },
        { z: -254, side: 1, h: 13.0, w: 4.4 },
      ];
      for (const swf of sideWaterfallDefs) {
        const cx = getRiverCenterX(swf.z);
        const wy = getRiverWaterY(swf.z);
        const [minOff, maxOff] = getRiverChannelBounds(swf.z, 9.2);
        const px = swf.side < 0 ? cx + minOff - 4.2 : cx + maxOff + 4.2;

        const wSheet = new THREE.Mesh(new THREE.PlaneGeometry(swf.w, swf.h), waterfallMat);
        wSheet.position.set(px, wy + swf.h * 0.48, swf.z);
        wSheet.rotation.y = swf.side < 0 ? Math.PI * 0.42 : -Math.PI * 0.42;
        wSheet.rotation.z = swf.side < 0 ? -0.1 : 0.1;
        this.levelGroup.add(wSheet);

        const poolFoam = new THREE.Mesh(new THREE.RingGeometry(0.4, swf.w * 0.72, 16), foamRingMat);
        poolFoam.rotation.x = -Math.PI / 2;
        poolFoam.position.set(px - swf.side * 1.4, wy + 0.08, swf.z);
        this.levelGroup.add(poolFoam);
        this.rapidsMistZones.push(new THREE.Vector3(px - swf.side * 1.4, wy + 0.5, swf.z));

        const mistPuff = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), foamPlumeMat);
        mistPuff.position.set(px - swf.side * 1.5, wy + 0.9, swf.z);
        this.levelGroup.add(mistPuff);
        this.rapidsMistPlumes.push({ mesh: mistPuff, baseY: wy + 0.9, baseScale: 1.0, phase: swf.z * 0.1 });
      }

      // 2 Secret Bifurcation Islands (Left fork around z = -135, Right fork around z = -228)
      const islandDefs: { z: number; offX: number; hasTotem: boolean }[] = [
        { z: -135, offX: -9.6, hasTotem: false },
        { z: -228, offX: 9.6, hasTotem: true },
      ];
      const lanternMat = new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xf59e0b,
        emissiveIntensity: 2.0,
        roughness: 0.18,
      });
      const caveCrystalMat = new THREE.MeshPhysicalMaterial({
        color: 0x67e8f9,
        emissive: 0x06b6d4,
        emissiveIntensity: 1.85,
        roughness: 0.12,
        clearcoat: 1.0,
      });

      for (const isl of islandDefs) {
        const ix = getRiverCenterX(isl.z) + isl.offX;
        const iy = getRiverWaterY(isl.z);
        const islGroup = new THREE.Group();
        islGroup.position.set(ix, iy, isl.z);

        const baseRock = new THREE.Mesh(this.createDisplacedRockGeometry(2.35, isl.z * 0.2), cliffStoneMat);
        baseRock.scale.set(1.05, 0.72, 2.35);
        baseRock.position.y = -0.15;
        const grassCap = new THREE.Mesh(this.createDisplacedRockGeometry(2.05, isl.z * 0.3), mossCapMat);
        grassCap.scale.set(1.0, 0.38, 2.15);
        grassCap.position.y = 0.65;
        const surfRing = new THREE.Mesh(new THREE.RingGeometry(2.2, 3.05, 22), foamRingMat);
        surfRing.rotation.x = -Math.PI / 2;
        surfRing.scale.set(1.0, 2.25, 1);
        surfRing.position.y = 0.06;
        islGroup.add(baseRock, grassCap, surfRing);

        // Leaning coconut palm / jungle tree atop the mid-river island
        const palmCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0.6, 0),
          new THREE.Vector3(isl.offX < 0 ? -0.45 : 0.45, 2.6, -0.3),
          new THREE.Vector3(isl.offX < 0 ? -0.9 : 0.9, 4.8, 0.15),
        ]);
        islGroup.add(new THREE.Mesh(new THREE.TubeGeometry(palmCurve, 8, 0.26, 7, false), heroBarkMat));
        const tipPt = palmCurve.getPoint(1);
        for (let f = 0; f < 6; f++) {
          const ang = (f / 6) * Math.PI * 2;
          const frond = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.3, 4), leafSunMat);
          frond.position.set(tipPt.x + Math.cos(ang) * 0.85, tipPt.y - 0.15, tipPt.z + Math.sin(ang) * 0.85);
          frond.rotation.set(0, -ang, -1.12);
          frond.scale.set(1.0, 1.0, 0.22);
          islGroup.add(frond);
        }

        if (isl.hasTotem) {
          const totem = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.2, 0.95), cliffStoneMat);
          totem.position.set(0, 1.75, 1.6);
          const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 0), lanternMat);
          gem.position.set(0, 3.15, 1.6);
          islGroup.add(totem, gem);
        }

        // Guiding warm lantern buoy at upstream nose of the island pointing into the secret fork
        const buoyPole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.8, 6), heroBarkMat);
        buoyPole.position.set(isl.offX < 0 ? -1.4 : 1.4, 0.9, 4.8);
        const buoyGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), lanternMat);
        buoyGem.position.set(isl.offX < 0 ? -1.4 : 1.4, 2.0, 4.8);
        islGroup.add(buoyPole, buoyGem);

        this.levelGroup.add(islGroup);
      }

      // Natural Tropical River Cave Tunnel (z = -160 to -182) with stone arches, stalactites, bioluminescent crystals & lanterns
      for (let cIdx = 0; cIdx < 5; cIdx++) {
        const cz = -161 - cIdx * 4.8;
        const cx = getRiverCenterX(cz);
        const cy = getRiverWaterY(cz);
        const archPts = [
          new THREE.Vector3(cx - 12.2, cy - 0.5, cz),
          new THREE.Vector3(cx - 10.6, cy + 7.2, cz),
          new THREE.Vector3(cx, cy + 10.8, cz),
          new THREE.Vector3(cx + 10.6, cy + 7.2, cz),
          new THREE.Vector3(cx + 12.2, cy - 0.5, cz),
        ];
        const archTube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(archPts), 14, 2.55, 7, false);
        const archMesh = new THREE.Mesh(archTube, cliffStoneMat);
        this.levelGroup.add(archMesh);

        // Hanging rock stalactites + glowing turquoise cave crystals under vault
        for (let st = -1; st <= 1; st++) {
          const sx = cx + st * 4.4 + (cIdx % 2 === 0 ? 0.6 : -0.6);
          const sy = cy + 9.4 - Math.abs(st) * 1.4;
          const stal = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.4, 6), cliffStoneMat);
          stal.rotation.x = Math.PI;
          stal.position.set(sx, sy - 0.9, cz);
          this.levelGroup.add(stal);

          if ((cIdx + st) % 2 === 0) {
            const crys = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), caveCrystalMat);
            crys.scale.set(0.65, 1.75, 0.65);
            crys.position.set(sx + 0.5, sy - 0.45, cz);
            this.levelGroup.add(crys);
          }
        }

        // Warm explorer lantern buoys along cave flanks for crisp visibility
        for (const side of [-1, 1]) {
          const lx = cx + side * 8.9;
          const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 2.1, 6), heroBarkMat);
          post.position.set(lx, cy + 1.0, cz);
          const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.28, 0), lanternMat);
          orb.position.set(lx, cy + 2.2, cz);
          this.levelGroup.add(post, orb);
        }
      }

      // 3 Overhead Jungle Suspension Bridges spanning across the canyon cliffs (z = -56, -142, -238)
      const bridgeTimberMat = new THREE.MeshStandardMaterial({
        map: this.textures.riverTimber,
        bumpMap: this.textures.barkBump,
        bumpScale: 0.1,
        roughness: 0.86,
      });
      const bridgeRopeMat = new THREE.MeshStandardMaterial({ color: 0xa17c46, roughness: 0.84 });
      for (const bz of [-56, -142, -238]) {
        const cx = getRiverCenterX(bz);
        const wy = getRiverWaterY(bz);
        const [minOff, maxOff] = getRiverChannelBounds(bz, 9.2);
        const leftX = cx + minOff - 6.5;
        const rightX = cx + maxOff + 6.5;
        const spanW = rightX - leftX;
        const midX = (leftX + rightX) * 0.5;
        const deckY = wy + 10.6;

        const bridgeGroup = new THREE.Group();
        const plankCount = Math.max(12, Math.floor(spanW / 1.45));
        for (let p = 0; p < plankCount; p++) {
          const u = p / (plankCount - 1);
          const px = THREE.MathUtils.lerp(leftX, rightX, u);
          const sag = Math.sin(u * Math.PI) * 1.15;
          const plank = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 2.55), bridgeTimberMat);
          plank.position.set(px, deckY - sag, bz);
          plank.rotation.z = Math.cos(u * Math.PI) * 0.08;
          bridgeGroup.add(plank);
        }

        // End tower posts & swaying warm lanterns + catenary cables
        for (const endX of [leftX, rightX]) {
          for (const sz of [-1.25, 1.25]) {
            const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.34, 4.4, 7), heroBarkMat);
            tower.position.set(endX, deckY + 1.1, bz + sz);
            const lamp = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), lanternMat);
            lamp.position.set(endX, deckY + 3.45, bz + sz);
            bridgeGroup.add(tower, lamp);
          }
        }
        for (const sz of [-1.25, 1.25]) {
          const handPts: THREE.Vector3[] = [];
          for (let s = 0; s <= 10; s++) {
            const u = s / 10;
            const px = THREE.MathUtils.lerp(leftX, rightX, u);
            const sag = Math.sin(u * Math.PI) * 1.4;
            handPts.push(new THREE.Vector3(px, deckY + 1.45 - sag, bz + sz));
          }
          bridgeGroup.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(handPts), 16, 0.08, 6, false), bridgeRopeMat));
        }
        const archSupport = new THREE.Mesh(new THREE.BoxGeometry(spanW * 0.04, 0.1, 0.1), bridgeRopeMat);
        archSupport.position.set(midX, deckY, bz);
        bridgeGroup.add(archSupport);
        this.levelGroup.add(bridgeGroup);
      }

      // Dense Selva Esmeralda Background Forest flanking the 3D sloped riverbanks
      const bgTreeCount = 74;
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
      applyWindSwayShader(canopyMat, this.shaderTimeUniform, 0.18, 1.65);

      const bgTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, bgTreeCount);
      const bgRoots = new THREE.InstancedMesh(rootGeo, trunkMat, bgTreeCount);
      const bgCanopiesLow = new THREE.InstancedMesh(canopyLowGeo, canopyMat, bgTreeCount);
      const bgCanopiesTop = new THREE.InstancedMesh(canopyTopGeo, canopyMat, bgTreeCount);

      for (let i = 0; i < bgTreeCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const row = Math.floor(i / 2);
        const tz = 12 - row * 9.5;
        const isLake = tz < -274;
        const riverCx = getRiverCenterX(tz);
        const waterY = getRiverWaterY(tz);
        const [minOff, maxOff] = getRiverChannelBounds(tz, 9.2);
        const tx = isLake
          ? side * (17 + (row % 5) * 5.8)
          : side < 0
            ? riverCx + minOff - 7.5 - (row % 4) * 3.2
            : riverCx + maxOff + 7.5 + (row % 4) * 3.2;
        const ty = isLake ? -0.3 : waterY + 1.2 + (row % 3) * 0.45;
        const scale = 0.88 + (i % 4) * 0.24;

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

      // Hero Twisted Mahogany Jungle Trees & Leaning Riverside Palms arching gracefully over the river
      const foliageClusterGeo = this.createDisplacedRockGeometry(2.25, 3.7);
      const heroBankZ = [-18, -38, -58, -78, -98, -118, -138, -158, -178, -198, -218, -238, -258, -288, -312];
      const bankRockSpots: [number, number, number, number][] = [];
      const heroCrownCoords: THREE.Vector3[] = [];

      for (let idx = 0; idx < heroBankZ.length; idx++) {
        const hz = heroBankZ[idx];
        const side = idx % 2 === 0 ? -1 : 1;
        const isLake = hz < -274;
        const cx = getRiverCenterX(hz);
        const waterY = getRiverWaterY(hz);
        const [minOff, maxOff] = getRiverChannelBounds(hz, 9.2);
        const hx = isLake ? side * 14.5 : side < 0 ? cx + minOff - 3.6 : cx + maxOff + 3.6;
        const hy = isLake ? 0.1 : waterY + 0.35;
        const sc = 0.95 + (idx % 3) * 0.14;

        const tg = new THREE.Group();
        tg.position.set(hx, hy, hz);
        // Lean slightly inward over the river water for dramatic jungle tunnel framing
        tg.rotation.z = isLake ? 0 : side * 0.18;
        tg.rotation.y = idx * 0.65;

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
        heroCrownCoords.push(new THREE.Vector3(hx - side * 1.8, hy + 10.2 * sc, hz));
        if (!isLake) {
          bankRockSpots.push([cx + minOff - 1.1, getRiverWaterY(hz + 2.4), hz + 2.4, 0.92]);
          bankRockSpots.push([cx + maxOff + 1.1, getRiverWaterY(hz - 3.2), hz - 3.2, 0.85]);
        }
      }

      // Dedicated Leaning Riverbank Coconut Palms extending out over the water bends
      for (const pz of [-28, -64, -104, -148, -196, -244, -278]) {
        const side = Math.abs(pz) % 4 === 0 ? -1 : 1;
        const cx = getRiverCenterX(pz);
        const wy = getRiverWaterY(pz);
        const [minOff, maxOff] = getRiverChannelBounds(pz, 9.2);
        const px = pz < -274 ? side * 14.2 : side < 0 ? cx + minOff - 2.2 : cx + maxOff + 2.2;
        const palmGroup = new THREE.Group();
        palmGroup.position.set(px, wy, pz);
        const archPts = [
          new THREE.Vector3(0, -0.3, 0),
          new THREE.Vector3(-side * 1.8, 2.8, 0.2),
          new THREE.Vector3(-side * 3.8, 5.4, -0.3),
        ];
        const pCurve = new THREE.CatmullRomCurve3(archPts);
        palmGroup.add(new THREE.Mesh(new THREE.TubeGeometry(pCurve, 9, 0.25, 7, false), heroBarkMat));
        const tip = pCurve.getPoint(1);
        for (let f = 0; f < 7; f++) {
          const ang = (f / 7) * Math.PI * 2;
          const frond = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.6, 4), leafSunMat);
          frond.position.set(tip.x + Math.cos(ang) * 0.95, tip.y - 0.1, tip.z + Math.sin(ang) * 0.95);
          frond.rotation.set(0, -ang, -1.16);
          frond.scale.set(1.0, 1.0, 0.22);
          palmGroup.add(frond);
        }
        this.levelGroup.add(palmGroup);
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

      // Mossy Pale Boulders & Multi-Blade Tropical Ferns along 3D sloped riverbanks
      const rockGeo = this.createDisplacedRockGeometry(0.95, 7.3);
      const mossCapGeo = this.createDisplacedRockGeometry(0.75, 4.9);
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

      const leafBladeGeo = new THREE.ConeGeometry(0.34, 1.65, 5);
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

      // 5 Drifting Mossy Timber Logs bobbing along the rapids (can dodge or jump!)
      const driftingLogDefs: { z: number; offX: number; swingAmp: number; speed: number; phase: number; halfLen: number }[] = [
        { z: -41, offX: -1.8, swingAmp: 2.2, speed: 1.15, phase: 0.4, halfLen: 1.65 },
        { z: -79, offX: 1.6, swingAmp: 2.4, speed: 1.25, phase: 1.7, halfLen: 1.7 },
        { z: -120, offX: -0.6, swingAmp: 2.0, speed: 1.35, phase: 2.8, halfLen: 1.55 },
        { z: -184, offX: 1.5, swingAmp: 2.1, speed: 1.3, phase: 0.9, halfLen: 1.6 },
        { z: -232, offX: -1.5, swingAmp: 2.3, speed: 1.2, phase: 3.1, halfLen: 1.65 },
      ];
      for (const ld of driftingLogDefs) {
        const cx = getRiverCenterX(ld.z) + ld.offX;
        const wy = getRiverWaterY(ld.z);
        const logGroup = new THREE.Group();
        logGroup.position.set(cx, wy + 0.08, ld.z);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, ld.halfLen * 2, 10), heroBarkMat);
        trunk.rotation.z = Math.PI / 2;
        trunk.castShadow = !this.isSoftwareGl;
        const mossPatch = new THREE.Mesh(new THREE.BoxGeometry(ld.halfLen * 1.1, 0.16, 0.46), mossCapMat);
        mossPatch.position.y = 0.42;
        const wakeCollar = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.05, 16), foamRingMat);
        wakeCollar.rotation.x = -Math.PI / 2;
        wakeCollar.scale.set(ld.halfLen * 1.05, 0.72, 1);
        wakeCollar.position.y = -0.02;
        logGroup.add(trunk, mossPatch, wakeCollar);
        this.levelGroup.add(logGroup);
        this.rapidsDriftingLogs.push({
          group: logGroup,
          pos: new THREE.Vector3(cx, wy, ld.z),
          baseX: cx,
          baseZ: ld.z,
          swingAmp: ld.swingAmp,
          speed: ld.speed,
          phase: ld.phase,
          halfWidth: 0.65,
          halfLen: ld.halfLen,
        });
      }

      // 4 Moving / Oscillating River Boulders creating dynamic narrow passes
      const movingRockDefs: { z: number; offX: number; ampX: number; speed: number; phase: number; radius: number }[] = [
        { z: -64, offX: 0.2, ampX: 3.2, speed: 1.35, phase: 0.3, radius: 1.35 },
        { z: -104, offX: -0.4, ampX: 3.4, speed: 1.45, phase: 1.6, radius: 1.4 },
        { z: -150, offX: 0.4, ampX: 3.1, speed: 1.5, phase: 2.9, radius: 1.35 },
        { z: -216, offX: -0.5, ampX: 3.3, speed: 1.4, phase: 0.8, radius: 1.4 },
      ];
      for (let i = 0; i < movingRockDefs.length; i++) {
        const mr = movingRockDefs[i];
        const cx = getRiverCenterX(mr.z) + mr.offX;
        const wy = getRiverWaterY(mr.z);
        const rMesh = new THREE.Mesh(this.createDisplacedRockGeometry(mr.radius, i + 9.2), cliffStoneMat);
        rMesh.position.set(cx, wy + 0.35, mr.z);
        rMesh.scale.set(1.04, 0.9, 1.04);
        rMesh.castShadow = !this.isSoftwareGl;
        const rFoam = new THREE.Mesh(new THREE.RingGeometry(mr.radius * 0.86, mr.radius * 1.38, 18), foamRingMat);
        rFoam.rotation.x = -Math.PI / 2;
        rFoam.position.set(cx, wy + 0.06, mr.z);
        this.levelGroup.add(rMesh, rFoam);
        this.rapidsMovingRocks.push({
          mesh: rMesh,
          foam: rFoam,
          baseX: cx,
          pos: new THREE.Vector3(cx, wy, mr.z),
          radius: mr.radius,
          ampX: mr.ampX,
          speed: mr.speed,
          phase: mr.phase,
        });
      }

      // 4 Swirling River Whirlpools with layered rotating turquoise-whitewater vortex rings
      const whirlpoolDefs: { z: number; offX: number; radius: number; spinDir: number }[] = [
        { z: -48, offX: 2.8, radius: 2.4, spinDir: 1 },
        { z: -102, offX: 3.0, radius: 2.5, spinDir: -1 },
        { z: -134, offX: 3.2, radius: 2.4, spinDir: 1 },
        { z: -202, offX: -2.8, radius: 2.5, spinDir: -1 },
      ];
      const vortexCoreMat = new THREE.MeshBasicMaterial({
        color: 0x0c4a6e,
        transparent: true,
        opacity: 0.72,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      for (const wp of whirlpoolDefs) {
        const wx = getRiverCenterX(wp.z) + wp.offX;
        const wy = getRiverWaterY(wp.z);
        const wg = new THREE.Group();
        wg.position.set(wx, wy + 0.06, wp.z);
        const core = new THREE.Mesh(new THREE.CircleGeometry(wp.radius * 0.34, 18), vortexCoreMat);
        core.rotation.x = -Math.PI / 2;
        wg.add(core);
        for (let r = 0; r < 3; r++) {
          const rIn = wp.radius * (0.36 + r * 0.22);
          const rOut = rIn + 0.24;
          const arc = new THREE.Mesh(
            new THREE.RingGeometry(rIn, rOut, 18, 1, r * 1.4, Math.PI * 1.35),
            foamRingMat
          );
          arc.rotation.x = -Math.PI / 2;
          arc.position.y = 0.01 * (r + 1);
          wg.add(arc);
        }
        this.levelGroup.add(wg);
        this.rapidsWhirlpools.push({
          group: wg,
          pos: new THREE.Vector3(wx, wy, wp.z),
          radius: wp.radius,
          spinDir: wp.spinDir,
        });
      }

      // Pool of 14 dynamic Boat Water-Ripple Rings (zero per-frame allocations)
      const rippleGeo = new THREE.RingGeometry(0.65, 0.98, 22);
      rippleGeo.rotateX(-Math.PI / 2);
      for (let i = 0; i < 14; i++) {
        const rMat = new THREE.MeshBasicMaterial({
          color: 0xe0f2fe,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const rMesh = new THREE.Mesh(rippleGeo, rMat);
        rMesh.visible = false;
        this.levelGroup.add(rMesh);
        this.rapidsRipples.push({ mesh: rMesh, life: 0, maxLife: 0.9 });
      }

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
    } else if (biome === 'newyork') {
      const roadY = level.theme.hazardFloorY + 0.06;

      // 1. Manhattan Avenue & Cross-Street Asphalt Grid + Sidewalks
      const avenueMat = new THREE.MeshStandardMaterial({
        map: this.textures.nycAsphaltRoad,
        roughness: 0.78,
        metalness: 0.08,
      });
      const sidewalkMat = new THREE.MeshStandardMaterial({
        map: this.textures.nycRooftopConcrete,
        color: 0x94a3b8,
        roughness: 0.88,
        metalness: 0.05,
      });
      const aveXs = [-26, 0, 26];
      const aveGeo = new THREE.BoxGeometry(11.5, 0.14, 430);
      const swGeo = new THREE.BoxGeometry(3.2, 0.28, 430);
      for (const ax of aveXs) {
        const road = new THREE.Mesh(aveGeo, avenueMat);
        road.position.set(ax, roadY, -175);
        this.levelGroup.add(road);

        const swL = new THREE.Mesh(swGeo, sidewalkMat);
        swL.position.set(ax - 7.3, roadY + 0.07, -175);
        const swR = new THREE.Mesh(swGeo, sidewalkMat);
        swR.position.set(ax + 7.3, roadY + 0.07, -175);
        this.levelGroup.add(swL, swR);
      }

      const crossZs = [-25, -85, -145, -205, -265, -325];
      const crossGeo = new THREE.BoxGeometry(160, 0.15, 10.5);
      for (const cz of crossZs) {
        const cross = new THREE.Mesh(crossGeo, avenueMat);
        cross.position.set(0, roadY + 0.01, cz);
        this.levelGroup.add(cross);
      }

      // 2. Flanking Manhattan Skyscraper Canyons & Distant Skyline Backdrop
      const glassMat = new THREE.MeshStandardMaterial({
        map: this.textures.nycGlassTower,
        emissiveMap: this.textures.nycGlassTowerEmissive,
        emissive: 0xffedd5,
        emissiveIntensity: 0.72,
        roughness: 0.22,
        metalness: 0.65,
      });
      const decoMat = new THREE.MeshStandardMaterial({
        map: this.textures.nycArtDecoStone,
        roughness: 0.68,
        metalness: 0.18,
      });
      const brickMat = new THREE.MeshStandardMaterial({
        map: this.textures.nycBrickFacade,
        roughness: 0.86,
        metalness: 0.06,
      });
      const spireMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.88,
        roughness: 0.22,
      });
      const beaconMat = new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xef4444,
        emissiveIntensity: 1.8,
      });

      const skyscraperSpecs: [number, number, number, number, number, number][] = [];
      for (let row = 0; row < 15; row++) {
        const bz = 10 - row * 28;
        const hL1 = 42 + ((row * 19) % 44);
        const hR1 = 45 + ((row * 23 + 11) % 48);
        skyscraperSpecs.push([-39 - (row % 2) * 5, bz, 15, hL1, 16, row % 3]);
        skyscraperSpecs.push([39 + ((row + 1) % 2) * 5, bz - 6, 15, hR1, 16, (row + 1) % 3]);
        if (!this.isSoftwareGl) {
          skyscraperSpecs.push([-64, bz - 10, 18, 56 + ((row * 17) % 40), 18, (row + 2) % 3]);
          skyscraperSpecs.push([64, bz - 2, 18, 54 + ((row * 29) % 42), 18, row % 3]);
        }
      }
      // Horizon backdrop towers north of Goal Plaza
      for (let i = -4; i <= 4; i++) {
        skyscraperSpecs.push([i * 21, -405 - Math.abs(i) * 6, 16, 62 + ((Math.abs(i) * 19) % 38), 16, Math.abs(i) % 3]);
      }

      for (const [bx, bz, bw, bh, bd, styleIdx] of skyscraperSpecs) {
        const bMat = styleIdx === 0 ? glassMat : styleIdx === 1 ? decoMat : brickMat;
        const tower = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), bMat);
        tower.position.set(bx, roadY + bh / 2 - 0.5, bz);
        this.levelGroup.add(tower);

        if (styleIdx === 1) {
          // Art Deco stepped crown + spire
          const tier = new THREE.Mesh(new THREE.BoxGeometry(bw * 0.62, 7.5, bd * 0.62), decoMat);
          tier.position.set(bx, roadY + bh + 3.2, bz);
          const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.7, 11, 8), spireMat);
          spire.position.set(bx, roadY + bh + 12.2, bz);
          const tip = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 8), beaconMat);
          tip.position.set(bx, roadY + bh + 17.8, bz);
          this.levelGroup.add(tier, spire, tip);
        } else if (styleIdx === 0 && bh > 62) {
          const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.35, 9, 6), spireMat);
          ant.position.set(bx, roadY + bh + 4.0, bz);
          this.levelGroup.add(ant);
        }
      }

      // 3. Glowing Times Square Billboards flanking key vistas
      const billboardMat = new THREE.MeshBasicMaterial({ map: this.textures.nycBillboardTex });
      const billboardSpots: [number, number, number, number][] = [
        [-28, 12, -32, Math.PI / 2],
        [28, 16, -98, -Math.PI / 2],
        [-29, 20, -172, Math.PI / 2],
        [29, 22, -248, -Math.PI / 2],
        [-28, 25, -315, Math.PI / 2],
      ];
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.7, roughness: 0.3 });
      for (const [bx, by, bz, ry] of billboardSpots) {
        const signGroup = new THREE.Group();
        signGroup.position.set(bx, by, bz);
        signGroup.rotation.y = ry;
        const back = new THREE.Mesh(new THREE.BoxGeometry(14.6, 7.6, 0.5), frameMat);
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(13.8, 6.8), billboardMat);
        screen.position.z = 0.28;
        signGroup.add(back, screen);
        this.levelGroup.add(signGroup);
      }

      // 4. Rooftop Water Towers on Wide Hero Rooftops
      const waterTowerSpots: [number, number, number][] = [
        [-4.5, 0.8, 4.2],
        [6.2, 2.5, -56.5],
        [-6.0, 5.2, -110],
        [6.2, 5.2, -214],
        [-19.5, 6.5, -242],
        [6.5, 13.0, -349],
      ];
      for (const [wx, wy, wz] of waterTowerSpots) {
        const wt = createNycWaterTowerMesh();
        wt.position.set(wx, wy, wz);
        this.levelGroup.add(wt);
      }

      // 5. Avenue Streetlamps (InstancedMesh + computeBoundingSphere)
      const lampCount = this.isSoftwareGl ? 24 : 44;
      const lampPoleGeo = new THREE.CylinderGeometry(0.11, 0.16, 4.6, 6);
      const lampPoleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.3 });
      const lampGlowGeo = new THREE.SphereGeometry(0.32, 8, 8);
      const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfde68a });
      const poleInst = new THREE.InstancedMesh(lampPoleGeo, lampPoleMat, lampCount);
      const glowInst = new THREE.InstancedMesh(lampGlowGeo, lampGlowMat, lampCount);
      const dummy = new THREE.Object3D();
      for (let i = 0; i < lampCount; i++) {
        const side = i % 2 === 0 ? -1 : 1;
        const lx = side * 6.4;
        const lz = 8 - Math.floor(i / 2) * 16;
        dummy.position.set(lx, roadY + 2.3, lz);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        poleInst.setMatrixAt(i, dummy.matrix);
        dummy.position.set(lx, roadY + 4.7, lz);
        dummy.updateMatrix();
        glowInst.setMatrixAt(i, dummy.matrix);
      }
      poleInst.instanceMatrix.needsUpdate = true;
      glowInst.instanceMatrix.needsUpdate = true;
      poleInst.computeBoundingSphere();
      glowInst.computeBoundingSphere();
      this.levelGroup.add(poleInst, glowInst);

      // 6. Animated NYC Traffic (Yellow Cabs & Sedans on Avenues and Cross-Streets)
      const carPalette = [0xfacc15, 0xfacc15, 0xfacc15, 0x3b82f6, 0xef4444, 0xf8fafc, 0x1e293b];
      const vehicleCount = this.isSoftwareGl ? 10 : 20;
      for (let i = 0; i < vehicleCount; i++) {
        const isCross = i >= Math.floor(vehicleCount * 0.7);
        const col = carPalette[i % carPalette.length];
        const isTaxi = col === 0xfacc15;
        const vGroup = createNycVehicleMesh(col, isTaxi);
        if (!isCross) {
          const laneAx = aveXs[i % aveXs.length];
          const dir = i % 2 === 0 ? -1 : 1;
          const x = laneAx + dir * 2.4;
          const z = 12 - ((i * 27) % 360);
          vGroup.position.set(x, roadY + 0.08, z);
          vGroup.rotation.y = dir > 0 ? 0 : Math.PI;
          this.levelGroup.add(vGroup);
          this.nycVehicles.push({
            group: vGroup,
            axis: 'z',
            dir,
            speed: 11 + (i % 4) * 3.2,
            minC: -370,
            maxC: 24,
          });
        } else {
          const cz = crossZs[i % crossZs.length];
          const dir = i % 2 === 0 ? 1 : -1;
          const x = -65 + ((i * 31) % 130);
          vGroup.position.set(x, roadY + 0.08, cz + dir * 2.1);
          vGroup.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          this.levelGroup.add(vGroup);
          this.nycVehicles.push({
            group: vGroup,
            axis: 'x',
            dir,
            speed: 10 + (i % 3) * 3.0,
            minC: -72,
            maxC: 72,
          });
        }
      }

      // 7. Sidewalk Pedestrians (InstancedMesh + computeBoundingSphere)
      const pedCount = this.isSoftwareGl ? 24 : 52;
      const pedGeo = new THREE.CapsuleGeometry(0.18, 0.55, 4, 6);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
      const pedInst = new THREE.InstancedMesh(pedGeo, pedMat, pedCount);
      const pedDummy = new THREE.Object3D();
      const pedColors = [0xf87171, 0x38bdf8, 0xfbbf24, 0xa78bfa, 0x34d399, 0xf472b6];
      for (let i = 0; i < pedCount; i++) {
        const ax = aveXs[i % aveXs.length] + (i % 2 === 0 ? -7.2 : 7.2);
        const pz = 4 - ((i * 15) % 350);
        const py = roadY + 0.58;
        this.nycPedestrianStates.push({
          x: ax,
          y: py,
          z: pz,
          axis: 'z',
          speed: (i % 2 === 0 ? 1 : -1) * (1.2 + (i % 3) * 0.45),
          phase: i * 0.7,
          span: 14,
        });
        pedDummy.position.set(ax, py, pz);
        pedDummy.updateMatrix();
        pedInst.setMatrixAt(i, pedDummy.matrix);
        _color.setHex(pedColors[i % pedColors.length]);
        pedInst.setColorAt(i, _color);
      }
      pedInst.instanceMatrix.needsUpdate = true;
      if (pedInst.instanceColor) pedInst.instanceColor.needsUpdate = true;
      pedInst.computeBoundingSphere();
      this.levelGroup.add(pedInst);
      this.nycPedestrianMesh = pedInst;

      // 8. Patrol Helicopters circling above Manhattan Skyline
      const heliCenters: [number, number, number, number, number][] = [
        [-14, 24, -76, 18, 0.42],
        [15, 29, -184, 20, -0.36],
        [0, 34, -295, 22, 0.38],
      ];
      heliCenters.forEach(([cx, cy, cz, rad, spd], idx) => {
        const hGroup = createNycHelicopterMesh();
        hGroup.position.set(cx + rad, cy, cz);
        this.levelGroup.add(hGroup);
        this.nycHelicopters.push({
          group: hGroup,
          center: new THREE.Vector3(cx, cy, cz),
          radius: rad,
          speed: spd,
          phase: idx * 2.1,
        });
      });
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
                    : theme.biome === 'newyork'
                      ? this.textures.skyNewYork
                      : this.textures.skyNebula;
    skyMat.needsUpdate = true;

    const animatedWaterBiome =
      theme.biome === 'jungle' ||
      theme.biome === 'temple' ||
      theme.biome === 'ice' ||
      theme.biome === 'volcanic' ||
      theme.biome === 'paris' ||
      theme.biome === 'rapids';
    const seaGeo = new THREE.PlaneGeometry(
      520,
      520,
      animatedWaterBiome || theme.biome === 'desert' ? 46 : 1,
      animatedWaterBiome || theme.biome === 'desert' ? 46 : 1
    );
    const seaTex =
      theme.biome === 'jungle' || theme.biome === 'temple'
        ? this.textures.lagoonSurface
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
                  : theme.biome === 'newyork'
                    ? this.textures.nycAsphaltRoad
                    : this.textures.nebulaSeaSurface;
    this.hazardSeaTex = seaTex;
    const seaMat = new THREE.MeshStandardMaterial({
      map: seaTex,
      bumpMap:
        theme.biome === 'jungle' || theme.biome === 'temple' || theme.biome === 'ice' || theme.biome === 'paris'
          ? this.textures.waterBump
          : theme.biome === 'desert'
            ? this.textures.sandBump
            : theme.biome === 'nebula'
              ? this.textures.stoneBump
              : undefined,
      bumpScale:
        theme.biome === 'jungle' || theme.biome === 'temple' || theme.biome === 'nebula'
          ? 0.14
          : theme.biome === 'desert'
            ? 0.22
            : theme.biome === 'paris'
              ? 0.1
              : theme.biome === 'ice'
                ? 0.08
                : 0,
      roughness:
        theme.biome === 'desert'
          ? 0.85
          : theme.biome === 'ice'
            ? 0.08
            : theme.biome === 'jungle'
              ? 0.08
              : theme.biome === 'paris'
                ? 0.1
                : theme.biome === 'temple'
                  ? 0.11
                  : theme.biome === 'newyork'
                    ? 0.84
                    : theme.biome === 'nebula'
                      ? 0.34
                      : 0.35,
      metalness:
        theme.biome === 'ice'
          ? 0.35
          : theme.biome === 'jungle' || theme.biome === 'paris'
            ? 0.34
            : theme.biome === 'temple'
              ? 0.28
              : theme.biome === 'nebula'
                ? 0.38
                : 0.06,
      envMapIntensity:
        theme.biome === 'ice'
          ? 1.5
          : theme.biome === 'jungle'
            ? 1.6
            : theme.biome === 'paris'
              ? 1.55
              : theme.biome === 'temple'
                ? 1.45
                : theme.biome === 'nebula'
                  ? 1.35
                  : 0.9,
      emissiveMap:
        theme.biome === 'volcanic'
          ? this.textures.lavaEmissive
          : theme.biome === 'nebula'
            ? this.textures.nebulaSeaEmissive
            : undefined,
      emissive: theme.biome === 'volcanic' ? 0xff6a00 : theme.biome === 'nebula' ? 0x38bdf8 : 0x000000,
      emissiveIntensity: theme.biome === 'volcanic' ? 1.55 : theme.biome === 'nebula' ? 0.92 : 0,
    });
    if (theme.biome === 'volcanic') {
      applyMoltenLavaShader(seaMat, this.shaderTimeUniform, {
        swellAmp: 0.34,
        swellFreq: 0.11,
        speed: 1.5,
      });
    } else if (animatedWaterBiome) {
      applyWaterSurfaceShader(seaMat, this.shaderTimeUniform, {
        waveAmp: theme.biome === 'ice' ? 0.07 : theme.biome === 'paris' ? 0.1 : 0.14,
        waveFreq: 0.16,
        speed: 2.1,
        fresnelColor:
          theme.biome === 'ice'
            ? 0x67e8f9
            : theme.biome === 'temple'
              ? 0xa7f3d0
              : theme.biome === 'jungle'
                ? 0x99f6e4
                : theme.biome === 'paris'
                  ? 0xfdba74
                  : 0x7dd3fc,
        fresnelStrength: theme.biome === 'ice' || theme.biome === 'paris' ? 0.72 : theme.biome === 'jungle' ? 0.64 : 0.56,
        foamStrength: theme.biome === 'ice' ? 0.3 : theme.biome === 'jungle' ? 0.28 : 0.22,
      });
    } else if (theme.biome === 'desert') {
      applyShiftingSandShader(seaMat, this.shaderTimeUniform, {
        duneAmp: 0.85,
        duneFreq: 0.052,
        speed: 0.58,
        glintColor: 0xfde68a,
      });
    } else if (theme.biome === 'nebula') {
      applyNebulaVoidShader(seaMat, this.shaderTimeUniform);
    }
    this.hazardSeaMesh = new THREE.Mesh(seaGeo, seaMat);
    this.hazardSeaMesh.rotation.x = -Math.PI / 2;
    this.hazardSeaMesh.position.set(0, theme.hazardFloorY, -95);
    this.levelGroup.add(this.hazardSeaMesh);

    this.ambientMotes = createBiomeAmbientParticles(theme.biome, this.isSoftwareGl ? 70 : theme.biome === 'ice' ? 240 : theme.biome === 'volcanic' ? 220 : theme.biome === 'nebula' ? 220 : 160);
    this.scene.add(this.ambientMotes.points);

    this.buildBiomeScenery(level);

    // Platforms (styled organic/beveled geometry + rotating, disappearing, elevator, target/switch bridges)
    for (const pDef of level.platforms) {
      const startsInactive = Boolean(pDef.linkedTargetId || pDef.linkedSwitchId);
      const mesh = buildStyledPlatformMesh(
        pDef,
        this.textures,
        (d) => this.createPlatformMaterial(d),
        this.isSoftwareGl,
        {
          emeraldJungleV2: level.index === 0,
          desertDunesV2: level.index === 1,
          auroraGlacierV2: level.index === 2,
          monkeyTempleV2: level.index === 3,
          volcanicCanyonV2: level.index === 4,
          nebulaCitadelV2: level.index === 5,
          parisSkyV2: level.index === 6,
          rapidsRiverV2: level.index === 7,
          newYorkV2: level.index === 8,
        }
      );
      if (startsInactive || pDef.kind === 'disappearing' || (level.index === 1 && pDef.kind === 'crumble')) {
        const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of list) {
          m.transparent = true;
          if (startsInactive) m.opacity = 0.16;
        }
        if (startsInactive) this.setPlatformOpacity(mesh, 0.16);
      }
      if (startsInactive) {
        mesh.castShadow = false;
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
        disappearState: 'solid',
        rotAngle: 0,
        prevRotAngle: 0,
        activated: !startsInactive,
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
      this.boatRig.bowSpray.visible = false;
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
        foam.position.set(rk.pos[0], rk.pos[1] + 0.06, rk.pos[2]);
        this.levelGroup.add(foam);

        this.riverRocks.push({ pos: new THREE.Vector3(...rk.pos), radius: rad });
      });

      for (const cr of bs.crocodiles) {
        const rig = createCrocodileMesh();
        const behavior = cr.behavior ?? 'patrol';
        rig.group.position.set(cr.pos[0], behavior === 'ambush' ? cr.pos[1] - 1.25 : cr.pos[1], cr.pos[2]);
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

    // Switches, Cosmic Relics, and Thermal Wind Zones
    if (level.switches) {
      for (const sw of level.switches) {
        const sm = createSwitchMesh();
        sm.group.position.set(...sw.pos);
        this.levelGroup.add(sm.group);
        this.switches.push({
          id: sw.id,
          group: sm.group,
          buttonMesh: sm.buttonMesh,
          buttonMat: sm.buttonMat,
          ringMat: sm.ringMat,
          pos: new THREE.Vector3(...sw.pos),
          message: sw.message,
          coins: sw.coins ?? 5,
          activated: false,
        });
      }
    }

    if (level.relics) {
      level.relics.forEach((rel, idx) => {
        const rm = createRelicMesh();
        rm.group.position.set(...rel.pos);
        this.levelGroup.add(rm.group);
        this.relics.push({
          id: rel.id,
          name: rel.name,
          group: rm.group,
          core: rm.core,
          halo: rm.halo,
          baseY: rel.pos[1],
          pos: new THREE.Vector3(...rel.pos),
          collected: false,
          phase: idx * 0.9,
        });
      });
    }

    if (level.windZones) {
      for (const wz of level.windZones) {
        if (theme.biome === 'desert') {
          const wm = createDesertThermalUpdraftMesh(wz.radius, wz.height, this.textures);
          wm.group.position.set(...wz.pos);
          this.levelGroup.add(wm.group);
          this.desertThermalRibbons.push(...wm.ribbons);
          this.windZones.push({
            group: wm.group,
            swirls: wm.swirls,
            pos: new THREE.Vector3(...wz.pos),
            radius: wz.radius,
            height: wz.height,
            liftSpeed: wz.liftSpeed ?? 11.5,
          });
        } else if (theme.biome === 'ice') {
          const wm = createPolarWindUpdraftMesh(wz.radius, wz.height, this.textures);
          wm.group.position.set(...wz.pos);
          this.levelGroup.add(wm.group);
          this.iceThermalRibbons.push(...wm.ribbons);
          this.windZones.push({
            group: wm.group,
            swirls: wm.swirls,
            pos: new THREE.Vector3(...wz.pos),
            radius: wz.radius,
            height: wz.height,
            liftSpeed: wz.liftSpeed ?? 11.5,
          });
        } else if (theme.biome === 'temple') {
          const wm = createTempleWindUpdraftMesh(wz.radius, wz.height, this.textures);
          wm.group.position.set(...wz.pos);
          this.levelGroup.add(wm.group);
          this.templeThermalRibbons.push(...wm.ribbons);
          this.windZones.push({
            group: wm.group,
            swirls: wm.swirls,
            pos: new THREE.Vector3(...wz.pos),
            radius: wz.radius,
            height: wz.height,
            liftSpeed: wz.liftSpeed ?? 11.5,
          });
        } else if (theme.biome === 'volcanic') {
          const wm = createVolcanicThermalUpdraftMesh(wz.radius, wz.height, this.textures);
          wm.group.position.set(...wz.pos);
          this.levelGroup.add(wm.group);
          this.volcanicThermalRibbons.push(...wm.ribbons);
          this.windZones.push({
            group: wm.group,
            swirls: wm.swirls,
            pos: new THREE.Vector3(...wz.pos),
            radius: wz.radius,
            height: wz.height,
            liftSpeed: wz.liftSpeed ?? 11.5,
          });
        } else if (theme.biome === 'nebula') {
          const wm = createNebulaGravityUpdraftMesh(wz.radius, wz.height, this.textures);
          wm.group.position.set(...wz.pos);
          this.levelGroup.add(wm.group);
          this.nebulaThermalRibbons.push(...wm.ribbons);
          this.windZones.push({
            group: wm.group,
            swirls: wm.swirls,
            pos: new THREE.Vector3(...wz.pos),
            radius: wz.radius,
            height: wz.height,
            liftSpeed: wz.liftSpeed ?? 11.5,
          });
        } else if (theme.biome === 'paris') {
          const wm = createParisWindUpdraftMesh(wz.radius, wz.height, this.textures);
          wm.group.position.set(...wz.pos);
          this.levelGroup.add(wm.group);
          this.parisThermalRibbons.push(...wm.ribbons);
          this.windZones.push({
            group: wm.group,
            swirls: wm.swirls,
            pos: new THREE.Vector3(...wz.pos),
            radius: wz.radius,
            height: wz.height,
            liftSpeed: wz.liftSpeed ?? 11.5,
          });
        } else {
          const wm = createWindZoneMesh(wz.radius, wz.height);
          wm.group.position.set(...wz.pos);
          this.levelGroup.add(wm.group);
          this.windZones.push({
            group: wm.group,
            swirls: wm.swirls,
            pos: new THREE.Vector3(...wz.pos),
            radius: wz.radius,
            height: wz.height,
            liftSpeed: wz.liftSpeed ?? 11.5,
          });
        }
      }
    }

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
        wingL: rig.wingL,
        wingR: rig.wingR,
        turretHead: rig.turretHead,
        shieldMesh: rig.shieldMesh,
        basePos: new THREE.Vector3(...en.pos),
        pos: new THREE.Vector3(...en.pos),
        patrolOffset: new THREE.Vector3(...en.patrolOffset),
        speed: en.speed,
        phase: idx * 1.1,
        hp: en.kind === 'brute' || en.kind === 'guardian' ? 2 : 1,
        hitFlash: 0,
        alive: true,
        hopPhase: 0,
        shootTimer: 0.9 + (idx % 3) * 0.45,
      });
    });

    // Biome Boss
    if (level.boss) {
      const bRig = createBossMesh(level.boss.style);
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
        phase: 1,
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
    this.hasDoubleJump = true;
    this.doubleJumpFlipTimer = 0;
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
    this.relicsCollected = 0;
    this.levelTime = 0;
    this.checkpointActive = false;
    this.active2DZone = null;
    this.perspectiveMode = '3D';
    this.camYaw = 0;
    this.camPitch = 0.42;
    this.camDynamicFov = 56;
    this.camCurrentPos.set(this.playerPos.x, this.playerPos.y + 5.2, this.playerPos.z + 9.5);
    this.camLookTarget.copy(this.playerPos).add(_vec3A.set(0, 1.0, 0));

    // Level 09 Spider-Man Suit Transformation, Web Anchors & Timed Challenges
    this.hasSpiderSuit = Boolean(level.spiderSuitLevel);
    this.webActive = false;
    this.webCooldown = 0;
    this.climbFace = null;
    this.spiderTransformTimer = 0;
    this.spiderTransformDone = false;

    if (this.hasSpiderSuit) {
      if (level.webAnchors) {
        for (const wa of level.webAnchors) {
          const pos = new THREE.Vector3(...wa);
          this.webAnchorPoints.push(pos);
          const beacon = createWebAnchorBeaconMesh();
          beacon.position.copy(pos);
          this.levelGroup.add(beacon);
          this.webAnchorBeacons.push(beacon);
        }
      }

      // 3D Web Swing Line & Target Reticle
      const lineGeo = new THREE.CylinderGeometry(0.045, 0.045, 1, 8);
      const lineMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        emissive: 0xe2e8f0,
        emissiveIntensity: 0.45,
        roughness: 0.3,
      });
      this.webLineMesh = new THREE.Mesh(lineGeo, lineMat);
      this.webLineMesh.visible = false;
      this.levelGroup.add(this.webLineMesh);

      const retGeo = new THREE.TorusGeometry(0.85, 0.09, 8, 24);
      const retMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.92 });
      this.webReticleMesh = new THREE.Mesh(retGeo, retMat);
      this.webReticleMesh.visible = false;
      this.levelGroup.add(this.webReticleMesh);

      // Timed Challenges (Contrarreloj)
      if (level.timedChallenges) {
        for (const tc of level.timedChallenges) {
          const padGroup = new THREE.Group();
          padGroup.position.set(...tc.startPos);
          const padBase = new THREE.Mesh(
            new THREE.CylinderGeometry(1.45, 1.6, 0.16, 16),
            new THREE.MeshStandardMaterial({
              color: 0x0ea5e9,
              emissive: 0x0284c7,
              emissiveIntensity: 0.85,
              roughness: 0.25,
              metalness: 0.6,
            })
          );
          const padRing = new THREE.Mesh(
            new THREE.TorusGeometry(1.3, 0.08, 8, 24),
            new THREE.MeshBasicMaterial({ color: 0xfacc15 })
          );
          padRing.rotation.x = Math.PI / 2;
          padRing.position.y = 0.12;
          padGroup.add(padBase, padRing);
          this.levelGroup.add(padGroup);

          const gates: THREE.Group[] = [];
          for (const cp of tc.checkpoints) {
            const gate = createChallengeGateMesh(0x38bdf8);
            gate.position.set(...cp);
            this.levelGroup.add(gate);
            gates.push(gate);
          }

          this.timedChallengesRuntime.push({
            id: tc.id,
            label: tc.label ?? 'Contrarreloj',
            startPos: new THREE.Vector3(...tc.startPos),
            checkpoints: tc.checkpoints.map((c) => new THREE.Vector3(...c)),
            timeLimit: tc.timeLimit,
            rewardCoins: tc.rewardCoins ?? 10,
            startPad: padGroup,
            gates,
            completed: false,
            active: false,
            currentIdx: 0,
            timer: 0,
            lastTickSec: -1,
          });
        }
      }

      if (targetPhase === 'playing') {
        this.spiderTransformTimer = 2.15;
        this.spiderTransformDone = false;
        for (const part of this.playerRig.astroParts) part.visible = true;
        for (const part of this.playerRig.spiderParts) part.visible = false;
        this.playerRig.transformAura.visible = true;
        soundEngine.playSpiderTransform();
      } else {
        this.spiderTransformDone = true;
        for (const part of this.playerRig.astroParts) part.visible = false;
        for (const part of this.playerRig.spiderParts) part.visible = true;
        this.playerRig.transformAura.visible = false;
      }
    } else {
      for (const part of this.playerRig.astroParts) part.visible = true;
      for (const part of this.playerRig.spiderParts) part.visible = false;
      this.playerRig.transformAura.visible = false;
    }

    this.phase = targetPhase;
    this.bannerText =
      targetPhase === 'playing'
        ? this.hasSpiderSuit
          ? '¡Activando Traje Arácnido!'
          : level.name
        : null;
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
        roughnessMap: this.textures.stoneRoughness,
        roughness: 0.86,
        metalness: 0.02,
      });
      const sideMat = new THREE.MeshStandardMaterial({
        map: this.textures.jungleSide,
        bumpMap: this.textures.jungleSideBump,
        bumpScale: 0.15,
        roughnessMap: this.textures.stoneRoughness,
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
        roughnessMap: this.textures.stoneRoughness,
        roughness: 0.88,
        metalness: 0.03,
      });
      const sideMat = new THREE.MeshStandardMaterial({
        map: this.textures.desertSide,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.16,
        roughnessMap: this.textures.stoneRoughness,
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
        roughnessMap: this.textures.stoneRoughness,
        roughness: 0.86,
        metalness: 0.03,
      });
      const sideMat = new THREE.MeshStandardMaterial({
        map: this.textures.templeSide,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.16,
        roughnessMap: this.textures.stoneRoughness,
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
        roughnessMap: this.textures.stoneRoughness,
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
        roughnessMap: this.textures.stoneRoughness,
        roughness: 0.86,
        metalness: 0.18,
      });
      return [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
    }
    if (style === 'nebula') {
      const topMat = new THREE.MeshStandardMaterial({
        map: this.textures.nebulaDeck,
        bumpMap: this.textures.nebulaBump,
        bumpScale: 0.12,
        roughnessMap: this.textures.metalRoughness,
        roughness: 0.22,
        metalness: 0.64,
        envMapIntensity: 1.45,
      });
      const sideMat = new THREE.MeshStandardMaterial({
        map: this.textures.nebulaSide,
        bumpMap: this.textures.nebulaBump,
        bumpScale: 0.14,
        roughnessMap: this.textures.metalRoughness,
        roughness: 0.28,
        metalness: 0.72,
        envMapIntensity: 1.35,
      });
      return [sideMat, sideMat, topMat, sideMat, sideMat, sideMat];
    }
    if (style === 'ice') {
      const topMat = new THREE.MeshPhysicalMaterial({
        map: this.textures.iceCrystal,
        bumpMap: this.textures.iceBump,
        bumpScale: 0.08,
        roughnessMap: this.textures.iceRoughness,
        roughness: 0.18,
        metalness: 0.08,
        clearcoat: 0.9,
        clearcoatRoughness: 0.1,
      });
      const sideMat = new THREE.MeshPhysicalMaterial({
        map: this.textures.iceSide,
        bumpMap: this.textures.iceBump,
        bumpScale: 0.14,
        roughnessMap: this.textures.iceRoughness,
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
        roughnessMap: this.textures.stoneRoughness,
        roughness: 0.78,
        metalness: 0.05,
      });
    }
    if (style === 'newyork') {
      return new THREE.MeshStandardMaterial({
        map: this.textures.nycRooftopConcrete,
        bumpMap: this.textures.stoneBump,
        bumpScale: 0.08,
        roughnessMap: this.textures.stoneRoughness,
        roughness: 0.82,
        metalness: 0.14,
      });
    }
    if (style === 'river') {
      return new THREE.MeshStandardMaterial({
        map: this.textures.riverTimber,
        bumpMap: this.textures.barkBump,
        bumpScale: 0.08,
        roughnessMap: this.textures.woodRoughness,
        roughness: 0.8,
        metalness: 0.04,
      });
    }
    if (style === 'crystal') {
      return new THREE.MeshStandardMaterial({
        map: this.textures.crystalCircuit,
        roughnessMap: this.textures.metalRoughness,
        roughness: 0.28,
        metalness: 0.52,
      });
    }
    if (style === 'gold') {
      return new THREE.MeshStandardMaterial({
        map: this.textures.goldTrim,
        roughnessMap: this.textures.metalRoughness,
        roughness: 0.22,
        metalness: 0.85,
      });
    }
    return new THREE.MeshStandardMaterial({
      map: this.textures.techGrid,
      roughnessMap: this.textures.metalRoughness,
      roughness: 0.34,
      metalness: 0.25,
    });
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

  private setPlatformOpacity(mesh: THREE.Mesh, opacity: number) {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of mats) {
      if ('opacity' in mat) {
        (mat as THREE.MeshStandardMaterial).opacity = opacity;
      }
    }
    const fadeMats = mesh.userData.fadeMats as THREE.Material[] | undefined;
    if (fadeMats) {
      for (const fm of fadeMats) {
        if ('opacity' in fm) {
          (fm as THREE.MeshStandardMaterial).opacity = opacity;
        }
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
            !this.hasDoubleJump &&
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
        if (this.hasSpiderSuit) this.triggerSpiderWebAction();
        else this.shootArrow();
      }
      if (this.hasSpiderSuit && this.webActive && gp.buttons[6]?.pressed) {
        this.releaseWeb(false);
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
    this.shaderTimeUniform.value = this.totalTime;
    if (this.shakeIntensity > 0) this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 1.8);

    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
    } else {
      this.stepSimulation(dt);
    }

    this.updateParticles(dt);
    this.updateCamera(dt);
    this.ambientMotes?.update(this.totalTime, this.playerPos);

    // Keep sky dome & infinite sea centered beneath camera/player
    this.skyMesh.position.copy(this.camera.position);
    if (this.hazardSeaMesh) {
      this.hazardSeaMesh.position.x = this.playerPos.x;
      this.hazardSeaMesh.position.z = this.playerPos.z;
    }
    if (this.hazardSeaTex) {
      const biome = this.currentLevel.theme.biome;
      if (
        biome === 'jungle' ||
        biome === 'temple' ||
        biome === 'ice' ||
        biome === 'volcanic' ||
        biome === 'paris' ||
        biome === 'rapids'
      ) {
        const spd = biome === 'volcanic' ? 0.028 : biome === 'temple' ? 0.019 : 0.015;
        this.hazardSeaTex.offset.x = (this.totalTime * spd) % 1;
        this.hazardSeaTex.offset.y = (this.totalTime * spd * 0.7) % 1;
        if (biome === 'volcanic') {
          this.textures.lavaEmissive.offset.copy(this.hazardSeaTex.offset);
        }
      } else if (biome === 'desert') {
        this.hazardSeaTex.offset.x = (this.totalTime * 0.008) % 1;
        this.hazardSeaTex.offset.y = (this.totalTime * 0.003) % 1;
      } else {
        this.hazardSeaTex.offset.set(0, 0);
      }
    }
    if (this.currentLevel.theme.biome === 'jungle' || this.currentLevel.theme.biome === 'temple') {
      this.textures.waterfallSurface.offset.y = (this.totalTime * 0.78) % 1;
    }
    if (this.currentLevel.theme.biome === 'rapids') {
      this.textures.rapidsWaterSurface.offset.y = (this.totalTime * 1.55) % 1;
      if (this.rapidsWaterfallTex) {
        this.rapidsWaterfallTex.offset.y = (this.totalTime * 1.35) % 1;
      }
      for (const dl of this.rapidsDriftingLogs) {
        const sx = Math.sin(this.totalTime * dl.speed + dl.phase) * dl.swingAmp;
        dl.pos.x = dl.baseX + sx;
        dl.group.position.set(dl.pos.x, dl.pos.y + 0.08 + Math.sin(this.totalTime * 3.8 + dl.phase) * 0.05, dl.pos.z);
        dl.group.rotation.y = Math.cos(this.totalTime * dl.speed + dl.phase) * 0.14;
        dl.group.rotation.z = Math.sin(this.totalTime * 3.1 + dl.phase) * 0.06;
      }
      for (const mr of this.rapidsMovingRocks) {
        mr.pos.x = mr.baseX + Math.sin(this.totalTime * mr.speed + mr.phase) * mr.ampX;
        mr.mesh.position.set(mr.pos.x, mr.pos.y + 0.35 + Math.sin(this.totalTime * 3.2 + mr.phase) * 0.04, mr.pos.z);
        mr.foam.position.set(mr.pos.x, mr.pos.y + 0.06, mr.pos.z);
      }
      for (const wp of this.rapidsWhirlpools) {
        wp.group.rotation.y += dt * 3.6 * wp.spinDir;
      }
      for (const mp of this.rapidsMistPlumes) {
        const cycle = (Math.sin(this.totalTime * 1.8 + mp.phase) + 1) * 0.5;
        mp.mesh.position.y = mp.baseY + cycle * 1.1;
        mp.mesh.scale.setScalar(mp.baseScale * (0.85 + cycle * 0.45));
      }
      if (this.rapidsMistZones.length > 0 && Math.random() < 0.35) {
        const mz = this.rapidsMistZones[Math.floor(Math.random() * this.rapidsMistZones.length)];
        const focusZ = this.boatState === 'sailing' ? this.boatPos.z : this.playerPos.z;
        if (Math.abs(mz.z - focusZ) < 48) {
          this.spawnBurst(mz.x + (Math.random() - 0.5) * 4.0, mz.y, mz.z + (Math.random() - 0.5) * 2.0, 0xe0f2fe, 1, 2.8);
        }
      }
      for (const rp of this.rapidsRipples) {
        if (rp.life > 0) {
          rp.life -= dt;
          if (rp.life <= 0) {
            rp.life = 0;
            rp.mesh.visible = false;
          } else {
            const p = 1 - rp.life / rp.maxLife;
            rp.mesh.scale.setScalar(1 + p * 2.8);
            (rp.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.55;
          }
        }
      }
    }

    // Animate Templo del Mono falling fluttering leaves, luminous fireflies & waterfall plunge spray
    if (this.templeFireflyTime) {
      this.templeFireflyTime.value = this.totalTime;
    }
    if (this.templeLeafMesh && this.templeLeafStates.length > 0) {
      for (let i = 0; i < this.templeLeafStates.length; i++) {
        const lf = this.templeLeafStates[i];
        lf.y -= lf.fallSpeed * dt;
        lf.x += Math.sin(this.totalTime * 1.8 + lf.swayPhase) * 0.85 * dt;
        lf.z += Math.cos(this.totalTime * 1.4 + lf.swayPhase) * 0.55 * dt;
        if (lf.y < this.currentLevel.theme.hazardFloorY + 0.3) {
          lf.y = this.playerPos.y + 14 + Math.random() * 8;
          lf.x = this.playerPos.x + (Math.random() - 0.5) * 38;
          lf.z = this.playerPos.z + (Math.random() - 0.5) * 44;
        }
        _vec3A.set(lf.x, lf.y, lf.z);
        _euler.set(
          Math.sin(this.totalTime * lf.rotSpeed + lf.swayPhase) * 0.8,
          this.totalTime * lf.rotSpeed * 0.6 + lf.swayPhase,
          Math.cos(this.totalTime * lf.rotSpeed + lf.swayPhase) * 0.9
        );
        _quat.setFromEuler(_euler);
        _vec3B.set(1, 1, 1);
        _mat4.compose(_vec3A, _quat, _vec3B);
        this.templeLeafMesh.setMatrixAt(i, _mat4);
      }
      this.templeLeafMesh.instanceMatrix.needsUpdate = true;
    }
    if (this.templeWaterfallPools.length > 0 && Math.random() < 0.32) {
      for (const wp of this.templeWaterfallPools) {
        if (wp.distanceToSquared(this.playerPos) < 42 * 42) {
          this.spawnBurst(
            wp.x + (Math.random() - 0.5) * 3.4,
            wp.y + 0.15,
            wp.z + (Math.random() - 0.5) * 3.4,
            0xe0f2fe,
            1,
            2.6
          );
          break;
        }
      }
    }
    if (this.jungleArchRings.length > 0) {
      for (let i = 0; i < this.jungleArchRings.length; i++) {
        const ring = this.jungleArchRings[i];
        ring.rotation.z = this.totalTime * (i % 2 === 0 ? 0.55 : -0.55);
        ring.rotation.y = Math.sin(this.totalTime * 0.9 + i) * 0.18;
      }
    }
    if (this.templeThermalRibbons.length > 0) {
      for (const rb of this.templeThermalRibbons) {
        rb.rotation.y = this.totalTime * 2.2;
      }
    }
    if (this.templeMistPlumes.length > 0) {
      for (const mp of this.templeMistPlumes) {
        const w = Math.sin(this.totalTime * 1.2 + mp.phase);
        mp.mesh.position.y = mp.baseY + w * 0.42;
        mp.mesh.scale.set(mp.baseScale * (1.0 + w * 0.12), mp.baseScale * (0.4 + w * 0.05), mp.baseScale * (0.9 - w * 0.08));
      }
    }
    if (this.templeRuneGlows.length > 0) {
      for (const rg of this.templeRuneGlows) {
        rg.mat.emissiveIntensity = 1.45 + Math.sin(this.totalTime * 2.6 + rg.phase) * 0.55;
      }
    }

    // Animate Dunas del Desierto dynamic phenomena (dust devils, hot-air geysers, sandstorms, astrolabes, crumbling masonry)
    if (this.desertMechanismSpinners.length > 0) {
      for (let i = 0; i < this.desertMechanismSpinners.length; i++) {
        const sp = this.desertMechanismSpinners[i];
        sp.rotation.z = this.totalTime * (i % 2 === 0 ? 0.65 : -0.65);
        sp.rotation.y = Math.sin(this.totalTime * 0.8 + i) * 0.22;
      }
    }
    if (this.desertThermalRibbons.length > 0) {
      for (const rb of this.desertThermalRibbons) {
        rb.rotation.y = this.totalTime * 2.2;
      }
    }
    if (this.desertDustDevils.length > 0) {
      for (const dd of this.desertDustDevils) {
        const ang = this.totalTime * dd.speed + dd.phase;
        dd.group.position.x = dd.baseX + Math.cos(ang) * dd.radius;
        dd.group.position.z = dd.baseZ + Math.sin(ang * 0.8) * dd.radius;
        dd.group.rotation.y = this.totalTime * 4.5;
        if (Math.random() < 0.12 && dd.group.position.distanceToSquared(this.playerPos) < 48 * 48) {
          this.spawnBurst(
            dd.group.position.x + (Math.random() - 0.5) * 2.4,
            dd.group.position.y + 1.5 + Math.random() * 4.0,
            dd.group.position.z + (Math.random() - 0.5) * 2.4,
            0xfbbf24,
            1,
            3.2
          );
        }
      }
    }
    if (this.desertGeysers.length > 0) {
      for (const gy of this.desertGeysers) {
        const cyc = ((((this.totalTime + gy.phase) % gy.period) + gy.period) % gy.period) / gy.period;
        const erupt = cyc < 0.45 ? Math.sin((cyc / 0.45) * Math.PI) : 0.08;
        gy.plume.scale.set(0.65 + erupt * 0.6, 0.22 + erupt * 1.15, 0.65 + erupt * 0.6);
        gy.plume.position.y = 1.3 + gy.plume.scale.y * 5.2;
        (gy.plume.material as THREE.MeshBasicMaterial).opacity = 0.1 + erupt * 0.36;
        gy.ring.position.y = 1.4 + cyc * 9.5;
        gy.ring.scale.setScalar(0.85 + cyc * 1.6);
        if (erupt > 0.6 && Math.random() < 0.25 && gy.pos.distanceToSquared(this.playerPos) < 44 * 44) {
          this.spawnBurst(gy.pos.x, gy.pos.y + 2.5, gy.pos.z, 0xfde047, 1, 4.5);
        }
      }
    }
    if (this.desertSandstormBands.length > 0) {
      for (const sb of this.desertSandstormBands) {
        sb.mesh.position.x = sb.baseX + Math.sin(this.totalTime * 0.35 + sb.phase) * 9.5;
        sb.mesh.position.z = sb.baseZ + ((this.totalTime * sb.speed) % 24) - 12;
      }
    }
    if (this.desertCollapsingMasonry.length > 0) {
      for (const cm of this.desertCollapsingMasonry) {
        const cyc = ((((this.totalTime + cm.phase) % cm.period) + cm.period) % cm.period) / cm.period;
        if (cyc > 0.72 && cyc < 0.88) {
          cm.mesh.position.x = cm.basePos.x + Math.sin(this.totalTime * 36) * 0.1;
          cm.mesh.position.y = cm.basePos.y - (cyc - 0.72) * 2.2;
          if (Math.random() < 0.18 && cm.basePos.distanceToSquared(this.playerPos) < 36 * 36) {
            this.spawnBurst(cm.basePos.x + 0.6, cm.basePos.y - 0.5, cm.basePos.z, 0xd99b52, 1, 2.2);
          }
        } else {
          cm.mesh.position.y = THREE.MathUtils.damp(cm.mesh.position.y, cm.basePos.y, 6, dt);
          cm.mesh.position.x = cm.basePos.x;
        }
      }
    }

    // Animate Glaciar Aurora polar wind ribbons, blizzard squalls, cold vapor & glowing crystal clusters
    if (this.iceThermalRibbons.length > 0) {
      for (const rb of this.iceThermalRibbons) {
        rb.rotation.y = this.totalTime * 2.5;
      }
    }
    if (this.iceBlizzardBands.length > 0) {
      for (const bb of this.iceBlizzardBands) {
        bb.mesh.position.x = bb.baseX + Math.sin(this.totalTime * 0.48 + bb.phase) * 14.5;
        bb.mesh.position.z = bb.baseZ + ((this.totalTime * bb.speed) % 24) - 12;
      }
    }
    if (this.iceVaporPlumes.length > 0) {
      for (const vp of this.iceVaporPlumes) {
        const wave = Math.sin(this.totalTime * 1.15 + vp.phase);
        vp.mesh.position.y = vp.baseY + wave * 0.35;
        vp.mesh.scale.set(1.5 + wave * 0.14, 0.38 + wave * 0.06, 1.35 - wave * 0.1);
      }
    }
    if (this.iceCrystalClusters.length > 0) {
      for (const cc of this.iceCrystalClusters) {
        cc.mat.emissiveIntensity = 1.25 + Math.sin(this.totalTime * 2.1 + cc.phase) * 0.65;
      }
    }
    if (this.iceMechanismBeam) {
      const swActive = this.switches.some((s) => s.id === 'sw-i1' && s.activated);
      this.iceMechanismBeam.mat.color.setHex(swActive ? 0x6ee7b7 : 0x38bdf8);
      this.iceMechanismBeam.mat.emissive.setHex(swActive ? 0x10b981 : 0x0284c7);
      this.iceMechanismBeam.mat.emissiveIntensity = swActive ? 2.2 + Math.sin(this.totalTime * 5.0) * 0.5 : 0.7;
    }

    // Animate Cañón Volcánico magma bubbles, lava/steam geysers, smoke columns, falling rocks, fissures & drifting ash
    if (this.volcanicThermalRibbons.length > 0) {
      for (const rb of this.volcanicThermalRibbons) {
        rb.rotation.y = this.totalTime * 2.6;
      }
    }
    if (this.volcanicFissureGlows.length > 0) {
      for (const fg of this.volcanicFissureGlows) {
        fg.mat.emissiveIntensity = 1.65 + Math.sin(this.totalTime * 2.8 + fg.phase) * 0.65;
      }
    }
    if (this.volcanicBubbles.length > 0) {
      for (const vb of this.volcanicBubbles) {
        const cyc = ((((this.totalTime + vb.phase) % vb.period) + vb.period) % vb.period) / vb.period;
        if (cyc < 0.78) {
          vb.popped = false;
          const grow = cyc / 0.78;
          const r = vb.maxR * (0.25 + grow * 0.85);
          vb.mesh.visible = true;
          vb.mesh.scale.set(r, r * (0.65 + grow * 0.35), r);
          (vb.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.6 + grow * 2.2;
        } else {
          vb.mesh.visible = false;
          if (!vb.popped) {
            vb.popped = true;
            if (vb.pos.distanceToSquared(this.playerPos) < 48 * 48) {
              this.spawnBurst(vb.pos.x, vb.pos.y + 0.45, vb.pos.z, 0xfef08a, 5, 4.2);
            }
          }
        }
      }
    }
    if (this.volcanicGeysers.length > 0) {
      for (const gy of this.volcanicGeysers) {
        const cyc = ((((this.totalTime + gy.phase) % gy.period) + gy.period) % gy.period) / gy.period;
        const erupt = cyc < 0.46 ? Math.sin((cyc / 0.46) * Math.PI) : 0.06;
        gy.lavaJet.scale.set(0.55 + erupt * 0.55, 0.14 + erupt * 1.18, 0.55 + erupt * 0.55);
        gy.lavaJet.position.y = 0.9 + gy.lavaJet.scale.y * 5.6;
        (gy.lavaJet.material as THREE.MeshBasicMaterial).opacity = gy.kind === 'lava' ? 0.18 + erupt * 0.68 : 0.1 + erupt * 0.38;

        gy.steamPlume.position.y = 2.2 + cyc * 14.0;
        gy.steamPlume.scale.setScalar(0.75 + cyc * 1.9);
        (gy.steamPlume.material as THREE.MeshBasicMaterial).opacity = (1 - cyc) * (gy.kind === 'lava' ? 0.45 : 0.34);

        if (erupt > 0.65 && Math.random() < 0.24 && gy.pos.distanceToSquared(this.playerPos) < 52 * 52) {
          this.spawnBurst(
            gy.pos.x + (Math.random() - 0.5) * 1.2,
            gy.pos.y + 4.5 + Math.random() * 4.5,
            gy.pos.z + (Math.random() - 0.5) * 1.2,
            gy.kind === 'lava' ? 0xfb923c : 0xe7e5e4,
            1,
            4.8
          );
        }
      }
    }
    if (this.volcanicSmokePuffs.length > 0) {
      for (const sp of this.volcanicSmokePuffs) {
        const cyc = (this.totalTime * sp.speed + sp.phase) % 1;
        sp.mesh.position.set(
          sp.baseX + Math.sin(this.totalTime * 0.6 + sp.phase * 6.0) * (1.2 + cyc * 2.4),
          sp.baseY + cyc * sp.riseH,
          sp.baseZ + Math.cos(this.totalTime * 0.5 + sp.phase * 5.0) * (1.2 + cyc * 2.2)
        );
        const s = sp.baseScale * (0.65 + cyc * 1.65);
        sp.mesh.scale.setScalar(s);
        (sp.mesh.material as THREE.MeshBasicMaterial).opacity = Math.sin(cyc * Math.PI) * 0.42;
      }
    }
    if (this.volcanicFallingRocks.length > 0) {
      for (const fr of this.volcanicFallingRocks) {
        const cyc = ((((this.totalTime + fr.phase) % fr.period) + fr.period) % fr.period) / fr.period;
        if (cyc < 0.68) {
          fr.splashed = false;
          const t = cyc / 0.68;
          const curY = THREE.MathUtils.lerp(fr.startY, -12.2, t * t);
          fr.mesh.visible = true;
          fr.mesh.position.set(fr.startX + t * 1.4, curY, fr.startZ);
          fr.mesh.rotateOnAxis(fr.rotAxis, dt * 4.2);
        } else {
          fr.mesh.visible = false;
          if (!fr.splashed) {
            fr.splashed = true;
            if (fr.mesh.position.distanceToSquared(this.playerPos) < 55 * 55) {
              this.spawnBurst(fr.startX + 1.4, -11.5, fr.startZ, 0xf97316, 8, 5.4);
            }
          }
        }
      }
    }
    if (this.volcanicAshMesh && this.volcanicAshStates.length > 0) {
      for (let i = 0; i < this.volcanicAshStates.length; i++) {
        const a = this.volcanicAshStates[i];
        a.y -= a.fallSpeed * dt;
        if (a.y < -10) a.y = 14;
        const ax = this.playerPos.x + a.x + Math.sin(this.totalTime * 1.2 + a.swayPhase) * 1.6;
        const az = this.playerPos.z + a.z + Math.cos(this.totalTime * 0.9 + a.swayPhase) * 1.6;
        _vec3A.set(ax, Math.max(-10.5, this.playerPos.y + a.y), az);
        _euler.set(this.totalTime * a.rotSpeed, a.swayPhase + this.totalTime * 0.7, this.totalTime * a.rotSpeed * 0.6);
        _quat.setFromEuler(_euler);
        _vec3B.set(1, 1, 1);
        _mat4.compose(_vec3A, _quat, _vec3B);
        this.volcanicAshMesh.setMatrixAt(i, _mat4);
      }
      this.volcanicAshMesh.instanceMatrix.needsUpdate = true;
    }

    // Animate Ciudadela Nebulosa orbital rings, floating sky-citadels/islands, volumetric clouds & void waterfalls
    if (this.nebulaThermalRibbons.length > 0) {
      for (const rb of this.nebulaThermalRibbons) {
        rb.rotation.y = this.totalTime * 2.4;
      }
    }
    if (this.nebulaSpinners.length > 0) {
      for (const sp of this.nebulaSpinners) {
        if (sp.axis === 'x') sp.obj.rotation.x += sp.speed * dt;
        else if (sp.axis === 'y') sp.obj.rotation.y += sp.speed * dt;
        else sp.obj.rotation.z += sp.speed * dt;
      }
    }
    if (this.nebulaFloatNodes.length > 0) {
      for (const fn of this.nebulaFloatNodes) {
        fn.obj.position.y = fn.baseY + Math.sin(this.totalTime * fn.speed + fn.phase) * fn.amp;
      }
    }
    if (this.nebulaCloudBanks.length > 0) {
      for (const cb of this.nebulaCloudBanks) {
        cb.group.position.x = cb.baseX + Math.sin(this.totalTime * 0.18 * Math.abs(cb.speed) + cb.phase) * cb.spanX;
        cb.group.position.y = cb.baseY + Math.cos(this.totalTime * 0.35 + cb.phase) * 0.45;
      }
    }
    if (this.nebulaWaterfallTex) {
      this.nebulaWaterfallTex.offset.y -= dt * 1.15;
    }
    if (this.nebulaWaterfallDrops.length > 0 && Math.random() < 0.25) {
      const wp = this.nebulaWaterfallDrops[Math.floor(Math.random() * this.nebulaWaterfallDrops.length)];
      if (wp.distanceToSquared(this.playerPos) < 58 * 58) {
        this.spawnBurst(
          wp.x + (Math.random() - 0.5) * 1.1,
          wp.y - Math.random() * 1.2,
          wp.z + (Math.random() - 0.5) * 1.1,
          0xa5f3fc,
          1,
          3.4
        );
      }
    }

    // Animate Cielos de París golden sunset balloons, soaring birds, drifting clouds, clocktower hands, thermal updrafts & falling leaves
    if (this.parisThermalRibbons.length > 0) {
      for (const rb of this.parisThermalRibbons) {
        rb.rotation.y = this.totalTime * 2.25;
      }
    }
    if (this.parisBalloons.length > 0) {
      for (const b of this.parisBalloons) {
        b.group.position.set(
          b.baseX + Math.sin(this.totalTime * 0.45 + b.phase) * b.swayAmp,
          b.baseY + Math.cos(this.totalTime * 0.8 + b.phase) * 0.85,
          b.baseZ
        );
        b.group.rotation.y = Math.sin(this.totalTime * 0.3 + b.phase) * 0.18;
      }
    }
    if (this.parisBirds.length > 0) {
      for (const bd of this.parisBirds) {
        const a = this.totalTime * bd.speed + bd.phase;
        const bx = bd.center.x + Math.cos(a) * bd.radius;
        const bz = bd.center.z + Math.sin(a) * bd.radius;
        const by = bd.center.y + Math.sin(a * 2.1) * 0.9;
        bd.group.position.set(bx, by, bz);
        bd.group.rotation.y = -a;
        const flap = Math.sin(this.totalTime * 9.5 + bd.phase) * 0.62;
        bd.wingL.rotation.z = flap;
        bd.wingR.rotation.z = -flap;
      }
    }
    if (this.parisClouds.length > 0) {
      for (const cl of this.parisClouds) {
        cl.group.position.x = cl.baseX + Math.sin(this.totalTime * cl.speed + cl.phase) * cl.spanX;
        cl.group.position.y = cl.baseY + Math.cos(this.totalTime * 0.35 + cl.phase) * 0.42;
      }
    }
    if (this.parisClockHands.length > 0) {
      for (const ch of this.parisClockHands) {
        ch.minuteHand.rotation.x -= dt * 0.85;
        ch.hourHand.rotation.x -= dt * 0.08;
      }
    }
    if (this.parisLeafMesh && this.parisLeafStates.length > 0) {
      for (let i = 0; i < this.parisLeafStates.length; i++) {
        const lf = this.parisLeafStates[i];
        lf.y -= lf.fallSpeed * dt;
        if (lf.y < -8) lf.y = 12;
        const lx = this.playerPos.x + lf.x + Math.sin(this.totalTime * 1.4 + lf.swayPhase) * 1.8;
        const lz = this.playerPos.z + lf.z + Math.cos(this.totalTime * 1.0 + lf.swayPhase) * 1.5;
        _vec3A.set(lx, Math.max(-5.2, this.playerPos.y + lf.y), lz);
        _euler.set(this.totalTime * lf.rotSpeed, lf.swayPhase + this.totalTime * 0.8, this.totalTime * lf.rotSpeed * 0.7);
        _quat.setFromEuler(_euler);
        _vec3B.set(1, 1, 1);
        _mat4.compose(_vec3A, _quat, _vec3B);
        this.parisLeafMesh.setMatrixAt(i, _mat4);
      }
      this.parisLeafMesh.instanceMatrix.needsUpdate = true;
    }

    // NYC Animated Vehicles, Pedestrians, Helicopters & Web Target Reticle
    if (this.currentLevel.theme.biome === 'newyork') {
      for (const v of this.nycVehicles) {
        if (v.axis === 'z') {
          v.group.position.z += v.dir * v.speed * dt;
          if (v.dir < 0 && v.group.position.z < v.minC) v.group.position.z = v.maxC;
          else if (v.dir > 0 && v.group.position.z > v.maxC) v.group.position.z = v.minC;
        } else {
          v.group.position.x += v.dir * v.speed * dt;
          if (v.dir > 0 && v.group.position.x > v.maxC) v.group.position.x = v.minC;
          else if (v.dir < 0 && v.group.position.x < v.minC) v.group.position.x = v.maxC;
        }
      }
      for (const h of this.nycHelicopters) {
        const ang = this.totalTime * h.speed + h.phase;
        const hx = h.center.x + Math.cos(ang) * h.radius;
        const hz = h.center.z + Math.sin(ang) * h.radius;
        const hy = h.center.y + Math.sin(this.totalTime * 1.4 + h.phase) * 0.85;
        h.group.position.set(hx, hy, hz);
        h.group.rotation.y = -ang + (h.speed >= 0 ? 0 : Math.PI);
        const mainRotor = h.group.userData.mainRotor as THREE.Object3D | undefined;
        const tailRotor = h.group.userData.tailRotor as THREE.Object3D | undefined;
        if (mainRotor) mainRotor.rotation.y += dt * 26;
        if (tailRotor) tailRotor.rotation.x += dt * 32;
      }
      if (this.nycPedestrianMesh && this.nycPedestrianStates.length > 0) {
        for (let i = 0; i < this.nycPedestrianStates.length; i++) {
          const ps = this.nycPedestrianStates[i];
          const offsetZ = Math.sin(this.totalTime * 0.35 * Math.abs(ps.speed) + ps.phase) * ps.span;
          const bob = Math.abs(Math.sin(this.totalTime * 7.5 + ps.phase)) * 0.08;
          _vec3A.set(ps.x, ps.y + bob, ps.z + offsetZ);
          _quat.identity();
          _vec3B.set(1, 1, 1);
          _mat4.compose(_vec3A, _quat, _vec3B);
          this.nycPedestrianMesh.setMatrixAt(i, _mat4);
        }
        this.nycPedestrianMesh.instanceMatrix.needsUpdate = true;
      }
      for (let i = 0; i < this.webAnchorBeacons.length; i++) {
        const b = this.webAnchorBeacons[i];
        b.rotation.y += dt * 1.6;
        const pulse = 0.92 + Math.sin(this.totalTime * 4 + i) * 0.12;
        b.scale.setScalar(pulse);
      }
      if (this.hasSpiderSuit && this.webReticleMesh) {
        if (!this.webActive && this.phase === 'playing' && this.spiderTransformTimer <= 0) {
          this.highlightedWebAnchor = this.findBestWebAnchor();
        } else if (this.webActive) {
          this.highlightedWebAnchor = this.webAnchor;
        } else {
          this.highlightedWebAnchor = null;
        }
        if (this.highlightedWebAnchor) {
          this.webReticleMesh.visible = true;
          this.webReticleMesh.position.copy(this.highlightedWebAnchor);
          this.webReticleMesh.lookAt(this.camera.position);
          this.webReticleMesh.rotation.z = this.totalTime * 3.2;
          const rMat = this.webReticleMesh.material as THREE.MeshBasicMaterial;
          rMat.color.setHex(this.webActive ? 0xfacc15 : 0xf43f5e);
        } else {
          this.webReticleMesh.visible = false;
        }
      }
    }

    this.renderer.render(this.scene, this.camera);

    if (now - this.lastHudPush > 85) this.pushHud(false);
    this.scheduleNextTick();
  };

  private stepSimulation(dt: number) {
    const isDesertV2 = this.currentLevel.index === 1;
    for (const p of this.platforms) {
      p.prevPos.copy(p.pos);
      p.prevRotAngle = p.rotAngle;

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
      } else if (p.def.kind === 'elevator' && p.def.moveOffset && p.activated) {
        const speed = p.def.moveSpeed ?? 1.1;
        const phase = p.def.movePhase ?? 0;
        const s = 0.5 - 0.5 * Math.cos(this.totalTime * speed + phase);
        p.pos.set(
          p.basePos.x + p.def.moveOffset[0] * s,
          p.basePos.y + p.def.moveOffset[1] * s,
          p.basePos.z + p.def.moveOffset[2] * s
        );
        p.mesh.position.copy(p.pos);
      } else if (p.def.kind === 'rotating') {
        const rotSpeed = p.def.rotSpeed ?? 1.0;
        p.rotAngle += rotSpeed * dt;
        p.mesh.rotation.y = p.rotAngle;
      } else if (p.def.kind === 'disappearing' && p.activated) {
        const period = p.def.cyclePeriod ?? 4.6;
        const phase = p.def.cyclePhase ?? 0;
        const cycle = ((((this.totalTime + phase) % period) + period) % period) / period;
        if (cycle < 0.52) {
          p.disappearState = 'solid';
          p.visible = true;
          this.setPlatformOpacity(p.mesh, 1.0);
          p.mesh.castShadow = !this.isSoftwareGl;
        } else if (cycle < 0.72) {
          p.disappearState = 'warning';
          p.visible = true;
          const blink = Math.floor(this.totalTime * 16) % 2 === 0 ? 0.92 : 0.35;
          this.setPlatformOpacity(p.mesh, blink);
          p.mesh.castShadow = !this.isSoftwareGl;
        } else {
          p.disappearState = 'hidden';
          p.visible = false;
          this.setPlatformOpacity(p.mesh, 0.14);
          p.mesh.castShadow = false;
        }
      } else if (p.def.kind === 'crumble') {
        if (p.crumbleState === 'shaking') {
          p.crumbleTimer -= dt;
          p.mesh.position.set(
            p.basePos.x + (Math.random() - 0.5) * 0.14,
            p.basePos.y - 0.04,
            p.basePos.z + (Math.random() - 0.5) * 0.14
          );
          if (isDesertV2 && Math.random() < 0.45) {
            this.spawnBurst(p.pos.x + (Math.random() - 0.5) * 2.2, p.pos.y - 0.3, p.pos.z + (Math.random() - 0.5) * 2.2, 0xe6a855, 1, 2.2);
          }
          if (p.crumbleTimer <= 0) {
            p.crumbleState = 'fallen';
            p.crumbleTimer = 2.6;
            p.visible = false;
            if (!isDesertV2) {
              p.mesh.visible = false;
            }
            this.spawnBurst(p.pos.x, p.pos.y, p.pos.z, isDesertV2 ? 0xe6a855 : 0xf97316, 14, 3.6);
          }
        } else if (p.crumbleState === 'fallen') {
          p.crumbleTimer -= dt;
          if (isDesertV2) {
            // Smoothly sink into canyon sand and rise back smoothly before reforming
            const elapsed = 2.6 - p.crumbleTimer;
            if (elapsed < 0.7) {
              const t = elapsed / 0.7;
              p.mesh.visible = true;
              p.mesh.position.set(p.basePos.x, p.basePos.y - t * 3.4, p.basePos.z);
              this.setPlatformOpacity(p.mesh, Math.max(0.08, 1 - t));
            } else if (p.crumbleTimer < 0.48) {
              const t = p.crumbleTimer / 0.48;
              p.mesh.visible = true;
              p.mesh.position.set(p.basePos.x, p.basePos.y - t * 3.2, p.basePos.z);
              this.setPlatformOpacity(p.mesh, 1 - t * 0.85);
            } else {
              p.mesh.visible = false;
            }
          }
          if (p.crumbleTimer <= 0) {
            p.crumbleState = 'idle';
            p.visible = true;
            p.mesh.visible = true;
            p.mesh.position.copy(p.basePos);
            if (isDesertV2) this.setPlatformOpacity(p.mesh, 1.0);
          }
        }
      }

      // Animate deploying/unfolding ancient sandstone & boreal crystal mechanism gears + ice fracture glow decay
      if (isDesertV2 && p.mesh.userData.deployWings) {
        const wings = p.mesh.userData.deployWings as THREE.Object3D[];
        const targetFold = p.activated && p.visible ? 0 : 1.15;
        for (let w = 0; w < wings.length; w++) {
          const sign = w === 0 ? 1 : -1;
          wings[w].rotation.z = THREE.MathUtils.damp(wings[w].rotation.z, sign * targetFold, 6, dt);
        }
      }
      if ((isDesertV2 || this.currentLevel.index === 2 || this.currentLevel.index === 4) && p.mesh.userData.mechanismSpin) {
        (p.mesh.userData.mechanismSpin as THREE.Object3D).rotation.z += dt * (p.activated ? 1.5 : 0.25);
      }
      if (this.currentLevel.index === 2 && p.mesh.userData.iceCrackSeams) {
        const flash = Math.max(0, Number(p.mesh.userData.fractureFlash ?? 0) - dt * 1.8);
        p.mesh.userData.fractureFlash = flash;
        const seams = p.mesh.userData.iceCrackSeams as THREE.Mesh[];
        const isWarn = p.def.kind === 'disappearing' && p.disappearState === 'warning';
        const glow = isWarn ? 2.8 : 0.95 + flash * 2.2;
        for (const s of seams) {
          const m = s.material as THREE.MeshStandardMaterial;
          m.emissiveIntensity = glow;
          m.emissive.setHex(isWarn ? 0x22d3ee : 0x38bdf8);
        }
      }
      if (this.currentLevel.index === 4 && p.mesh.userData.volcanicHeatMats) {
        const mats = p.mesh.userData.volcanicHeatMats as THREE.MeshStandardMaterial[];
        let heat = Number(p.mesh.userData.heatLevel ?? 0.22);
        const isStanding = this.standingPlatform === p;
        const isShaking = p.crumbleState === 'shaking';
        const isWarn = p.def.kind === 'disappearing' && p.disappearState === 'warning';
        if (isShaking) {
          heat = Math.min(1.0, heat + dt * 2.4);
          if (Math.random() < 0.35) {
            this.spawnBurst(
              p.pos.x + (Math.random() - 0.5) * 2.4,
              p.pos.y + p.halfSize.y + 0.1,
              p.pos.z + (Math.random() - 0.5) * 2.4,
              0xfef08a,
              1,
              2.6
            );
          }
        } else if (isWarn) {
          heat = Math.min(1.0, heat + dt * 2.2);
        } else if (isStanding) {
          heat = Math.min(1.0, heat + dt * 0.85);
          if (heat > 0.65 && Math.random() < 0.18) {
            this.spawnBurst(
              p.pos.x + (Math.random() - 0.5) * 2.0,
              p.pos.y + p.halfSize.y + 0.08,
              p.pos.z + (Math.random() - 0.5) * 2.0,
              0xfb923c,
              1,
              2.0
            );
          }
        } else {
          heat = Math.max(0.2, heat - dt * 0.45);
        }
        p.mesh.userData.heatLevel = heat;
        _color.setHex(0xea580c).lerp(new THREE.Color(0xfef08a), heat * 0.85);
        const pulse = Math.sin(this.totalTime * 6.5) * 0.25 * heat;
        for (const m of mats) {
          m.emissive.copy(_color);
          m.emissiveIntensity = 0.48 + heat * 2.8 + pulse;
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
    for (const sw of this.switches) {
      if (!sw.activated) {
        sw.buttonMesh.position.y = 0.28 + Math.sin(this.totalTime * 4.5) * 0.04;
      }
    }
    for (const rel of this.relics) {
      if (rel.collected) continue;
      rel.core.rotation.y += dt * 1.9;
      rel.core.rotation.x = Math.sin(this.totalTime * 1.4 + rel.phase) * 0.25;
      rel.halo.rotation.z -= dt * 2.4;
      rel.group.position.y = rel.baseY + Math.sin(this.totalTime * 2.6 + rel.phase) * 0.18;
    }
    for (const wz of this.windZones) {
      wz.swirls.forEach((swirl, idx) => {
        swirl.rotation.z += dt * (1.8 + idx * 0.35);
        swirl.position.y += dt * 2.6;
        if (swirl.position.y > wz.height) {
          swirl.position.y -= wz.height;
        }
      });
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
      const baseWaterY = croc.pos.y;
      if (croc.behavior === 'ambush') {
        const distAhead = boatZ - croc.pos.z;
        const triggered = this.boatState === 'sailing' && distAhead < 34 && distAhead > -14;
        if (triggered && croc.emergeProgress < 1) {
          croc.emergeProgress = Math.min(1, croc.emergeProgress + dt * 2.5);
          if (!croc.emergedSplash && croc.emergeProgress > 0.25) {
            croc.emergedSplash = true;
            soundEngine.playSplash();
            this.spawnBurst(croc.pos.x, baseWaterY + 0.25, croc.pos.z, 0xe0f2fe, 14, 5.2);
          }
        } else if (!triggered) {
          croc.emergeProgress = Math.max(0, croc.emergeProgress - dt * 1.4);
          if (croc.emergeProgress <= 0.05) croc.emergedSplash = false;
        }
        const targetY = THREE.MathUtils.lerp(baseWaterY - 1.25, baseWaterY + 0.08, croc.emergeProgress);
        const bob = croc.emergeProgress * Math.sin(this.totalTime * 5.2 + croc.phase) * 0.04;
        croc.rig.group.position.set(croc.pos.x, targetY + bob, croc.pos.z);
        croc.rig.group.rotation.y = Math.sin(arg) * 0.28;
        croc.rig.jawUpper.rotation.x =
          -0.12 - croc.emergeProgress * (0.58 + Math.abs(Math.sin(this.totalTime * 6.0 + croc.phase)) * 0.22);
        croc.rig.tailGroup.rotation.y = Math.sin(this.totalTime * 7.5 + croc.phase) * 0.35;
      } else {
        croc.rig.group.position.set(croc.pos.x, baseWaterY + 0.04 + Math.sin(this.totalTime * 4 + croc.phase) * 0.04, croc.pos.z);
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
    this.webCooldown = Math.max(0, this.webCooldown - dt);

    // Step Active Arrows, Web Shots, Enemy Projectiles & Timed Challenges
    this.stepArrows(dt);
    this.stepWebShots(dt);
    this.stepEnemyProjectiles(dt);
    if (this.hasSpiderSuit) {
      this.stepTimedChallenges(dt);
    }

    // CINEMATIC SPIDER-MAN TRANSFORMATION SEQUENCE (Level 09 start)
    if (this.hasSpiderSuit && this.spiderTransformTimer > 0) {
      this.spiderTransformTimer = Math.max(0, this.spiderTransformTimer - dt);
      const progress = 1 - this.spiderTransformTimer / 2.15;
      this.playerPos.x = this.spawnPos.x;
      this.playerPos.z = this.spawnPos.z;
      this.playerPos.y = this.spawnPos.y + Math.sin(progress * Math.PI) * 1.15;
      this.playerYaw += dt * (4.5 + progress * 8.0);
      const aura = this.playerRig.transformAura;
      aura.visible = true;
      aura.rotation.y -= dt * 5.2;
      aura.rotation.z += dt * 3.1;
      const auraScale = 0.78 + Math.sin(progress * Math.PI) * 0.65;
      aura.scale.setScalar(auraScale);

      if (Math.random() < 0.85) {
        const pCol = Math.random() < 0.45 ? 0xe11d48 : Math.random() < 0.7 ? 0x2563eb : 0xf8fafc;
        this.spawnBurst(
          this.playerPos.x + (Math.random() - 0.5) * 0.9,
          this.playerPos.y + 0.6 + Math.random() * 0.8,
          this.playerPos.z + (Math.random() - 0.5) * 0.9,
          pCol,
          2,
          3.4
        );
      }

      if (this.spiderTransformTimer <= 0.95 && !this.spiderTransformDone) {
        this.spiderTransformDone = true;
        for (const part of this.playerRig.astroParts) part.visible = false;
        for (const part of this.playerRig.spiderParts) part.visible = true;
        this.shakeIntensity = 0.32;
        this.spawnBurst(this.playerPos.x, this.playerPos.y + 0.9, this.playerPos.z, 0xe11d48, 28, 7.2);
        this.spawnBurst(this.playerPos.x, this.playerPos.y + 0.9, this.playerPos.z, 0x2563eb, 24, 6.4);
        this.spawnBurst(this.playerPos.x, this.playerPos.y + 0.9, this.playerPos.z, 0xf8fafc, 18, 5.5);
        this.pushHud(true);
      }

      if (this.spiderTransformTimer <= 0) {
        aura.visible = false;
        this.playerPos.copy(this.spawnPos);
        this.playerYaw = Math.PI;
        this.grounded = true;
        this.showBanner('¡Spider-Man listo! Clic Izq / G / RT: Telaraña · Empuja edificios para escalar', 4.2);
        this.pushHud(true);
      }
      this.animatePlayerVisuals(dt, 0);
      return;
    }

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

    // CINEMATIC DISCOVERY ZONE DETECTION
    let foundDiscovery: CameraDiscoveryZoneDef | null = null;
    if (this.currentLevel.discoveryZones && !this.active2DZone) {
      for (const dz of this.currentLevel.discoveryZones) {
        if (
          this.playerPos.x >= dz.min[0] &&
          this.playerPos.x <= dz.max[0] &&
          this.playerPos.y >= dz.min[1] &&
          this.playerPos.y <= dz.max[1] &&
          this.playerPos.z >= dz.min[2] &&
          this.playerPos.z <= dz.max[2]
        ) {
          foundDiscovery = dz;
          break;
        }
      }
    }
    if (foundDiscovery !== this.activeDiscoveryZone) {
      this.activeDiscoveryZone = foundDiscovery;
      if (foundDiscovery?.banner && !this.triggeredDiscoveryBanners.has(foundDiscovery.id)) {
        this.triggeredDiscoveryBanners.add(foundDiscovery.id);
        this.showBanner(foundDiscovery.banner, 3.2);
      }
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

      if (this.standingPlatform.def.kind === 'rotating') {
        const dAng = this.standingPlatform.rotAngle - this.standingPlatform.prevRotAngle;
        if (Math.abs(dAng) > 1e-6) {
          const rx = this.playerPos.x - this.standingPlatform.pos.x;
          const rz = this.playerPos.z - this.standingPlatform.pos.z;
          const cosA = Math.cos(dAng);
          const sinA = Math.sin(dAng);
          this.playerPos.x = this.standingPlatform.pos.x + (rx * cosA + rz * sinA);
          this.playerPos.z = this.standingPlatform.pos.z + (-rx * sinA + rz * cosA);
          this.playerYaw += dAng;
        }
      }

      if (this.standingPlatform.def.kind === 'conveyor' && this.standingPlatform.def.conveyorDir) {
        this.playerPos.x += this.standingPlatform.def.conveyorDir[0] * dt;
        this.playerPos.z += this.standingPlatform.def.conveyorDir[1] * dt;
      }
    }

    if (this.grounded) {
      this.coyoteTimer = 0.12;
      this.hasDoubleJump = true;
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

    // CLIMBING STATE (Monkey Suit OR Level 09 Spider-Man 4-Face Building Climbing)
    if (this.isClimbing && (this.climbingWall || this.climbFace)) {
      const face = this.climbingWall ? this.climbingWall.def.face : this.climbFace!;
      const cPos = this.climbingWall ? this.climbingWall.pos : this.climbBoxCenter;
      const cHalf = this.climbingWall ? this.climbingWall.halfSize : this.climbBoxHalf;
      const topY = cPos.y + cHalf.y;
      const botY = cPos.y - cHalf.y;

      soundEngine.stopHover();
      this.isHovering = false;
      this.grounded = false;
      this.standingPlatform = null;
      this.hasDoubleJump = true;
      this.hoverFuel = 1;
      this.playerVel.set(0, 0, 0);

      // Climb vertical (W/Up = -inZ, S/Down = +inZ) and lateral shimmy (A/D = inX)
      const climbInput = -inZ;
      const climbSpeed = this.hasSpiderSuit ? 8.2 : 6.2;
      const shimmySpeed = this.hasSpiderSuit ? 6.2 : 4.6;
      this.playerPos.y += climbInput * climbSpeed * dt;

      if (face === 'pz') {
        this.playerYaw = Math.PI;
        this.playerPos.z = cPos.z + cHalf.z + 0.42;
        this.playerPos.x = THREE.MathUtils.clamp(
          this.playerPos.x + inX * shimmySpeed * dt,
          cPos.x - cHalf.x + 0.42,
          cPos.x + cHalf.x - 0.42
        );
      } else if (face === 'nz') {
        this.playerYaw = 0;
        this.playerPos.z = cPos.z - cHalf.z - 0.42;
        this.playerPos.x = THREE.MathUtils.clamp(
          this.playerPos.x - inX * shimmySpeed * dt,
          cPos.x - cHalf.x + 0.42,
          cPos.x + cHalf.x - 0.42
        );
      } else if (face === 'px') {
        this.playerYaw = -Math.PI / 2;
        this.playerPos.x = cPos.x + cHalf.x + 0.42;
        this.playerPos.z = THREE.MathUtils.clamp(
          this.playerPos.z - inX * shimmySpeed * dt,
          cPos.z - cHalf.z + 0.42,
          cPos.z + cHalf.z - 0.42
        );
      } else {
        this.playerYaw = Math.PI / 2;
        this.playerPos.x = cPos.x - cHalf.x - 0.42;
        this.playerPos.z = THREE.MathUtils.clamp(
          this.playerPos.z + inX * shimmySpeed * dt,
          cPos.z - cHalf.z + 0.42,
          cPos.z + cHalf.z - 0.42
        );
      }

      if (Math.abs(climbInput) > 0.15 || Math.abs(inX) > 0.15) {
        soundEngine.playClimbStep();
      }

      // Mantle onto top when reaching top edge
      if (this.playerPos.y >= topY - 0.08) {
        this.isClimbing = false;
        this.climbingWall = null;
        this.climbFace = null;
        this.playerPos.y = topY + 0.08;
        if (face === 'pz') this.playerPos.z -= 0.9;
        else if (face === 'nz') this.playerPos.z += 0.9;
        else if (face === 'px') this.playerPos.x -= 0.9;
        else this.playerPos.x += 0.9;
        this.playerVel.set(0, 3.6, 0);
        this.grounded = true;
        soundEngine.playJump();
        this.spawnBurst(this.playerPos.x, this.playerPos.y, this.playerPos.z, this.hasSpiderSuit ? 0xe11d48 : 0x10b981, 10, 3.0);
        this.pushHud(true);
      } else if (this.jumpBufferTimer > 0) {
        // Wall-jump off climbable wall
        this.jumpBufferTimer = 0;
        this.isClimbing = false;
        this.climbingWall = null;
        this.climbFace = null;
        const kick = this.hasSpiderSuit ? 8.6 : 7.2;
        this.playerVel.y = this.hasSpiderSuit ? 12.8 : 12.0;
        if (face === 'pz') this.playerVel.z = kick;
        else if (face === 'nz') this.playerVel.z = -kick;
        else if (face === 'px') this.playerVel.x = kick;
        else this.playerVel.x = -kick;
        if (this.hasSpiderSuit) this.doubleJumpFlipTimer = 0.36;
        soundEngine.playJump();
        this.pushHud(true);
      } else if (this.playerPos.y < botY + 0.15 && climbInput < -0.1) {
        this.isClimbing = false;
        this.climbingWall = null;
        this.climbFace = null;
        if (face === 'pz') this.playerPos.z += 0.35;
        else if (face === 'nz') this.playerPos.z -= 0.35;
        else if (face === 'px') this.playerPos.x += 0.35;
        else this.playerPos.x -= 0.35;
        this.pushHud(true);
      }

      this.contactShadowMesh.visible = false;
    } else if (this.hasSpiderSuit && this.webActive) {
      // REAL PENDULUM WEB-SWINGING PHYSICS (Level 09)
      this.stepWebSwinging(dt, worldDirX, worldDirZ);
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
      } else if (this.jumpBufferTimer > 0 && !this.grounded && this.hasDoubleJump && this.botRocketTimer <= 0) {
        this.hasDoubleJump = false;
        this.playerVel.y = 11.4;
        this.doubleJumpFlipTimer = 0.38;
        this.jumpBufferTimer = 0;
        this.playerSquash.set(0.8, 1.25, 0.8);
        soundEngine.playDoubleJump();
        this.spawnBurst(this.playerPos.x, this.playerPos.y + 0.15, this.playerPos.z, 0x38bdf8, 12, 3.6);
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
        let inWindZone = false;
        for (const wz of this.windZones) {
          const wdx = this.playerPos.x - wz.pos.x;
          const wdz = this.playerPos.z - wz.pos.z;
          if (
            wdx * wdx + wdz * wdz <= wz.radius * wz.radius &&
            this.playerPos.y >= wz.pos.y - 0.5 &&
            this.playerPos.y <= wz.pos.y + wz.height + 0.6
          ) {
            inWindZone = true;
            if (this.isHovering) soundEngine.stopHover();
            this.isHovering = false;
            this.playerVel.y = THREE.MathUtils.damp(this.playerVel.y, wz.liftSpeed, 7.5, dt);
            this.hoverFuel = Math.min(1, this.hoverFuel + dt * 1.4);
            this.hasDoubleJump = true;
            if (Math.random() < 0.25) {
              this.spawnBurst(this.playerPos.x, this.playerPos.y + 0.2, this.playerPos.z, 0xbae6fd, 1, 2.2);
            }
            break;
          }
        }

        if (!inWindZone) {
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
        const topY = p.pos.y + p.halfSize.y;
        const botY = p.pos.y - p.halfSize.y;
        const isDisc = p.def.kind === 'rotating' || p.def.shape === 'disc' || p.def.shape === 'pillar';

        if (isDisc) {
          const rad = Math.max(p.halfSize.x, p.halfSize.z);
          const dx = this.playerPos.x - p.pos.x;
          const dz = this.playerPos.z - p.pos.z;
          const distSq = dx * dx + dz * dz;

          if (distSq <= rad * rad && topY <= this.playerPos.y + 0.15 && topY > bestGroundShadowY) {
            bestGroundShadowY = topY;
          }

          const outerR = rad + playerRadius;
          if (distSq > outerR * outerR) continue;

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
            const d = Math.sqrt(distSq) || 0.001;
            this.playerPos.x = p.pos.x + (dx / d) * outerR;
            this.playerPos.z = p.pos.z + (dz / d) * outerR;
          }
          continue;
        }

        const minX = p.pos.x - p.halfSize.x - playerRadius;
        const maxX = p.pos.x + p.halfSize.x + playerRadius;
        const minZ = p.pos.z - p.halfSize.z - playerRadius;
        const maxZ = p.pos.z + p.halfSize.z + playerRadius;

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
          let hitFace: 'pz' | 'nz' | 'px' | 'nx' = 'pz';
          if (m === dxMin) {
            this.playerPos.x = minX;
            this.playerVel.x = Math.min(0, this.playerVel.x);
            hitFace = 'nx';
          } else if (m === dxMax) {
            this.playerPos.x = maxX;
            this.playerVel.x = Math.max(0, this.playerVel.x);
            hitFace = 'px';
          } else if (m === dzMin) {
            this.playerPos.z = minZ;
            this.playerVel.z = Math.min(0, this.playerVel.z);
            hitFace = 'nz';
          } else {
            this.playerPos.z = maxZ;
            this.playerVel.z = Math.max(0, this.playerVel.z);
            hitFace = 'pz';
          }

          // Spider-Man universal 4-face building wall-climb latch
          const canSpiderClimb =
            this.hasSpiderSuit &&
            !this.isClimbing &&
            p.halfSize.y >= 1.8 &&
            !p.def.invisible &&
            p.def.kind !== 'glass' &&
            p.def.kind !== 'moving' &&
            p.def.kind !== 'elevator';
          const pushingIntoFace =
            (hitFace === 'pz' && worldDirZ < -0.15) ||
            (hitFace === 'nz' && worldDirZ > 0.15) ||
            (hitFace === 'px' && worldDirX < -0.15) ||
            (hitFace === 'nx' && worldDirX > 0.15) ||
            !this.grounded;
          if (canSpiderClimb && pushingIntoFace && this.playerPos.y >= botY - 0.3 && this.playerPos.y <= topY - 0.35) {
            this.isClimbing = true;
            this.climbingWall = null;
            this.climbFace = hitFace;
            this.climbBoxCenter.copy(p.pos);
            this.climbBoxHalf.copy(p.halfSize);
            this.grounded = false;
            this.playerVel.set(0, 0, 0);
            soundEngine.playClimbStep();
            this.pushHud(true);
            break;
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

        // Check latch onto climbable face if wearing Monkey Suit or Spider Suit
        if ((this.hasMonkeySuit || this.hasSpiderSuit) && !this.isClimbing && this.playerPos.y >= botY - 0.25 && this.playerPos.y <= topY - 0.35) {
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
              this.climbFace = face;
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
        const prevGrounded = this.grounded;
        this.grounded = landedPlatform !== null || landedOnClimbWall || bestGroundShadowY >= this.playerPos.y - 0.05;
        this.standingPlatform = landedPlatform;
        if (this.grounded && this.botRocketTimer > 0) {
          this.botRocketTimer = 0;
          this.hoverFuel = 1;
          this.pushHud(true);
        }
        onIce = this.grounded && this.standingPlatform?.def.kind === 'ice';

        if (!prevGrounded && this.grounded && this.currentLevel.index === 2 && landedPlatform) {
          if (landedPlatform.mesh.userData.iceCrackSeams) {
            landedPlatform.mesh.userData.fractureFlash = 1.0;
            this.spawnBurst(this.playerPos.x, this.playerPos.y + 0.1, this.playerPos.z, 0xa5f3fc, 12, 3.8);
          } else if (landedPlatform.def.kind === 'ice') {
            this.spawnBurst(this.playerPos.x, this.playerPos.y + 0.1, this.playerPos.z, 0xe0f7ff, 7, 2.4);
          }
        }

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
    this.collectNearbyRelics(this.playerPos.x, this.playerPos.y + 0.75, this.playerPos.z, 1.75);

    for (const sw of this.switches) {
      if (sw.activated) continue;
      const dx = this.playerPos.x - sw.pos.x;
      const dz = this.playerPos.z - sw.pos.z;
      const dy = this.playerPos.y - sw.pos.y;
      if (dx * dx + dz * dz < 1.35 && dy > -0.4 && dy < 1.1) {
        sw.activated = true;
        sw.buttonMesh.position.y = 0.12;
        sw.buttonMat.color.setHex(0x22c55e);
        sw.buttonMat.emissive.setHex(0x16a34a);
        sw.ringMat.color.setHex(0x4ade80);
        sw.ringMat.emissive.setHex(0x22c55e);
        this.coinsCollected += sw.coins;
        soundEngine.playSwitch();
        this.spawnBurst(sw.pos.x, sw.pos.y + 0.4, sw.pos.z, 0x4ade80, 20, 5.5);
        for (const p of this.platforms) {
          if (p.def.linkedSwitchId === sw.id) {
            p.activated = true;
            p.visible = true;
            this.setPlatformOpacity(p.mesh, p.def.kind === 'glass' ? 0.72 : 1.0);
            p.mesh.castShadow = !this.isSoftwareGl;
            this.spawnBurst(p.pos.x, p.pos.y + 0.5, p.pos.z, 0x38bdf8, 16, 4.8);
          }
        }
        this.showBanner(sw.message ?? '¡Interruptor activado!', 3.0);
        this.pushHud(true);
      }
    }

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
      const isWebbed = Boolean(en.webbedTimer && en.webbedTimer > 0);
      if (isWebbed) {
        en.webbedTimer = Math.max(0, (en.webbedTimer ?? 0) - dt);
        en.group.rotation.z = Math.sin(this.totalTime * 15 + en.phase) * 0.06;
        if (en.webCocoon) {
          en.webCocoon.visible = en.webbedTimer > 0;
          en.webCocoon.rotation.y += dt * 1.4;
        }
        if ((en.webbedTimer ?? 0) <= 0) {
          en.group.rotation.z = 0;
          if (en.webCocoon) en.webCocoon.visible = false;
        }
      } else {
        const t = this.totalTime * en.speed + en.phase;
        const s = Math.sin(t);

        if (en.kind === 'chaser') {
          const pDx = this.playerPos.x - en.pos.x;
          const pDz = this.playerPos.z - en.pos.z;
          const bDist = Math.hypot(this.playerPos.x - en.basePos.x, this.playerPos.z - en.basePos.z);
          if (bDist < 12.5 && Math.abs(this.playerPos.y - en.basePos.y) < 3.2) {
            const pDist = Math.hypot(pDx, pDz) || 1;
            const chaseSpd = 4.6 * dt;
            en.pos.x += (pDx / pDist) * chaseSpd;
            en.pos.z += (pDz / pDist) * chaseSpd;
            const offX = en.pos.x - en.basePos.x;
            const offZ = en.pos.z - en.basePos.z;
            const offLen = Math.hypot(offX, offZ);
            if (offLen > 6.5) {
              en.pos.x = en.basePos.x + (offX / offLen) * 6.5;
              en.pos.z = en.basePos.z + (offZ / offLen) * 6.5;
            }
            en.group.rotation.y = Math.atan2(pDx, pDz);
          } else {
            en.pos.x = THREE.MathUtils.damp(en.pos.x, en.basePos.x + en.patrolOffset.x * s, 4, dt);
            en.pos.z = THREE.MathUtils.damp(en.pos.z, en.basePos.z + en.patrolOffset.z * s, 4, dt);
            en.pos.y = en.basePos.y;
            en.group.rotation.y = Math.atan2(en.patrolOffset.x * Math.cos(t), en.patrolOffset.z * Math.cos(t));
          }
        } else {
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
          } else if (en.kind === 'flyer') {
            en.pos.y += Math.sin(this.totalTime * 4.4 + en.phase) * 0.38;
            if (en.wingL && en.wingR) {
              const flap = Math.sin(this.totalTime * 14.5 + en.phase) * 0.55;
              en.wingL.rotation.z = flap;
              en.wingR.rotation.z = -flap;
            }
          } else if (en.kind === 'shooter') {
            const sDx = this.playerPos.x - en.pos.x;
            const sDz = this.playerPos.z - en.pos.z;
            const sDistSq = sDx * sDx + sDz * sDz;
            if (sDistSq < 18 * 18 && Math.abs(this.playerPos.y - en.pos.y) < 5.2) {
              const targetYaw = Math.atan2(sDx, sDz);
              en.group.rotation.y = targetYaw;
              if (en.turretHead) en.turretHead.rotation.y = Math.sin(this.totalTime * 2) * 0.08;
              en.shootTimer -= dt;
              if (en.shootTimer <= 0) {
                en.shootTimer = 2.25;
                const pMesh = createEnemyProjectileMesh();
                const spawnP = new THREE.Vector3(
                  en.pos.x + Math.sin(targetYaw) * 0.75,
                  en.pos.y + 1.05,
                  en.pos.z + Math.cos(targetYaw) * 0.75
                );
                pMesh.position.copy(spawnP);
                this.levelGroup.add(pMesh);
                const dir = new THREE.Vector3(
                  this.playerPos.x - spawnP.x,
                  this.playerPos.y + 0.75 - spawnP.y,
                  this.playerPos.z - spawnP.z
                ).normalize();
                this.enemyProjectiles.push({
                  mesh: pMesh,
                  pos: spawnP,
                  vel: dir.multiplyScalar(11.2),
                  life: 3.2,
                });
                soundEngine.playEnemyShoot();
                this.spawnBurst(spawnP.x, spawnP.y, spawnP.z, 0xf43f5e, 6, 2.5);
              }
            }
          }

          if (en.kind !== 'shooter') {
            if (Math.abs(en.patrolOffset.z) > Math.abs(en.patrolOffset.x)) {
              en.group.rotation.y = Math.cos(t) >= 0 ? 0 : Math.PI;
            } else {
              en.group.rotation.y = Math.cos(t) >= 0 ? Math.PI / 2 : -Math.PI / 2;
            }
          }
        }
      }

      en.group.position.copy(en.pos);

      const dx = this.playerPos.x - en.pos.x;
      const dz = this.playerPos.z - en.pos.z;
      const horizDistSq = dx * dx + dz * dz;
      const dy = this.playerPos.y - en.pos.y;
      const isLarge = en.kind === 'brute' || en.kind === 'guardian';
      const hitRadiusSq = isLarge ? 1.35 : 0.85;

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
      if (this.spinTimer > 0 && (en.kind !== 'spiky' || isWebbed) && horizDistSq < (isLarge ? 2.6 : 2.1) && Math.abs(dy) < 1.3) {
        if (en.kind === 'guardian' && !isWebbed) {
          const dLen = Math.hypot(dx, dz) || 1;
          const fwdX = Math.sin(en.group.rotation.y);
          const fwdZ = Math.cos(en.group.rotation.y);
          if ((dx * fwdX + dz * fwdZ) / dLen > 0.35) {
            this.spawnBurst(en.pos.x + fwdX * 0.7, en.pos.y + 0.75, en.pos.z + fwdZ * 0.7, 0x38bdf8, 10, 4.2);
            this.playerVel.set((dx / dLen) * 6.5, 4.0, (dz / dLen) * 6.5);
            soundEngine.playEnemyHit();
            continue;
          }
        }
        this.damageEnemy(en);
        continue;
      }
      if (this.playerVel.y < -0.5 && horizDistSq < (isLarge ? 1.35 : 0.9) && dy > 0.35 && dy < (isLarge ? 1.55 : 1.15)) {
        if (en.kind === 'spiky' && !isWebbed) {
          this.damagePlayer(dx, dz);
        } else {
          this.damageEnemy(en);
          this.playerVel.y = 10.8;
        }
        continue;
      }
      if (isWebbed) continue;
      if (horizDistSq < (isLarge ? 1.05 : 0.72) && Math.abs(dy) < (isLarge ? 1.3 : 0.95)) {
        this.damagePlayer(dx, dz);
      }
    }

    // FINAL BOSS AI & Combat
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

    const fallThreshold =
      this.currentLevel.theme.biome === 'rapids'
        ? Math.max(this.currentLevel.theme.hazardFloorY + 0.4, getRiverWaterY(this.playerPos.z) - 0.55)
        : this.currentLevel.theme.hazardFloorY + 0.4;
    if (this.playerPos.y < fallThreshold) {
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
          relics: this.relicsCollected,
          totalRelics: this.relics.length,
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
                p.activated = true;
                p.visible = true;
                this.setPlatformOpacity(p.mesh, p.def.kind === 'glass' ? 0.72 : 0.9);
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

      // Hit Enemies (even Spiky! Guardians block frontal arrows)
      if (!remove) {
        for (const en of this.enemies) {
          if (!en.alive) continue;
          const dx = ar.pos.x - en.pos.x;
          const dy = ar.pos.y - (en.pos.y + 0.65);
          const dz = ar.pos.z - en.pos.z;
          const isLarge = en.kind === 'brute' || en.kind === 'guardian';
          if (dx * dx + dy * dy + dz * dz < (isLarge ? 1.55 : 1.05)) {
            if (en.kind === 'guardian') {
              const dLen = Math.hypot(dx, dz) || 1;
              const fwdX = Math.sin(en.group.rotation.y);
              const fwdZ = Math.cos(en.group.rotation.y);
              if ((dx * fwdX + dz * fwdZ) / dLen > 0.35) {
                this.spawnBurst(ar.pos.x, ar.pos.y, ar.pos.z, 0x38bdf8, 10, 4.0);
                soundEngine.playEnemyHit();
                remove = true;
                break;
              }
            }
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
    this.collectNearbyRelics(this.rocketPos.x, this.rocketPos.y + 0.6, this.rocketPos.z, 8.0);

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
    this.collectNearbyRelics(this.gliderPos.x, this.gliderPos.y + 0.6, this.gliderPos.z, 14.0);

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

    // Paris aerial updraft currents along alternate sky lanes + readable side-lane balloon obstacle bumps
    for (const up of this.parisUpdraftZones) {
      if (up.triggeredCooldown > 0) up.triggeredCooldown = Math.max(0, up.triggeredCooldown - dt);
      const dx = this.gliderPos.x - up.pos.x;
      const dz = this.gliderPos.z - up.pos.z;
      const dy = this.gliderPos.y - up.pos.y;
      if (dx * dx + dz * dz < up.radius * up.radius && Math.abs(dy) < 6.5) {
        this.gliderAltOffset = Math.min(6.0, this.gliderAltOffset + 7.5 * dt);
        this.gliderVelY = Math.max(this.gliderVelY, 4.4);
        if (up.triggeredCooldown <= 0) {
          up.triggeredCooldown = 1.1;
          this.gliderBoostTimer = Math.max(this.gliderBoostTimer, 0.45);
          soundEngine.playWindWhoosh();
          this.spawnBurst(this.gliderPos.x, this.gliderPos.y, this.gliderPos.z, 0xfde68a, 14, 5.2);
        }
      }
    }
    for (const b of this.parisBalloons) {
      if (!b.isObstacle) continue;
      const bx = b.group.position.x;
      const by = b.group.position.y + 2.2;
      const bz = b.group.position.z;
      const dx = this.gliderPos.x - bx;
      const dy = this.gliderPos.y - by;
      const dz = this.gliderPos.z - bz;
      if (dx * dx + dy * dy + dz * dz < b.radius * b.radius) {
        const pushDir = dx >= 0 ? 1 : -1;
        this.gliderVelX = pushDir * 8.5;
        this.gliderPos.x = THREE.MathUtils.clamp(this.gliderPos.x + pushDir * 1.1, -16.5, 16.5);
        soundEngine.playBounce();
        this.spawnBurst(this.gliderPos.x, this.gliderPos.y, this.gliderPos.z, 0xfbbf24, 12, 4.5);
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

    const speedFactor = getRiverZoneSpeedFactor(this.boatPos.z);
    const dropSlope = getRiverDropSlope(this.boatPos.z);
    const waterY = getRiverWaterY(this.boatPos.z);

    const baseFwd = inCalmLake ? 7.8 : this.boatCruiseSpeed * speedFactor + throttle * 3.6;
    this.boatVelZ = THREE.MathUtils.damp(this.boatVelZ, baseFwd, 5.5, dt);
    this.boatVelX = THREE.MathUtils.damp(this.boatVelX, steerX * 10.4, 8.5, dt);

    // Wave hop physics
    if (this.boatJumpY > 0 || this.boatVelY > 0) {
      this.boatVelY -= 26.0 * dt;
      this.boatJumpY += this.boatVelY * dt;
      if (this.boatJumpY <= 0) {
        this.boatJumpY = 0;
        this.boatVelY = 0;
        soundEngine.playSplash();
        this.spawnBurst(this.boatPos.x, waterY + 0.15, this.boatPos.z, 0xe0f2fe, 12, 3.8);
      }
    }

    const riverCx = getRiverCenterX(this.boatPos.z);
    const riverAngle = getRiverSlopeAngle(this.boatPos.z);
    const xAhead = getRiverCenterX(this.boatPos.z - 1.5);
    const xBehind = getRiverCenterX(this.boatPos.z + 1.5);
    const currentDriftVx = ((xAhead - xBehind) / 3.0) * this.boatVelZ * 0.48;
    const [minOff, maxOff] = getRiverChannelBounds(this.boatPos.z, this.boatHalfWidth);

    // Gentle tangential whirlpool current tug when sailing close to vortex rim
    let vortexPullVx = 0;
    if (this.boatJumpY < 0.75) {
      for (const wp of this.rapidsWhirlpools) {
        const dx = wp.pos.x - this.boatPos.x;
        const dz = wp.pos.z - this.boatPos.z;
        const dSq = dx * dx + dz * dz;
        const pullRad = wp.radius * 1.15;
        if (dSq < pullRad * pullRad && dSq > 0.05) {
          const dist = Math.sqrt(dSq);
          const falloff = 1 - dist / pullRad;
          vortexPullVx += (dx / dist) * falloff * 5.2 + wp.spinDir * (dz / dist) * falloff * 3.4;
          if (Math.random() < 0.35) {
            this.spawnBurst(this.boatPos.x, waterY + 0.12, this.boatPos.z, 0xbae6fd, 1, 2.6);
          }
        }
      }
    }

    this.boatPos.x = THREE.MathUtils.clamp(
      this.boatPos.x + (this.boatVelX + currentDriftVx + vortexPullVx) * dt,
      riverCx + minOff,
      riverCx + maxOff
    );
    this.boatPos.z -= this.boatVelZ * dt;
    const updatedWaterY = getRiverWaterY(this.boatPos.z);
    const waveBob = inCalmLake ? Math.sin(this.totalTime * 2.2) * 0.03 : Math.sin(this.totalTime * 11) * (0.1 + Math.max(0, speedFactor - 1) * 0.14);
    this.boatPos.y = updatedWaterY + 0.05 + this.boatJumpY + waveBob;

    this.boatRig.root.position.copy(this.boatPos);
    this.boatRig.hullGroup.rotation.z = THREE.MathUtils.damp(this.boatRig.hullGroup.rotation.z, -this.boatVelX * 0.032, 9, dt);
    this.boatRig.hullGroup.rotation.y = THREE.MathUtils.damp(
      this.boatRig.hullGroup.rotation.y,
      -riverAngle * 0.85 - this.boatVelX * 0.025,
      9,
      dt
    );
    const slopePitch = inCalmLake ? 0 : Math.atan(dropSlope) * 0.92;
    const targetPitch = this.boatJumpY > 0.05 ? this.boatVelY * 0.025 : slopePitch + (inCalmLake ? 0 : Math.sin(this.totalTime * 9) * 0.04);
    this.boatRig.hullGroup.rotation.x = THREE.MathUtils.damp(this.boatRig.hullGroup.rotation.x, targetPitch, 10, dt);
    this.boatRig.propeller.rotation.z += dt * (inCalmLake ? 8 : 22 * speedFactor);
    const onWater = this.boatJumpY <= 0.12;
    this.boatRig.wakeL.visible = onWater;
    this.boatRig.wakeR.visible = onWater;
    this.boatRig.bowSpray.visible = onWater && !inCalmLake;
    if (onWater) {
      const wakeScale = 0.9 + (speedFactor - 1) * 0.8;
      this.boatRig.bowSpray.scale.setScalar(0.92 + Math.sin(this.totalTime * 18) * 0.08 + (speedFactor - 1) * 0.45);
      this.boatRig.wakeL.scale.set(wakeScale, 1, wakeScale);
      this.boatRig.wakeR.scale.set(wakeScale, 1, wakeScale);
    }

    // Expanding concentric ripple rings trailing behind boat
    this.rapidsRippleCooldown -= dt;
    if (onWater && this.rapidsRippleCooldown <= 0) {
      this.rapidsRippleCooldown = inCalmLake ? 0.24 : 0.11;
      const slot = this.rapidsRipples.find((r) => r.life <= 0);
      if (slot) {
        slot.life = slot.maxLife;
        slot.mesh.position.set(this.boatPos.x, updatedWaterY + 0.05, this.boatPos.z + 1.25);
        slot.mesh.scale.setScalar(1.0);
        slot.mesh.visible = true;
      }
    }

    if (!inCalmLake && onWater && (Math.random() < 0.45 || dropSlope < -0.14)) {
      this.spawnBurst(this.boatPos.x, updatedWaterY + 0.15, this.boatPos.z + 1.6, 0xe0f2fe, dropSlope < -0.14 ? 2 : 1, 2.4);
    }

    // Rider sits cleanly at the boat helm
    this.playerPos.set(this.boatPos.x, this.boatPos.y + 0.45, this.boatPos.z + 0.1);
    this.playerRig.root.position.copy(this.playerPos);
    this.playerRig.bodyGroup.rotation.y = Math.PI - riverAngle * 0.85;
    this.playerRig.bodyGroup.scale.setScalar(0.92);
    this.playerRig.hoverBeam.visible = false;
    this.contactShadowMesh.visible = false;

    this.collectNearbyCoins(this.boatPos.x, this.boatPos.y + 0.8, this.boatPos.z, 7.2);
    this.collectNearbyRelics(this.boatPos.x, this.boatPos.y + 0.9, this.boatPos.z, 9.0);

    // Hazard checks: river rocks, moving boulders, drifting logs & crocodiles (jump over hazards!)
    if (this.boatJumpY < 0.85) {
      for (const rk of this.riverRocks) {
        const dx = this.boatPos.x - rk.pos.x;
        const dz = this.boatPos.z - rk.pos.z;
        const hitDist = rk.radius + 0.72;
        if (dx * dx + dz * dz < hitDist * hitDist) {
          soundEngine.playSplash();
          this.spawnBurst(this.boatPos.x, updatedWaterY + 0.35, this.boatPos.z, 0xf0f9ff, 20, 6.2);
          this.boatVelX = dx >= 0 ? 5.5 : -5.5;
          this.boatPos.z += 1.2;
          this.damagePlayer(dx, 1);
          break;
        }
      }

      for (const mr of this.rapidsMovingRocks) {
        const dx = this.boatPos.x - mr.pos.x;
        const dz = this.boatPos.z - mr.pos.z;
        const hitDist = mr.radius + 0.72;
        if (dx * dx + dz * dz < hitDist * hitDist) {
          soundEngine.playSplash();
          this.spawnBurst(this.boatPos.x, updatedWaterY + 0.35, this.boatPos.z, 0xf0f9ff, 20, 6.2);
          this.boatVelX = dx >= 0 ? 5.5 : -5.5;
          this.boatPos.z += 1.2;
          this.damagePlayer(dx, 1);
          break;
        }
      }

      for (const dl of this.rapidsDriftingLogs) {
        const dx = this.boatPos.x - dl.pos.x;
        const dz = this.boatPos.z - dl.pos.z;
        if (Math.abs(dx) < dl.halfLen + 0.72 && Math.abs(dz) < dl.halfWidth + 0.92) {
          soundEngine.playSplash();
          this.spawnBurst(this.boatPos.x, updatedWaterY + 0.35, this.boatPos.z, 0xbae6fd, 18, 5.8);
          this.boatVelX = dx >= 0 ? 5.8 : -5.8;
          this.boatPos.z += 1.3;
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
            this.spawnBurst(this.boatPos.x, updatedWaterY + 0.35, this.boatPos.z, 0x84cc16, 18, 6.0);
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
      this.boatRig.bowSpray.visible = false;
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

  private collectNearbyRelics(px: number, py: number, pz: number, radiusSq: number) {
    for (const rel of this.relics) {
      if (rel.collected) continue;
      const dx = px - rel.pos.x;
      const dy = py - rel.pos.y;
      const dz = pz - rel.pos.z;
      if (dx * dx + dy * dy + dz * dz < radiusSq) {
        rel.collected = true;
        rel.group.visible = false;
        this.relicsCollected++;
        this.coinsCollected += 5;
        soundEngine.playRelic();
        this.spawnBurst(rel.pos.x, rel.pos.y + 0.2, rel.pos.z, 0x38bdf8, 22, 6.2);
        this.spawnBurst(rel.pos.x, rel.pos.y + 0.2, rel.pos.z, 0xfacc15, 14, 5.2);
        this.showBanner(`¡Reliquia Estelar: ${rel.name}! (+5 Monedas)`, 3.2);
        this.pushHud(true);
      }
    }
  }

  private stepEnemyProjectiles(dt: number) {
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      ep.life -= dt;
      ep.pos.addScaledVector(ep.vel, dt);
      ep.mesh.position.copy(ep.pos);
      ep.mesh.rotation.y += dt * 8;

      let remove = ep.life <= 0;
      if (!remove) {
        const dx = this.playerPos.x - ep.pos.x;
        const dy = this.playerPos.y + 0.7 - ep.pos.y;
        const dz = this.playerPos.z - ep.pos.z;
        if (dx * dx + dy * dy + dz * dz < 0.85) {
          this.damagePlayer(ep.vel.x, ep.vel.z);
          remove = true;
        }
      }

      if (remove) {
        this.levelGroup.remove(ep.mesh);
        ep.mesh.geometry.dispose();
        (ep.mesh.material as THREE.Material).dispose();
        this.enemyProjectiles.splice(i, 1);
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

    if (b.phase === 1 && b.hp <= Math.ceil(b.maxHp * 0.66)) {
      b.phase = 2;
      this.shakeIntensity = 0.5;
      this.spawnBurst(b.pos.x, b.pos.y + 2.2, b.pos.z, 0xf43f5e, 30, 7.5);
      this.showBanner(`¡${b.name} entra en Fase 2! ¡Esquiva sus ráfagas!`, 3.0);
      this.pushHud(true);
    } else if (b.phase === 2 && b.maxHp >= 6 && b.hp <= 1) {
      b.phase = 3;
      this.shakeIntensity = 0.65;
      this.spawnBurst(b.pos.x, b.pos.y + 2.4, b.pos.z, 0xfacc15, 38, 8.5);
      this.showBanner(`¡${b.name} desata su Furia Solar (Fase 3)!`, 3.2);
      this.pushHud(true);
    }

    b.invulnTimer = Math.max(0, b.invulnTimer - dt);
    b.rig.dorsalRing.rotation.z += dt * (b.state === 'charge' ? 6.2 : b.phase === 3 ? 5.2 : b.phase === 2 ? 3.8 : 2.2);
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
      const spd = (b.phase === 3 ? 5.5 : b.phase === 2 ? 4.8 : 3.8) + (b.maxHp - b.hp) * 0.36;
      b.pos.x += (toPlayerX / dist) * spd * dt;
      b.pos.z += (toPlayerZ / dist) * spd * dt;
      const swing = Math.sin(this.totalTime * 7);
      b.rig.leftLeg.rotation.x = swing * 0.45;
      b.rig.rightLeg.rotation.x = -swing * 0.45;
      b.rig.leftArm.rotation.x = -swing * 0.5;
      b.rig.rightArm.rotation.x = swing * 0.5;
      b.rig.bodyGroup.position.y = Math.abs(swing) * 0.12;
      b.rig.coreMat.color.setHex(b.phase === 3 ? 0xfacc15 : b.phase === 2 ? 0xf43f5e : 0xfbbf24);

      if (b.stateTimer <= 0) {
        b.state = 'windup';
        b.stateTimer = b.phase === 3 ? 0.55 : b.phase === 2 ? 0.68 : 0.85;
      }
    } else if (b.state === 'windup') {
      b.rig.root.rotation.y = desiredYaw;
      b.rig.bodyGroup.position.y = -0.25 + Math.sin(this.totalTime * 30) * 0.06;
      b.rig.leftArm.rotation.x = -2.2;
      b.rig.rightArm.rotation.x = -2.2;
      b.rig.coreMat.color.setHex(0xff2a55);
      if (b.stateTimer <= 0) {
        b.state = 'shockwave';
        b.stateTimer = b.phase === 3 ? 1.25 : 1.4;
        b.shockwaveRadius = 1.4;
        this.shakeIntensity = 0.45;
        soundEngine.playShockwave();
        this.spawnBurst(b.pos.x, b.pos.y + 0.4, b.pos.z, 0xff2a55, 22, 6.5);
        if (b.phase >= 2) {
          soundEngine.playEnemyShoot();
          const orbCount = b.phase === 3 ? 8 : 4;
          const orbSpeed = b.phase === 3 ? 10.6 : 9.2;
          for (let k = 0; k < orbCount; k++) {
            const ang = desiredYaw + k * ((Math.PI * 2) / orbCount);
            const pMesh = createEnemyProjectileMesh(b.phase === 3 ? 0xfacc15 : 0xf43f5e);
            const spawnP = new THREE.Vector3(b.pos.x + Math.sin(ang) * 1.4, b.pos.y + 0.9, b.pos.z + Math.cos(ang) * 1.4);
            pMesh.position.copy(spawnP);
            this.levelGroup.add(pMesh);
            this.enemyProjectiles.push({
              mesh: pMesh,
              pos: spawnP,
              vel: new THREE.Vector3(Math.sin(ang) * orbSpeed, 0, Math.cos(ang) * orbSpeed),
              life: 3.0,
            });
          }
        }
      }
    } else if (b.state === 'shockwave') {
      b.rig.bodyGroup.position.y = 0;
      b.rig.leftArm.rotation.x = -0.4;
      b.rig.rightArm.rotation.x = -0.4;
      b.shockwaveRadius += (b.phase === 3 ? 12.6 : b.phase === 2 ? 11.4 : 9.8) * dt;
      b.rig.shockwaveRing.visible = true;
      b.rig.shockwaveRing.scale.setScalar(b.shockwaveRadius);
      b.rig.shockwaveMat.opacity = Math.max(0, 1 - b.shockwaveRadius / 14);

      // Jump-over shockwave damage check
      if (Math.abs(dist - b.shockwaveRadius) < 0.85 && this.playerPos.y < b.arenaCenter.y + 1.15) {
        this.damagePlayer(toPlayerX, toPlayerZ);
      }
      if (b.stateTimer <= 0) {
        b.state = 'charge';
        b.stateTimer = b.phase === 3 ? 1.18 : 1.05;
        b.chargeDir.set(toPlayerX / dist, 0, toPlayerZ / dist);
        b.rig.root.rotation.y = Math.atan2(b.chargeDir.x, b.chargeDir.z);
      }
    } else if (b.state === 'charge') {
      const chargeSpeed = b.phase === 3 ? 14.2 : b.phase === 2 ? 12.8 : 10.6;
      b.pos.x += b.chargeDir.x * chargeSpeed * dt;
      b.pos.z += b.chargeDir.z * chargeSpeed * dt;
      b.rig.leftArm.rotation.x = -1.4;
      b.rig.rightArm.rotation.x = -1.4;
      b.rig.bodyGroup.position.y = Math.abs(Math.sin(this.totalTime * 16)) * 0.16;
      if (b.stateTimer <= 0) {
        b.state = 'recover';
        b.stateTimer = b.phase === 3 ? 1.15 : b.phase === 2 ? 1.3 : 1.6;
      }
    } else if (b.state === 'recover') {
      b.rig.bodyGroup.position.y = -0.35;
      b.rig.leftArm.rotation.x = 0.2;
      b.rig.rightArm.rotation.x = 0.2;
      b.rig.coreMat.color.setHex(0x38bdf8);
      if (b.stateTimer <= 0) {
        b.state = 'chase';
        b.stateTimer = b.phase === 3 ? 1.45 : b.phase === 2 ? 1.85 : 2.2;
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

  private findBestWebAnchor(): THREE.Vector3 | null {
    if (!this.hasSpiderSuit || this.webAnchorPoints.length === 0) return null;
    const camFwdX = -Math.sin(this.camYaw);
    const camFwdZ = -Math.cos(this.camYaw);
    let bestAnchor: THREE.Vector3 | null = null;
    let bestScore = -Infinity;
    for (const a of this.webAnchorPoints) {
      if (a.y < this.playerPos.y + 0.8) continue;
      const dx = a.x - this.playerPos.x;
      const dy = a.y - this.playerPos.y;
      const dz = a.z - this.playerPos.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist < 4.0 || dist > 30.0) continue;
      const horizDist = Math.hypot(dx, dz) || 1;
      const dot = (dx * camFwdX + dz * camFwdZ) / horizDist;
      if (dot < -0.15) continue;
      const idealDistScore = 1.0 - Math.abs(dist - 15.0) / 18.0;
      const score = dot * 2.4 + idealDistScore * 1.4 + Math.min(1.0, dy / 14.0) * 0.8;
      if (score > bestScore) {
        bestScore = score;
        bestAnchor = a;
      }
    }
    return bestAnchor;
  }

  public triggerSpiderWebAction() {
    if (
      this.phase !== 'playing' ||
      !this.hasSpiderSuit ||
      this.spiderTransformTimer > 0 ||
      this.rocketState === 'flying' ||
      this.gliderState === 'flying' ||
      this.boatState === 'sailing'
    ) {
      return;
    }
    if (this.webActive) {
      this.releaseWeb(true);
      return;
    }
    if (this.webCooldown > 0) return;

    // Check if an un-webbed enemy is directly ahead for quick web-combat
    const fwdX = Math.sin(this.playerYaw);
    const fwdZ = Math.cos(this.playerYaw);
    let directEnemy = false;
    for (const en of this.enemies) {
      if (!en.alive) continue;
      const dx = en.pos.x - this.playerPos.x;
      const dy = en.pos.y - this.playerPos.y;
      const dz = en.pos.z - this.playerPos.z;
      const d = Math.hypot(dx, dz);
      if (d < 16 && Math.abs(dy) < 3.4) {
        const dot = (dx * fwdX + dz * fwdZ) / (d || 1);
        if (dot > 0.52 && (this.grounded || d < 9.5)) {
          directEnemy = true;
          break;
        }
      }
    }

    const anchor = !directEnemy ? (this.highlightedWebAnchor ?? this.findBestWebAnchor()) : null;
    if (anchor) {
      this.webActive = true;
      this.webAnchor.copy(anchor);
      const dist = this.playerPos.distanceTo(anchor);
      this.webLength = THREE.MathUtils.clamp(dist * 0.93, 4.2, 26.5);
      this.grounded = false;
      this.standingPlatform = null;
      this.isClimbing = false;
      this.climbingWall = null;
      this.climbFace = null;
      this.isHovering = false;
      this.hasDoubleJump = true;
      this.hoverFuel = 1;
      soundEngine.stopHover();

      // Launch upward/forward impulse so swinging from a rooftop feels snappy and dynamic
      const toAx = anchor.x - this.playerPos.x;
      const toAz = anchor.z - this.playerPos.z;
      const toLen = Math.hypot(toAx, toAz) || 1;
      this.playerVel.x = this.playerVel.x * 0.72 + (toAx / toLen) * 8.2;
      this.playerVel.z = this.playerVel.z * 0.72 + (toAz / toLen) * 8.2;
      this.playerVel.y = Math.max(this.playerVel.y, 4.8);
      this.webCooldown = 0.14;
      soundEngine.playWebShoot();
      this.spawnBurst(anchor.x, anchor.y, anchor.z, 0xf8fafc, 10, 4.2);
      this.pushHud(true);
      return;
    }

    this.shootWebBolt();
  }

  public releaseWeb(withJumpBoost: boolean) {
    if (!this.webActive) return;
    this.webActive = false;
    if (this.webLineMesh) this.webLineMesh.visible = false;
    this.hasDoubleJump = true;
    this.hoverFuel = 1;
    if (withJumpBoost) {
      this.playerVel.y = Math.max(this.playerVel.y + 6.4, 10.6);
      this.doubleJumpFlipTimer = 0.4;
      this.playerSquash.set(0.82, 1.24, 0.82);
      this.spawnBurst(this.playerPos.x, this.playerPos.y + 0.5, this.playerPos.z, 0xf8fafc, 12, 4.0);
    }
    soundEngine.playWebRelease();
    this.pushHud(true);
  }

  private shootWebBolt() {
    this.webCooldown = 0.24;
    soundEngine.playWebShoot();
    const origin = new THREE.Vector3(this.playerPos.x, this.playerPos.y + 0.95, this.playerPos.z);
    let dir = new THREE.Vector3(Math.sin(this.playerYaw), 0.04, Math.cos(this.playerYaw)).normalize();
    let bestScore = -Infinity;
    for (const en of this.enemies) {
      if (!en.alive) continue;
      _vec3A.set(en.pos.x - origin.x, en.pos.y + 0.75 - origin.y, en.pos.z - origin.z);
      const d = _vec3A.length();
      if (d > 22 || d < 0.3) continue;
      _vec3A.multiplyScalar(1 / d);
      const dot = _vec3A.dot(dir);
      if (dot > 0.52 && dot * 10 - d * 0.2 > bestScore) {
        bestScore = dot * 10 - d * 0.2;
        dir = _vec3A.clone();
      }
    }

    const bolt = new THREE.Group();
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, emissive: 0xe2e8f0, emissiveIntensity: 0.55 })
    );
    const tail = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 0.65, 6),
      new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.85 })
    );
    tail.rotation.x = -Math.PI / 2;
    tail.position.z = -0.35;
    bolt.add(orb, tail);
    bolt.position.copy(origin);
    bolt.lookAt(origin.clone().add(dir));
    this.levelGroup.add(bolt);
    this.webShots.push({ mesh: bolt, pos: origin, vel: dir.multiplyScalar(34), life: 0.85 });
  }

  private stepWebShots(dt: number) {
    for (let i = this.webShots.length - 1; i >= 0; i--) {
      const ws = this.webShots[i];
      ws.life -= dt;
      ws.pos.addScaledVector(ws.vel, dt);
      ws.mesh.position.copy(ws.pos);

      let remove = ws.life <= 0;
      if (!remove) {
        for (const en of this.enemies) {
          if (!en.alive) continue;
          const dx = ws.pos.x - en.pos.x;
          const dy = ws.pos.y - (en.pos.y + 0.75);
          const dz = ws.pos.z - en.pos.z;
          if (dx * dx + dy * dy + dz * dz < 1.35) {
            if (en.webbedTimer && en.webbedTimer > 0) {
              this.damageEnemy(en);
            } else {
              en.webbedTimer = 6.5;
              if (!en.webCocoon) {
                en.webCocoon = createWebCocoonMesh();
                en.group.add(en.webCocoon);
              }
              en.webCocoon.visible = true;
              soundEngine.playWebHit();
              this.spawnBurst(en.pos.x, en.pos.y + 0.8, en.pos.z, 0xf8fafc, 16, 4.8);
            }
            remove = true;
            break;
          }
        }
      }
      if (!remove) {
        for (const cr of this.crates) {
          if (cr.broken) continue;
          const dx = ws.pos.x - cr.pos.x;
          const dy = ws.pos.y - (cr.pos.y + 0.5);
          const dz = ws.pos.z - cr.pos.z;
          if (dx * dx + dy * dy + dz * dz < 1.2) {
            this.breakCrate(cr);
            remove = true;
            break;
          }
        }
      }
      if (remove) {
        this.levelGroup.remove(ws.mesh);
        ws.mesh.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (m.material) {
            if (Array.isArray(m.material)) m.material.forEach((mt) => mt.dispose());
            else m.material.dispose();
          }
        });
        this.webShots.splice(i, 1);
      }
    }
  }

  private stepWebSwinging(dt: number, worldDirX: number, worldDirZ: number) {
    soundEngine.stopHover();
    this.isHovering = false;
    this.grounded = false;
    this.standingPlatform = null;
    this.contactShadowMesh.visible = false;

    // Gravity + directional pump
    this.playerVel.y -= 28.0 * dt;
    this.playerVel.x += worldDirX * 26.5 * dt;
    this.playerVel.z += worldDirZ * 26.5 * dt;

    // Gentle reel-in when low over avenues or holding jump slightly
    if (this.playerPos.y < this.currentLevel.theme.hazardFloorY + 9.0) {
      this.webLength = Math.max(4.6, this.webLength - dt * 2.8);
    }

    const prevY = this.playerPos.y;
    this.playerPos.addScaledVector(this.playerVel, dt);

    // Enforce taut radial pendulum constraint |playerPos - webAnchor| <= webLength
    _vec3A.subVectors(this.playerPos, this.webAnchor);
    const dist = _vec3A.length();
    if (dist > this.webLength && dist > 0.001) {
      _vec3A.multiplyScalar(1 / dist);
      this.playerPos.copy(this.webAnchor).addScaledVector(_vec3A, this.webLength);
      const vRad = this.playerVel.dot(_vec3A);
      if (vRad > 0) {
        this.playerVel.addScaledVector(_vec3A, -vRad);
      }
      this.playerVel.multiplyScalar(0.996);
    }

    // Face swing velocity horizontally
    const hSpd = Math.hypot(this.playerVel.x, this.playerVel.z);
    if (hSpd > 0.6) {
      const targetYaw = Math.atan2(this.playerVel.x, this.playerVel.z);
      let diff = targetYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerYaw += diff * Math.min(1, dt * 10);
    }

    // Solid building collision during swing (prevents clipping inside skyscrapers)
    const playerRadius = 0.38;
    const playerHeight = 1.45;
    for (const p of this.platforms) {
      if (!p.visible) continue;
      const topY = p.pos.y + p.halfSize.y;
      const botY = p.pos.y - p.halfSize.y;
      const minX = p.pos.x - p.halfSize.x - playerRadius;
      const maxX = p.pos.x + p.halfSize.x + playerRadius;
      const minZ = p.pos.z - p.halfSize.z - playerRadius;
      const maxZ = p.pos.z + p.halfSize.z + playerRadius;
      if (this.playerPos.x < minX || this.playerPos.x > maxX || this.playerPos.z < minZ || this.playerPos.z > maxZ) {
        continue;
      }
      if (this.playerVel.y <= 0 && prevY >= topY - 0.35 && this.playerPos.y <= topY + 0.08) {
        this.playerPos.y = topY;
        this.playerVel.y = 0;
        this.grounded = true;
        this.standingPlatform = p;
        this.releaseWeb(false);
        return;
      } else if (this.playerPos.y < topY - 0.15 && this.playerPos.y + playerHeight > botY + 0.15) {
        const dxMin = Math.abs(this.playerPos.x - minX);
        const dxMax = Math.abs(maxX - this.playerPos.x);
        const dzMin = Math.abs(this.playerPos.z - minZ);
        const dzMax = Math.abs(maxZ - this.playerPos.z);
        const m = Math.min(dxMin, dxMax, dzMin, dzMax);
        let hitFace: 'pz' | 'nz' | 'px' | 'nx' = 'pz';
        if (m === dxMin) {
          this.playerPos.x = minX;
          this.playerVel.x = Math.min(0, this.playerVel.x);
          hitFace = 'nx';
        } else if (m === dxMax) {
          this.playerPos.x = maxX;
          this.playerVel.x = Math.max(0, this.playerVel.x);
          hitFace = 'px';
        } else if (m === dzMin) {
          this.playerPos.z = minZ;
          this.playerVel.z = Math.min(0, this.playerVel.z);
          hitFace = 'nz';
        } else {
          this.playerPos.z = maxZ;
          this.playerVel.z = Math.max(0, this.playerVel.z);
          hitFace = 'pz';
        }
        if (p.halfSize.y >= 1.8 && p.def.kind !== 'glass' && !p.def.invisible) {
          this.releaseWeb(false);
          this.isClimbing = true;
          this.climbFace = hitFace;
          this.climbBoxCenter.copy(p.pos);
          this.climbBoxHalf.copy(p.halfSize);
          this.playerVel.set(0, 0, 0);
          soundEngine.playClimbStep();
          return;
        }
      }
    }

    // Update 3D white web line cylinder from Spider-Man's wrist to webAnchor
    if (this.webLineMesh) {
      _vec3B.set(
        this.playerPos.x + Math.sin(this.playerYaw + 0.35) * 0.35,
        this.playerPos.y + 1.15,
        this.playerPos.z + Math.cos(this.playerYaw + 0.35) * 0.35
      );
      _vec3C.subVectors(this.webAnchor, _vec3B);
      const len = Math.max(0.1, _vec3C.length());
      this.webLineMesh.visible = true;
      this.webLineMesh.position.lerpVectors(_vec3B, this.webAnchor, 0.5);
      this.webLineMesh.scale.set(1, len, 1);
      _vec3C.multiplyScalar(1 / len);
      this.webLineMesh.quaternion.setFromUnitVectors(_vec3A.set(0, 1, 0), _vec3C);
    }

    // Jump releases swing with aerial boost
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer = 0;
      this.releaseWeb(true);
    }
  }

  private stepTimedChallenges(dt: number) {
    for (const tc of this.timedChallengesRuntime) {
      tc.startPad.rotation.y += dt * 1.4;
      for (let g = 0; g < tc.gates.length; g++) {
        const gate = tc.gates[g];
        const ring = gate.userData.ring as THREE.Mesh | undefined;
        const rMat = gate.userData.ringMat as THREE.MeshStandardMaterial | undefined;
        if (ring) ring.rotation.z += dt * (tc.active && g === tc.currentIdx ? 4.5 : 1.4);
        if (rMat) {
          if (tc.completed) {
            rMat.color.setHex(0x22c55e);
            rMat.emissive.setHex(0x16a34a);
          } else if (tc.active && g === tc.currentIdx) {
            rMat.color.setHex(0xfacc15);
            rMat.emissive.setHex(0xf59e0b);
          } else if (tc.active && g < tc.currentIdx) {
            rMat.color.setHex(0x4ade80);
            rMat.emissive.setHex(0x22c55e);
          } else {
            rMat.color.setHex(0x38bdf8);
            rMat.emissive.setHex(0x0284c7);
          }
        }
      }

      if (!tc.completed && !tc.active) {
        const dx = this.playerPos.x - tc.startPos.x;
        const dy = this.playerPos.y - tc.startPos.y;
        const dz = this.playerPos.z - tc.startPos.z;
        if (dx * dx + dz * dz < 3.6 && Math.abs(dy) < 2.2) {
          for (const other of this.timedChallengesRuntime) {
            other.active = false;
            other.currentIdx = 0;
            other.timer = 0;
          }
          tc.active = true;
          tc.currentIdx = 0;
          tc.timer = tc.timeLimit;
          tc.lastTickSec = Math.ceil(tc.timeLimit);
          soundEngine.playSwitch();
          this.spawnBurst(tc.startPos.x, tc.startPos.y + 0.6, tc.startPos.z, 0xfacc15, 16, 4.8);
          this.showBanner(`¡${tc.label}! Cruza los ${tc.checkpoints.length} anillos antes de ${tc.timeLimit}s`, 3.0);
          this.pushHud(true);
        }
      } else if (tc.active) {
        tc.timer -= dt;
        const ceilSec = Math.ceil(tc.timer);
        if (ceilSec <= 5 && ceilSec > 0 && ceilSec !== tc.lastTickSec) {
          tc.lastTickSec = ceilSec;
          soundEngine.playChallengeTick();
        }
        const targetPos = tc.checkpoints[tc.currentIdx];
        if (targetPos) {
          const dx = this.playerPos.x - targetPos.x;
          const dy = this.playerPos.y + 0.7 - targetPos.y;
          const dz = this.playerPos.z - targetPos.z;
          if (dx * dx + dy * dy + dz * dz < 11.5) {
            this.spawnBurst(targetPos.x, targetPos.y, targetPos.z, 0xfacc15, 18, 5.5);
            soundEngine.playCoin();
            tc.currentIdx++;
            if (tc.currentIdx >= tc.checkpoints.length) {
              tc.active = false;
              tc.completed = true;
              this.coinsCollected += tc.rewardCoins;
              soundEngine.playChallengeComplete();
              this.spawnBurst(this.playerPos.x, this.playerPos.y + 1.0, this.playerPos.z, 0x22c55e, 28, 7.2);
              this.showBanner(`¡${tc.label} completado! (+${tc.rewardCoins} Monedas)`, 3.8);
            }
            this.pushHud(true);
          }
        }
        if (tc.active && tc.timer <= 0) {
          tc.active = false;
          tc.currentIdx = 0;
          tc.timer = 0;
          soundEngine.playHurt();
          this.showBanner('¡Tiempo agotado! Vuelve a la plataforma dorada para reintentar', 3.0);
          this.pushHud(true);
        }
      }
    }
  }

  private handleFallDamage() {
    this.webActive = false;
    if (this.webLineMesh) this.webLineMesh.visible = false;
    this.isClimbing = false;
    this.climbingWall = null;
    this.climbFace = null;
    const biome = this.currentLevel.theme.biome;
    if (biome === 'temple' || biome === 'jungle' || biome === 'rapids') {
      soundEngine.playSplash();
      const splashY = biome === 'rapids' ? getRiverWaterY(this.playerPos.z) + 0.15 : this.currentLevel.theme.hazardFloorY + 0.25;
      this.spawnBurst(
        this.playerPos.x,
        splashY,
        this.playerPos.z,
        0xe0f2fe,
        22,
        5.8
      );
    }
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

    if (this.doubleJumpFlipTimer > 0) {
      this.doubleJumpFlipTimer = Math.max(0, this.doubleJumpFlipTimer - dt);
    }

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
      rig.bodyGroup.rotation.x = 0;
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
    } else if (this.hasSpiderSuit && this.spiderTransformTimer > 0) {
      rig.bodyGroup.rotation.x = -0.12;
      rig.leftArm.rotation.x = -2.4;
      rig.rightArm.rotation.x = -2.4;
      rig.rightArm.rotation.z = 0.4;
      rig.leftLeg.rotation.x = 0.25;
      rig.rightLeg.rotation.x = -0.15;
      rig.hoverBeam.visible = false;
      rig.thrusterLeft.visible = false;
      rig.thrusterRight.visible = false;
      rig.botRocketRig.visible = false;
    } else {
      rig.rightArm.rotation.z = 0;
      if (this.isClimbing) {
        rig.bodyGroup.rotation.x = 0;
        const climbMotion = Math.sin(this.playerPos.y * 5.5);
        rig.leftArm.rotation.x = -2.35 + climbMotion * 0.45;
        rig.rightArm.rotation.x = -2.35 - climbMotion * 0.45;
        rig.leftLeg.rotation.x = -climbMotion * 0.45;
        rig.rightLeg.rotation.x = climbMotion * 0.45;
        rig.bodyGroup.position.y = 0;
      } else if (this.hasSpiderSuit && this.webActive) {
        const swingLean = THREE.MathUtils.clamp(Math.hypot(this.playerVel.x, this.playerVel.z) * 0.028, 0.12, 0.55);
        rig.bodyGroup.rotation.x = THREE.MathUtils.damp(rig.bodyGroup.rotation.x, swingLean, 10, dt);
        rig.rightArm.rotation.x = -2.55;
        rig.leftArm.rotation.x = 0.55;
        rig.leftLeg.rotation.x = 0.72;
        rig.rightLeg.rotation.x = -0.35;
        rig.bodyGroup.position.y = 0;
      } else {
        const runFactor = Math.min(1, groundSpeed / 8.5);
        if (this.doubleJumpFlipTimer > 0) {
          const flipP = 1 - this.doubleJumpFlipTimer / 0.38;
          rig.bodyGroup.rotation.x = flipP * Math.PI * 2;
        } else {
          const targetLean = this.grounded
            ? Math.min(0.16, groundSpeed * 0.017)
            : THREE.MathUtils.clamp(-this.playerVel.y * 0.014, -0.16, 0.16);
          rig.bodyGroup.rotation.x = THREE.MathUtils.damp(rig.bodyGroup.rotation.x, targetLean, 10, dt);
        }
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
    const isVehicle =
      this.rocketState === 'flying' || this.gliderState === 'flying' || this.boatState === 'sailing';
    const isBoosting =
      this.rocketBoostTimer > 0 || this.gliderBoostTimer > 0 || this.botRocketTimer > 0;
    const groundSpd = Math.hypot(this.playerVel.x, this.playerVel.z);
    const isBossActive = Boolean(this.bossRuntime?.alive && this.bossRuntime.active);
    const dz = !this.active2DZone ? this.activeDiscoveryZone : null;
    const boatSpeedBoost = this.boatState === 'sailing' ? Math.max(0, getRiverZoneSpeedFactor(this.boatPos.z) - 1) * 10 : 0;
    const baseFov =
      this.spiderTransformTimer > 0
        ? 48
        : this.webActive
          ? 64
          : isBoosting
            ? 63
            : isVehicle
              ? this.boatState === 'sailing'
                ? 59 + boatSpeedBoost
                : 59
              : isBossActive
                ? 60
                : dz?.fov
                  ? dz.fov
                  : groundSpd > 6.5
                    ? 58
                    : 55;
    this.camDynamicFov = THREE.MathUtils.damp(this.camDynamicFov, baseFov, 6, dt);
    if (Math.abs(this.camera.fov - this.camDynamicFov) > 0.05) {
      this.camera.fov = this.camDynamicFov;
      this.camera.updateProjectionMatrix();
    }

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

    if (this.hasSpiderSuit && this.spiderTransformTimer > 0) {
      const orbitAng = (2.15 - this.spiderTransformTimer) * 1.45;
      const closeDist = 4.4;
      _vec3A.set(
        this.playerPos.x + Math.sin(orbitAng) * closeDist,
        this.playerPos.y + 1.85,
        this.playerPos.z + Math.cos(orbitAng) * closeDist
      );
      this.camCurrentPos.lerp(_vec3A, 1 - Math.exp(-7 * dt));
      _vec3B.set(this.playerPos.x, this.playerPos.y + 1.05, this.playerPos.z);
      this.camLookTarget.lerp(_vec3B, 1 - Math.exp(-10 * dt));
      this.camera.position.copy(this.camCurrentPos);
      this.camera.lookAt(this.camLookTarget);
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
      const waterY = getRiverWaterY(this.boatPos.z);
      const dropSlope = getRiverDropSlope(this.boatPos.z);
      const camX = THREE.MathUtils.lerp(riverCx, this.boatPos.x, 0.72) - Math.sin(riverAngle) * 7.5;
      const camZ = this.boatPos.z + Math.cos(riverAngle) * 11.4;
      const camY = waterY + 5.6 + this.boatJumpY * 0.45 - Math.min(0, dropSlope) * 2.4;
      _vec3A.set(camX, camY, camZ);
      this.camCurrentPos.lerp(_vec3A, 1 - Math.exp(-8.5 * dt));
      const lookAheadZ = this.boatPos.z - 14.5;
      const lookCx = THREE.MathUtils.lerp(getRiverCenterX(lookAheadZ), this.boatPos.x, 0.48);
      const lookY = getRiverWaterY(lookAheadZ) + 0.9;
      _vec3B.set(lookCx, lookY, lookAheadZ);
      this.camLookTarget.lerp(_vec3B, 1 - Math.exp(-9.5 * dt));
      this.camera.position.copy(this.camCurrentPos);
      if (this.shakeIntensity > 0.005) {
        this.camera.position.x += (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.y += (Math.random() - 0.5) * this.shakeIntensity;
      }
      this.camera.lookAt(this.camLookTarget);
      return;
    }

    let climbYawOverride: number | null = null;
    if (this.isClimbing && (this.climbingWall || this.climbFace)) {
      const cFace = this.climbingWall ? this.climbingWall.def.face : this.climbFace!;
      climbYawOverride =
        cFace === 'pz' ? 0 : cFace === 'nz' ? Math.PI : cFace === 'px' ? Math.PI / 2 : -Math.PI / 2;
    }
    const dist = this.active2DZone
      ? 13.5
      : this.webActive
        ? 11.8
        : isBossActive
          ? 11.4
          : dz?.dist ?? 9.6;
    const effPitch = this.active2DZone ? this.camPitch : isBossActive ? 0.46 : dz?.pitch ?? this.camPitch;
    const effYaw = climbYawOverride !== null ? climbYawOverride : this.camYaw + (dz?.yawOffset ?? 0);
    const horizDist = dist * Math.cos(effPitch);
    const heightOffset = dist * Math.sin(effPitch) + (this.active2DZone ? 1.8 : isBossActive ? 1.6 : 1.2);

    _vec3A.set(
      this.playerPos.x + Math.sin(effYaw) * horizDist,
      Math.max(this.currentLevel.theme.hazardFloorY + 1.6, this.playerPos.y + heightOffset),
      this.playerPos.z + Math.cos(effYaw) * horizDist
    );

    if (isBossActive && this.bossRuntime) {
      _vec3B.set(
        THREE.MathUtils.lerp(this.playerPos.x, this.bossRuntime.pos.x, 0.25),
        this.playerPos.y + 1.3,
        THREE.MathUtils.lerp(this.playerPos.z, this.bossRuntime.pos.z, 0.25)
      );
    } else {
      _vec3B.set(this.playerPos.x, this.playerPos.y + (dz ? 1.45 : 1.15), this.playerPos.z);
    }

    // 3D wall/platform occlusion avoidance
    if (!this.active2DZone) {
      let minT = 1.0;
      const steps = 6;
      for (let s = 2; s <= steps; s++) {
        const t = s / steps;
        _vec3C.lerpVectors(_vec3B, _vec3A, t);
        let blocked = false;
        for (const p of this.platforms) {
          if (!p.visible || p.def.kind === 'glass' || p.def.invisible) continue;
          if (
            Math.abs(_vec3C.x - p.pos.x) < p.halfSize.x + 0.35 &&
            Math.abs(_vec3C.y - p.pos.y) < p.halfSize.y + 0.35 &&
            Math.abs(_vec3C.z - p.pos.z) < p.halfSize.z + 0.35
          ) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          for (const cw of this.climbWalls) {
            if (
              Math.abs(_vec3C.x - cw.pos.x) < cw.halfSize.x + 0.35 &&
              Math.abs(_vec3C.y - cw.pos.y) < cw.halfSize.y + 0.35 &&
              Math.abs(_vec3C.z - cw.pos.z) < cw.halfSize.z + 0.35
            ) {
              blocked = true;
              break;
            }
          }
        }
        if (blocked) {
          minT = Math.max(0.32, (s - 1) / steps);
          break;
        }
      }
      if (minT < 1.0) {
        _vec3A.lerpVectors(_vec3B, _vec3A, minT);
      }
    }

    const smoothFactor = 1 - Math.exp(-8.5 * dt);
    this.camCurrentPos.lerp(_vec3A, smoothFactor);
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
        ? {
            name: this.bossRuntime.name,
            hp: this.bossRuntime.hp,
            maxHp: this.bossRuntime.maxHp,
            phase: this.bossRuntime.phase,
          }
        : null;
    const activeTc = this.timedChallengesRuntime.find((tc) => tc.active) ?? null;
    this.onHudUpdate({
      phase: this.phase,
      levelIndex: this.currentLevel.index,
      levelName: this.currentLevel.name,
      biome: this.currentLevel.theme.biome,
      perspectiveMode: this.perspectiveMode,
      hasBow: this.hasBow,
      hasMonkeySuit: this.hasMonkeySuit,
      isClimbing: this.isClimbing,
      hasSpiderSuit: this.hasSpiderSuit,
      isSwinging: this.webActive,
      canWebTarget: Boolean(this.highlightedWebAnchor),
      spiderTransforming: this.spiderTransformTimer > 0,
      challengeTimer: activeTc ? Math.max(0, activeTc.timer) : null,
      challengeProgress: activeTc
        ? `${activeTc.label}: ${activeTc.currentIdx}/${activeTc.checkpoints.length}`
        : null,
      boss: bossHud,
      health: this.health,
      maxHealth: this.maxHealth,
      coins: this.coinsCollected,
      totalCoins: this.totalLevelCoins,
      botsRescued: this.botsRescued,
      totalBots: this.currentLevel.miniBots.length,
      relicsCollected: this.relicsCollected,
      totalRelics: this.relics.length,
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
