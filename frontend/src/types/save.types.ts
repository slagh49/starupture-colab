export type EntityCategory =
  | 'basecore' | 'machine' | 'energy' | 'infra'
  | 'antenna'  | 'danger'  | 'loot';

export interface SaveSession {
  id: string;
  filename: string;
  sessionName: string | null;
  playtime: number;
  timestamp: string;
  uploadAt: string;
}

export interface GameEntity {
  id: string;
  gameId: string;
  name: string;
  customName: string | null;
  category: EntityCategory;
  x: number;
  y: number;
  z: number;
  recipe: string | null;
  infection: number;
  foundable: boolean;
  status: 'on' | 'off';
  electricityLevel: number | null;
  craftProgress: number | null;
  craftSpeed: number | null;
  outputFull: boolean | null;
  missingItems: boolean | null;
  priority: string | null;
}

export interface GameEntityItem {
  side: 'input' | 'output';
  item: string;
  count: number;
}

export interface DroneLink {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  item: string;
  droneCount: number;
  state: string;
}

export interface RailSpline {
  id: string;
  splineType: 'DroneRail' | 'Walkway';
  points: Array<{ x: number; y: number }>;
}

export interface BaseZone {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Corporation {
  name: string;
  level: number;
  reputation: number;
  researchTier1: number;
  researchTier2: number;
}

export interface Progression {
  corporations: Corporation[];
  recipesUnlocked: number;
  recipesLocked: number;
}

export interface AppConfig {
  ftpHost: string | null;
  ftpPort: number | null;
  ftpUser: string | null;
  hasPassword: boolean;
  ftpPath: string | null;
  bridgeUrl: string | null;
  autoImportEnabled: boolean;
  autoImportIntervalMinutes: number;
  lastImportAt: string | null;
}

export interface SessionSummary {
  totalEntities: number;
  activeMachines: number;
  inactiveMachines: number;
  activeDrones: number;
  infectedEntities: number;
  productions: Array<{ recipe: string; machineCount: number }>;
}
