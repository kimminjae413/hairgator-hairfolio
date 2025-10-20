// src/services/firebaseAuthService.ts - 완전한 최종 버전 (사용자 타입 포함)
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
import { UserType } from '../types';
import * as firebaseService from './firebaseService';

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

/**
 * 회원가입 (사용자 타입 포함)
 */
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  displayName: string,
  userType: UserType = 'designer' // 기본값: designer (하위 호환성)
): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    if (!auth) {
      auth = initializeAuth();
      if (!auth) {
        throw new Error('Firebase Auth를 초기화할 수 없습니다.');
      }
    }

    // 1. Firebase Auth에 사용자 생성
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. 프로필 업데이트
    await updateProfile(user, {
      displayName: displayName
    });

    // 3. Firestore에 사용자 정보 저장
    await firebaseService.createUser(user.uid, userType, email, displayName);

    // 4. 사용자 타입별 추가 초기화
    if (userType === 'designer') {
      // 디자이너: 빈 포트폴리오 생성
      await firebaseService.savePortfolioById(user.uid, []);
      await firebaseService.saveDesignerProfile(user.uid, {
        name: displayName
      });
    } else if (userType === 'client') {
      // 일반 사용자: 빈 프로필 생성
      await firebaseService.saveClientProfile({
        userId: user.uid,
        name: displayName,
        email: email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // 5. 이메일 인증 발송
    await sendEmailVerification(user);

    console.log('✅ User signed up successfully:', user.uid, userType);
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

/**
 * 로그인
 */
export const signInWithEmail = async (
  email: string, 
  password: string
): Promise<{ success: boolean; user?: User; userType?: UserType; error?: string }> => {
  try {
    if (!auth) {
      auth = initializeAuth();
      if (!auth) {
        throw new Error('Firebase Auth를 초기화할 수 없습니다.');
      }
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestore에서 사용자 타입 조회
    const userData = await firebaseService.getUser(user.uid);
    const userType = userData?.userType || 'designer'; // 기본값: designer (하위 호환성)

    console.log('✅ User signed in successfully:', user.uid, userType);
    return { success: true, user, userType };
  } catch (error) {
    console.error('❌ Sign in error:', error);
    const authError = error as AuthError;
    return { 
      success: false, 
      error: getAuthErrorMessage(authError) 
    };
  }
};

/**
 * 로그아웃
 */
export const signOutUser = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth가 초기화되지 않았습니다.');
    }

    await signOut(auth);
    
    // 세션 정보 정리
    sessionStorage.removeItem('hairfolio_designer');
    sessionStorage.removeItem('hairfolio_userId');
    sessionStorage.removeItem('hairfolio_userType');
    localStorage.removeItem('hairfolio_user_type');
    
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

/**
 * 이메일 인증 재발송
 */
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

/**
 * 이메일 인증 확인
 */
export const checkEmailVerified = async (): Promise<boolean> => {
  try {
    if (!auth) {
      throw new Error('Firebase Auth가 초기화되지 않았습니다.');
    }

    const user = auth.currentUser;
    if (!user) {
      return false;
    }

    // 최신 인증 상태 새로고침
    await user.reload();
    return user.emailVerified;
  } catch (error) {
    console.error('❌ Check email verification error:', error);
    return false;
  }
};

/**
 * 현재 로그인한 사용자 조회
 */
export const getCurrentUser = (): User | null => {
  if (!auth) {
    auth = initializeAuth();
  }
  return auth?.currentUser || null;
};

/**
 * 현재 사용자 타입 조회
 */
export const getCurrentUserType = async (): Promise<UserType | null> => {
  try {
    const user = getCurrentUser();
    if (!user) return null;

    const userData = await firebaseService.getUser(user.uid);
    return userData?.userType || null;
  } catch (error) {
    console.error('❌ Error getting current user type:', error);
    return null;
  }
};

/**
 * 인증 상태 변경 리스너
 */
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

/**
 * 이메일 형식 검증
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 비밀번호 강도 검증
 */
export const isValidPassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: '비밀번호는 최소 6자 이상이어야 합니다.' };
  }
  
  if (password.length > 128) {
    return { valid: false, message: '비밀번호는 128자를 초과할 수 없습니다.' };
  }

  return { valid: true };
};

/**
 * 디자이너/사용자 이름 검증
 */
export const isValidName = (name: string): { valid: boolean; message?: string } => {
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { valid: false, message: '이름은 최소 2자 이상이어야 합니다.' };
  }
  
  if (trimmedName.length > 30) {
    return { valid: false, message: '이름은 30자를 초과할 수 없습니다.' };
  }

  const invalidCharsRegex = /[<>{}[\]\\\/]/;
  if (invalidCharsRegex.test(trimmedName)) {
    return { valid: false, message: '이름에 특수문자를 사용할 수 없습니다.' };
  }

  return { valid: true };
};

// 하위 호환성을 위한 별칭
export const isValidDesignerName = isValidName;
