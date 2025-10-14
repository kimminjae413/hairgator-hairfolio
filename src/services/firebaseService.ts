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
  deleteDoc
} from "firebase/firestore";
import { 
  Hairstyle, 
  DesignerData, 
  DesignerStats, 
  DesignerProfile,
  DesignerSettings,
  TrialResult,
  DEFAULT_STATS,
  DEFAULT_SETTINGS
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
  // Firebase 초기화 실패시에도 앱이 동작하도록 null로 설정
  app = null;
  db = null;
}

// 컬렉션 레퍼런스
const COLLECTIONS = {
  DESIGNERS: 'designers'
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

// Initialize database with sample data
export const initializeDB = async (): Promise<void> => {
  try {
    if (!isFirebaseAvailable()) {
      console.warn('⚠️ Firebase not available, using localStorage fallback');
      // Fallback to localStorage if Firebase fails
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
    
    // Only initialize if Sample Designer doesn't exist
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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      code: (error as any)?.code || 'No code',
      name: (error as any)?.name || 'No name'
    });
    
    // Fallback to localStorage if Firebase fails
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

// Get designer data
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
      // Return empty data structure for new designers
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
    // Fallback to localStorage
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

// Save designer portfolio
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
    
    // Ensure each style has required fields
    const updatedPortfolio = portfolio.map(style => ({
      ...style,
      id: style.id || generateId(),
      createdAt: style.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    // Get existing data or create new
    const existingData = await getDesignerData(designerName);
    
    const updatedData: DesignerData = {
      ...existingData,
      portfolio: updatedPortfolio,
      updatedAt: new Date().toISOString()
    };
    
    const cleanedData = removeUndefinedFields(updatedData);
    await setDoc(designerRef, cleanedData);
    
    // Also update localStorage as backup
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[designerName] = cleanedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error saving portfolio to Firebase:', error);
    return false;
  }
};

// Add single style to portfolio
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
    
    // Also update localStorage as backup
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[designerName] = cleanedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error adding style to portfolio:', error);
    return false;
  }
};

// Remove style from portfolio
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

// Update style in portfolio
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

// Save designer profile
export const saveDesignerProfile = async (designerName: string, profile: DesignerProfile): Promise<boolean> => {
  try {
    const currentData = await getDesignerData(designerName);
    
    const updatedData: DesignerData = {
      ...currentData,
      profile,
      updatedAt: new Date().toISOString()
    };

    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, using localStorage for saveDesignerProfile');
      const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
      localData[designerName] = updatedData;
      localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
      return true;
    }

    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    const cleanedData = removeUndefinedFields(updatedData);
    await setDoc(designerRef, cleanedData);
    
    // Also update localStorage
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[designerName] = cleanedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error saving designer profile:', error);
    return false;
  }
};

// Save designer settings
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
    
    // Also update localStorage
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[designerName] = cleanedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error saving designer settings:', error);
    return false;
  }
};

// Save reservation URL
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
    
    // Also update localStorage
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[designerName] = cleanedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error saving reservation URL:', error);
    return false;
  }
};

// Check if designer exists
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
    // Fallback to localStorage
    const localData = localStorage.getItem('hairfolio_designers');
    if (localData) {
      const designers = JSON.parse(localData);
      return designerName in designers;
    }
    return false;
  }
};

// Get all designer names
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
    // Fallback to localStorage
    const localData = localStorage.getItem('hairfolio_designers');
    if (localData) {
      return Object.keys(JSON.parse(localData));
    }
    return [];
  }
};

// Delete designer
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
    
    // Also remove from localStorage
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    delete localData[designerName];
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting designer:', error);
    return false;
  }
};

// Track visit (once per session)
export const trackVisit = async (designerName: string): Promise<void> => {
  const sessionKey = `hairfolio_visit_tracked_${designerName}`;
  
  // Check if already tracked this session
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
    
    // Mark as tracked for this session
    sessionStorage.setItem(sessionKey, 'true');
  } catch (error) {
    console.error('❌ Error tracking visit:', error);
  }
};

// Track style view/try-on
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

// Track booking
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
    
    // Calculate conversion rate
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

// Track trial result (NEW FUNCTION)
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
    trialResults.unshift(trialResult); // Add to beginning
    
    // Keep only the most recent 20 trial results (용량 관리)
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
    // Silently fail - don't interrupt user experience
  }
};

// Clean up invalid blob URLs from trial results
export const cleanupInvalidTrialResults = async (designerName: string): Promise<void> => {
  try {
    if (!isFirebaseAvailable()) {
      console.log('⚠️ Firebase not available, skipping cleanup');
      return;
    }

    const currentData = await getDesignerData(designerName);
    const trialResults = currentData.stats?.trialResults || [];
    
    // Blob URL이나 유효하지 않은 URL 제거
    const validTrialResults = trialResults.filter(trial => {
      const isValid = !trial.resultUrl.startsWith('blob:') && 
                     (trial.resultUrl.startsWith('http') || trial.resultUrl.startsWith('https'));
      
      if (!isValid) {
        console.log('🧹 Invalid trial result removed:', {
          styleName: trial.styleName,
          timestamp: trial.timestamp,
          url: trial.resultUrl.substring(0, 50) + '...'
        });
      }
      
      return isValid;
    });
    
    if (validTrialResults.length !== trialResults.length) {
      const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
      await updateDoc(designerRef, {
        'stats.trialResults': validTrialResults,
        'stats.lastUpdated': new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log(`✅ Cleaned up ${trialResults.length - validTrialResults.length} invalid trial results`);
    } else {
      console.log('✅ No invalid trial results found');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up trial results:', error);
  }
};

// Reset analytics data
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
    
    // Also update localStorage
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[designerName] = cleanedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error resetting analytics:', error);
    return false;
  }
};

// Export designer data
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

// Import designer data
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
    
    // Also update localStorage
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[imported.designerName] = cleanedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('❌ Error importing designer data:', error);
    return false;
  }
};

// Clear all data (use with caution)
export const clearAllData = async (): Promise<boolean> => {
  try {
    // This is dangerous - only clear localStorage for safety
    localStorage.removeItem('hairfolio_designers');
    sessionStorage.clear();
    
    console.warn('⚠️ Cleared localStorage only. Firebase data preserved for safety.');
    return true;
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    return false;
  }
};

// Get storage info
export const getStorageInfo = async () => {
  try {
    const localData = localStorage.getItem('hairfolio_designers') || '{}';
    const totalSize = new Blob([localData]).size;
    const designerCount = Object.keys(JSON.parse(localData)).length;
    
    return {
      totalSize,
      designerCount,
      formattedSize: formatBytes(totalSize),
      isNearLimit: false // Firebase has much higher limits
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

// Get analytics summary
export const getAnalyticsSummary = async (designerName: string) => {
  try {
    const data = await getDesignerData(designerName);
    const stats = data.stats!;
    
    const totalViews = Object.values(stats.styleViews || {}).reduce((sum, count) => sum + count, 0);
    const totalBookings = Object.values(stats.bookings || {}).reduce((sum, count) => sum + count, 0);
    
    // Find top performing styles
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

// Helper: Format bytes to readable string
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
