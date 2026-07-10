import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from '../../utils/firebase';
import type { ServiceResponse } from './authService';

/**
 * Uploads a file to Firebase Storage at the specified path and returns its download URL.
 */
export const uploadFile = async (
  file: File, 
  path: string
): Promise<ServiceResponse<{ downloadUrl: string; fullPath: string }>> => {
  try {
    if (!file) {
      return { success: false, error: 'No file provided for upload.' };
    }
    
    // Create reference
    const storageRef = ref(storage, path);
    
    // Upload bytes
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get secure download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    
    return { 
      success: true, 
      data: { 
        downloadUrl, 
        fullPath: snapshot.ref.fullPath 
      } 
    };
  } catch (err: any) {
    console.error('Firebase Storage upload error:', err);
    return { success: false, error: err.message || 'Failed to upload file to storage.' };
  }
};

/**
 * Deletes a file from Firebase Storage given its full path.
 */
export const deleteFile = async (fullPath: string): Promise<ServiceResponse<void>> => {
  try {
    if (!fullPath) {
      return { success: false, error: 'No storage path provided for deletion.' };
    }
    
    const storageRef = ref(storage, fullPath);
    await deleteObject(storageRef);
    
    return { success: true };
  } catch (err: any) {
    console.error('Firebase Storage deletion error:', err);
    return { success: false, error: err.message || 'Failed to delete file from storage.' };
  }
};

/**
 * Gets a file's download URL from Firebase Storage given its full path.
 */
export const getFileDownloadUrl = async (fullPath: string): Promise<ServiceResponse<string>> => {
  try {
    if (!fullPath) {
      return { success: false, error: 'No storage path provided.' };
    }
    
    const storageRef = ref(storage, fullPath);
    const url = await getDownloadURL(storageRef);
    
    return { success: true, data: url };
  } catch (err: any) {
    console.error('Firebase Storage download URL error:', err);
    return { success: false, error: err.message || 'Failed to retrieve download URL.' };
  }
};
