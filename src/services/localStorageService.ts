import { 
  Hairstyle, 
  DesignerData, 
  DesignerStats, 
  DesignerProfile,
  DesignerSettings,
  DEFAULT_STATS,
  DEFAULT_SETTINGS,
  STORAGE_KEYS 
} from '../types'
import { portfolioImages, sampleDesigner } from '../portfolioImages'

// Type for the entire database stored in local storage
type DesignerDB = {
  [designerName: string]: DesignerData
}

// Utility functions for safe localStorage operations
const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error)
    return null
  }
}

const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error)
    return false
  }
}

const safeRemoveItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error)
    return false
  }
}

// Get all designers from storage
const getDesigners = (): DesignerDB => {
  try {
    const db = safeGetItem(STORAGE_KEYS.DESIGNERS)
    return db ? JSON.parse(db) : {}
  } catch (error) {
    console.error('Failed to parse designers from localStorage:', error)
    return {}
  }
}

// Save all designers to storage
const saveDesigners = (db: DesignerDB): boolean => {
  try {
    return safeSetItem(STORAGE_KEYS.DESIGNERS, JSON.stringify(db))
  } catch (error) {
    console.error('Failed to save designers to localStorage:', error)
    return false
  }
}

// Generate unique ID for new items
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Initialize database with sample data
export const initializeDB = (): void => {
  const db = getDesigners()
  
  // Only initialize if empty
  if (Object.keys(db).length === 0) {
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
    }
    
    db['Sample Designer'] = sampleDesignerData
    saveDesigners(db)
  }
}

// Get designer data
export const getDesignerData = (designerName: string): DesignerData => {
  const db = getDesigners()
  const data = db[designerName]
  
  if (!data) {
    // Return empty data structure for new designers
    return {
      portfolio: [],
      stats: { ...DEFAULT_STATS },
      settings: { ...DEFAULT_SETTINGS },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
  
  // Ensure all required fields exist for backward compatibility
  return {
    ...data,
    stats: data.stats || { ...DEFAULT_STATS },
    settings: data.settings || { ...DEFAULT_SETTINGS },
    portfolio: data.portfolio || [],
    updatedAt: new Date().toISOString()
  }
}

// Save designer portfolio
export const savePortfolio = (designerName: string, portfolio: Hairstyle[]): boolean => {
  const db = getDesigners()
  const currentData = getDesignerData(designerName)
  
  // Ensure each style has required fields
  const updatedPortfolio = portfolio.map(style => ({
    ...style,
    id: style.id || generateId(),
    createdAt: style.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
  
  currentData.portfolio = updatedPortfolio
  currentData.updatedAt = new Date().toISOString()
  
  db[designerName] = currentData
  return saveDesigners(db)
}

// Add single style to portfolio
export const addStyleToPortfolio = (designerName: string, style: Hairstyle): boolean => {
  const db = getDesigners()
  const currentData = getDesignerData(designerName)
  
  const newStyle: Hairstyle = {
    ...style,
    id: style.id || generateId(),
    createdAt: style.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  currentData.portfolio = [newStyle, ...currentData.portfolio]
  currentData.updatedAt = new Date().toISOString()
  
  db[designerName] = currentData
  return saveDesigners(db)
}

// Remove style from portfolio
export const removeStyleFromPortfolio = (designerName: string, styleId: string): boolean => {
  const db = getDesigners()
  const currentData = getDesignerData(designerName)
  
  currentData.portfolio = currentData.portfolio.filter(style => style.id !== styleId)
  currentData.updatedAt = new Date().toISOString()
  
  db[designerName] = currentData
  return saveDesigners(db)
}

// Update style in portfolio
export const updateStyleInPortfolio = (designerName: string, styleId: string, updates: Partial<Hairstyle>): boolean => {
  const db = getDesigners()
  const currentData = getDesignerData(designerName)
  
  const styleIndex = currentData.portfolio.findIndex(style => style.id === styleId)
  if (styleIndex === -1) return false
  
  currentData.portfolio[styleIndex] = {
    ...currentData.portfolio[styleIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  currentData.updatedAt = new Date().toISOString()
  db[designerName] = currentData
  return saveDesigners(db)
}

// Save designer profile
export const saveDesignerProfile = (designerName: string, profile: DesignerProfile): boolean => {
  const db = getDesigners()
  const currentData = getDesignerData(designerName)
  
  currentData.profile = profile
  currentData.updatedAt = new Date().toISOString()
  
  db[designerName] = currentData
  return saveDesigners(db)
}

// Save designer settings
export const saveDesignerSettings = (designerName: string, settings: DesignerSettings): boolean => {
  const db = getDesigners()
  const currentData = getDesignerData(designerName)
  
  currentData.settings = settings
  currentData.updatedAt = new Date().toISOString()
  
  db[designerName] = currentData
  return saveDesigners(db)
}

// Save reservation URL
export const saveReservationUrl = (designerName: string, url: string): boolean => {
  const db = getDesigners()
  const currentData = getDesignerData(designerName)
  
  currentData.reservationUrl = url
  currentData.updatedAt = new Date().toISOString()
  
  db[designerName] = currentData
  return saveDesigners(db)
}

// Check if designer exists
export const designerExists = (designerName: string): boolean => {
  const db = getDesigners()
  return designerName in db
}

// Get all designer names
export const getAllDesignerNames = (): string[] => {
  const db = getDesigners()
  return Object.keys(db)
}

// Delete designer
export const deleteDesigner = (designerName: string): boolean => {
  const db = getDesigners()
  
  if (!(designerName in db)) return false
  
  delete db[designerName]
  return saveDesigners(db)
}

// --- Analytics Functions ---

// Track visit (once per session)
export const trackVisit = (designerName: string): void => {
  const sessionKey = `${STORAGE_KEYS.VISIT_TRACKING}_${designerName}`
  
  // Check if already tracked this session
  if (sessionStorage.getItem(sessionKey)) {
    return
  }
  
  const db = getDesigners()
  if (!db[designerName]) return
  
  const data = getDesignerData(designerName)
  data.stats!.visits = (data.stats!.visits || 0) + 1
  data.stats!.lastUpdated = new Date().toISOString()
  data.updatedAt = new Date().toISOString()
  
  db[designerName] = data
  saveDesigners(db)
  
  // Mark as tracked for this session
  sessionStorage.setItem(sessionKey, 'true')
}

// Track style view/try-on
export const trackStyleView = (designerName: string, styleUrl: string): void => {
  const db = getDesigners()
  if (!db[designerName]) return
  
  const data = getDesignerData(designerName)
  const styleViews = data.stats!.styleViews || {}
  
  styleViews[styleUrl] = (styleViews[styleUrl] || 0) + 1
  data.stats!.styleViews = styleViews
  data.stats!.totalTryOns = (data.stats!.totalTryOns || 0) + 1
  data.stats!.lastUpdated = new Date().toISOString()
  data.updatedAt = new Date().toISOString()
  
  // Update popular styles
  updatePopularStyles(data.stats!)
  
  db[designerName] = data
  saveDesigners(db)
}

// Track booking
export const trackBooking = (designerName: string, styleUrl: string): void => {
  const db = getDesigners()
  if (!db[designerName]) return
  
  const data = getDesignerData(designerName)
  const bookings = data.stats!.bookings || {}
  
  bookings[styleUrl] = (bookings[styleUrl] || 0) + 1
  data.stats!.bookings = bookings
  data.stats!.lastUpdated = new Date().toISOString()
  data.updatedAt = new Date().toISOString()
  
  // Update conversion rate
  updateConversionRate(data.stats!)
  
  db[designerName] = data
  saveDesigners(db)
}

// Helper: Update popular styles list
const updatePopularStyles = (stats: DesignerStats): void => {
  const styleEntries = Object.entries(stats.styleViews || {})
  const sortedStyles = styleEntries
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([styleUrl]) => styleUrl)
  
  stats.popularStyles = sortedStyles
}

// Helper: Update conversion rate
const updateConversionRate = (stats: DesignerStats): void => {
  const totalViews = Object.values(stats.styleViews || {}).reduce((sum, count) => sum + count, 0)
  const totalBookings = Object.values(stats.bookings || {}).reduce((sum, count) => sum + count, 0)
  
  stats.conversionRate = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0
}

// Get analytics summary
export const getAnalyticsSummary = (designerName: string) => {
  const data = getDesignerData(designerName)
  const stats = data.stats!
  
  const totalViews = Object.values(stats.styleViews || {}).reduce((sum, count) => sum + count, 0)
  const totalBookings = Object.values(stats.bookings || {}).reduce((sum, count) => sum + count, 0)
  
  // Find top performing styles
  const topViewedStyle = Object.entries(stats.styleViews || {})
    .sort(([, a], [, b]) => b - a)[0]
  
  const topBookedStyle = Object.entries(stats.bookings || {})
    .sort(([, a], [, b]) => b - a)[0]
  
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
    lastUpdated: stats.lastUpdated
  }
}

// Reset analytics data
export const resetAnalytics = (designerName: string): boolean => {
  const db = getDesigners()
  if (!db[designerName]) return false
  
  const data = getDesignerData(designerName)
  data.stats = {
    ...DEFAULT_STATS,
    lastUpdated: new Date().toISOString()
  }
  data.updatedAt = new Date().toISOString()
  
  db[designerName] = data
  return saveDesigners(db)
}

// --- Backup and Restore Functions ---

// Export designer data
export const exportDesignerData = (designerName: string): string | null => {
  const data = getDesignerData(designerName)
  if (!data.portfolio.length && !data.profile) return null
  
  try {
    return JSON.stringify({
      designerName,
      data,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }, null, 2)
  } catch (error) {
    console.error('Error exporting designer data:', error)
    return null
  }
}

// Import designer data
export const importDesignerData = (jsonData: string): boolean => {
  try {
    const imported = JSON.parse(jsonData)
    
    if (!imported.designerName || !imported.data) {
      console.error('Invalid import data format')
      return false
    }
    
    const db = getDesigners()
    db[imported.designerName] = {
      ...imported.data,
      updatedAt: new Date().toISOString()
    }
    
    return saveDesigners(db)
  } catch (error) {
    console.error('Error importing designer data:', error)
    return false
  }
}

// Clear all data (use with caution)
export const clearAllData = (): boolean => {
  try {
    safeRemoveItem(STORAGE_KEYS.DESIGNERS)
    safeRemoveItem(STORAGE_KEYS.SETTINGS)
    
    // Clear session data
    sessionStorage.clear()
    
    return true
  } catch (error) {
    console.error('Error clearing all data:', error)
    return false
  }
}

// Get storage usage info
export const getStorageInfo = () => {
  try {
    const designersData = safeGetItem(STORAGE_KEYS.DESIGNERS) || '{}'
    const settingsData = safeGetItem(STORAGE_KEYS.SETTINGS) || '{}'
    
    const totalSize = new Blob([designersData, settingsData]).size
    const designerCount = Object.keys(JSON.parse(designersData)).length
    
    return {
      totalSize,
      designerCount,
      formattedSize: formatBytes(totalSize),
      isNearLimit: totalSize > 5 * 1024 * 1024 // 5MB warning
    }
  } catch {
    return {
      totalSize: 0,
      designerCount: 0,
      formattedSize: '0 B',
      isNearLimit: false
    }
  }
}

// Helper: Format bytes to readable string
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
