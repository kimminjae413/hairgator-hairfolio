import { Hairstyle, DesignerData, DesignerStats } from '../types';
import { portfolioImages as defaultPortfolio } from '../portfolioImages';

const DB_KEY = 'hairfolio_designers';
const SAMPLE_DESIGNER_NAME = 'Sample Designer';

// Type for the entire database stored in local storage
type DesignerDB = {
  [key: string]: DesignerData;
};

const getDesigners = (): DesignerDB => {
  try {
    const db = localStorage.getItem(DB_KEY);
    return db ? JSON.parse(db) : {};
  } catch (error) {
    console.error("Failed to parse designers from local storage:", error);
    return {};
  }
};

const saveDesigners = (db: DesignerDB): void => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (error) {
    console.error("Failed to save designers to local storage:", error);
  }
};

const defaultStats: DesignerStats = {
  visits: 0,
  styleViews: {},
  bookings: {},
};

export const initializeDB = (): void => {
  const db = getDesigners();
  if (Object.keys(db).length === 0) {
    db[SAMPLE_DESIGNER_NAME] = { 
      portfolio: defaultPortfolio,
      reservationUrl: '',
      stats: defaultStats,
    };
    saveDesigners(db);
  }
};

export const getDesignerData = (designerName: string): DesignerData => {
  const db = getDesigners();
  const data = db[designerName] || { portfolio: [], reservationUrl: '', stats: defaultStats };
  // Ensure stats object exists for backward compatibility
  if (!data.stats) {
    data.stats = defaultStats;
  }
  return data;
};

export const savePortfolio = (designerName: string, portfolio: Hairstyle[]): void => {
  const db = getDesigners();
  // When creating a new designer, ensure they have a stats object
  const currentData = db[designerName] || { portfolio: [], reservationUrl: '', stats: defaultStats };
  currentData.portfolio = portfolio;
  db[designerName] = currentData;
  saveDesigners(db);
};

export const saveReservationUrl = (designerName: string, url: string): void => {
    const db = getDesigners();
    const currentData = getDesignerData(designerName);
    currentData.reservationUrl = url;
    db[designerName] = currentData;
    saveDesigners(db);
};

export const designerExists = (designerName: string): boolean => {
  const db = getDesigners();
  return designerName in db;
};

// --- Analytics Functions ---

export const trackVisit = (designerName: string): void => {
  const sessionKey = `hairfolio_visit_tracked_${designerName}`;
  if (sessionStorage.getItem(sessionKey)) {
    return; // Already tracked this session
  }

  const db = getDesigners();
  if (!db[designerName]) return;
  const data = getDesignerData(designerName);
  data.stats!.visits = (data.stats!.visits || 0) + 1;
  db[designerName] = data;
  saveDesigners(db);

  sessionStorage.setItem(sessionKey, 'true');
};

export const trackStyleView = (designerName: string, styleUrl: string): void => {
  const db = getDesigners();
  if (!db[designerName]) return;
  const data = getDesignerData(designerName);
  const styleViews = data.stats!.styleViews || {};
  styleViews[styleUrl] = (styleViews[styleUrl] || 0) + 1;
  data.stats!.styleViews = styleViews;
  db[designerName] = data;
  saveDesigners(db);
};


export const trackBooking = (designerName: string, styleUrl: string): void => {
    const db = getDesigners();
    if (!db[designerName]) return;
    const data = getDesignerData(designerName);
    const bookings = data.stats!.bookings || {};
    bookings[styleUrl] = (bookings[styleUrl] || 0) + 1;
    data.stats!.bookings = bookings;
    db[designerName] = data;
    saveDesigners(db);
};