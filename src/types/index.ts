// File Types
export interface FileEntry {
  id: string;
  name: string;
  type: FileType;
  size: number;
  lastModified: number;
  url?: string;
  data?: ArrayBuffer;
  thumbnail?: string;
}

export type FileType = 
  | 'model'
  | 'motion'
  | 'pose'
  | 'audio'
  | 'background'
  | 'unknown';

export const FILE_TYPE_EXTENSIONS: Record<string, FileType> = {
  '.pmx': 'model',
  '.bpmx': 'model',
  '.zip': 'model',
  '.vmd': 'motion',
  '.vpd': 'pose',
  '.mp3': 'audio',
  '.wav': 'audio',
  '.ogg': 'audio',
  '.png': 'background',
  '.jpg': 'background',
  '.jpeg': 'background',
};

// MMD Model Types
export interface PMXModel {
  id: string;
  name: string;
  path: string;
  meshes: PMXMesh[];
  materials: PMXMaterial[];
  morphs: PMXMorph[];
  bones: PMXBone[];
  physics?: PMXPhysics;
  displayItems?: PMXDisplayItem[];
}

export interface PMXMesh {
  id: string;
  name: string;
  vertices: number;
  indices: number;
  materialIndex: number;
}

export interface PMXMaterial {
  id: string;
  name: string;
  diffuseColor: [number, number, number, number];
  specularColor: [number, number, number];
  shininess: number;
  ambientColor: [number, number, number];
  texturePath?: string;
  sphereTexturePath?: string;
  toonTexturePath?: string;
  isDoubleSided: boolean;
  edgeColor: [number, number, number, number];
  edgeSize: number;
  flags: {
    castShadow: boolean;
    receiveShadow: boolean;
    selfShadow: boolean;
    edge: boolean;
  };
}

export interface PMXMorph {
  id: string;
  name: string;
  type: MorphType;
  vertices: MorphVertex[];
  category: string;
}

export type MorphType = 'vertex' | 'uv' | 'bone' | 'material' | 'group';

export interface MorphVertex {
  vertexIndex: number;
  position: [number, number, number];
}

export interface PMXBone {
  id: string;
  name: string;
  position: [number, number, number];
  parentIndex: number;
  transformationOrder: number;
  isRotatable: boolean;
  isMovable: boolean;
  isVisible: boolean;
  isManipulable: boolean;
}

export interface PMXPhysics {
  rigidBodies: PMXRigidBody[];
  joints: PMXJoint[];
}

export interface PMXRigidBody {
  id: string;
  name: string;
  type: RigidBodyType;
  shape: RigidBodyShape;
  size: [number, number, number];
  position: [number, number, number];
  rotation: [number, number, number];
  mass: number;
  friction: number;
  restitution: number;
  boneIndex: number;
}

export type RigidBodyType = 'static' | 'dynamic' | 'kinematic';
export type RigidBodyShape = 'sphere' | 'box' | 'capsule';

export interface PMXJoint {
  id: string;
  name: string;
  type: JointType;
  rigidBodyA: number;
  rigidBodyB: number;
  position: [number, number, number];
  rotation: [number, number, number];
  minPosition: [number, number, number];
  maxPosition: [number, number, number];
  minRotation: [number, number, number];
  maxRotation: [number, number, number];
  springPosition: [number, number, number];
  springRotation: [number, number, number];
}

export type JointType = 'spring6dof' | 'p2p' | 'hinge' | 'slider';

export interface PMXDisplayItem {
  id: string;
  name: string;
  type: DisplayItemType;
  indices: number[];
}

export type DisplayItemType = 'bone' | 'morph';

// Motion Types
export interface VMDMotion {
  id: string;
  name: string;
  path: string;
  frameCount: number;
  fps: number;
  boneFrames: VMDBoneFrame[];
  morphFrames: VMDMorphFrame[];
  cameraFrames: VMDCameraFrame[];
  lightFrames: VMDLightFrame[];
  selfShadowFrames: VMDSelfShadowFrame[];
}

export interface VMDBoneFrame {
  frame: number;
  boneName: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
  interpolation: InterpolationType[];
}

export interface VMDMorphFrame {
  frame: number;
  morphName: string;
  weight: number;
  interpolation: InterpolationType[];
}

export interface VMDCameraFrame {
  frame: number;
  position: [number, number, number];
  rotation: [number, number, number];
  fov: number;
  distance: number;
  perspective: boolean;
  interpolation: InterpolationType[];
}

export interface VMDLightFrame {
  frame: number;
  color: [number, number, number];
  direction: [number, number, number];
}

export interface VMDSelfShadowFrame {
  frame: number;
  mode: number;
  distance: number;
}

export type InterpolationType = [number, number, number, number];

// Pose Types
export interface VPDPose {
  id: string;
  name: string;
  path: string;
  bonePoses: VPDBonePose[];
  morphPoses: VPDMorphPose[];
}

export interface VPDBonePose {
  boneName: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
}

export interface VPDMorphPose {
  morphName: string;
  weight: number;
}

// Audio Types
export interface AudioFile {
  id: string;
  name: string;
  path: string;
  duration: number;
  url: string;
}

// Background Types
export interface BackgroundImage {
  id: string;
  name: string;
  path: string;
  url: string;
}

// Scene State
export interface SceneState {
  model?: PMXModel;
  motion?: VMDMotion;
  pose?: VPDPose;
  audio?: AudioFile;
  background?: BackgroundImage;
  currentFrame: number;
  isPlaying: boolean;
  cameraMode: CameraMode;
  showFloorGrid: boolean;
  showUI: boolean;
  lowExpressionMode: boolean;
}

export type CameraMode = 'orbit' | 'vmd';

// Gizmo Types
export type GizmoMode = 'translate' | 'rotate' | 'none';
export type GizmoAxis = 'x' | 'y' | 'z' | 'xy' | 'xz' | 'yz' | 'xyz';

// Database Types
export interface DatabaseStats {
  models: number;
  motions: number;
  poses: number;
  audios: number;
  backgrounds: number;
  totalSize: number;
}

// Event Types
export interface SceneEvent {
  type: SceneEventType;
  payload?: any;
}

export type SceneEventType = 
  | 'model_loaded'
  | 'motion_loaded'
  | 'pose_loaded'
  | 'audio_loaded'
  | 'background_loaded'
  | 'play'
  | 'pause'
  | 'stop'
  | 'frame_change'
  | 'camera_mode_change'
  | 'gizmo_mode_change'
  | 'material_change'
  | 'morph_change'
  | 'clear_scene';

// UI State
export interface UIState {
  selectedTab: string;
  selectedMaterial?: string;
  selectedMorph?: string;
  selectedBone?: string;
  gizmoMode: GizmoMode;
  gizmoAxis: GizmoAxis;
  isFullscreen: boolean;
}

// Loaders State
export interface LoaderState {
  isLoading: boolean;
  progress: number;
  message: string;
  errors: string[];
}
