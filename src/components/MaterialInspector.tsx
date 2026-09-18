import React from 'react';
import { PMXMaterial } from '../types';
import { Eye, EyeOff, Palette, Trash2 } from 'lucide-react';

interface MaterialInspectorProps {
  materials: PMXMaterial[];
  selectedMaterial?: string;
  onMaterialSelect: (materialId: string) => void;
  onOpacityChange: (materialId: string, opacity: number) => void;
}

export const MaterialInspector: React.FC<MaterialInspectorProps> = ({
  materials,
  selectedMaterial,
  onMaterialSelect,
  onOpacityChange,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter materials based on search query
  const filteredMaterials = React.useMemo(() => {
    return materials.filter(mat => 
      mat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [materials, searchQuery]);

  // Get selected material
  const selectedMat = React.useMemo(() => {
    return materials.find(m => m.id === selectedMaterial);
  }, [materials, selectedMaterial]);

  // Handle opacity change
  const handleOpacityChange = (materialId: string, opacity: number) => {
    onOpacityChange(materialId, opacity);
  };

  // Format color for display
  const formatColor = (color: [number, number, number, number] | undefined) => {
    if (!color) return '#FFFFFF';
    return `rgba(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255}, ${color[3]})`;
  };

  return (
    <div className="w-full max-w-md bg-dark-900 rounded-lg border border-dark-700">
      {/* Header */}
      <div className="p-3 border-b border-dark-700">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Materials
        </h3>
      </div>

      {/* Search */}
      <div className="p-3">
        <input
          type="text"
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input text-sm"
        />
      </div>

      {/* Material List */}
      <div className="max-h-64 overflow-y-auto scrollbar-thin">
        {filteredMaterials.length === 0 ? (
          <div className="p-4 text-center text-dark-400 text-sm">
            No materials found
          </div>
        ) : (
          filteredMaterials.map((material) => {
            const isSelected = selectedMaterial === material.id;
            const diffuseColor = formatColor(material.diffuseColor);

            return (
              <div
                key={material.id}
                onClick={() => onMaterialSelect(material.id)}
                className={`p-3 border-b border-dark-700/50 cursor-pointer transition-colors ${
                  isSelected ? 'bg-primary-600/10 border-l-4 border-primary-500' : 'hover:bg-dark-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: diffuseColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{material.name}</p>
                    <p className="text-dark-400 text-xs">
                      {material.flags.edge ? 'Edge' : ''}
                      {material.isDoubleSided ? ' | Double Sided' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-dark-400 text-xs">
                      {Math.round((material.diffuseColor?.[3] || 1) * 100)}%
                    </span>
                    {isSelected && (
                      <Eye className="w-4 h-4 text-primary-400" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Material Details (when selected) */}
      {selectedMat && (
        <div className="p-3 border-t border-dark-700">
          <h4 className="text-white font-medium mb-3">{selectedMat.name}</h4>
          
          <div className="space-y-4">
            {/* Opacity Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-dark-300 text-sm">Opacity</label>
                <span className="text-dark-400 text-xs">
                  {Math.round((selectedMat.diffuseColor?.[3] || 1) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={selectedMat.diffuseColor?.[3] || 1}
                onChange={(e) => {
                  const opacity = parseFloat(e.target.value);
                  handleOpacityChange(selectedMat.id, opacity);
                }}
                className="slider"
              />
            </div>

            {/* Color Display */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-dark-300 text-sm">Diffuse</label>
                <div
                  className="w-full h-12 rounded-lg"
                  style={{ backgroundColor: formatColor(selectedMat.diffuseColor) }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-dark-300 text-sm">Specular</label>
                <div
                  className="w-full h-12 rounded-lg"
                  style={{
                    backgroundColor: `rgb(${(selectedMat.specularColor[0] || 0.5) * 255}, ${(selectedMat.specularColor[1] || 0.5) * 255}, ${(selectedMat.specularColor[2] || 0.5) * 255})`
                  }}
                />
              </div>
            </div>

            {/* Material Properties */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-dark-700/50">
              <div className="space-y-1">
                <p className="text-dark-400 text-xs">Shininess</p>
                <p className="text-white text-sm">{selectedMat.shininess}</p>
              </div>
              <div className="space-y-1">
                <p className="text-dark-400 text-xs">Edge Size</p>
                <p className="text-white text-sm">{selectedMat.edgeSize}</p>
              </div>
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-dark-700/50">
              {selectedMat.flags.castShadow && (
                <span className="px-2 py-1 bg-dark-700 rounded text-dark-300 text-xs">
                  Cast Shadow
                </span>
              )}
              {selectedMat.flags.receiveShadow && (
                <span className="px-2 py-1 bg-dark-700 rounded text-dark-300 text-xs">
                  Receive Shadow
                </span>
              )}
              {selectedMat.flags.selfShadow && (
                <span className="px-2 py-1 bg-dark-700 rounded text-dark-300 text-xs">
                  Self Shadow
                </span>
              )}
              {selectedMat.flags.edge && (
                <span className="px-2 py-1 bg-dark-700 rounded text-dark-300 text-xs">
                  Edge
                </span>
              )}
              {selectedMat.isDoubleSided && (
                <span className="px-2 py-1 bg-dark-700 rounded text-dark-300 text-xs">
                  Double Sided
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {materials.length === 0 && (
        <div className="p-6 text-center text-dark-400 text-sm">
          <Palette className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No materials available</p>
          <p className="text-xs mt-1">Load a model to see its materials</p>
        </div>
      )}
    </div>
  );
};
