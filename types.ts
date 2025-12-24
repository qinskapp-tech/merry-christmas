export enum AppPhase {
  Tree = 'tree',
  Blooming = 'blooming',
  Nebula = 'nebula',
  Collapsing = 'collapsing'
}

export enum HandGesture {
  None = 'None',
  Open_Palm = 'Open_Palm',
  Closed_Fist = 'Closed_Fist'
}

export interface ParticleData {
  initialPos: [number, number, number];
  treePos: [number, number, number];
  nebulaPos: [number, number, number];
  color: string;
  size: number;
}