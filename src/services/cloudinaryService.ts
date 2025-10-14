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

  // 디버깅을 위한 로그 (임시)
  console.log('Cloudinary Config Debug:', { 
    cloudName: cloudName || 'NOT_SET', 
    uploadPreset: uploadPreset || 'NOT_SET',
    allEnvVars: import.meta.env
  });

  if (!cloudName || !uploadPreset) {
    throw new Error(
      'Cloudinary 설정이 누락되었습니다. 네트리파이 환경변수에 VITE_CLOUDINARY_CLOUD_NAME과 VITE_CLOUDINARY_UPLOAD_PRESET를 추가하세요.'
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
    console.log('업로드 시작:', { fileName: file.name, size: file.size, config });
    
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

    const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;
    console.log('업로드 URL:', uploadUrl);

    // Cloudinary API 호출
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    console.log('Cloudinary 응답:', { 
      status: response.status, 
      statusText: response.statusText,
      ok: response.ok 
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
        console.error('Cloudinary 에러 상세:', errorData);
      } catch (parseError) {
        console.error('에러 응답 파싱 실패:', parseError);
      }
      throw new Error(`업로드 실패 (${response.status}): ${errorMessage}`);
    }

    const result: CloudinaryUploadResponse = await response.json();
    console.log('업로드 성공:', { public_id: result.public_id, secure_url: result.secure_url });
    
    // 최적화된 URL 반환 (자동 포맷, 품질 최적화, 크기 조정)
    const optimizedUrl = result.secure_url.replace(
      '/upload/',
      '/upload/f_auto,q_auto,w_800,h_800,c_fill,g_face/'
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
    console.log('진행률 추적 업로드 시작:', { fileName: file.name, config });
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', config.uploadPreset);
    
    if (options?.folder) {
      formData.append('folder', options.folder);
    }
    
    if (options?.tags && options.tags.length > 0) {
      formData.append('tags', options.tags.join(','));
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;

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
            console.log('XHR 업로드 성공:', { public_id: result.public_id });
            
            // 최적화된 URL 반환 (얼굴 중심 크롭)
            const optimizedUrl = result.secure_url.replace(
              '/upload/',
              '/upload/f_auto,q_auto,w_800,h_800,c_fill,g_face/'
            );
            resolve(optimizedUrl);
          } catch (parseError) {
            console.error('응답 파싱 에러:', parseError);
            reject(new Error('서버 응답을 파싱할 수 없습니다.'));
          }
        } else {
          console.error('XHR 업로드 실패:', { status: xhr.status, statusText: xhr.statusText });
          
          let errorMessage = xhr.statusText;
          try {
            const errorData = JSON.parse(xhr.responseText);
            errorMessage = errorData.error?.message || errorMessage;
          } catch (parseError) {
            // 파싱 실패시 기본 메시지 사용
          }
          
          reject(new Error(`업로드 실패 (${xhr.status}): ${errorMessage}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        console.error('XHR 네트워크 에러');
        reject(new Error('네트워크 오류가 발생했습니다.'));
      });
      
      xhr.addEventListener('timeout', () => {
        console.error('XHR 타임아웃');
        reject(new Error('업로드 시간이 초과되었습니다.'));
      });
      
      xhr.timeout = 60000; // 60초 타임아웃
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
    
  } catch (error) {
    console.error('uploadWithProgress 에러:', error);
    throw error;
  }
};

// 이미지 URL에서 Cloudinary public_id 추출
export const getPublicIdFromUrl = (cloudinaryUrl: string): string | null => {
  try {
    // Cloudinary URL 패턴 매칭
    const patterns = [
      /\/v\d+\/(.+?)(?:\.|$)/, // 기본 패턴
      /\/upload\/[^/]+\/(.+?)(?:\.|$)/, // 변환이 포함된 패턴
    ];
    
    for (const pattern of patterns) {
      const matches = cloudinaryUrl.match(pattern);
      if (matches && matches[1]) {
        return matches[1];
      }
    }
    
    return null;
  } catch {
    return null;
  }
};

// Cloudinary 이미지 삭제 (서버 사이드 API가 필요하므로 클라이언트에서는 비활성화)
export const deleteFromCloudinary = async (publicId: string): Promise<boolean> => {
  console.warn('클라이언트에서 직접 삭제할 수 없습니다. 서버 API가 필요합니다.');
  // 실제 구현시에는 백엔드 API를 통해 삭제해야 함
  // DELETE API는 API Secret이 필요하므로 보안상 서버에서 처리해야 함
  return false;
};

// Blob URL을 Cloudinary에 업로드하는 함수
export const uploadBlobToCloudinary = async (
  blobUrl: string,
  fileName: string = 'trial-result'
): Promise<string> => {
  try {
    console.log('Blob URL을 Cloudinary에 업로드 시작:', blobUrl);
    
    // Blob URL을 File 객체로 변환
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    const file = new File([blob], `${fileName}-${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    // Cloudinary에 업로드
    const result = await uploadToCloudinary(file, {
      folder: 'trial-results',
      public_id: `trial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      transformation: [
        { width: 800, height: 800, crop: 'limit', quality: 'auto:good' }
      ]
    });
    
    console.log('✅ Blob URL이 Cloudinary에 성공적으로 업로드됨:', result.secure_url);
    
    // 원본 blob URL 정리
    URL.revokeObjectURL(blobUrl);
    
    return result.secure_url;
    
  } catch (error) {
    console.error('❌ Blob URL 업로드 실패:', error);
    throw new Error('이미지 저장에 실패했습니다.');
  }
};

// 이미지 변환 URL 생성 헬퍼
export const getTransformedUrl = (
  originalUrl: string,
  transformations: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb' | 'pad';
    gravity?: 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
    quality?: 'auto' | number;
    format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif';
    effects?: string[]; // 예: ['blur:300', 'brightness:50']
  }
): string => {
  try {
    let transformString = '';
    
    if (transformations.width) transformString += `w_${transformations.width},`;
    if (transformations.height) transformString += `h_${transformations.height},`;
    if (transformations.crop) transformString += `c_${transformations.crop},`;
    if (transformations.gravity) transformString += `g_${transformations.gravity},`;
    if (transformations.quality) transformString += `q_${transformations.quality},`;
    if (transformations.format) transformString += `f_${transformations.format},`;
    
    // 특수 효과 적용
    if (transformations.effects && transformations.effects.length > 0) {
      transformString += `e_${transformations.effects.join(':')},`;
    }
    
    // 마지막 쉼표 제거
    transformString = transformString.replace(/,$/, '');
    
    if (!transformString) {
      return originalUrl;
    }
    
    return originalUrl.replace('/upload/', `/upload/${transformString}/`);
  } catch {
    return originalUrl;
  }
};

// 업로드 가능한 파일 유형 체크
export const isValidImageFile = (file: File): boolean => {
  const validTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp',
    'image/avif', // 차세대 포맷 지원
    'image/heic', // iOS 기본 포맷 지원
  ];
  return validTypes.includes(file.type);
};

// 파일 크기 체크 (기본 10MB)
export const isValidFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// 이미지 미리보기 생성
export const createImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!isValidImageFile(file)) {
      reject(new Error('지원되지 않는 이미지 형식입니다.'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => {
      reject(new Error('이미지 미리보기 생성에 실패했습니다.'));
    };
    reader.readAsDataURL(file);
  });
};

// Cloudinary 상태 체크
export const checkCloudinaryStatus = async (): Promise<boolean> => {
  try {
    const config = getCloudinaryConfig();
    // Cloudinary API 상태 확인 (간단한 ping)
    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/list`, {
      method: 'GET',
    });
    return response.status !== 404; // 404가 아니면 정상
  } catch {
    return false;
  }
};

// 업로드 설정 검증
export const validateUploadConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  try {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || cloudName === 'your_cloud_name_here') {
      errors.push('VITE_CLOUDINARY_CLOUD_NAME이 설정되지 않았습니다.');
    }
    
    if (!uploadPreset || uploadPreset === 'your_upload_preset_here') {
      errors.push('VITE_CLOUDINARY_UPLOAD_PRESET이 설정되지 않았습니다.');
    }
    
    return { isValid: errors.length === 0, errors };
  } catch {
    errors.push('환경변수 접근 중 오류가 발생했습니다.');
    return { isValid: false, errors };
  }
};
