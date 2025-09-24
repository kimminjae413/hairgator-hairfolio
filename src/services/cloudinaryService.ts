// Cloudinary 업로드 서비스
interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  access_mode: string;
  original_filename: string;
}

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

// Cloudinary 설정 - 환경변수에서 가져오기
const getCloudinaryConfig = (): CloudinaryConfig => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary 설정이 누락되었습니다. .env.local에 VITE_CLOUDINARY_CLOUD_NAME과 VITE_CLOUDINARY_UPLOAD_PRESET를 추가하세요.'
    );
  }

  return { cloudName, uploadPreset };
};

// 이미지를 Cloudinary에 업로드
export const uploadToCloudinary = async (
  file: File,
  options?: {
    folder?: string;
    tags?: string[];
    transformation?: string;
  }
): Promise<string> => {
  try {
    const config = getCloudinaryConfig();
    
    // FormData 생성
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);
    
    // 선택적 파라미터 추가
    if (options?.folder) {
      formData.append('folder', options.folder);
    }
    
    if (options?.tags && options.tags.length > 0) {
      formData.append('tags', options.tags.join(','));
    }

    // Cloudinary API 호출
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`업로드 실패: ${errorData.error?.message || response.statusText}`);
    }

    const result: CloudinaryUploadResponse = await response.json();
    
    // 최적화된 URL 반환 (자동 포맷, 품질 최적화)
    const optimizedUrl = result.secure_url.replace(
      '/upload/',
      '/upload/f_auto,q_auto,w_800,h_800,c_fill/'
    );
    
    return optimizedUrl;
    
  } catch (error) {
    console.error('Cloudinary 업로드 에러:', error);
    
    if (error instanceof Error) {
      throw new Error(`이미지 업로드 실패: ${error.message}`);
    }
    
    throw new Error('이미지 업로드 중 알 수 없는 오류가 발생했습니다.');
  }
};

// 업로드 진행 상황을 추적하는 고급 업로드 함수
export const uploadWithProgress = async (
  file: File,
  onProgress?: (progress: number) => void,
  options?: {
    folder?: string;
    tags?: string[];
  }
): Promise<string> => {
  try {
    const config = getCloudinaryConfig();
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);
    
    if (options?.folder) {
      formData.append('folder', options.folder);
    }
    
    if (options?.tags && options.tags.length > 0) {
      formData.append('tags', options.tags.join(','));
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // 진행 상황 추적
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          try {
            const result: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
            const optimizedUrl = result.secure_url.replace(
              '/upload/',
              '/upload/f_auto,q_auto,w_800,h_800,c_fill/'
            );
            resolve(optimizedUrl);
          } catch (parseError) {
            reject(new Error('서버 응답을 파싱할 수 없습니다.'));
          }
        } else {
          reject(new Error(`업로드 실패: ${xhr.statusText}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류가 발생했습니다.'));
      });
      
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`);
      xhr.send(formData);
    });
    
  } catch (error) {
    console.error('Cloudinary 업로드 에러:', error);
    throw error;
  }
};

// 이미지 URL에서 Cloudinary public_id 추출
export const getPublicIdFromUrl = (cloudinaryUrl: string): string | null => {
  try {
    const matches = cloudinaryUrl.match(/\/v\d+\/(.+)\./);
    return matches ? matches[1] : null;
  } catch {
    return null;
  }
};

// Cloudinary 이미지 삭제 (서버 사이드 API가 필요하므로 클라이언트에서는 비활성화)
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  console.warn('클라이언트에서 직접 삭제할 수 없습니다. 서버 API가 필요합니다.');
  // 실제 구현시에는 백엔드 API를 통해 삭제해야 함
  return false;
};

// 이미지 변환 URL 생성 헬퍼
export const getTransformedUrl = (
  originalUrl: string,
  transformations: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop';
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp';
  }
): string => {
  try {
    let transformString = '';
    
    if (transformations.width) transformString += `w_${transformations.width},`;
    if (transformations.height) transformString += `h_${transformations.height},`;
    if (transformations.crop) transformString += `c_${transformations.crop},`;
    if (transformations.quality) transformString += `q_${transformations.quality},`;
    if (transformations.format) transformString += `f_${transformations.format},`;
    
    // 마지막 쉼표 제거
    transformString = transformString.replace(/,$/, '');
    
    return originalUrl.replace('/upload/', `/upload/${transformString}/`);
  } catch {
    return originalUrl;
  }
};

// 업로드 가능한 파일 유형 체크
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
};

// 파일 크기 체크 (기본 10MB)
export const isValidFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};
