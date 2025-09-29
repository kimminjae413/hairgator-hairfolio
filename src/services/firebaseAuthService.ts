// src/services/firebaseAuthService.ts
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  User,
  Auth,
  AuthError
} from "firebase/auth";

// Initialize Firebase Auth
let auth: Auth | null = null;

export const initializeAuth = (): Auth | null => {
  try {
    auth = getAuth();
    console.log('✅ Firebase Auth initialized successfully');
    return auth;
  } catch (error) {
    console.error('❌ Firebase Auth initialization failed:', error);
    return null;
  }
};

// Auth error messages in Korean
const getAuthErrorMessage = (error: AuthError): string => {
  const errorMessages: { [key: string]: string } = {
    'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
    'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
    'auth/operation-not-allowed': '이메일/비밀번호 인증이 비활성화되어 있습니다.',
    'auth/weak-password': '비밀번호는 최소 6자 이상이어야 합니다.',
    'auth/user-disabled': '비활성화된 계정입니다.',
    'auth/user-not-found': '등록되지 않은 이메일입니다.',
    'auth/wrong-password': '잘못된 비밀번호입니다.',
    'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
    'auth/network-request-failed': '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
    'auth/invalid-credential': '잘못된 인증 정보입니다.',
    'auth/missing-email': '이메일을 입력해주세요.',
    'auth/internal-error': '내부 오류가 발생했습니다. 다시 시도해주세요.'
  };

  return errorMessages[error.code] || `인증 오류: ${error.message}`;
};

// Sign up with email and password
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  displayName: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    if (!auth) {
      auth = initializeAuth();
      if (!auth) {
        throw new Error('Firebase Auth를 초기화할 수 없습니다.');
      }
    }

    // Create user account
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update user profile with display name
    await updateProfile(user, {
      displayName: displayName
    });

    // Send email verification
    await sendEmailVerification(user);

    console.log('✅ User signed up successfully:', user.uid);
    return { success: true, user };
  } catch (error) {
    console.error('❌ Sign up error:', error);
    const authError = error as AuthError;
    return { 
      success: false, 
      error: getAuthErrorMessage(authError) 
    };
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string, 
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    if (!auth) {
      auth = initializeAuth();
      if (!auth) {
        throw new Error('Firebase Auth를 초기화할 수 없습니다.');
      }
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ User signed in successfully:', user.uid);
    return { success: true, user };
  } catch (error) {
    console.error('❌ Sign in error:', error);
    const authError = error as AuthError;
    return { 
      success: false, 
      error: getAuthErrorMessage(authError) 
    };
  }
};

// Sign out
export const signOutUser = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth가 초기화되지 않았습니다.');
    }

    await signOut(auth);
    console.log('✅ User signed out successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Sign out error:', error);
    return { 
      success: false, 
      error: '로그아웃 중 오류가 발생했습니다.' 
    };
  }
};

// Resend email verification
export const resendEmailVerification = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth가 초기화되지 않았습니다.');
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error('로그인된 사용자가 없습니다.');
    }

    if (user.emailVerified) {
      return { 
        success: false, 
        error: '이미 이메일이 인증되었습니다.' 
      };
    }

    await sendEmailVerification(user);
    console.log('✅ Verification email resent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Resend verification email error:', error);
    return { 
      success: false, 
      error: '인증 이메일 전송 중 오류가 발생했습니다.' 
    };
  }
};

// Check if email is verified
export const checkEmailVerified = async (): Promise<boolean> => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth가 초기화되지 않았습니다.');
    }

    const user = auth.currentUser;
    if (!user) {
      return false;
    }

    // Reload user to get latest email verification status
    await user.reload();
    return user.emailVerified;
  } catch (error) {
    console.error('❌ Check email verification error:', error);
    return false;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  if (!auth) {
    auth = initializeAuth();
  }
  return auth?.currentUser || null;
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  if (!auth) {
    auth = initializeAuth();
    if (!auth) {
      console.error('❌ Cannot listen to auth state: Auth not initialized');
      return () => {};
    }
  }

  return onAuthStateChanged(auth, callback);
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const isValidPassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: '비밀번호는 최소 6자 이상이어야 합니다.' };
  }
  
  if (password.length > 128) {
    return { valid: false, message: '비밀번호는 128자를 초과할 수 없습니다.' };
  }

  // Optional: Add more password strength requirements
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumber = /\d/.test(password);
  // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return { valid: true };
};

// Validate designer name
export const isValidDesignerName = (name: string): { valid: boolean; message?: string } => {
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { valid: false, message: '디자이너 이름은 최소 2자 이상이어야 합니다.' };
  }
  
  if (trimmedName.length > 30) {
    return { valid: false, message: '디자이너 이름은 30자를 초과할 수 없습니다.' };
  }

  // Check for invalid characters (optional)
  const invalidCharsRegex = /[<>{}[\]\\\/]/;
  if (invalidCharsRegex.test(trimmedName)) {
    return { valid: false, message: '디자이너 이름에 특수문자를 사용할 수 없습니다.' };
  }

  return { valid: true };
};
