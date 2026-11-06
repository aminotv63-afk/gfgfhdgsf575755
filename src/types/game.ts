export interface ControlState {
  moveX: number; // -1 to 1
  moveY: number; // -1 to 1 (forward/backward)
  isWalking: boolean; // default walk mode toggle
  isRunning: boolean; // sprint button held
  isJumping: boolean; // jump trigger
  cameraRotateX: number; // delta yaw
  cameraRotateY: number; // delta pitch
  isSwordDrawn: boolean; // whether sword is drawn in hand
  isAttacking: boolean; // attack strike trigger
  isSittingOnThrone?: boolean; // whether Sultan is seated on the Royal Throne
  isRidingHorse?: boolean; // whether Sultan is mounted on the Royal Arabian Horse
  horsePos?: { x: number; y: number; z: number };
  horseAngle?: number;
  horseSpeedRatio?: number;
}

export type AnimationState = 'idle' | 'walk' | 'run' | 'jump' | 'fall' | 'attack';

export interface StoryScene {
  id: number;
  title: string;
  subtitle: string;
  text: string;
  theme: string;
  badge: string;
}
