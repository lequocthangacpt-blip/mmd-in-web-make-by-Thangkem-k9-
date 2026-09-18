import * as BABYLON from '@babylonjs/core';
import { PMXModel, VMDMotion, VPDPose, FileEntry } from '../types';
import JSZip from 'jszip';

/**
 * MMD Loader class for loading PMX, VMD, and VPD files
 * Uses babylon-mmd library internally
 */
export class MMDLoader {
  private scene: BABYLON.Scene;
  private mmdPlugin: any;

  constructor(scene: BABYLON.Scene) {
    this.scene = scene;
    this.setupMMDPlugin();
  }

  /**
   * Setup babylon-mmd plugin
   */
  private setupMMDPlugin() {
    try {
      // Dynamic import of babylon-mmd
      // @ts-ignore - babylon-mmd doesn't have TypeScript types
      const mmd = window.MMD;
      if (mmd) {
        this.mmdPlugin = mmd;
        // Enable MMD plugin for the scene
        this.mmdPlugin(this.scene);
      } else {
        console.warn('babylon-mmd not loaded. PMX/VMD/VPD loading will fail.');
        // Fallback: try to load from CDN
        this.loadMMDFromCDN();
      }
    } catch (error) {
      console.error('Failed to setup MMD plugin:', error);
    }
  }

  /**
   * Load babylon-mmd from CDN if not available
   */
  private async loadMMDFromCDN() {
    try {
      await import('babylon-mmd');
      // @ts-ignore
      this.mmdPlugin = window.MMD;
      // @ts-ignore
      this.mmdPlugin(this.scene);
    } catch (error) {
      console.error('Failed to load babylon-mmd from CDN:', error);
    }
  }

  /**
   * Load PMX model from ArrayBuffer
   */
  async loadPMX(data: ArrayBuffer | Uint8Array, name: string = 'model'): Promise<PMXModel> {
    return new Promise(async (resolve, reject) => {
      try {
        // Ensure MMD plugin is loaded
        if (!this.mmdPlugin) {
          await this.loadMMDFromCDN();
          if (!this.mmdPlugin) {
            throw new Error('babylon-mmd plugin not available');
          }
        }

        // @ts-ignore - babylon-mmd API
        const mmdModel = await this.mmdPlugin.Model.loadPMX(
          data,
          name,
          this.scene,
          {
            // Options
            loadTextures: true,
            createPhysics: false,
          }
        );

        if (!mmdModel) {
          throw new Error('Failed to load PMX model');
        }

        // Convert to our PMXModel type
        const model: PMXModel = {
          id: this.generateId(),
          name,
          path: name,
          meshes: [],
          materials: [],
          morphs: [],
          bones: [],
        };

        // Extract meshes
        // @ts-ignore
        if (mmdModel.meshes) {
          // @ts-ignore
          model.meshes = mmdModel.meshes.map((mesh: any, index: number) => ({
            id: this.generateId(),
            name: mesh.name || `mesh_${index}`,
            vertices: mesh.getTotalVertices(),
            indices: mesh.getIndices()?.length || 0,
            materialIndex: mesh.materialIndex || 0,
          }));
        }

        // Extract materials
        // @ts-ignore
        if (mmdModel.materials) {
          // @ts-ignore
          model.materials = mmdModel.materials.map((mat: any, index: number) => ({
            id: this.generateId(),
            name: mat.name || `material_${index}`,
            diffuseColor: mat.diffuseColor?.asArray() || [1, 1, 1, 1],
            specularColor: mat.specularColor?.asArray() || [0.5, 0.5, 0.5],
            shininess: mat.shininess || 32,
            ambientColor: mat.ambientColor?.asArray() || [0.2, 0.2, 0.2],
            texturePath: mat.diffuseTexture?.name,
            sphereTexturePath: mat.sphereTexture?.name,
            toonTexturePath: mat.toonTexture?.name,
            isDoubleSided: mat.twoSided || false,
            edgeColor: mat.edgeColor?.asArray() || [0, 0, 0, 1],
            edgeSize: mat.edgeSize || 0,
            flags: {
              castShadow: mat.castShadow || true,
              receiveShadow: mat.receiveShadow || true,
              selfShadow: mat.selfShadow || false,
              edge: mat.edge || false,
            },
          }));
        }

        // Extract morphs
        // @ts-ignore
        if (mmdModel.morphs) {
          // @ts-ignore
          model.morphs = mmdModel.morphs.map((morph: any, index: number) => ({
            id: this.generateId(),
            name: morph.name || `morph_${index}`,
            type: this.mapMorphType(morph.type),
            vertices: morph.vertices || [],
            category: morph.category || '',
          }));
        }

        // Extract bones
        // @ts-ignore
        if (mmdModel.bones) {
          // @ts-ignore
          model.bones = mmdModel.bones.map((bone: any, index: number) => ({
            id: this.generateId(),
            name: bone.name || `bone_${index}`,
            position: bone.position?.asArray() || [0, 0, 0],
            parentIndex: bone.parentBoneIndex || -1,
            transformationOrder: bone.transformationOrder || 0,
            isRotatable: bone.rotatable || true,
            isMovable: bone.movable || true,
            isVisible: bone.visible || true,
            isManipulable: bone.manipulable || true,
          }));
        }

        resolve(model);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Load VMD motion file
   */
  async loadVMD(data: ArrayBuffer | Uint8Array, name: string = 'motion'): Promise<VMDMotion> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.mmdPlugin) {
          await this.loadMMDFromCDN();
          if (!this.mmdPlugin) {
            throw new Error('babylon-mmd plugin not available');
          }
        }

        // @ts-ignore - babylon-mmd API
        const vmdMotion = await this.mmdPlugin.Motion.loadVMD(
          data,
          name,
          this.scene
        );

        if (!vmdMotion) {
          throw new Error('Failed to load VMD motion');
        }

        // Convert to our VMDMotion type
        const motion: VMDMotion = {
          id: this.generateId(),
          name,
          path: name,
          frameCount: vmdMotion.frameCount || 0,
          fps: vmdMotion.fps || 30,
          boneFrames: [],
          morphFrames: [],
          cameraFrames: [],
          lightFrames: [],
          selfShadowFrames: [],
        };

        // Extract bone frames
        // @ts-ignore
        if (vmdMotion.boneFrames) {
          // @ts-ignore
          motion.boneFrames = vmdMotion.boneFrames.map((frame: any) => ({
            frame: frame.frame || 0,
            boneName: frame.boneName || '',
            position: frame.position?.asArray() || [0, 0, 0],
            rotation: frame.rotation?.asArray() || [0, 0, 0, 1],
            interpolation: frame.interpolation || [0, 0, 0, 0],
          }));
        }

        // Extract morph frames
        // @ts-ignore
        if (vmdMotion.morphFrames) {
          // @ts-ignore
          motion.morphFrames = vmdMotion.morphFrames.map((frame: any) => ({
            frame: frame.frame || 0,
            morphName: frame.morphName || '',
            weight: frame.weight || 0,
            interpolation: frame.interpolation || [0, 0, 0, 0],
          }));
        }

        // Extract camera frames
        // @ts-ignore
        if (vmdMotion.cameraFrames) {
          // @ts-ignore
          motion.cameraFrames = vmdMotion.cameraFrames.map((frame: any) => ({
            frame: frame.frame || 0,
            position: frame.position?.asArray() || [0, 0, 0],
            rotation: frame.rotation?.asArray() || [0, 0, 0],
            fov: frame.fov || 30,
            distance: frame.distance || 0,
            perspective: frame.perspective || true,
            interpolation: frame.interpolation || [0, 0, 0, 0],
          }));
        }

        resolve(motion);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Load VPD pose file
   */
  async loadVPD(data: ArrayBuffer | Uint8Array, name: string = 'pose'): Promise<VPDPose> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.mmdPlugin) {
          await this.loadMMDFromCDN();
          if (!this.mmdPlugin) {
            throw new Error('babylon-mmd plugin not available');
          }
        }

        // @ts-ignore - babylon-mmd API
        const vpdPose = await this.mmdPlugin.Pose.loadVPD(
          data,
          name,
          this.scene
        );

        if (!vpdPose) {
          throw new Error('Failed to load VPD pose');
        }

        // Convert to our VPDPose type
        const pose: VPDPose = {
          id: this.generateId(),
          name,
          path: name,
          bonePoses: [],
          morphPoses: [],
        };

        // Extract bone poses
        // @ts-ignore
        if (vpdPose.bonePoses) {
          // @ts-ignore
          pose.bonePoses = vpdPose.bonePoses.map((bonePose: any) => ({
            boneName: bonePose.boneName || '',
            position: bonePose.position?.asArray() || [0, 0, 0],
            rotation: bonePose.rotation?.asArray() || [0, 0, 0, 1],
          }));
        }

        // Extract morph poses
        // @ts-ignore
        if (vpdPose.morphPoses) {
          // @ts-ignore
          pose.morphPoses = vpdPose.morphPoses.map((morphPose: any) => ({
            morphName: morphPose.morphName || '',
            weight: morphPose.weight || 0,
          }));
        }

        resolve(pose);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Extract ZIP archive containing PMX and textures
   */
  async extractZIP(file: File, onProgress?: (progress: number, message: string) => void): Promise<FileEntry> {
    return new Promise(async (resolve, reject) => {
      try {
        onProgress?.(0, 'Reading ZIP file...');

        const zip = await JSZip.loadAsync(file);
        onProgress?.(10, 'Extracting files...');

        let pmxFile: JSZip.JSZipObject | null = null;
        const textureFiles: JSZip.JSZipObject[] = [];
        const otherFiles: JSZip.JSZipObject[] = [];

        // Find PMX file and textures
        const files = Object.values(zip.files);
        for (const zipFile of files) {
          const name = zipFile.name.toLowerCase();
          if (name.endsWith('.pmx') || name.endsWith('.bpmx')) {
            pmxFile = zipFile;
          } else if (name.match(/\.(png|jpg|jpeg|bmp|tga)$/i)) {
            textureFiles.push(zipFile);
          } else {
            otherFiles.push(zipFile);
          }
        }

        if (!pmxFile) {
          throw new Error('No PMX file found in ZIP archive');
        }

        onProgress?.(30, 'Extracting PMX model...');
        const pmxData = await pmxFile.async('arraybuffer');

        // Create file entry
        const entry: FileEntry = {
          id: this.generateId(),
          name: file.name,
          type: 'model',
          size: file.size,
          lastModified: file.lastModified,
          data: pmxData,
        };

        // Store textures in IndexedDB or create URLs
        onProgress?.(60, 'Processing textures...');
        const texturePromises = textureFiles.map(async (textureFile, index) => {
          const textureData = await textureFile.async('blob');
          const textureUrl = URL.createObjectURL(textureData);
          // Store in entry for later use
          if (!entry.data) entry.data = pmxData;
          // @ts-ignore - Store textures metadata
          if (!entry.textures) entry.textures = [];
          // @ts-ignore
          entry.textures.push({
            name: textureFile.name,
            url: textureUrl,
            data: textureData,
          });
        });

        await Promise.all(texturePromises);
        onProgress?.(100, 'ZIP extraction complete!');

        resolve(entry);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Map MMD morph type to our type
   */
  private mapMorphType(type: number | string): 'vertex' | 'uv' | 'bone' | 'material' | 'group' {
    if (typeof type === 'number') {
      const typeMap: Record<number, 'vertex' | 'uv' | 'bone' | 'material' | 'group'> = {
        0: 'vertex',
        1: 'uv',
        2: 'bone',
        3: 'material',
        4: 'group',
      };
      return typeMap[type] || 'vertex';
    }
    return type as 'vertex' | 'uv' | 'bone' | 'material' | 'group';
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `mmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Dispose resources
   */
  dispose() {
    // Cleanup if needed
  }
}

/**
 * Standalone function to create MMD loader
 */
export const createMMDLoader = (scene: BABYLON.Scene): MMDLoader => {
  return new MMDLoader(scene);
};

/**
 * Get file type from extension
 */
export const getFileTypeFromExtension = (filename: string): 'model' | 'motion' | 'pose' | 'audio' | 'background' | 'unknown' => {
  const ext = filename.toLowerCase().match(/\.([a-z0-9]+)$/i)?.[0] || '';
  const typeMap: Record<string, 'model' | 'motion' | 'pose' | 'audio' | 'background' | 'unknown'> = {
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
  return typeMap[ext] || 'unknown';
};
