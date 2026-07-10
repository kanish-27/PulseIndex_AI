import { uploadFile as firebaseUpload, deleteFile as firebaseDelete } from '../firebase/storageService';

export interface StorageProvider {
  uploadFile(file: File, path: string): Promise<{ success: boolean; downloadUrl?: string; storagePath?: string; error?: string }>;
  deleteFile(path: string): Promise<{ success: boolean; error?: string }>;
}

class FirebaseStorageProvider implements StorageProvider {
  async uploadFile(file: File, path: string) {
    const res = await firebaseUpload(file, path);
    return {
      success: res.success,
      downloadUrl: res.data?.downloadUrl,
      storagePath: res.data?.fullPath,
      error: res.error
    };
  }

  async deleteFile(path: string) {
    const res = await firebaseDelete(path);
    return {
      success: res.success,
      error: res.error
    };
  }
}

class LocalStorageProvider implements StorageProvider {
  async uploadFile(file: File, path: string) {
    // Return a local development preview URL
    const mockUrl = `/local-storage/${path}`;
    return {
      success: true,
      downloadUrl: mockUrl,
      storagePath: path
    };
  }

  async deleteFile(path: string) {
    return { success: true };
  }
}

class S3StorageProvider implements StorageProvider {
  async uploadFile(file: File, path: string) {
    const mockUrl = `https://mediguard-s3-bucket.s3.amazonaws.com/${path}`;
    return {
      success: true,
      downloadUrl: mockUrl,
      storagePath: path
    };
  }

  async deleteFile(path: string) {
    return { success: true };
  }
}

class SupabaseStorageProvider implements StorageProvider {
  async uploadFile(file: File, path: string) {
    const mockUrl = `https://pulseindex.supabase.co/storage/v1/object/public/medical-records/${path}`;
    return {
      success: true,
      downloadUrl: mockUrl,
      storagePath: path
    };
  }

  async deleteFile(path: string) {
    return { success: true };
  }
}

class StorageManager {
  private provider: StorageProvider;

  constructor() {
    // Select provider based on environment, default to firebase
    const envProvider = (import.meta.env.VITE_STORAGE_PROVIDER || 'firebase').toLowerCase();
    switch (envProvider) {
      case 'local':
        this.provider = new LocalStorageProvider();
        break;
      case 's3':
        this.provider = new S3StorageProvider();
        break;
      case 'supabase':
        this.provider = new SupabaseStorageProvider();
        break;
      case 'firebase':
      default:
        this.provider = new FirebaseStorageProvider();
        break;
    }
  }

  async upload(file: File, path: string) {
    return this.provider.uploadFile(file, path);
  }

  async delete(path: string) {
    return this.provider.deleteFile(path);
  }
}

export const storageManager = new StorageManager();
