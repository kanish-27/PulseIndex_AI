import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import type { User, Unsubscribe } from 'firebase/auth';
import { auth } from '../../utils/firebase';

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Generate a deterministic password from the email to support passwordless single-field login UX
const getDeterministicPassword = (email: string): string => {
  const cleanEmail = email.trim().toLowerCase();
  return `${cleanEmail}_MediGuardSecret2026!`;
};

/**
 * Signs in a user by email. If the user doesn't exist, automatically registers them.
 */
export const loginWithEmail = async (email: string): Promise<ServiceResponse<User>> => {
  if (!email || !email.includes('@')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const password = getDeterministicPassword(email);
  try {
    // Attempt sign-in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, data: userCredential.user };
  } catch (err: any) {
    if (err.code === 'auth/configuration-not-found') {
      return { 
        success: false, 
        error: "Firebase Authentication 'Email/Password' provider is not enabled. Please enable it under the 'Sign-in method' tab in your Firebase Console." 
      };
    }
    
    // If user is not found, or credential is invalid, try creating the account
    if (
      err.code === 'auth/user-not-found' || 
      err.code === 'auth/invalid-credential' || 
      err.code === 'auth/wrong-password'
    ) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return { success: true, data: userCredential.user };
      } catch (regErr: any) {
        if (regErr.code === 'auth/configuration-not-found') {
          return { 
            success: false, 
            error: "Firebase Authentication 'Email/Password' provider is not enabled. Please enable it under the 'Sign-in method' tab in your Firebase Console." 
          };
        }
        if (regErr.code === 'auth/email-already-in-use') {
          // If already in use, it means the password didn't match. Return the original auth error
          return { success: false, error: 'Invalid credentials. Please verify your email and try again.' };
        }
        console.error('Firebase registration error:', regErr);
        return { success: false, error: regErr.message || 'Failed to create user account.' };
      }
    }
    console.error('Firebase authentication error:', err);
    return { success: false, error: err.message || 'Failed to sign in.' };
  }
};

/**
 * Signs out the current user.
 */
export const logoutUser = async (): Promise<ServiceResponse<void>> => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (err: any) {
    console.error('Firebase sign-out error:', err);
    return { success: false, error: err.message || 'Failed to log out.' };
  }
};

/**
 * Returns the currently authenticated Firebase user, if any.
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Subscribes to authentication state changes.
 */
export const onAuthStateChangedListener = (callback: (user: User | null) => void): Unsubscribe => {
  return onAuthStateChanged(auth, callback);
};
