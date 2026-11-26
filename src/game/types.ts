export type GamePhase = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';

export type BiomeKind =
  | 'jungle'
  | 'temple'
  | 'desert'
  | 'ice'
  | 'volcanic'
  | 'nebula'
  | 'paris'
  | 'rapids'
  | 'newyork'
  | 'gammacity';

export type PlatformKind =
  | 'solid'
  | 'moving'
  | 'crumble'
  | 'glass'
  | 'conveyor'
  | 'ice'
  | 'rotating'
  | 'disappearing'
  | 'elevator';

export type PlatformStyle =
  | 'jungle'
  | 'temple'
  | 'desert'
  | 'ice'
  | 'tech'
  | 'gold'
  | 'crystal'
  | 'volcanic'
  | 'nebula'
  | 'paris'
  | 'river'
  | 'newyork'
  | 'gammacity';

export interface PlatformDef {
  id: string;
  pos: [number, number, number];
  size: [number, number, number];
  kind: PlatformKind;
  style?: PlatformStyle;
  moveOffset?: [number, number, number];
  moveSpeed?: number;
  movePhase?: number;
  conveyorDir?: [number, number];
  /** Angular rotation speed (rad/s) around Y for 'rotating' platforms */
  rotSpeed?: number;
  /** Cycle duration (seconds) for 'disappearing' platforms */
  cyclePeriod?: number;
  cyclePhase?: number;
  /** If set, platform starts inactive (wireframe outline) until the matching archery target or switch is activated */
  linkedTargetId?: string;
  /** If set, platform starts inactive/hidden until the matching switch is triggered */
  linkedSwitchId?: string;
  /** Visual hint for secret/organic/architectural shaping */
  shape?: 'organic' | 'pillar' | 'bridge' | 'disc' | 'ruin' | 'arch' | 'default';
  /** If true, collider is active without rendering a solid block mesh */
  invisible?: boolean;
}

export interface SwitchDef {
  id: string;
  pos: [number, number, number];
  /** Optional label shown in banner when activated */
  message?: string;
  /** Optional coins awarded when triggered */
  coins?: number;
}

export interface RelicDef {
  id: string;
  name: string;
  pos: [number, number, number];
}

export interface WindZoneDef {
  id: string;
  pos: [number, number, number];
  radius: number;
  height: number;
  liftSpeed?: number;
}

export interface ClimbWallDef {
  id: string;
  pos: [number, number, number];
  size: [number, number, number];
  /** Which face has climbable grips: '+z', '-z', '+x', '-x' */
  face: 'pz' | 'nz' | 'px' | 'nx';
}

export interface ArcheryTargetDef {
  id: string;
  pos: [number, number, number];
  coins?: number;
}

export interface JumpPadDef {
  pos: [number, number, number];
  boost?: number;
}

export interface CrateDef {
  id: string;
  pos: [number, number, number];
  coins?: number;
}

export interface CoinDef {
  pos: [number, number, number];
}

export interface MiniBotDef {
  id: string;
  name: string;
  pos: [number, number, number];
}

export type EnemyKind =
  | 'chomper'
  | 'spiky'
  | 'hopper'
  | 'brute'
  | 'flyer'
  | 'shooter'
  | 'chaser'
  | 'guardian'
  | 'armored_guard'
  | 'giant_mech';

export interface EnemyDef {
  id: string;
  kind: EnemyKind;
  pos: [number, number, number];
  patrolOffset: [number, number, number];
  speed: number;
  hp?: number;
  scale?: number;
}

export type BossStyle = 'jungle' | 'ice' | 'temple' | 'volcanic' | 'nebula' | 'gammacity';

export type DestructibleKind =
  | 'wall'
  | 'barrier'
  | 'pillar'
  | 'factory_tank'
  | 'bridge_span'
  | 'tower_facade'
  | 'crate_stack';

export interface DestructiblePropDef {
  id: string;
  kind: DestructibleKind;
  pos: [number, number, number];
  size: [number, number, number];
  hp?: number;
  coins?: number;
  message?: string;
}

export type ThrowableKind = 'car' | 'rock' | 'container' | 'concrete' | 'beam';

export interface ThrowableObjectDef {
  id: string;
  kind: ThrowableKind;
  pos: [number, number, number];
  rotY?: number;
  color?: number;
}

export interface DestructionChallengeDef {
  id: string;
  label: string;
  startPos: [number, number, number];
  targetIds: string[];
  timeLimit: number;
  rewardCoins?: number;
}

export interface BossDef {
  name: string;
  style?: BossStyle;
  pos: [number, number, number];
  arenaCenter: [number, number, number];
  arenaRadius: number;
  maxHp: number;
}

export interface HazardLaserDef {
  pos: [number, number, number];
  length: number;
  axis: 'x' | 'z';
  period: number;
  phase?: number;
}

export interface CheckpointDef {
  id: string;
  pos: [number, number, number];
}

export interface CameraZone2DDef {
  id: string;
  min: [number, number, number];
  max: [number, number, number];
  /** Which world axis the 2D character moves along: 'x' (side view from +Z) or 'z' (side view from +X) */
  moveAxis: 'x' | 'z';
  /** Locked coordinate on the perpendicular horizontal axis */
  lockCoord: number;
}

export interface RocketSectionDef {
  launchpadPos: [number, number, number];
  landingPos: [number, number, number];
  cruiseSpeed: number;
  rings: [number, number, number][];
  mines: [number, number, number][];
}

export interface GliderSectionDef {
  launchpadPos: [number, number, number];
  landingPos: [number, number, number];
  cruiseSpeed: number;
  rings: [number, number, number][];
}

export interface RiverRockDef {
  pos: [number, number, number];
  radius?: number;
}

export interface CrocodileDef {
  pos: [number, number, number];
  patrolX: number;
  speed: number;
  phase?: number;
  behavior?: 'patrol' | 'ambush';
}

export function getRiverCenterX(z: number): number {
  if (z >= -10 || z <= -274) return 0;
  const t = (-z - 10) / 264;
  const envelope = Math.sin(Math.PI * t);
  return (Math.sin(t * Math.PI * 3.5) * 14.5 + Math.sin(t * Math.PI * 1.5) * 5.0) * envelope;
}

export function getRiverSlopeAngle(z: number): number {
  const xAhead = getRiverCenterX(z - 1.5);
  const xBehind = getRiverCenterX(z + 1.5);
  return Math.atan2(xAhead - xBehind, 3.0);
}

function riverSmoothstep(u: number): number {
  const t = u <= 0 ? 0 : u >= 1 ? 1 : u;
  return t * t * (3 - 2 * t);
}

/**
 * 3D river surface altitude from the upstream gorge dock (y = 11.0 at z >= -14)
 * descending down a continuous rapid grade + 2 navigable waterfall drops
 * (z ≈ -92 and z ≈ -193) into the tranquil lake at y = 0.0 (z <= -270).
 */
export function getRiverWaterY(z: number): number {
  if (z >= -14) return 11.0;
  if (z <= -270) return 0.0;
  const uAll = (-z - 14) / 256;
  const baseDrop = uAll * 3.4;
  const wf1 = riverSmoothstep((-z - 84) / 16) * 3.6;
  const wf2 = riverSmoothstep((-z - 184) / 18) * 4.0;
  return 11.0 - (baseDrop + wf1 + wf2);
}

/** Vertical river surface slope dz -> dy (negative when dropping downhill). */
export function getRiverDropSlope(z: number): number {
  return (getRiverWaterY(z - 1.2) - getRiverWaterY(z + 1.2)) / 2.4;
}

/** Varying river current speed factor: surging chutes, waterfall plunges, and calmer lake approach. */
export function getRiverZoneSpeedFactor(z: number): number {
  if (z <= -274) return 0.78;
  // Waterfall plunge surges
  const wf1Surge = Math.exp(-Math.pow((z + 92) / 11, 2)) * 0.4;
  const wf2Surge = Math.exp(-Math.pow((z + 193) / 12, 2)) * 0.42;
  // Whitewater fast navigation chutes
  const chute1 = Math.exp(-Math.pow((z + 56) / 14, 2)) * 0.24;
  const chute2 = Math.exp(-Math.pow((z + 138) / 16, 2)) * 0.22;
  const chute3 = Math.exp(-Math.pow((z + 236) / 14, 2)) * 0.24;
  return 1.0 + wf1Surge + wf2Surge + chute1 + chute2 + chute3;
}

/**
 * Lateral river navigable offsets relative to getRiverCenterX(z).
 * Widens outward cleanly on the left (z ∈ [-112, -158]) and right (z ∈ [-208, -248])
 * to open secret island bifurcation routes without obstructing main-channel obstacles.
 */
export function getRiverChannelBounds(z: number, baseHalfWidth = 7.8): [number, number] {
  let minOff = -baseHalfWidth;
  let maxOff = baseHalfWidth;
  // Narrow canyon passes (keeps >= 6.9 clearance so existing obstacles stay inside bounds)
  const narrow1 = Math.exp(-Math.pow((z + 60) / 9, 2)) * 0.85;
  const narrow2 = Math.exp(-Math.pow((z + 170) / 10, 2)) * 0.85;
  minOff += narrow1 + narrow2;
  maxOff -= narrow1 + narrow2;

  // Secret left bifurcation around jungle island (z = -112..-158)
  if (z <= -110 && z >= -160) {
    const fork = Math.sin(((z + 110) / -50) * Math.PI);
    minOff -= fork * 8.4;
  }
  // Secret right bifurcation around ruin island (z = -206..-252)
  if (z <= -206 && z >= -252) {
    const fork = Math.sin(((z + 206) / -46) * Math.PI);
    maxOff += fork * 8.4;
  }
  return [minOff, maxOff];
}

export interface BoatSectionDef {
  dockPos: [number, number, number];
  lakePos: [number, number, number];
  calmLakeZ: number;
  cruiseSpeed: number;
  riverHalfWidth: number;
  rocks: RiverRockDef[];
  crocodiles: CrocodileDef[];
}

export interface LevelTheme {
  biome: BiomeKind;
  skyTop: string;
  skyHorizon: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  keyLightColor: number;
  keyLightIntensity: number;
  hemiSkyColor: number;
  hemiGroundColor: number;
  hemiIntensity: number;
  accentColor: string;
  hazardFloorY: number;
  hazardColor: number;
  hazardEmissive: number;
}

export interface CameraDiscoveryZoneDef {
  id: string;
  min: [number, number, number];
  max: [number, number, number];
  yawOffset?: number;
  pitch?: number;
  dist?: number;
  fov?: number;
  banner?: string;
}

export interface TimedChallengeDef {
  id: string;
  startPos: [number, number, number];
  checkpoints: [number, number, number][];
  timeLimit: number;
  rewardCoins?: number;
  label?: string;
}

export interface LevelDef {
  index: number;
  id: string;
  name: string;
  subtitle: string;
  theme: LevelTheme;
  spawn: [number, number, number];
  goalPos: [number, number, number];
  bowPickupPos?: [number, number, number];
  monkeySuitPos?: [number, number, number];
  spiderSuitLevel?: boolean;
  hulkSuitLevel?: boolean;
  webAnchors?: [number, number, number][];
  timedChallenges?: TimedChallengeDef[];
  destructibles?: DestructiblePropDef[];
  throwables?: ThrowableObjectDef[];
  destructionChallenges?: DestructionChallengeDef[];
  climbWalls?: ClimbWallDef[];
  targets?: ArcheryTargetDef[];
  switches?: SwitchDef[];
  relics?: RelicDef[];
  windZones?: WindZoneDef[];
  discoveryZones?: CameraDiscoveryZoneDef[];
  boss?: BossDef;
  platforms: PlatformDef[];
  jumpPads: JumpPadDef[];
  crates: CrateDef[];
  coins: CoinDef[];
  miniBots: MiniBotDef[];
  enemies: EnemyDef[];
  lasers: HazardLaserDef[];
  checkpoints: CheckpointDef[];
  zones2D: CameraZone2DDef[];
  rocketSection?: RocketSectionDef;
  gliderSection?: GliderSectionDef;
  boatSection?: BoatSectionDef;
}

export interface HudSnapshot {
  phase: GamePhase;
  levelIndex: number;
  levelName: string;
  biome: BiomeKind;
  perspectiveMode: '3D' | '2D' | 'COHETE' | 'ALA DELTA' | 'BARCO';
  hasBow: boolean;
  hasMonkeySuit: boolean;
  isClimbing: boolean;
  hasSpiderSuit: boolean;
  isSwinging: boolean;
  canWebTarget: boolean;
  spiderTransforming: boolean;
  hasHulkSuit: boolean;
  hulkLeapCharge: number; // 0..1
  hulkCarrying: string | null;
  hulkTransforming: boolean;
  challengeTimer: number | null;
  challengeProgress: string | null;
  boss: { name: string; hp: number; maxHp: number; phase: number } | null;
  health: number;
  maxHealth: number;
  coins: number;
  totalCoins: number;
  botsRescued: number;
  totalBots: number;
  relicsCollected: number;
  totalRelics: number;
  hoverFuel: number; // 0..1
  botRocketCharges: number;
  botRocketActive: boolean;
  elapsedTime: number;
  checkpointActive: boolean;
  bannerText: string | null;
  muted: boolean;
  musicMuted: boolean;
}

export interface LevelProgress {
  bestCoins: number;
  bestBots: number;
  bestRelics?: number;
  bestTime: number | null;
  completed: boolean;
}
