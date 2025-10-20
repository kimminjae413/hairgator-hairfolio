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

// ===== FACE ANALYSIS TYPES =====

/**
 * 얼굴형 타입 (7가지)
 */
export type FaceShapeType = 
  | '계란형'          // Oval - 이상적인 균형잡힌 얼굴형
  | '둥근형'          // Round - 부드러운 곡선
  | '각진형'          // Square - 강한 턱선
  | '하트형'          // Heart - 이마가 넓고 턱이 뾰족
  | '긴 얼굴형'       // Long/Oblong - 세로로 긴 형태
  | '다이아몬드형'    // Diamond - 광대가 돋보임
  | '타원형'          // Oval-round - 계란형과 둥근형 중간
  | '알 수 없음';     // Unknown

/**
 * 퍼스널 컬러 타입 (4계절)
 */
export type PersonalColorType = 
  | '봄 웜톤'    // Spring Warm - 밝고 따뜻한 톤
  | '여름 쿨톤'  // Summer Cool - 부드러운 차가운 톤
  | '가을 웜톤'  // Autumn Warm - 깊고 따뜻한 톤
  | '겨울 쿨톤'  // Winter Cool - 선명한 차가운 톤
  | null;

/**
 * 얼굴 랜드마크 포인트 (MediaPipe Face Mesh - 468개)
 */
export interface FaceLandmark {
  x: number;  // 정규화된 X 좌표 (0-1)
  y: number;  // 정규화된 Y 좌표 (0-1)
  z: number;  // 깊이 정보 (상대적)
}

/**
 * 피부톤 정보
 */
export interface SkinTone {
  r: number;    // Red 값 (0-255)
  g: number;    // Green 값 (0-255)
  b: number;    // Blue 값 (0-255)
  hex: string;  // Hex 색상 코드 (#RRGGBB)
}

/**
 * 얼굴 분석 결과
 */
export interface FaceAnalysis {
  detected: boolean;                  // 얼굴 감지 성공 여부
  faceShape: FaceShapeType | null;   // 얼굴형
  personalColor: PersonalColorType;   // 퍼스널 컬러
  confidence: number;                 // 분석 신뢰도 (0-1)
  landmarks?: FaceLandmark[];         // 468개 얼굴 랜드마크
  skinTone?: SkinTone;               // 피부톤 정보
  message?: string;                   // 에러 또는 상태 메시지
  analyzedAt?: string;               // 분석 시각 (ISO timestamp)
}

/**
 * 얼굴 분석 상태
 */
export type FaceAnalysisState = 
  | 'idle'          // 대기 중
  | 'detecting'     // 얼굴 감지 중 (랜드마크 추출)
  | 'analyzing'     // 분석 중 (얼굴형/퍼스널컬러)
  | 'complete'      // 완료
  | 'error';        // 오류

// ===== AI RECOMMENDATIONS SYSTEM =====

/**
 * 적합도 레벨 (3단계)
 */
export type SuitabilityLevel = 
  | 'excellent'  // ⭐⭐⭐ 매우 잘 어울림
  | 'good'       // ⭐⭐ 잘 어울림
  | 'fair';      // ⭐ 어울림

/**
 * 색상 온도 (염색용)
 */
export type ColorTemperature = 
  | 'warm'      // 웜톤
  | 'cool'      // 쿨톤
  | 'neutral';  // 중성톤

/**
 * 색상 명도 (염색용)
 */
export type ColorBrightness = 
  | 'light'     // 밝은 색
  | 'medium'    // 중간 톤
  | 'dark';     // 어두운 색

/**
 * 커트 스타일 AI 추천 정보
 */
export interface CutRecommendations {
  faceShapes: Array<{
    shape: FaceShapeType;
    suitability: SuitabilityLevel;
    reason?: string;  // 추천 이유 (선택사항)
  }>;
}

/**
 * 염색 스타일 AI 추천 정보
 */
export interface ColorRecommendations {
  personalColors: Array<{
    color: Exclude<PersonalColorType, null>;
    suitability: SuitabilityLevel;
    reason?: string;  // 추천 이유 (선택사항)
  }>;
  colorProperties?: {
    temperature: ColorTemperature;    // 색상 온도
    brightness: ColorBrightness;      // 명도
    vibrant?: boolean;                // 선명한 색상 여부
  };
}

/**
 * AI 추천 시스템 - 통합 인터페이스
 * 서비스 카테고리에 따라 cut 또는 color 정보를 포함
 */
export interface AIRecommendations {
  cut?: CutRecommendations;      // 커트 스타일일 때
  color?: ColorRecommendations;  // 염색 스타일일 때
  updatedAt?: string;            // 추천 정보 업데이트 시각
}

// ===== HAIRSTYLE & DESIGNER DATA TYPES =====

// Hairstyle data structure - Updated with AI recommendations
export interface Hairstyle {
  id?: string;                                          // Unique identifier
  name: string;                                         // Display name
  url: string;                                         // Image URL
  isLocal?: boolean;                                   // Whether it's a locally uploaded image
  gender?: Gender;                                     // Target gender
  
  // NEW: Service-based categorization (preferred)
  serviceCategory?: ServiceMajorCategory;              // Primary service categorization
  serviceSubCategory?: ServiceMinorCategory;           // Secondary service categorization (user input)
  
  // 🆕 AI 추천 시스템
  aiRecommendations?: AIRecommendations;               // AI-based recommendations
  
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
  type?: 'cut' | 'color';                             // 체험 타입
  faceAnalysis?: FaceAnalysis;                        // 얼굴 분석 정보 (선택사항)
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

// Form data types - Updated to support AI recommendations
export interface UploadStyleFormData {
  file: File;
  name: string;
  gender: Gender;
  
  // NEW: Service-based categories (preferred)
  serviceCategory?: ServiceMajorCategory;
  serviceSubCategory?: ServiceMinorCategory;
  
  // 🆕 AI 추천 정보
  aiRecommendations?: AIRecommendations;
  
  // LEGACY: For backward compatibility (deprecated)
  majorCategory?: FemaleMajorCategory | MaleMajorCategory;
  minorCategory?: MinorCategory;
  
  description?: string;
  tags?: string[];
}

// ===== UI COMPONENT PROP TYPES =====

export interface HairstyleGalleryProps {
  images: Hairstyle[];
  onSelect: (hairstyle: Hairstyle) => void;
  onColorTryOn?: (hairstyle: Hairstyle) => void;  // 🆕 염색 전용 핸들러 추가
  selectedUrl: string | null;
  disabled: boolean;
  onAddImage?: () => void;
  showCategories?: boolean;
  allowMultipleSelection?: boolean;
  faceAnalysis?: FaceAnalysis | null;  // 🆕 얼굴 분석 기반 필터링용
  // 🆕 DesignerView 전용 props
  onDeleteImage?: (imageUrl: string) => void;
  onEditImage?: (hairstyle: Hairstyle) => void;
  isDesignerView?: boolean;
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

/**
 * ColorTryOnModal Props (염색 체험 모달)
 */
export interface ColorTryOnModalProps {
  colorStyleImage: {
    name: string;
    url: string;
    serviceSubCategory?: string;
    description?: string;
  };
  userFaceFile?: File | null;
  userFacePreview?: string | null;
  faceAnalysis?: FaceAnalysis | null;  // 얼굴 분석 정보 추가
  onClose: () => void;
  onComplete: (result: any) => void;
}

/**
 * FaceAnalysisModal Props (얼굴 분석 모달)
 */
export interface FaceAnalysisModalProps {
  imageUrl: string;
  analysis: FaceAnalysis | null;
  isAnalyzing: boolean;
  onClose: () => void;
}

// Error handling types
export interface AppError {
  message: string;
  code?: string;
  timestamp: Date;
  stack?: string;
}

// ===== API REQUEST/RESPONSE TYPES =====

// VModel API types
export interface VModelRequest {
  faceImage: string;
  styleImage: string;
  styleDescription: string;
  faceShape?: FaceShapeType;  // 얼굴형 정보 추가
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

/**
 * 스타일 추천 정보
 */
export interface StyleRecommendation {
  faceShape: FaceShapeType;
  recommendedStyles: string[];
  avoidStyles: string[];
  description: string;
}

/**
 * 컬러 추천 정보
 */
export interface ColorRecommendation {
  personalColor: PersonalColorType;
  recommendedColors: string[];
  avoidColors: string[];
  description: string;
}

// ===== CONSTANTS =====

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

// ===== FACE ANALYSIS CONSTANTS =====

/**
 * 얼굴형 목록
 */
export const FACE_SHAPES: FaceShapeType[] = [
  '계란형',
  '둥근형',
  '각진형',
  '하트형',
  '긴 얼굴형',
  '다이아몬드형',
  '타원형'
];

/**
 * 퍼스널 컬러 목록
 */
export const PERSONAL_COLORS: Exclude<PersonalColorType, null>[] = [
  '봄 웜톤',
  '여름 쿨톤',
  '가을 웜톤',
  '겨울 쿨톤'
];

/**
 * 얼굴형별 추천 정보
 */
export const FACE_SHAPE_RECOMMENDATIONS: Record<string, StyleRecommendation> = {
  '계란형': {
    faceShape: '계란형',
    recommendedStyles: ['레이어드 컷', '단발', '긴 생머리', '웨이브', '모든 스타일'],
    avoidStyles: [],
    description: '균형잡힌 이상적인 얼굴형입니다. 대부분의 헤어스타일이 잘 어울립니다.'
  },
  '둥근형': {
    faceShape: '둥근형',
    recommendedStyles: ['레이어드 컷', '롱 웨이브', '앞머리 없는 스타일', '높이감 있는 스타일'],
    avoidStyles: ['짧은 단발', '일자 앞머리', '볼륨 없는 스타일'],
    description: '레이어드 컷으로 얼굴 라인을 살리고, 높이감 있는 스타일을 추천합니다.'
  },
  '각진형': {
    faceShape: '각진형',
    recommendedStyles: ['웨이브', '소프트 컬', '레이어드', '부드러운 앞머리'],
    avoidStyles: ['일직선 컷', '너무 짧은 스타일', '슬릭백'],
    description: '웨이브나 부드러운 컬로 각진 라인을 완화시켜보세요.'
  },
  '하트형': {
    faceShape: '하트형',
    recommendedStyles: ['미디엄 보브', '레이어드', '턱선 커버 스타일', '사이드 뱅'],
    avoidStyles: ['너무 짧은 스타일', '볼륨 있는 탑', '이마 전체 노출'],
    description: '턱선을 커버하는 미디엄 레이어드나 보브 스타일이 잘 어울립니다.'
  },
  '긴 얼굴형': {
    faceShape: '긴 얼굴형',
    recommendedStyles: ['옆 볼륨', '웨이브', '단발', '앞머리'],
    avoidStyles: ['생머리 롱', '탑 볼륨', '센터 가르마'],
    description: '옆 볼륨을 살린 스타일로 얼굴 비율의 균형을 맞춰보세요.'
  },
  '다이아몬드형': {
    faceShape: '다이아몬드형',
    recommendedStyles: ['사이드 뱅', '턱선 레이어', '웨이브', '볼륨 있는 스타일'],
    avoidStyles: ['센터 가르마', '슬릭백', '짧은 컷'],
    description: '이마와 턱선에 볼륨을 주는 스타일로 광대를 자연스럽게 커버하세요.'
  },
  '타원형': {
    faceShape: '타원형',
    recommendedStyles: ['레이어드', '보브', '웨이브', '다양한 스타일'],
    avoidStyles: [],
    description: '균형잡힌 얼굴형으로 다양한 스타일을 시도해보세요.'
  }
};

/**
 * 퍼스널 컬러별 추천 정보
 */
export const PERSONAL_COLOR_RECOMMENDATIONS: Record<string, ColorRecommendation> = {
  '봄 웜톤': {
    personalColor: '봄 웜톤',
    recommendedColors: ['코랄', '피치', '카라멜 브라운', '골드 블론드', '밝은 오렌지'],
    avoidColors: ['애쉬 그레이', '차가운 블랙', '실버', '플래티넘'],
    description: '코랄, 피치, 카라멜 브라운, 골드 블론드 등 밝고 따뜻한 색상이 잘 어울립니다.'
  },
  '여름 쿨톤': {
    personalColor: '여름 쿨톤',
    recommendedColors: ['애쉬 브라운', '라벤더', '로즈 골드', '실버 그레이', '소프트 블랙'],
    avoidColors: ['오렌지', '골드', '따뜻한 브라운', '구리빛'],
    description: '애쉬 브라운, 라벤더, 로즈 골드, 실버 그레이 등 부드러운 쿨톤이 어울립니다.'
  },
  '가을 웜톤': {
    personalColor: '가을 웜톤',
    recommendedColors: ['오렌지 브라운', '구리빛', '올리브', '따뜻한 레드', '딥 브라운'],
    avoidColors: ['애쉬 톤', '실버', '차가운 블랙', '플래티넘'],
    description: '오렌지 브라운, 구리빛, 올리브, 따뜻한 레드 계열이 피부톤과 조화롭습니다.'
  },
  '겨울 쿨톤': {
    personalColor: '겨울 쿨톤',
    recommendedColors: ['젯 블랙', '플래티넘 블론드', '와인 레드', '블루 블랙', '실버'],
    avoidColors: ['오렌지', '골드', '따뜻한 브라운', '피치'],
    description: '젯 블랙, 플래티넘 블론드, 와인 레드, 블루 블랙 등 선명한 색상을 추천합니다.'
  }
};

// ===== AI RECOMMENDATIONS CONSTANTS =====

/**
 * 적합도 레벨 표시 (별 개수)
 */
export const SUITABILITY_STARS: Record<SuitabilityLevel, string> = {
  excellent: '⭐⭐⭐',
  good: '⭐⭐',
  fair: '⭐'
};

/**
 * 적합도 레벨 라벨
 */
export const SUITABILITY_LABELS: Record<SuitabilityLevel, string> = {
  excellent: '매우 잘 어울림',
  good: '잘 어울림',
  fair: '어울림'
};

/**
 * 색상 온도 라벨
 */
export const COLOR_TEMPERATURE_LABELS: Record<ColorTemperature, string> = {
  warm: '웜톤',
  cool: '쿨톤',
  neutral: '중성톤'
};

/**
 * 색상 명도 라벨
 */
export const COLOR_BRIGHTNESS_LABELS: Record<ColorBrightness, string> = {
  light: '밝은 톤',
  medium: '중간 톤',
  dark: '어두운 톤'
};

// ===== UTILITY FUNCTIONS =====

/**
 * 얼굴형에 맞는 헤어스타일인지 확인
 */
export const isSuitableForFaceShape = (
  hairstyle: Hairstyle, 
  faceShape: FaceShapeType | null,
  minLevel: SuitabilityLevel = 'fair'
): boolean => {
  if (!faceShape || !hairstyle.aiRecommendations?.cut) return false;
  
  const recommendation = hairstyle.aiRecommendations.cut.faceShapes.find(
    fs => fs.shape === faceShape
  );
  
  if (!recommendation) return false;
  
  const levels: SuitabilityLevel[] = ['fair', 'good', 'excellent'];
  const minIndex = levels.indexOf(minLevel);
  const recIndex = levels.indexOf(recommendation.suitability);
  
  return recIndex >= minIndex;
};

/**
 * 퍼스널 컬러에 맞는 염색 스타일인지 확인
 */
export const isSuitableForPersonalColor = (
  hairstyle: Hairstyle,
  personalColor: PersonalColorType,
  minLevel: SuitabilityLevel = 'fair'
): boolean => {
  if (!personalColor || !hairstyle.aiRecommendations?.color) return false;
  
  const recommendation = hairstyle.aiRecommendations.color.personalColors.find(
    pc => pc.color === personalColor
  );
  
  if (!recommendation) return false;
  
  const levels: SuitabilityLevel[] = ['fair', 'good', 'excellent'];
  const minIndex = levels.indexOf(minLevel);
  const recIndex = levels.indexOf(recommendation.suitability);
  
  return recIndex >= minIndex;
};

/**
 * 헤어스타일의 추천 점수 계산
 */
export const getRecommendationScore = (
  hairstyle: Hairstyle,
  faceAnalysis: FaceAnalysis | null
): number => {
  if (!faceAnalysis) return 0;
  
  let score = 0;
  
  // 커트 스타일 점수
  if (hairstyle.serviceCategory === 'cut' && faceAnalysis.faceShape) {
    const cutRec = hairstyle.aiRecommendations?.cut?.faceShapes.find(
      fs => fs.shape === faceAnalysis.faceShape
    );
    if (cutRec) {
      switch (cutRec.suitability) {
        case 'excellent': score += 3; break;
        case 'good': score += 2; break;
        case 'fair': score += 1; break;
      }
    }
  }
  
  // 염색 스타일 점수
  if (hairstyle.serviceCategory === 'color' && faceAnalysis.personalColor) {
    const colorRec = hairstyle.aiRecommendations?.color?.personalColors.find(
      pc => pc.color === faceAnalysis.personalColor
    );
    if (colorRec) {
      switch (colorRec.suitability) {
        case 'excellent': score += 3; break;
        case 'good': score += 2; break;
        case 'fair': score += 1; break;
      }
    }
  }
  
  return score;
};

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
  SETTINGS: 'hairfolio_settings',
  FACE_ANALYSIS: 'hairfolio_face_analysis'
} as const;

// API endpoints and configuration
export const API_CONFIG = {
  VMODEL_BASE_URL: 'https://api.vmodel.ai',
  QR_CODE_API: 'https://api.qrserver.com/v1/create-qr-code/',
  MAX_FILE_SIZE: 10, // MB
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  REQUEST_TIMEOUT: 30000, // 30 seconds
  MEDIAPIPE_MODEL_URL: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh'
} as const;
