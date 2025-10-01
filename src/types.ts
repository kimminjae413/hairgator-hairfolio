// Loading states for UI components
export type LoadingState = 'idle' | 'analyzing' | 'generating' | 'error' | 'done';

// Gender types for hairstyle categorization
export type Gender = 'Female' | 'Male';

// ===== NEW SERVICE-BASED CATEGORY SYSTEM =====
// Service-based major categories (required selection)
export type ServiceMajorCategory = 
  | 'cut'        // 커트 (Cut)
  | 'color'      // 염색 (Color/Dye)
  | 'perm'       // 펌 (Perm)
  | 'styling'    // 스타일링 (Styling)
  | 'treatment'  // 트리트먼트 (Treatment)
  | 'other';     // 기타 (Other)

// Service sub-categories (user input - optional)
export type ServiceMinorCategory = string;

// ===== LEGACY CATEGORIES (DEPRECATED) =====
// Major categories for female hairstyles (by length) - DEPRECATED
export type FemaleMajorCategory = 
  | 'A length'  // Very short (pixie cuts, buzz cuts)
  | 'B length'  // Short (bob, chin length)
  | 'C length'  // Medium-short (shoulder length)
  | 'D length'  // Medium (mid-chest)
  | 'E length'  // Medium-long (chest length)
  | 'F length'  // Long (waist length)
  | 'G length'  // Very long (hip length)
  | 'H length'; // Extra long (tailbone length)

// Major categories for male hairstyles (by style) - DEPRECATED
export type MaleMajorCategory = 
  | 'SIDE FRINGE'  // Side-swept bangs
  | 'SIDE PART'    // Classic side part
  | 'FRINGE UP'    // Upward styled bangs
  | 'PUSHED BACK'  // Slicked back styles
  | 'BUZZ'         // Buzz cuts and crew cuts
  | 'CROP'         // Textured crops
  | 'MOHICAN';     // Mohawk and faux hawk styles

// Minor categories based on facial features highlighted - DEPRECATED
export type MinorCategory = 
  | 'None'       // No specific feature emphasis
  | 'Forehead'   // Emphasizes forehead
  | 'Eyebrow'    // Emphasizes eyebrow area
  | 'Eye'        // Emphasizes eyes
  | 'Cheekbone'; // Emphasizes cheekbones

// Hairstyle data structure - Updated with new service categories
export interface Hairstyle {
  id?: string;                                          // Unique identifier
  name: string;                                         // Display name
  url: string;                                         // Image URL
  isLocal?: boolean;                                   // Whether it's a locally uploaded image
  gender?: Gender;                                     // Target gender
  
  // NEW: Service-based categorization (preferred)
  serviceCategory?: ServiceMajorCategory;              // Primary service categorization
  serviceSubCategory?: ServiceMinorCategory;           // Secondary service categorization (user input)
  
  // LEGACY: Length/style-based categorization (deprecated but maintained for compatibility)
  majorCategory?: FemaleMajorCategory | MaleMajorCategory; // Primary categorization
  minorCategory?: MinorCategory;                       // Secondary categorization
  
  description?: string;                                // Optional description
  tags?: string[];                                     // Optional tags for searching
  uploadedAt?: Date;                                   // When it was uploaded
  uploadedBy?: string;                                 // Who uploaded it
  createdAt?: string;                                  // ISO date string
  updatedAt?: string;                                  // ISO date string
}

// Trial result data structure
export interface TrialResult {
  styleUrl: string;                                    // 적용한 헤어스타일 URL
  resultUrl: string;                                   // VModel 생성 결과 이미지 URL
  timestamp: string;                                   // 체험 시간 (ISO string)
  styleName?: string;                                  // 헤어스타일 이름 (선택사항)
}

// Analytics data for tracking designer portfolio performance
export interface DesignerStats {
  visits: number;                                      // Total portfolio visits
  styleViews: { [styleUrl: string]: number };         // Views per hairstyle
  bookings: { [styleUrl: string]: number };           // Bookings per hairstyle
  totalTryOns?: number;                               // Total style try-ons
  conversionRate?: number;                            // Booking conversion rate
  popularStyles?: string[];                           // Top performing style URLs
  trialResults?: TrialResult[];                       // Recent client try-on results
  lastUpdated?: string;                               // ISO date string
}

// Designer profile data
export interface DesignerProfile {
  name?: string;
  bio?: string;
  phone?: string;
  location?: string;
  address?: string;
  profileImage?: string;                              // Profile image URL
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  brandSettings?: {
    salonName?: string;        // 매장명 (기본값: "Hairfolio")  
    fontFamily?: string;       // 글씨체
    textColor?: string;        // 텍스트 색상
    showSubtitle?: boolean;    // "AI로 새로운..." 표시 여부
  };
}

// Designer settings
export interface DesignerSettings {
  allowDirectBooking?: boolean;
  showStats?: boolean;
  theme?: 'light' | 'dark';
}

// Complete designer data structure
export interface DesignerData {
  portfolio: Hairstyle[];                              // Designer's hairstyle collection
  reservationUrl?: string;                             // Naver reservation link
  stats?: DesignerStats;                              // Analytics data
  profile?: DesignerProfile;                          // Designer profile
  settings?: DesignerSettings;                        // Designer settings
  createdAt?: string;                                 // ISO date string
  updatedAt?: string;                                 // ISO date string
}

// Form data types - Updated to support both new and legacy systems
export interface UploadStyleFormData {
  file: File;
  name: string;
  gender: Gender;
  
  // NEW: Service-based categories (preferred)
  serviceCategory?: ServiceMajorCategory;
  serviceSubCategory?: ServiceMinorCategory;
  
  // LEGACY: For backward compatibility (deprecated)
  majorCategory?: FemaleMajorCategory | MaleMajorCategory;
  minorCategory?: MinorCategory;
  
  description?: string;
  tags?: string[];
}

// UI component prop types
export interface HairstyleGalleryProps {
  images: Hairstyle[];
  onSelect: (hairstyle: Hairstyle) => void;
  selectedUrl: string | null;
  disabled: boolean;
  onAddImage?: () => void;
  showCategories?: boolean;
  allowMultipleSelection?: boolean;
}

export interface ImageUploaderProps {
  id: string;
  label: string;
  previewSrc: string | null;
  onFileChange: (file: File | null) => void;
  icon: React.ReactNode;
  disabled?: boolean;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
}

// Error handling types
export interface AppError {
  message: string;
  code?: string;
  timestamp: Date;
  stack?: string;
}

// VModel API types
export interface VModelRequest {
  faceImage: string;
  styleImage: string;
  styleDescription: string;
  options?: {
    quality?: 'high' | 'medium' | 'low';
    preserveFaceFeatures?: boolean;
    blendStrength?: number;
  };
}

export interface VModelResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  processingTime?: number;
}

// ===== NEW SERVICE CATEGORY CONSTANTS =====
// Service category constants
export const SERVICE_MAJOR_CATEGORIES: ServiceMajorCategory[] = [
  'cut',
  'color', 
  'perm',
  'styling',
  'treatment',
  'other'
];

// Service category display names (for i18n)
export const SERVICE_CATEGORY_LABELS = {
  cut: 'Cut',
  color: 'Color',
  perm: 'Perm', 
  styling: 'Styling',
  treatment: 'Treatment',
  other: 'Other'
} as const;

// Common sub-category suggestions by service type
export const SERVICE_SUBCATEGORY_SUGGESTIONS = {
  cut: [
    'Bob Cut', 'Pixie Cut', 'Layer Cut', 'Shag Cut', 'Wolf Cut',
    'Buzz Cut', 'Fade Cut', 'Undercut', 'Crew Cut', 'Pompadour',
    'Long Layer', 'Short Bob', 'Asymmetric Cut', 'Graduation Cut'
  ],
  color: [
    'Full Color', 'Highlights', 'Lowlights', 'Balayage', 'Ombre',
    'Gradient', 'Two-tone', 'Fantasy Color', 'Root Touch-up', 'Color Correction',
    'Bleaching', 'Tone-on-Tone', 'Foil Highlights', 'Cap Highlights'
  ],
  perm: [
    'Digital Perm', 'Cold Perm', 'Hot Perm', 'Root Perm', 'Point Perm',
    'Body Wave', 'Spiral Perm', 'Beach Wave', 'Volume Perm', 'Setting Perm',
    'Straightening Perm', 'Relaxer', 'Keratin Treatment'
  ],
  styling: [
    'Blow Dry', 'Curling', 'Straightening', 'Braiding', 'Updo',
    'Half Up', 'Beach Waves', 'Vintage Style', 'Party Style', 'Casual Style',
    'Wedding Style', 'Event Styling', 'Daily Styling'
  ],
  treatment: [
    'Hair Treatment', 'Scalp Treatment', 'Protein Treatment', 'Moisture Treatment', 'Keratin Treatment',
    'Hair Mask', 'Deep Conditioning', 'Damage Repair', 'Anti-aging Treatment', 'Scalp Massage',
    'Oil Treatment', 'Steam Treatment', 'Vitamin Treatment'
  ],
  other: [
    'Consultation', 'Hair Extension', 'Hair Piece', 'Wig Styling', 'Special Occasion',
    'Bridal Hair', 'Photo Shoot', 'Fashion Show', 'Color Consultation', 'Style Consultation',
    'Hair Analysis', 'Maintenance Guide'
  ]
} as const;

// ===== LEGACY CATEGORY CONSTANTS (DEPRECATED) =====
// Legacy category constants for backward compatibility
export const FEMALE_MAJOR_CATEGORIES: FemaleMajorCategory[] = [
  'A length', 'B length', 'C length', 'D length', 
  'E length', 'F length', 'G length', 'H length'
];

export const MALE_MAJOR_CATEGORIES: MaleMajorCategory[] = [
  'SIDE FRINGE', 'SIDE PART', 'FRINGE UP', 'PUSHED BACK', 
  'BUZZ', 'CROP', 'MOHICAN'
];

export const MINOR_CATEGORIES: MinorCategory[] = [
  'None', 'Forehead', 'Eyebrow', 'Eye', 'Cheekbone'
];

// ===== UTILITY FUNCTIONS =====
// Function to migrate legacy category to service category
export const migrateLegacyToService = (hairstyle: Hairstyle): Partial<Hairstyle> => {
  // If already has service category, return as is
  if (hairstyle.serviceCategory) {
    return hairstyle;
  }

  // Try to infer service category from legacy categories
  let serviceCategory: ServiceMajorCategory = 'cut'; // default
  let serviceSubCategory: ServiceMinorCategory = '';

  if (hairstyle.majorCategory) {
    // Convert legacy major category to service category
    if (hairstyle.majorCategory.includes('length')) {
      serviceCategory = 'cut';
      serviceSubCategory = hairstyle.majorCategory;
    } else {
      // Male categories are mostly cuts/styling
      serviceCategory = 'cut';
      serviceSubCategory = hairstyle.majorCategory;
    }
  }

  return {
    ...hairstyle,
    serviceCategory,
    serviceSubCategory: serviceSubCategory || undefined
  };
};

// Function to get display category (prioritizes service over legacy)
export const getDisplayCategory = (hairstyle: Hairstyle): string => {
  if (hairstyle.serviceCategory) {
    if (hairstyle.serviceSubCategory) {
      return `${SERVICE_CATEGORY_LABELS[hairstyle.serviceCategory]} - ${hairstyle.serviceSubCategory}`;
    }
    return SERVICE_CATEGORY_LABELS[hairstyle.serviceCategory];
  }
  
  // Fallback to legacy category
  if (hairstyle.majorCategory) {
    return hairstyle.majorCategory;
  }
  
  return 'Uncategorized';
};

// Default values for new designers
export const DEFAULT_STATS: DesignerStats = {
  visits: 0,
  styleViews: {},
  bookings: {},
  totalTryOns: 0,
  conversionRate: 0,
  popularStyles: [],
  trialResults: [],
  lastUpdated: new Date().toISOString()
};

export const DEFAULT_SETTINGS: DesignerSettings = {
  allowDirectBooking: true,
  showStats: true,
  theme: 'light'
};

// Local storage keys (for type safety)
export const STORAGE_KEYS = {
  DESIGNERS: 'hairfolio_designers',
  SESSION_DESIGNER: 'hairfolio_designer',
  VISIT_TRACKING: 'hairfolio_visit_tracked',
  SETTINGS: 'hairfolio_settings'
} as const;

// API endpoints and configuration
export const API_CONFIG = {
  VMODEL_BASE_URL: 'https://api.vmodel.ai',
  QR_CODE_API: 'https://api.qrserver.com/v1/create-qr-code/',
  MAX_FILE_SIZE: 10, // MB
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  REQUEST_TIMEOUT: 30000 // 30 seconds
} as const;
