// Loading states for UI components
export type LoadingState = 'idle' | 'analyzing' | 'generating' | 'error' | 'done';

// Gender types for hairstyle categorization
export type Gender = 'Female' | 'Male';

// Major categories for female hairstyles (by length)
export type FemaleMajorCategory = 
  | 'A length'  // Very short (pixie cuts, buzz cuts)
  | 'B length'  // Short (bob, chin length)
  | 'C length'  // Medium-short (shoulder length)
  | 'D length'  // Medium (mid-chest)
  | 'E length'  // Medium-long (chest length)
  | 'F length'  // Long (waist length)
  | 'G length'  // Very long (hip length)
  | 'H length'; // Extra long (tailbone length)

// Major categories for male hairstyles (by style)
export type MaleMajorCategory = 
  | 'SIDE FRINGE'  // Side-swept bangs
  | 'SIDE PART'    // Classic side part
  | 'FRINGE UP'    // Upward styled bangs
  | 'PUSHED BACK'  // Slicked back styles
  | 'BUZZ'         // Buzz cuts and crew cuts
  | 'CROP'         // Textured crops
  | 'MOHICAN';     // Mohawk and faux hawk styles

// Minor categories based on facial features highlighted
export type MinorCategory = 
  | 'None'       // No specific feature emphasis
  | 'Forehead'   // Emphasizes forehead
  | 'Eyebrow'    // Emphasizes eyebrow area
  | 'Eye'        // Emphasizes eyes
  | 'Cheekbone'; // Emphasizes cheekbones

// Hairstyle data structure
export interface Hairstyle {
  name: string;                                          // Display name
  url: string;                                          // Image URL
  isLocal?: boolean;                                    // Whether it's a locally uploaded image
  gender?: Gender;                                      // Target gender
  majorCategory?: FemaleMajorCategory | MaleMajorCategory; // Primary categorization
  minorCategory?: MinorCategory;                        // Secondary categorization
  description?: string;                                 // Optional description
  tags?: string[];                                     // Optional tags for searching
  uploadedAt?: Date;                                   // When it was uploaded
  uploadedBy?: string;                                 // Who uploaded it
}

// Analytics data for tracking designer portfolio performance
export interface DesignerStats {
  visits: number;                                      // Total portfolio visits
  styleViews: { [styleUrl: string]: number };         // Views per hairstyle
  bookings: { [styleUrl: string]: number };           // Bookings per hairstyle
  lastUpdated?: Date;                                  // When stats were last updated
}

// Complete designer data structure
export interface DesignerData {
  portfolio: Hairstyle[];                              // Designer's hairstyle collection
  reservationUrl?: string;                             // Naver reservation link
  stats?: DesignerStats;                              // Analytics data
  profile?: {                                         // Optional designer profile
    bio?: string;
    phone?: string;
    address?: string;
    socialLinks?: {
      instagram?: string;
      facebook?: string;
      website?: string;
    };
  };
  settings?: {                                        // Optional settings
    allowDirectBooking?: boolean;
    showStats?: boolean;
    theme?: 'light' | 'dark';
  };
}

// Form data types
export interface UploadStyleFormData {
  file: File;
  name: string;
  gender: Gender;
  majorCategory: FemaleMajorCategory | MaleMajorCategory;
  minorCategory: MinorCategory;
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

// Local storage keys (for type safety)
export const STORAGE_KEYS = {
  DESIGNERS: 'hairfolio_designers',
  SESSION_DESIGNER: 'hairfolio_designer',
  VISIT_TRACKED: 'hairfolio_visit_tracked_',
  USER_PREFERENCES: 'hairfolio_preferences'
} as const;

// API endpoints and configuration
export const API_CONFIG = {
  VMODEL_BASE_URL: 'https://api.vmodel.ai',
  QR_CODE_API: 'https://api.qrserver.com/v1/create-qr-code/',
  MAX_FILE_SIZE: 10, // MB
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  REQUEST_TIMEOUT: 30000 // 30 seconds
} as const;
