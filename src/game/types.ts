export type GamePhase = 'title' | 'playing' | 'paused' | 'victory' | 'gameover';

export type BiomeKind = 'jungle' | 'desert' | 'ice';

export type PlatformKind = 'solid' | 'moving' | 'crumble' | 'glass' | 'conveyor' | 'ice';

export interface PlatformDef {
  id: string;
  pos: [number, number, number];
  size: [number, number, number];
  kind: PlatformKind;
  style?: 'jungle' | 'desert' | 'ice' | 'tech' | 'gold' | 'crystal';
  moveOffset?: [number, number, number];
  moveSpeed?: number;
  movePhase?: number;
  conveyorDir?: [number, number];
  /** If set, platform starts inactive (wireframe outline) until the matching archery target is hit */
  linkedTargetId?: string;
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

export type EnemyKind = 'chomper' | 'spiky' | 'hopper';

export interface EnemyDef {
  id: string;
  kind: EnemyKind;
  pos: [number, number, number];
  patrolOffset: [number, number, number];
  speed: number;
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

export interface LevelDef {
  index: number;
  id: string;
  name: string;
  subtitle: string;
  theme: LevelTheme;
  spawn: [number, number, number];
  goalPos: [number, number, number];
  bowPickupPos?: [number, number, number];
  targets?: ArcheryTargetDef[];
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
}

export interface HudSnapshot {
  phase: GamePhase;
  levelIndex: number;
  levelName: string;
  biome: BiomeKind;
  perspectiveMode: '3D' | '2D' | 'COHETE';
  hasBow: boolean;
  health: number;
  maxHealth: number;
  coins: number;
  totalCoins: number;
  botsRescued: number;
  totalBots: number;
  hoverFuel: number; // 0..1
  elapsedTime: number;
  checkpointActive: boolean;
  bannerText: string | null;
  muted: boolean;
  musicMuted: boolean;
}

export interface LevelProgress {
  bestCoins: number;
  bestBots: number;
  bestTime: number | null;
  completed: boolean;
}
