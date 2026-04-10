
export type TransformMode = 'translate' | 'rotate' | 'scale';
export type CameraMode = 'orbit' | 'pan';

export enum ItemType {
  TABLE_SQUARE = 'TABLE_SQUARE',
  TABLE_ROUND = 'TABLE_ROUND',
  COUNTER_STRAIGHT = 'COUNTER_STRAIGHT',
  COUNTER_CORNER = 'COUNTER_CORNER',
  CHAIR = 'CHAIR',
  STOVE = 'STOVE',
  SINK = 'SINK',
  FRIDGE = 'FRIDGE',
  PLANT = 'PLANT',
  DECOR_PAN = 'DECOR_PAN',
  DECOR_BOARD = 'DECOR_BOARD',
  DECOR_FLAG = 'DECOR_FLAG',
  DECOR_RUG = 'DECOR_RUG',
  // Architecture & Custom
  WALL = 'WALL',
  CUSTOM_MODEL = 'CUSTOM_MODEL',
  // Food / Ingredients
  FOOD_TOMATO = 'FOOD_TOMATO',
  FOOD_CHEESE = 'FOOD_CHEESE',
  FOOD_PEPPERONI = 'FOOD_PEPPERONI',
  FOOD_WHEAT = 'FOOD_WHEAT',
  FOOD_MILK = 'FOOD_MILK',
  FOOD_EGGPLANT = 'FOOD_EGGPLANT',
  FOOD_ZUCCHINI = 'FOOD_ZUCCHINI'
}

export interface SceneObject {
  id: string;
  type: ItemType;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  // We now support multiple colors per object (e.g. { body: '#fff', top: '#000' })
  customColors: Record<string, string>; 
  // For custom models (.fbx, .glb)
  modelUrl?: string;
  modelFormat?: 'fbx' | 'glb' | 'gltf';
  // For Textures (Walls, Floors, Custom objects)
  textureUrl?: string;
}

export interface EnvironmentSettings {
  floorColor: string;
  floorTextureUrl: string | null;
  showGrid: boolean;
  referenceImage: string | null;
  referenceOpacity: number;
}
