export type ColorCode = 'white' | 'yellow' | 'red';

export interface GTOElement {
  id: string;
  type: 'pole' | 'block' | 'wall' | 'bridge';
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color: ColorCode;
  snapPoints?: [number, number, number][];
}

export interface GTOStage {
  id: number;
  name: string;
  description: string;
  elements: GTOElement[];
  helpingMaterials: {
    planks: number;
    ballis: number;
    ropes: number;
  };
  hinglishHint: string;
}
