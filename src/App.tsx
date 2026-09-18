import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SceneState, CameraMode, UIState, LoaderState, FileEntry } from './types';
import { BabylonScene } from './components/BabylonScene';
import { Sidebar } from './components/Sidebar';
import { TimelineController } from './components/TimelineController';
import { MaterialInspector } from './components/MaterialInspector';
import { Toolbar } from './components/Toolbar';
import { FileManager } from './components/FileManager';
import { useMMDLoader } from './hooks/useMMDLoader';
import { useDatabase } from './hooks/useDatabase';
import { useSceneStore } from './store/sceneStore';

const App: React.FC = () => {
  const [sceneState, setSceneState] = useState<SceneState>({
    currentFrame: 0,
    isPlaying: false,
    cameraMode: 'orbit',
    showFloorGrid: true,
    showUI: true,
    lowExpressionMode: false,
  });

  const [uiState, setUIState] = useState<UIState>({
    selectedTab: 'files',
    gizmoMode: 'translate',
    gizmoAxis: 'xyz',
    isFullscreen: false,
  });

  const [loaderState, setLoaderState] = useState<LoaderState>({
    isLoading: false,
    progress: 0,
    message: '',
    errors: [],
  });

  const [files, setFiles] = useState<FileEntry[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);

  const { db, initDB, getAllFiles, clearDatabase, getStats } = useDatabase();
  const { loadPMX, loadVMD, loadVPD, loadAudio, loadBackground, extractZIP } = useMMDLoader({ db });

  // Initialize database on mount
  useEffect(() => {
    const initialize = async () => {
      await initDB();
      const savedFiles = await getAllFiles();
      setFiles(savedFiles);
    };
    initialize();
  }, [initDB, getAllFiles]);

  // Handle double-click/tap to toggle UI
  useEffect(() => {
    const handleDoubleClick = (e: MouseEvent) => {
      if (e.target === canvasRef.current || e.target === document.body) {
        setSceneState(prev => ({ ...prev, showUI: !prev.showUI }));
      }
    };

    const handleDoubleTap = (e: TouchEvent) => {
      if (e.touches.length === 1 && (e.target === canvasRef.current || e.target === document.body)) {
        const now = Date.now();
        const lastTap = (window as any).lastTapTime || 0;
        if (now - lastTap < 300) {
          setSceneState(prev => ({ ...prev, showUI: !prev.showUI }));
          (window as any).lastTapTime = 0;
        } else {
          (window as any).lastTapTime = now;
        }
      }
    };

    document.addEventListener('dblclick', handleDoubleClick);
    document.addEventListener('touchend', handleDoubleTap);

    return () => {
      document.removeEventListener('dblclick', handleDoubleClick);
      document.removeEventListener('touchend', handleDoubleTap);
    };
  }, []);

  // Handle file drop
  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const items = e.dataTransfer.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          await processFile(file);
        }
      }
    }
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      for (const file of Array.from(e.target.files)) {
        await processFile(file);
      }
    }
    e.target.value = '';
  }, []);

  const processFile = async (file: File) => {
    setLoaderState({ isLoading: true, progress: 0, message: `Processing ${file.name}...`, errors: [] });
    
    try {
      const fileType = getFileType(file.name);
      let entry: FileEntry;

      switch (fileType) {
        case 'model':
          if (file.name.endsWith('.zip')) {
            entry = await extractZIP(file, setLoaderState);
          } else {
            entry = await loadPMX(file, setLoaderState);
          }
          break;
        case 'motion':
          entry = await loadVMD(file, setLoaderState);
          break;
        case 'pose':
          entry = await loadVPD(file, setLoaderState);
          break;
        case 'audio':
          entry = await loadAudio(file, setLoaderState);
          break;
        case 'background':
          entry = await loadBackground(file, setLoaderState);
          break;
        default:
          throw new Error(`Unsupported file type: ${file.name}`);
      }

      setFiles(prev => [...prev, entry]);
      setLoaderState({ isLoading: false, progress: 100, message: 'File loaded successfully!', errors: [] });
    } catch (error) {
      setLoaderState(prev => ({
        ...prev,
        isLoading: false,
        errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error'],
      }));
    }
  };

  const getFileType = (filename: string): FileType => {
    const ext = filename.toLowerCase().match(/\.([a-z0-9]+)$/i)?.[0] || '';
    const typeMap: Record<string, FileType> = {
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
    return typeMap[ext.toLowerCase()] || 'unknown';
  };

  // Handle scene events
  const handleSceneEvent = useCallback((event: { type: string; payload?: any }) => {
    switch (event.type) {
      case 'frame_change':
        setSceneState(prev => ({ ...prev, currentFrame: event.payload }));
        break;
      case 'play':
        setSceneState(prev => ({ ...prev, isPlaying: true }));
        break;
      case 'pause':
        setSceneState(prev => ({ ...prev, isPlaying: false }));
        break;
      case 'stop':
        setSceneState(prev => ({ ...prev, isPlaying: false, currentFrame: 0 }));
        break;
      case 'camera_mode_change':
        setSceneState(prev => ({ ...prev, cameraMode: event.payload }));
        break;
    }
  }, []);

  // Handle UI state changes
  const handleUIStateChange = useCallback((updates: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle scene state changes
  const handleSceneStateChange = useCallback((updates: Partial<SceneState>) => {
    setSceneState(prev => ({ ...prev, ...updates }));
  }, []);

  // Handle file selection from library
  const handleFileSelectFromLibrary = useCallback((file: FileEntry) => {
    // Logic to load file into scene
    console.log('Selected file:', file);
    // TODO: Implement file loading into scene
  }, []);

  // Handle clear database
  const handleClearDatabase = useCallback(async () => {
    await clearDatabase();
    setFiles([]);
    setSceneState({
      currentFrame: 0,
      isPlaying: false,
      cameraMode: 'orbit',
      showFloorGrid: true,
      showUI: true,
      lowExpressionMode: false,
    });
  }, [clearDatabase]);

  return (
    <div className="w-full h-screen flex flex-col bg-dark-1000">
      {/* Loading Overlay */}
      {loaderState.isLoading && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 border border-dark-600">
            <h3 className="text-white font-semibold mb-2">Loading...</h3>
            <p className="text-dark-300 text-sm mb-4">{loaderState.message}</p>
            <div className="w-full bg-dark-700 rounded-full h-2">
              <div 
                className="bg-primary-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${loaderState.progress}%` }}
              />
            </div>
            {loaderState.errors.length > 0 && (
              <div className="mt-4 text-red-500 text-sm">
                {loaderState.errors.map((err, idx) => (
                  <p key={idx}>{err}</p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sceneState.showUI && (
          <div className="w-64 bg-dark-900 border-r border-dark-700 flex flex-col">
            <Sidebar 
              files={files}
              selectedTab={uiState.selectedTab}
              onTabChange={(tab) => handleUIStateChange({ selectedTab: tab })}
              onFileSelect={handleFileSelectFromLibrary}
              onClearDatabase={handleClearDatabase}
            />
          </div>
        )}

        {/* Main Canvas Area */}
        <div 
          className={`flex-1 relative ${sceneState.showUI ? '' : 'w-full h-full'}`}
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Toolbar */}
          {sceneState.showUI && (
            <Toolbar 
              sceneState={sceneState}
              uiState={uiState}
              onStateChange={handleSceneStateChange}
              onUIStateChange={handleUIStateChange}
            />
          )}

          {/* Babylon.js Canvas */}
          <canvas
            ref={canvasRef}
            id="babylon-canvas"
            className="w-full h-full"
          />

          {/* Timeline Controller */}
          {sceneState.showUI && (
            <div className="absolute bottom-0 left-0 right-0 bg-dark-900/90 backdrop-blur-sm border-t border-dark-700/50">
              <TimelineController
                currentFrame={sceneState.currentFrame}
                isPlaying={sceneState.isPlaying}
                cameraMode={sceneState.cameraMode}
                onPlay={() => handleSceneStateChange({ isPlaying: true })}
                onPause={() => handleSceneStateChange({ isPlaying: false })}
                onStop={() => handleSceneStateChange({ isPlaying: false, currentFrame: 0 })}
                onFrameChange={(frame) => handleSceneStateChange({ currentFrame: frame })}
                onCameraModeChange={(mode) => handleSceneStateChange({ cameraMode: mode })}
              />
            </div>
          )}

          {/* Material Inspector */}
          {sceneState.showUI && uiState.selectedTab === 'materials' && (
            <div className="absolute top-16 right-4 w-80 bg-dark-900/90 backdrop-blur-sm rounded-lg border border-dark-700/50">
              <MaterialInspector
                materials={[]} // TODO: Pass actual materials from scene
                selectedMaterial={uiState.selectedMaterial}
                onMaterialSelect={(materialId) => handleUIStateChange({ selectedMaterial: materialId })}
                onOpacityChange={(materialId, opacity) => {
                  // TODO: Update material opacity in scene
                }}
              />
            </div>
          )}

          {/* File Input (Hidden) */}
          <input
            type="file"
            multiple
            accept=".pmx,.bpmx,.zip,.vmd,.vpd,.mp3,.wav,.ogg,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
        </div>
      </div>

      {/* File Manager Modal */}
      {sceneState.showUI && uiState.selectedTab === 'files' && (
        <FileManager
          files={files}
          onFileSelect={handleFileSelectFromLibrary}
          onFileDelete={(fileId) => {
            // TODO: Implement file deletion
          }}
        />
      )}

      {/* Babylon.js Scene Component */}
      <BabylonScene
        canvasRef={canvasRef}
        sceneState={sceneState}
        uiState={uiState}
        files={files}
        onEvent={handleSceneEvent}
      />
    </div>
  );
};

export default App;
