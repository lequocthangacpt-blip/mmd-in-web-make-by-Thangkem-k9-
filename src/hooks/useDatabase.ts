import { useState, useCallback, useEffect } from 'react';
import Dexie, { Table } from 'dexie';
import { FileEntry, DatabaseStats } from '../types';

// Define database schema
class MMDDatabase extends Dexie {
  files!: Table<FileEntry, string>;
  textures!: Table<{
    id: string;
    modelId: string;
    name: string;
    data?: Uint8Array;
  }, string>;
  metadata!: Table<{
    id: string;
    key: string;
    value: any;
  }, string>;

  constructor() {
    super('MMDWebStudioDB');
    
    this.version(1).stores({
      files: 'id,name,type,lastModified',
      textures: 'id,modelId,name',
      metadata: 'id,key',
    });
  }
}

// Singleton database instance
let dbInstance: MMDDatabase | null = null;

export interface UseDatabaseResult {
  db: MMDDatabase | null;
  initDB: () => Promise<void>;
  getAllFiles: () => Promise<FileEntry[]>;
  getFilesByType: (type: string) => Promise<FileEntry[]>;
  getFileById: (id: string) => Promise<FileEntry | undefined>;
  addFile: (file: FileEntry) => Promise<string>;
  updateFile: (id: string, updates: Partial<FileEntry>) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  clearDatabase: () => Promise<void>;
  getStats: () => Promise<DatabaseStats>;
  closeDB: () => Promise<void>;
}

export const useDatabase = (): UseDatabaseResult => {
  const [db, setDb] = useState<MMDDatabase | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Initialize database
   */
  const initDB = useCallback(async () => {
    try {
      if (dbInstance) {
        setDb(dbInstance);
        setIsInitialized(true);
        return;
      }

      dbInstance = new MMDDatabase();
      setDb(dbInstance);
      setIsInitialized(true);
      
      console.log('Database initialized');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }, []);

  /**
   * Get all files from database
   */
  const getAllFiles = useCallback(async (): Promise<FileEntry[]> => {
    if (!db) {
      await initDB();
    }
    
    try {
      const files = await db!.files.toArray();
      return files;
    } catch (error) {
      console.error('Failed to get all files:', error);
      return [];
    }
  }, [db, initDB]);

  /**
   * Get files by type
   */
  const getFilesByType = useCallback(async (type: string): Promise<FileEntry[]> => {
    if (!db) {
      await initDB();
    }
    
    try {
      return await db!.files.where('type').equals(type).toArray();
    } catch (error) {
      console.error(`Failed to get files by type ${type}:`, error);
      return [];
    }
  }, [db, initDB]);

  /**
   * Get file by ID
   */
  const getFileById = useCallback(async (id: string): Promise<FileEntry | undefined> => {
    if (!db) {
      await initDB();
    }
    
    try {
      return await db!.files.get(id);
    } catch (error) {
      console.error(`Failed to get file by ID ${id}:`, error);
      return undefined;
    }
  }, [db, initDB]);

  /**
   * Add a new file
   */
  const addFile = useCallback(async (file: FileEntry): Promise<string> => {
    if (!db) {
      await initDB();
    }
    
    try {
      // Convert ArrayBuffer to Uint8Array for storage
      const entryToStore = {
        ...file,
        data: file.data ? new Uint8Array(file.data) : undefined,
      };
      
      await db!.files.add(entryToStore);
      return entryToStore.id;
    } catch (error) {
      console.error('Failed to add file:', error);
      throw error;
    }
  }, [db, initDB]);

  /**
   * Update a file
   */
  const updateFile = useCallback(async (id: string, updates: Partial<FileEntry>): Promise<void> => {
    if (!db) {
      await initDB();
    }
    
    try {
      await db!.files.update(id, updates);
    } catch (error) {
      console.error(`Failed to update file ${id}:`, error);
      throw error;
    }
  }, [db, initDB]);

  /**
   * Delete a file
   */
  const deleteFile = useCallback(async (id: string): Promise<void> => {
    if (!db) {
      await initDB();
    }
    
    try {
      // Delete associated textures first
      await db!.textures.where('modelId').equals(id).delete();
      
      // Delete the file
      await db!.files.delete(id);
    } catch (error) {
      console.error(`Failed to delete file ${id}:`, error);
      throw error;
    }
  }, [db, initDB]);

  /**
   * Clear entire database
   */
  const clearDatabase = useCallback(async (): Promise<void> => {
    if (!db) {
      await initDB();
    }
    
    try {
      await db!.files.clear();
      await db!.textures.clear();
      await db!.metadata.clear();
      console.log('Database cleared');
    } catch (error) {
      console.error('Failed to clear database:', error);
      throw error;
    }
  }, [db, initDB]);

  /**
   * Get database statistics
   */
  const getStats = useCallback(async (): Promise<DatabaseStats> => {
    if (!db) {
      await initDB();
    }
    
    try {
      const files = await db!.files.toArray();
      const textures = await db!.textures.toArray();
      
      const stats: DatabaseStats = {
        models: files.filter(f => f.type === 'model').length,
        motions: files.filter(f => f.type === 'motion').length,
        poses: files.filter(f => f.type === 'pose').length,
        audios: files.filter(f => f.type === 'audio').length,
        backgrounds: files.filter(f => f.type === 'background').length,
        totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0),
      };
      
      return stats;
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return {
        models: 0,
        motions: 0,
        poses: 0,
        audios: 0,
        backgrounds: 0,
        totalSize: 0,
      };
    }
  }, [db, initDB]);

  /**
   * Close database connection
   */
  const closeDB = useCallback(async (): Promise<void> => {
    try {
      if (db) {
        db.close();
        dbInstance = null;
        setDb(null);
        setIsInitialized(false);
      }
    } catch (error) {
      console.error('Failed to close database:', error);
      throw error;
    }
  }, [db]);

  return {
    db,
    initDB,
    getAllFiles,
    getFilesByType,
    getFileById,
    addFile,
    updateFile,
    deleteFile,
    clearDatabase,
    getStats,
    closeDB,
  };
};

/**
 * Get database instance (singleton)
 */
export const getDatabase = (): MMDDatabase => {
  if (!dbInstance) {
    dbInstance = new MMDDatabase();
  }
  return dbInstance;
};

/**
 * Export database for use outside React components
 */
export { MMDDatabase };
