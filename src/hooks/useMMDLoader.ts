import { useState, useCallback } from 'react';
import { FileEntry, FileType, LoaderState } from '../types';
import JSZip from 'jszip';
import Dexie from 'dexie';

interface UseMMDLoaderProps {
  db?: Dexie;
}

interface UseMMDLoaderResult {
  loadPMX: (file: File, onProgress?: (progress: number, message: string) => void) => Promise<FileEntry>;
  loadVMD: (file: File, onProgress?: (progress: number, message: string) => void) => Promise<FileEntry>;
  loadVPD: (file: File, onProgress?: (progress: number, message: string) => void) => Promise<FileEntry>;
  loadAudio: (file: File, onProgress?: (progress: number, message: string) => void) => Promise<FileEntry>;
  loadBackground: (file: File, onProgress?: (progress: number, message: string) => void) => Promise<FileEntry>;
  extractZIP: (file: File, onProgress?: (progress: number, message: string) => void) => Promise<FileEntry>;
}

export const useMMDLoader = ({ db }: UseMMDLoaderProps): UseMMDLoaderResult => {
  const [loaderState, setLoaderState] = useState<LoaderState>({
    isLoading: false,
    progress: 0,
    message: '',
    errors: [],
  });

  /**
   * Load PMX file
   */
  const loadPMX = useCallback(async (
    file: File,
    onProgress?: (progress: number, message: string) => void
  ): Promise<FileEntry> => {
    return new Promise(async (resolve, reject) => {
      try {
        onProgress?.(0, `Loading PMX: ${file.name}`);

        // Read file as ArrayBuffer
        const data = await file.arrayBuffer();
        onProgress?.(50, 'Parsing PMX data...');

        // Create file entry
        const entry: FileEntry = {
          id: generateId(),
          name: file.name,
          type: 'model',
          size: file.size,
          lastModified: file.lastModified,
          data,
        };

        // Store in database if available
        if (db) {
          await storeFile(db, entry);
        }

        // Create object URL for immediate use
        entry.url = URL.createObjectURL(file);

        onProgress?.(100, 'PMX loaded successfully!');
        resolve(entry);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onProgress?.(0, `Error: ${errorMessage}`);
        reject(error);
      }
    });
  }, [db]);

  /**
   * Load VMD file
   */
  const loadVMD = useCallback(async (
    file: File,
    onProgress?: (progress: number, message: string) => void
  ): Promise<FileEntry> => {
    return new Promise(async (resolve, reject) => {
      try {
        onProgress?.(0, `Loading VMD: ${file.name}`);

        const data = await file.arrayBuffer();
        onProgress?.(50, 'Parsing VMD data...');

        const entry: FileEntry = {
          id: generateId(),
          name: file.name,
          type: 'motion',
          size: file.size,
          lastModified: file.lastModified,
          data,
          url: URL.createObjectURL(file),
        };

        if (db) {
          await storeFile(db, entry);
        }

        onProgress?.(100, 'VMD loaded successfully!');
        resolve(entry);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onProgress?.(0, `Error: ${errorMessage}`);
        reject(error);
      }
    });
  }, [db]);

  /**
   * Load VPD file
   */
  const loadVPD = useCallback(async (
    file: File,
    onProgress?: (progress: number, message: string) => void
  ): Promise<FileEntry> => {
    return new Promise(async (resolve, reject) => {
      try {
        onProgress?.(0, `Loading VPD: ${file.name}`);

        const data = await file.arrayBuffer();
        onProgress?.(50, 'Parsing VPD data...');

        const entry: FileEntry = {
          id: generateId(),
          name: file.name,
          type: 'pose',
          size: file.size,
          lastModified: file.lastModified,
          data,
          url: URL.createObjectURL(file),
        };

        if (db) {
          await storeFile(db, entry);
        }

        onProgress?.(100, 'VPD loaded successfully!');
        resolve(entry);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onProgress?.(0, `Error: ${errorMessage}`);
        reject(error);
      }
    });
  }, [db]);

  /**
   * Load audio file
   */
  const loadAudio = useCallback(async (
    file: File,
    onProgress?: (progress: number, message: string) => void
  ): Promise<FileEntry> => {
    return new Promise(async (resolve, reject) => {
      try {
        onProgress?.(0, `Loading audio: ${file.name}`);

        const url = URL.createObjectURL(file);
        
        // Create audio element to get duration
        const audio = new Audio(url);
        await new Promise((res) => {
          audio.addEventListener('loadedmetadata', res);
          audio.addEventListener('error', reject);
        });

        const entry: FileEntry = {
          id: generateId(),
          name: file.name,
          type: 'audio',
          size: file.size,
          lastModified: file.lastModified,
          url,
        };

        if (db) {
          await storeFile(db, entry);
        }

        onProgress?.(100, 'Audio loaded successfully!');
        resolve(entry);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onProgress?.(0, `Error: ${errorMessage}`);
        reject(error);
      }
    });
  }, [db]);

  /**
   * Load background image
   */
  const loadBackground = useCallback(async (
    file: File,
    onProgress?: (progress: number, message: string) => void
  ): Promise<FileEntry> => {
    return new Promise(async (resolve, reject) => {
      try {
        onProgress?.(0, `Loading background: ${file.name}`);

        const url = URL.createObjectURL(file);
        
        // Validate image
        await new Promise((res, rej) => {
          const img = new Image();
          img.onload = res;
          img.onerror = rej;
          img.src = url;
        });

        const entry: FileEntry = {
          id: generateId(),
          name: file.name,
          type: 'background',
          size: file.size,
          lastModified: file.lastModified,
          url,
        };

        if (db) {
          await storeFile(db, entry);
        }

        onProgress?.(100, 'Background loaded successfully!');
        resolve(entry);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onProgress?.(0, `Error: ${errorMessage}`);
        reject(error);
      }
    });
  }, [db]);

  /**
   * Extract ZIP archive
   */
  const extractZIP = useCallback(async (
    file: File,
    onProgress?: (progress: number, message: string) => void
  ): Promise<FileEntry> => {
    return new Promise(async (resolve, reject) => {
      try {
        onProgress?.(0, `Extracting ZIP: ${file.name}`);

        const zip = await JSZip.loadAsync(file);
        onProgress?.(10, 'Reading ZIP contents...');

        let pmxFile: JSZip.JSZipObject | null = null;
        const textureFiles: JSZip.JSZipObject[] = [];
        const otherFiles: JSZip.JSZipObject[] = [];

        // Find files in ZIP
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

        onProgress?.(30, 'Extracting PMX file...');
        const pmxData = await pmxFile.async('arraybuffer');

        // Create main entry
        const entry: FileEntry = {
          id: generateId(),
          name: file.name,
          type: 'model',
          size: file.size,
          lastModified: file.lastModified,
          data: pmxData,
          url: URL.createObjectURL(file),
        };

        // Extract and store textures
        onProgress?.(50, `Extracting ${textureFiles.length} textures...`);
        const textureEntries = await Promise.all(
          textureFiles.map(async (textureFile, index) => {
            const progress = 50 + (index / textureFiles.length) * 30;
            onProgress?.(progress, `Processing texture ${index + 1}/${textureFiles.length}`);
            
            const textureData = await textureFile.async('blob');
            const textureUrl = URL.createObjectURL(textureData);
            
            return {
              name: textureFile.name,
              url: textureUrl,
              data: textureData,
            };
          })
        );

        // @ts-ignore - Store textures in entry
        entry.textures = textureEntries;

        // Store in database
        if (db) {
          await storeFile(db, entry);
          
          // Store individual textures
          for (const tex of textureEntries) {
            await storeTexture(db, entry.id, tex);
          }
        }

        onProgress?.(100, 'ZIP extraction complete!');
        resolve(entry);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onProgress?.(0, `Error: ${errorMessage}`);
        reject(error);
      }
    });
  }, [db]);

  return {
    loadPMX,
    loadVMD,
    loadVPD,
    loadAudio,
    loadBackground,
    extractZIP,
  };
};

/**
 * Generate unique ID
 */
const generateId = (): string => {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Store file in database
 */
const storeFile = async (db: Dexie, entry: FileEntry): Promise<void> => {
  try {
    // Check if files table exists
    if (db.table('files')) {
      await db.table('files').add({
        ...entry,
        data: entry.data ? Array.from(new Uint8Array(entry.data)) : undefined,
      });
    }
  } catch (error) {
    console.warn('Failed to store file in database:', error);
  }
};

/**
 * Store texture in database
 */
const storeTexture = async (db: Dexie, modelId: string, texture: any): Promise<void> => {
  try {
    if (db.table('textures')) {
      await db.table('textures').add({
        id: generateId(),
        modelId,
        name: texture.name,
        data: texture.data ? Array.from(new Uint8Array(await texture.data.arrayBuffer())) : undefined,
      });
    }
  } catch (error) {
    console.warn('Failed to store texture in database:', error);
  }
};
