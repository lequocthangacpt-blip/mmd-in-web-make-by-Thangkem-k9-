import { create } from 'zustand';
import { SceneState, PMXModel, VMDMotion, VPDPose, AudioFile, BackgroundImage } from '../types';

interface SceneStore extends SceneState {
  // State
  model: PMXModel | null;
  motion: VMDMotion | null;
  pose: VPDPose | null;
  audio: AudioFile | null;
  background: BackgroundImage | null;
  
  // Actions
  setModel: (model: PMXModel | null) => void;
  setMotion: (motion: VMDMotion | null) => void;
  setPose: (pose: VPDPose | null) => void;
  setAudio: (audio: AudioFile | null) => void;
  setBackground: (background: BackgroundImage | null) => void;
  setCurrentFrame: (frame: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setCameraMode: (mode: 'orbit' | 'vmd') => void;
  setShowFloorGrid: (show: boolean) => void;
  setShowUI: (show: boolean) => void;
  setLowExpressionMode: (enabled: boolean) => void;
  
  // Playback controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  nextFrame: () => void;
  previousFrame: () => void;
  goToFrame: (frame: number) => void;
  
  // Clear scene
  clearScene: () => void;
  
  // Getters
  getTotalFrames: () => number;
  getFPS: () => number;
}

const initialState: Omit<SceneStore, 'setModel' | 'setMotion' | 'setPose' | 'setAudio' | 'setBackground' | 'setCurrentFrame' | 'setIsPlaying' | 'setCameraMode' | 'setShowFloorGrid' | 'setShowUI' | 'setLowExpressionMode' | 'play' | 'pause' | 'stop' | 'nextFrame' | 'previousFrame' | 'goToFrame' | 'clearScene' | 'getTotalFrames' | 'getFPS'> = {
  model: null,
  motion: null,
  pose: null,
  audio: null,
  background: null,
  currentFrame: 0,
  isPlaying: false,
  cameraMode: 'orbit',
  showFloorGrid: true,
  showUI: true,
  lowExpressionMode: false,
};

export const useSceneStore = create<SceneStore>((set, get) => ({
  ...initialState,
  
  // Setters
  setModel: (model) => set({ model }),
  setMotion: (motion) => set({ motion }),
  setPose: (pose) => set({ pose }),
  setAudio: (audio) => set({ audio }),
  setBackground: (background) => set({ background }),
  setCurrentFrame: (frame) => set({ currentFrame: frame }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setShowFloorGrid: (show) => set({ showFloorGrid: show }),
  setShowUI: (show) => set({ showUI: show }),
  setLowExpressionMode: (enabled) => set({ lowExpressionMode: enabled }),
  
  // Playback controls
  play: () => {
    const { motion, currentFrame } = get();
    const totalFrames = get().getTotalFrames();
    
    // Start animation loop
    const animationId = requestAnimationFrame(() => {
      const now = performance.now();
      const fps = get().getFPS();
      const frameTime = 1000 / fps;
      
      // Calculate elapsed time
      // This is simplified - in a real implementation, you'd track the start time
      // and calculate the current frame based on elapsed time
      const nextFrame = currentFrame + 1;
      
      if (nextFrame >= totalFrames) {
        // Loop or stop
        get().stop();
      } else {
        get().goToFrame(nextFrame);
      }
    });
    
    set({ isPlaying: true });
    
    // Return cleanup function
    return () => cancelAnimationFrame(animationId);
  },
  
  pause: () => {
    set({ isPlaying: false });
  },
  
  stop: () => {
    set({ isPlaying: false, currentFrame: 0 });
  },
  
  nextFrame: () => {
    const { currentFrame } = get();
    const totalFrames = get().getTotalFrames();
    const nextFrame = Math.min(currentFrame + 1, totalFrames - 1);
    set({ currentFrame: nextFrame });
  },
  
  previousFrame: () => {
    const { currentFrame } = get();
    const prevFrame = Math.max(currentFrame - 1, 0);
    set({ currentFrame: prevFrame });
  },
  
  goToFrame: (frame) => {
    const totalFrames = get().getTotalFrames();
    const clampedFrame = Math.max(0, Math.min(frame, totalFrames - 1));
    set({ currentFrame: clampedFrame });
  },
  
  // Clear scene
  clearScene: () => {
    set({
      model: null,
      motion: null,
      pose: null,
      audio: null,
      background: null,
      currentFrame: 0,
      isPlaying: false,
    });
  },
  
  // Getters
  getTotalFrames: () => {
    const { motion } = get();
    return motion?.frameCount || 1000; // Default to 1000 frames
  },
  
  getFPS: () => {
    const { motion } = get();
    return motion?.fps || 30; // Default to 30 FPS
  },
}));

// Selector hooks for better performance
export const useModel = () => useSceneStore(state => state.model);
export const useMotion = () => useSceneStore(state => state.motion);
export const usePose = () => useSceneStore(state => state.pose);
export const useAudio = () => useSceneStore(state => state.audio);
export const useBackground = () => useSceneStore(state => state.background);
export const useCurrentFrame = () => useSceneStore(state => state.currentFrame);
export const useIsPlaying = () => useSceneStore(state => state.isPlaying);
export const useCameraMode = () => useSceneStore(state => state.cameraMode);
export const useShowFloorGrid = () => useSceneStore(state => state.showFloorGrid);
export const useShowUI = () => useSceneStore(state => state.showUI);
export const useLowExpressionMode = () => useSceneStore(state => state.lowExpressionMode);
