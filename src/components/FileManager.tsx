import React from 'react';
import { FileEntry } from '../types';
import { 
  File3D, 
  PlayCircle, 
  Camera, 
  Music, 
  Image,
  Trash2,
  Search,
  SortAsc,
  SortDesc,
} from 'lucide-react';

interface FileManagerProps {
  files: FileEntry[];
  onFileSelect: (file: FileEntry) => void;
  onFileDelete: (fileId: string) => void;
}

interface FileItemProps {
  file: FileEntry;
  onSelect: () => void;
  onDelete: () => void;
  isSelected: boolean;
}

const FileItem: React.FC<FileItemProps> = ({ file, onSelect, onDelete, isSelected }) => {
  const getFileIcon = () => {
    switch (file.type) {
      case 'model':
        return <File3D className="w-5 h-5 text-blue-400" />;
      case 'motion':
        return <PlayCircle className="w-5 h-5 text-green-400" />;
      case 'pose':
        return <Camera className="w-5 h-5 text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-orange-400" />;
      case 'background':
        return <Image className="w-5 h-5 text-cyan-400" />;
      default:
        return <File3D className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg border border-dark-700/50 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-primary-600/20 border-primary-500/50'
          : 'hover:bg-dark-800/50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getFileIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm truncate">{file.name}</p>
          <div className="flex items-center gap-3 text-dark-400 text-xs">
            <span>{formatFileSize(file.size)}</span>
            <span className="text-dark-500">{formatDate(file.lastModified)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg hover:bg-dark-700 transition-colors text-dark-400 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const FileManager: React.FC<FileManagerProps> = ({
  files,
  onFileSelect,
  onFileDelete,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'name' | 'date' | 'size'>('name');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);

  // Filter and sort files
  const filteredFiles = React.useMemo(() => {
    let result = [...files];

    // Filter by search query
    if (searchQuery) {
      result = result.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort files
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = a.lastModified - b.lastModified;
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [files, searchQuery, sortBy, sortDirection]);

  // Group files by type
  const filesByType = React.useMemo(() => {
    const groups: Record<string, FileEntry[]> = {
      models: [],
      motions: [],
      poses: [],
      audios: [],
      backgrounds: [],
      others: [],
    };

    filteredFiles.forEach(file => {
      if (file.type in groups) {
        groups[file.type].push(file);
      } else {
        groups.others.push(file);
      }
    });

    return groups;
  }, [filteredFiles]);

  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Handle file selection
  const handleFileSelect = (file: FileEntry) => {
    setSelectedFile(file.id);
    onFileSelect(file);
  };

  // Handle file deletion
  const handleFileDelete = (fileId: string) => {
    onFileDelete(fileId);
    if (selectedFile === fileId) {
      setSelectedFile(null);
    }
  };

  // Get type label
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      model: 'Models',
      motion: 'Motions',
      pose: 'Poses',
      audio: 'Audio',
      background: 'Backgrounds',
      others: 'Others',
    };
    return labels[type] || type;
  };

  return (
    <div className="absolute inset-0 bg-dark-900/95 backdrop-blur-sm z-40">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dark-700">
          <h3 className="text-white font-semibold text-lg">File Manager</h3>
          <p className="text-dark-400 text-sm">{files.length} files loaded</p>
        </div>

        {/* Search and Sort */}
        <div className="p-3 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
                className="bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="name">Name</option>
                <option value="date">Date</option>
                <option value="size">Size</option>
              </select>
              <button
                onClick={toggleSortDirection}
                className="p-2 rounded-lg hover:bg-dark-700 transition-colors text-dark-400 hover:text-white"
              >
                {sortDirection === 'asc' ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* File List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-3 space-y-4">
            {Object.entries(filesByType).map(([type, typeFiles]) => {
              if (typeFiles.length === 0) return null;

              return (
                <div key={type} className="space-y-2">
                  <h4 className="text-dark-400 text-xs font-medium uppercase tracking-wider px-1">
                    {getTypeLabel(type)} ({typeFiles.length})
                  </h4>
                  <div className="space-y-1">
                    {typeFiles.map(file => (
                      <FileItem
                        key={file.id}
                        file={file}
                        onSelect={() => handleFileSelect(file)}
                        onDelete={() => handleFileDelete(file.id)}
                        isSelected={selectedFile === file.id}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredFiles.length === 0 && (
              <div className="p-6 text-center text-dark-400 text-sm">
                No files found
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-dark-700">
          <button
            onClick={() => setSelectedFile(null)}
            className="w-full btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
