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
  DEFAULT_STATS,
  DEFAULT_SETTINGS
} from '../types';
import { portfolioImages, sampleDesigner } from '../portfolioImages';

const firebaseConfig = {
  apiKey: "AIzaSyAPUhZggVQqB1m7og2IxPPEcZjzZk0VflU",
  authDomain: "hairfolio-9b7db.firebaseapp.com",
  projectId: "hairfolio-9b7db",
  storageBucket: "hairfolio-9b7db.firebasestorage.app",
  messagingSenderId: "243350842007",
  appId: "1:243350842007:web:57c08df1256bf63ae157d2",
  measurementId: "G-3GMLY9JKEP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 컬렉션 레퍼런스
const COLLECTIONS = {
  DESIGNERS: 'designers'
} as const;

// Generate unique ID for new items
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Initialize database with sample data
export const initializeDB = async (): Promise<void> => {
  try {
    const sampleDesignerRef = doc(db, COLLECTIONS.DESIGNERS, 'Sample Designer');
    const sampleDesignerSnap = await getDoc(sampleDesignerRef);
    
    // Only initialize if Sample Designer doesn't exist
    if (!sampleDesignerSnap.exists()) {
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
      
      await setDoc(sampleDesignerRef, sampleDesignerData);
      console.log('Sample designer initialized in Firebase');
    }
  } catch (error) {
    console.error('Error initializing Firebase DB:', error);
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
    }
  }
};

// Get designer data
export const getDesignerData = async (designerName: string): Promise<DesignerData> => {
  try {
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
    console.error('Error getting designer data from Firebase:', error);
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
    
    await setDoc(designerRef, updatedData);
    
    // Also update localStorage as backup
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[designerName] = updatedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('Error saving portfolio to Firebase:', error);
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
    return await savePortfolio(designerName, updatedPortfolio);
  } catch (error) {
    console.error('Error adding style to portfolio:', error);
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
    console.error('Error removing style from portfolio:', error);
    return false;
  }
};

// Save designer profile
export const saveDesignerProfile = async (designerName: string, profile: DesignerProfile): Promise<boolean> => {
  try {
    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    const currentData = await getDesignerData(designerName);
    
    const updatedData: DesignerData = {
      ...currentData,
      profile,
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(designerRef, updatedData);
    
    // Also update localStorage
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[designerName] = updatedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('Error saving designer profile:', error);
    return false;
  }
};

// Save reservation URL
export const saveReservationUrl = async (designerName: string, url: string): Promise<boolean> => {
  try {
    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    const currentData = await getDesignerData(designerName);
    
    const updatedData: DesignerData = {
      ...currentData,
      reservationUrl: url,
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(designerRef, updatedData);
    
    // Also update localStorage
    const localData = JSON.parse(localStorage.getItem('hairfolio_designers') || '{}');
    localData[designerName] = updatedData;
    localStorage.setItem('hairfolio_designers', JSON.stringify(localData));
    
    return true;
  } catch (error) {
    console.error('Error saving reservation URL:', error);
    return false;
  }
};

// Check if designer exists
export const designerExists = async (designerName: string): Promise<boolean> => {
  try {
    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    const designerSnap = await getDoc(designerRef);
    return designerSnap.exists();
  } catch (error) {
    console.error('Error checking if designer exists:', error);
    // Fallback to localStorage
    const localData = localStorage.getItem('hairfolio_designers');
    if (localData) {
      const designers = JSON.parse(localData);
      return designerName in designers;
    }
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
    const designerRef = doc(db, COLLECTIONS.DESIGNERS, designerName);
    
    await updateDoc(designerRef, {
      'stats.visits': increment(1),
      'stats.lastUpdated': new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // Mark as tracked for this session
    sessionStorage.setItem(sessionKey, 'true');
  } catch (error) {
    console.error('Error tracking visit:', error);
  }
};

// Track style view/try-on
export const trackStyleView = async (designerName: string, styleUrl: string): Promise<void> => {
  try {
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
    console.error('Error tracking style view:', error);
  }
};

// Track booking
export const trackBooking = async (designerName: string, styleUrl: string): Promise<void> => {
  try {
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
    console.error('Error tracking booking:', error);
  }
};

// Export for backward compatibility with existing code
export {
  // These functions maintain the same interface as localStorageService
  updateStyleInPortfolio,
  saveDesignerSettings,
  getAllDesignerNames,
  deleteDesigner,
  resetAnalytics,
  exportDesignerData,
  importDesignerData,
  clearAllData,
  getStorageInfo,
  getAnalyticsSummary
} from './localStorageService';

// Additional Firebase-specific functions can be added here
