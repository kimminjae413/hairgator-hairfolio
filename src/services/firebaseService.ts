// src/services/firebaseService.ts - 완전한 최종 버전
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit
} from "firebase/firestore";
import { 
  Hairstyle, 
  DesignerData, 
  DesignerStats, 
  DesignerProfile,
  DesignerSettings,
  TrialResult,
  DEFAULT_STATS,
  DEFAULT_SETTINGS,
  User,
  UserType,
  ClientProfile,
  Favorite,
  SearchHistory,
  TryOnHistory
} from '../types';
import { portfolioImages, sampleDesigner } from '../portfolioImages';

// Firebase 설정 디버깅
console.log('🔧 Firebase Config Debug:', {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'SET ✅' : 'NOT SET ❌',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'NOT SET ❌',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'NOT SET ❌',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'NOT SET ❌',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? 'SET ✅' : 'NOT SET ❌',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ? 'SET ✅' : 'NOT SET ❌',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? 'SET ✅' : 'NOT SET ❌'
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Firebase 초기화
let app: any;
let db: any;

try {
  console.log('🚀 Initializing Firebase...');
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  console.error('Error details:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    code: (error as any)?.code || 'No code',
    stack: error instanceof Error ? error.stack : 'No stack'
  });
  app = null;
  db = null;
}

// 컬렉션 레퍼런스
const COLLECTIONS = {
  DESIGNERS: 'designers',
  USERS: 'users',
  CLIENTS: 'clients',
  FAVORITES: 'favorites',
  SEARCH_HISTORY: 'searchHistory',
  TRYON_HISTORY: 'tryonHistory'
} as const;

// Generate unique ID for new items
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// undefined 값 제거 함수
const removeUndefinedFields = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedFields(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    });
    return cleaned;
  }
  
  return obj;
};

// Firebase 사용 가능 체크
const isFirebaseAvailable = (): boolean => {
  return db !== null;
};

// ===== 사용자 관리 함수 (신규 추가) =====

/**
 * 사용자 기본 정보 저장 (회원가입 시)
 */
export const createUser = async (
  userId: string, 
  userType: UserType, 
  email: string, 
  displayName: string
): Promise<boolean> => {
  try {
    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, using localStorage for createUser');
      const userData: User = {
        userId,
        userType,
        email,
        displayName,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(`hairfolio_user_${userId}`, JSON.stringify(userData));
      return true;
    }

    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userData: User = {
      userId,
      userType,
      email,
      displayName,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(userRef, userData);
    console.log('✅ User created:', userId, userType);
    return true;
  } catch (error) {
    console.error('❌ Error creating user:', error);
    return false;
  }
};

/**
 * 사용자 정보 조회
 */
export const getUser = async (userId: string): Promise<User | null> => {
  try {
    if (!isFirebaseAvailable()) {
      const userData = localStorage.getItem(`hairfolio_user_${userId}`);
      return userData ? JSON.parse(userData) : null;
    }

    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting user:', error);
    return null;
  }
};

/**
 * 사용자 타입 조회 (간편 함수) - 🆕 추가!
 */
export const getUserType = async (userId: string): Promise<UserType | null> => {
  try {
    const user = await getUser(userId);
    return user?.userType || null;
  } catch (error) {
    console.error('❌ Error getting user type:', error);
    return null;
  }
};

/**
 * 일반 사용자 프로필 저장
 */
export const saveClientProfile = async (profile: ClientProfile): Promise<boolean> => {
  try {
    if (!isFirebaseAvailable()) {
      localStorage.setItem(`hairfolio_client_${profile.userId}`, JSON.stringify(profile));
      return true;
    }

    const clientRef = doc(db, COLLECTIONS.CLIENTS, profile.userId);
    const cleanedProfile = removeUndefinedFields({
      ...profile,
      updatedAt: new Date().toISOString()
    });
    
    await setDoc(clientRef, cleanedProfile);
    console.log('✅ Client profile saved:', profile.userId);
    return true;
  } catch (error) {
    console.error('❌ Error saving client profile:', error);
    return false;
  }
};

/**
 * 일반 사용자 프로필 조회
 */
export const getClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  try {
    if (!isFirebaseAvailable()) {
      const data = localStorage.getItem(`hairfolio_client_${userId}`);
      return data ? JSON.parse(data) : null;
    }

    const clientRef = doc(db, COLLECTIONS.CLIENTS, userId);
    const clientSnap = await getDoc(clientRef);
    
    if (clientSnap.exists()) {
      return clientSnap.data() as ClientProfile;
    }
    return null;
  } catch (error) {
    console.error('❌ Error getting client profile:', error);
    return null;
  }
};

/**
 * 찜하기 추가
 */
export const addFavorite = async (favorite: Omit<Favorite, 'id' | 'createdAt'>): Promise<boolean> => {
  try {
    const favoriteId = generateId();
    const favoriteData: Favorite = {
      ...favorite,
      id: favoriteId,
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseAvailable()) {
      const favorites = JSON.parse(localStorage.getItem('hairfolio_favorites') || '{}');
      if (!favorites[favorite.userId]) favorites[favorite.userId] = [];
      favorites[favorite.userId].push(favoriteData);
      localStorage.setItem('hairfolio_favorites', JSON.stringify(favorites));
      return true;
    }

    const favoriteRef = doc(db, COLLECTIONS.FAVORITES, favoriteId);
    await setDoc(favoriteRef, favoriteData);
    console.log('✅ Favorite added:', favoriteId);
    return true;
  } catch (error) {
    console.error('❌ Error adding favorite:', error);
    return false;
  }
};

/**
 * 찜하기 목록 조회
 */
export const getFavorites = async (userId: string): Promise<Favorite[]> => {
  try {
    if (!isFirebaseAvailable()) {
      const favorites = JSON.parse(localStorage.getItem('hairfolio_favorites') || '{}');
      return favorites[userId] || [];
    }

    const favoritesRef = collection(db, COLLECTIONS.FAVORITES);
    const q = query(
      favoritesRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Favorite);
  } catch (error) {
    console.error('❌ Error getting favorites:', error);
    return [];
  }
};

/**
 * 찜하기 삭제
 */
export const removeFavorite = async (favoriteId: string, userId: string): Promise<boolean> => {
  try {
    if (!isFirebaseAvailable()) {
      const favorites = JSON.parse(localStorage.getItem('hairfolio_favorites') || '{}');
      if (favorites[userId]) {
        favorites[userId] = favorites[userId].filter((f: Favorite) => f.id !== favoriteId);
        localStorage.setItem('hairfolio_favorites', JSON.stringify(favorites));
      }
      return true;
    }

    const favoriteRef = doc(db, COLLECTIONS.FAVORITES, favoriteId);
    await deleteDoc(favoriteRef);
    console.log('✅ Favorite removed:', favoriteId);
    return true;
  } catch (error) {
    console.error('❌ Error removing favorite:', error);
    return false;
  }
};

/**
 * 가상 체험 기록 저장
 */
export const saveTryOnHistory = async (history: Omit<TryOnHistory, 'id' | 'createdAt'>): Promise<boolean> => {
  try {
    const historyId = generateId();
    const historyData: TryOnHistory = {
      ...history,
      id: historyId,
      createdAt: new Date().toISOString()
    };

    if (!isFirebaseAvailable()) {
      const histories = JSON.parse(localStorage.getItem('hairfolio_tryon_history') || '{}');
      if (!histories[history.userId]) histories[history.userId] = [];
      histories[history.userId].unshift(historyData);
      // 최근 50개만 유지
      if (histories[history.userId].length > 50) {
        histories[history.userId] = histories[history.userId].slice(0, 50);
      }
      localStorage.setItem('hairfolio_tryon_history', JSON.stringify(histories));
      return true;
    }

    const historyRef = doc(db, COLLECTIONS.TRYON_HISTORY, historyId);
    await setDoc(historyRef, historyData);
    console.log('✅ Try-on history saved:', historyId);
    return true;
  } catch (error) {
    console.error('❌ Error saving try-on history:', error);
    return false;
  }
};

/**
 * 가상 체험 기록 조회
 */
export const getTryOnHistory = async (userId: string, limitCount: number = 20): Promise<TryOnHistory[]> => {
  try {
    if (!isFirebaseAvailable()) {
      const histories = JSON.parse(localStorage.getItem('hairfolio_tryon_history') || '{}');
      return (histories[userId] || []).slice(0, limitCount);
    }

    const historyRef = collection(db, COLLECTIONS.TRYON_HISTORY);
    const q = query(
      historyRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as TryOnHistory);
  } catch (error) {
    console.error('❌ Error getting try-on history:', error);
    return [];
  }
};

/**
 * 모든 디자이너의 포트폴리오 조회 (일반 사용자용)
 */
export const getAllPortfolios = async (): Promise<Array<{ designerId: string; designerName: string; data: DesignerData }>> => {
  try {
    if (!isFirebaseAvailable()) {
      const localData = localStorage.getItem('hairfolio_designers');
      if (localData) {
        const designers = JSON.parse(localData);
        return Object.entries(designers).map(([name, data]) => ({
          designerId: name, // localStorage에서는 이름이 ID
          designerName: name,
          data: data as DesignerData
        }));
      }
      return [];
    }

    const designersRef = collection(db, COLLECTIONS.DESIGNERS);
    const snapshot = await getDocs(designersRef);
    
    return snapshot.docs.map(doc => ({
      designerId: doc.id,
      designerName: doc.data().profile?.name || doc.id,
      data: doc.data() as DesignerData
    }));
  } catch (error) {
    console.error('❌ Error getting all portfolios:', error);
    return [];
  }
};

/**
 * 디자이너 ID로 데이터 조회 (Firebase UID 사용)
 */
export const getDesignerDataById = async (userId: string): Promise<DesignerData> => {
  try {
    if (!isFirebaseAvailable()) {
      const localData = localStorage.getItem('hairfolio_designers');
      if (localData) {
        const designers = JSON.parse(localData);
        return designers[userId] || {
          portfolio: [],
          stats: { ...DEFAULT_STATS },
          settings: { ...DEFAULT_SETTINGS },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      throw new Error('No data available');
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, userId);
    const designerSnap = await getDoc(designerRef);
    
    if (designerSnap.exists()) {
      const data = designerSnap.data() as DesignerData;
      return {
        ...data,
        stats: data.stats || { ...DEFAULT_STATS },
        settings: data.settings || { ...DEFAULT_SETTINGS },
        portfolio: data.portfolio || []
      };
    } else {
      return {
        portfolio: [],
        stats: { ...DEFAULT_STATS },
        settings: { ...DEFAULT_SETTINGS },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('❌ Error getting designer data by ID:', error);
    throw error;
  }
};

/**
 * 포트폴리오 저장 (Firebase UID 사용)
 */
export const savePortfolioById = async (userId: string, portfolio: Hairstyle[]): Promise<boolean> => {
  try {
    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, using localStorage');
      const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
      const existingData = localData[userId] || {
        stats: { ...DEFAULT_STATS },
        settings: { ...DEFAULT_SETTINGS },
        createdAt: new Date().toISOString()
      };
      
      const updatedPortfolio = portfolio.map(style => ({
        ...style,
        id: style.id || generateId(),
        uploadedBy: userId, // 디자이너 ID 추가
        createdAt: style.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      localData[userId] = {
        ...existingData,
        portfolio: updatedPortfolio,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
      return true;
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, userId);
    
    const updatedPortfolio = portfolio.map(style => ({
      ...style,
      id: style.id || generateId(),
      uploadedBy: userId,
      createdAt: style.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    const existingData = await getDesignerDataById(userId);
    
    const updatedData: DesignerData = {
      ...existingData,
      portfolio: updatedPortfolio,
      updatedAt: new Date().toISOString()
    };
    
    const cleanedData = removeUndefinedFields(updatedData);
    await setDoc(designerRef, cleanedData);
    
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[userId] = cleanedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error saving portfolio:', error);
    return false;
  }
};

// ===== 기존 디자이너 관리 함수들 (하위 호환성 유지) =====

export const initializeDB = async (): Promise<void> => {
  try {
    if (!isFirebaseAvailable()) {
      console.warn('⚠️ Firebase not available, using localStorage fallback');
      const localData = localStorage.getItem('hairfolio_designers');
      if (!localData) {
        localStorage.setItem('hairfolio_designers', JSON.stringify({
          'Sample Designer': {
            portfolio: portfolioImages,
            profile: sampleDesigner,
            reservationUrl: 'https://booking.naver.com/booking/12/bizes/123456',
            stats: DEFAULT_STATS,
            settings: DEFAULT_SETTINGS,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        }));
        console.log('📝 Sample designer initialized in localStorage');
      }
      return;
    }

    console.log('🔄 Checking Sample Designer in Firebase...');
    const sampleDesignerRef = doc(db, COLLECTIONS.DESIGNERS, 'Sample Designer');
    const sampleDesignerSnap = await getDoc(sampleDesignerRef);
    
    if (!sampleDesignerSnap.exists()) {
      console.log('📝 Creating Sample Designer in Firebase...');
      const sampleDesignerData: DesignerData = {
        portfolio: portfolioImages.map(style => ({
          ...style,
          id: style.id || generateId(),
          createdAt: style.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })),
        profile: sampleDesigner,
        reservationUrl: 'https://booking.naver.com/booking/12/bizes/123456',
        stats: { ...DEFAULT_STATS },
        settings: { ...DEFAULT_SETTINGS },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const cleanedData = removeUndefinedFields(sampleDesignerData);
      await setDoc(sampleDesignerRef, cleanedData);
      console.log('✅ Sample designer initialized in Firebase');
    } else {
      console.log('✅ Sample designer already exists in Firebase');
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase DB:', error);
    const localData = localStorage.getItem('hairfolio_designers');
    if (!localData) {
      localStorage.setItem('hairfolio_designers', JSON.stringify({
        'Sample Designer': {
          portfolio: portfolioImages,
          profile: sampleDesigner,
          reservationUrl: 'https://booking.naver.com/booking/12/bizes/123456',
          stats: DEFAULT_STATS,
          settings: DEFAULT_SETTINGS,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }));
      console.log('📝 Fallback: Sample designer initialized in localStorage');
    }
  }
};

export const getDesignerData = async (designerName: string): Promise<DesignerData> => {
  try {
    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, using localStorage for getDesignerData');
      const localData = localStorage.getItem('hairfolio_designers');
      if (localData) {
        const designers = JSON.parse(localData);
        return designers[designerName] || {
          portfolio: [],
          stats: { ...DEFAULT_STATS },
          settings: { ...DEFAULT_SETTINGS },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      throw new Error('No data available');
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    const designerSnap = await getDoc(designerRef);
    
    if (designerSnap.exists()) {
      const data = designerSnap.data() as DesignerData;
      return {
        ...data,
        stats: data.stats || { ...DEFAULT_STATS },
        settings: data.settings || { ...DEFAULT_SETTINGS },
        portfolio: data.portfolio || []
      };
    } else {
      return {
        portfolio: [],
        stats: { ...DEFAULT_STATS },
        settings: { ...DEFAULT_SETTINGS },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('❌ Error getting designer data from Firebase:', error);
    const localData = localStorage.getItem('hairfolio_designers');
    if (localData) {
      const designers = JSON.parse(localData);
      return designers[designerName] || {
        portfolio: [],
        stats: { ...DEFAULT_STATS },
        settings: { ...DEFAULT_SETTINGS },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
    throw error;
  }
};

export const savePortfolio = async (designerName: string, portfolio: Hairstyle[]): Promise<boolean> => {
  try {
    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, using localStorage for savePortfolio');
      const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
      const existingData = localData[designerName] || {
        stats: { ...DEFAULT_STATS },
        settings: { ...DEFAULT_SETTINGS },
        createdAt: new Date().toISOString()
      };
      
      const updatedPortfolio = portfolio.map(style => ({
        ...style,
        id: style.id || generateId(),
        createdAt: style.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      localData[designerName] = {
        ...existingData,
        portfolio: updatedPortfolio,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
      return true;
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    
    const updatedPortfolio = portfolio.map(style => ({
      ...style,
      id: style.id || generateId(),
      createdAt: style.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    const existingData = await getDesignerData(designerName);
    
    const updatedData: DesignerData = {
      ...existingData,
      portfolio: updatedPortfolio,
      updatedAt: new Date().toISOString()
    };
    
    const cleanedData = removeUndefinedFields(updatedData);
    await setDoc(designerRef, cleanedData);
    
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[designerName] = cleanedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error saving portfolio to Firebase:', error);
    return false;
  }
};

export const addStyleToPortfolio = async (designerName: string, style: Hairstyle): Promise<boolean> => {
  try {
    const currentData = await getDesignerData(designerName);
    
    const newStyle: Hairstyle = {
      ...style,
      id: style.id || generateId(),
      createdAt: style.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedPortfolio = [newStyle, ...currentData.portfolio];
    const updatedData: DesignerData = {
      ...currentData,
      portfolio: updatedPortfolio,
      updatedAt: new Date().toISOString()
    };

    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, using localStorage for addStyleToPortfolio');
      const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
      localData[designerName] = updatedData;
      localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
      return true;
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    const cleanedData = removeUndefinedFields(updatedData);
    await setDoc(designerRef, cleanedData);
    
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[designerName] = cleanedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error adding style to portfolio:', error);
    return false;
  }
};

export const removeStyleFromPortfolio = async (designerName: string, styleId: string): Promise<boolean> => {
  try {
    const currentData = await getDesignerData(designerName);
    const updatedPortfolio = currentData.portfolio.filter(style => style.id !== styleId);
    return await savePortfolio(designerName, updatedPortfolio);
  } catch (error) {
    console.error('❌ Error removing style from portfolio:', error);
    return false;
  }
};

export const updateStyleInPortfolio = async (designerName: string, styleId: string, updates: Partial<Hairstyle>): Promise<boolean> => {
  try {
    const currentData = await getDesignerData(designerName);
    const styleIndex = currentData.portfolio.findIndex(style => style.id === styleId);
    if (styleIndex === -1) return false;
    
    currentData.portfolio[styleIndex] = {
      ...currentData.portfolio[styleIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return await savePortfolio(designerName, currentData.portfolio);
  } catch (error) {
    console.error('❌ Error updating style in portfolio:', error);
    return false;
  }
};

export const saveDesignerProfile = async (userId: string, profile: DesignerProfile): Promise<boolean> => {
  try {
    const currentData = await getDesignerDataById(userId);
    
    const updatedData: DesignerData = {
      ...currentData,
      profile,
      updatedAt: new Date().toISOString()
    };

    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, using localStorage for saveDesignerProfile');
      const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
      localData[userId] = updatedData;
      localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
      return true;
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, userId);
    const cleanedData = removeUndefinedFields(updatedData);
    await setDoc(designerRef, cleanedData);
    
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[userId] = cleanedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error saving designer profile:', error);
    return false;
  }
};

export const saveDesignerSettings = async (designerName: string, settings: DesignerSettings): Promise<boolean> => {
  try {
    const currentData = await getDesignerData(designerName);
    
    const updatedData: DesignerData = {
      ...currentData,
      settings,
      updatedAt: new Date().toISOString()
    };

    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, using localStorage for saveDesignerSettings');
      const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
      localData[designerName] = updatedData;
      localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
      return true;
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    const cleanedData = removeUndefinedFields(updatedData);
    await setDoc(designerRef, cleanedData);
    
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[designerName] = cleanedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error saving designer settings:', error);
    return false;
  }
};

export const saveReservationUrl = async (designerName: string, url: string): Promise<boolean> => {
  try {
    const currentData = await getDesignerData(designerName);
    
    const updatedData: DesignerData = {
      ...currentData,
      reservationUrl: url,
      updatedAt: new Date().toISOString()
    };

    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, using localStorage for saveReservationUrl');
      const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
      localData[designerName] = updatedData;
      localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
      return true;
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    const cleanedData = removeUndefinedFields(updatedData);
    await setDoc(designerRef, cleanedData);
    
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[designerName] = cleanedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error saving reservation URL:', error);
    return false;
  }
};

export const designerExists = async (designerName: string): Promise<boolean> => {
  try {
    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, using localStorage for designerExists');
      const localData = localStorage.getItem('hairfolio_designers');
      if (localData) {
        const designers = JSON.parse(localData);
        return designerName in designers;
      }
      return false;
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    const designerSnap = await getDoc(designerRef);
    return designerSnap.exists();
  } catch (error) {
    console.error('❌ Error checking if designer exists:', error);
    const localData = localStorage.getItem('hairfolio_designers');
    if (localData) {
      const designers = JSON.parse(localData);
      return designerName in designers;
    }
    return false;
  }
};

export const getAllDesignerNames = async (): Promise<string[]> => {
  try {
    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, using localStorage for getAllDesignerNames');
      const localData = localStorage.getItem('hairfolio_designers');
      if (localData) {
        return Object.keys(JSON.parse(localData));
      }
      return [];
    }

    const designersRef = collection(db, COLLECTIONS.DESIGNERS);
    const snapshot = await getDocs(designersRef);
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error('❌ Error getting all designer names:', error);
    const localData = localStorage.getItem('hairfolio_designers');
    if (localData) {
      return Object.keys(JSON.parse(localData));
    }
    return [];
  }
};

export const deleteDesigner = async (designerName: string): Promise<boolean> => {
  try {
    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, using localStorage for deleteDesigner');
      const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
      delete localData[designerName];
      localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
      return true;
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    await deleteDoc(designerRef);
    
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    delete localData[designerName];
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting designer:', error);
    return false;
  }
};

export const trackVisit = async (designerName: string): Promise<void> => {
  const sessionKey = `hairfolio_visit_tracked_${designerName}`;
  
  if (sessionStorage.getItem(sessionKey)) {
    return;
  }
  
  try {
    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, skipping trackVisit');
      sessionStorage.setItem(sessionKey, 'true');
      return;
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    
    await updateDoc(designerRef, {
      'stats.visits': increment(1),
      'stats.lastUpdated': new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    sessionStorage.setItem(sessionKey, 'true');
  } catch (error) {
    console.error('❌ Error tracking visit:', error);
  }
};

export const trackStyleView = async (designerName: string, styleUrl: string): Promise<void> => {
  try {
    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, skipping trackStyleView');
      return;
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    const currentData = await getDesignerData(designerName);
    
    const styleViews = currentData.stats?.styleViews || {};
    styleViews[styleUrl] = (styleViews[styleUrl] || 0) + 1;
    
    await updateDoc(designerRef, {
      'stats.styleViews': styleViews,
      'stats.totalTryOns': increment(1),
      'stats.lastUpdated': new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error tracking style view:', error);
  }
};

export const trackBooking = async (designerName: string, styleUrl: string): Promise<void> => {
  try {
    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, skipping trackBooking');
      return;
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    const currentData = await getDesignerData(designerName);
    
    const bookings = currentData.stats?.bookings || {};
    bookings[styleUrl] = (bookings[styleUrl] || 0) + 1;
    
    const totalViews = Object.values(currentData.stats?.styleViews || {}).reduce((sum, count) => sum + count, 0);
    const totalBookings = Object.values(bookings).reduce((sum, count) => sum + count, 0);
    const conversionRate = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0;
    
    await updateDoc(designerRef, {
      'stats.bookings': bookings,
      'stats.conversionRate': conversionRate,
      'stats.lastUpdated': new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error tracking booking:', error);
  }
};

export const trackTrialResult = async (
  designerName: string, 
  trialData: {
    styleUrl: string;
    resultUrl: string;
    styleName?: string;
  }
): Promise<void> => {
  try {
    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, skipping trackTrialResult');
      return;
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    const currentData = await getDesignerData(designerName);
    
    const trialResult: TrialResult = {
      styleUrl: trialData.styleUrl,
      resultUrl: trialData.resultUrl,
      timestamp: new Date().toISOString(),
      styleName: trialData.styleName
    };
    
    const trialResults = currentData.stats?.trialResults || [];
    trialResults.unshift(trialResult);
    
    if (trialResults.length > 20) {
      trialResults.splice(20);
    }
    
    await updateDoc(designerRef, {
      'stats.trialResults': trialResults,
      'stats.lastUpdated': new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    console.log('✅ Trial result tracked successfully');
  } catch (error) {
    console.error('❌ Error tracking trial result:', error);
  }
};

export const resetAnalytics = async (designerName: string): Promise<boolean> => {
  try {
    const currentData = await getDesignerData(designerName);
    
    const updatedData: DesignerData = {
      ...currentData,
      stats: {
        ...DEFAULT_STATS,
        lastUpdated: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };

    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, using localStorage for resetAnalytics');
      const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
      localData[designerName] = updatedData;
      localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
      return true;
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    const cleanedData = removeUndefinedFields(updatedData);
    await setDoc(designerRef, cleanedData);
    
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[designerName] = cleanedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error resetting analytics:', error);
    return false;
  }
};

export const exportDesignerData = async (designerName: string): Promise<string | null> => {
  try {
    const data = await getDesignerData(designerName);
    if (!data.portfolio.length && !data.profile) return null;
    
    return JSON.stringify({
      designerName,
      data,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }, null, 2);
  } catch (error) {
    console.error('❌ Error exporting designer data:', error);
    return null;
  }
};

export const importDesignerData = async (jsonData: string): Promise<boolean> => {
  try {
    const imported = JSON.parse(jsonData);
    
    if (!imported.designerName || !imported.data) {
      console.error('Invalid import data format');
      return false;
    }
    
    const updatedData = {
      ...imported.data,
      updatedAt: new Date().toISOString()
    };

    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, using localStorage for importDesignerData');
      const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
      localData[imported.designerName] = updatedData;
      localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
      return true;
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, imported.designerName);
    const cleanedData = removeUndefinedFields(updatedData);
    await setDoc(designerRef, cleanedData);
    
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[imported.designerName] = cleanedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error importing designer data:', error);
    return false;
  }
};

export const clearAllData = async (): Promise<boolean> => {
  try {
    localStorage.removeItem('hairfolio_designers');
    sessionStorage.clear();
    
    console.warn('⚠️ Cleared localStorage only. Firebase data preserved for safety.');
    return true;
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    return false;
  }
};

export const getStorageInfo = async () => {
  try {
    const localData = localStorage.getItem('hairfolio_designers') || '{}';
    const totalSize = new Blob([localData]).size;
    const designerCount = Object.keys(JSON.parse(localData)).length;
    
    return {
      totalSize,
      designerCount,
      formattedSize: formatBytes(totalSize),
      isNearLimit: false
    };
  } catch {
    return {
      totalSize: 0,
      designerCount: 0,
      formattedSize: '0 B',
      isNearLimit: false
    };
  }
};

export const getAnalyticsSummary = async (designerName: string) => {
  try {
    const data = await getDesignerData(designerName);
    const stats = data.stats!;
    
    const totalViews = Object.values(stats.styleViews || {}).reduce((sum, count) => sum + count, 0);
    const totalBookings = Object.values(stats.bookings || {}).reduce((sum, count) => sum + count, 0);
    
    const topViewedStyle = Object.entries(stats.styleViews || {})
      .sort(([, a], [, b]) => b - a)[0];
    
    const topBookedStyle = Object.entries(stats.bookings || {})
      .sort(([, a], [, b]) => b - a)[0];
    
    return {
      visits: stats.visits,
      totalViews,
      totalBookings,
      conversionRate: stats.conversionRate,
      topViewedStyle: topViewedStyle ? {
        url: topViewedStyle[0],
        count: topViewedStyle[1]
      } : null,
      topBookedStyle: topBookedStyle ? {
        url: topBookedStyle[0],
        count: topBookedStyle[1]
      } : null,
      popularStyles: stats.popularStyles,
      trialResults: stats.trialResults || [],
      lastUpdated: stats.lastUpdated
    };
  } catch (error) {
    console.error('❌ Error getting analytics summary:', error);
    return {
      visits: 0,
      totalViews: 0,
      totalBookings: 0,
      conversionRate: 0,
      topViewedStyle: null,
      topBookedStyle: null,
      popularStyles: [],
      trialResults: [],
      lastUpdated: new Date().toISOString()
    };
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
