import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import * as BABYLON from '@babylonjs/core';
import { SceneState, UIState, FileEntry, PMXModel } from '../types';
import { MMDLoader } from '../lib/mmdLoader';

interface BabylonSceneProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  sceneState: SceneState;
  uiState: UIState;
  files: FileEntry[];
  onEvent: (event: { type: string; payload?: any }) => void;
}

export const BabylonScene: React.FC<BabylonSceneProps> = ({ 
  canvasRef, 
  sceneState, 
  uiState, 
  files,
  onEvent 
}) => {
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const cameraRef = useRef<BABYLON.ArcRotateCamera | null>(null);
  const modelRef = useRef<BABYLON.AbstractMesh | null>(null);
  const mmdHelperRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Babylon.js engine and scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Create engine
    const engine = new BABYLON.Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      disableWebGL2Support: false,
    });
    engineRef.current = engine;

    // Create scene
    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;
    scene.clearColor = new BABYLON.Color4(0.09, 0.13, 0.25, 1.0);
    scene.ambientColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    // Setup environment
    setupEnvironment(scene);

    // Setup camera
    setupCamera(scene, canvas);

    // Setup lights
    setupLights(scene);

    // Setup floor grid
    setupFloorGrid(scene, sceneState.showFloorGrid);

    // Handle resize
    const handleResize = () => {
      if (engine) {
        engine.resize();
      }
    };

    window.addEventListener('resize', handleResize);

    // Animation loop
    engine.runRenderLoop(() => {
      if (scene && cameraRef.current) {
        scene.render();
      }
    });

    setIsInitialized(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stopRenderLoop();
      engine.dispose();
    };
  }, [canvasRef]);

  // Setup environment
  const setupEnvironment = (scene: BABYLON.Scene) => {
    // Skybox (optional gradient background)
    const skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: 1000 }, scene);
    const skyboxMaterial = new BABYLON.StandardMaterial('skyboxMat', scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.disableLighting = true;
    skyboxMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.2);
    skybox.material = skyboxMaterial;
    skybox.isPickable = false;
    skybox.infiniteDistance = true;

    // Fog
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    scene.fogColor = new BABYLON.Color3(0.1, 0.1, 0.2);
    scene.fogDensity = 0.001;
  };

  // Setup camera
  const setupCamera = (scene: BABYLON.Scene, canvas: HTMLCanvasElement) => {
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      -Math.PI / 2,
      Math.PI / 2,
      5,
      BABYLON.Vector3.Zero(),
      scene
    );
    cameraRef.current = camera;
    camera.attachControl(canvas, true);
    camera.minZ = 0.1;
    camera.maxZ = 1000;
    camera.wheelPrecision = 50;
    camera.panSensibility = 100;
    camera.rotationSensibility = 100;
    camera.lowerRadiusLimit = 1;
    camera.upperRadiusLimit = 100;
    
    // Touch controls for mobile
    camera.touchAngularSensibility = 10000;
    camera.touchMoveSensibility = 1000;
  };

  // Setup lights
  const setupLights = (scene: BABYLON.Scene) => {
    // Directional light (main)
    const dirLight = new BABYLON.DirectionalLight(
      'dirLight',
      new BABYLON.Vector3(0.5, -1, 0.5),
      scene
    );
    dirLight.intensity = 0.8;
    dirLight.shadowEnabled = true;
    dirLight.shadowMinZ = 0.1;
    dirLight.shadowMaxZ = 50;

    // Hemispheric light (ambient)
    const hemiLight = new BABYLON.HemisphericLight(
      'hemiLight',
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    hemiLight.intensity = 0.3;
    hemiLight.diffuse = new BABYLON.Color3(0.8, 0.8, 1);
    hemiLight.groundColor = new BABYLON.Color3(0.2, 0.2, 0.3);

    // Point light (fill)
    const pointLight = new BABYLON.PointLight(
      'pointLight',
      new BABYLON.Vector3(-2, 2, -2),
      scene
    );
    pointLight.intensity = 0.5;
  };

  // Setup floor grid
  const setupFloorGrid = (scene: BABYLON.Scene, visible: boolean) => {
    const gridSize = 100;
    const gridDivisions = 100;

    const gridMaterial = new BABYLON.GridMaterial('gridMaterial', scene);
    gridMaterial.gridRatio = 1;
    gridMaterial.majorUnitFrequency = 10;
    gridMaterial.minorUnitVisibility = 0.5;
    gridMaterial.lineColor = new BABYLON.Color3(0.5, 0.5, 0.6);
    gridMaterial.majorLineColor = new BABYLON.Color3(0.7, 0.7, 0.8);
    gridMaterial.opacity = 0.5;
    gridMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;

    const ground = BABYLON.MeshBuilder.CreateGround(
      'ground',
      { width: gridSize, height: gridSize, subdivisions: gridDivisions },
      scene
    );
    ground.material = gridMaterial;
    ground.isPickable = false;
    ground.receiveShadows = true;
    ground.visibility = visible ? 1 : 0;

    // Store ground reference for toggle
    (ground as any)._isFloorGrid = true;
  };

  // Load PMX model
  const loadModel = useEffect(() => {
    if (!isInitialized || !sceneRef.current || !files.length) return;

    const modelFile = files.find(f => f.type === 'model');
    if (!modelFile || !modelFile.data) return;

    const loadModelAsync = async () => {
      try {
        const scene = sceneRef.current!;
        
        // Clear existing model
        if (modelRef.current) {
          modelRef.current.dispose();
          modelRef.current = null;
        }

        // Use babylon-mmd to load PMX
        const mmdLoader = new MMDLoader(scene);
        
        const modelData = new Uint8Array(modelFile.data);
        const result = await mmdLoader.loadPMX(modelData, modelFile.name);
        
        if (result.meshes && result.meshes.length > 0) {
          modelRef.current = result.meshes[0];
          
          // Center camera on model
          if (cameraRef.current) {
            const boundingInfo = result.meshes[0].getBoundingInfo();
            const center = boundingInfo?.boundingBox?.center || BABYLON.Vector3.Zero();
            const size = boundingInfo?.boundingBox?.extendSize || new BABYLON.Vector3(1, 1, 1);
            const radius = size.length() * 2;
            
            cameraRef.current.setTarget(center);
            cameraRef.current.radius = Math.max(radius, 5);
          }
          
          onEvent({ type: 'model_loaded', payload: result });
        }
      } catch (error) {
        console.error('Failed to load model:', error);
      }
    };

    loadModelAsync();
  }, [isInitialized, files, onEvent]);

  // Handle camera mode changes
  useEffect(() => {
    if (!cameraRef.current) return;

    const camera = cameraRef.current;
    
    if (sceneState.cameraMode === 'orbit') {
      camera.attachControl(canvasRef.current!, true);
    } else {
      camera.detachControl();
      // TODO: Switch to VMD camera
    }
  }, [sceneState.cameraMode]);

  // Handle floor grid visibility
  useEffect(() => {
    if (!sceneRef.current) return;

    const scene = sceneRef.current;
    const ground = scene.getMeshByName('ground');
    if (ground && (ground as any)._isFloorGrid) {
      ground.visibility = sceneState.showFloorGrid ? 1 : 0;
    }
  }, [sceneState.showFloorGrid]);

  // Handle audio playback
  useEffect(() => {
    const audioFile = files.find(f => f.type === 'audio' && f.url);
    if (!audioFile) return;

    audioRef.current = new Audio(audioFile.url);
    const audio = audioRef.current;

    const handlePlay = () => {
      if (sceneState.isPlaying) {
        audio.currentTime = sceneState.currentFrame / 30; // Assuming 30 FPS
        audio.play().catch(e => console.error('Audio play failed:', e));
      } else {
        audio.pause();
      }
    };

    const handleFrameChange = () => {
      if (sceneState.isPlaying) {
        audio.currentTime = sceneState.currentFrame / 30;
      }
    };

    sceneState.isPlaying ? audio.play().catch(() => {}) : audio.pause();

    return () => {
      audio.pause();
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handleFrameChange);
    };
  }, [files, sceneState.isPlaying, sceneState.currentFrame]);

  // Handle background
  useEffect(() => {
    const bgFile = files.find(f => f.type === 'background' && f.url);
    if (!bgFile || !sceneRef.current) return;

    const scene = sceneRef.current;
    
    // Create background texture
    const texture = new BABYLON.Texture(bgFile.url, scene, true, false);
    const skybox = scene.getMeshByName('skybox');
    if (skybox) {
      const mat = skybox.material as BABYLON.StandardMaterial;
      mat.diffuseTexture = texture;
      mat.emissiveTexture = texture;
      mat.disableLighting = true;
    }
  }, [files]);

  return null;
};

export default BabylonScene;
