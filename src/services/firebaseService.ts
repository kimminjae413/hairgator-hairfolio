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
      // Return
