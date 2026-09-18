import React from 'react';
import { CameraMode } from '../types';
import {
  Play,
  Pause,
  StopCircle,
  Camera,
  Monitor,
  SkipBack,
  SkipForward,
} from 'lucide-react';

interface TimelineControllerProps {
  currentFrame: number;
  isPlaying: boolean;
  cameraMode: CameraMode;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onFrameChange: (frame: number) => void;
  onCameraModeChange: (mode: CameraMode) => void;
}

export const TimelineController: React.FC<TimelineControllerProps> = ({
  currentFrame,
  isPlaying,
  cameraMode,
  onPlay,
  onPause,
  onStop,
  onFrameChange,
  onCameraModeChange,
}) => {
  const [frameInput, setFrameInput] = React.useState(currentFrame.toString());
  const [totalFrames, setTotalFrames] = React.useState(1000); // Default, will be updated when motion loaded

  // Update frame input when currentFrame changes
  React.useEffect(() => {
    setFrameInput(currentFrame.toString());
  }, [currentFrame]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const frame = parseInt(e.target.value);
    setFrameInput(frame.toString());
    onFrameChange(frame);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFrameInput(e.target.value);
  };

  const handleInputBlur = () => {
    const frame = parseInt(frameInput);
    if (!isNaN(frame) && frame >= 0 && frame <= totalFrames) {
      onFrameChange(frame);
    } else {
      setFrameInput(currentFrame.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  const formatTime = (frame: number) => {
    const seconds = frame / 30; // Assuming 30 FPS
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds * 30) % 30);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-3 bg-dark-900/95 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        {/* Transport Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onStop}
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors text-dark-300 hover:text-white"
            title="Stop"
          >
            <StopCircle className="w-5 h-5" />
          </button>
          
          <button
            onClick={onPlay}
            disabled={isPlaying}
            className="p-2 rounded-lg hover:bg-dark-700 disabled:opacity-50 transition-colors text-dark-300 hover:text-white disabled:text-dark-500"
            title="Play"
          >
            <Play className="w-5 h-5" />
          </button>
          
          <button
            onClick={onPause}
            disabled={!isPlaying}
            className="p-2 rounded-lg hover:bg-dark-700 disabled:opacity-50 transition-colors text-dark-300 hover:text-white disabled:text-dark-500"
            title="Pause"
          >
            <Pause className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => onFrameChange(Math.max(0, currentFrame - 1))}
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors text-dark-300 hover:text-white"
            title="Previous Frame"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => onFrameChange(Math.min(totalFrames, currentFrame + 1))}
            className="p-2 rounded-lg hover:bg-dark-700 transition-colors text-dark-300 hover:text-white"
            title="Next Frame"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Frame Display */}
        <div className="flex items-center gap-3">
          <span className="text-dark-400 text-sm">
            {formatTime(currentFrame)}
          </span>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 flex items-center gap-3">
          <input
            type="range"
            min="0"
            max={totalFrames}
            value={currentFrame}
            onChange={handleSliderChange}
            className="flex-1 slider"
          />
          <input
            type="number"
            value={frameInput}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            min="0"
            max={totalFrames}
            className="w-20 input text-center text-sm"
          />
          <span className="text-dark-400 text-sm">
            / {totalFrames}
          </span>
        </div>

        {/* Camera Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCameraModeChange('orbit')}
            className={`p-2 rounded-lg transition-colors ${
              cameraMode === 'orbit'
                ? 'bg-primary-600/20 text-primary-400'
                : 'hover:bg-dark-700 text-dark-300 hover:text-white'
            }`}
            title="Orbit Camera"
          >
            <Monitor className="w-5 h-5" />
          </button>
          <button
            onClick={() => onCameraModeChange('vmd')}
            className={`p-2 rounded-lg transition-colors ${
              cameraMode === 'vmd'
                ? 'bg-primary-600/20 text-primary-400'
                : 'hover:bg-dark-700 text-dark-300 hover:text-white'
            }`}
            title="VMD Camera"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
