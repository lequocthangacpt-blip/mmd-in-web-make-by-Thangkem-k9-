import React from 'react';
import { FileEntry } from '../types';
import { 
  Folder, 
  File3D, 
  PlayCircle, 
  Image, 
  Music, 
  Camera, 
  Database, 
  X 
} from 'lucide-react';

interface SidebarProps {
  files: FileEntry[];
  selectedTab: string;
  onTabChange: (tab: string) => void;
  onFileSelect: (file: FileEntry) => void;
  onClearDatabase: () => void;
}

const TABS = [
  { id: 'files', label: 'Files', icon: Folder },
  { id: 'models', label: 'Models', icon: File3D },
  { id: 'motions', label: 'Motions', icon: PlayCircle },
  { id: 'poses', label: 'Poses', icon: Camera },
  { id: 'materials', label: 'Materials', icon: Image },
  { id: 'audio', label: 'Audio', icon: Music },
];

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  selectedTab,
  onTabChange,
  onFileSelect,
  onClearDatabase,
}) => {
  const [showConfirmClear, setShowConfirmClear] = React.useState(false);

  // Count files by type
  const counts = React.useMemo(() => {
    return {
      models: files.filter(f => f.type === 'model').length,
      motions: files.filter(f => f.type === 'motion').length,
      poses: files.filter(f => f.type === 'pose').length,
      audio: files.filter(f => f.type === 'audio').length,
      backgrounds: files.filter(f => f.type === 'background').length,
      total: files.length,
    };
  }, [files]);

  return (
    <div className="h-full flex flex-col bg-dark-900 border-r border-dark-700">
      {/* Logo / Header */}
      <div className="p-4 border-b border-dark-700">
        <h2 className="text-white font-bold text-lg text-gradient">
          MMD Studio
        </h2>
        <p className="text-dark-400 text-xs">Web 3D Viewer</p>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 p-2 overflow-y-auto scrollbar-thin">
        <div className="space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const count = counts[tab.id as keyof typeof counts] || 0;
            const isSelected = selectedTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  isSelected
                    ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1 text-left">{tab.label}</span>
                {count > 0 && (
                  <span className="text-xs bg-dark-700 px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Database Management */}
      <div className="p-2 border-t border-dark-700">
        <button
          onClick={() => setShowConfirmClear(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-dark-300 hover:bg-dark-800 hover:text-red-400 transition-all duration-200"
        >
          <Database className="w-5 h-5" />
          <span className="flex-1 text-left">Clear Database</span>
        </button>
      </div>

      {/* Confirm Clear Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 border border-dark-600 max-w-sm w-full mx-4">
            <h3 className="text-white font-semibold mb-2">Clear Database</h3>
            <p className="text-dark-300 text-sm mb-4">
              Are you sure you want to clear all cached files? This action cannot be undone.
            </p>
            <p className="text-dark-400 text-xs mb-6">
              {counts.total} files will be removed
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="btn btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearDatabase();
                  setShowConfirmClear(false);
                }}
                className="btn btn-danger px-4 py-2"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
