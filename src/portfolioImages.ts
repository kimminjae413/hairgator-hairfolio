import { Hairstyle } from './types';

// Default portfolio images for sample designer
// These are publicly available hairstyle images from various sources
export const portfolioImages: Hairstyle[] = [
  // Female Hairstyles
  {
    name: '웨이브 보브',
    url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400&h=400&fit=crop&crop=faces',
    isLocal: false,
    gender: 'Female',
    majorCategory: 'B length',
    minorCategory: 'Cheekbone',
    description: '자연스러운 웨이브가 매력적인 보브 스타일',
    tags: ['웨이브', '보브', '자연스러운', '세련된']
  },
  {
    name: '롱 스트레이트',
    url: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&h=400&fit=crop&crop=faces',
    isLocal: false,
    gender: 'Female',
    majorCategory: 'G length',
    minorCategory: 'None',
    description: '깔끔하고 우아한 긴 생머리 스타일',
    tags: ['롱헤어', '스트레이트', '깔끔한', '우아한']
  },
  {
    name: '픽시 컷',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=faces',
    isLocal: false,
    gender: 'Female',
    majorCategory: 'A length',
    minorCategory: 'Eyebrow',
    description: '시원하고 개성 있는 짧은 픽시 컷',
    tags: ['픽시컷', '짧은머리', '개성적', '시원한']
  },
  {
    name: '컬리 미디움',
    url: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=400&h=400&fit=crop&crop=faces',
    isLocal: false,
    gender: 'Female',
    majorCategory: 'D length',
    minorCategory: 'None',
    description: '볼륨감 있는 자연스러운 컬',
    tags: ['컬', '미디움', '볼륨', '자연스러운']
  },
  {
    name: '레이어드 뱅',
    url: 'https://images.unsplash.com/photo-1512980286356-53c5a05047ad?w=400&h=400&fit=crop&crop=faces',
    isLocal: false,
    gender: 'Female',
    majorCategory: 'C length',
    minorCategory: 'Eye',
    description: '세련된 레이어드 컷과 앞머리',
    tags: ['레이어드', '앞머리', '세련된', '모던']
  },
  {
    name: '하프업 웨이브',
    url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=400&h=400&fit=crop&crop=faces',
    isLocal: false,
    gender: 'Female',
    majorCategory: 'E length',
    minorCategory: 'Cheekbone',
    description: '로맨틱한 하프업 웨이브 스타일',
    tags: ['하프업', '웨이브', '로맨틱', '페미닌']
  },
  
  // Male Hairstyles
  {
    name: '클래식 사이드파트',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces',
    isLocal: false,
    gender: 'Male',
    majorCategory: 'SIDE PART',
    minorCategory: 'Forehead',
    description: '깔끔하고 클래식한 사이드 파트',
    tags: ['사이드파트', '클래식', '깔끔한', '비즈니스']
  },
  {
    name: '모던 크롭',
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=faces',
    isLocal: false,
    gender: 'Male',
    majorCategory: 'CROP',
    minorCategory: 'None',
    description: '트렌디한 텍스처드 크롭 컷',
    tags: ['크롭', '텍스처', '트렌디', '모던']
  },
  {
    name: '슬릭백',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=faces',
    isLocal: false,
    gender: 'Male',
    majorCategory: 'PUSHED BACK',
    minorCategory: 'Forehead',
    description: '세련된 올백 스타일',
    tags: ['올백', '슬릭', '세련된', '엘레간트']
  },
  {
    name: '사이드 프린지',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=faces',
    isLocal: false,
    gender: 'Male',
    majorCategory: 'SIDE FRINGE',
    minorCategory: 'Eye',
    description: '자연스러운 사이드 프린지',
    tags: ['사이드', '프린지', '자연스러운', '캐주얼']
  },
  {
    name: '버즈 컷',
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=faces',
    isLocal: false,
    gender: 'Male',
    majorCategory: 'BUZZ',
    minorCategory: 'None',
    description: '깔끔한 버즈 컷',
    tags: ['버즈컷', '짧은머리', '깔끔한', '실용적']
  },
  {
    name: '페이드 모히칸',
    url: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop&crop=faces',
    isLocal: false,
    gender: 'Male',
    majorCategory: 'MOHICAN',
    minorCategory: 'None',
    description: '개성 있는 페이드 모히칸 스타일',
    tags: ['모히칸', '페이드', '개성적', '독특한']
  }
];

// Function to get random sample images for new designers
export const getRandomSampleImages = (count: number = 6): Hairstyle[] => {
  const shuffled = [...portfolioImages].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Function to get images by gender
export const getImagesByGender = (gender: Gender): Hairstyle[] => {
  return portfolioImages.filter(image => image.gender === gender);
};

// Function to get images by category
export const getImagesByCategory = (
  gender: Gender,
  majorCategory: string
): Hairstyle[] => {
  return portfolioImages.filter(
    image => image.gender === gender && image.majorCategory === majorCategory
  );
};

// Function to search images by tags
export const searchImagesByTags = (searchTerm: string): Hairstyle[] => {
  const lowercaseSearch = searchTerm.toLowerCase();
  return portfolioImages.filter(image => 
    image.name.toLowerCase().includes(lowercaseSearch) ||
    image.description?.toLowerCase().includes(lowercaseSearch) ||
    image.tags?.some(tag => tag.toLowerCase().includes(lowercaseSearch))
  );
};
