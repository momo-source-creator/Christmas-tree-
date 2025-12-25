
export interface HandData {
  x: number;
  y: number;
  z: number;
  isOpen: boolean;
  isPointing: boolean;
  isPinching: boolean;
  isFist: boolean;
  indexTip: { x: number, y: number, z: number } | null;
  detected: boolean;
}

export interface Blessing {
  text: string;
  description?: string;
  weight: number;
}

export enum GestureType {
  NONE = 'NONE',
  OPEN = 'OPEN',
  FIST = 'FIST',
  POINTING = 'POINTING',
  PINCH = 'PINCH'
}
