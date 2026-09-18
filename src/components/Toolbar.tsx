import React from 'react';
import { SceneState, UIState } from '../types';
import {
  Upload,
  Grid3X3,
  Eye,
  EyeOff,
  Cpu,
  Move3D,
  Rotate3D,
  Settings,
  Fullscreen,
  X,
} from 'lucide-react';

interface ToolbarProps {
  sceneState: SceneState;
  uiState: UIState;
  onStateChange: (updates: Partial<SceneState>) => void;
  onUIStateChange: (updates: Partial<UIState>) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  sceneState,
  uiState,
  onStateChange,
  onUIStateChange,
}) => {
  const [showSettings, setShowSettings] = React.useState(false);

  // Trigger file input
  const handleFileUploadClick = () => {
    const input = document.getElementById('file-input') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-10">
      <div className="flex items-center gap-2 bg-dark-900/90 backdrop-blur-sm rounded-lg border border-dark-700/50 p-2">
        {/* File Upload */}
        <button
          onClick={handleFileUploadClick}
          className="p-2 rounded-lg hover:bg-dark-700 transition-colors text-dark-300 hover:text-white"
          title="Upload Files (PMX, VMD, VPD, MP3, Images)"
        >
          <Upload className="w-5 h-5" />
        </button>

        {/* Floor Grid Toggle */}
        <button
          onClick={() => onStateChange({ showFloorGrid: !sceneState.showFloorGrid })}
          className={`p-2 rounded-lg transition-colors ${
            sceneState.showFloorGrid
              ? 'bg-primary-600/20 text-primary-400'
              : 'hover:bg-dark-700 text-dark-300 hover:text-white'
          }`}
          title={sceneState.showFloorGrid ? 'Hide Floor Grid' : 'Show Floor Grid'}
        >
          {sceneState.showFloorGrid ? (
            <Grid3X3 className="w-5 h-5" />
          ) : (
            <Grid3X3 className="w-5 h-5 opacity-50" />
          )}
        </button>

        {/* Low Expression Mode Toggle */}
        <button
          onClick={() => onStateChange({ lowExpressionMode: !sceneState.lowExpressionMode })}
          className={`p-2 rounded-lg transition-colors ${
            sceneState.lowExpressionMode
              ? 'bg-primary-600/20 text-primary-400'
              : 'hover:bg-dark-700 text-dark-300 hover:text-white'
          }`}
          title={sceneState.lowExpressionMode ? 'High Quality Mode' : 'Low Expression Mode (Better Performance)'}
        >
          <Cpu className="w-5 h-5" />
        </button>

        {/* Gizmo Mode Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUIStateChange({ gizmoMode: 'translate' })}
            className={`p-2 rounded-lg transition-colors ${
              uiState.gizmoMode === 'translate'
                ? 'bg-primary-600/20 text-primary-400'
                : 'hover:bg-dark-700 text-dark-300 hover:text-white'
            }`}
            title="Translate Mode"
          >
            <Move3D className="w-5 h-5" />
          </button>
          <button
            onClick={() => onUIStateChange({ gizmoMode: 'rotate' })}
            className={`p-2 rounded-lg transition-colors ${
              uiState.gizmoMode === 'rotate'
                ? 'bg-primary-600/20 text-primary-400'
                : 'hover:bg-dark-700 text-dark-300 hover:text-white'
            }`}
            title="Rotate Mode"
          >
            <Rotate3D className="w-5 h-5" />
          </button>
        </div>

        {/* Fullscreen Toggle */}
        <div className="flex-1" />
        
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg hover:bg-dark-700 transition-colors text-dark-300 hover:text-white"
          title="Toggle Fullscreen"
        >
          <Fullscreen className="w-5 h-5" />
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-dark-700 transition-colors text-dark-300 hover:text-white"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-dark-900 rounded-lg border border-dark-700 shadow-lg">
          <div className="p-4 border-b border-dark-700">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Settings
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-dark-300 text-sm">Show UI</span>
              <button
                onClick={() => onStateChange({ showUI: !sceneState.showUI })}
                className={`p-2 rounded-lg transition-colors ${
                  sceneState.showUI
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'hover:bg-dark-700 text-dark-300 hover:text-white'
                }`}
              >
                {sceneState.showUI ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-300 text-sm">Low Expression Mode</span>
              <button
                onClick={() => onStateChange({ lowExpressionMode: !sceneState.lowExpressionMode })}
                className={`p-2 rounded-lg transition-colors ${
                  sceneState.lowExpressionMode
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'hover:bg-dark-700 text-dark-300 hover:text-white'
                }`}
              >
                {sceneState.lowExpressionMode ? <Cpu className="w-4 h-4" /> : <Cpu className="w-4 h-4 opacity-50" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-dark-300 text-sm">Camera: {sceneState.cameraMode}</span>
              <span className="text-dark-400 text-xs">
                {sceneState.cameraMode === 'orbit' ? 'Orbit' : 'VMD'}
              </span>
            </div>
          </div>
          <div className="p-3 border-t border-dark-700">
            <button
              onClick={() => setShowSettings(false)}
              className="w-full btn btn-ghost flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
